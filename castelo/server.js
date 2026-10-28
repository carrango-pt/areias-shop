/* Castelo Motorhomes – Web-Server: liefert die Seite aus public/, erstellt Stripe-Checkout-Sessions,
   verschickt Kontaktanfragen und Bestell-Mails (via Brevo).
   Preise stammen ausschließlich aus data/catalog.json (serverseitig, nie aus dem Browser). */
const path = require('path');
const express = require('express');
const shop = require('./shop.js');
const admin = require('./admin.js');

const app = express();
const PORT = process.env.PORT || 4600;
const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const BREVO_KEY = process.env.BREVO_API_KEY || '';
const SHOP_EMAIL = process.env.SHOP_EMAIL || 'caravantechnologypera@hotmail.com';   // Empfänger für Anfragen + Bestellungen
const FROM_EMAIL = process.env.FROM_EMAIL || SHOP_EMAIL;                      // Absender (in Brevo verifiziert)

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(function (_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; " +
    "img-src 'self' data: https://www.livroreclamacoes.pt; style-src 'self'; font-src 'self'; script-src 'self'; " +
    "connect-src 'self'; form-action 'self' https://checkout.stripe.com");
  next();
});

function esc(x) {
  return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

async function sendMail(subject, html, replyTo) {
  if (!BREVO_KEY) { console.log('Mail nicht gesendet (kein BREVO_API_KEY):', subject); return false; }
  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'api-key': BREVO_KEY },
    body: JSON.stringify({
      sender: { email: FROM_EMAIL, name: 'Castelo Motorhomes Website' },
      to: [{ email: SHOP_EMAIL }],
      replyTo: replyTo ? { email: replyTo } : undefined,
      subject: subject,
      htmlContent: html
    })
  });
  if (!r.ok) { console.error('brevo send error', r.status, (await r.text()).slice(0, 200)); return false; }
  return true;
}

/* Stripe-Webhook: bei jeder bezahlten Bestellung eine Übersicht per E-Mail.
   MUSS vor express.json stehen – die Signaturprüfung braucht den Rohtext. */
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async function (req, res) {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) return res.status(503).end();
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return res.status(400).send('bad signature');
  }
  res.json({ received: true });
  if (event.type !== 'checkout.session.completed') return;
  try {
    const s = await stripe.checkout.sessions.retrieve(event.data.object.id, { expand: ['line_items', 'shipping_cost.shipping_rate'] });
    await sendOrderEmail(s);
  } catch (e) {
    console.error('order email error:', e.message);
  }
});

async function sendOrderEmail(s) {
  const money = function (c) { return (Number(c || 0) / 100).toFixed(2).replace('.', ',') + ' €'; };
  const items = (s.line_items && s.line_items.data) || [];
  const cust = s.customer_details || {};
  const ship = s.shipping_details || (s.collected_information && s.collected_information.shipping_details) || {};
  const addr = ship.address || cust.address || {};
  const rate = s.shipping_cost && s.shipping_cost.shipping_rate;
  const rows = items.map(function (li) {
    return '<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">' + (li.quantity || 1) + '×</td>' +
      '<td style="padding:6px 10px;border-bottom:1px solid #eee">' + esc(li.description || '') + '</td>' +
      '<td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">' + money(li.amount_total) + '</td></tr>';
  }).join('');
  const addrLines = [ship.name || cust.name || '', addr.line1 || '', addr.line2 || '',
    ((addr.postal_code || '') + ' ' + (addr.city || '')).trim(), addr.country || '']
    .filter(Boolean).map(esc).join('<br>');
  const html =
    '<div style="font:14px -apple-system,Segoe UI,sans-serif;color:#14212b">' +
    '<h2>Neue Bestellung – Campingshop</h2>' +
    '<p><strong>Bestell-Nr.:</strong> ' + esc(s.id) + '</p>' +
    '<table style="border-collapse:collapse;width:100%;max-width:520px">' + rows +
    '<tr><td></td><td style="padding:8px 10px;text-align:right"><strong>Gesamt</strong></td>' +
    '<td style="padding:8px 10px;text-align:right"><strong>' + money(s.amount_total) + '</strong></td></tr></table>' +
    '<p><strong>Lieferung:</strong> ' + esc((rate && rate.display_name) || '—') + '</p>' +
    '<h3>Adresse</h3><p>' + (addrLines || '—') + '</p>' +
    '<h3>Kontakt</h3><p>E-Mail: ' + esc(cust.email || '—') + '<br>Telefon: ' + esc(cust.phone || '—') + '</p>' +
    '<p style="color:#5b6b78;font-size:12px">Details und Rückerstattung im Stripe-Dashboard.</p></div>';
  const island = shop.CONFIG.islandPostcode.test(String(addr.postal_code || '').trim());
  await sendMail((island ? '⚠ INSEL – Versand klären! ' : '') + 'Neue Bestellung – ' + money(s.amount_total), html, cust.email);
}

app.use(express.json({ limit: '32kb' }));
app.use(admin.track);   // Besucherzählung (ohne Cookies, keine Bots)

// Einfaches In-Memory-Rate-Limit pro IP.
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
    if (++e.count > max) {
      res.setHeader('Retry-After', Math.ceil((e.reset - now) / 1000));
      return res.status(429).json({ error: 'rate_limited' });
    }
    next();
  };
}

app.get('/api/shop/categories', shop.categories);
app.get('/api/shop/info', shop.info);
app.get('/api/shop/products', rateLimit(120, 60 * 1000), shop.products);
// Suchbegriff zählen – der Browser meldet ihn erst, wenn der Kunde aufgehört hat zu tippen
app.post('/api/shop/search-log', rateLimit(60, 60 * 1000), function (req, res) {
  admin.trackSearch(req.body && req.body.q, 1);
  res.status(204).end();
});
app.get('/admin', rateLimit(30, 5 * 60 * 1000), admin.auth, admin.page(stripe));
app.get('/img/:src(cp|og)/*', rateLimit(600, 60 * 1000), shop.image);
app.get('/sitemap-products.xml', shop.sitemap);
shop.LANGS.forEach(function (l) { app.get(shop.ITEM_PATH[l] + ':slug', shop.productPage(l)); });

const ISLAND_NOTE = {
  de: 'Versand nur innerhalb Portugals (Festland). Lieferung auf die Inseln (Madeira, Azoren) bitte vorher anfragen.',
  en: 'Delivery within mainland Portugal only. For the islands (Madeira, Azores) please ask us first.',
  pt: 'Envio apenas para Portugal continental. Para as ilhas (Madeira, Açores) contacte-nos primeiro.'
};

app.post('/api/checkout', rateLimit(40, 5 * 60 * 1000), async function (req, res) {
  if (!stripe) return res.status(503).json({ error: 'not_configured' });
  try {
    const lang = ['en', 'pt'].indexOf(req.body.lang) >= 0 ? req.body.lang : 'de';
    const items = Array.isArray(req.body.items) ? req.body.items.slice(0, 50) : [];
    if (!items.length) return res.status(400).json({ error: 'empty cart' });
    const order = shop.checkoutData(items, lang);

    // Rücksprung-Adresse fest vorgeben (Host-Header ist vom Absender fälschbar); lokal zum Testen localhost
    const origin = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.get('host') || '') ? 'http://' + req.get('host') : shop.SITE;
    const shopPath = shop.SHOP_PATH[lang];
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: order.line_items,
      locale: lang,
      billing_address_collection: 'auto',
      phone_number_collection: { enabled: true },
      customer_creation: 'always',       // legt je Kauf einen Stripe-Kunden an → Stammkunden unter Stripe → Kunden, ohne Kundenkonto im Shop
      shipping_address_collection: { allowed_countries: shop.CONFIG.allowedCountries },
      shipping_options: order.shipping_options,
      custom_text: { shipping_address: { message: ISLAND_NOTE[lang] } },
      success_url: origin + shopPath + '?checkout=success',
      cancel_url: origin + shopPath + '?checkout=cancel'
    });
    res.json({ url: session.url });
  } catch (e) {
    if (e.code === 'freight') return res.status(409).json({ error: 'freight' });
    console.error('checkout error:', e.message);
    res.status(400).json({ error: 'checkout_failed' });
  }
});

// Kontaktformular → E-Mail an die Werkstatt.
app.post('/api/contact', rateLimit(5, 10 * 60 * 1000), async function (req, res) {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true });   // Honeypot: Bots füllen das versteckte Feld
  const name = String(b.name || '').trim().slice(0, 120);
  const email = String(b.email || '').trim().slice(0, 200);
  const phone = String(b.phone || '').trim().slice(0, 60);
  const vehicle = String(b.vehicle || '').trim().slice(0, 200);
  const message = String(b.message || '').trim().slice(0, 4000);
  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'invalid' });
  }
  const html =
    '<div style="font:14px -apple-system,Segoe UI,sans-serif;color:#14212b">' +
    '<h2>Neue Anfrage über die Website</h2>' +
    '<p><strong>Name:</strong> ' + esc(name) + '<br><strong>E-Mail:</strong> ' + esc(email) +
    '<br><strong>Telefon:</strong> ' + esc(phone || '—') + '<br><strong>Fahrzeug:</strong> ' + esc(vehicle || '—') + '</p>' +
    '<p style="white-space:pre-wrap">' + esc(message) + '</p></div>';
  try {
    const ok = await sendMail('Anfrage von ' + name, html, email);
    if (!ok) return res.status(503).json({ error: 'not_configured' });
    res.json({ ok: true });
  } catch (e) {
    console.error('contact error:', e.message);
    res.status(503).json({ error: 'send_failed' });
  }
});

app.get('/api/health', function (_req, res) {
  res.json({ ok: true, stripe: !!stripe, mail: !!BREVO_KEY, products: shop.count, admin: admin.enabled(), stats: admin.persistent() });
});

app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'], dotfiles: 'deny' }));

app.use(function (_req, res) {
  const lang = /^\/(en|pt)(\/|$)/.exec(_req.path);
  res.status(404).sendFile(path.join(__dirname, 'public', lang ? lang[1] : '', '404.html'));
});

app.listen(PORT, function () {
  console.log('Castelo Motorhomes läuft auf http://localhost:' + PORT +
    (stripe ? '' : ' (ohne Stripe – Kasse deaktiviert)') + (BREVO_KEY ? '' : ' (ohne Brevo – keine Mails)'));
});
