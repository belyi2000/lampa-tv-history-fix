(function () {
  'use strict';
  var started = false;
  var CATS = ['history', 'book', 'like', 'wath'];
  var ALL = ['like', 'wath', 'book', 'history', 'look', 'viewed', 'scheduled', 'continued', 'thrown'];

  function publish() {
    try {
      if (!window.Lampa || !Lampa.Account || !Lampa.Account.Permit || !Lampa.Account.Permit.sync) return;
      if (!Lampa.Account.Bookmarks || !Lampa.Account.Bookmarks.get) return;

      var fav = Lampa.Storage.get('favorite', '{}') || {};
      var cards = fav.card || [];
      var seen = {};
      cards.forEach(function (c) { if (c && c.id != null) seen[String(c.id)] = true; });

      ALL.forEach(function (cat) {
        var list = Lampa.Account.Bookmarks.get({type: cat});
        if (!list) return;
        fav[cat] = list.map(function (c) { return c.id; });
        list.forEach(function (c) {
          if (c && c.id != null && !seen[String(c.id)]) {
            cards.push(c);
            seen[String(c.id)] = true;
          }
        });
      });
      fav.card = cards;
      Lampa.Storage.set('favorite', fav);

      if (window.AndroidJS && typeof AndroidJS.updateChannel === 'function') {
        CATS.forEach(function (cat) { AndroidJS.updateChannel(cat); });
      }
      try {
        fetch('http://192.168.1.189:8765/plugin-loaded', {
          method: 'POST',
          body: JSON.stringify({history: (fav.history || []).length, cards: cards.length})
        });
      } catch (e) {}
    } catch (e) {}
  }

  function start() {
    if (started) return;
    started = true;
    publish();
    setInterval(publish, 5 * 60 * 1000);
    if (Lampa.Listener && Lampa.Listener.follow) {
      Lampa.Listener.follow('state:changed', function (e) {
        if (e && e.target === 'favorite') setTimeout(publish, 800);
      });
    }
  }

  if (window.appready) start();
  else if (window.Lampa && Lampa.Listener && Lampa.Listener.follow) Lampa.Listener.follow('appready', start);
  else setTimeout(start, 5000);
})();
