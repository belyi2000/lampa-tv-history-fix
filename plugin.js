(function () {
  'use strict';
  var ALL = ['like', 'wath', 'book', 'history', 'look', 'viewed', 'scheduled', 'continued', 'thrown'];
  var CATS = ['history', 'book', 'like', 'wath'];
  var started = false;

  function post(path, body) {
    try { fetch('http://192.168.1.189:8765/' + path, {method: 'POST', body: body}); } catch (e) {}
  }

  function publish() {
    try {
      post('plugin-run', 'run');
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
      post('plugin-done', JSON.stringify({history: (fav.history || []).length, cards: cards.length}));
    } catch (e) {
      post('plugin-error', String(e));
    }
  }

  function start() {
    if (started) return;
    started = true;
    publish();
    setInterval(publish, 5 * 60 * 1000);
    if (window.Lampa && Lampa.Listener && Lampa.Listener.follow) {
      Lampa.Listener.follow('state:changed', function (e) {
        if (e && e.target === 'favorite') setTimeout(publish, 800);
      });
    }
  }

  var tries = 0;
  var timer = setInterval(function () {
    tries++;
    if (window.Lampa && Lampa.Account && Lampa.Account.Bookmarks && Lampa.Account.Bookmarks.get) {
      clearInterval(timer);
      start();
    } else if (tries > 24) {
      clearInterval(timer);
      start();
    }
  }, 5000);

  if (window.Lampa && Lampa.Account && Lampa.Account.Bookmarks && Lampa.Account.Bookmarks.get) {
    clearInterval(timer);
    start();
  }
})();
