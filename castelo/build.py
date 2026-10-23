"""Erzeugt alle HTML-Seiten (DE / EN / PT) in public/.

Texte, Kontaktdaten und Menü stehen nur hier. Nach einer Änderung einfach ausführen:
    python3 build.py
Shop-Artikel und Preise stehen NICHT hier, sondern in public/assets/catalog.js.
"""
import os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public')
DOMAIN = 'https://www.castelomotorhomesandcaravanrepairs.com'

NAME = 'Castelo Motorhomes and Caravan Repairs'
TEL_W, TEL_W_H = '+351282044808', '+351 282 044 808'
TEL_M, TEL_M_H = '+351933917633', '+351 933 917 633'
WA, WA_H = '351933917633', '+351 933 917 633'
MAIL = 'info@castelomotorhomes.com'
NIF = 'PT297662414'
MAPS = 'https://www.google.com/maps/search/?api=1&query=Castelo+Motorhomes+P%C3%AAra+Portugal'
TOWNS = ('Sagres · Lagos · Aljezur · Alvor · Portimão · Monchique · Lagoa · Carvoeiro · Silves · Armação de Pêra · '
         'Albufeira · Vilamoura · Quarteira · Almancil · Loulé · Faro · Olhão · Tavira · Monte Gordo · '
         'Vila Real de Santo António · Beja')

LANGS = ['de', 'en', 'pt']
# Seiten-Adressen je Sprache (DE = alte Webador-Adressen)
SLUGS = {
    'home':     {'de': '/', 'en': '/en/', 'pt': '/pt/'},
    'services': {'de': '/unsere-dienstleistungen', 'en': '/en/services', 'pt': '/pt/servicos'},
    'tech':     {'de': '/technik', 'en': '/en/technology', 'pt': '/pt/tecnica'},
    'shop':     {'de': '/campingshop', 'en': '/en/shop', 'pt': '/pt/loja'},
    'hours':    {'de': '/oeffnungszeiten', 'en': '/en/opening-hours', 'pt': '/pt/horario'},
    'contact':  {'de': '/kontakt', 'en': '/en/contact', 'pt': '/pt/contacto'},
    'legal':    {'de': '/impressum', 'en': '/en/legal', 'pt': '/pt/informacao-legal'},
    # Vorlage für Artikelseiten – der Server setzt {{ID}}, {{TITLE}}, {{DESC}}, {{BODY}} ein
    'item':     {'de': '/campingshop/artikel/{{ID}}', 'en': '/en/shop/item/{{ID}}', 'pt': '/pt/loja/artigo/{{ID}}'},
}
NAV_KEYS = ['home', 'services', 'tech', 'shop', 'hours', 'contact']

LOGO = '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="34" cy="14" r="7" fill="#e8762c"/><path fill="#12324a" d="M6 42V16h6v5h5v-5h6v5h5v-5h6v26H27V32a4 4 0 0 0-8 0v10z"/></svg>'
WA_ICON = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm0 23.6a10.6 10.6 0 0 1-5.4-1.5l-.4-.2-3.9 1 1-3.8-.2-.4A10.6 10.6 0 1 1 16 26.6zm5.8-7.9c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7 0a8.7 8.7 0 0 1-4.3-3.8c-.3-.6.3-.5 1-1.7.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.6 3.6 0 0 0-1.1 2.7 6.3 6.3 0 0 0 1.3 3.3 14.4 14.4 0 0 0 5.5 4.9c2 .9 2.9 1 3.9.8a3.3 3.3 0 0 0 2.2-1.5 2.7 2.7 0 0 0 .2-1.5c-.1-.2-.3-.3-.7-.5z"/></svg>'

# ---------------------------------------------------------------- Texte
T = {
'de': dict(
    nav=['Home', 'Leistungen', 'Technik', 'Campingshop', 'Öffnungszeiten', 'Kontakt'],
    langname='Deutsch', skip='Zum Inhalt springen', menu='Menü', mainmenu='Hauptmenü', cart='Warenkorb',
    tagline='&amp; Caravan Repairs · Algarve', place='Pêra, Algarve (Portugal)',
    workshop='Werkstatt', mobile='Mobil', email='E-Mail', location='Standort',
    f_about='Reparatur, Wartung und Umbau von Wohnmobilen und Wohnwagen an der Algarve – seit 20 Jahren.',
    f_contact='Kontakt', f_hours='Öffnungszeiten', f_pages='Seiten', f_legal='Impressum &amp; Datenschutz',
    f_towns='Wir betreuen Camper aus der ganzen Algarve:', partner='Offizieller Fachhändler von', imprint='Impressum', privacy='Datenschutz',
    hours_short=['Mo – Do: 10:00 – 17:00', 'Fr: 10:00 – 13:00', 'Sa, So: geschlossen'],
    days=['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'], closed='geschlossen',
    wa_label='Per WhatsApp schreiben', close='Schließen', sum='Summe',
    cart_note='inkl. MwSt., zzgl. Versand. Abholung in der Werkstatt ist kostenlos – Auswahl an der Kasse.',
    checkout='Zur Kasse', continue_shop='Weiter einkaufen',
    btn_appt='Termin anfragen', btn_call='Anrufen:',
    cta_t='Ihr Fahrzeug braucht Hilfe?', cta_p='Rufen Sie uns an, schreiben Sie per WhatsApp oder nutzen Sie das Kontaktformular.',
    form=dict(h='Termin oder Frage', name='Name *', email='E-Mail *', phone='Telefon / WhatsApp', vehicle='Fahrzeug',
              vehicle_ph='z. B. Fiat Ducato, Hymer, Bj. 2015', msg='Ihre Nachricht *', msg_ph='Was ist das Problem? Wann passt es Ihnen?',
              hp='Dieses Feld leer lassen', send='Nachricht senden',
              note='Ihre Angaben verwenden wir nur, um Ihre Anfrage zu beantworten. Mehr dazu im'),
),
'en': dict(
    nav=['Home', 'Services', 'Technology', 'Camping shop', 'Opening hours', 'Contact'],
    langname='English', skip='Skip to content', menu='Menu', mainmenu='Main menu', cart='Basket',
    tagline='&amp; Caravan Repairs · Algarve', place='Pêra, Algarve (Portugal)',
    workshop='Workshop', mobile='Mobile', email='Email', location='Location',
    f_about='Repair, servicing and conversion of motorhomes and caravans in the Algarve – for 20 years.',
    f_contact='Contact', f_hours='Opening hours', f_pages='Pages', f_legal='Legal notice &amp; privacy',
    f_towns='We look after campers from all over the Algarve:', partner='Official dealer of', imprint='Legal notice', privacy='Privacy',
    hours_short=['Mon – Thu: 10:00 – 17:00', 'Fri: 10:00 – 13:00', 'Sat, Sun: closed'],
    days=['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], closed='closed',
    wa_label='Message us on WhatsApp', close='Close', sum='Total',
    cart_note='Incl. VAT, plus delivery. Collection at the workshop is free – choose at checkout.',
    checkout='Checkout', continue_shop='Continue shopping',
    btn_appt='Request an appointment', btn_call='Call:',
    cta_t='Does your vehicle need help?', cta_p='Give us a call, send a WhatsApp message or use the contact form.',
    form=dict(h='Appointment or question', name='Name *', email='Email *', phone='Phone / WhatsApp', vehicle='Vehicle',
              vehicle_ph='e.g. Fiat Ducato, Hymer, 2015', msg='Your message *', msg_ph='What is the problem? When suits you?',
              hp='Leave this field empty', send='Send message',
              note='We only use your details to answer your enquiry. More in our'),
),
'pt': dict(
    nav=['Início', 'Serviços', 'Técnica', 'Loja de campismo', 'Horário', 'Contacto'],
    langname='Português', skip='Saltar para o conteúdo', menu='Menu', mainmenu='Menu principal', cart='Carrinho',
    tagline='&amp; Caravan Repairs · Algarve', place='Pêra, Algarve (Portugal)',
    workshop='Oficina', mobile='Telemóvel', email='E-mail', location='Localização',
    f_about='Reparação, manutenção e transformação de autocaravanas e caravanas no Algarve – há 20 anos.',
    f_contact='Contacto', f_hours='Horário', f_pages='Páginas', f_legal='Informação legal &amp; privacidade',
    f_towns='Apoiamos campistas de todo o Algarve:', partner='Revendedor oficial', imprint='Informação legal', privacy='Privacidade',
    hours_short=['Seg – Qui: 10:00 – 17:00', 'Sex: 10:00 – 13:00', 'Sáb, Dom: encerrado'],
    days=['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'], closed='encerrado',
    wa_label='Enviar mensagem por WhatsApp', close='Fechar', sum='Total',
    cart_note='IVA incluído, portes à parte. O levantamento na oficina é gratuito – escolha no pagamento.',
    checkout='Finalizar compra', continue_shop='Continuar a comprar',
    btn_appt='Pedir marcação', btn_call='Ligar:',
    cta_t='O seu veículo precisa de ajuda?', cta_p='Ligue-nos, envie uma mensagem por WhatsApp ou use o formulário de contacto.',
    form=dict(h='Marcação ou pergunta', name='Nome *', email='E-mail *', phone='Telefone / WhatsApp', vehicle='Veículo',
              vehicle_ph='p. ex. Fiat Ducato, Hymer, 2015', msg='A sua mensagem *', msg_ph='Qual é o problema? Quando lhe dá jeito?',
              hp='Deixe este campo vazio', send='Enviar mensagem',
              note='Usamos os seus dados apenas para responder ao seu pedido. Saiba mais na'),
),
}


def url(key, lang):
    return SLUGS[key][lang]


def filepath(key, lang):
    s = SLUGS[key][lang].strip('/')
    if key == 'home':
        return os.path.join(ROOT, s, 'index.html') if s else os.path.join(ROOT, 'index.html')
    return os.path.join(ROOT, s + '.html')


def page(key, lang, title, desc, body):
    L = T[lang]
    nav = ''.join(f'<li><a href="{url(k, lang)}">{n}</a></li>' for k, n in zip(NAV_KEYS, L['nav']))
    switch = ' '.join(
        f'<a href="{url(key, l)}" hreflang="{l}" lang="{l}"' + (' aria-current="true"' if l == lang else '') + f'>{l.upper()}</a>'
        for l in LANGS)
    alternates = '\n'.join(f'<link rel="alternate" hreflang="{l}" href="{DOMAIN}{url(key, l)}">' for l in LANGS)
    alternates += f'\n<link rel="alternate" hreflang="x-default" href="{DOMAIN}{url(key, "de")}">'
    full_title = title if key == 'home' else f'{title} | Castelo Motorhomes'
    hours = ''.join(f'<li>{h}</li>' for h in L['hours_short'])
    pp = url('legal', lang)
    return f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{full_title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{DOMAIN}{url(key, lang)}">
{alternates}
<meta property="og:type" content="website">
<meta property="og:title" content="{full_title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{DOMAIN}/img/hero-wohnmobil.jpg">
<link rel="icon" href="/img/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/style.css">
</head>
<body>
<a class="skip" href="#main">{L['skip']}</a>
<div class="topbar"><div class="wrap">
  <a href="tel:{TEL_W}">☎ {TEL_W_H}</a>
  <a href="https://wa.me/{WA}">WhatsApp</a>
  <a href="mailto:{MAIL}">{MAIL}</a>
  <span class="langs">{switch}</span>
</div></div>
<header class="site"><div class="wrap">
  <a class="brand" href="{url('home', lang)}">{LOGO}<span><b>Castelo Motorhomes</b><small>{L['tagline']}</small></span></a>
  <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="menu">{L['menu']}</button>
  <nav class="main" id="menu" aria-label="{L['mainmenu']}"><ul>{nav}<li><a class="cart-btn" href="{url('shop', lang)}" data-open-cart>{L['cart']} <span class="cart-count">0</span></a></li></ul></nav>
</div></header>
<main id="main">
{body}
</main>
<footer class="site"><div class="wrap">
  <div class="grid c4">
    <div><h3>Castelo Motorhomes</h3><p>{L['f_about']}</p></div>
    <div><h3>{L['f_contact']}</h3><ul>
      <li><a href="tel:{TEL_W}">{TEL_W_H}</a> ({L['workshop']})</li>
      <li><a href="tel:{TEL_M}">{TEL_M_H}</a> ({L['mobile']} / WhatsApp)</li>
      <li><a href="mailto:{MAIL}">{MAIL}</a></li>
      <li>{L['place']}</li></ul></div>
    <div><h3>{L['f_hours']}</h3><ul>{hours}</ul></div>
    <div><h3>{L['f_pages']}</h3><ul>{nav}<li><a href="{pp}">{L['f_legal']}</a></li></ul></div>
  </div>
  <p class="partner-foot"><span>{L['partner']}</span> <a href="{url('shop', lang)}"><img src="/img/camping-profi-weiss.svg" alt="CAMPING-PROFI" width="120" height="49" loading="lazy"></a></p>
  <p class="towns">{L['f_towns']} {TOWNS}</p>
  <div class="bottom"><span>© <span data-year>2026</span> {NAME}</span><span><a href="{pp}">{L['imprint']}</a> · <a href="{pp}#datenschutz">{L['privacy']}</a> · <a href="https://www.livroreclamacoes.pt/">Livro de Reclamações</a></span></div>
</div></footer>
<a class="float-wa" href="https://wa.me/{WA}" aria-label="{L['wa_label']}">{WA_ICON}</a>
<div class="drawer-bg" hidden></div>
<aside class="drawer" id="cart" hidden aria-label="{L['cart']}">
  <header><h2>{L['cart']}</h2><button class="x" type="button" aria-label="{L['close']}">×</button></header>
  <div class="items"></div>
  <footer>
    <div class="sum"><span>{L['sum']}</span><span class="sum-value">0,00 €</span></div>
    <p class="note">{L['cart_note']}</p>
    <button class="btn checkout" type="button">{L['checkout']}</button>
    <a class="btn dark" href="{url('shop', lang)}">{L['continue_shop']}</a>
    <p class="checkout-msg form-msg err" role="status"></p>
  </footer>
</aside>
<script src="/assets/app.js"></script>
</body>
</html>
'''


def hero(lang, cls, eyebrow, h1, lead, actions=True, small=True):
    L = T[lang]
    a = (f'<div class="actions"><a class="btn" href="{url("contact", lang)}">{L["btn_appt"]}</a>'
         f'<a class="btn ghost" href="tel:{TEL_W}">{L["btn_call"]} {TEL_W_H}</a></div>') if actions else ''
    return f'''<section class="hero {cls}{' small' if small else ''}"><div class="wrap">
  <span class="eyebrow">{eyebrow}</span>
  <h1>{h1}</h1>
  <p class="lead">{lead}</p>
  {a}
</div></section>'''


def cta(lang, title=None, text=None):
    L = T[lang]
    return f'''<section class="block"><div class="wrap"><div class="cta">
  <div><h2>{title or L['cta_t']}</h2><p>{text or L['cta_p']}</p></div>
  <div class="actions"><a class="btn" href="{url('contact', lang)}">{L['btn_appt']}</a><a class="btn wa" href="https://wa.me/{WA}">WhatsApp</a></div>
</div></div></section>'''


def form(lang):
    F = T[lang]['form']
    return f'''<form class="contact" novalidate>
  <h2>{F['h']}</h2>
  <div class="row">
    <div><label for="f-name">{F['name']}</label><input id="f-name" name="name" autocomplete="name" required></div>
    <div><label for="f-email">{F['email']}</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>
  </div>
  <div class="row">
    <div><label for="f-phone">{F['phone']}</label><input id="f-phone" name="phone" type="tel" autocomplete="tel"></div>
    <div><label for="f-vehicle">{F['vehicle']}</label><input id="f-vehicle" name="vehicle" placeholder="{F['vehicle_ph']}"></div>
  </div>
  <label for="f-msg">{F['msg']}</label>
  <textarea id="f-msg" name="message" required placeholder="{F['msg_ph']}"></textarea>
  <div class="hp" aria-hidden="true"><label for="f-web">{F['hp']}</label><input id="f-web" name="website" tabindex="-1" autocomplete="off"></div>
  <button class="btn" type="submit">{F['send']}</button>
  <p class="form-msg" role="status"></p>
  <p class="note">{F['note']} <a href="{url('legal', lang)}#datenschutz">{T[lang]['privacy']}</a>.</p>
</form>'''


def hours_table(lang):
    L = T[lang]
    rows = []
    for d in [1, 2, 3, 4, 5, 6, 0]:
        t = '10:00 – 17:00' if d in (1, 2, 3, 4) else ('10:00 – 13:00' if d == 5 else L['closed'])
        cls = ' class="closed"' if d in (6, 0) else ''
        rows.append(f'  <tr data-day="{d}"{cls}><td>{L["days"][d]}</td><td>{t}</td></tr>')
    return '<table class="hours">\n' + '\n'.join(rows) + '\n</table>'


def checks(items):
    return '<ul class="checks">' + ''.join(f'<li>{i}</li>' for i in items) + '</ul>'


def card(img, alt, w, h, title, text, href, more):
    return (f'<article class="card"><img src="/img/{img}" alt="{alt}" width="{w}" height="{h}" loading="lazy">'
            f'<div class="body"><h3>{title}</h3><p>{text}</p><a class="more" href="{href}">{more} →</a></div></article>')


def faq(items):
    return ''.join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q, a in items)


def split(img, alt, w, h, inner, img_left=True, cls='block white', id_=''):
    pic = f'<img class="photo" src="/img/{img}" alt="{alt}" width="{w}" height="{h}" loading="lazy">'
    i = f' id="{id_}"' if id_ else ''
    parts = (pic, f'<div>{inner}</div>') if img_left else (f'<div>{inner}</div>', pic)
    return f'<section class="{cls}"{i}><div class="wrap grid c2">\n  {parts[0]}\n  {parts[1]}\n</div></section>'


# ---------------------------------------------------------------- Inhalte je Seite
def home(lang):
    u = lambda k: url(k, lang)
    C = {
    'de': dict(
        title='Castelo Motorhomes – Wohnmobil- & Wohnwagen-Werkstatt an der Algarve',
        desc='Reparatur, Wartung, Solar- und Batterieeinbau für Wohnmobile und Wohnwagen an der Algarve. Seit 20 Jahren, deutschsprachig, mit Campingshop in Pêra.',
        eyebrow='Wohnmobil- &amp; Caravan-Werkstatt · Algarve', h1='Zuverlässige Reparaturen für Ihr Zuhause auf Rädern',
        lead='Seit 20 Jahren reparieren, warten und rüsten wir Wohnmobile und Wohnwagen an der Algarve aus – ehrlich, gründlich und mit hochwertigen Ersatzteilen.',
        s_eye='Unsere Leistungen', s_h='Alles für Wohnmobil und Wohnwagen – aus einer Hand',
        s_p='Ob Panne im Urlaub, Wartung vor der nächsten Tour oder ein Umbau nach Ihren Wünschen: Bei uns sind Sie richtig.',
        more='Mehr erfahren',
        cards=[('Radwechsel mit Schlagschrauber', 'Wohnmobil-Reparaturen', 'Fachgerechte Reparaturen mit hochwertigen Ersatzteilen – schnell und präzise, damit Sie bald wieder unterwegs sind.'),
               ('Wohnwagen am Abend', 'Caravan-Wartung', 'Gründliche Wartung für eine lange Lebensdauer und zuverlässige Technik Ihres Wohnwagens.'),
               ('Mobile Solarpanels auf einer Wiese', 'Solar, Batterie &amp; Umbau', 'Solaranlagen, Lithium- und AGM-Batterien sowie individuelle Anpassungen und Spezialanfertigungen.')],
        w_eye='Warum Castelo', w_h='Ihr Partner für Reparatur und Wartung in Portugal',
        facts=[('20 Jahre', 'Erfahrung mit Reise- und Wohnmobilen'), ('Deutsch', 'Beratung in Ihrer Sprache – auch Englisch und Portugiesisch'),
               ('Ganze Algarve', 'Von Sagres bis Vila Real de Santo António'), ('Campingshop', 'Zubehör, Ersatzteile – und was fehlt, bestellen wir')],
        a_alt='Werkzeugwand in der Werkstatt', a_eye='Über uns', a_h='Damit Sie sich auf das Wesentliche konzentrieren können: Ihre Reise',
        a_p='Castelo Motorhomes and Caravan Repairs ist Ihr vertrauenswürdiger Partner für alle Reparatur- und Wartungsarbeiten an Wohnmobilen und Caravans in Portugal. Mit 20 Jahren Erfahrung bieten wir fachkundige Arbeit, die auf Ihr Fahrzeug und Ihre Bedürfnisse zugeschnitten ist.',
        a_checks=['Nur hochwertige Materialien und Ersatzteile', 'Klare Absprache vor jeder Reparatur', 'Elektrik, Mechanik, Gas, Wasser, Aufbau'],
        a_btn='Alle Leistungen ansehen',
        q_eye='Häufige Fragen', q_h='Gut zu wissen',
        faq=[('Welche Arbeiten übernehmen Sie?', 'Reparaturen am Wohnmobil, Caravan-Wartung, Solaranlagen, Batterieeinbau (AGM und Lithium), Elektrik und individuelle Umbauten. Fragen Sie einfach – wir finden eine Lösung.'),
             ('Wie bekomme ich einen Termin?', f'Per Telefon, WhatsApp oder über unser <a href="{u("contact")}">Kontaktformular</a>. Für Inspektionen und größere Reparaturen empfehlen wir einen Termin, damit keine Wartezeit entsteht.'),
             ('Helfen Sie auch Urlaubern mit einer Panne?', 'Ja. Melden Sie sich am besten per WhatsApp mit einer kurzen Beschreibung und einem Foto – wir sagen Ihnen schnell, wann wir helfen können.'),
             ('Bekomme ich bei Ihnen auch Ersatzteile und Zubehör?', f'Ja, in unserem <a href="{u("shop")}">Campingshop</a> vor Ort und online. Was nicht vorrätig ist, bestellen wir für Sie.')],
        h_eye='Öffnungszeiten', h_h='Wann wir für Sie da sind',
        h_note=f'Feiertage und Betriebsurlaub geben wir auf der Seite <a href="{u("hours")}">Öffnungszeiten</a> bekannt.'),
    'en': dict(
        title='Castelo Motorhomes – motorhome & caravan workshop in the Algarve',
        desc='Repairs, servicing, solar and battery installation for motorhomes and caravans in the Algarve. 20 years of experience, German and English spoken, camping shop in Pêra.',
        eyebrow='Motorhome &amp; caravan workshop · Algarve', h1='Reliable repairs for your home on wheels',
        lead='For 20 years we have been repairing, servicing and equipping motorhomes and caravans in the Algarve – honest, thorough work with high-quality parts.',
        s_eye='Our services', s_h='Everything for your motorhome and caravan – under one roof',
        s_p='A breakdown on holiday, a service before your next trip or a conversion to your own plans: you have come to the right place.',
        more='Learn more',
        cards=[('Changing a wheel with an impact wrench', 'Motorhome repairs', 'Professional repairs with high-quality parts – fast and precise, so you are soon back on the road.'),
               ('Caravan in the evening', 'Caravan servicing', 'Thorough servicing for a long life and reliable technology in your caravan.'),
               ('Portable solar panels in a meadow', 'Solar, batteries &amp; conversions', 'Solar systems, lithium and AGM batteries, plus custom modifications and special builds.')],
        w_eye='Why Castelo', w_h='Your partner for repairs and servicing in Portugal',
        facts=[('20 years', 'of experience with motorhomes and campervans'), ('Multilingual', 'Advice in German, English and Portuguese'),
               ('All of the Algarve', 'From Sagres to Vila Real de Santo António'), ('Camping shop', 'Accessories and spare parts – and we order what we do not stock')],
        a_alt='Tool wall in the workshop', a_eye='About us', a_h='So you can focus on what really matters: your journey',
        a_p='Castelo Motorhomes and Caravan Repairs is your trusted partner for all repair and maintenance work on motorhomes and caravans in Portugal. With 20 years of experience, we deliver expert work tailored to your vehicle and your needs.',
        a_checks=['Only high-quality materials and spare parts', 'Clear agreement before every repair', 'Electrics, mechanics, gas, water, bodywork'],
        a_btn='See all services',
        q_eye='FAQ', q_h='Good to know',
        faq=[('What work do you do?', 'Motorhome repairs, caravan servicing, solar systems, battery installation (AGM and lithium), electrics and custom conversions. Just ask – we will find a solution.'),
             ('How do I book an appointment?', f'By phone, WhatsApp or through our <a href="{u("contact")}">contact form</a>. For inspections and larger repairs we recommend booking ahead so you do not have to wait.'),
             ('Do you also help holidaymakers who break down?', 'Yes. Ideally send us a WhatsApp message with a short description and a photo – we will quickly tell you when we can help.'),
             ('Can I get spare parts and accessories from you?', f'Yes, in our <a href="{u("shop")}">camping shop</a> at the workshop and online. If something is not in stock, we will order it for you.')],
        h_eye='Opening hours', h_h='When we are here for you',
        h_note=f'Public holidays and closures are announced on our <a href="{u("hours")}">opening hours</a> page.'),
    'pt': dict(
        title='Castelo Motorhomes – oficina de autocaravanas e caravanas no Algarve',
        desc='Reparação, manutenção, instalação de painéis solares e baterias para autocaravanas e caravanas no Algarve. 20 anos de experiência e loja de campismo em Pêra.',
        eyebrow='Oficina de autocaravanas &amp; caravanas · Algarve', h1='Reparações de confiança para a sua casa sobre rodas',
        lead='Há 20 anos que reparamos, fazemos a manutenção e equipamos autocaravanas e caravanas no Algarve – com honestidade, rigor e peças de qualidade.',
        s_eye='Os nossos serviços', s_h='Tudo para a sua autocaravana e caravana – num só lugar',
        s_p='Uma avaria nas férias, a manutenção antes da próxima viagem ou uma transformação à sua medida: está no sítio certo.',
        more='Saber mais',
        cards=[('Troca de roda com chave de impacto', 'Reparação de autocaravanas', 'Reparações profissionais com peças de qualidade – rápidas e precisas, para voltar à estrada em breve.'),
               ('Caravana ao fim do dia', 'Manutenção de caravanas', 'Manutenção cuidada para uma longa vida útil e uma técnica fiável na sua caravana.'),
               ('Painéis solares portáteis num prado', 'Solar, baterias &amp; transformações', 'Sistemas solares, baterias de lítio e AGM, adaptações personalizadas e construções especiais.')],
        w_eye='Porquê a Castelo', w_h='O seu parceiro para reparação e manutenção em Portugal',
        facts=[('20 anos', 'de experiência com autocaravanas'), ('Multilingue', 'Atendimento em português, alemão e inglês'),
               ('Todo o Algarve', 'De Sagres a Vila Real de Santo António'), ('Loja de campismo', 'Acessórios e peças – e encomendamos o que não houver em stock')],
        a_alt='Parede de ferramentas na oficina', a_eye='Sobre nós', a_h='Para que se possa concentrar no essencial: a sua viagem',
        a_p='A Castelo Motorhomes and Caravan Repairs é o seu parceiro de confiança para todos os trabalhos de reparação e manutenção de autocaravanas e caravanas em Portugal. Com 20 anos de experiência, fazemos um trabalho especializado e adaptado ao seu veículo e às suas necessidades.',
        a_checks=['Apenas materiais e peças de qualidade', 'Orçamento claro antes de cada reparação', 'Eletricidade, mecânica, gás, água, carroçaria'],
        a_btn='Ver todos os serviços',
        q_eye='Perguntas frequentes', q_h='Bom saber',
        faq=[('Que trabalhos fazem?', 'Reparação de autocaravanas, manutenção de caravanas, sistemas solares, instalação de baterias (AGM e lítio), eletricidade e transformações personalizadas. Pergunte – encontramos uma solução.'),
             ('Como faço uma marcação?', f'Por telefone, WhatsApp ou através do nosso <a href="{u("contact")}">formulário de contacto</a>. Para inspeções e reparações maiores recomendamos marcação, para evitar esperas.'),
             ('Também ajudam turistas com uma avaria?', 'Sim. O ideal é enviar uma mensagem por WhatsApp com uma breve descrição e uma fotografia – dizemos-lhe rapidamente quando podemos ajudar.'),
             ('Também vendem peças e acessórios?', f'Sim, na nossa <a href="{u("shop")}">loja de campismo</a> na oficina e online. O que não houver em stock, encomendamos para si.')],
        h_eye='Horário', h_h='Quando estamos disponíveis',
        h_note=f'Feriados e férias são anunciados na página <a href="{u("hours")}">Horário</a>.'),
    }[lang]
    imgs = [('reparatur.jpg', 1000, 666, u('services') + '#reparatur'), ('caravan.jpg', 1000, 667, u('services') + '#wartung'), ('solar.jpg', 1000, 666, u('tech'))]
    cards = ''.join(card(i[0], c[0], i[1], i[2], c[1], c[2], i[3], C['more']) for i, c in zip(imgs, C['cards']))
    facts = ''.join(f'<div class="fact"><b>{a}</b>{b}</div>' for a, b in C['facts'])
    body = hero(lang, 'hero-home', C['eyebrow'], C['h1'], C['lead'], small=False) + f'''
<section class="block white"><div class="wrap">
  <div class="section-head"><span class="eyebrow">{C['s_eye']}</span><h2>{C['s_h']}</h2><p>{C['s_p']}</p></div>
  <div class="grid c3">{cards}</div>
</div></section>
<section class="block navy"><div class="wrap">
  <div class="section-head"><span class="eyebrow">{C['w_eye']}</span><h2>{C['w_h']}</h2></div>
  <div class="facts">{facts}</div>
</div></section>
''' + split('werkstatt.jpg', C['a_alt'], 1000, 666,
            f'<span class="eyebrow">{C["a_eye"]}</span><h2>{C["a_h"]}</h2><p>{C["a_p"]}</p>{checks(C["a_checks"])}<a class="btn dark" href="{u("services")}">{C["a_btn"]}</a>',
            cls='block') + f'''
<section class="block white"><div class="wrap grid c2">
  <div><span class="eyebrow">{C['q_eye']}</span><h2>{C['q_h']}</h2>{faq(C['faq'])}</div>
  <div><span class="eyebrow">{C['h_eye']}</span><h2>{C['h_h']}</h2>
  <p class="open-now" data-open-now hidden></p>
  {hours_table(lang)}
  <p class="note mt">{C['h_note']}</p></div>
</div></section>
''' + cta(lang)
    return page('home', lang, C['title'], C['desc'], body)


def services(lang):
    C = {
    'de': dict(title='Unsere Leistungen', desc='Wohnmobil-Reparaturen, Caravan-Wartung und Spezialanfertigungen an der Algarve – mit 20 Jahren Erfahrung und hochwertigen Ersatzteilen.',
        eye='Unsere Leistungen', h1='Reparatur, Wartung und Umbau', lead='Unser Team aus qualifizierten Mechanikern sorgt dafür, dass Ihr Fahrzeug schnell und sorgfältig wieder fit für die nächste Reise ist.',
        r=('Radmontage an einem Fahrzeug', 'Motorhome', 'Wohnmobil-Reparaturen', 'Unsere Erfahrung aus 20 Jahren ermöglicht hochwertige Reparaturen an Reise- und Wohnmobilen. Wir arbeiten schnell und präzise, damit Sie sich wieder sorgenfrei auf Ihre Reisen begeben können.',
           ['Fehlersuche und Diagnose', 'Mechanik, Bremsen, Räder und Fahrwerk', 'Elektrik 12 V / 230 V', 'Gas- und Wasserinstallation', 'Aufbau, Fenster, Dachluken, Dichtungen']),
        w=('Wohnwagen mit Vorzelt', 'Caravan', 'Caravan-Wartung', 'Mit einer gründlichen Wartung bleibt Ihr Wohnwagen lange zuverlässig. Wir prüfen Technik und Aufbau und verwenden nur gute Materialien und Ersatzteile.',
           ['Jährliche Wartung und Inspektion', 'Bremsen, Auflaufeinrichtung, Achse, Reifen', 'Licht und Bordelektrik', 'Kühlschrank, Heizung, Boiler', 'Vorbereitung für die Saison – oder fürs Überwintern']),
        m=('Werkzeug und Teile auf dem Werkstattboden', 'Individuell', 'Spezielle Modifikationen', 'Neben Reparatur und Wartung passen wir Wohnmobile und Caravans an Ihre Wünsche an. Unser Ziel sind maßgeschneiderte Lösungen, die Ihr Fahrzeug wirklich verbessern.',
           ['Solaranlagen und Batterien – siehe <a href="{tech}">Technik</a>', 'Zusätzliche Steckdosen, Licht, USB', 'Einbau von Zubehör']),
        t_eye='Termin', t_h='Vereinbaren Sie jetzt einen Termin',
        t_p='Rufen Sie uns an unter <a href="tel:{tel}">{telh}</a>, schreiben Sie per <a href="https://wa.me/{wa}">WhatsApp</a> oder nutzen Sie das Formular. Je genauer Sie das Problem beschreiben (gerne mit Foto), desto schneller können wir helfen.'),
    'en': dict(title='Our services', desc='Motorhome repairs, caravan servicing and custom builds in the Algarve – 20 years of experience and high-quality parts.',
        eye='Our services', h1='Repairs, servicing and conversions', lead='Our team of qualified mechanics makes sure your vehicle is quickly and carefully ready for the next trip.',
        r=('Fitting a wheel on a vehicle', 'Motorhome', 'Motorhome repairs', 'Twenty years of experience allow us to deliver high-quality repairs on motorhomes and campervans. We work quickly and precisely so you can get back on the road without worries.',
           ['Fault finding and diagnostics', 'Mechanics, brakes, wheels and suspension', 'Electrics 12 V / 230 V', 'Gas and water installations', 'Bodywork, windows, roof vents, seals']),
        w=('Caravan with awning', 'Caravan', 'Caravan servicing', 'Thorough servicing keeps your caravan reliable for years. We check the running gear and the habitation area and only use good materials and parts.',
           ['Annual service and inspection', 'Brakes, hitch, axle, tyres', 'Lights and onboard electrics', 'Fridge, heating, water heater', 'Preparing for the season – or for winter storage']),
        m=('Tools and parts on the workshop floor', 'Custom', 'Special modifications', 'Besides repairs and servicing, we adapt motorhomes and caravans to your wishes. Our aim is tailor-made solutions that genuinely improve your vehicle.',
           ['Solar systems and batteries – see <a href="{tech}">Technology</a>', 'Extra sockets, lighting, USB', 'Fitting of accessories']),
        t_eye='Appointment', t_h='Book an appointment now',
        t_p='Call us on <a href="tel:{tel}">{telh}</a>, send a <a href="https://wa.me/{wa}">WhatsApp</a> message or use the form. The more precisely you describe the problem (a photo helps), the faster we can help.'),
    'pt': dict(title='Os nossos serviços', desc='Reparação de autocaravanas, manutenção de caravanas e construções especiais no Algarve – 20 anos de experiência e peças de qualidade.',
        eye='Os nossos serviços', h1='Reparação, manutenção e transformação', lead='A nossa equipa de mecânicos qualificados garante que o seu veículo fica rapidamente e com cuidado pronto para a próxima viagem.',
        r=('Montagem de roda num veículo', 'Autocaravana', 'Reparação de autocaravanas', 'Os nossos 20 anos de experiência permitem reparações de qualidade em autocaravanas. Trabalhamos com rapidez e precisão para que possa voltar a viajar sem preocupações.',
           ['Deteção de avarias e diagnóstico', 'Mecânica, travões, rodas e suspensão', 'Eletricidade 12 V / 230 V', 'Instalações de gás e água', 'Carroçaria, janelas, claraboias, vedantes']),
        w=('Caravana com toldo', 'Caravana', 'Manutenção de caravanas', 'Uma manutenção cuidada mantém a sua caravana fiável durante muitos anos. Verificamos o chassis e a célula e usamos apenas bons materiais e peças.',
           ['Manutenção e inspeção anual', 'Travões, engate, eixo, pneus', 'Luzes e eletricidade de bordo', 'Frigorífico, aquecimento, esquentador', 'Preparação para a época – ou para o inverno']),
        m=('Ferramentas e peças no chão da oficina', 'À medida', 'Modificações especiais', 'Além de reparação e manutenção, adaptamos autocaravanas e caravanas aos seus desejos. O nosso objetivo são soluções à medida que melhoram realmente o seu veículo.',
           ['Sistemas solares e baterias – ver <a href="{tech}">Técnica</a>', 'Tomadas extra, iluminação, USB', 'Montagem de acessórios']),
        t_eye='Marcação', t_h='Faça já a sua marcação',
        t_p='Ligue-nos para o <a href="tel:{tel}">{telh}</a>, envie uma mensagem por <a href="https://wa.me/{wa}">WhatsApp</a> ou use o formulário. Quanto melhor descrever o problema (uma fotografia ajuda), mais depressa podemos ajudar.'),
    }[lang]
    tech = url('tech', lang)

    def sec(d, img, w, h, left, cls, id_):
        items = [x.format(tech=tech) for x in d[4]]
        return split(img, d[0], w, h, f'<span class="eyebrow">{d[1]}</span><h2>{d[2]}</h2><p>{d[3]}</p>{checks(items)}', left, cls, id_)
    body = (hero(lang, 'hero-leistungen', C['eye'], C['h1'], C['lead']) + '\n' +
            sec(C['r'], 'reparatur.jpg', 1000, 666, True, 'block white', 'reparatur') + '\n' +
            sec(C['w'], 'caravan.jpg', 1000, 667, False, 'block', 'wartung') + '\n' +
            sec(C['m'], 'umbau.jpg', 1000, 666, True, 'block white', 'umbau') + f'''
<section class="block"><div class="wrap grid c2">
  <div><span class="eyebrow">{C['t_eye']}</span><h2>{C['t_h']}</h2><p>{C['t_p'].format(tel=TEL_W, telh=TEL_W_H, wa=WA)}</p></div>
  {form(lang)}
</div></section>
''')
    return page('services', lang, C['title'], C['desc'], body)


def tech(lang):
    C = {
    'de': dict(title='Technik: Solar &amp; Batterie', desc='Solaranlagen-Installation und Batterieeinbau (AGM, Lithium) für Wohnmobile und Caravans an der Algarve – mit über 20 Jahren Erfahrung.',
        eye='Technik', h1='Mehr Strom, mehr Freiheit', lead='Solaranlagen, Batterien und Bordelektrik für Wohnmobile und Caravans – geplant nach Ihrem Bedarf und sauber eingebaut.',
        s=('Solarpanels und Powerstation beim Camping', 'Solar', 'Solaranlagen-Installation', 'Eine Solaranlage ist eine der wirksamsten Möglichkeiten, unabhängiger zu werden. Bei der Auswahl berücksichtigen wir die Größe Ihres Fahrzeugs und den Strombedarf Ihrer Geräte und verwenden nur hochwertige Komponenten.',
           ['Beratung und Bedarfsrechnung', 'Solarmodule, MPPT-Laderegler, Verkabelung', 'Saubere Dachdurchführung, dicht verklebt'], 'So können Sie überall stehen, ohne sich um den Strom zu sorgen – und sparen Campingplatzgebühren.'),
        b=('Mechaniker bei der Arbeit', 'Batterie', 'Batterieeinbau', 'Wir prüfen Ihren Energiebedarf und empfehlen die passende Lösung – AGM, Lithium (LiFePO4) oder eine andere Option. Der richtige Einbau schützt Ihre Geräte und sorgt dafür, dass Sie unterwegs immer genug Energie haben.',
           ['Umrüstung auf Lithium inkl. passendem Ladegerät und Booster', 'Batteriecomputer und Überwachung', 'Wechselrichter für 230 V'], ''),
        r_eye='Reparatur', r_h='Reparaturen und Wartung der Bordtechnik',
        r_p='Ob elektrische Ausfälle, mechanische Probleme oder allgemeine Wartung: Wir finden den Fehler schnell und schlagen Lösungen vor, die wirksam und bezahlbar sind. Damit Sie jederzeit sicher und komfortabel unterwegs sind.',
        cta_t='Fragen zu Solar oder Batterie?', cta_p='Wir beraten Sie gerne – am besten mit Fahrzeugtyp und Ihren Geräten.'),
    'en': dict(title='Technology: solar &amp; batteries', desc='Solar installation and battery fitting (AGM, lithium) for motorhomes and caravans in the Algarve – more than 20 years of experience.',
        eye='Technology', h1='More power, more freedom', lead='Solar systems, batteries and onboard electrics for motorhomes and caravans – planned around your needs and neatly installed.',
        s=('Solar panels and power station while camping', 'Solar', 'Solar installation', 'A solar system is one of the most effective ways to become more independent. When choosing one, we take into account the size of your vehicle and the power needs of your devices, and we only use high-quality components.',
           ['Advice and power budget calculation', 'Solar panels, MPPT charge controllers, wiring', 'Clean, properly sealed roof entry'], 'That way you can stay anywhere without worrying about power – and save on campsite fees.'),
        b=('Mechanic at work', 'Battery', 'Battery installation', 'We check your energy needs and recommend the right solution – AGM, lithium (LiFePO4) or another option. A proper installation protects your devices and makes sure you always have enough energy on the road.',
           ['Conversion to lithium incl. matching charger and DC-DC booster', 'Battery monitor and management', 'Inverters for 230 V'], ''),
        r_eye='Repairs', r_h='Repairs and servicing of onboard systems',
        r_p='Electrical failures, mechanical problems or general servicing: we find the fault quickly and suggest solutions that are effective and affordable – so you are always safe and comfortable on the road.',
        cta_t='Questions about solar or batteries?', cta_p='We are happy to advise you – ideally tell us your vehicle type and your devices.'),
    'pt': dict(title='Técnica: solar &amp; baterias', desc='Instalação de painéis solares e baterias (AGM, lítio) em autocaravanas e caravanas no Algarve – mais de 20 anos de experiência.',
        eye='Técnica', h1='Mais energia, mais liberdade', lead='Sistemas solares, baterias e eletricidade de bordo para autocaravanas e caravanas – planeados à sua medida e bem instalados.',
        s=('Painéis solares e estação de energia no campismo', 'Solar', 'Instalação de painéis solares', 'Um sistema solar é uma das formas mais eficazes de ganhar autonomia. Na escolha, consideramos o tamanho do seu veículo e o consumo dos seus aparelhos, e usamos apenas componentes de qualidade.',
           ['Aconselhamento e cálculo de consumo', 'Painéis solares, reguladores MPPT, cablagem', 'Passagem de cabos no tejadilho bem vedada'], 'Assim pode estacionar em qualquer lado sem se preocupar com a energia – e poupa nos parques de campismo.'),
        b=('Mecânico a trabalhar', 'Bateria', 'Instalação de baterias', 'Analisamos o seu consumo e recomendamos a solução certa – AGM, lítio (LiFePO4) ou outra opção. Uma instalação correta protege os seus aparelhos e garante que tem sempre energia suficiente na estrada.',
           ['Conversão para lítio com carregador e booster adequados', 'Monitor de bateria e controlo', 'Inversores para 230 V'], ''),
        r_eye='Reparação', r_h='Reparação e manutenção dos sistemas de bordo',
        r_p='Falhas elétricas, problemas mecânicos ou manutenção geral: encontramos a avaria rapidamente e propomos soluções eficazes e acessíveis – para viajar sempre em segurança e com conforto.',
        cta_t='Dúvidas sobre solar ou baterias?', cta_p='Teremos todo o gosto em aconselhá-lo – indique o tipo de veículo e os seus aparelhos.'),
    }[lang]

    def sec(d, img, left, cls):
        extra = f'<p>{d[5]}</p>' if d[5] else ''
        return split(img, d[0], 1000, 666, f'<span class="eyebrow">{d[1]}</span><h2>{d[2]}</h2><p>{d[3]}</p>{checks(d[4])}{extra}', left, cls)
    body = (hero(lang, 'hero-technik', C['eye'], C['h1'], C['lead']) + '\n' +
            sec(C['s'], 'solar.jpg', True, 'block white') + '\n' + sec(C['b'], 'technik.jpg', False, 'block') + f'''
<section class="block white"><div class="wrap">
  <div class="section-head"><span class="eyebrow">{C['r_eye']}</span><h2>{C['r_h']}</h2><p>{C['r_p']}</p></div>
</div></section>
''' + cta(lang, C['cta_t'], C['cta_p']))
    return page('tech', lang, C['title'], C['desc'], body)


def shop(lang):
    C = {
    'de': dict(title='Campingshop', desc='Campingzubehör, Sanitärzusätze, Kühlschranklüfter, Gaswarner und Solarregler – online bestellen oder in der Werkstatt in Pêra abholen.',
        eye='Campingshop', h1='Zubehör für Ihre nächste Tour', lead='Online bestellen und bequem bei uns in der Werkstatt abholen – oder per Post innerhalb Portugals liefern lassen.',
        notice='Über 10.000 Artikel unseres Großhändlers Camping-Profi. <strong>Nicht gefunden, was Sie suchen?</strong> Rufen Sie an oder schreiben Sie per <a href="https://wa.me/{wa}">WhatsApp</a> – wir können fast alles bestellen.',
        cats='Kategorien', fine='Alle Preise in Euro inkl. 23 % MwSt., zzgl. Versand. Bezahlung sicher über Stripe (Karte, Multibanco, MB WAY u. a.). Abholung in der Werkstatt kostenlos; Versand innerhalb Portugals nach Gewicht, siehe Kasse.',
        q_ph='Suchen: Artikel, Marke oder Artikelnummer …', q_btn='Suchen', all_brands='Alle Marken',
        sort=['Relevanz', 'Preis aufsteigend', 'Preis absteigend', 'Name A–Z'],
        alt='Unser Campingshop in Pêra', v_eye='Vor Ort', v_h='Unser Shop in der Werkstatt',
        v_p='Zubehör und Sanitär, Küche und Kühlung, Solar und Gas: Vieles haben wir direkt vorrätig. Kommen Sie während der <a href="{hours}">Öffnungszeiten</a> vorbei.'),
    'en': dict(title='Camping shop', desc='Camping accessories, toilet additives, fridge fans, gas alarms and solar controllers – order online or collect at our workshop in Pêra.',
        eye='Camping shop', h1='Accessories for your next trip', lead='Order online and collect at our workshop – or have it delivered by post within Portugal.',
        notice='More than 10,000 items from our wholesaler Camping-Profi. <strong>Cannot find what you need?</strong> Call us or send a <a href="https://wa.me/{wa}">WhatsApp</a> message – we can order almost anything.',
        cats='Categories', fine='All prices in euros incl. 23% VAT, plus delivery. Secure payment via Stripe (card, Multibanco, MB WAY and more). Collection at the workshop is free; delivery within Portugal by weight, see checkout.',
        q_ph='Search: item, brand or item number …', q_btn='Search', all_brands='All brands',
        sort=['Relevance', 'Price ascending', 'Price descending', 'Name A–Z'],
        alt='Our camping shop in Pêra', v_eye='In store', v_h='Our shop at the workshop',
        v_p='Accessories and sanitary, kitchen and cooling, solar and gas: we keep a lot in stock. Drop in during our <a href="{hours}">opening hours</a>.'),
    'pt': dict(title='Loja de campismo', desc='Acessórios de campismo, aditivos sanitários, ventiladores para frigorífico, detetores de gás e reguladores solares – encomende online ou levante na oficina em Pêra.',
        eye='Loja de campismo', h1='Acessórios para a sua próxima viagem', lead='Encomende online e levante na nossa oficina – ou receba por correio em Portugal.',
        notice='Mais de 10 000 artigos do nosso fornecedor Camping-Profi. <strong>Não encontra o que procura?</strong> Ligue-nos ou envie uma mensagem por <a href="https://wa.me/{wa}">WhatsApp</a> – conseguimos encomendar quase tudo.',
        cats='Categorias', fine='Todos os preços em euros com IVA de 23 % incluído, portes à parte. Pagamento seguro via Stripe (cartão, Multibanco, MB WAY, entre outros). Levantamento na oficina gratuito; envio em Portugal conforme o peso, ver no pagamento.',
        q_ph='Pesquisar: artigo, marca ou referência …', q_btn='Pesquisar', all_brands='Todas as marcas',
        sort=['Relevância', 'Preço crescente', 'Preço decrescente', 'Nome A–Z'],
        alt='A nossa loja de campismo em Pêra', v_eye='Na loja', v_h='A nossa loja na oficina',
        v_p='Acessórios e sanitários, cozinha e frio, solar e gás: temos muita coisa em stock. Visite-nos dentro do <a href="{hours}">horário</a>.'),
    }[lang]
    body = hero(lang, 'hero-shop', C['eye'], C['h1'], C['lead'], actions=False) + f'''
<section class="block"><div class="wrap">
  <p id="checkout-note" class="notice" hidden role="status"></p>
  <div class="notice partner"><img src="/img/camping-profi.svg" alt="CAMPING-PROFI" width="120" height="49"><p><strong>{T[lang]['partner']} CAMPING-PROFI.</strong> {C['notice'].format(wa=WA)}</p></div>
  <form class="shop-search" id="shop-search" role="search">
    <input type="search" id="shop-q" name="q" placeholder="{C['q_ph']}" aria-label="{C['q_btn']}" autocomplete="off">
    <button class="btn" type="submit">{C['q_btn']}</button>
  </form>
  <div class="shop-layout">
    <aside class="shop-cats"><h2 class="h3">{C['cats']}</h2><nav id="cat-tree" aria-label="{C['cats']}"></nav></aside>
    <div>
      <div class="shop-bar">
        <span id="shop-count" role="status"></span>
        <select id="shop-brand" aria-label="{C['all_brands']}"><option value="">{C['all_brands']}</option></select>
        <select id="shop-sort" aria-label="{C['sort'][0]}">{''.join(f'<option value="{v}">{t}</option>' for v, t in zip(['', 'price', '-price', 'name'], C['sort']))}</select>
      </div>
      <div class="grid c3" id="products"></div>
      <nav class="pager" id="pager"></nav>
    </div>
  </div>
  <p class="note mt">{C['fine']}</p>
</div></section>
''' + split('shop-zelt.jpg', C['alt'], 798, 359,
            f'<span class="eyebrow">{C["v_eye"]}</span><h2>{C["v_h"]}</h2><p>{C["v_p"].format(hours=url("hours", lang))}</p>')
    return page('shop', lang, C['title'], C['desc'], body)


def hours(lang):
    C = {
    'de': dict(title='Öffnungszeiten', desc='Öffnungszeiten der Werkstatt Castelo Motorhomes in Pêra, Algarve: Montag bis Donnerstag 10–17 Uhr, Freitag 10–13 Uhr.',
        eye='Öffnungszeiten', h1='Wann wir für Sie da sind', lead='Kommen Sie während der Öffnungszeiten vorbei – für Inspektionen und größere Reparaturen vereinbaren Sie am besten einen Termin.',
        tz='Zeiten in portugiesischer Ortszeit.', a_h='Terminvereinbarung',
        a_p='Für Inspektionen und größere Reparaturen empfehlen wir einen Termin, damit Sie nicht warten müssen. Rufen Sie uns an, schreiben Sie eine E-Mail oder nutzen Sie WhatsApp.',
        f_h='Feiertage &amp; Betriebsurlaub', f_p='An portugiesischen Feiertagen und über Weihnachten/Neujahr ist die Werkstatt geschlossen. Die genauen Tage stehen rechtzeitig hier.'),
    'en': dict(title='Opening hours', desc='Opening hours of the Castelo Motorhomes workshop in Pêra, Algarve: Monday to Thursday 10:00–17:00, Friday 10:00–13:00.',
        eye='Opening hours', h1='When we are here for you', lead='Drop in during our opening hours – for inspections and larger repairs it is best to book an appointment.',
        tz='Times are Portuguese local time.', a_h='Appointments',
        a_p='For inspections and larger repairs we recommend booking an appointment so you do not have to wait. Call us, send an email or use WhatsApp.',
        f_h='Public holidays &amp; closures', f_p='The workshop is closed on Portuguese public holidays and over Christmas/New Year. The exact dates will be posted here in good time.'),
    'pt': dict(title='Horário', desc='Horário da oficina Castelo Motorhomes em Pêra, Algarve: segunda a quinta das 10h às 17h, sexta das 10h às 13h.',
        eye='Horário', h1='Quando estamos disponíveis', lead='Visite-nos dentro do horário – para inspeções e reparações maiores, o melhor é fazer marcação.',
        tz='Horário de Portugal continental.', a_h='Marcações',
        a_p='Para inspeções e reparações maiores recomendamos marcação, para não ter de esperar. Ligue-nos, envie um e-mail ou use o WhatsApp.',
        f_h='Feriados &amp; férias', f_p='A oficina está encerrada nos feriados nacionais e no Natal/Ano Novo. As datas exatas serão publicadas aqui com antecedência.'),
    }[lang]
    body = hero(lang, 'hero-zeiten', C['eye'], C['h1'], C['lead']) + f'''
<section class="block"><div class="wrap grid c2">
  <div><p class="open-now" data-open-now hidden></p>
  {hours_table(lang)}
  <p class="note mt">{C['tz']}</p></div>
  <div><h2>{C['a_h']}</h2>
  <p>{C['a_p']}</p>
  <h3>{C['f_h']}</h3>
  <p>{C['f_p']}</p>
  <p><a class="btn" href="{url('contact', lang)}">{T[lang]['btn_appt']}</a></p></div>
</div></section>
'''
    return page('hours', lang, C['title'], C['desc'], body)


def contact(lang):
    L = T[lang]
    C = {
    'de': dict(title='Kontakt', desc='Kontakt zu Castelo Motorhomes and Caravan Repairs in Pêra, Algarve: Telefon, WhatsApp, E-Mail und Kontaktformular.',
        eye='Kontakt', h1='So erreichen Sie uns', lead='Am schnellsten geht es per Telefon oder WhatsApp – gerne mit einem Foto vom Problem.',
        h='Kontaktdaten', route='Route planen', hours_h='Öffnungszeiten', hours_p='Mo – Do 10:00 – 17:00 · Fr 10:00 – 13:00'),
    'en': dict(title='Contact', desc='Contact Castelo Motorhomes and Caravan Repairs in Pêra, Algarve: phone, WhatsApp, email and contact form.',
        eye='Contact', h1='How to reach us', lead='The quickest way is by phone or WhatsApp – feel free to send a photo of the problem.',
        h='Contact details', route='Get directions', hours_h='Opening hours', hours_p='Mon – Thu 10:00 – 17:00 · Fri 10:00 – 13:00'),
    'pt': dict(title='Contacto', desc='Contacte a Castelo Motorhomes and Caravan Repairs em Pêra, Algarve: telefone, WhatsApp, e-mail e formulário de contacto.',
        eye='Contacto', h1='Como nos contactar', lead='A forma mais rápida é por telefone ou WhatsApp – envie-nos uma fotografia do problema.',
        h='Dados de contacto', route='Ver percurso', hours_h='Horário', hours_p='Seg – Qui 10:00 – 17:00 · Sex 10:00 – 13:00'),
    }[lang]
    body = hero(lang, 'hero-kontakt', C['eye'], C['h1'], C['lead'], actions=False) + f'''
<section class="block"><div class="wrap grid c2 top">
  <div><h2>{C['h']}</h2>
  <ul class="contact-list">
    <li><span>{L['workshop']}</span><a href="tel:{TEL_W}">{TEL_W_H}</a></li>
    <li><span>{L['mobile']} / WhatsApp</span><a href="tel:{TEL_M}">{TEL_M_H}</a></li>
    <li><span>{L['email']}</span><a href="mailto:{MAIL}">{MAIL}</a></li>
    <li><span>{L['location']}</span>{L['place']}</li>
  </ul>
  <p><a class="btn wa" href="https://wa.me/{WA}">{L['wa_label']}</a> <a class="btn dark" href="{MAPS}" rel="noopener">{C['route']}</a></p>
  <h3 class="mt">{C['hours_h']}</h3>
  <p>{C['hours_p']}</p></div>
  {form(lang)}
</div></section>
'''
    return page('contact', lang, C['title'], C['desc'], body)


def legal(lang):
    L = T[lang]
    place = L['place']
    mail = f'<a href="mailto:{MAIL}">{MAIL}</a>'
    cimaal = 'Centro de Arbitragem de Conflitos de Consumo do Algarve (CIMAAL), Avenida 5 de Outubro, n.º 55, R/C Dto., 8000-075 Faro, <a href="https://www.consumoalgarve.pt/">consumoalgarve.pt</a>'
    C = {
    'de': f'''<h1>Impressum</h1>
<p><strong>{NAME}</strong><br>Werkstatt für Wohnmobile und Wohnwagen<br>{place}<br>NIF / USt-IdNr.: {NIF}</p>
<p>Telefon: <a href="tel:{TEL_M}">{TEL_M_H}</a><br>Werkstatt: <a href="tel:{TEL_W}">{TEL_W_H}</a><br>E-Mail: {mail}</p>
<h2>Streitbeilegung</h2>
<p>Im Streitfall können Verbraucher die zuständige Schlichtungsstelle anrufen: {cimaal}. Weitere Stellen unter <a href="https://www.consumidor.gov.pt/">consumidor.gov.pt</a>. Das Beschwerdebuch (Livro de Reclamações) finden Sie online unter <a href="https://www.livroreclamacoes.pt/">livroreclamacoes.pt</a>.</p>
<h2 id="datenschutz">Datenschutz</h2>
<p>Wir nehmen den Schutz Ihrer Daten ernst und verarbeiten sie nur, soweit es für unsere Leistungen nötig ist (Art. 6 Abs. 1 lit. b und f DSGVO). Wir geben keine Daten zu Werbezwecken an Dritte weiter.</p>
<h3>Verantwortlich</h3><p>{NAME}, {place}, {mail}</p>
<h3>Besuch der Website</h3><p>Diese Website setzt keine Tracking- oder Werbe-Cookies und bindet keine externen Schriften, Karten oder Videos ein. Der Hosting-Anbieter speichert technisch notwendige Zugriffsdaten (z. B. IP-Adresse, Zeitpunkt) kurzzeitig, um die Seite sicher auszuliefern. Der Warenkorb wird nur in Ihrem Browser gespeichert.</p>
<h3>Kontaktformular und E-Mail</h3><p>Wenn Sie uns schreiben, verwenden wir Ihre Angaben (Name, E-Mail, ggf. Telefon, Fahrzeug, Nachricht) nur zur Bearbeitung Ihrer Anfrage. Die Nachricht wird über den E-Mail-Dienst Brevo (Sendinblue SAS, Frankreich) an uns zugestellt.</p>
<h3>Bestellungen im Campingshop</h3><p>Die Bezahlung erfolgt über Stripe Payments Europe Ltd. (Irland). Ihre Zahlungsdaten geben Sie direkt bei Stripe ein; wir erhalten nur die für die Bestellung nötigen Angaben (Name, Adresse, E-Mail, Telefon, bestellte Artikel). Rechnungsdaten bewahren wir gemäß den gesetzlichen Fristen auf.</p>
<h3>WhatsApp</h3><p>Wenn Sie uns über WhatsApp kontaktieren, gelten zusätzlich die Datenschutzbestimmungen von WhatsApp (Meta). Nutzen Sie alternativ Telefon oder E-Mail.</p>
<h3>Ihre Rechte</h3><p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Schreiben Sie uns dazu an {mail}. Beschwerden können Sie an die portugiesische Datenschutzbehörde CNPD richten (<a href="https://www.cnpd.pt/">cnpd.pt</a>).</p>
<h2>Widerrufsrecht für Online-Bestellungen</h2>
<p>Verbraucher können Online-Bestellungen innerhalb von 14 Tagen ab Erhalt der Ware ohne Angabe von Gründen widerrufen. Eine formlose Mitteilung per E-Mail genügt. Wir erstatten den Kaufpreis innerhalb von 14 Tagen nach Eingang des Widerrufs; die Kosten der Rücksendung trägt der Kunde. Ausgenommen sind geöffnete Hygieneartikel und speziell für Sie bestellte Ware.</p>''',
    'en': f'''<h1>Legal notice</h1>
<p><strong>{NAME}</strong><br>Workshop for motorhomes and caravans<br>{place}<br>NIF / VAT no.: {NIF}</p>
<p>Phone: <a href="tel:{TEL_M}">{TEL_M_H}</a><br>Workshop: <a href="tel:{TEL_W}">{TEL_W_H}</a><br>Email: {mail}</p>
<h2>Dispute resolution</h2>
<p>In the event of a dispute, consumers may contact the competent alternative dispute resolution body: {cimaal}. Further bodies are listed at <a href="https://www.consumidor.gov.pt/">consumidor.gov.pt</a>. The official complaints book (Livro de Reclamações) is available online at <a href="https://www.livroreclamacoes.pt/">livroreclamacoes.pt</a>.</p>
<h2 id="datenschutz">Privacy</h2>
<p>We take the protection of your data seriously and only process it as far as necessary for our services (Art. 6(1)(b) and (f) GDPR). We do not pass data on to third parties for advertising.</p>
<h3>Controller</h3><p>{NAME}, {place}, {mail}</p>
<h3>Visiting this website</h3><p>This website sets no tracking or advertising cookies and does not embed external fonts, maps or videos. The hosting provider briefly stores technically necessary access data (e.g. IP address, time) to deliver the site securely. Your basket is stored only in your browser.</p>
<h3>Contact form and email</h3><p>When you write to us, we use your details (name, email, phone if given, vehicle, message) only to handle your enquiry. The message is delivered to us via the email service Brevo (Sendinblue SAS, France).</p>
<h3>Orders in the camping shop</h3><p>Payment is processed by Stripe Payments Europe Ltd. (Ireland). You enter your payment details directly with Stripe; we only receive the information needed for the order (name, address, email, phone, items ordered). Invoice data is kept for the statutory periods.</p>
<h3>WhatsApp</h3><p>If you contact us via WhatsApp, the privacy policy of WhatsApp (Meta) also applies. Alternatively, use phone or email.</p>
<h3>Your rights</h3><p>You have the right of access, rectification, erasure, restriction of processing, data portability and objection. Write to us at {mail}. You may lodge complaints with the Portuguese data protection authority CNPD (<a href="https://www.cnpd.pt/">cnpd.pt</a>).</p>
<h2>Right of withdrawal for online orders</h2>
<p>Consumers may withdraw from online orders within 14 days of receiving the goods without giving reasons. An informal email is sufficient. We refund the purchase price within 14 days of receiving the withdrawal; the customer bears the cost of return shipping. Opened hygiene products and goods ordered specially for you are excluded.</p>''',
    'pt': f'''<h1>Informação legal</h1>
<p><strong>{NAME}</strong><br>Oficina de autocaravanas e caravanas<br>{place}<br>NIF: {NIF}</p>
<p>Telefone: <a href="tel:{TEL_M}">{TEL_M_H}</a><br>Oficina: <a href="tel:{TEL_W}">{TEL_W_H}</a><br>E-mail: {mail}</p>
<h2>Resolução alternativa de litígios</h2>
<p>Em caso de litígio, o consumidor pode recorrer à entidade de resolução alternativa de litígios competente: {cimaal}. Mais informações em <a href="https://www.consumidor.gov.pt/">consumidor.gov.pt</a>. O Livro de Reclamações eletrónico está disponível em <a href="https://www.livroreclamacoes.pt/">livroreclamacoes.pt</a>.</p>
<h2 id="datenschutz">Privacidade</h2>
<p>Levamos a proteção dos seus dados a sério e tratamo-los apenas na medida do necessário para os nossos serviços (art. 6.º, n.º 1, alíneas b) e f) do RGPD). Não cedemos dados a terceiros para fins publicitários.</p>
<h3>Responsável pelo tratamento</h3><p>{NAME}, {place}, {mail}</p>
<h3>Visita ao site</h3><p>Este site não utiliza cookies de rastreamento ou publicidade e não incorpora tipos de letra, mapas ou vídeos externos. O fornecedor de alojamento guarda por pouco tempo os dados de acesso tecnicamente necessários (p. ex. endereço IP, hora) para servir o site em segurança. O carrinho é guardado apenas no seu navegador.</p>
<h3>Formulário de contacto e e-mail</h3><p>Quando nos escreve, usamos os seus dados (nome, e-mail, telefone se indicado, veículo, mensagem) apenas para tratar o seu pedido. A mensagem é-nos entregue através do serviço de e-mail Brevo (Sendinblue SAS, França).</p>
<h3>Encomendas na loja de campismo</h3><p>O pagamento é processado pela Stripe Payments Europe Ltd. (Irlanda). Introduz os dados de pagamento diretamente na Stripe; recebemos apenas os dados necessários à encomenda (nome, morada, e-mail, telefone, artigos). Os dados de faturação são conservados pelos prazos legais.</p>
<h3>WhatsApp</h3><p>Se nos contactar por WhatsApp, aplica-se também a política de privacidade do WhatsApp (Meta). Em alternativa, use o telefone ou o e-mail.</p>
<h3>Os seus direitos</h3><p>Tem direito de acesso, retificação, apagamento, limitação do tratamento, portabilidade e oposição. Escreva-nos para {mail}. Pode apresentar reclamação à Comissão Nacional de Proteção de Dados – CNPD (<a href="https://www.cnpd.pt/">cnpd.pt</a>).</p>
<h2>Direito de livre resolução nas compras online</h2>
<p>O consumidor pode resolver o contrato de compra online no prazo de 14 dias a contar da receção dos bens, sem indicar motivo. Basta um e-mail. Reembolsamos o preço no prazo de 14 dias após a receção da declaração; os custos de devolução ficam a cargo do cliente. Excluem-se artigos de higiene abertos e bens encomendados especificamente para si.</p>''',
    }[lang]
    title = {'de': 'Impressum &amp; Datenschutz', 'en': 'Legal notice &amp; privacy', 'pt': 'Informação legal &amp; privacidade'}[lang]
    desc = {'de': 'Impressum und Datenschutzerklärung von Castelo Motorhomes and Caravan Repairs.',
            'en': 'Legal notice and privacy policy of Castelo Motorhomes and Caravan Repairs.',
            'pt': 'Informação legal e política de privacidade da Castelo Motorhomes and Caravan Repairs.'}[lang]
    return page('legal', lang, title, desc, f'<section class="block white"><div class="wrap legal">\n{C}\n</div></section>')


def notfound(lang):
    C = {'de': ('Seite nicht gefunden', 'Die Seite gibt es leider nicht (mehr).', 'Zur Startseite'),
         'en': ('Page not found', 'Sorry, this page does not exist (any more).', 'Go to the home page'),
         'pt': ('Página não encontrada', 'Esta página não existe (ou já não existe).', 'Ir para o início')}[lang]
    html = page('home', lang, C[0], C[1],
                f'<section class="block"><div class="wrap"><h1>{C[0]}</h1><p>{C[1]}</p><p><a class="btn" href="{url("home", lang)}">{C[2]}</a></p></div></section>')
    return html.replace(f'<title>{C[0]}</title>', f'<title>{C[0]} | Castelo Motorhomes</title>\n<meta name="robots" content="noindex">')


def sitemap():
    rows = []
    for key in [k for k in SLUGS if k != 'item']:
        for lang in LANGS:
            alts = ''.join(f'<xhtml:link rel="alternate" hreflang="{l}" href="{DOMAIN}{url(key, l)}"/>' for l in LANGS)
            rows.append(f'<url><loc>{DOMAIN}{url(key, lang)}</loc>{alts}</url>')
    return ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
            'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + '\n'.join(rows) + '\n</urlset>\n')


def write(path, html):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)


if __name__ == '__main__':
    n = 0
    for lang in LANGS:
        for key, fn in [('home', home), ('services', services), ('tech', tech), ('shop', shop),
                        ('hours', hours), ('contact', contact), ('legal', legal)]:
            write(filepath(key, lang), fn(lang)); n += 1
        write(os.path.join(ROOT, '' if lang == 'de' else lang, '404.html'), notfound(lang)); n += 1
        write(os.path.join(os.path.dirname(ROOT), 'templates', f'product-{lang}.html'),
              page('item', lang, '{{TITLE}}', '{{DESC}}', '{{BODY}}')); n += 1
    write(os.path.join(ROOT, 'sitemap.xml'), sitemap())
    write(os.path.join(ROOT, 'robots.txt'), f'User-agent: *\nAllow: /\nSitemap: {DOMAIN}/sitemap.xml\nSitemap: {DOMAIN}/sitemap-products.xml\n')
    print(n, 'Seiten erzeugt')
