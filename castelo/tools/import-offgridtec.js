/* Liest das öffentliche Sortiment von www.offgridtec.com ein (wir sind Offgridtec-Händler)
   und schreibt es nach tools/data/offgridtec-raw.json.
   Quelle der Artikelliste: die Sitemap des Shops. Höflich: eine Anfrage nach der anderen, mit Pause.
     node tools/import-offgridtec.js            # alles
     node tools/import-offgridtec.js --limit 50 # nur die ersten 50 Seiten (Test)
   Danach: node tools/build-catalog.js */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BASE = 'https://www.offgridtec.com';
const OUT = path.join(__dirname, 'data', 'offgridtec-raw.json');
const DELAY_MS = 500;
const UA = 'Mozilla/5.0 (compatible; CasteloMotorhomes-Katalogimport; +https://castelomotorhomesandcaravanrepairs.com)';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, binary) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await sleep(DELAY_MS);
      const r = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'de' } });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return binary ? Buffer.from(await r.arrayBuffer()) : await r.text();
    } catch (e) {
      console.error('  Fehler', url, e.message, '– Versuch', attempt);
      await sleep(2000 * attempt);
    }
  }
  return null;
}

function clean(s) {
  return String(s || '').replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n)).replace(/\s+/g, ' ').trim();
}

// Artikelseite auswerten. Produktseiten erkennt man am etracker-Datenblock „let product = {…}“.
function parseProduct(html, url) {
  const et = /let product = \{\s*id: '([^']*)',\s*name: "((?:[^"\\]|\\.)*)",\s*category: (\[[\s\S]*?\]),\s*price: '([^']*)'/.exec(html);
  if (!et) return null;
  let tags = [];
  try { tags = JSON.parse(et[3]); } catch (e) { /* egal */ }
  const name = clean((/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html) || [])[1]) || JSON.parse('"' + et[2] + '"');
  // angezeigter Endpreis + MwSt.-Satz
  const pi = html.indexOf('product-detail-price-wrapper');
  const priceText = pi > 0 ? clean(html.slice(pi, pi + 1500)) : '';
  const pm = /(\d{1,3}(?:\.\d{3})*,\d{2})\s*€/.exec(priceText);
  const ti = html.indexOf('product-detail-tax-container');
  const tm = ti > 0 ? /(?:inkl|zzgl|exkl)\.?\s*(\d+)\s*%\s*MwSt/i.exec(clean(html.slice(ti, ti + 2500))) : null;
  const gross = pm ? Math.round(parseFloat(pm[1].replace(/\./g, '').replace(',', '.')) * 100) : null;
  const vat = tm ? parseInt(tm[1], 10) / 100 : 0.19;
  // Hauptbild: erstes <img> der Galerie (Attribut-Reihenfolge beliebig)
  const imgTag = (/<img\b[^>]*gallery-slider-image[^>]*>/.exec(html) || [])[0] || '';
  const img = (/(?:data-src|\ssrc)="(https:\/\/www\.offgridtec\.com\/(?:media|thumbnail)\/[^"]+)"/.exec(imgTag) || [])[1] || null;
  const brand = (/product-detail-manufacturer-logo"[^>]*title="([^"]+)"/.exec(html) || [])[1] || '';
  const crumbs = [];
  const re = /breadcrumb-title[^>]*>\s*([^<]+?)\s*</g;
  let m;
  while ((m = re.exec(html))) crumbs.push(clean(m[1]));
  const gm = /Gewicht[^<]{0,5}<\/[^>]+>\s*(?:<[^>]+>\s*)*(\d+(?:[.,]\d+)?)\s*kg/i.exec(html);
  return {
    sku: et[1], name: name, brand: clean(brand), gross: gross, vat: vat, img: img ? img.split('?')[0] : null,
    crumbs: crumbs, tags: tags, freight: tags.indexOf('Versand per Spedition') >= 0,
    kg: gm ? parseFloat(gm[1].replace(',', '.')) : null, url: url
  };
}

(async function main() {
  const lim = process.argv.indexOf('--limit');
  const limit = lim > 0 ? parseInt(process.argv[lim + 1], 10) : 0;
  // Sitemap-Index → Teil-Sitemaps (gz) → URLs
  const idx = await get(BASE + '/sitemap.xml');
  const parts = [...String(idx).matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1]);
  let urls = [];
  for (const p of parts) {
    const buf = await get(p, true);
    if (!buf) continue;
    const xml = p.endsWith('.gz') ? zlib.gunzipSync(buf).toString('utf8') : buf.toString('utf8');
    urls = urls.concat([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1]));
  }
  // Produktseiten liegen direkt unter der Domain (…/name.html); Kategorien haben Unterpfade.
  urls = urls.filter((u) => /^https:\/\/www\.offgridtec\.com\/[^/]+\.html$/.test(u));
  if (limit) urls = urls.slice(0, limit);
  console.log(urls.length, 'Seiten zu prüfen');
  const products = {};
  let n = 0;
  for (const u of urls) {
    const html = await get(u);
    if (html) {
      const p = parseProduct(html, u);
      if (p && p.gross) products[p.sku] = p;
    }
    if (++n % 100 === 0) console.log(String(n).padStart(5), '/', urls.length, '→', Object.keys(products).length, 'Artikel');
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ fetched: new Date().toISOString(), source: BASE, products: products }, null, 1));
  console.log('Fertig:', Object.keys(products).length, 'Artikel →', OUT);
})();
