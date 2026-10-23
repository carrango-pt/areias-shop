/* Castelo Motorhomes – Menü, Öffnungszeiten-Anzeige, Kontaktformular, Campingshop + Warenkorb. */
(function () {
  'use strict';
  var C = window.CASTELO_CATALOG;
  var CART_KEY = 'castelo_cart';
  var LANG = (document.documentElement.lang || 'de').slice(0, 2);
  if (['de', 'en', 'pt'].indexOf(LANG) < 0) LANG = 'de';
  var TX = {
    de: { open: 'Jetzt geöffnet', closed: 'Derzeit geschlossen', sending: 'Wird gesendet …',
      sent: 'Danke! Ihre Nachricht ist angekommen – wir melden uns so schnell wie möglich.',
      invalid: 'Bitte Name, eine gültige E-Mail-Adresse und Ihre Nachricht angeben.',
      failed: 'Senden hat leider nicht geklappt. Bitte rufen Sie uns an oder schreiben Sie per WhatsApp.',
      empty: 'Ihr Warenkorb ist leer.', less: 'Weniger', more: 'Mehr',
      notLive: 'Die Online-Bezahlung ist noch nicht freigeschaltet. Bitte bestellen Sie telefonisch oder per WhatsApp.',
      noCheckout: 'Die Kasse konnte nicht geöffnet werden. Bitte versuchen Sie es erneut.',
      offline: 'Keine Verbindung. Bitte versuchen Sie es erneut.',
      all: 'Alle', add: 'In den Warenkorb', added: '✓ Hinzugefügt',
      success: 'Vielen Dank für Ihre Bestellung! Sie erhalten eine Bestätigung per E-Mail. Bei Abholung melden wir uns, sobald alles bereitliegt.',
      cancel: 'Die Bezahlung wurde abgebrochen – Ihr Warenkorb ist noch da.' },
    en: { open: 'Open now', closed: 'Currently closed', sending: 'Sending …',
      sent: 'Thank you! Your message has arrived – we will get back to you as soon as possible.',
      invalid: 'Please enter your name, a valid email address and your message.',
      failed: 'Sorry, sending failed. Please call us or send a WhatsApp message.',
      empty: 'Your basket is empty.', less: 'Less', more: 'More',
      notLive: 'Online payment is not active yet. Please order by phone or WhatsApp.',
      noCheckout: 'The checkout could not be opened. Please try again.',
      offline: 'No connection. Please try again.',
      all: 'All', add: 'Add to basket', added: '✓ Added',
      success: 'Thank you for your order! You will receive a confirmation by email. For collection, we will let you know as soon as everything is ready.',
      cancel: 'Payment was cancelled – your basket is still there.' },
    pt: { open: 'Aberto agora', closed: 'Fechado neste momento', sending: 'A enviar …',
      sent: 'Obrigado! A sua mensagem foi recebida – responderemos o mais rapidamente possível.',
      invalid: 'Indique o seu nome, um e-mail válido e a sua mensagem.',
      failed: 'Não foi possível enviar. Ligue-nos ou envie uma mensagem por WhatsApp.',
      empty: 'O seu carrinho está vazio.', less: 'Menos', more: 'Mais',
      notLive: 'O pagamento online ainda não está ativo. Encomende por telefone ou WhatsApp.',
      noCheckout: 'Não foi possível abrir o pagamento. Tente novamente.',
      offline: 'Sem ligação. Tente novamente.',
      all: 'Todos', add: 'Adicionar ao carrinho', added: '✓ Adicionado',
      success: 'Obrigado pela sua encomenda! Receberá uma confirmação por e-mail. Em caso de levantamento, avisamos quando estiver tudo pronto.',
      cancel: 'O pagamento foi cancelado – o seu carrinho continua guardado.' }
  }[LANG];
  function tr(p, key) { return (LANG !== 'de' && p.i18n && p.i18n[LANG] && p.i18n[LANG][key]) || p[key]; }
  function lbl(x) { return typeof x === 'string' ? x : (x[LANG] || x.de); }

  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function euro(cents) { return (cents / 100).toFixed(2).replace('.', ',') + ' €'; }
  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }

  /* ---------- Menü ---------- */
  var toggle = $('.menu-toggle'), nav = $('nav.main');
  if (toggle && nav) toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  var here = location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  $$('nav.main a[href^="/"]:not(.cart-btn)').forEach(function (a) {
    if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page');
  });
  $$('[data-year]').forEach(function (n) { n.textContent = new Date().getFullYear(); });

  /* ---------- Öffnungszeiten: "Jetzt geöffnet" (Zeitzone Portugal) ---------- */
  // Wochentag 0 = Sonntag. [von, bis] in Minuten.
  var HOURS = { 1: [600, 1020], 2: [600, 1020], 3: [600, 1020], 4: [600, 1020], 5: [600, 780] };
  var badge = $('[data-open-now]');
  if (badge) {
    var parts = {};
    try {
      new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Lisbon', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    } catch (e) { parts = null; }
    if (parts) {
      var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
      var mins = parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10);
      var h = HOURS[day];
      var open = h && mins >= h[0] && mins < h[1];
      badge.textContent = open ? TX.open : TX.closed;
      if (!open) badge.classList.add('no');
      badge.hidden = false;
      var row = $('.hours tr[data-day="' + day + '"]');
      if (row) row.classList.add('today');
    }
  }

  /* ---------- Kontaktformular ---------- */
  $$('form.contact').forEach(function (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var msg = $('.form-msg', form), btn = $('button[type=submit]', form);
      var data = {};
      $$('input, textarea, select', form).forEach(function (f) { if (f.name) data[f.name] = f.value; });
      btn.disabled = true; msg.className = 'form-msg'; msg.textContent = TX.sending;
      fetch('/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
        .then(function () {
          form.reset();
          msg.className = 'form-msg ok';
          msg.textContent = TX.sent;
        })
        .catch(function (status) {
          msg.className = 'form-msg err';
          msg.textContent = status === 400
            ? TX.invalid
            : TX.failed;
        })
        .then(function () { btn.disabled = false; });
    });
  });

  /* ---------- Warenkorb ---------- */
  if (!C) return;
  function load() {
    try {
      var c = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
      Object.keys(c).forEach(function (id) { if (!C.products[id]) delete c[id]; });
      return c;
    } catch (e) { return {}; }
  }
  var cart = load();
  function save() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* privat-Modus: Warenkorb nur für diese Seite */ }
    render();
  }
  function count() { return Object.keys(cart).reduce(function (n, id) { return n + cart[id]; }, 0); }
  function total() { return Object.keys(cart).reduce(function (n, id) { return n + cart[id] * C.products[id].price; }, 0); }

  var drawer = $('#cart'), bg = $('.drawer-bg');
  function openCart() { if (!drawer) return; drawer.hidden = false; bg.hidden = false; $('.x', drawer).focus(); }
  function closeCart() { if (!drawer) return; drawer.hidden = true; bg.hidden = true; }
  $$('[data-open-cart]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); openCart(); }); });
  if (drawer) {
    $('.x', drawer).addEventListener('click', closeCart);
    bg.addEventListener('click', closeCart);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCart(); });
  }

  function render() {
    $$('.cart-count').forEach(function (n) { n.textContent = count(); });
    if (!drawer) return;
    var box = $('.items', drawer);
    box.textContent = '';
    var ids = Object.keys(cart);
    if (!ids.length) box.appendChild(el('p', { 'class': 'empty' }, TX.empty));
    ids.forEach(function (id) {
      var p = C.products[id], line = el('div', { 'class': 'line' });
      line.appendChild(el('strong', null, tr(p, 'name')));
      line.appendChild(el('span', null, euro(p.price * cart[id])));
      var q = el('div', { 'class': 'qty' });
      var minus = el('button', { type: 'button', 'aria-label': TX.less }, '−');
      var plus = el('button', { type: 'button', 'aria-label': TX.more }, '+');
      minus.addEventListener('click', function () { if (--cart[id] <= 0) delete cart[id]; save(); });
      plus.addEventListener('click', function () { cart[id] = Math.min(99, cart[id] + 1); save(); });
      q.appendChild(minus); q.appendChild(el('span', null, cart[id])); q.appendChild(plus);
      line.appendChild(q);
      box.appendChild(line);
    });
    $('.sum-value', drawer).textContent = euro(total());
    $('.checkout', drawer).disabled = !ids.length;
  }

  if (drawer) $('.checkout', drawer).addEventListener('click', function () {
    var btn = this, err = $('.checkout-msg', drawer);
    btn.disabled = true; err.textContent = '';
    var items = Object.keys(cart).map(function (id) { return { id: id, qty: cart[id] }; });
    fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items: items, lang: LANG }) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, status: r.status, j: j }; }); })
      .then(function (res) {
        if (res.ok && res.j.url) { location.href = res.j.url; return; }
        err.textContent = res.status === 503
          ? TX.notLive
          : TX.noCheckout;
        btn.disabled = false;
      })
      .catch(function () { err.textContent = TX.offline; btn.disabled = false; });
  });

  /* ---------- Produktliste (nur auf /campingshop) ---------- */
  var list = $('#products');
  if (list) {
    var tabs = $('#cat-tabs'), active = 'alle';
    var all = el('button', { type: 'button', 'aria-pressed': 'true', 'data-cat': 'alle' }, TX.all);
    tabs.appendChild(all);
    C.categories.forEach(function (c) { tabs.appendChild(el('button', { type: 'button', 'aria-pressed': 'false', 'data-cat': c.id }, lbl(c.label))); });
    tabs.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      active = b.getAttribute('data-cat');
      $$('button', tabs).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      draw();
    });
    var catById = {};
    C.categories.forEach(function (c) { catById[c.id] = c; });
    function draw() {
      list.textContent = '';
      Object.keys(C.products).forEach(function (id) {
        var p = C.products[id];
        if (active !== 'alle' && p.cat !== active) return;
        var cat = catById[p.cat] || {};
        var card = el('article', { 'class': 'card product' });
        card.appendChild(el('img', { src: p.img || cat.img, alt: tr(p, 'name'), loading: 'lazy', width: '600', height: '400' }));
        var body = el('div', { 'class': 'body' });
        body.appendChild(el('span', { 'class': 'tag' }, cat.label ? lbl(cat.label) : ''));
        body.appendChild(el('h3', null, tr(p, 'name')));
        if (p.text) body.appendChild(el('p', null, tr(p, 'text')));
        body.appendChild(el('div', { 'class': 'price' }, euro(p.price)));
        var add = el('button', { type: 'button', 'class': 'btn small' }, TX.add);
        add.addEventListener('click', function () {
          cart[id] = Math.min(99, (cart[id] || 0) + 1); save();
          add.textContent = TX.added;
          setTimeout(function () { add.textContent = TX.add; }, 1400);
        });
        body.appendChild(add);
        card.appendChild(body);
        list.appendChild(card);
      });
    }
    draw();
    var q = new URLSearchParams(location.search).get('checkout');
    var note = $('#checkout-note');
    if (q === 'success') {
      cart = {}; save();
      note.className = 'notice ok';
      note.textContent = TX.success;
      note.hidden = false;
    } else if (q === 'cancel') {
      note.textContent = TX.cancel;
      note.hidden = false;
    }
  }
  render();
})();
