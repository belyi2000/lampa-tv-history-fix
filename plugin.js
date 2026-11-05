(function () {
  try {
    var fav = Lampa.Storage.get('favorite', '{}');
    var recs = Lampa.Storage.get('recomends_list', '[]');
    var body = JSON.stringify({favorite: fav, recomends: recs, ua: navigator.userAgent});
    fetch('http://192.168.1.189:8765/favorite', {method: 'POST', body: body});
    console.log('FAVORITE_SENT', body.length);
  } catch (e) {
    console.log('FAVORITE_ERROR', e && e.message ? e.message : String(e));
  }
})();
