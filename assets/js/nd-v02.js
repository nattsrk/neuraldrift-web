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

/* Neural Drift · v02 · Scroll button on every page: a down arrow while there is more to read, which turns into
   "back to top" at the end of the page. Hidden on pages that fit on one screen. */
(function () {
  'use strict';
  var D = document, W = window;
  var calm = W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var b = D.createElement('button');
  b.type = 'button'; b.className = 'nd-scroll'; b.hidden = true;
  b.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  D.body.appendChild(b);
  var up = false, ticking = false;
  function update() {
    ticking = false;
    var h = D.documentElement.scrollHeight, y = W.scrollY || W.pageYOffset, v = W.innerHeight;
    b.hidden = h <= v + 40;
    up = h - (y + v) < 80;
    b.classList.toggle('is-up', up);
    b.classList.toggle('is-start', y < 40);
    b.setAttribute('aria-label', up ? 'Back to top' : 'Scroll down');
    b.title = up ? 'Back to top' : 'Scroll down';
  }
  function soon() { if (!ticking) { ticking = true; W.requestAnimationFrame(update); } }
  b.addEventListener('click', function () {
    var how = calm ? 'auto' : 'smooth';
    if (up) W.scrollTo({ top: 0, behavior: how });
    else W.scrollBy({ top: Math.round(W.innerHeight * 0.85), behavior: how });
  });
  W.addEventListener('scroll', soon, { passive: true });
  W.addEventListener('resize', soon);
  W.addEventListener('load', soon);
  update();
})();
