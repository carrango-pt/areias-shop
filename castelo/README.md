# Castelo Motorhomes and Caravan Repairs – neue Website (Ersatz für Webador)

Eigene Website mit **Campingshop** (Warenkorb + Bezahlung über Stripe) und **Kontaktformular** (E-Mail über Brevo).
Gleiches Prinzip wie der Areias-Shop: statische Seiten plus ein kleiner Node/Express-Server.

## Sprachen
Deutsch (`/`), Englisch (`/en/`) und Portugiesisch (`/pt/`), oben rechts umschaltbar. Die deutschen Adressen sind
dieselben wie bei Webador (`/kontakt`, `/campingshop`, `/technik`, `/oeffnungszeiten`, `/unsere-dienstleistungen`,
`/impressum`), damit Google-Treffer und alte Links weiter funktionieren.

## Struktur
- `build.py` – **alle Texte, Kontaktdaten und das Menü in allen drei Sprachen**. Nach jeder Änderung `python3 build.py`
  ausführen; das Skript schreibt alle Seiten in `public/` neu (plus `sitemap.xml` und `robots.txt`).
  Die HTML-Dateien in `public/` deshalb nicht von Hand bearbeiten.
- `public/*.html`, `public/en/`, `public/pt/` – die erzeugten Seiten.
- `data/catalog.json` – **der Shop-Katalog** (Artikel, Preise, Kategorien), erzeugt aus dem Camping-Profi-Sortiment, siehe unten.
- `shop-config.js` – **Versand** (Abholung, Gewichtsstaffel Portugal), Lieferländer.
- `shop.js` – Shop-Logik: Suche/Filter-API, Artikelseiten, Bild-Proxy, Versandberechnung an der Kasse.
- `templates/` – Vorlagen der Artikelseiten (von `build.py` erzeugt).
- `public/assets/app.js` – Menü, Warenkorb, „Jetzt geöffnet“-Anzeige, Kontaktformular.
- `public/assets/style.css` – Design (Farben oben in `:root`).
- `public/img/` – Bilder (eigene Shop-Fotos + freie Unsplash-Fotos von der alten Seite).
- `server.js` – liefert die Seite aus, erstellt Stripe-Checkout, verschickt Anfragen/Bestellungen per Mail.

## Sortiment von CAMPING-PROFI aktualisieren
Wir sind Fachhändler von CAMPING-PROFI und übernehmen deren öffentliches Sortiment (Name, Marke, Artikelnummer,
Bild, Produktdaten, UVP). Zum Aktualisieren (z. B. einmal im Monat oder wenn neue Preise kommen):
```
cd castelo
node tools/import-camping-profi.js   # liest camping-profi.de ein (dauert ca. 1 Stunde) → tools/data/camping-profi-raw.json
node tools/build-catalog.js          # rechnet Preise um → data/catalog.json
```
Danach committen und pushen; Render veröffentlicht automatisch.

**Preisregel** (in `tools/build-catalog.js` oben): UVP enthält 19 % deutsche MwSt. → netto → plus 23 % portugiesische MwSt.
Beispiel: UVP 69,95 € → 72,30 €. Optional `MARKUP_PERCENT` (Auf-/Abschlag) und `ROUND_TO` (auf x,90/x,95/x,99 runden).
Nur `build-catalog.js` erneut ausführen – dafür ist kein neuer Import nötig.

**Kategorie-Übersetzungen** (EN/PT) stehen in `tools/category-i18n.json`. Taucht nach einem Import eine neue deutsche
Kategorie auf, dort ergänzen und `build-catalog.js` erneut ausführen. Modellnamen (z. B. „Omnistor 5200“) bleiben unübersetzt.

**Bilder** werden über unseren Server von camping-profi.de geladen und zwischengespeichert (`/img/cp/…`),
damit Besucher keine Verbindung zu Dritten aufbauen.

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
   - `SHOP_EMAIL` – Empfänger (Standard: caravantechnologypera@hotmail.com)
   - `FROM_EMAIL` – in Brevo verifizierte Absenderadresse
4. Domain umziehen: In Render unter **Settings → Custom Domains** `www.castelomotorhomesandcaravanrepairs.com`
   hinzufügen und beim Domain-Anbieter die angezeigten DNS-Einträge setzen. Erst danach Webador kündigen.

## Vor dem Livegang prüfen
1. **Versandkosten** in `shop-config.js` prüfen (Platzhalter: bis 2 kg 5,50 €, bis 10 kg 9,50 €, bis 30 kg 16,90 €;
   schwerer → nur Abholung). Artikel ohne Gewichtsangabe zählen mit 1 kg.
2. **Preise** stichprobenartig prüfen (Preisregel oben).
3. **Adresse:** Überall steht nur „Pêra, Algarve“. Für Impressum und Google bitte Straße + PLZ ergänzen (`build.py` → `place`).
4. **Telefonnummern:** Telefon + WhatsApp +351 933 917 633 (einzige Nummer) (`build.py` oben).
5. **Öffnungszeiten:** Mo–Do 10–17, Fr 10–13 (in `build.py` und in `app.js` → `HOURS`).
6. **Rechtstexte** im Impressum (Datenschutz, Widerruf) sind eine solide Vorlage, aber keine Rechtsberatung.
