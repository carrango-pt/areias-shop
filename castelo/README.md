# Castelo Motorhomes and Caravan Repairs – neue Website (Ersatz für Webador)

Eigene Website mit **Campingshop** (Warenkorb + Bezahlung über Stripe) und **Kontaktformular** (E-Mail über Brevo).
Gleiches Prinzip wie der Areias-Shop: statische Seiten plus ein kleiner Node/Express-Server.

## Struktur
- `public/*.html` – die Seiten. Die Adressen sind dieselben wie bei Webador (`/kontakt`, `/campingshop`, `/technik`,
  `/oeffnungszeiten`, `/unsere-dienstleistungen`, `/impressum`), damit Google-Treffer und alte Links weiter funktionieren.
- `public/assets/catalog.js` – **Shop-Artikel und Preise** (Cent-Beträge), Versandarten, Kategorien.
- `public/assets/app.js` – Menü, Warenkorb, „Jetzt geöffnet“-Anzeige, Kontaktformular.
- `public/assets/style.css` – Design (Farben oben in `:root`).
- `public/img/` – Bilder (eigene Shop-Fotos + freie Unsplash-Fotos von der alten Seite).
- `server.js` – liefert die Seite aus, erstellt Stripe-Checkout, verschickt Anfragen/Bestellungen per Mail.

## Lokal starten
```
cd castelo
npm install
npm start          # http://localhost:4600
```
Ohne Schlüssel läuft alles, nur „Zur Kasse“ und das Formular melden „noch nicht freigeschaltet“.

## Deploy auf Render
1. Render → **New → Web Service** → dieses Repo wählen.
2. **Root Directory:** `castelo` · Build: `npm install` · Start: `node server.js` · Health Check: `/api/health`
3. Unter **Environment** eintragen:
   - `STRIPE_SECRET_KEY` – `sk_live_…` (aktiviert die Kasse)
   - `STRIPE_WEBHOOK_SECRET` – `whsec_…` aus Stripe → Webhooks, Endpunkt `https://DOMAIN/api/stripe-webhook`,
     Ereignis `checkout.session.completed` (aktiviert die Bestell-Mail)
   - `BREVO_API_KEY` – aktiviert Kontaktformular + Bestell-Mail
   - `SHOP_EMAIL` – Empfänger (Standard: info@castelomotorhomes.com)
   - `FROM_EMAIL` – in Brevo verifizierte Absenderadresse
4. Domain umziehen: In Render unter **Settings → Custom Domains** `www.castelomotorhomesandcaravanrepairs.com`
   hinzufügen und beim Domain-Anbieter die angezeigten DNS-Einträge setzen. Erst danach Webador kündigen.

## Vor dem Livegang prüfen
1. **Shop-Artikel:** Die Artikel in `catalog.js` sind **Beispiele**. Durch echtes Sortiment + echte Preise ersetzen,
   bevor der Stripe-Schlüssel eingetragen wird. Eigene Produktfotos: Datei nach `public/img/` legen und beim Artikel
   `img: '/img/datei.jpg'` ergänzen (sonst wird das Kategorie-Foto verwendet).
2. **Adresse:** Überall steht nur „Pêra, Algarve“. Für Impressum und Google bitte Straße + PLZ ergänzen.
3. **Telefonnummern:** Werkstatt +351 282 044 808, Mobil +351 933 917 633, WhatsApp +34 602 438 989 – bitte bestätigen.
4. **Öffnungszeiten:** Mo–Do 10–17, Fr 10–13 (in den HTML-Seiten und in `app.js` → `HOURS`).
5. **Rechtstexte** im Impressum (Datenschutz, Widerruf) sind eine solide Vorlage, aber keine Rechtsberatung.
