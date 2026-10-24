/* Admin-Seite (/admin, passwortgeschützt): Besucher und Bestellungen.
   Besucher: Seitenaufrufe, eindeutige Besucher (IP nur gehasht), Sprachen, Top-Seiten, Shop-Suchen.
   Dauerhaft in Upstash Redis (REST), falls UPSTASH_REDIS_REST_URL/TOKEN gesetzt – sonst nur im Speicher bis zum Neustart.
   Bestellungen: live aus Stripe (Checkout-Sessions). */
'use strict';
const crypto = require('crypto');

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';      // leer = Admin-Seite deaktiviert
const UPSTASH_URL = (process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';
const P = 'castelo:';                                          // Schlüssel-Präfix (Datenbank kann mit anderen Projekten geteilt sein)
const KEEP_SECONDS = 400 * 86400;                              // Tageszähler ~13 Monate aufbewahren

const day = (d) => (d || new Date()).toISOString().slice(0, 10);
const mem = { pv: {}, uv: {}, pages: {}, search: {}, lang: {} };

async function redis(cmds) {
  const r = await fetch(UPSTASH_URL + '/pipeline', {
    method: 'POST', headers: { Authorization: 'Bearer ' + UPSTASH_TOKEN, 'content-type': 'application/json' }, body: JSON.stringify(cmds)
  });
  if (!r.ok) throw new Error('Redis ' + r.status);
  return (await r.json()).map((x) => x.result);
}

// Täglich wechselndes Salz: Besucher lassen sich nicht über Tage hinweg verfolgen
function visitorHash(ip, ua) { return crypto.createHash('sha256').update(day() + '|' + ip + '|' + ua + '|castelo').digest('hex').slice(0, 20); }

function isBot(ua) {
  if (!ua) return true;
  if (/bot|crawl|spider|slurp|mediapartners|facebookexternalhit|preview|monitor|uptime|pingdom|semrush|ahrefs|mj12|dotbot|petalbot|yandex|baidu|duckduck|applebot|scan|feedfetch|curl|wget|python|go-http|java\/|okhttp|axios|node-fetch|headless|phantom|lighthouse|libwww|httpclient|playwright/i.test(ua)) return true;
  // Abrufer, die sich nicht „bot“ nennen: Google-Hilfsdienste (Search Console, Vorschau), KI-/SEO-Crawler, Link-Vorschauen
  return /googleother|google-inspectiontool|google-extended|google-safety|google-read-aloud|google-site-verification|apis-google|storebot|chrome-lighthouse|bytespider|gptbot|chatgpt|oai-searchbot|claude|anthropic|perplexity|amazonbot|meta-external|ccbot|dataforseo|seznam|ia_archiver|whatsapp|telegram|slack|discord|skype|linkedin|pinterest|qwant|ecosia|mojeek|validator|w3c|checker|wordpress|ruby|php|perl|scrapy|httrack/i.test(ua);
}

function bump(o, k) { o[k] = (o[k] || 0) + 1; }

// Middleware: echte Seitenaufrufe zählen (keine Bilder/Skripte/API, keine Bots, nicht /admin)
function track(req, res, next) {
  if (req.method === 'GET') {
    const p = req.path, ua = req.headers['user-agent'] || '';
    const isPage = !/\.(css|js|jpe?g|png|webp|svg|gif|ico|xml|txt|map|woff2?|json)$/i.test(p) && p.indexOf('/api/') !== 0 && p.indexOf('/img/') !== 0;
    if (isPage && p !== '/admin' && !isBot(ua)) {
      const d = day(), h = visitorHash(req.ip, ua);
      const lang = /^\/en(\/|$)/.test(p) ? 'en' : (/^\/pt(\/|$)/.test(p) ? 'pt' : 'de');
      const page = /\/(artikel|item|artigo)\//.test(p) ? p.replace(/^(.*\/(artikel|item|artigo)\/).*/, '$1…') + ' (Artikelseiten)' : p;
      bump(mem.pv, d); (mem.uv[d] = mem.uv[d] || new Set()).add(h); bump(mem.lang, lang); bump(mem.pages, page);
      if (UPSTASH_URL) {
        redis([['INCR', P + 'pv:' + d], ['EXPIRE', P + 'pv:' + d, KEEP_SECONDS], ['PFADD', P + 'uv:' + d, h], ['EXPIRE', P + 'uv:' + d, KEEP_SECONDS],
          ['ZINCRBY', P + 'pages', 1, page], ['ZINCRBY', P + 'lang', 1, lang]]).catch(() => {});
      }
    }
  }
  next();
}

// Shop-Suchbegriffe zählen (nur erste Ergebnisseite, damit Blättern nicht doppelt zählt)
function trackSearch(q, page) {
  q = String(q || '').trim().toLowerCase().slice(0, 60);
  if (!q || (parseInt(page, 10) || 1) > 1) return;
  bump(mem.search, q);
  if (UPSTASH_URL) redis([['ZINCRBY', P + 'search', 1, q]]).catch(() => {});
}

function safeEq(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function auth(req, res, next) {
  if (!ADMIN_PASSWORD) return res.status(404).send('Admin-Seite ist nicht eingerichtet (ADMIN_PASSWORD fehlt).');
  const m = /^Basic (.+)$/.exec(req.headers.authorization || '');
  if (m) {
    const dec = Buffer.from(m[1], 'base64').toString('utf8'), i = dec.indexOf(':');
    if (i >= 0 && safeEq(dec.slice(0, i), ADMIN_USER) & safeEq(dec.slice(i + 1), ADMIN_PASSWORD)) return next();
  }
  res.setHeader('WWW-Authenticate', 'Basic realm="Castelo Admin", charset="UTF-8"');
  res.status(401).send('Anmeldung erforderlich');
}

async function visitors(days) {
  const list = [];
  for (let i = days - 1; i >= 0; i--) list.push(day(new Date(Date.now() - i * 86400000)));
  const out = { days: list.map((d) => ({ d: d, pv: mem.pv[d] || 0, uv: mem.uv[d] ? mem.uv[d].size : 0 })), persistent: false,
    pages: Object.entries(mem.pages), search: Object.entries(mem.search), lang: Object.entries(mem.lang), error: '' };
  if (UPSTASH_URL) {
    try {
      const cmds = [];
      list.forEach((d) => { cmds.push(['GET', P + 'pv:' + d]); cmds.push(['PFCOUNT', P + 'uv:' + d]); });
      cmds.push(['ZREVRANGE', P + 'pages', 0, 14, 'WITHSCORES'], ['ZREVRANGE', P + 'search', 0, 19, 'WITHSCORES'], ['ZREVRANGE', P + 'lang', 0, 5, 'WITHSCORES']);
      const r = await redis(cmds);
      out.days = list.map((d, i) => ({ d: d, pv: Number(r[2 * i] || 0), uv: Number(r[2 * i + 1] || 0) }));
      const pairs = (a) => { const o = []; for (let i = 0; i < (a || []).length; i += 2) o.push([a[i], Number(a[i + 1])]); return o; };
      const n = list.length * 2;
      out.pages = pairs(r[n]); out.search = pairs(r[n + 1]); out.lang = pairs(r[n + 2]);
      out.persistent = true;
    } catch (e) { out.error = 'Besucherzähler: ' + e.message; }
  }
  const sortDesc = (a) => a.sort((x, y) => y[1] - x[1]);
  out.pages = sortDesc(out.pages).slice(0, 15); out.search = sortDesc(out.search).slice(0, 20); out.lang = sortDesc(out.lang);
  return out;
}

async function orders(stripe) {
  if (!stripe) return { list: [], error: 'Stripe ist nicht verbunden.' };
  try {
    const res = await stripe.checkout.sessions.list({ limit: 50, status: 'complete', expand: ['data.line_items', 'data.shipping_cost.shipping_rate'] });
    return { list: res.data.filter((s) => s.payment_status === 'paid' || s.payment_status === 'no_payment_required').map((s) => {
      const c = s.customer_details || {};
      const sh = s.shipping_details || (s.collected_information && s.collected_information.shipping_details) || {};
      const a = sh.address || c.address || {};
      const rate = s.shipping_cost && s.shipping_cost.shipping_rate;
      return {
        id: s.id, created: s.created * 1000, total: s.amount_total || 0, shipping: (s.shipping_cost && s.shipping_cost.amount_total) || 0,
        name: sh.name || c.name || '', email: c.email || '', phone: c.phone || '',
        method: (rate && rate.display_name) || '',
        address: [a.line1, a.line2, ((a.postal_code || '') + ' ' + (a.city || '')).trim(), a.country].filter(Boolean).join(', '),
        island: /^9\d{3}/.test(String(a.postal_code || '')),
        items: ((s.line_items && s.line_items.data) || []).map((li) => li.quantity + '× ' + li.description),
        payment: s.payment_intent ? 'https://dashboard.stripe.com/payments/' + s.payment_intent : 'https://dashboard.stripe.com/payments'
      };
    }), error: '' };
  } catch (e) { return { list: [], error: 'Stripe: ' + e.message }; }
}

const esc = (x) => String(x == null ? '' : x).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = (c) => (c / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const dt = (ms) => new Date(ms).toLocaleString('de-DE', { timeZone: 'Europe/Lisbon', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function chart(days) {
  const W = 760, H = 180, pad = 24, max = Math.max(1, ...days.map((d) => d.pv));
  const bw = (W - pad * 2) / days.length;
  const bars = days.map((d, i) => {
    const x = pad + i * bw, h1 = (d.pv / max) * (H - 40), h2 = (d.uv / max) * (H - 40);
    return '<g><title>' + d.d + ': ' + d.pv + ' Aufrufe, ' + d.uv + ' Besucher</title>' +
      '<rect x="' + (x + 2).toFixed(1) + '" y="' + (H - 20 - h1).toFixed(1) + '" width="' + (bw - 4).toFixed(1) + '" height="' + h1.toFixed(1) + '" fill="#c9d8e6"/>' +
      '<rect x="' + (x + 2).toFixed(1) + '" y="' + (H - 20 - h2).toFixed(1) + '" width="' + (bw - 4).toFixed(1) + '" height="' + h2.toFixed(1) + '" fill="#12324a"/>' +
      (i % 5 === 0 ? '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 5) + '" font-size="10" text-anchor="middle" fill="#5b6b78">' + d.d.slice(8) + '.' + d.d.slice(5, 7) + '.</text>' : '') + '</g>';
  }).join('');
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Besucher der letzten 30 Tage">' +
    '<text x="' + pad + '" y="12" font-size="11" fill="#5b6b78">max. ' + max + ' Aufrufe/Tag</text>' + bars + '</svg>';
}

function table(rows, empty) {
  return rows.length ? '<table>' + rows.map((r) => '<tr><td>' + esc(r[0]) + '</td><td class="n">' + r[1] + '</td></tr>').join('') + '</table>' : '<p class="muted">' + empty + '</p>';
}

function render(v, o) {
  const sum = (a, k) => a.reduce((x, y) => x + y[k], 0);
  const today = v.days[v.days.length - 1], last7 = v.days.slice(-7);
  const now = Date.now(), within = (ms, d) => now - ms < d * 86400000;
  const rev = (d) => o.list.filter((x) => within(x.created, d)).reduce((a, x) => a + x.total, 0);
  const cnt = (d) => o.list.filter((x) => within(x.created, d)).length;
  const card = (l, val, s) => '<div class="card"><div class="l">' + l + '</div><div class="v">' + val + '</div><div class="s">' + s + '</div></div>';
  const ord = o.list.length ? o.list.map((x) => '<tr><td>' + dt(x.created) + '</td><td><strong>' + esc(x.name) + '</strong><br>' +
      '<a href="mailto:' + esc(x.email) + '">' + esc(x.email) + '</a><br>' + esc(x.phone) + '</td><td>' + x.items.map(esc).join('<br>') + '</td>' +
      '<td>' + esc(x.method) + (x.island ? '<br><span class="warn">⚠ Insel – Versand klären</span>' : '') + '<br><span class="muted">' + esc(x.address) + '</span></td>' +
      '<td class="n"><strong>' + eur(x.total) + '</strong><br><span class="muted">Versand ' + eur(x.shipping) + '</span><br><a href="' + esc(x.payment) + '" target="_blank" rel="noopener">Stripe ↗</a></td></tr>').join('')
    : '<tr><td colspan="5" class="muted">Noch keine bezahlten Bestellungen.</td></tr>';
  const langName = { de: 'Deutsch', en: 'Englisch', pt: 'Portugiesisch' };
  return '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="robots" content="noindex,nofollow"><title>Castelo · Admin</title><style>' +
    '*{box-sizing:border-box}body{margin:0;background:#f7f3ec;color:#14212b;font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:20px}' +
    '.wrap{max-width:1150px;margin:0 auto}h1{margin:0;font-size:26px;color:#12324a}h2{font-size:18px;color:#12324a;margin:32px 0 10px}' +
    '.muted{color:#5b6b78;font-size:13px}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-top:18px}' +
    '.card{background:#fff;border:1px solid #e3dccf;border-radius:12px;padding:14px}.l{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#5b6b78}' +
    '.v{font-size:26px;font-weight:700;color:#12324a;margin-top:4px}.s{font-size:12px;color:#5b6b78}' +
    '.box{background:#fff;border:1px solid #e3dccf;border-radius:12px;padding:14px;overflow-x:auto}.grid3{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}' +
    'table{width:100%;border-collapse:collapse}td,th{padding:8px 10px;border-bottom:1px solid #eee6d8;vertical-align:top;text-align:left;font-size:14px}' +
    'th{font-size:12px;text-transform:uppercase;color:#5b6b78}.n{text-align:right;white-space:nowrap}.warn{color:#9b2c2c;font-weight:600}.err{color:#9b2c2c}' +
    'a{color:#1d4a6b}.legend span{display:inline-block;width:10px;height:10px;margin:0 4px 0 12px;vertical-align:middle}</style></head><body><div class="wrap">' +
    '<h1>Castelo Motorhomes · Admin</h1><p class="muted">Stand ' + dt(Date.now()) + ' · Besucherzähler ' +
    (v.persistent ? 'dauerhaft gespeichert' : '<span class="warn">nur seit dem letzten Neustart</span> (Upstash nicht eingerichtet)') + '</p>' +
    (v.error ? '<p class="err">' + esc(v.error) + '</p>' : '') + (o.error ? '<p class="err">' + esc(o.error) + '</p>' : '') +
    '<div class="cards">' +
    card('Besucher heute', today.uv, today.pv + ' Seitenaufrufe') +
    card('Besucher 7 Tage', sum(last7, 'uv'), sum(last7, 'pv') + ' Seitenaufrufe') +
    card('Besucher 30 Tage', sum(v.days, 'uv'), sum(v.days, 'pv') + ' Seitenaufrufe') +
    card('Bestellungen 7 Tage', cnt(7), eur(rev(7)) + ' Umsatz') +
    card('Bestellungen 30 Tage', cnt(30), eur(rev(30)) + ' Umsatz') +
    '</div>' +
    '<h2>Besucher der letzten 30 Tage</h2><div class="box">' + chart(v.days) +
    '<div class="legend muted"><span style="background:#12324a"></span>Besucher<span style="background:#c9d8e6"></span>Seitenaufrufe</div></div>' +
    '<div class="grid3"><div><h2>Meistbesuchte Seiten</h2><div class="box">' + table(v.pages, 'Noch keine Daten.') + '</div></div>' +
    '<div><h2>Shop-Suchen</h2><div class="box">' + table(v.search, 'Noch keine Suchen.') + '</div></div>' +
    '<div><h2>Sprachen</h2><div class="box">' + table(v.lang.map((x) => [langName[x[0]] || x[0], x[1]]), 'Noch keine Daten.') + '</div></div></div>' +
    '<h2>Bestellungen (letzte 50)</h2><div class="box"><table><tr><th>Datum</th><th>Kunde</th><th>Artikel</th><th>Lieferung / Adresse</th><th class="n">Betrag</th></tr>' + ord + '</table></div>' +
    '<p class="muted" style="margin-top:24px">Erstattungen und alle Details im <a href="https://dashboard.stripe.com/payments" target="_blank" rel="noopener">Stripe-Dashboard</a>. ' +
    'Besucher werden ohne Cookies gezählt; IP-Adressen nur als täglich wechselnder Hash.</p></div></body></html>';
}

function page(stripe) {
  return async function (req, res) {
    try {
      const [v, o] = await Promise.all([visitors(30), orders(stripe)]);
      res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow',
        // eigene, engere CSP: nur die eingebetteten Styles dieser Seite erlauben, kein JavaScript
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; form-action 'none'; frame-ancestors 'none'; base-uri 'none'" });
      res.type('html').send(render(v, o));
    } catch (e) {
      console.error('admin error:', e.message);
      res.status(500).send('Fehler beim Laden der Admin-Daten.');
    }
  };
}

module.exports = { track, trackSearch, auth, page, persistent: () => !!UPSTASH_URL, enabled: () => !!ADMIN_PASSWORD };
