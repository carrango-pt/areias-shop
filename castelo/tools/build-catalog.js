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

// Übersetzungen der zweiten Ebene
const SUB_I18N = {
  'Zelte': { en: 'Tents', pt: 'Tendas' },
  'Markisenzubehör': { en: 'Awning accessories', pt: 'Acessórios para toldos' },
  'Tierwelt': { en: 'Pets', pt: 'Animais' },
  'Wetter-Schutz': { en: 'Weather protection', pt: 'Proteção contra o tempo' },
  'Markisen': { en: 'Awnings', pt: 'Toldos' },
  'Ersatzteile Zelte und Markisen': { en: 'Spare parts tents & awnings', pt: 'Peças para tendas e toldos' },
  'Beinauflagen und Hocker': { en: 'Footrests & stools', pt: 'Apoios para pernas e bancos' },
  'Faltmöbel': { en: 'Folding furniture', pt: 'Mobiliário dobrável' },
  'Liegen': { en: 'Loungers', pt: 'Espreguiçadeiras' },
  'Sessel und Stühle': { en: 'Chairs', pt: 'Cadeiras' },
  'Tische': { en: 'Tables', pt: 'Mesas' },
  'Zubehör': { en: 'Accessories', pt: 'Acessórios' },
  'Fahrzeug-Ausstattung': { en: 'Vehicle equipment', pt: 'Equipamento do veículo' },
  'Haushaltsartikel und -helfer': { en: 'Household items', pt: 'Artigos de casa' },
  'Küchenschränke und -boxen': { en: 'Kitchen cupboards & boxes', pt: 'Armários e caixas de cozinha' },
  'Wind- und Sonnenschutz': { en: 'Wind & sun protection', pt: 'Proteção contra vento e sol' },
  'Insektenschutz': { en: 'Insect protection', pt: 'Proteção contra insetos' },
  'Schlafkomfort': { en: 'Sleeping comfort', pt: 'Conforto para dormir' },
  'Literatur': { en: 'Books & maps', pt: 'Livros e mapas' },
  'Strandartikel': { en: 'Beach items', pt: 'Artigos de praia' },
  'Grillen': { en: 'Barbecue', pt: 'Grelhar' },
  'Gasversorgung': { en: 'Gas supply', pt: 'Abastecimento de gás' },
  'Campingkocher und Zubehör': { en: 'Camping stoves & accessories', pt: 'Fogareiros e acessórios' },
  'Beleuchtung': { en: 'Lighting', pt: 'Iluminação' },
  'Kochen und Spülen': { en: 'Cooking & washing up', pt: 'Cozinhar e lavar loiça' },
  'Besteck und Geschirr': { en: 'Cutlery & tableware', pt: 'Talheres e loiça' },
  'Elektrogeräte': { en: 'Electrical appliances', pt: 'Eletrodomésticos' },
  'Sanitär': { en: 'Sanitary', pt: 'Sanitários' },
  'Reinigung und Imprägnierung': { en: 'Cleaning & waterproofing', pt: 'Limpeza e impermeabilização' },
  'Klimaanlagen': { en: 'Air conditioners', pt: 'Ar condicionado' },
  'Kühlboxen und Kühltaschen': { en: 'Cool boxes & bags', pt: 'Geleiras e sacos térmicos' },
  'Heizgeräte': { en: 'Heaters', pt: 'Aquecedores' },
  'Kühlschränke': { en: 'Fridges', pt: 'Frigoríficos' },
  'Wasser': { en: 'Water', pt: 'Água' },
  'Klima-Steuerung': { en: 'Climate control', pt: 'Controlo de clima' },
  'Reinigung, Pflege und Reparatur': { en: 'Cleaning, care & repair', pt: 'Limpeza, cuidado e reparação' },
  'Ersatzteile Wasser und Sanitär': { en: 'Spare parts water & sanitary', pt: 'Peças para água e sanitários' },
  'Energieversorgung': { en: 'Power supply', pt: 'Energia' },
  'Sicherheit': { en: 'Security', pt: 'Segurança' },
  'SAT Anlagen, Antennen und Internet': { en: 'Satellite, antennas & internet', pt: 'Satélite, antenas e internet' },
  'TV und Audio': { en: 'TV & audio', pt: 'TV e áudio' },
  'TV-Sat Pakete': { en: 'TV & satellite bundles', pt: 'Pacotes TV e satélite' },
  'Navigation und Kamerasysteme': { en: 'Navigation & cameras', pt: 'Navegação e câmaras' },
  'Standsicherung und Stabilisierung': { en: 'Levelling & stabilising', pt: 'Nivelamento e estabilização' },
  'Transport': { en: 'Transport', pt: 'Transporte' },
  'Kleben und Dichten': { en: 'Adhesives & sealants', pt: 'Colas e vedantes' },
  'Pakete und Sets': { en: 'Bundles & sets', pt: 'Pacotes e conjuntos' },
  'Fahrerhaus-Ausstattung': { en: 'Cab equipment', pt: 'Equipamento da cabine' },
  'Ersatzteile Elektro und Multimedia': { en: 'Spare parts electrics & multimedia', pt: 'Peças para eletricidade e multimédia' },
  'Ersatzteile Kühlen und Heizen': { en: 'Spare parts cooling & heating', pt: 'Peças para frio e aquecimento' },
  'Ersatzteile Grillen, Kochen und Haushalt': { en: 'Spare parts barbecue, cooking & household', pt: 'Peças para grelhar, cozinhar e casa' },
  'Ersatzteile Fahrzeugtechnik': { en: 'Spare parts vehicle technology', pt: 'Peças para técnica do veículo' }
};

// Übersetzungen aller tieferen Kategorien (Deutsch → en/pt); Modellnamen bleiben unverändert
const CAT_I18N = JSON.parse(fs.readFileSync(path.join(__dirname, 'category-i18n.json'), 'utf8'));

// Kategorienamen aus dem Import säubern: „…]Export Spare Parts“ entfernen
function cleanName(s) { return s.replace(/\]?\s*Export Spare Parts\s*$/i, '').replace(/\]\s*$/, '').replace(/\s+/g, ' ').trim(); }
function translate(name) {
  if (CAT_I18N[name]) return CAT_I18N[name];
  if (/ ab | bis /.test(name)) {   // Modellnamen: nur „ab“/„bis“ übersetzen
    return { en: name.replace(/ ab /g, ' from ').replace(/ bis /g, ' to '), pt: name.replace(/ ab /g, ' a partir de ').replace(/ bis /g, ' até ') };
  }
  return null;
}

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
      const name = cleanName(p.cat[i]);
      cats[id] = { id: id, name: name, parent: parent, count: 0 };
      const tr = (i === 0 && TOP_I18N[name]) || (i === 1 && SUB_I18N[name]) || translate(name);
      if (tr) cats[id].i18n = tr;
    }
    cats[id].count++;
    parent = id;
  }
  const attrs = Object.assign({}, p.attrs);
  const w = kg(attrs['Gewicht']);
  // Camping-Profi-Kürzel im Namen, z. B. „(S)“ = Speditionsware, „(R)“ = Restposten → als Flags speichern, aus dem Namen entfernen
  const flags = [];
  const name = p.name.replace(/\s*\(([A-Z])\)/g, function (_, f) { if (flags.indexOf(f) < 0) flags.push(f); return ''; }).replace(/\s+/g, ' ').trim();
  products[p.id] = {
    n: name || p.name,
    f: flags.length ? flags.join('') : undefined,
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
