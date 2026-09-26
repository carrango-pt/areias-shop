(function () {
  // ---------- i18n ----------
  var langAttr = (document.documentElement.lang || 'de').toLowerCase();
  var LANG = langAttr.indexOf('pt') === 0 ? 'pt' : (langAttr.indexOf('en') === 0 ? 'en' : 'de');
  var LOCALE = { de: 'de-DE', pt: 'pt-PT', en: 'en-IE' }[LANG];
  var T = {
    de: { cart: 'Warenkorb', empty: 'Ihr Warenkorb ist leer.', sub: 'Zwischensumme', checkout: 'Zur Kasse', remove: 'Entfernen', close: 'Schließen', added: 'Hinzugefügt', ship: 'Versand wird an der Kasse berechnet.', err: 'Checkout momentan nicht möglich. Bitte später erneut versuchen.', nokey: 'Checkout ist noch nicht mit Stripe verbunden (kein Schlüssel hinterlegt).', ok: 'Danke für Ihre Bestellung! Sie erhalten eine Bestätigung per E-Mail.', cancel: 'Zahlung abgebrochen – Ihr Warenkorb ist erhalten.', search: 'Suchen…', more: 'Mehr laden', count: function(n){return n === 1 ? '1 Stück' : n + ' Stücke';}, noHits: 'Keine Treffer.', addToCart: 'In den Warenkorb', newBadge: 'Neu', details: 'Details', desc: function(m){ return 'Material: ' + m + '. Von Areias an der Algarve ausgewählt. Inkl. Geschenkverpackung · 14 Tage Rückgaberecht.'; } },
    pt: { cart: 'Carrinho', empty: 'O seu carrinho está vazio.', sub: 'Subtotal', checkout: 'Finalizar compra', remove: 'Remover', close: 'Fechar', added: 'Adicionado', ship: 'Portes calculados na finalização.', err: 'Não é possível finalizar agora. Tente novamente mais tarde.', nokey: 'A finalização ainda não está ligada ao Stripe (sem chave).', ok: 'Obrigado pela sua encomenda! Receberá uma confirmação por e-mail.', cancel: 'Pagamento cancelado – o seu carrinho foi mantido.', search: 'Pesquisar…', more: 'Ver mais', count: function(n){return n === 1 ? '1 peça' : n + ' peças';}, noHits: 'Sem resultados.', addToCart: 'Adicionar ao carrinho', newBadge: 'Novo', details: 'Detalhes', desc: function(m){ return 'Material: ' + m + '. Selecionado pela Areias no Algarve. Embalagem de oferta incluída · devolução em 14 dias.'; } },
    en: { cart: 'Cart', empty: 'Your cart is empty.', sub: 'Subtotal', checkout: 'Checkout', remove: 'Remove', close: 'Close', added: 'Added', ship: 'Shipping calculated at checkout.', err: 'Checkout is not available right now. Please try again later.', nokey: 'Checkout is not connected to Stripe yet (no key set).', ok: 'Thank you for your order! You will receive a confirmation by email.', cancel: 'Payment cancelled – your cart has been kept.', search: 'Search…', more: 'Load more', count: function(n){return n === 1 ? '1 piece' : n + ' pieces';}, noHits: 'No results.', addToCart: 'Add to bag', newBadge: 'New', details: 'Details', desc: function(m){ return 'Material: ' + m + '. Curated by Areias on the Algarve. Gift wrapping included · 14-day returns.'; } }
  }[LANG];

  var CATALOG = (window.AREIAS_CATALOG || { currency: 'eur', products: {}, order: [] });
  var PRODUCTS = CATALOG.products;
  var ORDER = CATALOG.order && CATALOG.order.length ? CATALOG.order : Object.keys(PRODUCTS);
  var inSub = /\/(pt|en)\//.test(location.pathname);
  // Derive the asset base from an already-resolved reference so runtime-built
  // image URLs work everywhere (incl. sandboxed artifact iframes), not just from
  // a guessed relative prefix.
  function assetBase(){
    var s = document.querySelector('script[src*="assets/app.js"]');
    if (s && s.src) return s.src.replace(/app\.js(?:[?#].*)?$/, '');
    var l = document.querySelector('link[rel="stylesheet"][href*="assets/style.css"]');
    if (l && l.href) return l.href.replace(/style\.css(?:[?#].*)?$/, '');
    return (inSub ? '../' : '') + 'assets/';
  }
  var ASSETS = assetBase();            // absolute, ends with ".../assets/"
  var IMG = ASSETS + 'img/';
  function loc(p){ return (p.i18n && p.i18n[LANG]) || { name: p.name, mat: '' }; }
  function priceFmt(cents){
    var e = cents / 100;
    var s = Number.isInteger(e) ? String(e) : e.toFixed(2).replace('.', LANG === 'en' ? '.' : ',');
    return LANG === 'en' ? ('€ ' + s) : (s + ' €');
  }

  // ---------- Cart state ----------
  var KEY = 'areias-cart';
  function getCart(){ try { var c = JSON.parse(localStorage.getItem(KEY) || '{}'); return (c && typeof c === 'object') ? c : {}; } catch(e){ return {}; } }
  function setCart(c){ try { localStorage.setItem(KEY, JSON.stringify(c)); } catch(e){} renderCart(); }
  function count(c){ c = c || getCart(); var n = 0; for (var k in c) n += c[k]; return n; }
  function subtotal(c){ c = c || getCart(); var s = 0; for (var k in c){ if (PRODUCTS[k]) s += PRODUCTS[k].price * c[k]; } return s; }
  function addItem(id){ if (!PRODUCTS[id]) return; var c = getCart(); c[id] = (c[id] || 0) + 1; setCart(c); }
  function setQty(id, q){ var c = getCart(); q = Math.max(0, q); if (q === 0) delete c[id]; else c[id] = q; setCart(c); }
  var countEl = document.querySelector('.cart-count');
  var money = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'EUR' });

  // ---------- Cart drawer ----------
  var backdrop, drawer, itemsEl, subEl, footEl;
  function buildDrawer(){
    backdrop = document.createElement('div'); backdrop.className = 'cart-backdrop';
    drawer = document.createElement('aside'); drawer.className = 'cart-drawer'; drawer.setAttribute('aria-label', T.cart); drawer.setAttribute('role', 'dialog'); drawer.setAttribute('aria-modal', 'true');
    drawer.innerHTML =
      '<div class="cart-head"><span>' + T.cart + '</span><button class="cart-close" aria-label="' + T.close + '">&times;</button></div>' +
      '<div class="cart-items"></div>' +
      '<div class="cart-foot">' +
        '<div class="cart-sub"><span>' + T.sub + '</span><span class="cart-sub-val"></span></div>' +
        '<p class="cart-ship">' + T.ship + '</p>' +
        '<button class="btn btn-dark checkout-btn" type="button">' + T.checkout + '</button>' +
        '<p class="cart-msg" role="status"></p>' +
      '</div>';
    document.body.appendChild(backdrop); document.body.appendChild(drawer);
    itemsEl = drawer.querySelector('.cart-items'); subEl = drawer.querySelector('.cart-sub-val'); footEl = drawer.querySelector('.cart-foot');
    backdrop.addEventListener('click', closeCart);
    drawer.querySelector('.cart-close').addEventListener('click', closeCart);
    drawer.querySelector('.checkout-btn').addEventListener('click', checkout);
    itemsEl.addEventListener('click', onItemsClick);
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeCart(); });
  }
  function openCart(){ drawer.classList.add('open'); backdrop.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeCart(){ drawer.classList.remove('open'); backdrop.classList.remove('open'); document.body.style.overflow = ''; }
  function renderCart(){
    var c = getCart();
    if (countEl) countEl.textContent = count(c);
    if (!itemsEl) return;
    var ids = Object.keys(c);
    if (!ids.length){ itemsEl.innerHTML = '<p class="cart-empty">' + T.empty + '</p>'; footEl.style.display = 'none'; return; }
    footEl.style.display = '';
    itemsEl.innerHTML = ids.map(function(id){
      var p = PRODUCTS[id]; if (!p) return ''; var q = c[id]; var nm = loc(p).name;
      return '<div class="cart-item" data-id="' + id + '">' +
        '<img class="ci-img" src="' + IMG + p.img + '" alt="' + nm + '">' +
        '<div class="ci-info"><span class="ci-name">' + nm + '</span>' +
        '<span class="ci-price">' + priceFmt(p.price) + '</span>' +
        '<div class="ci-qty"><button class="qbtn" data-act="dec" aria-label="-">&minus;</button><span>' + q + '</span><button class="qbtn" data-act="inc" aria-label="+">+</button></div></div>' +
        '<button class="ci-remove" data-act="rm" aria-label="' + T.remove + '">&times;</button></div>';
    }).join('');
    subEl.textContent = priceFmt(subtotal(c));
  }
  function onItemsClick(e){
    var btn = e.target.closest('[data-act]'); if (!btn) return;
    var row = e.target.closest('.cart-item'); if (!row) return;
    var id = row.dataset.id, c = getCart();
    if (btn.dataset.act === 'inc') setQty(id, (c[id] || 0) + 1);
    else if (btn.dataset.act === 'dec') setQty(id, (c[id] || 0) - 1);
    else if (btn.dataset.act === 'rm') setQty(id, 0);
  }
  function setMsg(text, isErr){ var m = drawer.querySelector('.cart-msg'); m.textContent = text || ''; m.classList.toggle('is-err', !!isErr); }
  function checkout(){
    var c = getCart(); var items = []; for (var id in c) items.push({ id: id, qty: c[id] });
    if (!items.length) return;
    var btn = drawer.querySelector('.checkout-btn'); btn.disabled = true; setMsg('…');
    fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: items, lang: LANG }) })
      .then(function(r){ return r.json().then(function(d){ return { ok: r.ok, status: r.status, d: d }; }); })
      .then(function(res){
        if (res.ok && res.d && res.d.url){ window.location.href = res.d.url; return; }
        setMsg(res.status === 503 ? T.nokey : T.err, true); btn.disabled = false;
      }).catch(function(){ setMsg(T.err, true); btn.disabled = false; });
  }

  // ---------- Product grid (data-driven: Kategorie × Material × Suche + Mehr laden) ----------
  var PAGE = 8;
  var grid = document.getElementById('areias-grid');
  var catPills = document.querySelectorAll('.pill[data-cat]');
  var matPills = document.querySelectorAll('.pill[data-mat]');
  var searchEl = document.querySelector('.coll-search');
  var countLabel = document.querySelector('.coll-count');
  var moreWrap = document.querySelector('.load-more-wrap');
  var moreBtn = document.querySelector('.load-more');
  var curCat = 'alle', curMat = 'alle', query = '', shown = PAGE;

  function matchList(){
    return ORDER.filter(function(id){
      var p = PRODUCTS[id]; if (!p) return false;
      if (curCat !== 'alle' && p.cat !== curCat) return false;
      if (curMat !== 'alle' && p.mat !== curMat) return false;
      if (query){
        var l = loc(p);
        var hay = (l.name + ' ' + l.mat).toLowerCase();
        if (hay.indexOf(query) === -1) return false;
      }
      return true;
    });
  }
  function cardHtml(id, i){
    var p = PRODUCTS[id]; var l = loc(p);
    var tile = i % 2 === 0 ? 'tile-a' : 'tile-b';
    var badge = p.badge ? '<span class="badge">' + T.newBadge + '</span>' : '';
    return '<article class="card" data-id="' + id + '" data-cat="' + p.cat + '" data-mat="' + p.mat + '">' +
      '<div class="card-img ' + tile + '">' + badge + '<img src="' + IMG + p.img + '" alt="' + l.name + '" loading="lazy"></div>' +
      '<h3>' + l.name + '</h3><p class="mat">' + l.mat + '</p>' +
      '<div class="card-foot"><span class="price">' + priceFmt(p.price) + '</span>' +
      '<button class="add" data-id="' + id + '">' + T.addToCart + '</button></div></article>';
  }
  function renderGrid(){
    if (!grid) return;
    catPills.forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.cat === curCat)); });
    matPills.forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.mat === curMat)); });
    var list = matchList();
    if (countLabel) countLabel.textContent = T.count(list.length);
    if (!list.length){ grid.innerHTML = '<p class="grid-empty">' + T.noHits + '</p>'; if (moreWrap) moreWrap.hidden = true; return; }
    var slice = list.slice(0, shown);
    grid.innerHTML = slice.map(function(id, i){ return cardHtml(id, i); }).join('');
    if (moreWrap){
      if (shown < list.length){ moreWrap.hidden = false; if (moreBtn) moreBtn.textContent = T.more + ' (' + (list.length - shown) + ')'; }
      else moreWrap.hidden = true;
    }
  }
  function resetAndRender(){ shown = PAGE; renderGrid(); }

  catPills.forEach(function(b){ b.addEventListener('click', function(){ curCat = b.dataset.cat; resetAndRender(); }); });
  matPills.forEach(function(b){ b.addEventListener('click', function(){ curMat = b.dataset.mat; resetAndRender(); }); });
  if (searchEl){ searchEl.placeholder = T.search; searchEl.addEventListener('input', function(){ query = searchEl.value.trim().toLowerCase(); resetAndRender(); }); }
  if (moreBtn){ moreBtn.addEventListener('click', function(){ shown += PAGE; renderGrid(); }); }
  document.querySelectorAll('[data-go]').forEach(function(a){
    a.addEventListener('click', function(){ curCat = a.dataset.go; curMat = 'alle'; query = ''; if (searchEl) searchEl.value = ''; resetAndRender(); });
  });
  if (grid){
    grid.addEventListener('click', function(e){
      var b = e.target.closest('.add');
      if (b) {
        e.preventDefault();
        var id = b.dataset.id; if (!id) return;
        addItem(id);
        var label = b.textContent; b.textContent = T.added;
        setTimeout(function(){ b.textContent = label; }, 1200);
        openCart();
        return;
      }
      var card = e.target.closest('.card');
      if (card && card.dataset.id) openProduct(card.dataset.id);
    });
  }

  // ---------- Produkt-Detail (Modal, Bild groß + Beschreibung) ----------
  var pmBack, pmImg, pmName, pmMat, pmPrice, pmDesc, pmAdd, pmEan;
  function buildProductModal(){
    pmBack = document.createElement('div'); pmBack.className = 'pm-backdrop';
    pmBack.innerHTML =
      '<div class="pm-dialog" role="dialog" aria-modal="true">' +
        '<button class="pm-close" aria-label="' + T.close + '">&times;</button>' +
        '<div class="pm-imgwrap"><img class="pm-img" alt=""></div>' +
        '<div class="pm-body">' +
          '<h3 class="pm-name"></h3><p class="pm-mat"></p><p class="pm-price"></p>' +
          '<p class="pm-desc"></p><p class="pm-ean"></p><button class="btn btn-dark pm-add" type="button"></button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(pmBack);
    pmImg = pmBack.querySelector('.pm-img'); pmName = pmBack.querySelector('.pm-name');
    pmMat = pmBack.querySelector('.pm-mat'); pmPrice = pmBack.querySelector('.pm-price');
    pmDesc = pmBack.querySelector('.pm-desc'); pmAdd = pmBack.querySelector('.pm-add');
    pmEan = pmBack.querySelector('.pm-ean');
    pmBack.addEventListener('click', function(e){ if (e.target === pmBack) closeProduct(); });
    pmBack.querySelector('.pm-close').addEventListener('click', closeProduct);
    pmAdd.addEventListener('click', function(){ var id = pmAdd.dataset.id; if (!id) return; addItem(id); closeProduct(); openCart(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeProduct(); });
  }
  function openProduct(id){
    var p = PRODUCTS[id]; if (!p || !pmBack) return; var l = loc(p);
    pmImg.src = IMG + p.img; pmImg.alt = l.name;
    pmName.textContent = l.name; pmMat.textContent = l.mat; pmPrice.textContent = priceFmt(p.price);
    pmDesc.textContent = T.desc(l.mat.indexOf('· ') > -1 ? l.mat.split('· ')[1] : l.mat);
    pmEan.textContent = p.ean ? 'EAN: ' + p.ean : '';
    pmAdd.dataset.id = id; pmAdd.textContent = T.addToCart;
    setProductJsonLd(id, p, l);
    pmBack.classList.add('open'); document.body.style.overflow = 'hidden';
  }
  function setProductJsonLd(id, p, l){
    var el = document.getElementById('pm-jsonld');
    if (!el){ el = document.createElement('script'); el.type = 'application/ld+json'; el.id = 'pm-jsonld'; document.head.appendChild(el); }
    var data = {
      '@context': 'https://schema.org/', '@type': 'Product',
      name: l.name, image: new URL(IMG + p.img, location.href).href,
      description: pmDesc.textContent, brand: { '@type': 'Brand', name: 'Areias' },
      offers: { '@type': 'Offer', priceCurrency: 'EUR', price: (p.price / 100).toFixed(2), availability: 'https://schema.org/InStock' }
    };
    if (p.ean) data.gtin13 = p.ean;
    el.textContent = JSON.stringify(data);
  }
  function closeProduct(){ if (!pmBack) return; pmBack.classList.remove('open'); if (!drawer || !drawer.classList.contains('open')) document.body.style.overflow = ''; }

  // ---------- Wire up ----------
  buildDrawer();
  buildProductModal();
  var cartBtn = document.querySelector('.cart-btn');
  if (cartBtn) cartBtn.addEventListener('click', function(){ openCart(); });

  var qs = new URLSearchParams(location.search);
  if (qs.get('checkout') === 'success'){ setCart({}); setMsg(T.ok); openCart(); history.replaceState({}, '', location.pathname); }
  else if (qs.get('checkout') === 'cancel'){ setMsg(T.cancel); openCart(); history.replaceState({}, '', location.pathname); }

  renderGrid();
  renderCart();

  // ---------- Newsletter (Platzhalter) ----------
  var form = document.querySelector('.nl-form');
  if (form) form.addEventListener('submit', function(e){
    e.preventDefault();
    document.querySelector('.nl-msg').textContent = form.dataset.ok;
    form.reset();
  });

  // ---------- KI-Berater (Chat) ----------
  var CT = {
    de: { open: 'Beraterin', title: 'Schmuck-Beratung', sub: 'meist in wenigen Sekunden', greet: 'Hallo! Ich helfe dir gern, das passende Stück zu finden – erzähl mir, für wen oder für welchen Anlass. 💛', ph: 'Schreib deine Frage…', send: 'Senden', offline: 'Die Beratung ist noch nicht aktiviert. Schreib uns gern an iracemasiqueira83@gmail.com – wir helfen dir persönlich.', error: 'Es gab ein Problem. Bitte versuch es später noch einmal oder schreib an iracemasiqueira83@gmail.com.', typing: 'schreibt…', busy: 'Der Berater ist heute sehr gefragt und macht kurz Pause. Schreib uns gern an iracemasiqueira83@gmail.com – wir helfen persönlich.', close: 'Schließen' },
    pt: { open: 'Consultora', title: 'Aconselhamento', sub: 'normalmente em segundos', greet: 'Olá! Ajudo-o com todo o gosto a encontrar a peça certa – diga-me para quem ou para que ocasião. 💛', ph: 'Escreva a sua pergunta…', send: 'Enviar', offline: 'O aconselhamento ainda não está ativo. Escreva-nos para iracemasiqueira83@gmail.com – ajudamos pessoalmente.', error: 'Ocorreu um problema. Tente novamente mais tarde ou escreva para iracemasiqueira83@gmail.com.', typing: 'a escrever…', busy: 'O nosso consultor está muito solicitado hoje e faz uma pausa. Escreva-nos para iracemasiqueira83@gmail.com – ajudamos pessoalmente.', close: 'Fechar' },
    en: { open: 'Advisor', title: 'Jewellery advice', sub: 'usually within seconds', greet: 'Hi! I’m happy to help you find the right piece – tell me who it’s for or the occasion. 💛', ph: 'Type your question…', send: 'Send', offline: 'The advisor isn’t active yet. Email us at iracemasiqueira83@gmail.com – we’ll help you personally.', error: 'Something went wrong. Please try again later or email iracemasiqueira83@gmail.com.', typing: 'typing…', busy: 'Our advisor is very busy today and is taking a short break. Email us at iracemasiqueira83@gmail.com – we’ll help you personally.', close: 'Close' }
  }[LANG];

  var chatMsgs = [];       // Verlauf {role, content}
  var chatBusy = false;
  var chatEls = null;

  function buildChat(){
    var btn = document.createElement('button');
    btn.className = 'chat-fab';
    btn.type = 'button';
    btn.setAttribute('aria-label', CT.open);
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H8l-4 4z"/></svg><span>' + CT.open + '</span>';

    var panel = document.createElement('div');
    panel.className = 'chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', CT.title);
    panel.innerHTML =
      '<div class="chat-head"><div><p class="chat-title">' + CT.title + '</p><p class="chat-sub">' + CT.sub + '</p></div>' +
      '<button class="chat-close" type="button" aria-label="' + CT.close + '">&times;</button></div>' +
      '<div class="chat-log" aria-live="polite"></div>' +
      '<form class="chat-form"><textarea class="chat-input" rows="1" placeholder="' + CT.ph + '" aria-label="' + CT.ph + '"></textarea>' +
      '<button class="chat-send" type="submit" aria-label="' + CT.send + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-3-6-7-2z"/></svg></button></form>';

    document.body.appendChild(btn);
    document.body.appendChild(panel);
    chatEls = {
      btn: btn, panel: panel,
      log: panel.querySelector('.chat-log'),
      form: panel.querySelector('.chat-form'),
      input: panel.querySelector('.chat-input')
    };

    btn.addEventListener('click', toggleChat);
    panel.querySelector('.chat-close').addEventListener('click', function(){ setChatOpen(false); });
    chatEls.form.addEventListener('submit', function(e){ e.preventDefault(); sendChat(); });
    chatEls.input.addEventListener('keydown', function(e){
      if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendChat(); }
    });
    chatEls.input.addEventListener('input', function(){
      chatEls.input.style.height = 'auto';
      chatEls.input.style.height = Math.min(96, chatEls.input.scrollHeight) + 'px';
    });
  }

  function setChatOpen(open){
    if (!chatEls) return;
    chatEls.panel.classList.toggle('open', open);
    chatEls.btn.classList.toggle('hide', open);
    if (open){
      if (!chatEls.log.childElementCount) addBubble('bot', CT.greet);
      setTimeout(function(){ chatEls.input.focus(); }, 60);
    }
  }
  function toggleChat(){ setChatOpen(!chatEls.panel.classList.contains('open')); }

  function addBubble(who, text){
    var b = document.createElement('div');
    b.className = 'chat-msg ' + who;
    b.textContent = text;
    chatEls.log.appendChild(b);
    chatEls.log.scrollTop = chatEls.log.scrollHeight;
    return b;
  }
  function addProducts(list){
    if (!list || !list.length) return;
    var wrap = document.createElement('div');
    wrap.className = 'chat-recs';
    list.forEach(function(p){
      var card = document.createElement('button');
      card.className = 'chat-rec';
      card.type = 'button';
      card.innerHTML = '<img src="' + IMG + p.img + '" alt=""><span class="chat-rec-n"></span><span class="chat-rec-p"></span>';
      card.querySelector('.chat-rec-n').textContent = p.name;
      card.querySelector('.chat-rec-p').textContent = priceFmt(p.price);
      card.addEventListener('click', function(){ openProduct(p.id); });
      wrap.appendChild(card);
    });
    chatEls.log.appendChild(wrap);
    chatEls.log.scrollTop = chatEls.log.scrollHeight;
  }

  async function sendChat(){
    if (chatBusy || !chatEls) return;
    var text = chatEls.input.value.trim();
    if (!text) return;
    chatEls.input.value = ''; chatEls.input.style.height = 'auto';
    addBubble('me', text);
    chatMsgs.push({ role: 'user', content: text });
    chatBusy = true;
    var typing = addBubble('bot typing', CT.typing);
    try {
      var r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: LANG, messages: chatMsgs })
      });
      typing.remove();
      // 503 = Schlüssel fehlt · 404/405 = kein Backend (z. B. statische Vorschau) → beides: „noch nicht aktiv"
      if (r.status === 503 || r.status === 404 || r.status === 405){ addBubble('bot', CT.offline); chatBusy = false; return; }
      if (r.status === 429){ addBubble('bot', CT.busy); chatBusy = false; return; }
      if (!r.ok){ addBubble('bot', CT.error); chatBusy = false; return; }
      var data;
      try { data = await r.json(); }
      catch (_){ addBubble('bot', CT.offline); chatBusy = false; return; }
      var reply = (data.reply || '').trim() || CT.error;
      addBubble('bot', reply);
      addProducts(data.products);
      chatMsgs.push({ role: 'assistant', content: reply });
    } catch (e){
      typing.remove();
      addBubble('bot', CT.error);
    }
    chatBusy = false;
  }

  buildChat();
})();
