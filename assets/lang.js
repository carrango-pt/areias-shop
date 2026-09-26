/* Automatische Sprachweiche (läuft früh im <head>).
   - Erkennt auf der Startseite die Browser-/Gerätesprache und leitet auf /pt/ oder /en/ um.
   - Respektiert eine manuell gewählte Sprache (localStorage) → kein Zurückspringen.
   - Greift NUR auf den Startseiten (/, /pt/, /en/), nie auf Unterseiten oder bei ?checkout. */
(function () {
  try {
    var KEY = 'areias-lang';
    var p = location.pathname;
    var cur = /\/pt\//.test(p) ? 'pt' : (/\/en\//.test(p) ? 'en' : 'de');

    // Manuelle Sprachwahl merken (auf allen Seiten): Klick auf die Sprach-Links speichern.
    document.addEventListener('DOMContentLoaded', function () {
      var links = document.querySelectorAll('.langs a[hreflang]');
      Array.prototype.forEach.call(links, function (a) {
        a.addEventListener('click', function () {
          var hl = (a.getAttribute('hreflang') || '').toLowerCase();
          var v = hl.indexOf('pt') === 0 ? 'pt' : (hl.indexOf('en') === 0 ? 'en' : 'de');
          try { localStorage.setItem(KEY, v); } catch (e) {}
        });
      });
    });

    // Auto-Umleitung nur auf einer echten Startseite.
    var isHome = /^\/(index\.html)?$/.test(p) || /^\/pt\/(index\.html)?$/.test(p) || /^\/en\/(index\.html)?$/.test(p);
    if (!isHome) return;
    if (location.search.indexOf('checkout') !== -1) return; // Stripe-Rückkehr nicht stören

    var stored = null;
    try { stored = localStorage.getItem(KEY); } catch (e) {}
    var pref = stored;
    if (!pref) {
      var langs = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || ''];
      for (var i = 0; i < langs.length; i++) {
        var l = (langs[i] || '').toLowerCase();
        if (l.indexOf('pt') === 0) { pref = 'pt'; break; }
        if (l.indexOf('en') === 0) { pref = 'en'; break; }
        if (l.indexOf('de') === 0) { pref = 'de'; break; }
      }
      if (!pref) pref = 'de';
    }
    if (pref === cur) return;

    // Ziel relativ zur aktuellen Startseite (funktioniert unter / , /pt/ , /en/).
    var rel = {
      de: { pt: 'pt/', en: 'en/' },
      pt: { de: '../', en: '../en/' },
      en: { de: '../', pt: '../pt/' }
    };
    var t = rel[cur][pref];
    if (t) location.replace(t + location.hash);
  } catch (e) {}
})();
