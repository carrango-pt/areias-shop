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

// Bestell-Benachrichtigung (Stripe-Webhook → E-Mail via Brevo)
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const BREVO_KEY = process.env.BREVO_API_KEY || '';
const ORDER_EMAIL = process.env.ORDER_EMAIL || 'iracemasiqueira83@gmail.com';   // Empfänger
const ORDER_FROM = process.env.ORDER_FROM_EMAIL || ORDER_EMAIL;                  // Absender (in Brevo verifiziert)

// Admin-Seite
const crypto = require('crypto');
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';   // in Render setzen; leer = Admin deaktiviert
// Besucherzähler: dauerhaft via Upstash Redis (REST) falls konfiguriert, sonst im Speicher.
const stats = { pageviews: 0, today: 0, todayKey: '', ips: new Set() };
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || '';
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';
function ipHash(ip) { return crypto.createHash('sha256').update(String(ip || '') + '|areias').digest('hex').slice(0, 24); }
async function redisPipe(cmds) {
  const r = await fetch(UPSTASH_URL.replace(/\/$/, '') + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + UPSTASH_TOKEN, 'content-type': 'application/json' },
    body: JSON.stringify(cmds)
  });
  if (!r.ok) throw new Error('redis ' + r.status);
  return r.json(); // Array von {result}
}

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

/* Stripe-Webhook: bei jeder bezahlten Bestellung eine Übersicht per E-Mail an den Shop.
   MUSS vor express.json stehen – die Signaturprüfung braucht den unveränderten Rohtext. */
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async function (req, res) {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) return res.status(200).json({ skipped: true });
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error('webhook signature error:', e.message);
    return res.status(400).send('bad signature');
  }
  res.json({ received: true }); // Stripe sofort bestätigen
  if (event.type !== 'checkout.session.completed') return;
  try {
    const s = await stripe.checkout.sessions.retrieve(event.data.object.id, { expand: ['line_items'] });
    await sendOrderEmail(s);
  } catch (e) {
    console.error('order email error:', e.message);
  }
});

function esc(x) {
  return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}
async function sendOrderEmail(s) {
  if (!BREVO_KEY) { console.log('Bestellung', s.id, '– kein BREVO_API_KEY, keine E-Mail gesendet'); return; }
  const cur = (s.currency || 'eur').toUpperCase();
  const money = function (c) { return (Number(c || 0) / 100).toFixed(2).replace('.', ',') + ' ' + cur; };
  const items = (s.line_items && s.line_items.data) || [];
  const cust = s.customer_details || {};
  const ship = s.shipping_details || (s.collected_information && s.collected_information.shipping_details) || {};
  const addr = ship.address || cust.address || {};
  const rows = items.map(function (li) {
    return '<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">' + (li.quantity || 1) + '×</td>' +
      '<td style="padding:6px 10px;border-bottom:1px solid #eee">' + esc(li.description || '') + '</td>' +
      '<td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">' + money(li.amount_total) + '</td></tr>';
  }).join('');
  const addrLines = [ship.name || cust.name || '', addr.line1 || '', addr.line2 || '',
    ((addr.postal_code || '') + ' ' + (addr.city || '')).trim(), addr.country || '']
    .filter(Boolean).map(esc).join('<br>');
  const html =
    '<div style="font:14px -apple-system,Segoe UI,sans-serif;color:#1E1B18">' +
    '<h2 style="font-family:Georgia,serif">Neue Bestellung – Areias</h2>' +
    '<p><strong>Bestell-Nr.:</strong> ' + esc(s.id) + '</p>' +
    '<table style="border-collapse:collapse;width:100%;max-width:520px">' + rows +
    '<tr><td></td><td style="padding:8px 10px;text-align:right"><strong>Gesamt</strong></td>' +
    '<td style="padding:8px 10px;text-align:right"><strong>' + money(s.amount_total) + '</strong></td></tr>' +
    '</table>' +
    '<h3>Lieferadresse</h3><p>' + (addrLines || '—') + '</p>' +
    '<h3>Kontakt</h3><p>E-Mail: ' + esc(cust.email || '—') + '<br>Telefon: ' + esc(cust.phone || '—') + '</p>' +
    '<p style="color:#5E564D;font-size:12px">Details & Rückerstattung im Stripe-Dashboard.</p></div>';
  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'api-key': BREVO_KEY },
    body: JSON.stringify({
      sender: { email: ORDER_FROM, name: 'Areias Shop' },
      to: [{ email: ORDER_EMAIL }],
      replyTo: cust.email ? { email: cust.email } : undefined,
      subject: 'Neue Bestellung – ' + money(s.amount_total),
      htmlContent: html
    })
  });
  if (!r.ok) { const t = await r.text(); console.error('brevo send error', r.status, t.slice(0, 200)); }
  else console.log('Bestell-Mail gesendet für', s.id);
}

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

// Besucher zählen (nur echte Seitenaufrufe, keine Assets/API)
app.use(function (req, res, next) {
  if (req.method === 'GET') {
    const p = req.path;
    const isAsset = /\.(css|js|jpg|jpeg|png|webp|svg|ico|xml|txt|map|woff2?|ttf|json)$/i.test(p);
    if (!isAsset && p.indexOf('/api/') !== 0 && p !== '/admin') {
      const day = new Date().toISOString().slice(0, 10);
      if (stats.todayKey !== day) { stats.todayKey = day; stats.today = 0; }
      stats.pageviews++; stats.today++;
      try { stats.ips.add((req.ip || '') + '|' + day); } catch (e) {}
      if (UPSTASH_URL) {  // dauerhaft, feuern und vergessen (IP nur gehasht, DSGVO)
        const h = ipHash(req.ip);
        redisPipe([['INCR', 'pv:total'], ['INCR', 'pv:' + day], ['PFADD', 'uv:all', h], ['PFADD', 'uv:' + day, h]])
          .catch(function () {});
      }
    }
  }
  next();
});

// ---------- Admin-Seite (passwortgeschützt) ----------
function safeEq(a, b) {
  const ba = Buffer.from(String(a)), bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  try { return crypto.timingSafeEqual(ba, bb); } catch (e) { return false; }
}
function adminAuth(req, res, next) {
  if (!ADMIN_PASSWORD) return res.status(404).end(); // deaktiviert, solange kein Passwort gesetzt
  const m = (req.headers.authorization || '').match(/^Basic (.+)$/);
  if (m) {
    try {
      const dec = Buffer.from(m[1], 'base64').toString('utf8');
      const i = dec.indexOf(':');
      if (i >= 0 && safeEq(dec.slice(0, i), ADMIN_USER) & safeEq(dec.slice(i + 1), ADMIN_PASSWORD)) return next();
    } catch (e) {}
  }
  res.setHeader('WWW-Authenticate', 'Basic realm="Areias Admin"');
  return res.status(401).send('Anmeldung erforderlich');
}
async function gatherStats() {
  const out = { pageviews: stats.pageviews, today: stats.today, unique: stats.ips.size, persistent: false,
    orders: null, revenue: 0, recent: [], contacts: null, errors: [] };
  if (UPSTASH_URL) {
    try {
      const day = new Date().toISOString().slice(0, 10);
      const res = await redisPipe([['GET', 'pv:total'], ['GET', 'pv:' + day], ['PFCOUNT', 'uv:all']]);
      out.pageviews = Number((res[0] && res[0].result) || 0);
      out.today = Number((res[1] && res[1].result) || 0);
      out.unique = Number((res[2] && res[2].result) || 0);
      out.persistent = true;
    } catch (e) { out.errors.push('Zähler lesen: ' + e.message); }
    // Selbsttest: kann der Token schreiben? (deckt Read-Only-Token auf)
    try {
      const w = await redisPipe([['INCR', 'diag:writes']]);
      out.writeTest = (w && w[0] && w[0].result != null) ? ('OK (' + w[0].result + ')') : 'kein Ergebnis';
    } catch (e) { out.writeTest = 'FEHLER: ' + e.message + ' → vermutlich Read-Only-Token'; }
  }
  if (stripe) {
    try {
      const list = await stripe.checkout.sessions.list({ limit: 100 });
      const paid = list.data.filter(function (s) { return s.payment_status === 'paid' || s.status === 'complete'; });
      out.orders = paid.length;
      out.revenue = paid.reduce(function (a, s) { return a + (s.amount_total || 0); }, 0);
      out.recent = paid.slice(0, 12).map(function (s) {
        return { date: new Date((s.created || 0) * 1000).toISOString().slice(0, 16).replace('T', ' '),
          email: (s.customer_details && s.customer_details.email) || '—',
          amount: s.amount_total || 0, currency: (s.currency || 'eur').toUpperCase() };
      });
    } catch (e) { out.errors.push('Stripe: ' + e.message); }
  }
  if (BREVO_KEY) {
    try {
      const r = await fetch('https://api.brevo.com/v3/contacts?limit=1', { headers: { 'api-key': BREVO_KEY } });
      if (r.ok) { const d = await r.json(); out.contacts = (d.count != null) ? d.count : null; }
    } catch (e) { out.errors.push('Brevo: ' + e.message); }
  }
  return out;
}
function eur(c) { return (Number(c || 0) / 100).toFixed(2).replace('.', ',') + ' €'; }
function esc2(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function renderAdmin(d) {
  const rows = d.recent.length ? d.recent.map(function (o) {
    return '<tr><td>' + esc2(o.date) + '</td><td>' + esc2(o.email) + '</td><td style="text-align:right">' + eur(o.amount) + '</td></tr>';
  }).join('') : '<tr><td colspan="3" style="color:#8a8178">Noch keine Bestellungen.</td></tr>';
  const card = function (label, value, sub) {
    return '<div class="c"><div class="l">' + label + '</div><div class="v">' + value + '</div>' + (sub ? '<div class="s">' + sub + '</div>' : '') + '</div>';
  };
  const diag = d.writeTest ? '<p class="err">Zähler-Schreibtest: ' + esc2(d.writeTest) + '</p>' : '';
  const errs = (d.errors.length ? '<p class="err">Hinweis: ' + esc2(d.errors.join(' · ')) + '</p>' : '') + diag;
  return '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="robots" content="noindex,nofollow"><title>Areias · Admin</title><style>' +
    ':root{--g:#F6F1EA;--i:#1E1B18;--m:#5E564D;--l:#E2D8CA;--a:#8A6A2F}' +
    '*{box-sizing:border-box}body{margin:0;background:var(--g);color:var(--i);font:15px/1.5 -apple-system,Segoe UI,sans-serif;padding:24px}' +
    '.wrap{max-width:900px;margin:0 auto}h1{font-family:Georgia,serif;font-size:30px;margin:0 0 4px}.sub{color:var(--m);margin:0 0 24px}' +
    '.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px}' +
    '.c{background:#fff;border:1px solid var(--l);border-radius:12px;padding:16px}.l{color:var(--m);font-size:12px;letter-spacing:.04em;text-transform:uppercase}' +
    '.v{font-family:Georgia,serif;font-size:28px;margin-top:6px}.s{color:var(--m);font-size:12px;margin-top:2px}' +
    'table{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--l);border-radius:12px;overflow:hidden}' +
    'th,td{padding:10px 14px;text-align:left;border-bottom:1px solid var(--l);font-size:14px}th{background:#efe7db;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--m)}' +
    'h2{font-family:Georgia,serif;font-size:20px;margin:0 0 12px}.err{color:#9a3b2f;font-size:13px}a{color:var(--a)}' +
    '@media(max-width:640px){.cards{grid-template-columns:repeat(2,1fr)}}</style></head><body><div class="wrap">' +
    '<h1>Areias · Admin</h1><p class="sub">Übersicht · Live-Daten aus Stripe/Brevo · Zähler ' + (d.persistent ? 'dauerhaft (Upstash)' : 'im Speicher (seit Neustart)') + '</p>' +
    '<div class="cards">' +
    card('Bestellungen', d.orders == null ? '–' : d.orders, 'bezahlt (letzte 100)') +
    card('Umsatz', eur(d.revenue), 'letzte 100 Bestellungen') +
    card('Newsletter', d.contacts == null ? '–' : d.contacts, 'Brevo-Kontakte') +
    card('Besucher', d.pageviews, d.unique + ' eindeutig · heute ' + d.today + (d.persistent ? '' : ' · seit Neustart')) +
    '</div>' + errs +
    '<h2>Letzte Bestellungen</h2><table><thead><tr><th>Datum</th><th>Kunde</th><th style="text-align:right">Betrag</th></tr></thead><tbody>' +
    rows + '</tbody></table>' +
    '<p class="sub" style="margin-top:24px">Vollständige Details & Rückerstattungen im <a href="https://dashboard.stripe.com" target="_blank" rel="noopener">Stripe-Dashboard</a>.</p>' +
    '</div></body></html>';
}
app.get('/admin', rateLimit(30, 5 * 60 * 1000), adminAuth, async function (req, res) {
  try {
    const d = await gatherStats();
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.send(renderAdmin(d));
  } catch (e) {
    console.error('admin error:', e.message);
    res.status(500).send('Fehler beim Laden der Admin-Daten.');
  }
});

app.use(express.static(__dirname, { extensions: ['html'], dotfiles: 'deny' }));

app.listen(PORT, function () {
  console.log('Areias läuft auf http://localhost:' + PORT + '  (Stripe: ' + (stripe ? 'aktiv' : 'nicht konfiguriert') + ')');
});
