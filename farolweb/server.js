/* FarolWeb – Demo-Server + Kalt-Akquise (nach dem Vorbild von Carrango).
   - /d/<token>   private Demo-Seite je Lead (noindex). Erster Aufruf → Admin-Mail „Bom momento para ligar“.
   - Warteschlange: täglich höchstens BATCH_SIZE Einladungen (Mo–Fr, 9–18 Uhr Lissabon) über Resend.
   - Nie doppelt: bereits Angeschriebene (Upstash-Set) und «remover»-Abmeldungen werden übersprungen.
   - Testbetrieb: Ohne MAIL_ECHT=1 wird nichts gesendet, nur protokolliert (wie Carrango).
   - /admin       Übersicht (Basic-Auth) + Abmeldung eintragen.
   Keine Abhängigkeiten außer Node ≥ 18. */
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const { page } = require('./build.js');

const PORT = process.env.PORT || 4700;
const BASE_URL = String(process.env.BASE_URL || 'https://demo.farolweb.pt').trim().replace(/\/$/, '');
const RESEND_API_KEY = String(process.env.RESEND_API_KEY || '').trim();
const EMAIL_FROM = process.env.EMAIL_FROM || 'FarolWeb <ola@farolweb.pt>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';          // bekommt Antworten (reply_to) + Hinweise
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';    // leer = Admin deaktiviert
const TOKEN_SECRET = String(process.env.TOKEN_SECRET || '').trim();        // nötig für stabile Demo-Links
const MAIL_ECHT = process.env.MAIL_ECHT === '1';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '20', 10);
const FOLLOW_SIZE = parseInt(process.env.FOLLOW_SIZE || '20', 10);   // Nachfass-Mails pro Tag
const UP_URL = String(process.env.UPSTASH_REDIS_REST_URL || '').trim().replace(/\/$/, '');
const UP_TOKEN = String(process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
const PHONE = '+351 933 917 633', WA = '351933917633';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const norm = e => String(e || '').trim().toLowerCase();

// ---------- Leads laden (CSV = Quelle/Sicherheit, JSON = Seiteninhalt) ----------
function loadLeads() {
  const dir = path.join(__dirname, 'leads');
  const pages = {};
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json')))
    for (const L of JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))) if (L.email) pages[norm(L.email)] = L;
  const rows = fs.readFileSync(path.join(dir, 'alle-leads.csv'), 'utf8').trim().split('\n').slice(1).map(l => l.split(';'));
  const leads = [];
  for (const [datum, name, ort, branche, email, tel, quelle, status] of rows) {
    const e = norm(email); if (!e || !pages[e]) continue;
    leads.push({ datum, email: e, quelle, hoch: /hoch/.test(status || ''), L: pages[e], token: token(e) });
  }
  leads.sort((a, b) => (b.hoch - a.hoch) || a.datum.localeCompare(b.datum)); // sichere Leads zuerst
  const blocked = new Set(fs.readFileSync(path.join(dir, 'abmeldungen.csv'), 'utf8').trim().split('\n').slice(1).map(l => norm(l.split(';')[1])).filter(Boolean));
  return { leads, byToken: Object.fromEntries(leads.map(x => [x.token, x])), blocked };
}
const token = e => TOKEN_SECRET ? crypto.createHmac('sha256', TOKEN_SECRET).update(e).digest('hex').slice(0, 20) : '';
let DATA = loadLeads();

// ---------- Zustand: Upstash Redis (dauerhaft) ----------
async function redis(...cmd) {
  if (!UP_URL) throw new Error('Upstash nicht konfiguriert');
  const r = await fetch(UP_URL, { method: 'POST', headers: { Authorization: 'Bearer ' + UP_TOKEN, 'content-type': 'application/json' }, body: JSON.stringify(cmd) });
  if (!r.ok) throw new Error('redis ' + r.status);
  return (await r.json()).result;
}

// ---------- E-Mail ----------
async function sendEmail(to, subject, html) {
  if (!RESEND_API_KEY) { console.warn('E-Mail übersprungen: RESEND_API_KEY fehlt'); return false; }
  if (!MAIL_ECHT) { console.log('[Testbetrieb] NICHT gesendet an ' + to + ' — ' + subject); return true; }
  const body = { from: EMAIL_FROM, to, subject, html };
  if (ADMIN_EMAIL) body.reply_to = ADMIN_EMAIL;
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) { console.error('Resend', r.status, await r.text()); return false; }
  return true;
}

function footer(x) {
  const rest = x.L.theme === 'restaurant' || x.L.theme === 'cafe';
  const host = (() => { try { return new URL(x.quelle).hostname.replace(/^www\./, ''); } catch { return 'diretórios online'; } })();
  return `<p style="color:#9aa7b4;font-size:11px;margin-top:22px;border-top:1px solid #eee;padding-top:10px">Recebeu este email por ser ${rest ? 'um restaurante' : 'uma empresa local'} em Portugal sem site próprio (contacto publicado em ${esc(host)}). Se não pretende receber mais mensagens, responda com «remover» e deixamos de o contactar.</p>`;
}
const SIGN = `<p style="margin-top:18px">Cumprimentos,<br>Carsten<br>FarolWeb · ${PHONE} · <a href="https://farolweb.pt">farolweb.pt</a></p>`;
const WRAP = b => `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222;max-width:560px">${b}</body></html>`;

function inviteSubject(x) { return `${x.L.name}: fiz-lhe um site de exemplo (grátis)`; }
function inviteEmail(x) {
  const n = esc(x.L.name), link = `${BASE_URL}/d/${x.token}`;
  return WRAP(`<p>Olá,</p>
<p>Procurei ${n} no Google e só encontrei diretórios e redes sociais — ainda não há um site próprio.</p>
<p>Por isso fiz-lhe um exemplo, já com o vosso nome, telefone e mapa:<br>
👉 <a href="${link}" style="font-weight:bold">${link.replace(/^https:\/\//, '')}</a></p>
<p>É privado e gratuito. Funciona no telemóvel, em português, inglês e alemão. Se gostar, ponho-o online em poucos dias; se não, não há compromisso nenhum.</p>
<p>Basta responder a este email ou ligar.</p>${SIGN}${footer(x)}`);
}
function followSubject(x) { return `Re: ${inviteSubject(x)}`; }
function followEmail(x) {
  const n = esc(x.L.name), link = `${BASE_URL}/d/${x.token}`;
  return WRAP(`<p>Olá,</p>
<p>Só para confirmar se recebeu o exemplo de site que fiz para ${n} há uns dias:<br>
👉 <a href="${link}" style="font-weight:bold">${link.replace(/^https:\/\//, '')}</a></p>
<p>Demora 30 segundos a ver no telemóvel. Se não tiver interesse, sem problema — não volto a escrever.</p>${SIGN}${footer(x)}`);
}

// ---------- Warteschlange (1 Schub pro Tag, Mo–Fr 9–18 h Lissabon) ----------
function lisbonNow() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Lisbon', weekday: 'short', hour: '2-digit', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, wd: p.weekday, h: +p.hour };
}
let running = false;
async function processQueue() {
  if (running || !RESEND_API_KEY || !UP_URL || !TOKEN_SECRET) return;
  const t = lisbonNow();
  if (['Sat', 'Sun'].includes(t.wd) || t.h < 9 || t.h >= 18) return;
  running = true;
  try {
    if ((await redis('GET', 'fw:last_batch_day')) === t.day) return;       // heute schon ein Schub
    DATA = loadLeads();
    let sent = 0;
    for (const x of DATA.leads) {
      if (sent >= BATCH_SIZE) break;
      if (DATA.blocked.has(x.email) || await redis('SISMEMBER', 'fw:blocked', x.email)) continue;
      if (await redis('SISMEMBER', 'fw:sent', x.email)) continue;
      const ok = await sendEmail(x.email, inviteSubject(x), inviteEmail(x));
      if (ok && MAIL_ECHT) { await redis('SADD', 'fw:sent', x.email); await redis('HSET', 'fw:sent_at', x.email, Date.now()); sent++; }
      await new Promise(r => setTimeout(r, 400));
    }
    // Nachfass-Mail: einmalig, frühestens 4 Tage nach der Einladung, nur wenn die Demo nicht geöffnet wurde
    let follow = 0;
    for (const x of DATA.leads) {
      if (follow >= FOLLOW_SIZE) break;
      const at = parseInt(await redis('HGET', 'fw:sent_at', x.email) || '0', 10);
      if (!at || Date.now() - at < 4 * 86400000) continue;
      if (DATA.blocked.has(x.email) || await redis('SISMEMBER', 'fw:blocked', x.email)) continue;
      if (await redis('SISMEMBER', 'fw:followed', x.email)) continue;
      if (await redis('HGET', 'fw:views', x.email)) continue;
      const ok = await sendEmail(x.email, followSubject(x), followEmail(x));
      if (ok && MAIL_ECHT) { await redis('SADD', 'fw:followed', x.email); follow++; }
      await new Promise(r => setTimeout(r, 400));
    }
    await redis('SET', 'fw:last_batch_day', t.day);
    const left = DATA.leads.length - (await redis('SCARD', 'fw:sent'));
    console.log(`Schub: ${sent} gesendet, ${follow} nachgefasst, noch ca. ${left} offen`);
    if ((sent || follow) && ADMIN_EMAIL) await sendEmail(ADMIN_EMAIL, `📤 FarolWeb: ${sent} Einladung(en), ${follow} Nachfass-Mail(s)`, `<p>Heute automatisch gesendet: <b>${sent}</b> Einladungen, <b>${follow}</b> Nachfass-Mails. Noch ca. <b>${left}</b> in der Warteschlange.</p><p><a href="${BASE_URL}/admin">Übersicht</a></p>`);
  } catch (e) { console.error('Warteschlange:', e.message); } finally { running = false; }
}
setInterval(() => processQueue(), 30 * 60 * 1000).unref();
setTimeout(() => processQueue(), 20 * 1000).unref();

// ---------- HTTP ----------
function authed(req) {
  if (!ADMIN_PASSWORD) return false;
  const [u, p] = Buffer.from(String(req.headers.authorization || '').replace(/^Basic /, ''), 'base64').toString().split(':');
  return u === ADMIN_USER && p === ADMIN_PASSWORD;
}
const CTA = `<a href="https://wa.me/${WA}?text=${encodeURIComponent('Olá! Vi a página de exemplo e quero saber mais.')}" target="_blank" rel="noopener" style="position:fixed;right:16px;bottom:84px;z-index:50;background:#25d366;color:#fff;font:600 15px Inter,Arial,sans-serif;text-decoration:none;padding:12px 18px;border-radius:999px;box-shadow:0 6px 20px rgba(0,0,0,.2)">💬 Quero este site</a>`;

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const send = (code, body, type = 'text/html; charset=utf-8', extra = {}) => { res.writeHead(code, { 'content-type': type, 'x-robots-tag': 'noindex, nofollow', ...extra }); res.end(body); };
  try {
    if (url.pathname === '/health') return send(200, 'ok', 'text/plain');
    if (url.pathname === '/robots.txt') return send(200, 'User-agent: *\nDisallow: /\n', 'text/plain');
    if (url.pathname === '/') return send(302, '', 'text/plain', { location: 'https://farolweb.pt' });

    const m = url.pathname.match(/^\/d\/([a-f0-9]{20})$/);
    if (m) {
      const x = DATA.byToken[m[1]];
      if (!x) return send(404, '<!doctype html><meta charset="utf-8"><p style="font-family:sans-serif;padding:30px">Esta pré-visualização já não está disponível. <a href="https://farolweb.pt">FarolWeb</a></p>');
      if (!authed(req) && UP_URL) {
        redis('HINCRBY', 'fw:views', x.email, 1).then(async n => {
          if (n === 1 && ADMIN_EMAIL) await sendEmail(ADMIN_EMAIL, `👀 ${x.L.name} abriu a pré-visualização`, `<p><b>${esc(x.L.name)}</b> (${esc(x.L.city)}) abriu agora a sua página de exemplo.</p><p>Bom momento para ligar${x.L.phone ? ': <b>' + esc(x.L.phone) + '</b>' : ''}.</p><p><a href="${BASE_URL}/d/${x.token}">Ver página</a></p>`);
        }).catch(() => {});
      }
      return send(200, page(x.L).replace('</body>', CTA + '</body>'), undefined, { 'cache-control': 'no-store' });
    }

    if (url.pathname.startsWith('/admin')) {
      if (!authed(req)) return send(401, 'Login nötig', 'text/plain', { 'www-authenticate': 'Basic realm="FarolWeb"' });
      if (req.method === 'POST' && url.pathname === '/admin/remover') {
        let b = ''; for await (const c of req) b += c;
        const e = norm(new URLSearchParams(b).get('email'));
        if (e) await redis('SADD', 'fw:blocked', e);
        return send(303, '', 'text/plain', { location: '/admin' });
      }
      DATA = loadLeads();
      const [sent, blocked, views] = UP_URL ? await Promise.all([redis('SMEMBERS', 'fw:sent'), redis('SMEMBERS', 'fw:blocked'), redis('HGETALL', 'fw:views')]) : [[], [], []];
      const S = new Set(sent), B = new Set([...blocked, ...DATA.blocked]), V = {};
      for (let i = 0; i < views.length; i += 2) V[views[i]] = views[i + 1];
      const rows = DATA.leads.map(x => `<tr><td>${esc(x.L.name)}</td><td>${esc(x.L.city)}</td><td>${esc(x.email)}</td><td>${x.hoch ? 'hoch' : 'mittel'}</td><td>${B.has(x.email) ? '⛔ abgemeldet' : S.has(x.email) ? '✅ gesendet' : '⏳ wartet'}</td><td>${V[x.email] || 0}</td><td><a href="/d/${x.token}" target="_blank">Demo</a></td></tr>`).join('');
      return send(200, `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FarolWeb Admin</title>
<style>body{font-family:system-ui,sans-serif;margin:20px;color:#222}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border-bottom:1px solid #ddd;padding:6px;text-align:left}.s{background:#f4f1ea;padding:10px 14px;border-radius:8px;margin-bottom:16px}</style>
<h1>FarolWeb · Akquise</h1><div class="s">Modus: <b>${MAIL_ECHT ? 'ECHT – Mails werden gesendet' : 'Testbetrieb – nichts wird gesendet'}</b> · ${BATCH_SIZE}/Tag (Mo–Fr 9–18 h) · Leads: ${DATA.leads.length} · gesendet: ${S.size} · abgemeldet: ${B.size}${UP_URL ? '' : ' · ⚠️ Upstash fehlt: Versand aus'}${TOKEN_SECRET ? '' : ' · ⚠️ TOKEN_SECRET fehlt'}</div>
<form method="post" action="/admin/remover"><b>«remover» erhalten:</b> <input name="email" type="email" placeholder="email@exemplo.pt" required> <button>Abmelden</button></form><br>
<table><tr><th>Name</th><th>Ort</th><th>E-Mail</th><th>Sicherheit</th><th>Status</th><th>Aufrufe</th><th></th></tr>${rows}</table>`);
    }
    send(404, 'Não encontrado', 'text/plain');
  } catch (e) { console.error(e); send(500, 'Erro', 'text/plain'); }
}).listen(PORT, () => console.log(`FarolWeb-Demo-Server auf :${PORT} · ${MAIL_ECHT ? 'ECHT' : 'Testbetrieb'} · ${DATA.leads.length} Leads`));
