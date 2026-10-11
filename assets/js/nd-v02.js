/* Neural Drift · v02 · Home hero clock: UTC time and date from this website's own server clock.
   Every reply from the server carries the time it was sent (its Date header). The page reads that stamp when it
   opens and every ten minutes, and counts on from it. The visitor's own clock fills in only until then, or when the
   page is opened as a file. Nothing is sent anywhere except this website. */
(function () {
  'use strict';
  var els = document.querySelectorAll('[data-nd-utc]');
  if (!els.length) return;
  var M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var offset = 0;
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function paint() {
    var d = new Date(Date.now() + offset);
    var t = 'UTC ' + two(d.getUTCHours()) + ':' + two(d.getUTCMinutes()) + ' · ' + d.getUTCDate() + ' ' + M[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
    for (var i = 0; i < els.length; i++) if (els[i].textContent !== t) els[i].textContent = t;
  }
  function sync() {
    if (!window.fetch || !/^https?:$/.test(location.protocol)) return;
    var t0 = Date.now();
    fetch(location.pathname + '?utc=' + t0, { method: 'HEAD', cache: 'no-store', credentials: 'omit' }).then(function (r) {
      var stamp = Date.parse(r.headers.get('Date') || '');
      if (isNaN(stamp)) return;
      var age = parseInt(r.headers.get('Age') || '0', 10) || 0;
      offset = stamp + age * 1000 + 500 - (t0 + Date.now()) / 2;
      paint();
    }).catch(function () { /* the visitor's own clock stays in use */ });
  }
  paint();
  sync();
  setInterval(paint, 1000);
  setInterval(sync, 600000);
})();
