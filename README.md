# Areias – Schmuck aus der Algarve (DE / PT / EN)

Statische Website **+ echter Warenkorb mit Stripe-Checkout** (kleiner Node/Express-Server).

## Struktur
- `index.html` → Deutsch (Start) · `pt/index.html` → Português · `en/index.html` → English
- `rechtliches.html` / `pt/informacao-legal.html` / `en/legal.html` → Rechtstexte
- `assets/style.css`, `assets/app.js` (Warenkorb-Logik), `assets/catalog.js` (Produkte + Preise)
- `assets/img/…` (Logo, Hero, 12 Produktfotos)
- `server.js` (liefert die Seite **und** erzeugt Stripe-Checkout-Sessions), `package.json`, `render.yaml`

## Lokal starten
```
npm install
npm start            # ohne Stripe-Key: Shop läuft, Checkout meldet "nicht konfiguriert"
```
Mit Stripe testen (Testmodus-Schlüssel von dashboard.stripe.com):
```
# Git Bash / macOS / Linux:
STRIPE_SECRET_KEY=sk_test_xxx npm start
# Windows PowerShell:
$env:STRIPE_SECRET_KEY="sk_test_xxx"; npm start
```
Dann http://localhost:4599 öffnen → Artikel in den Warenkorb → „Zur Kasse" leitet zu Stripe.

## Preise ändern
Nur in `assets/catalog.js` (Cent-Beträge). Diese Datei ist die **verbindliche Quelle** – der Server rechnet nie mit Preisen aus dem Browser.

## Deploy auf Render (Web Service, nicht Static Site)
1. Repo zu GitHub pushen.
2. Render → **New → Web Service** → Repo wählen (die `render.yaml` wird erkannt).
   - Build: `npm install` · Start: `node server.js`
3. Unter **Environment** die Variable `STRIPE_SECRET_KEY` = dein Live-Schlüssel `sk_live_…` (als Secret) eintragen.
4. Deploy. Fertig.

## Noch offen vor dem Livegang
1. `DEINE-DOMAIN.pt` in allen Seiten (canonical + hreflang) durch die echte Domain ersetzen.
2. Platzhalter `[…]` füllen: Adresse/E-Mail/Telefon, Über-uns-Text, Rechtstexte (Firmendaten/NIF …).
3. Stripe-Konto anlegen + Zahlungsmethoden aktivieren (Karte, Multibanco, MB WAY …); Live-Key setzen.
4. Versand ist eingebaut: Lieferadresse + Telefon werden im Stripe-Checkout abgefragt, Versandarten/‑preise und Lieferländer stehen in `assets/catalog.js` (`shipping`, `allowedCountries`, `freeShippingThreshold` = gratis ab Betrag). Nur Werte anpassen.
5. Rechtstexte anwaltlich prüfen lassen (Vorlagen mit Platzhaltern).
6. Newsletter noch Platzhalter (z. B. Brevo/Mailchimp anbinden).

## Zahlungssicherheit
Der geheime Stripe-Schlüssel steht **nur** serverseitig (Umgebungsvariable), nie im Browser/Code. Produktpreise kommen ausschließlich aus `catalog.js` auf dem Server.
