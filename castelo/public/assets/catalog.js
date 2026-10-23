/* Campingshop-Katalog – eine einzige Quelle für Browser UND Server.
   price = Cent (EUR, Endpreis inkl. MwSt.). Der Server rechnet NUR mit diesen Preisen,
   nie mit Werten aus dem Browser.
   name/text = Deutsch; i18n.en / i18n.pt = Englisch / Portugiesisch (fehlt etwas, wird Deutsch gezeigt).
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
      { amount: 0,   min: 1, max: 3, label: { de: 'Abholung in der Werkstatt (Pêra)', en: 'Collection at the workshop (Pêra)', pt: 'Levantamento na oficina (Pêra)' } },
      { amount: 600, min: 2, max: 5, label: { de: 'Versand Portugal (CTT)', en: 'Delivery within Portugal (CTT)', pt: 'Envio para Portugal (CTT)' } }
    ],
    freeShippingThreshold: 0,   // z. B. 10000 = Versand kostenlos ab 100 €; 0 = aus
    categories: [
      { id: 'zubehoer', img: '/img/shop-zubehoer.jpg', label: { de: 'Zubehör & Sanitär', en: 'Accessories & sanitary', pt: 'Acessórios & sanitários' } },
      { id: 'kueche',   img: '/img/shop-kueche.jpg',   label: { de: 'Küche & Kühlung',   en: 'Kitchen & cooling',      pt: 'Cozinha & frio' } },
      { id: 'energie',  img: '/img/shop-solar-gas.jpg', label: { de: 'Solar & Gas',      en: 'Solar & gas',            pt: 'Solar & gás' } }
    ],
    products: {
      'san-2l':      { cat: 'zubehoer', price: 1490, name: 'Sanitärzusatz für Kassettentoilette, 2 l', text: 'Für den Fäkalientank, geruchsbindend.',
        i18n: { en: { name: 'Toilet additive for cassette toilets, 2 l', text: 'For the waste tank, controls odours.' }, pt: { name: 'Aditivo sanitário para WC de cassete, 2 l', text: 'Para o depósito de resíduos, neutraliza odores.' } } },
      'spuel-2l':    { cat: 'zubehoer', price: 1290, name: 'Spülwasserzusatz, 2 l', text: 'Für den Spülwassertank, frischer Duft.',
        i18n: { en: { name: 'Flush water additive, 2 l', text: 'For the flush tank, fresh scent.' }, pt: { name: 'Aditivo para água de descarga, 2 l', text: 'Para o depósito de descarga, aroma fresco.' } } },
      'tp-4':        { cat: 'zubehoer', price: 590,  name: 'Camping-Toilettenpapier, 4 Rollen', text: 'Schnell auflösend, tanksicher.',
        i18n: { en: { name: 'Camping toilet paper, 4 rolls', text: 'Dissolves quickly, safe for tanks.' }, pt: { name: 'Papel higiénico para campismo, 4 rolos', text: 'Dissolve rapidamente, seguro para depósitos.' } } },
      'keil-2':      { cat: 'zubehoer', price: 2990, name: 'Auffahrkeile, 2 Stück', text: 'Zum Ausgleichen auf unebenem Stellplatz.',
        i18n: { en: { name: 'Levelling ramps, set of 2', text: 'For levelling on uneven pitches.' }, pt: { name: 'Calços niveladores, 2 unidades', text: 'Para nivelar em terreno irregular.' } } },
      'kabel-25':    { cat: 'zubehoer', price: 3990, name: 'CEE-Verlängerungskabel 25 m', text: '3 × 2,5 mm², mit CEE-Stecker und -Kupplung.',
        i18n: { en: { name: 'CEE extension cable 25 m', text: '3 × 2.5 mm², with CEE plug and coupler.' }, pt: { name: 'Extensão CEE 25 m', text: '3 × 2,5 mm², com ficha e tomada CEE.' } } },
      'luefter-12':  { cat: 'kueche',   price: 3490, name: 'Kühlschranklüfter 12 V', text: 'Verbessert die Kühlleistung bei Hitze.',
        i18n: { en: { name: 'Fridge vent fan 12 V', text: 'Improves cooling in hot weather.' }, pt: { name: 'Ventilador para frigorífico 12 V', text: 'Melhora a refrigeração com calor.' } } },
      'kuehl-box':   { cat: 'kueche',   price: 1990, name: 'Kühlschrank-Ordnungsboxen, Set', text: 'Hält beim Fahren alles an seinem Platz.',
        i18n: { en: { name: 'Fridge storage boxes, set', text: 'Keeps everything in place while driving.' }, pt: { name: 'Caixas organizadoras para frigorífico, conjunto', text: 'Mantém tudo no lugar durante a viagem.' } } },
      'geschirr':    { cat: 'kueche',   price: 2490, name: 'Melamin-Geschirrset 4 Personen', text: 'Bruchfest und leicht.',
        i18n: { en: { name: 'Melamine tableware set for 4', text: 'Unbreakable and light.' }, pt: { name: 'Conjunto de louça de melamina, 4 pessoas', text: 'Inquebrável e leve.' } } },
      'gaswarner':   { cat: 'energie',  price: 5990, name: 'Gaswarner 12 V', text: 'Warnt vor Propan/Butan und Narkosegas.',
        i18n: { en: { name: 'Gas alarm 12 V', text: 'Detects propane/butane and narcotic gas.' }, pt: { name: 'Detetor de gás 12 V', text: 'Alerta para propano/butano e gás narcótico.' } } },
      'solarregler': { cat: 'energie',  price: 8990, name: 'Solarladeregler MPPT 20 A', text: 'Für 12-V-Bordbatterien, auch Lithium.',
        i18n: { en: { name: 'MPPT solar charge controller 20 A', text: 'For 12 V leisure batteries, incl. lithium.' }, pt: { name: 'Regulador de carga solar MPPT 20 A', text: 'Para baterias de serviço 12 V, incluindo lítio.' } } },
      'gas-adapter': { cat: 'energie',  price: 1490, name: 'Gas-Adapter für Portugal', text: 'Passend für portugiesische Gasflaschen.',
        i18n: { en: { name: 'Gas adapter for Portugal', text: 'Fits Portuguese gas bottles.' }, pt: { name: 'Adaptador de gás para Portugal', text: 'Compatível com as garrafas de gás portuguesas.' } } }
    }
  };
});
