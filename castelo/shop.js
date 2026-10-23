/* Campingshop: Katalog (data/catalog.json), Suche/Filter-API, Artikelseiten, Bild-Proxy, Versandberechnung. */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const CONFIG = require('./shop-config.js');

const LANGS = ['de', 'en', 'pt'];
const SHOP_PATH = { de: '/campingshop', en: '/en/shop', pt: '/pt/loja' };
const ITEM_PATH = { de: '/campingshop/artikel/', en: '/en/shop/item/', pt: '/pt/loja/artigo/' };
const IMG_ORIGIN = 'https://www.camping-profi.de/';
const PAGE_SIZE = 24;

const TX = {
  de: { shop: 'Campingshop', art: 'Artikelnummer', brand: 'Marke', vat: 'inkl. 23 % MwSt., zzgl. Versand',
    add: 'In den Warenkorb', data: 'Produktdaten', back: 'Zurück zum Shop', notfound: 'Artikel nicht gefunden',
    supply: 'Wir bestellen den Artikel nach Ihrem Kauf bei unserem Großhändler. Die Lieferzeit teilen wir Ihnen nach der Bestellung mit. Abholung in der Werkstatt ist kostenlos.',
    ask: 'Fragen zum Artikel?', askText: 'Schreiben Sie uns per WhatsApp oder rufen Sie an.' },
  en: { shop: 'Camping shop', art: 'Item number', brand: 'Brand', vat: 'incl. 23% VAT, plus delivery',
    add: 'Add to basket', data: 'Product data', back: 'Back to the shop', notfound: 'Item not found',
    supply: 'We order the item from our wholesaler after your purchase. We will tell you the delivery time after you order. Collection at the workshop is free.',
    ask: 'Questions about this item?', askText: 'Send us a WhatsApp message or give us a call.' },
  pt: { shop: 'Loja de campismo', art: 'Referência', brand: 'Marca', vat: 'IVA de 23 % incluído, portes à parte',
    add: 'Adicionar ao carrinho', data: 'Dados do produto', back: 'Voltar à loja', notfound: 'Artigo não encontrado',
    supply: 'Encomendamos o artigo ao nosso fornecedor após a sua compra. Indicamos o prazo de entrega após a encomenda. O levantamento na oficina é gratuito.',
    ask: 'Dúvidas sobre este artigo?', askText: 'Envie-nos uma mensagem por WhatsApp ou ligue-nos.' }
};

// ---------------------------------------------------------------- Katalog laden
let CAT = { categories: [], products: {} };
const CAT_FILE = path.join(__dirname, 'data', 'catalog.json');
try { CAT = JSON.parse(fs.readFileSync(CAT_FILE, 'utf8')); } catch (e) { console.warn('Kein Katalog gefunden (data/catalog.json) – Shop ist leer.'); }

function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u').replace(/ß/g, 'ss');
}
function slug(s) { return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70); }

const catById = {};
CAT.categories.forEach(function (c) { catById[c.id] = c; });
const ids = Object.keys(CAT.products);
const byCat = {};          // Kategorie-ID → [Artikel-IDs] (inkl. Unterkategorien)
const haystack = {};       // Artikel-ID → normalisierter Suchtext
ids.forEach(function (id) {
  const p = CAT.products[id];
  for (let c = catById[p.c]; c; c = catById[c.parent]) (byCat[c.id] = byCat[c.id] || []).push(id);
  // Suchtext: Name, Marke, Artikelnummer und nur die eigene (unterste) Kategorie –
  // sonst träfe z. B. „Markise“ jeden Artikel unter „Zelte und Markisen“.
  const h = norm([p.n, p.b, p.a, catById[p.c] ? catById[p.c].name : ''].join(' '));
  haystack[id] = h + ' ' + h.replace(/[^a-z0-9]+/g, '');   // auch ohne Bindestriche/Leerzeichen: „gaswarner“ findet „Gas-Warner“
});

function catName(c, lang) { return (c.i18n && c.i18n[lang]) || c.name; }
function itemUrl(id, lang) { return ITEM_PATH[lang] + id + '-' + slug(CAT.products[id].n); }
function imgUrl(p) { return p.i ? '/img/cp/' + p.i : '/img/shop-zubehoer.jpg'; }
function langOf(x) { return LANGS.indexOf(x) >= 0 ? x : 'de'; }

// ---------------------------------------------------------------- API
function categories(req, res) {
  const lang = langOf(req.query.lang);
  res.set('Cache-Control', 'public, max-age=3600');
  res.json(CAT.categories.map(function (c) {
    return { id: c.id, name: catName(c, lang), parent: c.parent, count: (byCat[c.id] || []).length };
  }));
}

function products(req, res) {
  const lang = langOf(req.query.lang);
  const cat = String(req.query.cat || '');
  const q = norm(String(req.query.q || '').slice(0, 100)).split(/\s+/).filter(Boolean);
  const brand = String(req.query.brand || '');
  const sort = String(req.query.sort || '');
  let list = cat && byCat[cat] ? byCat[cat] : ids;
  if (q.length) list = list.filter(function (id) { const h = haystack[id]; return q.every(function (t) { return h.indexOf(t) >= 0; }); });
  const brands = {};
  list.forEach(function (id) { const b = CAT.products[id].b; if (b) brands[b] = (brands[b] || 0) + 1; });
  if (brand) list = list.filter(function (id) { return CAT.products[id].b === brand; });
  list = list.slice();
  const P = CAT.products;
  if (sort === 'price') list.sort(function (a, b) { return P[a].p - P[b].p; });
  else if (sort === '-price') list.sort(function (a, b) { return P[b].p - P[a].p; });
  else if (sort === 'name') list.sort(function (a, b) { return P[a].n.localeCompare(P[b].n, 'de'); });
  else if (q.length) {   // Treffer im Namen zuerst
    list.sort(function (a, b) {
      const na = norm(P[a].n), nb = norm(P[b].n);
      return q.filter(function (t) { return nb.indexOf(t) >= 0; }).length - q.filter(function (t) { return na.indexOf(t) >= 0; }).length;
    });
  }
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, parseInt(req.query.page, 10) || 1));
  res.json({
    total: list.length, page: page, pages: pages,
    brands: Object.keys(brands).sort(function (a, b) { return brands[b] - brands[a]; }).slice(0, 40).map(function (b) { return [b, brands[b]]; }),
    items: list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(function (id) {
      const p = P[id];
      return { id: id, n: p.n, b: p.b, a: p.a, p: p.p, img: imgUrl(p), url: itemUrl(id, lang) };
    })
  });
}

// ---------------------------------------------------------------- Bild-Proxy (mit Platten-Cache)
const CACHE_DIR = path.join(os.tmpdir(), 'castelo-img');
fs.mkdirSync(CACHE_DIR, { recursive: true });
const inflight = {};
async function fetchImage(rel) {
  const urls = /\.(png|jpe?g)$/i.test(rel) ? [rel.replace(/\.(png|jpe?g)$/i, '.webp'), rel] : [rel];
  for (const u of urls) {
    const r = await fetch(IMG_ORIGIN + encodeURI(u));
    if (r.ok) return { type: r.headers.get('content-type') || 'image/png', buf: Buffer.from(await r.arrayBuffer()) };
  }
  return null;
}
async function image(req, res) {
  const rel = req.params[0] || '';
  if (!/^(Artikelabbildungen|Artikeldokumente)\/[\w\-.@~/ ()&+,]+$/.test(rel) || rel.indexOf('..') >= 0 ||
      !/\.(png|jpe?g|webp|gif)$/i.test(rel)) return res.status(404).end();
  const key = crypto.createHash('sha1').update(rel).digest('hex');
  const file = path.join(CACHE_DIR, key);
  res.set('Cache-Control', 'public, max-age=2592000, immutable');
  try {
    const meta = JSON.parse(fs.readFileSync(file + '.json', 'utf8'));
    res.type(meta.type);
    return res.sendFile(file);
  } catch (e) { /* noch nicht im Cache */ }
  try {
    const img = await (inflight[key] = inflight[key] || fetchImage(rel));
    delete inflight[key];
    if (!img) return res.redirect(302, '/img/shop-zubehoer.jpg');
    fs.writeFile(file, img.buf, function () { fs.writeFile(file + '.json', JSON.stringify({ type: img.type }), function () {}); });
    res.type(img.type).send(img.buf);
  } catch (e) {
    delete inflight[key];
    res.redirect(302, '/img/shop-zubehoer.jpg');
  }
}

// ---------------------------------------------------------------- Artikelseite
const TEMPLATES = {};
LANGS.forEach(function (l) {
  try { TEMPLATES[l] = fs.readFileSync(path.join(__dirname, 'templates', 'product-' + l + '.html'), 'utf8'); } catch (e) { /* build.py noch nicht gelaufen */ }
});
function esc(x) {
  return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function euro(c, lang) {
  return (c / 100).toLocaleString({ de: 'de-DE', en: 'en-IE', pt: 'pt-PT' }[lang], { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function productPage(lang) {
  return function (req, res, next) {
    const id = (/^(\d+)/.exec(req.params.slug || '') || [])[1];
    const p = id && CAT.products[id];
    const tpl = TEMPLATES[lang];
    if (!p || !tpl) return next();
    const L = TX[lang];
    const crumbs = [];
    for (let c = catById[p.c]; c; c = catById[c.parent]) crumbs.unshift(c);
    const crumbHtml = '<a href="' + SHOP_PATH[lang] + '">' + L.shop + '</a>' + crumbs.map(function (c) {
      return ' › <a href="' + SHOP_PATH[lang] + '?cat=' + encodeURIComponent(c.id) + '">' + esc(catName(c, lang)) + '</a>';
    }).join('');
    const rows = Object.keys(p.at || {}).map(function (k) { return '<tr><td>' + esc(k) + '</td><td>' + esc(p.at[k]) + '</td></tr>'; }).join('');
    const item = { id: id, n: p.n, p: p.p, img: imgUrl(p), url: itemUrl(id, lang) };
    const body =
      '<section class="block"><div class="wrap">' +
      '<nav class="crumbs" aria-label="Breadcrumb">' + crumbHtml + '</nav>' +
      '<div class="grid c2 top item">' +
      '<div class="item-img"><img src="' + esc(item.img) + '" alt="' + esc(p.n) + '" width="580" height="280"></div>' +
      '<div><h1>' + esc(p.n) + '</h1>' +
      '<p class="item-meta">' + (p.b ? L.brand + ': <strong>' + esc(p.b) + '</strong> · ' : '') + (p.a ? L.art + ' ' + esc(p.a) : '') + '</p>' +
      '<p class="item-price">' + euro(p.p, lang) + '</p><p class="note">' + L.vat + '</p>' +
      '<p><button class="btn" type="button" data-add="' + esc(JSON.stringify(item)) + '">' + L.add + '</button></p>' +
      '<p class="notice">' + L.supply + '</p>' +
      (rows ? '<h2 class="h3">' + L.data + '</h2><table class="hours specs">' + rows + '</table>' : '') +
      '<p class="mt"><strong>' + L.ask + '</strong> ' + L.askText + '</p>' +
      '<p><a href="' + SHOP_PATH[lang] + '">← ' + L.back + '</a></p>' +
      '</div></div></div></section>';
    const title = esc(p.n) + (p.b ? ' – ' + esc(p.b) : '');
    const desc = esc(p.n + (p.b ? ' · ' + p.b : '') + ' – ' + euro(p.p, lang) + ' · Castelo Motorhomes, Algarve');
    const slugPart = id + '-' + slug(p.n);
    res.set('Cache-Control', 'public, max-age=600');
    res.type('html').send(tpl.split('{{ID}}').join(slugPart).split('{{TITLE}}').join(title)
      .split('{{DESC}}').join(desc).split('{{BODY}}').join(body));
  };
}

function sitemap(req, res) {
  const origin = 'https://' + req.get('host');
  const rows = ids.map(function (id) {
    return '<url><loc>' + origin + itemUrl(id, 'de') + '</loc>' + LANGS.map(function (l) {
      return '<xhtml:link rel="alternate" hreflang="' + l + '" href="' + origin + itemUrl(id, l) + '"/>';
    }).join('') + '</url>';
  });
  res.type('application/xml').set('Cache-Control', 'public, max-age=86400').send(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    rows.join('\n') + '\n</urlset>\n');
}

// ---------------------------------------------------------------- Kasse: Positionen + Versand
function checkoutData(items, lang) {
  let kg = 0, subtotal = 0;
  const line_items = items.map(function (it) {
    const id = String(it.id);
    const p = Object.prototype.hasOwnProperty.call(CAT.products, id) && CAT.products[id];
    if (!p) throw new Error('unknown product: ' + id);
    const qty = Math.max(1, Math.min(99, parseInt(it.qty, 10) || 1));
    subtotal += p.p * qty;
    kg += (p.w || CONFIG.unknownWeightKg) * qty;
    return {
      quantity: qty,
      price_data: { currency: CONFIG.currency, unit_amount: p.p, product_data: { name: p.n + (p.a ? ' (Art. ' + p.a + ')' : '') } }
    };
  });
  function rate(label, amount, d) {
    return { shipping_rate_data: { type: 'fixed_amount', fixed_amount: { amount: amount, currency: CONFIG.currency }, display_name: label,
      delivery_estimate: { minimum: { unit: 'business_day', value: d.min }, maximum: { unit: 'business_day', value: d.max } } } };
  }
  const options = [rate(CONFIG.pickup.label[lang], 0, CONFIG.pickup)];
  const tier = CONFIG.shippingTiers.find(function (t) { return kg <= t.maxKg; });
  if (tier) {
    const free = CONFIG.freeShippingFrom > 0 && subtotal >= CONFIG.freeShippingFrom;
    options.push(rate(CONFIG.shippingLabel[lang], free ? 0 : tier.amount, CONFIG.shippingDays));
  }
  return { line_items: line_items, shipping_options: options, kg: kg };
}

module.exports = { categories, products, image, productPage, sitemap, checkoutData, SHOP_PATH, ITEM_PATH, LANGS, count: ids.length, CONFIG };
