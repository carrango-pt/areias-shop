/* Shop-Einstellungen (nur Server). Artikel und Preise kommen aus data/catalog.json
   (erzeugt mit tools/build-catalog.js). */
module.exports = {
  currency: 'eur',
  allowedCountries: ['PT'],
  // Abholung in der Werkstatt – immer möglich, kostenlos.
  pickup: { min: 1, max: 5, label: { de: 'Abholung in der Werkstatt (Pêra)', en: 'Collection at the workshop (Pêra)', pt: 'Levantamento na oficina (Pêra)' } },
  // Versand innerhalb Portugals nach Gesamtgewicht. BETRÄGE BITTE PRÜFEN (Cent, inkl. MwSt.).
  shippingTiers: [
    { maxKg: 2,  amount: 550 },
    { maxKg: 10, amount: 950 },
    { maxKg: 30, amount: 1690 }
  ],
  shippingDays: { min: 3, max: 10 },
  shippingLabel: { de: 'Versand Portugal (CTT)', en: 'Delivery within Portugal (CTT)', pt: 'Envio para Portugal (CTT)' },
  unknownWeightKg: 1,          // Artikel ohne Gewichtsangabe zählen so viel
  freeShippingFrom: 0          // z. B. 15000 = ab 150 € versandkostenfrei; 0 = aus
};
