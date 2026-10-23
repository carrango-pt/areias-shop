/* Castelo Motorhomes – Menü, Öffnungszeiten-Anzeige, Kontaktformular, Campingshop + Warenkorb. */
(function () {
  'use strict';
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
      add: 'In den Warenkorb', added: '✓ Hinzugefügt', allCats: 'Alle Kategorien', allBrands: 'Alle Marken',
      count: '{n} Artikel', noResults: 'Keine Artikel gefunden. Fragen Sie uns gern – wir bestellen auch, was nicht im Shop steht.',
      prev: 'Zurück', next: 'Weiter', art: 'Art.-Nr.',
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
      add: 'Add to basket', added: '✓ Added', allCats: 'All categories', allBrands: 'All brands',
      count: '{n} items', noResults: 'No items found. Just ask us – we can also order things that are not in the shop.',
      prev: 'Previous', next: 'Next', art: 'Item no.',
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
      add: 'Adicionar ao carrinho', added: '✓ Adicionado', allCats: 'Todas as categorias', allBrands: 'Todas as marcas',
      count: '{n} artigos', noResults: 'Nenhum artigo encontrado. Pergunte-nos – também encomendamos o que não está na loja.',
      prev: 'Anterior', next: 'Seguinte', art: 'Ref.',
      success: 'Obrigado pela sua encomenda! Receberá uma confirmação por e-mail. Em caso de levantamento, avisamos quando estiver tudo pronto.',
      cancel: 'O pagamento foi cancelado – o seu carrinho continua guardado.' }
  }[LANG];

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

  /* ---------- Warenkorb ----------
     Gespeichert wird id → { q: Menge, n: Name, p: Preis, img, url } nur zur Anzeige;
     an der Kasse rechnet der Server ausschließlich mit seinem Katalog. */
  function load() {
    try {
      var c = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
      Object.keys(c).forEach(function (id) { if (!c[id] || typeof c[id] !== 'object' || !c[id].q) delete c[id]; });
      return c;
    } catch (e) { return {}; }
  }
  var cart = load();
  function save() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* privat-Modus: Warenkorb nur für diese Seite */ }
    render();
  }
  function count() { return Object.keys(cart).reduce(function (n, id) { return n + cart[id].q; }, 0); }
  function total() { return Object.keys(cart).reduce(function (n, id) { return n + cart[id].q * cart[id].p; }, 0); }
  function addToCart(item) {
    var e = cart[item.id];
    if (e) e.q = Math.min(99, e.q + 1);
    else cart[item.id] = { q: 1, n: item.n, p: item.p, img: item.img, url: item.url };
    save();
  }

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
      var it = cart[id], line = el('div', { 'class': 'line' });
      var name = el('a', { href: it.url || '#' }, it.n);
      line.appendChild(name);
      line.appendChild(el('span', null, euro(it.p * it.q)));
      var q = el('div', { 'class': 'qty' });
      var minus = el('button', { type: 'button', 'aria-label': TX.less }, '−');
      var plus = el('button', { type: 'button', 'aria-label': TX.more }, '+');
      minus.addEventListener('click', function () { if (--cart[id].q <= 0) delete cart[id]; save(); });
      plus.addEventListener('click', function () { cart[id].q = Math.min(99, cart[id].q + 1); save(); });
      q.appendChild(minus); q.appendChild(el('span', null, it.q)); q.appendChild(plus);
      line.appendChild(q);
      box.appendChild(line);
    });
    $('.sum-value', drawer).textContent = euro(total());
    $('.checkout', drawer).disabled = !ids.length;
  }

  if (drawer) $('.checkout', drawer).addEventListener('click', function () {
    var btn = this, err = $('.checkout-msg', drawer);
    btn.disabled = true; err.textContent = '';
    var items = Object.keys(cart).map(function (id) { return { id: id, qty: cart[id].q }; });
    fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items: items, lang: LANG }) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, status: r.status, j: j }; }); })
      .then(function (res) {
        if (res.ok && res.j.url) { location.href = res.j.url; return; }
        err.textContent = res.status === 503 ? TX.notLive : TX.noCheckout;
        btn.disabled = false;
      })
      .catch(function () { err.textContent = TX.offline; btn.disabled = false; });
  });

  // "In den Warenkorb" auf Artikelseiten (vom Server gerendert)
  $$('[data-add]').forEach(function (b) {
    b.addEventListener('click', function () {
      try { addToCart(JSON.parse(b.getAttribute('data-add'))); } catch (e) { return; }
      flash(b);
    });
  });
  function flash(b) {
    b.textContent = TX.added;
    setTimeout(function () { b.textContent = TX.add; }, 1400);
  }

  /* ---------- Shop: Suche, Kategorien, Filter, Seiten (nur auf der Shop-Seite) ---------- */
  var list = $('#products');
  if (list) {
    var state = { cat: '', q: '', brand: '', sort: '', page: 1 };
    var sp = new URLSearchParams(location.search);
    Object.keys(state).forEach(function (k) { if (sp.get(k)) state[k] = k === 'page' ? parseInt(sp.get(k), 10) || 1 : sp.get(k); });
    var qInput = $('#shop-q'), brandSel = $('#shop-brand'), sortSel = $('#shop-sort'), tree = $('#cat-tree');
    qInput.value = state.q; sortSel.value = state.sort;
    var cats = [], kids = {};

    function api(p, qs) { return fetch(p + '?' + new URLSearchParams(qs)).then(function (r) { return r.json(); }); }
    function setUrl() {
      var qs = {};
      Object.keys(state).forEach(function (k) { if (state[k] && !(k === 'page' && state[k] === 1)) qs[k] = state[k]; });
      var s = new URLSearchParams(qs).toString();
      history.replaceState(null, '', location.pathname + (s ? '?' + s : ''));
    }
    function go(changes, keepPage) {
      Object.keys(changes).forEach(function (k) { state[k] = changes[k]; });
      if (!keepPage) state.page = 1;
      setUrl(); drawTree(); loadProducts();
    }

    // Kategoriebaum: aktive Kette aufgeklappt, sonst nur oberste Ebene
    function chain(id) { var c = [], byId = {}; cats.forEach(function (x) { byId[x.id] = x; }); for (var x = byId[id]; x; x = byId[x.parent]) c.unshift(x.id); return c; }
    function drawTree() {
      tree.textContent = '';
      var open = chain(state.cat);
      function level(parent, depth) {
        var ul = el('ul', { 'class': 'tree d' + depth });
        (kids[parent] || []).forEach(function (c) {
          var li = el('li');
          var a = el('a', { href: '?cat=' + encodeURIComponent(c.id) });
          a.appendChild(document.createTextNode(c.name + ' '));
          a.appendChild(el('small', null, c.count));
          if (c.id === state.cat) a.setAttribute('aria-current', 'true');
          a.addEventListener('click', function (e) { e.preventDefault(); go({ cat: c.id === state.cat ? c.parent : c.id, brand: '' }); });
          li.appendChild(a);
          if (open.indexOf(c.id) >= 0 && kids[c.id]) li.appendChild(level(c.id, depth + 1));
          ul.appendChild(li);
        });
        return ul;
      }
      var all = el('a', { href: '?' }, TX.allCats);
      if (!state.cat) all.setAttribute('aria-current', 'true');
      all.addEventListener('click', function (e) { e.preventDefault(); go({ cat: '', brand: '' }); });
      tree.appendChild(all);
      tree.appendChild(level('', 0));
    }

    var seq = 0;
    function loadProducts() {
      var my = ++seq;
      list.setAttribute('aria-busy', 'true');
      api('/api/shop/products', { lang: LANG, cat: state.cat, q: state.q, brand: state.brand, sort: state.sort, page: state.page })
        .then(function (d) {
          if (my !== seq) return;
          list.removeAttribute('aria-busy');
          $('#shop-count').textContent = TX.count.replace('{n}', d.total.toLocaleString(LANG));
          brandSel.textContent = '';
          brandSel.appendChild(el('option', { value: '' }, TX.allBrands));
          d.brands.forEach(function (b) { brandSel.appendChild(el('option', { value: b[0] }, b[0] + ' (' + b[1] + ')')); });
          if (state.brand && !d.brands.some(function (b) { return b[0] === state.brand; })) brandSel.appendChild(el('option', { value: state.brand }, state.brand));
          brandSel.value = state.brand;
          list.textContent = '';
          if (!d.items.length) list.appendChild(el('p', { 'class': 'empty' }, TX.noResults));
          d.items.forEach(function (p) {
            var card = el('article', { 'class': 'card product' });
            var link = el('a', { href: p.url, 'class': 'pimg' });
            link.appendChild(el('img', { src: p.img, alt: p.n, loading: 'lazy', width: '580', height: '280' }));
            card.appendChild(link);
            var body = el('div', { 'class': 'body' });
            if (p.b) body.appendChild(el('span', { 'class': 'tag' }, p.b));
            var h = el('h3'); h.appendChild(el('a', { href: p.url }, p.n)); body.appendChild(h);
            if (p.a) body.appendChild(el('p', { 'class': 'art' }, TX.art + ' ' + p.a));
            body.appendChild(el('div', { 'class': 'price' }, euro(p.p)));
            var add = el('button', { type: 'button', 'class': 'btn small' }, TX.add);
            add.addEventListener('click', function () { addToCart(p); flash(add); });
            body.appendChild(add);
            card.appendChild(body);
            list.appendChild(card);
          });
          drawPager(d.page, d.pages);
        })
        .catch(function () { if (my === seq) { list.removeAttribute('aria-busy'); list.textContent = TX.offline; } });
    }

    function drawPager(page, pages) {
      var nav = $('#pager');
      nav.textContent = '';
      if (pages < 2) return;
      function btn(label, p, cur) {
        var b = el('button', { type: 'button' }, label);
        if (cur) b.setAttribute('aria-current', 'page');
        if (p < 1 || p > pages) b.disabled = true;
        b.addEventListener('click', function () { state.page = p; setUrl(); loadProducts(); list.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
        nav.appendChild(b);
      }
      btn('‹ ' + TX.prev, page - 1);
      var from = Math.max(1, page - 2), to = Math.min(pages, page + 2);
      if (from > 1) { btn('1', 1); if (from > 2) nav.appendChild(el('span', null, '…')); }
      for (var i = from; i <= to; i++) btn(String(i), i, i === page);
      if (to < pages) { if (to < pages - 1) nav.appendChild(el('span', null, '…')); btn(String(pages), pages); }
      btn(TX.next + ' ›', page + 1);
    }

    $('#shop-search').addEventListener('submit', function (e) { e.preventDefault(); go({ q: qInput.value.trim() }); });
    var typing;
    qInput.addEventListener('input', function () { clearTimeout(typing); typing = setTimeout(function () { go({ q: qInput.value.trim() }); }, 350); });
    brandSel.addEventListener('change', function () { go({ brand: brandSel.value }); });
    sortSel.addEventListener('change', function () { go({ sort: sortSel.value }); });

    api('/api/shop/categories', { lang: LANG }).then(function (c) {
      cats = c;
      c.forEach(function (x) { (kids[x.parent] = kids[x.parent] || []).push(x); });
      drawTree();
    });
    loadProducts();

    var q = sp.get('checkout'), note = $('#checkout-note');
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
