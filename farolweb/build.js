// FarolWeb Demo-Generator: node build.js  → liest leads.json, schreibt out/<slug>.html
// Nur echte Daten eintragen. Felder ohne Wert werden auf der Seite einfach weggelassen.
const fs = require('fs'), path = require('path');
const leads = JSON.parse(fs.readFileSync(process.argv[2] || path.join(__dirname, 'leads.json'), 'utf8'));

const THEMES = {
  restaurant: { a: '#1d4e89', b: '#b5502b', bg: '#fbf6ec', icon: '🍽️' },
  cafe:       { a: '#6b3e26', b: '#c8873a', bg: '#fbf5ee', icon: '☕' },
  auto:       { a: '#1f2a37', b: '#e5672a', bg: '#f4f5f7', icon: '🔧' },
  beauty:     { a: '#7a3b5c', b: '#c9a24b', bg: '#fbf6f7', icon: '✂️' },
  home:       { a: '#155e63', b: '#e0a526', bg: '#f3f7f6', icon: '🏠' },
};

const TXT = {
  pt: {
    demo: 'Demo · Proposta de website da <b>FarolWeb</b> — não é o site oficial',
    call: 'Ligar agora', mail: 'Enviar email', find: 'Como chegar',
    svcK: { restaurant: 'Especialidades', cafe: 'Da nossa vitrine', other: 'Serviços' },
    svcH: { restaurant: 'O que se come aqui', cafe: 'O que servimos', other: 'Como podemos ajudar' },
    contactK: 'Contacto', contactH: 'Fale connosco',
    hours: 'Horário', foot: 'Demo criada por FarolWeb', bCall: 'Ligar', bMap: 'Mapa', bMail: 'Email',
  },
  en: {
    demo: 'Demo · Website proposal by <b>FarolWeb</b> — not the official site',
    call: 'Call now', mail: 'Send email', find: 'Get directions',
    svcK: { restaurant: 'Specialities', cafe: 'From our counter', other: 'Services' },
    svcH: { restaurant: 'What to eat here', cafe: 'What we serve', other: 'How we can help' },
    contactK: 'Contact', contactH: 'Get in touch',
    hours: 'Opening hours', foot: 'Demo created by FarolWeb', bCall: 'Call', bMap: 'Map', bMail: 'Email',
  },
};

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const tel = p => '+351' + String(p).replace(/\D/g, '').replace(/^351/, '');

function page(L) {
  const th = THEMES[L.theme] || THEMES.home;
  const kind = ['restaurant', 'cafe'].includes(L.theme) ? L.theme : 'other';
  const q = encodeURIComponent([L.name, L.address, L.city].filter(Boolean).join(', '));
  const t = l => JSON.stringify(TXT[l]).replace(/</g, '\\u003c');
  const items = (L.items || []).map(i => `<div class="card"><h3 data-pt="${esc(i.pt)}" data-en="${esc(i.en || i.pt)}"></h3>${i.descPt ? `<p data-pt="${esc(i.descPt)}" data-en="${esc(i.descEn || i.descPt)}"></p>` : ''}</div>`).join('');
  const hours = (L.hours || []).map(h => `<div><span data-pt="${esc(h.pt)}" data-en="${esc(h.en || h.pt)}"></span><span data-pt="${esc(h.timePt)}" data-en="${esc(h.timeEn || h.timePt)}"></span></div>`).join('');
  return `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(L.name)} · ${esc(L.city)}</title><meta name="robots" content="noindex">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{--a:${th.a};--b:${th.b};--bg:${th.bg};--ink:#1f2328;--mute:#5b6470;--line:#e2ddd3}
*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--ink);line-height:1.6}
h1,h2,h3{font-family:Fraunces,Georgia,serif;color:var(--a);line-height:1.15}
.w{max-width:980px;margin:0 auto;padding:0 20px}
.demo{background:var(--ink);color:#fff;font-size:13px;text-align:center;padding:8px 16px}.demo b{color:#f0b429}
header{background:#fff;border-bottom:4px solid var(--a)}header .w{display:flex;justify-content:space-between;align-items:center;padding-top:12px;padding-bottom:12px;gap:12px}
.logo{font-family:Fraunces,serif;font-weight:700;font-size:19px;color:var(--a)}.logo small{display:block;font:600 11px Inter,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--b)}
.lg button{border:1px solid var(--line);background:#fff;border-radius:6px;padding:5px 9px;font:600 12px Inter;cursor:pointer;color:var(--mute)}.lg button[aria-pressed=true]{background:var(--a);color:#fff;border-color:var(--a)}
.hero{padding:56px 0;background:#fff}.ic{font-size:44px}.hero h1{font-size:clamp(34px,6vw,56px);margin:10px 0 14px}.hero p{font-size:18px;color:var(--mute);max-width:36em;margin-bottom:24px}
.btns{display:flex;flex-wrap:wrap;gap:10px}.btn{text-decoration:none;font-weight:600;border-radius:10px;padding:12px 20px}.p{background:var(--a);color:#fff}.s{background:#fff;border:1px solid var(--line);color:var(--a)}
section{padding:56px 0}.k{font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--b);margin-bottom:6px}section h2{font-size:clamp(26px,4vw,36px);margin-bottom:18px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px}.card{background:#fff;border-radius:12px;padding:20px;border-top:4px solid var(--b)}.card h3{font-size:19px}.card p{font-size:14.5px;color:var(--mute);margin-top:4px}
.ct{display:grid;grid-template-columns:1fr 1.2fr;gap:28px}.box{background:#fff;border:1px solid var(--line);border-radius:12px;padding:20px}.box p{margin-bottom:8px}.box a{color:var(--a)}
.hr div{display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-bottom:1px solid var(--line);font-size:15px}
.map{border-radius:12px;overflow:hidden;border:1px solid var(--line);min-height:300px}.map iframe{width:100%;height:100%;min-height:300px;border:0}
footer{background:var(--a);color:#fff;padding:28px 0 100px;font-size:14px;opacity:.97}
.bar{position:fixed;left:0;right:0;bottom:0;display:none;grid-template-columns:repeat(3,1fr);background:#fff;border-top:1px solid var(--line);padding-bottom:env(safe-area-inset-bottom)}
.bar a{text-align:center;padding:12px 4px;text-decoration:none;font-weight:600;font-size:13px;color:var(--a)}.bar a:first-child{background:var(--a);color:#fff}
@media(max-width:760px){.ct{grid-template-columns:1fr}.bar{display:grid}.hero{padding:36px 0}section{padding:44px 0}.w{padding:0 16px}.btns .btn{flex:1;text-align:center}}
@media(min-width:761px){footer{padding-bottom:28px}}
</style></head><body>
<div class="demo" data-t="demo"></div>
<header><div class="w"><div class="logo">${esc(L.name)}<small>${esc(L.category || '')} · ${esc(L.city)}</small></div>
<div class="lg"><button data-l="pt">PT</button> <button data-l="en">EN</button></div></div></header>
<div class="hero"><div class="w"><div class="ic">${th.icon}</div>
<h1 data-pt="${esc(L.headlinePt)}" data-en="${esc(L.headlineEn || L.headlinePt)}"></h1>
<p data-pt="${esc(L.leadPt)}" data-en="${esc(L.leadEn || L.leadPt)}"></p>
<div class="btns">${L.phone ? `<a class="btn p" href="tel:${tel(L.phone)}">📞 <span data-t="call"></span></a>` : ''}${L.email ? `<a class="btn s" href="mailto:${esc(L.email)}">✉️ <span data-t="mail"></span></a>` : ''}</div></div></div>
${items ? `<section><div class="w"><p class="k" data-t="svcK.${kind}"></p><h2 data-t="svcH.${kind}"></h2><div class="cards">${items}</div></div></section>` : ''}
<section style="background:#fff"><div class="w"><p class="k" data-t="contactK"></p><h2 data-t="contactH"></h2><div class="ct"><div class="box">
${L.address ? `<p>📍 ${esc(L.address)}${L.city ? ', ' + esc(L.city) : ''}</p>` : `<p>📍 ${esc(L.city)}</p>`}
${L.phone ? `<p>📞 <a href="tel:${tel(L.phone)}">${esc(L.phone)}</a></p>` : ''}${L.email ? `<p>✉️ <a href="mailto:${esc(L.email)}">${esc(L.email)}</a></p>` : ''}
${hours ? `<h3 style="font-size:17px;margin:14px 0 6px" data-t="hours"></h3><div class="hr">${hours}</div>` : ''}
</div><div class="map"><iframe loading="lazy" title="Mapa" src="https://www.google.com/maps?q=${q}&output=embed"></iframe></div></div></div></section>
<footer><div class="w"><b>${esc(L.name)}</b> · ${esc(L.city)}<br><span data-t="foot"></span></div></footer>
<nav class="bar">${L.phone ? `<a href="tel:${tel(L.phone)}" data-t="bCall"></a>` : `<a href="mailto:${esc(L.email)}" data-t="bMail"></a>`}<a href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank" rel="noopener" data-t="bMap"></a>${L.email && L.phone ? `<a href="mailto:${esc(L.email)}" data-t="bMail"></a>` : '<a href="#" data-t="contactK"></a>'}</nav>
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

for (const L of leads) {
  const f = path.join(__dirname, 'demos', slug(L.name + '-' + L.city) + '.html');
  fs.writeFileSync(f, page(L));
  console.log('✔', path.basename(f));
}
