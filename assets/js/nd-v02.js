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

/* Neural Drift · v02 · Home hero position: the visitor's own latitude and longitude, only with their permission.
   Shows the Chennai office until then. If the visitor has already allowed location for this site it fills in on
   arrival; otherwise a tap on the coordinates asks once. The position stays in the browser; nothing is sent anywhere. */
(function () {
  'use strict';
  var els = document.querySelectorAll('[data-nd-pos]');
  if (!els.length || !navigator.geolocation) return;
  function pad(n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; }
  function dm(v, pos, neg, w) {
    var a = Math.abs(v), d = Math.floor(a), m = Math.round((a - d) * 60);
    if (m === 60) { d += 1; m = 0; }
    return pad(d, w) + '°' + pad(m, 2) + '′ ' + (v < 0 ? neg : pos);
  }
  function show(p) {
    var t = dm(p.coords.latitude, 'N', 'S', 2) + ' ' + dm(p.coords.longitude, 'E', 'W', 3);
    for (var i = 0; i < els.length; i++) { els[i].textContent = t; els[i].title = 'Your position'; els[i].setAttribute('data-live', ''); }
  }
  function ask() { navigator.geolocation.getCurrentPosition(show, function () { /* refused or unavailable: Chennai stays */ }, { maximumAge: 600000, timeout: 15000 }); }
  for (var i = 0; i < els.length; i++) els[i].addEventListener('click', ask);
  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: 'geolocation' }).then(function (r) { if (r.state === 'granted') ask(); }).catch(function () {});
  }
})();
