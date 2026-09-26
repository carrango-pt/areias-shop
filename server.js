/* Areias – Web-Server: liefert die statische Seite UND erstellt Stripe-Checkout-Sessions.
   Preise stammen ausschließlich aus assets/catalog.js (serverseitig, nie aus dem Browser). */
const path = require('path');
const express = require('express');
const CATALOG = require('./assets/catalog.js');

const app = express();
const PORT = process.env.PORT || 4599;
const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

// Hinter Render/Proxy: korrekte Client-IP (für Rate-Limit) und https-Erkennung.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Sicherheits-Header (gelten nur für den echten Node-Betrieb; das statische
// Artifact ist davon nicht betroffen). Schützt vor Clickjacking, MIME-Sniffing usw.
app.use(function (_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; " +
    "img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; form-action 'self'");
  next();
});

// Backend-Dateien / Abhängigkeiten NICHT ausliefern (Quellcode-Schutz).
const BLOCKED = [
  /^\/node_modules(\/|$)/i, /^\/server\.js$/i, /^\/_serve\.js$/i,
  /^\/package(-lock)?\.json$/i, /^\/render\.ya?ml$/i, /^\/readme\.md$/i
];
app.use(function (req, res, next) {
  if (BLOCKED.some(function (re) { return re.test(req.path); })) return res.status(404).end();
  next();
});

// Body klein halten (DoS-Schutz); der Chat kürzt zusätzlich pro Nachricht.
app.use(express.json({ limit: '32kb' }));

// Einfaches In-Memory-Rate-Limit pro IP (kein Zusatz-Paket nötig).
function rateLimit(max, windowMs) {
  const hits = new Map();
  setInterval(function () {
    const now = Date.now();
    hits.forEach(function (v, k) { if (now > v.reset) hits.delete(k); });
  }, windowMs).unref();
  return function (req, res, next) {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    let e = hits.get(ip);
    if (!e || now > e.reset) { e = { count: 0, reset: now + windowMs }; hits.set(ip, e); }
    e.count++;
    if (e.count > max) {
      res.setHeader('Retry-After', Math.ceil((e.reset - now) / 1000));
      return res.status(429).json({ error: 'rate_limited' });
    }
    next();
  };
}

app.post('/api/checkout', rateLimit(40, 5 * 60 * 1000), async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured (STRIPE_SECRET_KEY missing)' });
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length) return res.status(400).json({ error: 'empty cart' });

    let subtotal = 0;
    const line_items = items.map(function (it) {
      const p = CATALOG.products[it.id];
      if (!p) throw new Error('unknown product: ' + it.id);
      let qty = parseInt(it.qty, 10) || 1;
      qty = Math.max(1, Math.min(99, qty));
      subtotal += p.price * qty;
      return {
        quantity: qty,
        price_data: {
          currency: CATALOG.currency,
          unit_amount: p.price, // Cent, verbindlich vom Server
          product_data: { name: p.name }
        }
      };
    });

    // Versandarten: ab Schwellenwert kostenlos, sonst die konfigurierten Sätze
    function rate(label, amount, min, max) {
      return {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: amount, currency: CATALOG.currency },
          display_name: label,
          delivery_estimate: {
            minimum: { unit: 'business_day', value: min },
            maximum: { unit: 'business_day', value: max }
          }
        }
      };
    }
    const freeOn = CATALOG.freeShippingThreshold > 0 && subtotal >= CATALOG.freeShippingThreshold;
    const shipping_options = freeOn
      ? [rate('Standard – kostenlos', 0, 2, 8)]
      : (CATALOG.shipping || []).map(function (s) { return rate(s.label, s.amount, s.min, s.max); });

    const origin = req.headers.origin || (req.protocol + '://' + req.get('host'));
    const lang = req.body.lang;
    const langPath = lang === 'pt' ? '/pt/' : (lang === 'en' ? '/en/' : '/');
    const locale = lang === 'pt' ? 'pt' : (lang === 'en' ? 'en' : 'de');

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: line_items,
      locale: locale,
      billing_address_collection: 'auto',
      phone_number_collection: { enabled: true },
      shipping_address_collection: { allowed_countries: CATALOG.allowedCountries },
      shipping_options: shipping_options,
      success_url: origin + langPath + '?checkout=success',
      cancel_url: origin + langPath + '?checkout=cancel'
      // Optional später: automatic_tax (benötigt Stripe Tax), Rabatt-Codes (allow_promotion_codes) …
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error('checkout error:', e.message);   // Details nur im Server-Log
    res.status(400).json({ error: 'checkout_failed' });
  }
});

/* ---------- KI-Berater (Produktberatung + FAQ) ----------
   Erdet Claude auf den echten Katalog + unsere Richtlinien. Der API-Schlüssel
   (ANTHROPIC_API_KEY) liegt NUR serverseitig – nie im Browser. Ohne Schlüssel
   antwortet der Endpunkt mit 503 + freundlichem Hinweis (wie beim Checkout). */
const AI_KEY = process.env.ANTHROPIC_API_KEY || '';
const AI_MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

// Kompakte Produktliste als Wissensbasis (einmal beim Start gebaut).
const CATALOG_TEXT = (CATALOG.order || Object.keys(CATALOG.products))
  .map(function (id) {
    const p = CATALOG.products[id];
    if (!p) return null;
    return id + ' | ' + p.name + ' | ' + p.cat + '/' + p.mat + ' | ' + (p.price / 100).toFixed(0) + ' €';
  })
  .filter(Boolean)
  .join('\n');

const POLICIES = [
  'MARKE: Areias – kuratierter Schmuck aus der Algarve (ausgewählte Stücke, kein Eigenatelier).',
  'MATERIALIEN: Silber 925, Silber vergoldet, Gold (333/585 je nach Artikel), Edelstahl.',
  'VERSAND: Portugal 4 €, 3–6 Werktage · übrige EU 9 €, 6–10 Werktage · kostenlos ab 150 €. Lieferländer: PT, DE, AT, ES, FR, IT, NL, BE, LU, IE. Versand mit CTT.',
  'RÜCKGABE: 14 Tage Widerrufsrecht ab Erhalt. Rücksendekosten trägt der Kunde. Erstattung innerhalb von 14 Tagen. Details unter „Versand & Rückgabe".',
  'RINGGRÖSSEN: eigene Ringgrößen-Seite mit Mess-Anleitung und Tabelle (EU/US/UK).',
  'PFLEGE: eigene Pflegehinweise-Seite je Material.',
  'KONTAKT: iracemasiqueira83@gmail.com, Antwort in 1–2 Werktagen.'
].join('\n');

function systemPrompt(lang) {
  const langName = lang === 'pt' ? 'Portugiesisch (Portugal)' : (lang === 'en' ? 'Englisch' : 'Deutsch');
  return (
    'Du bist die freundliche Beraterin von Areias, einem Online-Schmuckshop aus der Algarve. ' +
    'Du hilfst bei der Auswahl von Schmuck (Geschenke, Anlass, Stil, Material, Budget) und beantwortest Fragen zu Versand, Rückgabe, Pflege und Größen.\n\n' +
    'STRIKTE REGELN:\n' +
    '- Empfiehl NUR Produkte aus der Produktliste unten. Erfinde keine Artikel, Preise oder Eigenschaften.\n' +
    '- Nenne Preise nur exakt wie in der Liste. Bist du unsicher, sag es ehrlich und verweise auf ' + 'iracemasiqueira83@gmail.com.\n' +
    '- Gib KEINE verbindliche Rechts-, Steuer- oder Finanzberatung.\n' +
    '- Frag bei Bedarf kurz nach (Budget, für wen, Anlass, Material), aber halte dich knapp und herzlich.\n' +
    '- Antworte IMMER auf ' + langName + ', in 1–4 kurzen Sätzen.\n' +
    '- Wenn du konkrete Stücke empfiehlst, hänge als ALLERLETZTE Zeile genau dieses Format an (max. 4 IDs, nur IDs aus der Liste): [[PRODUCTS: id1, id2]]. Ohne Empfehlung lässt du die Zeile weg.\n\n' +
    'RICHTLINIEN:\n' + POLICIES + '\n\n' +
    'PRODUKTLISTE (id | Name | Kategorie/Material | Preis):\n' + CATALOG_TEXT
  );
}

app.post('/api/chat', rateLimit(15, 5 * 60 * 1000), async function (req, res) {
  if (!AI_KEY) return res.status(503).json({ error: 'no_key', reply: null });
  try {
    const lang = req.body.lang === 'pt' ? 'pt' : (req.body.lang === 'en' ? 'en' : 'de');
    let msgs = Array.isArray(req.body.messages) ? req.body.messages : [];
    // Nur einfache, gültige Nachrichten; Verlauf begrenzen (Kosten/Sicherheit).
    msgs = msgs
      .filter(function (m) { return m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'; })
      .slice(-10)
      .map(function (m) { return { role: m.role, content: String(m.content).slice(0, 2000) }; });
    if (!msgs.length || msgs[msgs.length - 1].role !== 'user') {
      return res.status(400).json({ error: 'no_user_message' });
    }

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': AI_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 500,
        // Großer System-Block wird zwischengespeichert → Folgefragen günstig.
        system: [{ type: 'text', text: systemPrompt(lang), cache_control: { type: 'ephemeral' } }],
        messages: msgs
      })
    });
    if (!r.ok) {
      const t = await r.text();
      console.error('anthropic error', r.status, t.slice(0, 300));  // nur Server-Log
      return res.status(502).json({ error: 'upstream' });
    }
    const data = await r.json();
    const text = (data.content || []).map(function (b) { return b.text || ''; }).join('').trim();

    // Produkt-IDs aus der Markierung ziehen und gegen den Katalog prüfen.
    let products = [];
    let reply = text;
    const m = text.match(/\[\[PRODUCTS:\s*([^\]]+)\]\]\s*$/i);
    if (m) {
      reply = text.slice(0, m.index).trim();
      products = m[1].split(',').map(function (s) { return s.trim(); })
        .filter(function (id) { return CATALOG.products[id]; })
        .slice(0, 4)
        .map(function (id) {
          const p = CATALOG.products[id];
          const l = (p.i18n && p.i18n[lang]) || { name: p.name };
          return { id: id, name: l.name, price: p.price, img: p.img };
        });
    }
    res.json({ reply: reply, products: products });
  } catch (e) {
    console.error('chat error:', e.message);   // Details nur im Server-Log
    res.status(500).json({ error: 'server_error' });
  }
});

app.get('/api/health', function (_req, res) {
  res.json({ ok: true, stripe: !!stripe, ai: !!AI_KEY, products: Object.keys(CATALOG.products).length });
});

app.use(express.static(__dirname, { extensions: ['html'], dotfiles: 'deny' }));

app.listen(PORT, function () {
  console.log('Areias läuft auf http://localhost:' + PORT + '  (Stripe: ' + (stripe ? 'aktiv' : 'nicht konfiguriert') + ')');
});
