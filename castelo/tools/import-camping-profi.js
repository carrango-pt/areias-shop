/* Liest das öffentliche Sortiment von camping-profi.de (Kategorien + Artikel-Listen) ein
   und schreibt es nach tools/data/camping-profi-raw.json.
   Höflich: nur eine Anfrage gleichzeitig, mit Pause dazwischen.
     node tools/import-camping-profi.js            # alles
     node tools/import-camping-profi.js --limit 3  # nur die ersten 3 Hauptkategorien (Test)
   Danach: node tools/build-catalog.js  (Preise umrechnen, Bilder laden, Shop-Katalog schreiben) */
'use strict';
const fs = require('fs');
const path = require('path');

const BASE = 'https://www.camping-profi.de';
const OUT = path.join(__dirname, 'data', 'camping-profi-raw.json');
const DELAY_MS = 400;
const UA = 'Mozilla/5.0 (compatible; CasteloMotorhomes-Katalogimport; +https://www.castelomotorhomesandcaravanrepairs.com)';
// Hauptbereiche des Sortiments plus Outlet. Eigenmarken/Monatsangebot/TOP-Marken sind Querschnitte davon und werden übersprungen.
const ROOTS = [
  '/de/shop/Zelte-und-Markisen~c15702',
  '/de/shop/Campingmoebel~c15732',
  '/de/shop/Outdoor--Freizeit-und-Tierwelt~c15741',
  '/de/shop/Grillen--Kochen-und-Haushalt~c15776',
  '/de/shop/Kuehlen-und-Heizen~c15827',
  '/de/shop/Gas--Wasser-und-Sanitaer~c15852',
  '/de/shop/Elektro-und-Multimedia~c15911',
  '/de/shop/Fahrzeugtechnik~c15945',
  '/de/shop/Outlet~c106241'          // Restposten – gibt es nur hier
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let requests = 0;

async function get(url) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await sleep(DELAY_MS);
      requests++;
      const r = await fetch(BASE + url, { headers: { 'user-agent': UA, 'accept-language': 'de' } });
      if (r.status === 404) return '';
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.text();
    } catch (e) {
      console.error('  Fehler', url, e.message, '– Versuch', attempt);
      await sleep(2000 * attempt);
    }
  }
  return '';
}

function decode(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
    .replace(/\s+/g, ' ').trim();
}

function catPath(url) { return url.split('?')[0].replace(/~c\d+$/, ''); }

function childCategories(html, url) {
  const base = catPath(url) + '/';
  const re = /href="(\/de\/shop\/[^"?#]+~c\d+)"/g;
  const out = new Set();
  let m;
  while ((m = re.exec(html))) {
    const u = m[1];
    if (u.startsWith(base) && !u.slice(base.length).includes('/')) out.add(u);
  }
  return [...out];
}

function categoryTitle(html) {
  const m = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html) || /<title>([\s\S]*?)<\/title>/.exec(html);
  return m ? decode(m[1]) : '';
}

function parseCards(html) {
  const parts = html.split(/ws-shop-card ws-product-/).slice(1);
  return parts.map(function (p) {
    const id = (/^(\d+)/.exec(p) || [])[1];
    const href = (/href="(\/de\/p\/[^"?]+)/.exec(p) || [])[1];
    const img = (/<img src="([^"]+)"/.exec(p) || [])[1];
    const name = decode((/<h2[^>]*>([\s\S]*?)<\/h2>/.exec(p) || [])[1]);
    const meta = (/<div class="uk-margin-medium-left uk-margin-medium-right">([\s\S]*?)<\/div>/.exec(p) || [])[1] || '';
    const brand = decode((/<p>([\s\S]*?)<\/p>/.exec(meta) || [])[1]);
    const art = decode((/Artikelnummer\s*([^<]+)/.exec(p) || [])[1]);
    const uvpRaw = (/UVP:\s*([\d.]+,\d{2})\s*EUR/.exec(p) || [])[1];
    const uvp = uvpRaw ? Math.round(parseFloat(uvpRaw.replace(/\./g, '').replace(',', '.')) * 100) : null;
    const attrs = {};
    const rowRe = /<td class="uk-width-auto uk-form-label"[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/g;
    let r;
    while ((r = rowRe.exec(p))) attrs[decode(r[1])] = decode(r[2]);
    return { id, href, img: img && !/Kein-Bild/.test(img) ? img : null, name, brand, art, uvp, attrs };
  }).filter((c) => c.id && c.name);
}

async function crawlCategory(url, trail, products, stats) {
  const html = await get(url);
  if (!html) return;
  const title = categoryTitle(html) || decode(catPath(url).split('/').pop().replace(/-/g, ' '));
  const here = trail.concat(title);
  // Erst die Unterkategorien (genauere Zuordnung), dann die eigene Artikel-Liste:
  // Auch Oberkategorien können Artikel direkt enthalten (z. B. „Ersatzteile Fahrzeugtechnik“).
  for (const k of childCategories(html, url)) await crawlCategory(k, here, products, stats);
  if (!parseCards(html).length) return;
  // Alle Seiten durchblättern, solange es eine nächste Seite gibt.
  // (Nicht abbrechen, nur weil eine Seite lauter schon bekannte Artikel enthält – danach können neue kommen.)
  let page = 1, pageHtml = html;
  const seenHere = new Set();
  while (page <= 300) {
    const cards = parseCards(pageHtml);
    let freshHere = 0;
    for (const c of cards) {
      if (!seenHere.has(c.id)) { seenHere.add(c.id); freshHere++; }
      if (products[c.id]) continue;
      products[c.id] = Object.assign(c, { cat: here.slice() });
    }
    stats.count = Object.keys(products).length;
    if (!cards.length || !freshHere || !new RegExp('[?&;]p=' + (page + 1) + '"').test(pageHtml)) break;
    page++;
    pageHtml = await get(url + '?term=&p=' + page);
    if (!pageHtml) break;
  }
  console.log(String(stats.count).padStart(6), 'Artikel |', here.join(' › '), '(' + page + ' S.)');
}

(async function main() {
  const lim = process.argv.indexOf('--limit');
  const roots = lim > 0 ? ROOTS.slice(0, parseInt(process.argv[lim + 1], 10) || 1) : ROOTS;
  const products = {};
  const stats = { count: 0 };
  const started = Date.now();
  for (const root of roots) await crawlCategory(root, [], products, stats);

  // Artikel mit Varianten (z. B. Längen/Größen) zeigen in der Liste keinen Preis –
  // ihre Detailseite listet die Varianten als eigene Karten mit Preis. Diese übernehmen.
  const parents = Object.values(products).filter((p) => p.uvp == null && p.href);
  console.log('Varianten auflösen:', parents.length, 'Artikel');
  let n = 0;
  for (const par of parents) {
    const html = (await get(par.href)).split(/Andere Kunden kauften auch/)[0];
    const vars = parseCards(html).filter((v) => v.uvp != null && !products[v.id]);
    if (vars.length) {
      delete products[par.id];
      for (const v of vars) {
        products[v.id] = Object.assign(v, { cat: par.cat, parent: par.id, img: v.img || par.img, href: v.href || par.href });
      }
    }
    if (++n % 50 === 0) console.log('  ', n, '/', parents.length, '→', Object.keys(products).length, 'Artikel');
  }
  stats.count = Object.keys(products).length;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ fetched: new Date().toISOString(), source: BASE, products: products }, null, 1));
  console.log('Fertig:', stats.count, 'Artikel,', requests, 'Anfragen,', Math.round((Date.now() - started) / 1000), 's →', OUT);
})();
