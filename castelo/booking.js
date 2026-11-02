/* Terminbuchung: Kunden fragen einen Termin an (Leistung, Tag, Uhrzeit), der Betreiber bestätigt,
   schlägt einen anderen Termin vor oder sagt ab – jeweils mit E-Mail an den Kunden.
   Termine liegen in Upstash Redis (Hash castelo:bookings), ohne Upstash nur im Speicher bis zum Neustart.
   Freie Zeiten ergeben sich aus den Öffnungszeiten minus Feiertage, gesperrte Tage und schon belegte Zeiten. */
'use strict';
const crypto = require('crypto');

const UPSTASH_URL = (process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';
const KEY = 'castelo:bookings', BLOCKED = 'castelo:blocked-days';
const SITE = (process.env.SITE_URL || 'https://castelomotorhomesandcaravanrepairs.com').replace(/\/$/, '');

// Terminbeginn je Wochentag (0 = So … 6 = Sa); ein Termin = 1 Stunde, eine Buchung pro Zeit
const SLOTS = { 1: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'], 2: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
  3: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'], 4: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
  5: ['10:00', '11:00', '12:00'] };
const DAYS_AHEAD = 56;   // so weit im Voraus buchbar
const SERVICES = ['elektrik', 'gas', 'wasser', 'aufbau', 'solar', 'einbau', 'sonstiges'];
const SERVICE_DE = { elektrik: 'Elektrik 12 V / 230 V', gas: 'Gasanlage', wasser: 'Wasser / Sanitär', aufbau: 'Aufbau / Undichtigkeit',
  solar: 'Solar / Batterie', einbau: 'Einbau Zubehör', sonstiges: 'Sonstiges' };

// ---------------------------------------------------------------- Speicher
const mem = { bookings: {}, blocked: new Set() };
async function redis(cmds) {
  const r = await fetch(UPSTASH_URL + '/pipeline', {
    method: 'POST', headers: { Authorization: 'Bearer ' + UPSTASH_TOKEN, 'content-type': 'application/json' }, body: JSON.stringify(cmds)
  });
  if (!r.ok) throw new Error('Redis ' + r.status);
  return (await r.json()).map((x) => x.result);
}
async function all() {
  if (!UPSTASH_URL) return Object.values(mem.bookings);
  const r = (await redis([['HGETALL', KEY]]))[0] || [];
  const out = [];
  for (let i = 1; i < r.length; i += 2) { try { out.push(JSON.parse(r[i])); } catch (e) { /* kaputter Eintrag */ } }
  return out;
}
async function get(id) {
  if (!UPSTASH_URL) return mem.bookings[id] || null;
  const r = (await redis([['HGET', KEY, id]]))[0];
  return r ? JSON.parse(r) : null;
}
async function save(b) {
  if (!UPSTASH_URL) { mem.bookings[b.id] = b; return; }
  await redis([['HSET', KEY, b.id, JSON.stringify(b)]]);
}
async function blockedDays() {
  if (!UPSTASH_URL) return [...mem.blocked];
  return (await redis([['SMEMBERS', BLOCKED]]))[0] || [];
}
async function setBlocked(d, on) {
  if (!UPSTASH_URL) { if (on) mem.blocked.add(d); else mem.blocked.delete(d); return; }
  await redis([[on ? 'SADD' : 'SREM', BLOCKED, d]]);
}

// ---------------------------------------------------------------- Kalender
const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || '');
function lisbonToday() {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return p;   // en-CA liefert YYYY-MM-DD
}
function addDays(d, n) { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); }
function weekday(d) { return new Date(d + 'T12:00:00Z').getUTCDay(); }
function easter(y) {   // Gauß/Meeus – gregorianisch
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31),
    da = ((h + l - 7 * m + 114) % 31) + 1;
  return y + '-' + String(mo).padStart(2, '0') + '-' + String(da).padStart(2, '0');
}
// Portugiesische Feiertage + Betriebsferien 24.12.–1.1.
function holiday(d) {
  const y = +d.slice(0, 4), md = d.slice(5);
  if (['01-01', '04-25', '05-01', '06-10', '08-15', '10-05', '11-01', '12-01', '12-08', '12-25'].indexOf(md) >= 0) return true;
  if (md >= '12-24' || md === '01-01') return true;
  const e = easter(y);
  return d === addDays(e, -2) || d === e || d === addDays(e, 60);   // Karfreitag, Ostern, Fronleichnam
}
const ACTIVE = ['pending', 'confirmed', 'proposed'];
function taken(list) {
  const t = new Set();
  list.forEach((b) => {
    if (ACTIVE.indexOf(b.status) < 0) return;
    t.add(b.date + ' ' + b.time);
    if (b.status === 'proposed' && b.pDate) t.add(b.pDate + ' ' + b.pTime);
  });
  return t;
}
async function freeDays() {
  const [list, blocked] = await Promise.all([all(), blockedDays()]);
  const t = taken(list), bl = new Set(blocked), out = [];
  const start = addDays(lisbonToday(), 1);   // frühestens morgen
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = addDays(start, i), s = SLOTS[weekday(d)];
    if (!s || holiday(d) || bl.has(d)) continue;
    const free = s.filter((x) => !t.has(d + ' ' + x));
    if (free.length) out.push({ d: d, slots: free });
  }
  return out;
}
function validSlot(d, time) {
  return isDate(d) && (SLOTS[weekday(d)] || []).indexOf(time) >= 0 && !holiday(d);
}

// ---------------------------------------------------------------- Texte
const LOCALE = { de: 'de-DE', en: 'en-GB', pt: 'pt-PT' };
function when(lang, d, time) {
  const s = new Date(d + 'T12:00:00Z').toLocaleDateString(LOCALE[lang] || 'de-DE', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return s + ', ' + time + (lang === 'de' ? ' Uhr' : lang === 'pt' ? 'h' : '');
}
const SIGN = 'Castelo Motorhomes and Caravan Repairs<br>Areias de Pera 700A, 8365-201 Pêra · +351 920 323 532';
const MAILTX = {
  de: { hi: 'Hallo', recv_s: 'Ihre Terminanfrage', recv: 'vielen Dank für Ihre Terminanfrage. Wir prüfen sie und melden uns in Kürze mit einer Bestätigung.',
    want: 'Wunschtermin', conf_s: 'Termin bestätigt', conf: 'Ihr Termin ist bestätigt:', prop_s: 'Neuer Terminvorschlag',
    prop: 'leider passt Ihr Wunschtermin nicht. Wir schlagen Ihnen folgenden Termin vor:', accept: 'Termin annehmen',
    other: 'Passt das nicht? Antworten Sie einfach auf diese E-Mail oder schreiben Sie uns per WhatsApp.',
    canc_s: 'Termin abgesagt', canc: 'leider müssen wir Ihre Terminanfrage absagen:', cancel_link: 'Termin absagen',
    note: 'Nachricht der Werkstatt', see: 'Wir freuen uns auf Sie!', regards: 'Viele Grüße' },
  en: { hi: 'Hello', recv_s: 'Your appointment request', recv: 'thank you for your appointment request. We will check it and get back to you shortly with a confirmation.',
    want: 'Requested time', conf_s: 'Appointment confirmed', conf: 'Your appointment is confirmed:', prop_s: 'New appointment suggestion',
    prop: 'unfortunately your requested time does not work for us. We suggest the following appointment:', accept: 'Accept appointment',
    other: 'Does this not suit you? Simply reply to this email or send us a WhatsApp message.',
    canc_s: 'Appointment cancelled', canc: 'unfortunately we have to cancel your appointment request:', cancel_link: 'Cancel appointment',
    note: 'Message from the workshop', see: 'We look forward to seeing you!', regards: 'Kind regards' },
  pt: { hi: 'Olá', recv_s: 'O seu pedido de marcação', recv: 'obrigado pelo seu pedido de marcação. Vamos verificá-lo e respondemos em breve com uma confirmação.',
    want: 'Data pretendida', conf_s: 'Marcação confirmada', conf: 'A sua marcação está confirmada:', prop_s: 'Nova proposta de marcação',
    prop: 'infelizmente a data pretendida não é possível. Propomos a seguinte marcação:', accept: 'Aceitar marcação',
    other: 'Não lhe convém? Responda a este e-mail ou envie-nos uma mensagem por WhatsApp.',
    canc_s: 'Marcação cancelada', canc: 'infelizmente temos de cancelar o seu pedido de marcação:', cancel_link: 'Cancelar marcação',
    note: 'Mensagem da oficina', see: 'Até breve!', regards: 'Cumprimentos' }
};
const PAGETX = {
  de: { ok: 'Danke! Ihr Termin ist bestätigt:', cancelled: 'Ihr Termin wurde abgesagt. Wir haben eine Nachricht erhalten.',
    gone: 'Dieser Link ist nicht mehr gültig. Bitte rufen Sie uns an oder schreiben Sie per WhatsApp.', back: 'Zur Startseite', home: '/' },
  en: { ok: 'Thank you! Your appointment is confirmed:', cancelled: 'Your appointment has been cancelled. We have been notified.',
    gone: 'This link is no longer valid. Please call us or send a WhatsApp message.', back: 'Back to the homepage', home: '/en/' },
  pt: { ok: 'Obrigado! A sua marcação está confirmada:', cancelled: 'A sua marcação foi cancelada. Já fomos notificados.',
    gone: 'Este link já não é válido. Ligue-nos ou envie uma mensagem por WhatsApp.', back: 'Voltar à página inicial', home: '/pt/' }
};
const esc = (x) => String(x == null ? '' : x).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const btn = (href, label) => '<p><a href="' + esc(href) + '" style="display:inline-block;padding:10px 18px;background:#12324a;color:#fff;border-radius:8px;text-decoration:none">' + esc(label) + '</a></p>';
function wrapMail(body) { return '<div style="font:15px/1.5 -apple-system,Segoe UI,sans-serif;color:#14212b;max-width:560px">' + body + '</div>'; }
function customerMail(b, kind, note) {
  const M = MAILTX[b.lang] || MAILTX.de;
  const head = '<p>' + M.hi + ' ' + esc(b.name) + ',</p>';
  const foot = (note ? '<p><strong>' + M.note + ':</strong><br>' + esc(note).replace(/\n/g, '<br>') + '</p>' : '') +
    '<p>' + M.regards + '<br>' + SIGN + '</p>';
  const cancel = SITE + '/termin/absagen/' + b.id + '/' + b.token;
  if (kind === 'received') return [M.recv_s, wrapMail(head + '<p>' + M.recv + '</p><p><strong>' + M.want + ':</strong> ' + esc(when(b.lang, b.date, b.time)) + '</p>' + foot)];
  if (kind === 'confirmed') return [M.conf_s + ' – ' + when(b.lang, b.date, b.time), wrapMail(head + '<p>' + M.conf + '</p><p style="font-size:18px"><strong>' +
    esc(when(b.lang, b.date, b.time)) + '</strong></p><p>' + M.see + '</p>' + foot + '<p style="font-size:13px;color:#5b6b78"><a href="' + esc(cancel) + '">' + M.cancel_link + '</a></p>')];
  if (kind === 'proposed') return [M.prop_s, wrapMail(head + '<p>' + M.prop + '</p><p style="font-size:18px"><strong>' + esc(when(b.lang, b.pDate, b.pTime)) + '</strong></p>' +
    btn(SITE + '/termin/ok/' + b.id + '/' + b.token, M.accept) + '<p>' + M.other + '</p>' + foot)];
  return [M.canc_s, wrapMail(head + '<p>' + M.canc + ' ' + esc(when(b.lang, b.date, b.time)) + '</p><p>' + M.other + '</p>' + foot)];
}

// ---------------------------------------------------------------- Routen
module.exports = function (opts) {
  const sendMail = opts.sendMail;   // (to, subject, html, replyTo) → Promise<bool>

  async function slots(_req, res) {
    try { res.set('Cache-Control', 'no-store').json({ days: await freeDays() }); }
    catch (e) { console.error('booking slots:', e.message); res.status(503).json({ error: 'unavailable' }); }
  }

  async function create(req, res) {
    const b0 = req.body || {};
    if (b0.website) return res.json({ ok: true });   // Honeypot
    const s = (v, n) => String(v || '').trim().slice(0, n);
    const b = { id: crypto.randomBytes(6).toString('hex'), token: crypto.randomBytes(16).toString('hex'), created: Date.now(),
      lang: ['en', 'pt'].indexOf(b0.lang) >= 0 ? b0.lang : 'de', service: SERVICES.indexOf(b0.service) >= 0 ? b0.service : 'sonstiges',
      vehicle: s(b0.vehicle, 120), name: s(b0.name, 120), email: s(b0.email, 200), phone: s(b0.phone, 60), message: s(b0.message, 2000),
      date: s(b0.date, 10), time: s(b0.time, 5), status: 'pending' };
    if (!b.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email) || !validSlot(b.date, b.time)) return res.status(400).json({ error: 'invalid' });
    try {
      const free = await freeDays();
      const day = free.find((x) => x.d === b.date);
      if (!day || day.slots.indexOf(b.time) < 0) return res.status(409).json({ error: 'taken' });
      await save(b);
      const [subj, html] = customerMail(b, 'received');
      await Promise.all([
        sendMail(null, 'Terminanfrage: ' + when('de', b.date, b.time) + ' – ' + b.name,
          wrapMail('<h2>Neue Terminanfrage</h2><p><strong>' + esc(when('de', b.date, b.time)) + '</strong></p>' +
            '<p>Leistung: ' + esc(SERVICE_DE[b.service]) + '<br>Fahrzeug: ' + esc(b.vehicle || '—') + '</p>' +
            '<p>' + esc(b.name) + '<br>' + esc(b.email) + '<br>' + esc(b.phone || '—') + '</p>' +
            (b.message ? '<p style="white-space:pre-wrap">' + esc(b.message) + '</p>' : '') +
            btn(SITE + '/admin/termine', 'Bestätigen / verschieben')), b.email),
        sendMail(b.email, subj, html)
      ]);
      res.json({ ok: true });
    } catch (e) {
      console.error('booking create:', e.message);
      res.status(503).json({ error: 'failed' });
    }
  }

  function simplePage(lang, text, sub) {
    const P = PAGETX[lang] || PAGETX.de;
    return '<!doctype html><html lang="' + lang + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<meta name="robots" content="noindex"><title>Castelo Motorhomes</title><link rel="stylesheet" href="/assets/style.css"></head>' +
      '<body><main class="block"><div class="wrap narrow"><p><img src="/img/logo.png" alt="" width="28" height="56"></p><h1 class="h3">' + esc(text) + '</h1>' +
      (sub ? '<p style="font-size:1.2rem"><strong>' + esc(sub) + '</strong></p>' : '') + '<p><a class="btn" href="' + P.home + '">' + P.back + '</a></p></div></main></body></html>';
  }
  async function byToken(req) {
    const b = await get(String(req.params.id || ''));
    if (!b || !b.token || String(req.params.token || '').length !== b.token.length ||
        !crypto.timingSafeEqual(Buffer.from(b.token), Buffer.from(String(req.params.token)))) return null;
    return b;
  }
  // Kunde nimmt den vorgeschlagenen Termin an
  async function accept(req, res) {
    try {
      const b = await byToken(req);
      if (!b || b.status !== 'proposed') return res.status(410).type('html').send(simplePage(b ? b.lang : 'de', (PAGETX[b ? b.lang : 'de']).gone));
      b.date = b.pDate; b.time = b.pTime; delete b.pDate; delete b.pTime; b.status = 'confirmed'; b.updated = Date.now();
      await save(b);
      const [cs, ch] = customerMail(b, 'confirmed');
      await sendMail(b.email, cs, ch);
      await sendMail(null, 'Termin angenommen: ' + when('de', b.date, b.time) + ' – ' + b.name,
        wrapMail('<p>' + esc(b.name) + ' hat den vorgeschlagenen Termin angenommen:</p><p><strong>' + esc(when('de', b.date, b.time)) + '</strong></p>' + btn(SITE + '/admin/termine', 'Termine ansehen')), b.email);
      res.type('html').send(simplePage(b.lang, PAGETX[b.lang].ok, when(b.lang, b.date, b.time)));
    } catch (e) { console.error('booking accept:', e.message); res.status(503).send('Fehler'); }
  }
  // Kunde sagt selbst ab
  async function cancelByCustomer(req, res) {
    try {
      const b = await byToken(req);
      if (!b || ACTIVE.indexOf(b.status) < 0) return res.status(410).type('html').send(simplePage(b ? b.lang : 'de', (PAGETX[b ? b.lang : 'de']).gone));
      b.status = 'cancelled'; b.byCustomer = true; b.updated = Date.now();
      await save(b);
      await sendMail(null, 'Termin vom Kunden abgesagt: ' + when('de', b.date, b.time) + ' – ' + b.name,
        wrapMail('<p>' + esc(b.name) + ' hat den Termin am <strong>' + esc(when('de', b.date, b.time)) + '</strong> abgesagt. Die Zeit ist wieder frei.</p>'), b.email);
      res.type('html').send(simplePage(b.lang, PAGETX[b.lang].cancelled));
    } catch (e) { console.error('booking cancel:', e.message); res.status(503).send('Fehler'); }
  }

  // ---------------------------------------------------------------- Admin
  function sameOrigin(req) {
    const o = req.headers.origin || req.headers.referer || '';
    try { return new URL(o).host === req.get('host'); } catch (e) { return false; }
  }
  async function adminAction(req, res) {
    if (!sameOrigin(req)) return res.status(403).send('Ungültige Anfrage');
    try {
      const f = req.body || {};
      if (f.action === 'block' || f.action === 'unblock') {
        if (isDate(f.day)) await setBlocked(f.day, f.action === 'block');
        return res.redirect(303, '/admin/termine');
      }
      const b = await get(String(req.params.id || ''));
      if (!b) return res.redirect(303, '/admin/termine');
      const note = String(f.note || '').trim().slice(0, 1000);
      if (f.action === 'confirm') { b.status = 'confirmed'; }
      else if (f.action === 'cancel') { b.status = 'cancelled'; }
      else if (f.action === 'propose') {
        if (!validSlot(f.date, f.time)) return res.status(400).type('html').send('<p>Ungültiger Termin (nur zu den Öffnungszeiten, nicht an Feiertagen). <a href="/admin/termine">Zurück</a></p>');
        b.status = 'proposed'; b.pDate = f.date; b.pTime = f.time;
      } else return res.redirect(303, '/admin/termine');
      b.updated = Date.now();
      await save(b);
      const [subj, html] = customerMail(b, b.status === 'proposed' ? 'proposed' : b.status, note);
      await sendMail(b.email, subj, html, null);
      res.redirect(303, '/admin/termine');
    } catch (e) { console.error('booking admin:', e.message); res.status(503).send('Fehler: ' + esc(e.message)); }
  }

  async function adminPage(_req, res) {
    try {
      const [list, blocked] = await Promise.all([all(), blockedDays()]);
      const today = lisbonToday();
      const sortKey = (b) => (b.status === 'proposed' ? b.pDate + b.pTime : b.date + b.time);
      list.sort((a, b) => sortKey(a) < sortKey(b) ? -1 : 1);
      const timeOpts = [...new Set(Object.values(SLOTS).flat())].sort().map((t) => '<option>' + t + '</option>').join('');
      const row = (b, actions) => '<tr><td><strong>' + esc(when('de', b.date, b.time)) + '</strong>' +
        (b.status === 'proposed' ? '<br><span class="warn">Vorgeschlagen: ' + esc(when('de', b.pDate, b.pTime)) + '</span><br><span class="muted">wartet auf Antwort des Kunden</span>' : '') +
        (b.byCustomer ? '<br><span class="muted">vom Kunden abgesagt</span>' : '') + '</td>' +
        '<td>' + esc(SERVICE_DE[b.service]) + (b.vehicle ? '<br><span class="muted">' + esc(b.vehicle) + '</span>' : '') +
        (b.message ? '<br><span class="msg">' + esc(b.message) + '</span>' : '') + '</td>' +
        '<td><strong>' + esc(b.name) + '</strong><br><a href="mailto:' + esc(b.email) + '">' + esc(b.email) + '</a>' +
        (b.phone ? '<br><a href="tel:' + esc(b.phone.replace(/[^\d+]/g, '')) + '">' + esc(b.phone) + '</a>' : '') + '<br><span class="muted">' + b.lang.toUpperCase() + '</span></td>' +
        '<td>' + (actions ? form(b, timeOpts) : '') + '</td></tr>';
      const section = (title, rows, empty, actions) => '<h2>' + title + ' <span class="muted">(' + rows.length + ')</span></h2><div class="box"><table>' +
        '<tr><th>Termin</th><th>Leistung</th><th>Kunde</th><th>' + (actions ? 'Aktion' : '') + '</th></tr>' +
        (rows.length ? rows.map((b) => row(b, actions)).join('') : '<tr><td colspan="4" class="muted">' + empty + '</td></tr>') + '</table></div>';
      const pending = list.filter((b) => b.status === 'pending');
      const proposed = list.filter((b) => b.status === 'proposed');
      const confirmed = list.filter((b) => b.status === 'confirmed' && b.date >= today);
      const past = list.filter((b) => b.status === 'cancelled' || (b.status === 'confirmed' && b.date < today)).sort((a, b) => (b.updated || b.created) - (a.updated || a.created)).slice(0, 30);
      const bl = blocked.filter((d) => d >= today).sort();
      const html = '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<meta name="robots" content="noindex,nofollow"><title>Castelo · Termine</title><style>' +
        '*{box-sizing:border-box}body{margin:0;background:#f7f3ec;color:#14212b;font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:20px}' +
        '.wrap{max-width:1150px;margin:0 auto}h1{margin:0;font-size:26px;color:#12324a}h2{font-size:18px;color:#12324a;margin:28px 0 10px}' +
        '.muted{color:#5b6b78;font-size:13px}.warn{color:#9b5c00;font-weight:600}.msg{display:block;white-space:pre-wrap;font-size:13px;margin-top:4px}' +
        '.box{background:#fff;border:1px solid #e3dccf;border-radius:12px;padding:10px;overflow-x:auto}' +
        'table{width:100%;border-collapse:collapse}td,th{padding:8px 10px;border-bottom:1px solid #eee6d8;vertical-align:top;text-align:left;font-size:14px}' +
        'th{font-size:12px;text-transform:uppercase;color:#5b6b78}form{margin:0 0 6px}button{font:inherit;padding:6px 12px;border-radius:7px;border:1px solid #c9bfae;background:#fff;cursor:pointer;margin:2px 4px 2px 0}' +
        'button.ok{background:#1f7a46;border-color:#1f7a46;color:#fff}button.no{color:#9b2c2c}input,select,textarea{font:inherit;padding:5px 6px;border:1px solid #c9bfae;border-radius:6px}' +
        'textarea{width:100%;min-height:38px;margin:4px 0}details{margin-top:4px}a{color:#1d4a6b}</style></head><body><div class="wrap">' +
        '<h1>Termine</h1><p class="muted"><a href="/admin">← Zur Übersicht</a> · Uhrzeiten in portugiesischer Zeit · ' +
        (UPSTASH_URL ? 'dauerhaft gespeichert' : '<span class="warn">nur im Speicher (Upstash fehlt)</span>') + '</p>' +
        section('Neue Anfragen – bitte bestätigen', pending, 'Keine offenen Anfragen.', true) +
        section('Vorgeschlagen – wartet auf den Kunden', proposed, 'Keine.', true) +
        section('Bestätigte Termine', confirmed, 'Keine kommenden Termine.', true) +
        '<h2>Tage sperren <span class="muted">(Urlaub, Krankheit – an diesen Tagen kann niemand buchen)</span></h2><div class="box">' +
        '<form method="post" action="/admin/termine/-"><input type="hidden" name="action" value="block"><input type="date" name="day" min="' + today + '" required> <button>Tag sperren</button></form>' +
        (bl.length ? bl.map((d) => '<form method="post" action="/admin/termine/-"><input type="hidden" name="action" value="unblock"><input type="hidden" name="day" value="' + d + '">' +
          esc(new Date(d + 'T12:00:00Z').toLocaleDateString('de-DE', { timeZone: 'UTC', weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })) + ' <button>freigeben</button></form>').join('') : '<p class="muted">Keine gesperrten Tage.</p>') +
        '<p class="muted">Feiertage und 24.12.–1.1. sind automatisch gesperrt.</p></div>' +
        section('Erledigt / abgesagt (letzte 30)', past, 'Noch nichts.', false) +
        '</div></body></html>';
      res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'" });
      res.type('html').send(html);
    } catch (e) { console.error('booking admin page:', e.message); res.status(503).send('Fehler beim Laden der Termine.'); }
  }
  function form(b, timeOpts) {
    const a = '/admin/termine/' + b.id;
    const note = '<textarea name="note" placeholder="Nachricht an den Kunden (optional)"></textarea>';
    return (b.status === 'pending' ? '<form method="post" action="' + a + '"><input type="hidden" name="action" value="confirm">' + note + '<button class="ok">✓ Bestätigen</button></form>' : '') +
      '<details><summary>Anderen Termin vorschlagen</summary><form method="post" action="' + a + '"><input type="hidden" name="action" value="propose">' +
      '<input type="date" name="date" required> <select name="time">' + timeOpts + '</select>' + note + '<button>Vorschlag senden</button></form></details>' +
      '<details><summary>Absagen</summary><form method="post" action="' + a + '"><input type="hidden" name="action" value="cancel">' + note + '<button class="no">Absagen</button></form></details>';
  }

  async function pendingCount() {
    try { return (await all()).filter((b) => b.status === 'pending').length; } catch (e) { return 0; }
  }

  return { slots, create, accept, cancelByCustomer, adminPage, adminAction, pendingCount, SERVICES };
};
module.exports.holiday = holiday;
module.exports.easter = easter;
