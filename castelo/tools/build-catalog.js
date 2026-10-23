/* Baut aus dem Camping-Profi-Import (tools/data/camping-profi-raw.json) den Shop-Katalog data/catalog.json.
     node tools/build-catalog.js
   Preisregel: UVP von Camping-Profi enthält 19 % deutsche MwSt. → netto rechnen → 23 % portugiesische MwSt. drauf.
   Optional ein Aufschlag/Abschlag in Prozent (MARKUP_PERCENT) und Rundung auf ,90 / ,95 / ,99 (ROUND_TO). */
'use strict';
const fs = require('fs');
const path = require('path');

const SRC_VAT = 0.19;        // in der UVP enthalten (Deutschland)
const DST_VAT = 0.23;        // Portugal (Festland)
const MARKUP_PERCENT = 0;    // z. B. 5 = 5 % teurer als umgerechnete UVP, -5 = 5 % günstiger
const ROUND_TO = null;       // null = auf den Cent genau; 90 / 95 / 99 = auf x,90 / x,95 / x,99 aufrunden

const RAW = process.env.RAW || path.join(__dirname, 'data', 'camping-profi-raw.json');
const OUT = path.join(__dirname, '..', 'data', 'catalog.json');

// Übersetzungen der Hauptkategorien (Unterkategorien bleiben vorerst deutsch)
const TOP_I18N = {
  'Zelte und Markisen': { en: 'Tents & awnings', pt: 'Tendas & toldos' },
  'Campingmöbel': { en: 'Camping furniture', pt: 'Mobiliário de campismo' },
  'Outdoor, Freizeit und Tierwelt': { en: 'Outdoor, leisure & pets', pt: 'Outdoor, lazer & animais' },
  'Grillen, Kochen und Haushalt': { en: 'Barbecue, cooking & household', pt: 'Grelhar, cozinhar & casa' },
  'Kühlen und Heizen': { en: 'Cooling & heating', pt: 'Frio & aquecimento' },
  'Gas, Wasser und Sanitär': { en: 'Gas, water & sanitary', pt: 'Gás, água & sanitários' },
  'Elektro und Multimedia': { en: 'Electrics & multimedia', pt: 'Eletricidade & multimédia' },
  'Fahrzeugtechnik': { en: 'Vehicle technology', pt: 'Técnica do veículo' }
};

function price(uvpCents) {
  let c = uvpCents / (1 + SRC_VAT) * (1 + DST_VAT) * (1 + MARKUP_PERCENT / 100);
  c = Math.round(c);
  if (ROUND_TO) {
    const euros = Math.floor(c / 100);
    let r = euros * 100 + ROUND_TO;
    if (r < c) r += 100;
    c = r;
  }
  return c;
}

function slug(s) {
  return s.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function kg(s) {
  const m = /([\d.,]+)\s*(kg|g)\b/i.exec(s || '');
  if (!m) return null;
  const v = parseFloat(m[1].replace(',', '.'));
  return m[2].toLowerCase() === 'g' ? v / 1000 : v;
}

const raw = JSON.parse(fs.readFileSync(RAW, 'utf8'));
const cats = {};          // id → { id, name, parent, count, i18n? }
const products = {};
let skipped = 0;

for (const p of Object.values(raw.products)) {
  if (p.uvp == null || !p.uvp) { skipped++; continue; }
  let parent = '';
  for (let i = 0; i < p.cat.length; i++) {
    const id = slug(p.cat.slice(0, i + 1).join(' '));
    if (!cats[id]) {
      cats[id] = { id: id, name: p.cat[i], parent: parent, count: 0 };
      if (i === 0 && TOP_I18N[p.cat[i]]) cats[id].i18n = TOP_I18N[p.cat[i]];
    }
    cats[id].count++;
    parent = id;
  }
  const attrs = Object.assign({}, p.attrs);
  const w = kg(attrs['Gewicht']);
  products[p.id] = {
    n: p.name,
    b: p.brand || undefined,
    a: p.art || undefined,
    p: price(p.uvp),
    u: p.uvp,                         // Original-UVP (DE) zur Kontrolle
    w: w == null ? undefined : Math.round(w * 1000) / 1000,
    c: parent,
    i: p.img ? p.img.replace(/^\//, '') : undefined,   // Pfad auf camping-profi.de, z. B. Artikelabbildungen/…
    at: Object.keys(attrs).length ? attrs : undefined
  };
}

const catList = Object.values(cats).sort((a, b) => a.parent === b.parent ? a.name.localeCompare(b.name, 'de') : 0);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({
  generated: new Date().toISOString(),
  source: raw.source, fetched: raw.fetched,
  pricing: { srcVat: SRC_VAT, dstVat: DST_VAT, markupPercent: MARKUP_PERCENT, roundTo: ROUND_TO },
  categories: catList,
  products: products
}));
const size = fs.statSync(OUT).size;
console.log(Object.keys(products).length, 'Artikel,', catList.length, 'Kategorien,', skipped, 'ohne Preis übersprungen →',
  OUT, '(' + (size / 1e6).toFixed(1) + ' MB)');
