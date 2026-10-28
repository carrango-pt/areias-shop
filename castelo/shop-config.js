/* Shop-Einstellungen (nur Server). Artikel und Preise kommen aus data/catalog.json
   (erzeugt mit tools/build-catalog.js). Beträge in Cent, inkl. MwSt. */
module.exports = {
  currency: 'eur',
  allowedCountries: ['PT'],           // Versand nur Portugal; Inseln (PLZ 9xxx) auf Anfrage
  islandPostcode: /^9\d{3}/,          // Madeira 9000–9399, Azoren 9500–9999

  // Keine Abholung in der Werkstatt – Versand wird immer berechnet

  // Paketdienst nach Gesamtgewicht: bis maxKg (einschließlich) → amount
  parcelTiers: [
    { maxKg: 1,    amount: 1395 },
    { maxKg: 2,    amount: 1495 },
    { maxKg: 3,    amount: 1595 },
    { maxKg: 5,    amount: 1795 },
    { maxKg: 8,    amount: 2195 },
    { maxKg: 10,   amount: 2395 },
    { maxKg: 15,   amount: 2895 },
    { maxKg: 20,   amount: 3495 },
    { maxKg: 25,   amount: 3995 },
    { maxKg: 31.5, amount: 4695 }
  ],
  parcelMaxKg: 31.5,                  // schwerer → auf mehrere Pakete aufteilen
  extraParcel: 4695,                  // jedes weitere Paket
  parcelDays: { min: 2, max: 7 },
  parcelLabel: { de: 'Paketdienst Portugal (Festland)', en: 'Parcel service Portugal (mainland)', pt: 'Envio por transportadora – Portugal continental' },

  // Spedition für sperrige/schwere Artikel: Kosten immer auf Anfrage – solche Artikel sind nicht online bestellbar, nur per Anfrage
  // Wann gilt ein Artikel als sperrig?
  bulky: {
    maxKg: 31.5,                      // Einzelgewicht darüber
    maxCm: 0,                         // aus: Camping-Profi liefert Produktmaße (aufgebaut), keine Paketmaße
    categories: ['zelte-und-markisen-markisen-dachmarkisen', 'zelte-und-markisen-markisen-wandmarkisen',
                 'fahrzeugtechnik-transport-traeger-systeme-fahrradtraeger-lastentraeger'],   // Kategorie-IDs (inkl. Unterkategorien)
    heavyCategories: { 'elektro-und-multimedia-energieversorgung-batterien-und-ladegeraete': 20 }   // große Batterien: ab 20 kg
  },

  unknownWeightKg: 1,                 // Artikel ohne Gewichtsangabe zählen so viel
  freeShippingFrom: 12000             // ab 120 € Paketversand kostenfrei (Festland); 0 = aus
};
