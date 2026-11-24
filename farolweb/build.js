// FarolWeb Demo-Generator: node build.js leads/X.json → schreibt demos/<slug>.html
// Nur echte Daten eintragen. Felder ohne Wert werden auf der Seite weggelassen.
const fs = require('fs'), path = require('path');

const THEMES = {
  restaurant: { a: '#16365f', a2: '#1d4e89', b: '#c4552c', bg: '#fbf6ec', soft: '#eef3fa' },
  cafe:       { a: '#4a2a1a', a2: '#6b3e26', b: '#d08a3c', bg: '#fbf5ee', soft: '#f6ece2' },
  auto:       { a: '#141c26', a2: '#243243', b: '#f06a2a', bg: '#f3f4f6', soft: '#e9edf2' },
  beauty:     { a: '#4f2340', a2: '#7a3b5c', b: '#d4a64e', bg: '#fbf6f7', soft: '#f6e9ef' },
  home:       { a: '#0f4549', a2: '#155e63', b: '#f0b429', bg: '#f3f7f6', soft: '#e3efee' },
};

// Muster für den Hero (SVG als data-URI, weiß halbtransparent)
const PAT = {
  azulejo: `<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56'><g fill='none' stroke='white' stroke-opacity='.13' stroke-width='2'><circle cx='28' cy='28' r='10'/><path d='M28 0v12M28 44v12M0 28h12M44 28h12'/><circle cx='0' cy='0' r='14'/><circle cx='56' cy='0' r='14'/><circle cx='0' cy='56' r='14'/><circle cx='56' cy='56' r='14'/></g></svg>`,
  dots: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><circle cx='3' cy='3' r='1.6' fill='white' fill-opacity='.14'/></svg>`,
  grid: `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><path d='M40 0H0v40' fill='none' stroke='white' stroke-opacity='.08' stroke-width='1.5'/></svg>`,
};
const patUrl = s => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;

// Große Illustrationen je Branche (eigene, einfache Vektorgrafiken)
const ART = {
  restaurant: `<svg viewBox="0 0 400 400"><circle cx="200" cy="200" r="185" fill="#fff"/><circle cx="200" cy="200" r="168" fill="none" stroke="#1d4e89" stroke-width="3" stroke-dasharray="5 9"/><circle cx="200" cy="200" r="140" fill="#f4efe3"/><g id="f"><path d="M100 160 Q195 122 290 160 Q195 192 100 160Z" fill="#9aa6b2"/><path d="M100 160 Q195 138 290 160" stroke="#5e6b78" stroke-width="3" fill="none"/><path d="M290 160 l28-18 -8 18 8 18z" fill="#7b8794"/><circle cx="117" cy="156" r="4" fill="#1f2328"/><g stroke="#3a3a3a" stroke-width="4" stroke-linecap="round" opacity=".5"><path d="M155 148 l12 22M195 142 l12 26M235 146 l12 22"/></g></g><use href="#f" transform="translate(0 44)"/><ellipse cx="270" cy="275" rx="44" ry="27" fill="#6ea04a"/><circle cx="256" cy="268" r="12" fill="#d9442b"/><circle cx="284" cy="280" r="10" fill="#d9442b"/><g fill="#e7c06a" stroke="#c99a3b" stroke-width="2"><ellipse cx="140" cy="282" rx="23" ry="17"/><ellipse cx="174" cy="296" rx="19" ry="14"/></g><path d="M300 200 a24 24 0 0 1 0 48z" fill="#f5d33f"/></svg>`,
  cafe: `<svg viewBox="0 0 400 400"><circle cx="200" cy="200" r="185" fill="#fff"/><ellipse cx="200" cy="300" rx="130" ry="28" fill="#eadfd2"/><path d="M110 170 h170 v70 a85 85 0 0 1 -170 0z" fill="#d08a3c"/><path d="M280 185 a35 35 0 1 1 0 60" fill="none" stroke="#d08a3c" stroke-width="16"/><ellipse cx="195" cy="170" rx="85" ry="16" fill="#6b3e26"/><g fill="none" stroke="#b9a79a" stroke-width="6" stroke-linecap="round"><path d="M165 140 q-12 -20 0 -40 q12 -20 0 -40"/><path d="M200 140 q-12 -20 0 -40 q12 -20 0 -40"/><path d="M235 140 q-12 -20 0 -40 q12 -20 0 -40"/></g></svg>`,
  auto: `<svg viewBox="0 0 400 400"><circle cx="200" cy="200" r="185" fill="#fff"/><path d="M70 250 l25 -60 q8 -18 28 -20 h150 q20 2 28 20 l30 60 v40 h-261z" fill="#f06a2a"/><path d="M115 190 l15 -35 h140 l18 35z" fill="#cfe3f5"/><rect x="60" y="245" width="280" height="45" rx="14" fill="#243243"/><circle cx="125" cy="292" r="30" fill="#141c26"/><circle cx="125" cy="292" r="12" fill="#c9d1db"/><circle cx="280" cy="292" r="30" fill="#141c26"/><circle cx="280" cy="292" r="12" fill="#c9d1db"/><g transform="rotate(-35 280 110)"><rect x="272" y="60" width="16" height="110" rx="6" fill="#8a96a3"/><path d="M262 60 a18 18 0 1 1 36 0 l-8 0 v-14 h-20 v14z" fill="#8a96a3"/></g></svg>`,
  beauty: `<svg viewBox="0 0 400 400"><circle cx="200" cy="200" r="185" fill="#fff"/><g transform="rotate(-20 200 200)"><circle cx="160" cy="290" r="34" fill="none" stroke="#7a3b5c" stroke-width="14"/><circle cx="240" cy="290" r="34" fill="none" stroke="#7a3b5c" stroke-width="14"/><path d="M172 258 L235 80 L248 86 L190 262z" fill="#b9c1c9"/><path d="M228 258 L165 80 L152 86 L210 262z" fill="#d4dbe2"/><circle cx="200" cy="200" r="7" fill="#d4a64e"/></g><g fill="#d4a64e"><path d="M300 110 l6 14 14 6 -14 6 -6 14 -6 -14 -14 -6 14 -6z"/><path d="M95 150 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4z"/></g></svg>`,
  elec: `<svg viewBox="0 0 400 400"><circle cx="200" cy="200" r="185" fill="#fff"/><path d="M225 50 L120 220 h70 l-25 130 L285 170 h-72z" fill="#f0b429" stroke="#c98d0c" stroke-width="5" stroke-linejoin="round"/></svg>`,
  plumb: `<svg viewBox="0 0 400 400"><circle cx="200" cy="200" r="185" fill="#fff"/><path d="M70 130 h150 a40 40 0 0 1 40 40 v40" fill="none" stroke="#155e63" stroke-width="34"/><rect x="230" y="205" width="60" height="26" rx="6" fill="#0f4549"/><path d="M260 250 c-30 45 -30 70 0 70 c30 0 30 -25 0 -70z" fill="#4fb3d9"/><rect x="60" y="105" width="22" height="50" rx="5" fill="#0f4549"/></svg>`,
  gas: `<svg viewBox="0 0 400 400"><circle cx="200" cy="200" r="185" fill="#fff"/><path d="M200 70 c40 60 90 95 90 160 a90 90 0 0 1 -180 0 c0 -45 30 -70 45 -100 c10 30 25 40 35 45 c-5 -40 0 -75 10 -105z" fill="#f06a2a"/><path d="M200 200 c20 30 45 45 45 75 a45 45 0 0 1 -90 0 c0 -30 25 -45 45 -75z" fill="#f0b429"/></svg>`,
  clean: `<svg viewBox="0 0 400 400"><circle cx="200" cy="200" r="185" fill="#fff"/><rect x="150" y="170" width="100" height="150" rx="22" fill="#155e63"/><rect x="175" y="120" width="50" height="55" rx="8" fill="#0f4549"/><path d="M225 135 h45 l-10 20 h-35z" fill="#0f4549"/><rect x="165" y="215" width="70" height="60" rx="8" fill="#e3efee"/><g fill="#f0b429"><path d="M300 110 l7 16 16 7 -16 7 -7 16 -7 -16 -16 -7 16 -7z"/><path d="M110 140 l5 11 11 5 -11 5 -5 11 -5 -11 -11 -5 11 -5z"/><path d="M290 250 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4z"/></g></svg>`,
  home: `<svg viewBox="0 0 400 400"><circle cx="200" cy="200" r="185" fill="#fff"/><path d="M80 200 L200 95 L320 200" fill="none" stroke="#155e63" stroke-width="22" stroke-linejoin="round"/><rect x="115" y="195" width="170" height="125" fill="#155e63"/><rect x="180" y="245" width="40" height="75" fill="#f0b429"/></svg>`,
};

// Standard-Leistungen, wenn ein Lead keine eigenen hat (allgemein, keine Tatsachenbehauptungen)
const DEFAULT_ITEMS = {
  restaurant: [
    { i: '📞', pt: 'Reservas', en: 'Bookings', dpt: 'Ligue e reserve a sua mesa em segundos.', den: 'Call and book your table in seconds.' },
    { i: '🍽️', pt: 'Prato do dia', en: 'Dish of the day', dpt: 'Pergunte pelas sugestões da casa.', den: 'Ask for the house suggestions.' },
    { i: '📍', pt: 'Fácil de encontrar', en: 'Easy to find', dpt: 'Veja o mapa e venha visitar-nos.', den: 'Check the map and come and visit.' },
  ],
  auto: [
    { i: '🛠️', pt: 'Revisões', en: 'Servicing', dpt: 'Manutenção regular do seu carro.', den: 'Regular maintenance for your car.' },
    { i: '⚙️', pt: 'Mecânica', en: 'Mechanics', dpt: 'Reparações e diagnóstico.', den: 'Repairs and diagnostics.' },
    { i: '📞', pt: 'Marcações', en: 'Bookings', dpt: 'Ligue e marque já a sua visita.', den: 'Call to book your visit.' },
  ],
};
const ICONS = { auto: ['🛠️', '⚙️', '🔍'], beauty: ['✂️', '🎨', '💆'], home: ['🔧', '🛡️', '📋'], restaurant: ['🍽️', '🍷', '🥘'], cafe: ['☕', '🥐', '🍰'] };

const TXT = {
  pt: {
    demo: 'Demo · Proposta de website da <b>FarolWeb</b> — não é o site oficial',
    call: 'Ligar agora', mail: 'Enviar email', find: 'Como chegar',
    svcK: { restaurant: 'Bem-vindo', cafe: 'Bem-vindo', other: 'Serviços' },
    svcH: { restaurant: 'À sua mesa', cafe: 'O que servimos', other: 'Como podemos ajudar' },
    galK: 'Galeria', galH: 'Fotografias', galP: 'Aqui entram as vossas fotografias — tiramo-las nós, no local.',
    contactK: 'Contacto', contactH: 'Fale connosco', langs: 'PT · EN',
    hours: 'Horário', foot: 'Página de exemplo criada por FarolWeb · farolweb.pt', bCall: 'Ligar', bMap: 'Mapa', bMail: 'Email',
  },
  en: {
    demo: 'Demo · Website proposal by <b>FarolWeb</b> — not the official site',
    call: 'Call now', mail: 'Send email', find: 'Get directions',
    svcK: { restaurant: 'Welcome', cafe: 'Welcome', other: 'Services' },
    svcH: { restaurant: 'At your table', cafe: 'What we serve', other: 'How we can help' },
    galK: 'Gallery', galH: 'Photos', galP: 'Your photos go here — we take them on site.',
    contactK: 'Contact', contactH: 'Get in touch', langs: 'PT · EN',
    hours: 'Opening hours', foot: 'Example page created by FarolWeb · farolweb.pt', bCall: 'Call', bMap: 'Map', bMail: 'Email',
  },
};

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const tel = p => '+351' + String(p).replace(/\D/g, '').replace(/^351/, '');

function artKey(L) {
  const c = (L.category || '').toLowerCase();
  if (/el[eé]tric/.test(c)) return 'elec';
  if (/g[aá]s/.test(c)) return 'gas';
  if (/canaliz/.test(c)) return 'plumb';
  if (/limpez/.test(c)) return 'clean';
  return ART[L.theme] ? L.theme : 'home';
}

function page(L) {
  const th = THEMES[L.theme] || THEMES.home;
  const kind = ['restaurant', 'cafe'].includes(L.theme) ? L.theme : 'other';
  const pat = L.theme === 'restaurant' || L.theme === 'cafe' ? PAT.azulejo : L.theme === 'auto' ? PAT.grid : PAT.dots;
  const q = encodeURIComponent([L.name, L.address, L.city].filter(Boolean).join(', '));
  const t = l => JSON.stringify(TXT[l]).replace(/</g, '\\u003c');
  const icons = ICONS[L.theme] || ICONS.home;
  const items = (L.items && L.items.length ? L.items.map((x, n) => ({ i: icons[n % 3], pt: x.pt, en: x.en, dpt: x.descPt, den: x.descEn }))
    : DEFAULT_ITEMS[L.theme] || DEFAULT_ITEMS.restaurant);
  const cards = items.map(i => `<div class="card"><div class="ci">${i.i}</div><h3 data-pt="${esc(i.pt)}" data-en="${esc(i.en || i.pt)}"></h3>${i.dpt ? `<p data-pt="${esc(i.dpt)}" data-en="${esc(i.den || i.dpt)}"></p>` : ''}</div>`).join('');
  const hours = (L.hours || []).map(h => `<div><span data-pt="${esc(h.pt)}" data-en="${esc(h.en || h.pt)}"></span><span data-pt="${esc(h.timePt)}" data-en="${esc(h.timeEn || h.timePt)}"></span></div>`).join('');
  const city = esc(String(L.city).split('(')[0].trim());
  return `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(L.name)} · ${esc(L.city)}</title><meta name="robots" content="noindex">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--a:${th.a};--a2:${th.a2};--b:${th.b};--bg:${th.bg};--soft:${th.soft};--ink:#1f2328;--mute:#5b6470;--line:#e2ddd3}
*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--ink);line-height:1.6;-webkit-font-smoothing:antialiased}
h1,h2,h3{font-family:Fraunces,Georgia,serif;line-height:1.1}
.w{max-width:1100px;margin:0 auto;padding:0 24px}
.demo{background:#111;color:#fff;font-size:13px;text-align:center;padding:8px 16px}.demo b{color:#f0b429}
header{position:absolute;left:0;right:0;z-index:5}header .w{display:flex;justify-content:space-between;align-items:center;padding-top:18px;gap:12px}
.logo{font-family:Fraunces,serif;font-weight:800;font-size:20px;color:#fff;letter-spacing:.2px}
.lg button{border:1px solid rgba(255,255,255,.35);background:transparent;border-radius:7px;padding:5px 10px;font:600 12px Inter;cursor:pointer;color:#fff}.lg button[aria-pressed=true]{background:#fff;color:var(--a)}
.hero{position:relative;background:var(--a) ${patUrl(pat)};background-image:${patUrl(pat)},linear-gradient(135deg,var(--a),var(--a2));color:#fff;overflow:hidden}
.hero .w{display:grid;grid-template-columns:1.15fr .85fr;gap:40px;align-items:center;padding-top:110px;padding-bottom:90px}
.tag{display:inline-flex;gap:8px;align-items:center;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:6px 14px;font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase}
.hero h1{font-size:clamp(42px,7vw,80px);font-weight:800;margin:18px 0 12px;color:#fff}
.hero h2{font:500 clamp(18px,2.2vw,24px)/1.4 Inter,sans-serif;color:rgba(255,255,255,.85);max-width:30em;margin-bottom:10px}
.hero p{color:rgba(255,255,255,.7);max-width:34em;margin-bottom:28px}
.btns{display:flex;flex-wrap:wrap;gap:12px}.btn{text-decoration:none;font-weight:700;border-radius:12px;padding:14px 22px;font-size:15px}
.p{background:var(--b);color:#fff;box-shadow:0 10px 24px rgba(0,0,0,.25)}.s{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.35);color:#fff}
.art{width:100%;max-width:380px;justify-self:center;filter:drop-shadow(0 25px 40px rgba(0,0,0,.35))}
.wave{display:block;width:100%;height:60px;margin-top:-1px}
.strip{margin-top:-34px;position:relative;z-index:2}.strip .w{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.chip{background:#fff;border-radius:14px;padding:16px 18px;box-shadow:0 8px 26px rgba(0,0,0,.08);display:flex;gap:12px;align-items:center;font-weight:600}
.chip span{font-size:22px}.chip small{display:block;font-weight:500;color:var(--mute);font-size:13px}
section{padding:80px 0}.k{font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--b);margin-bottom:8px}section h2{font-size:clamp(30px,4.4vw,46px);color:var(--a);margin-bottom:24px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:18px}
.card{background:#fff;border-radius:18px;padding:28px;box-shadow:0 6px 22px rgba(0,0,0,.06);transition:transform .2s}.card:hover{transform:translateY(-4px)}
.ci{width:54px;height:54px;border-radius:14px;background:var(--soft);display:grid;place-items:center;font-size:26px;margin-bottom:16px}
.card h3{font-size:22px;color:var(--a)}.card p{color:var(--mute);margin-top:6px}
.gal{background:var(--soft)}.grid{display:grid;grid-template-columns:2fr 1fr 1fr;grid-template-rows:170px 170px;gap:14px}
.ph{border-radius:16px;background:var(--a2) ${patUrl(pat)};background-image:${patUrl(pat)},linear-gradient(135deg,var(--a2),var(--a));display:grid;place-items:center;color:rgba(255,255,255,.75);font-size:34px}
.ph:first-child{grid-row:span 2;font-size:54px}.galp{color:var(--mute);margin:-10px 0 22px}
.ct{display:grid;grid-template-columns:1fr 1.3fr;gap:24px;align-items:stretch}
.box{background:var(--a);color:#fff;border-radius:18px;padding:30px}.box h3{font-size:26px;margin-bottom:18px}
.row{display:flex;gap:14px;align-items:center;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.15)}.row:last-of-type{border:0}.row span{font-size:20px}.row a{color:#fff}
.box .btn{display:block;text-align:center;margin-top:20px}
.hr div{display:flex;justify-content:space-between;gap:10px;padding:6px 0;font-size:15px}
.map{border-radius:18px;overflow:hidden;min-height:360px;box-shadow:0 6px 22px rgba(0,0,0,.08)}.map iframe{width:100%;height:100%;min-height:360px;border:0;display:block}
footer{background:#111;color:#aab;padding:30px 0 100px;font-size:14px}footer b{color:#fff}
.bar{position:fixed;left:0;right:0;bottom:0;display:none;grid-template-columns:repeat(3,1fr);background:#fff;border-top:1px solid var(--line);z-index:20;padding-bottom:env(safe-area-inset-bottom)}
.bar a{text-align:center;padding:13px 4px;text-decoration:none;font-weight:700;font-size:13px;color:var(--a)}.bar a:first-child{background:var(--b);color:#fff}
@media(max-width:820px){.hero .w{grid-template-columns:1fr;padding-top:84px;padding-bottom:70px;gap:10px}.art{max-width:220px;order:-1}.strip .w{grid-template-columns:1fr}.ct{grid-template-columns:1fr}.bar{display:grid}section{padding:56px 0}.grid{grid-template-columns:1fr 1fr;grid-template-rows:140px 140px 140px}.ph:first-child{grid-column:span 2;grid-row:auto}}
@media(max-width:480px){.w{padding:0 16px}.btns .btn{flex:1;text-align:center}}
@media(min-width:821px){footer{padding-bottom:30px}}
</style></head><body>
<div class="demo" data-t="demo"></div>
<div style="position:relative"><header><div class="w"><div class="logo">${esc(L.name)}</div>
<div class="lg"><button data-l="pt">PT</button> <button data-l="en">EN</button></div></div></header>
<div class="hero"><div class="w"><div>
<span class="tag">📍 ${esc(L.category || '')} · ${city}</span>
<h1>${esc(L.name)}</h1>
<h2 data-pt="${esc(L.headlinePt)}" data-en="${esc(L.headlineEn || L.headlinePt)}"></h2>
<p data-pt="${esc(L.leadPt)}" data-en="${esc(L.leadEn || L.leadPt)}"></p>
<div class="btns">${L.phone ? `<a class="btn p" href="tel:${tel(L.phone)}">📞 <span data-t="call"></span></a>` : ''}<a class="btn s" href="#contacto">📍 <span data-t="find"></span></a></div></div>
<div class="art">${ART[artKey(L)]}</div></div>
<svg class="wave" viewBox="0 0 1440 60" preserveAspectRatio="none"><path d="M0 60 C360 0 1080 0 1440 60Z" fill="${th.bg}"/></svg></div></div>
<div class="strip"><div class="w">
${L.phone ? `<a class="chip" href="tel:${tel(L.phone)}" style="text-decoration:none;color:inherit"><span>📞</span><div>${esc(L.phone)}<small data-t="bCall"></small></div></a>` : ''}
<div class="chip"><span>📍</span><div>${city}<small>${esc(L.category || '')}</small></div></div>
<div class="chip"><span>🌍</span><div data-t="langs"></div></div></div></div>
<section><div class="w"><p class="k" data-t="svcK.${kind}"></p><h2 data-t="svcH.${kind}"></h2><div class="cards">${cards}</div></div></section>
<section class="gal"><div class="w"><p class="k" data-t="galK"></p><h2 data-t="galH"></h2><p class="galp" data-t="galP"></p>
<div class="grid"><div class="ph">📷</div><div class="ph">📷</div><div class="ph">📷</div><div class="ph">📷</div><div class="ph">📷</div></div></div></section>
<section id="contacto"><div class="w"><p class="k" data-t="contactK"></p><h2 data-t="contactH"></h2><div class="ct"><div class="box"><h3>${esc(L.name)}</h3>
<div class="row"><span>📍</span><div>${L.address ? esc(L.address) + ', ' : ''}${esc(L.city)}</div></div>
${L.phone ? `<div class="row"><span>📞</span><a href="tel:${tel(L.phone)}">${esc(L.phone)}</a></div>` : ''}
${L.email ? `<div class="row"><span>✉️</span><a href="mailto:${esc(L.email)}">${esc(L.email)}</a></div>` : ''}
${hours ? `<h3 style="font-size:18px;margin:16px 0 4px" data-t="hours"></h3><div class="hr">${hours}</div>` : ''}
${L.phone ? `<a class="btn p" href="tel:${tel(L.phone)}">📞 <span data-t="call"></span></a>` : ''}
</div><div class="map"><iframe loading="lazy" title="Mapa" src="https://www.google.com/maps?q=${q}&output=embed"></iframe></div></div></div></section>
<footer><div class="w"><b>${esc(L.name)}</b> · ${esc(L.city)}<br><span data-t="foot"></span></div></footer>
<nav class="bar">${L.phone ? `<a href="tel:${tel(L.phone)}" data-t="bCall"></a>` : `<a href="mailto:${esc(L.email)}" data-t="bMail"></a>`}<a href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank" rel="noopener" data-t="bMap"></a>${L.email && L.phone ? `<a href="mailto:${esc(L.email)}" data-t="bMail"></a>` : '<a href="#contacto" data-t="contactK"></a>'}</nav>
<script>
const T={pt:${t('pt')},en:${t('en')}};
function set(l){document.documentElement.lang=l;const t=T[l];
document.querySelectorAll('[data-t]').forEach(e=>{e.innerHTML=e.dataset.t.split('.').reduce((o,k)=>o[k],t)});
document.querySelectorAll('[data-pt]').forEach(e=>{e.textContent=e.dataset[l]||e.dataset.pt});
document.querySelectorAll('.lg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.l===l))}
document.querySelectorAll('.lg button').forEach(b=>b.onclick=()=>set(b.dataset.l));
set((navigator.language||'pt').startsWith('pt')?'pt':'en');
</script></body></html>`;
}

module.exports = { page, slug };
if (require.main === module) {
  const leads = JSON.parse(fs.readFileSync(process.argv[2] || path.join(__dirname, 'leads.json'), 'utf8'));
  for (const L of leads) {
    const f = path.join(__dirname, 'demos', slug(L.name + '-' + L.city) + '.html');
    fs.writeFileSync(f, page(L));
    console.log('✔', path.basename(f));
  }
}
