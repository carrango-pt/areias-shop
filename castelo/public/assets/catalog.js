/* Campingshop-Katalog – eine einzige Quelle für Browser UND Server.
   price = Cent (EUR, Endpreis inkl. MwSt.). Der Server rechnet NUR mit diesen Preisen,
   nie mit Werten aus dem Browser.
   ACHTUNG: Die Artikel unten sind BEISPIELE (aus den Kategorien der alten Seite).
   Vor dem Livegang durch das echte Sortiment und die echten Preise ersetzen. */
(function (root, factory) {
  var data = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  if (typeof window !== 'undefined') window.CASTELO_CATALOG = data;
})(this, function () {
  return {
    currency: 'eur',
    allowedCountries: ['PT', 'ES'],
    // Versandarten an der Kasse. Abholung in der Werkstatt ist kostenlos.
    shipping: [
      { label: 'Abholung in der Werkstatt (Pêra)', amount: 0, min: 1, max: 3 },
      { label: 'Versand Portugal (CTT)', amount: 600, min: 2, max: 5 }
    ],
    freeShippingThreshold: 0,   // z. B. 10000 = Versand kostenlos ab 100 €; 0 = aus
    categories: [
      { id: 'zubehoer', label: 'Zubehör & Sanitär', img: '/img/shop-zubehoer.jpg' },
      { id: 'kueche',   label: 'Küche & Kühlung',   img: '/img/shop-kueche.jpg' },
      { id: 'energie',  label: 'Solar & Gas',       img: '/img/shop-solar-gas.jpg' }
    ],
    products: {
      'san-2l':      { cat: 'zubehoer', price: 1490, name: 'Sanitärzusatz für Kassettentoilette, 2 l', text: 'Für den Fäkalientank, geruchsbindend.' },
      'spuel-2l':    { cat: 'zubehoer', price: 1290, name: 'Spülwasserzusatz, 2 l', text: 'Für den Spülwassertank, frischer Duft.' },
      'tp-4':        { cat: 'zubehoer', price: 590,  name: 'Camping-Toilettenpapier, 4 Rollen', text: 'Schnell auflösend, tanksicher.' },
      'keil-2':      { cat: 'zubehoer', price: 2990, name: 'Auffahrkeile, 2 Stück', text: 'Zum Ausgleichen auf unebenem Stellplatz.' },
      'kabel-25':    { cat: 'zubehoer', price: 3990, name: 'CEE-Verlängerungskabel 25 m', text: '3 × 2,5 mm², mit CEE-Stecker und -Kupplung.' },
      'luefter-12':  { cat: 'kueche',   price: 3490, name: 'Kühlschranklüfter 12 V', text: 'Verbessert die Kühlleistung bei Hitze.' },
      'kuehl-box':   { cat: 'kueche',   price: 1990, name: 'Kühlschrank-Ordnungsboxen, Set', text: 'Hält beim Fahren alles an seinem Platz.' },
      'geschirr':    { cat: 'kueche',   price: 2490, name: 'Melamin-Geschirrset 4 Personen', text: 'Bruchfest und leicht.' },
      'gaswarner':   { cat: 'energie',  price: 5990, name: 'Gaswarner 12 V', text: 'Warnt vor Propan/Butan und Narkosegas.' },
      'solarregler': { cat: 'energie',  price: 8990, name: 'Solarladeregler MPPT 20 A', text: 'Für 12-V-Bordbatterien, auch Lithium.' },
      'gas-adapter': { cat: 'energie',  price: 1490, name: 'Gas-Adapter für Portugal', text: 'Passend für portugiesische Gasflaschen.' }
    }
  };
});
