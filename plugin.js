(function () {
  'use strict';
  var ALL = ['like', 'wath', 'book', 'history', 'look', 'viewed', 'scheduled', 'continued', 'thrown'];
  var CATS = ['history', 'book', 'like', 'wath'];
  var started = false;

  function publish(force) {
    try {
      if (!window.Lampa || !Lampa.Account || !Lampa.Account.Permit || !Lampa.Account.Permit.sync) return;
      if (!Lampa.Account.Bookmarks || !Lampa.Account.Bookmarks.get) return;

      var fav = Lampa.Storage.get('favorite', '{}') || {};
      var cards = fav.card || [];
      var seen = {};
      cards.forEach(function (c) { if (c && c.id != null) seen[String(c.id)] = true; });
      var sig = [];

      ALL.forEach(function (cat) {
        var list = Lampa.Account.Bookmarks.get({type: cat});
        if (!list) return;
        sig.push(cat + ':' + list.map(function (c) { return c.id; }).join(','));
        fav[cat] = list.map(function (c) { return c.id; });
        list.forEach(function (c) {
          if (c && c.id != null && !seen[String(c.id)]) {
            cards.push(c);
            seen[String(c.id)] = true;
          }
        });
      });
      sig = sig.join('|');
      if (!force && sig === Lampa.Storage.get('lampa_tv_mirror_sig', '')) return;

      fav.card = cards;
      Lampa.Storage.set('favorite', fav);
      Lampa.Storage.set('lampa_tv_mirror_sig', sig);

      if (window.AndroidJS && typeof AndroidJS.updateChannel === 'function') {
        CATS.forEach(function (cat) { AndroidJS.updateChannel(cat); });
      }
    } catch (e) {}
  }

  function start() {
    if (started) return;
    started = true;
    publish(true);
    setInterval(function () { publish(false); }, 5 * 60 * 1000);
    if (window.Lampa && Lampa.Listener && Lampa.Listener.follow) {
      Lampa.Listener.follow('state:changed', function (e) {
        if (e && e.target === 'favorite') setTimeout(function () { publish(true); }, 800);
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
