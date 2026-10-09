/* Neural Drift website behaviour: pages, header, menus, motion, forms. No libraries, no storage, no tracking. */
(function () {
  'use strict';
  var D = document, W = window, CFG = W.ND_CONFIG || {};
  var reduce = W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = W.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var desktop = W.matchMedia('(min-width: 1100px)');
  var $ = function (s, r) { return (r || D).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); };

  var hd = $('#hd'), sheet = $('#sheet'), menuBtn = $('.hd-menu'), dock = $('.dock'), ft = $('.ft');
  var pages = $$('.page'), byRoute = {};
  pages.forEach(function (p) { byRoute[p.getAttribute('data-route')] = p; });
  var metaDesc = $('meta[name="description"]');
  var current = null, effects = [], pageObservers = [];

  // ── settings from the CONFIG block ─────────────────────────────────────────
  if (CFG.grievanceContact) $$('[data-grievance]').forEach(function (el) { el.textContent = CFG.grievanceContact + ', '; });
  if (CFG.teamPhotos) $$('img[data-src]').forEach(function (img) { img.src = img.getAttribute('data-src'); });

  // ── films: loaded near the screen, one rendition per screen, paused off-screen ──
  // Each picture hero and cinema band is a [data-scope] holding one .m-film (poster + video) and its .m-hud.
  // The rendition follows the size the film is shown at: 720p, 1080p or 2160p, in AV1 where the browser
  // decodes it smoothly, then HEVC, then H.264. Phones stop at 1080p; data saver and slow networks keep the poster,
  // as does reduced motion.
  var Films = (function () {
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
    var slow = !!(conn && (conn.saveData || /(^|-)2g$|^3g$/.test(conn.effectiveType || '')));
    var touch = W.matchMedia('(hover: none), (pointer: coarse)').matches;
    var still = reduce || slow;
    var probe = D.createElement('video');
    var can = function (t) { try { return !!probe.canPlayType && probe.canPlayType(t) !== ''; } catch (e) { return false; } };
    var TYPE = {
      av1: { 720: 'video/webm; codecs="av01.0.08M.10"', 1080: 'video/webm; codecs="av01.0.08M.10"', 2160: 'video/webm; codecs="av01.0.12M.10"' },
      hevc: { 1080: 'video/mp4; codecs="hvc1.1.6.L123.B0"', 2160: 'video/mp4; codecs="hvc1.1.6.L153.B0"' },
      h264: { 720: 'video/mp4; codecs="avc1.64001F"' },
    };
    var RATE = { av1: { 720: 1.5e6, 1080: 3.5e6, 2160: 8e6 }, hevc: { 1080: 5e6, 2160: 14e6 }, h264: { 720: 3.5e6 } };
    var DIM = { 720: [1280, 720], 1080: [1920, 1080], 2160: [3840, 2160] };
    var checked = {};
    function decodes(codec, h) {
      var key = codec + h;
      if (checked[key]) return checked[key];
      var t = TYPE[codec][h], mc = navigator.mediaCapabilities, p;
      if (!can(t)) p = Promise.resolve(false);
      else if (!mc || !mc.decodingInfo) p = Promise.resolve(true);
      else {
        p = mc.decodingInfo({ type: 'file', video: { contentType: t, width: DIM[h][0], height: DIM[h][1], bitrate: RATE[codec][h], framerate: 30 } })
          .then(function (r) { return !r.supported ? false : (r.smooth || h <= 720) ? true : 'slow'; }, function () { return true; });
      }
      return (checked[key] = p);
    }
    function ladder(need) {
      var tier = need <= 760 ? 720 : need <= 1300 ? 1080 : 2160;
      tier = Math.min(tier, touch ? 1080 : 2160);
      var L = [];
      if (tier >= 2160) L.push(['av1', 2160], ['hevc', 2160]);
      if (tier >= 1080) L.push(['av1', 1080], ['hevc', 1080]);
      L.push(['av1', 720], ['h264', 720]);
      if (tier < 1080) L.push(['hevc', 1080]);
      return L;
    }
    // The renditions this browser can play, best first: smooth ones, then ones it plays but may struggle with.
    // If a file is missing or will not decode, the next one is tried, and the poster stays if none plays.
    // one-file build: the films sit inside the page at 720p, in AV1 and H.264
    var single = true; // multi-page build: same 720p AV1 / H.264 films, read from media/films/
    function choose(id, need) {
      var L = single ? [['av1', 720], ['h264', 720]] : ladder(need);
      return Promise.all(L.map(function (c) { return decodes(c[0], c[1]); })).then(function (oks) {
        var good = [], spare = [];
        L.forEach(function (c, i) {
          var src = { url: single ? stored(c[0] + '-' + id) : 'media/films/' + id + '-' + c[1] + '.' + c[0] + '.' + (c[0] === 'av1' ? 'webm' : 'mp4'), name: c[0] + '-' + c[1] };
          if (!src.url) return;
          if (oks[i] === true) good.push(src); else if (oks[i] === 'slow') spare.push(src);
        });
        return good.concat(spare);
      });
    }
    var list = [], io = null, raf = 0;
    function mmss(sec) { var c = Math.max(0, Math.ceil(sec)); return Math.floor(c / 60) + ':' + ('0' + (c % 60)).slice(-2); }
    function mark(f, state) {
      f.box.setAttribute('data-state', state);
      if (!f.hud) return;
      f.hud.classList.toggle('is-paused', state === 'still');
      if (state === 'still' && f.time) { f.time.textContent = mmss(f.loop); if (f.bar) f.bar.style.transform = 'scaleX(0)'; }
    }
    function bind(v) {
      if (v.__bound) return;
      v.__bound = true;
      v.addEventListener('playing', function () { var f = v.__f; if (!f || f.dead) return; f.box.classList.add('is-playing'); mark(f, 'playing'); loop(); });
      v.addEventListener('loadedmetadata', function () { var f = v.__f; if (f && isFinite(v.duration) && v.duration > 0) f.loop = v.duration; });
      v.addEventListener('error', function () {
        var f = v.__f;
        if (!f || f.dead || !v.getAttribute('src')) return;
        if (f.cands && f.ci + 1 < f.cands.length) { f.ci += 1; load(f); return; }
        f.box.classList.remove('is-playing');
        mark(f, 'still');
      });
    }
    function go(f) {
      if (f.dead || D.hidden || !f.near) return;
      var p = f.v.play();
      if (p && p.catch) p.catch(function (err) { if (err && err.name === 'NotAllowedError') mark(f, 'still'); });
    }
    function wake(f) {
      if (f.asked) { if (f.v.getAttribute('src')) go(f); return; }
      f.asked = true;
      var r = f.box.getBoundingClientRect(), dpr = Math.min(W.devicePixelRatio || 1, 3);
      var need = Math.max(r.width * 9 / 16, r.height) * dpr;
      choose(f.id, need).then(function (list) {
        if (f.dead) return;
        if (!list.length) { mark(f, 'still'); return; }
        f.cands = list;
        f.ci = 0;
        load(f);
      });
    }
    function load(f) {
      var src = f.cands[f.ci];
      f.box.setAttribute('data-rendition', src.name);
      f.v.preload = 'auto';
      f.v.src = src.url;
      go(f);
    }
    function loop() { if (!raf) raf = requestAnimationFrame(tick); }
    function tick() {
      raf = 0;
      var running = false;
      for (var i = 0; i < list.length; i++) {
        var f = list[i];
        if (f.dead || f.v.paused || !f.bar) continue;
        running = true;
        var d = f.loop || 1, t = f.v.currentTime % d;
        f.bar.style.transform = 'scaleX(' + (t / d).toFixed(4) + ')';
        var txt = '−' + mmss(d - t);
        if (f.time.textContent !== txt) f.time.textContent = txt;
      }
      if (running) loop();
    }
    function setup(page) {
      teardown();
      $$('[data-scope]', page).forEach(function (scope) {
        var box = $('.m-film', scope);
        if (!box) return;
        var hudEl = $('.m-hud[data-hud]', scope), v = $('video', box);
        var f = { scope: scope, box: box, v: v, hud: hudEl, bar: hudEl && $('.mh-bar i', hudEl), time: hudEl && $('.mh-t', hudEl), id: box.getAttribute('data-film'), loop: +box.getAttribute('data-loop') || 0, near: false, asked: false, dead: false };
        v.__f = f;
        bind(v);
        list.push(f);
      });
      if (!list.length) return;
      if (still || !('IntersectionObserver' in W)) { list.forEach(function (f) { mark(f, 'still'); }); return; }
      io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          for (var i = 0; i < list.length; i++) {
            var f = list[i];
            if (f.scope !== e.target) continue;
            f.near = e.isIntersecting;
            if (f.near) wake(f); else if (!f.v.paused) f.v.pause();
          }
        });
      }, { rootMargin: '25% 0px' });
      list.forEach(function (f) { io.observe(f.scope); });
    }
    function teardown() {
      if (io) { io.disconnect(); io = null; }
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      list.forEach(function (f) {
        f.dead = true;
        try { f.v.pause(); } catch (e) { /* not started */ }
        if (f.v.getAttribute('src')) { f.v.removeAttribute('src'); try { f.v.load(); } catch (e) { /* nothing loaded */ } }
        f.box.classList.remove('is-playing');
        f.box.removeAttribute('data-state');
        f.box.removeAttribute('data-rendition');
      });
      list = [];
    }
    D.addEventListener('visibilitychange', function () {
      list.forEach(function (f) { if (D.hidden) { if (!f.v.paused) f.v.pause(); } else if (f.near && f.v.getAttribute('src')) go(f); });
    });
    return { setup: setup, teardown: teardown, still: still };
  })();

  // ── one-file build: pictures are written once into the page and put in place when their page opens ──
  function stored(key) { return (W.ND_MEDIA && W.ND_MEDIA[key]) || ''; }
  function hydrate(root) {
    $$('img[data-k]', root).forEach(function (img) { if (!img.getAttribute('src')) { var u = stored(img.getAttribute('data-k')); if (u) img.src = u; } });
  }
  hydrate($('#mm-ge6')); hydrate($('#mm-company'));

  // ── one-file build: the GE6° engine page travels inside this file and opens over the site at #/ge6 ──
  // It runs in its own frame exactly as supplied. Its section links (#engine, #services…) scroll inside it; its links
  // back to this site (index.html#/…) and its e-mail link are handed up to this page, which opens them here.
  // (A page opened from a file cannot follow #links inside a frame made in memory, so the frame scrolls itself.)
  // The frame is made from the page in memory; a browser that will not show that from a file gets the page
  // written straight into the frame instead (srcdoc), with its address pinned so its #references stay inside it.
  var GE6 = (function () {
    var box = D.getElementById('nd-ge6'); // gone in the multi-page build; the page is /ge6/engine.html
    var html = '', url = '', host = null, frame = null, viaDoc = false;
    var BRIDGE = '<' + 'script>(function(){addEventListener("click",function(e){if(e.defaultPrevented||e.button!==0)return;'
      + 'var a=e.target&&e.target.closest?e.target.closest("a[href]"):null;if(!a)return;var h=a.getAttribute("href")||"";'
      + 'if(h.charAt(0)==="#"){e.preventDefault();var el=h.length>1?document.getElementById(h.slice(1)):null;'
      + 'if(el){el.scrollIntoView();if(e.detail===0){if(!el.hasAttribute("tabindex"))el.setAttribute("tabindex","-1");el.focus({preventScroll:true});}}'
      + 'else scrollTo({top:0});return;}'
      + 'var to=h.indexOf("index.html#")===0?h.slice(10):/^mailto:/i.test(h)?h:"";if(!to)return;'
      + 'e.preventDefault();parent.postMessage({nd:"ge6-link",to:to},"*");});'
      + 'addEventListener("DOMContentLoaded",function(){parent.postMessage({nd:"ge6-ready"},"*");});})();<' + '/script>';
    function page(extra) {
      if (!html) {
        var b = atob(box.textContent.replace(/\s+/g, '')), n = b.length, u = new Uint8Array(n);
        for (var i = 0; i < n; i++) u[i] = b.charCodeAt(i);
        html = new TextDecoder('utf-8').decode(u);
      }
      var at = html.indexOf('<head>');
      return at < 0 ? extra + html : html.slice(0, at + 6) + extra + html.slice(at + 6);
    }
    function writeIn(f) { f.removeAttribute('src'); f.srcdoc = page('<base href="about:srcdoc">' + BRIDGE); }
    function open() {
      if (host) return;
      var f = D.createElement('iframe'), timer = 0;
      f.title = byRoute['/ge6'] ? byRoute['/ge6'].getAttribute('data-title') : 'GE6°';
      f.__ready = false;
      var fallback = function () {
        if (!box) return;
        if (f !== frame || f.__ready || viaDoc) return;
        viaDoc = true;
        writeIn(f);
      };
      f.__onReady = function () { f.__ready = true; clearTimeout(timer); };
      var focusIn = function () { if (f === frame) { try { f.contentWindow.focus(); } catch (e) { /* closed meanwhile */ } } };
      f.addEventListener('load', function () {
        if (f !== frame) return;
        if (f.__ready || viaDoc) focusIn();
        else setTimeout(function () { if (f.__ready) focusIn(); else fallback(); }, 400);
      });
      if (viaDoc) writeIn(f);
      else {
        if (!url) url = '/ge6/engine.html';
        f.src = url;
        timer = setTimeout(fallback, 6000);
      }
      host = D.createElement('div');
      host.className = 'ge6-host';
      host.appendChild(f);
      frame = f;
      D.body.appendChild(host);
      D.documentElement.classList.add('is-ge6');
    }
    function close() {
      if (!host) return;
      D.documentElement.classList.remove('is-ge6');
      if (host.parentNode) host.parentNode.removeChild(host);
      host = frame = null;
    }
    W.addEventListener('message', function (e) {
      if (!frame || e.source !== frame.contentWindow) return;
      var d = e.data;
      if (d && d.nd === 'ge6-ready') { if (frame.__onReady) frame.__onReady(); return; }
      if (!d || d.nd !== 'ge6-link' || typeof d.to !== 'string') return;
      if (d.to.indexOf('#/') === 0) W.location.href = toPath(d.to);
      else if (/^mailto:/i.test(d.to)) W.location.href = d.to;
    });
    return { open: open, close: close };
  })();

  // ── routing (multi-page build): one page per address; old #/ links are sent to the new address ──
  function norm(p) { p = decodeURIComponent(String(p || '/').split('#')[0].split('?')[0]).replace(/index\.html$/, ''); if (p === '/404.html') p = '/404'; if (p.length > 1 && p.charAt(p.length - 1) === '/') p = p.slice(0, -1); return p || '/'; }
  function toPath(h) { var r = norm(h.replace(/^#/, '')); return r === '/' ? '/' : r + '/'; }
  if ((W.location.hash || '').indexOf('#/') === 0) { W.location.replace(toPath(W.location.hash)); return; }
  function routeFromHash() { return norm(W.location.pathname); }
  function groupOf(route) {
    var key = '';
    $$('.mm').forEach(function (panel) {
      $$('.mm-item', panel).forEach(function (a) {
        var r = norm(a.getAttribute('href'));
        if (route === r || route.indexOf(r + '/') === 0) key = panel.getAttribute('data-panel');
      });
    });
    return key;
  }
  function show(route, first) {
    var page = byRoute[route] || byRoute['/404'];
    if (page === current) return;
    var swap = function () {
      if (current) leave(current);
      pages.forEach(function (p) { p.hidden = p !== page; });
      current = page;
      D.title = page.getAttribute('data-title');
      if (metaDesc) metaDesc.setAttribute('content', page.getAttribute('data-desc'));
      W.scrollTo(0, 0);
      markCurrent(route);
      enter(page);
      if (!first) { var m = $('#main'); if (m) m.focus({ preventScroll: true }); }
    };
    closeMenus(true); closeSheet(false);
    if (!first && D.startViewTransition && !reduce) D.startViewTransition(swap); else swap();
  }
  function onHash() {
    if ((W.location.hash || '').indexOf('#/') === 0) { W.location.replace(toPath(W.location.hash)); return; }
    var r = null;
    if (r === null) {
      var id = W.location.hash.slice(1), el = id && D.getElementById(id);
      if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    show(r, false);
  }
  W.addEventListener('hashchange', onHash);

  function markCurrent(route) {
    $$('a[aria-current="page"]').forEach(function (a) { if (!a.closest('.sibs') && !a.closest('.crumbs')) a.removeAttribute('aria-current'); });
    $$('.mm-item, .sg-list a, .ft-col a').forEach(function (a) { var h = a.getAttribute('href') || ''; if (h.charAt(0) === '/' && norm(h) === route) a.setAttribute('aria-current', 'page'); });
    var g = groupOf(route);
    $$('.hd-trig').forEach(function (b) { b.classList.toggle('is-current', b.getAttribute('data-menu') === g); });
    restInd();
  }

  // ── entering and leaving a page ────────────────────────────────────────────
  function enter(page) {
    page.setAttribute('data-entered', '1');
    if (GE6 && page.getAttribute('data-route') === '/ge6') GE6.open();
    hydrate(page);
    hd.setAttribute('data-theme', page.getAttribute('data-hd') || 'dark');
    // entry motion
    if ('IntersectionObserver' in W && !reduce) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      $$('.reveal', page).forEach(function (el) { if (!el.classList.contains('is-in')) io.observe(el); });
      pageObservers.push(io);
    } else {
      $$('.reveal', page).forEach(function (el) { el.classList.add('is-in'); });
    }
    // effects
    $$('[data-fx]', page).forEach(function (el) {
      var kind = el.getAttribute('data-fx'), make = W.ND_FX && W.ND_FX[kind];
      if (!make) return;
      try { var fx = make(el, {}); if (fx) effects.push(fx); } catch (err) { el.classList.add('no-gl'); }
    });
    if (reduce) $$('svg', page).forEach(function (s) { if (s.pauseAnimations) s.pauseAnimations(); });
    Films.setup(page);
    typeIn(page);
    tocSpy(page);
    snapCounters(page);
    requestAnimationFrame(onScroll);
  }
  function leave(page) {
    if (GE6 && page.getAttribute('data-route') === '/ge6') GE6.close();
    Films.teardown();
    effects.forEach(function (fx) { try { fx.dispose(); } catch (e) { /* already gone */ } });
    effects = [];
    pageObservers.forEach(function (o) { o.disconnect(); });
    pageObservers = [];
    void page;
  }

  // ── header: glass on scroll, light or dark by what lies under it ──────────
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = W.scrollY || W.pageYOffset;
    hd.classList.toggle('is-solid', y > 8);
    if (!openKey) {
      var probe = (hd.offsetHeight || 64) / 2, dark = false;
      var zones = current ? $$('[data-dark]', current) : [];
      zones.push(ft);
      for (var i = 0; i < zones.length; i++) {
        var r = zones[i].getBoundingClientRect();
        if (r.top <= probe && r.bottom >= probe) { dark = true; break; }
      }
      hd.setAttribute('data-theme', dark ? 'dark' : 'light');
    }
    // the sub-navigation turns dark when it is docked over a dark section
    var sb = current && current.querySelector('.sibs');
    if (sb) {
      var sr = sb.getBoundingClientRect(), cyy = sr.top + sr.height / 2, dk = false;
      if (sr.top <= (hd.offsetHeight || 64) + 1) {
        var zs = $$('[data-dark]', current);
        for (var j = 0; j < zs.length; j++) { var zr = zs[j].getBoundingClientRect(); if (zr.top <= cyy && zr.bottom >= cyy) { dk = true; break; } }
      }
      sb.classList.toggle('is-dark', dk);
    }
    // contact dock: shown after the first screen, hidden over the footer
    if (dock) {
      var fr = ft.getBoundingClientRect();
      dock.classList.toggle('is-shown', y > W.innerHeight * 0.55 && fr.top > W.innerHeight - 40 && sheet.hidden);
    }
    homeStory();
    articleProgress();
  }
  function requestScroll() { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }
  W.addEventListener('scroll', requestScroll, { passive: true });
  W.addEventListener('resize', function () { requestScroll(); restInd(); });

  // ── desktop mega menus ────────────────────────────────────────────────────
  // Hover intent: a short dwell opens a menu, a slightly longer one switches menus, and a menu only closes once
  // the pointer has been off both the trigger and the panel for CLOSE_MS. The close re-checks where the pointer
  // really is, so a fast move from the trigger down into the panel never collapses it.
  var OPEN_MS = 90, SWITCH_MS = 150, CLOSE_MS = 400;
  var openKey = null, hoverT = 0, closeT = 0, ptrX = -1, ptrY = -1;
  var trigs = $$('.hd-trig'), ind = $('.hd-ind'), nav = $('.hd-nav');
  D.addEventListener('pointermove', function (e) { ptrX = e.clientX; ptrY = e.clientY; }, { passive: true });
  function under(el) { if (!el) return false; var r = el.getBoundingClientRect(); return ptrX >= r.left && ptrX <= r.right && ptrY >= r.top && ptrY <= r.bottom; }
  function pointerOnMenu() { return !!openKey && (under(panel(openKey)) || under($('.hd-trig[data-menu="' + openKey + '"]'))); }
  function panel(key) { return $('#mm-' + key); }
  function openMenu(key) {
    clearTimeout(closeT);
    if (openKey === key) return;
    if (openKey) closeMenus(false, true);
    var p = panel(key);
    if (!p) return;
    openKey = key;
    p.hidden = false;
    void p.offsetWidth;
    p.classList.add('is-open');
    hd.classList.add('menu-open');
    trigs.forEach(function (b) { b.setAttribute('aria-expanded', String(b.getAttribute('data-menu') === key)); });
    moveInd($('.hd-trig[data-menu="' + key + '"]'));
  }
  function closeMenus(instant, keepHeader) {
    clearTimeout(hoverT);
    if (!openKey) return;
    var p = panel(openKey);
    openKey = null;
    trigs.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    if (p) {
      p.classList.remove('is-open');
      if (instant) p.hidden = true;
      else setTimeout(function () { if (!p.classList.contains('is-open')) p.hidden = true; }, 460);
    }
    if (!keepHeader) { hd.classList.remove('menu-open'); restInd(); requestScroll(); }
  }
  function scheduleClose() { clearTimeout(closeT); closeT = setTimeout(function () { if (!pointerOnMenu()) closeMenus(false); }, CLOSE_MS); }
  function moveInd(btn) {
    if (!btn || !nav || !ind) return;
    var nr = nav.getBoundingClientRect(), br = btn.getBoundingClientRect();
    ind.style.width = br.width + 'px';
    ind.style.transform = 'translateX(' + (br.left - nr.left) + 'px)';
    ind.style.opacity = '1';
  }
  function restInd() {
    if (!ind) return;
    var cur = $('.hd-trig.is-current');
    if (openKey) return;
    if (cur && desktop.matches) moveInd(cur); else ind.style.opacity = '0';
  }
  trigs.forEach(function (b) {
    var key = b.getAttribute('data-menu');
    b.addEventListener('click', function () { if (openKey === key) closeMenus(false); else openMenu(key); });
    b.addEventListener('mouseenter', function () {
      if (!fine) return;
      clearTimeout(hoverT); clearTimeout(closeT);
      moveInd(b);
      hoverT = setTimeout(function () { openMenu(key); }, openKey && openKey !== key ? SWITCH_MS : OPEN_MS);
    });
    b.addEventListener('mouseleave', function () { clearTimeout(hoverT); if (fine && openKey) scheduleClose(); });
    b.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' && openKey === key) { e.preventDefault(); var first = $('.mm-item', panel(key)); if (first) first.focus(); }
    });
  });
  if (nav) nav.addEventListener('mouseleave', function () { if (!openKey) restInd(); });
  $$('.mm').forEach(function (p) {
    p.addEventListener('mouseenter', function () { clearTimeout(closeT); });
    p.addEventListener('mouseleave', function () { if (fine) scheduleClose(); });
    p.addEventListener('keydown', function (e) {
      var items = $$('.mm-item, a.mm-feat', p), i = items.indexOf(D.activeElement);
      if (e.key === 'ArrowDown' && i > -1) { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      if (e.key === 'ArrowUp' && i > -1) { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    });
    p.addEventListener('focusout', function (e) {
      if (!p.contains(e.relatedTarget) && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.hd-trig'))) closeMenus(false);
    });
  });
  D.addEventListener('click', function (e) { if (openKey && !e.target.closest('.mm, .hd-trig')) closeMenus(false); });
  D.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (openKey) { var b = $('.hd-trig[data-menu="' + openKey + '"]'); closeMenus(false); if (b) b.focus(); }
    if (!sheet.hidden) closeSheet(true);
  });
  desktop.addEventListener && desktop.addEventListener('change', function () { closeMenus(true); closeSheet(false); restInd(); });

  // ── mobile sheet ──────────────────────────────────────────────────────────
  var lastFocus = null;
  function openSheet() {
    lastFocus = D.activeElement;
    sheet.hidden = false;
    void sheet.offsetWidth;
    sheet.classList.add('is-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    D.documentElement.classList.add('no-scroll');
    var x = $('.sheet-x', sheet); if (x) x.focus();
    requestScroll();
  }
  function closeSheet(restore) {
    if (sheet.hidden) return;
    sheet.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    D.documentElement.classList.remove('no-scroll');
    setTimeout(function () { if (!sheet.classList.contains('is-open')) sheet.hidden = true; requestScroll(); }, 420);
    if (restore && lastFocus) lastFocus.focus();
  }
  menuBtn.addEventListener('click', openSheet);
  $('.sheet-x', sheet).addEventListener('click', function () { closeSheet(true); });
  $$('.sg-h', sheet).forEach(function (h) {
    h.addEventListener('click', function () {
      var g = h.parentNode, open = !g.classList.contains('is-open');
      g.classList.toggle('is-open', open);
      h.setAttribute('aria-expanded', String(open));
    });
  });
  sheet.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var f = $$('a, button', sheet).filter(function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    if (e.shiftKey && D.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && D.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });

  // ── in-page scrolling buttons ─────────────────────────────────────────────
  D.addEventListener('click', function (e) {
    var b = e.target.closest('[data-scrollto]');
    if (b) { var t = D.getElementById(b.getAttribute('data-scrollto')); if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
    var j = e.target.closest('[data-jump]');
    if (j) { e.preventDefault(); var h = D.getElementById(j.getAttribute('data-jump')); if (h) h.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
  });

  // ── home: the three lines, told by scrolling ──────────────────────────────
  function homeStory() {
    if (!current || current.getAttribute('data-route') !== '/' || reduce) return;
    var hh = $('#home-hero', current);
    if (!hh) return;
    var r = hh.getBoundingClientRect(), span = r.height - W.innerHeight;
    var p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
    var idx = p < 0.3 ? 0 : p < 0.63 ? 1 : 2;
    $$('.hh-line', hh).forEach(function (l, i) { l.classList.toggle('is-on', i === idx); l.classList.toggle('is-past', i < idx); });
    $$('.hh-ticks i', hh).forEach(function (t, i) { t.classList.toggle('is-on', i === idx); });
  }

  // ── live clocks, each with its zone ──────────────────────────────────────
  function clocks() {
    $$('[data-clock]').forEach(function (el) {
      var tz = el.getAttribute('data-clock'), zone = el.getAttribute('data-zone') || tz, t;
      try { t = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(new Date()); } catch (e) { t = ''; }
      el.textContent = tz === 'UTC' ? zone + ' ' + t : t + ' ' + zone;
    });
  }
  clocks(); setInterval(clocks, 15000);

  // ── a line typed by the watch, spoken by the head beside it ─────────────────
  // The head thinks for a moment, then its mouth follows the letters as they appear, then it rests.
  function speaker(el) {
    var card = el.closest('.watch-card'), host = card ? card.querySelector('[data-speaker]') : null;
    return {
      host: host,
      set: function (state) { if (!host) return; host.setAttribute('data-state', state); if (host.__ah) host.__ah.setState(state); },
      level: function (ch) { if (host && host.__ah) host.__ah.setLevel(/[aeiouy]/i.test(ch) ? 0.92 : /[\s.,;:]/.test(ch) ? 0.1 : 0.45 + Math.random() * 0.25); },
    };
  }
  function typeIn(page) {
    $$('[data-type]', page).forEach(function (el) {
      if (el.getAttribute('data-typed')) return;
      var full = el.getAttribute('data-full') || el.textContent;
      el.setAttribute('data-full', full);
      if (reduce || !('IntersectionObserver' in W)) { el.textContent = full; return; }
      var copy = el.previousElementSibling && el.previousElementSibling.classList.contains('vh') ? el.previousElementSibling : null;
      if (!copy) { copy = D.createElement('span'); copy.className = 'vh'; copy.textContent = full; el.parentNode.insertBefore(copy, el); }
      el.setAttribute('aria-hidden', 'true');
      el.textContent = '';
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        var sp = speaker(el);
        sp.set('thinking');
        setTimeout(function () {
          sp.set('speaking');
          el.classList.add('typing');
          var i = 0;
          (function step() {
            i += 1 + (Math.random() < 0.3 ? 1 : 0);
            el.textContent = full.slice(0, i);
            sp.level(full.charAt(Math.min(i, full.length) - 1));
            if (i < full.length) setTimeout(step, 22 + Math.random() * 38);
            else {
              el.setAttribute('data-typed', '1');
              setTimeout(function () { sp.set('idle'); }, 420);
              setTimeout(function () { el.classList.remove('typing'); }, 2400);
            }
          })();
        }, sp.host ? 820 : 0);
      }, { threshold: 0.5 });
      io.observe(el);
      pageObservers.push(io);
    });
  }

  // ── luminous role cards ──────────────────────────────────────────────────
  D.addEventListener('click', function (e) {
    var card = e.target.closest('.lum');
    if (!card || e.target.closest('a')) return;
    var t = $('.lum-toggle', card), on = !card.classList.contains('is-lit');
    card.classList.toggle('is-lit', on);
    t.setAttribute('aria-pressed', String(on));
    $('.lum-lbl', t).textContent = on ? 'Dim this view' : 'Light this view';
  });

  // ── carousels on small screens: a quiet counter ──────────────────────────
  function snapCounters(page) {
    $$('[data-snap]', page).forEach(function (list) {
      var counter = list.parentNode.querySelector('[data-snap-i]');
      if (!counter || list.getAttribute('data-snap-bound')) return;
      list.setAttribute('data-snap-bound', '1');
      list.addEventListener('scroll', function () {
        var first = list.children[0];
        if (!first) return;
        var w = first.getBoundingClientRect().width + 12;
        var i = Math.round(list.scrollLeft / w) + 1;
        counter.textContent = ('0' + Math.min(list.children.length, Math.max(1, i))).slice(-2);
      }, { passive: true });
    });
  }

  // ── insights: topic filter ────────────────────────────────────────────────
  D.addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (!chip) return;
    var group = chip.parentNode, topic = chip.getAttribute('data-topic');
    $$('.chip', group).forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
    var cards = $$('.card[data-topic]', current), shown = 0;
    cards.forEach(function (c) { var on = topic === 'all' || c.getAttribute('data-topic') === topic; c.hidden = !on; if (on) { shown++; c.classList.add('is-in'); } });
    var count = $('[data-count]', group); if (count) count.textContent = 'Showing ' + shown + ' of ' + cards.length;
  });

  // ── articles: contents, progress, sharing ────────────────────────────────
  function tocSpy(page) {
    var links = $$('.toc a[data-jump]', page);
    if (!links.length || !('IntersectionObserver' in W)) return;
    var heads = links.map(function (a) { return D.getElementById(a.getAttribute('data-jump')); }).filter(Boolean);
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('data-jump') === e.target.id); });
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    heads.forEach(function (h) { io.observe(h); });
    pageObservers.push(io);
  }
  function articleProgress() {
    if (!current || !current.classList.contains('page--article')) return;
    var art = $('.art-body', current), bar = $('.art-progress i', current);
    if (!art || !bar) return;
    var r = art.getBoundingClientRect(), total = r.height - W.innerHeight * 0.6;
    var p = total > 0 ? Math.min(1, Math.max(0, (W.innerHeight * 0.3 - r.top) / total)) : 0;
    bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
  }
  if (navigator.share) $$('[data-share]').forEach(function (b) { b.hidden = false; });
  D.addEventListener('click', function (e) {
    var c = e.target.closest('[data-copy]');
    if (c) {
      var url = c.getAttribute('data-copy'), label = $('span', c), done = function () { label.textContent = 'Link copied'; setTimeout(function () { label.textContent = 'Copy link'; }, 2200); };
      if (navigator.clipboard && W.isSecureContext) navigator.clipboard.writeText(url).then(done, function () { fallbackCopy(url); done(); });
      else { fallbackCopy(url); done(); }
    }
    var s = e.target.closest('[data-share]');
    if (s && navigator.share) navigator.share({ title: s.getAttribute('data-title'), url: s.getAttribute('data-share') }).catch(function () { /* closed by the visitor */ });
  });
  function fallbackCopy(text) {
    var t = D.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    D.body.appendChild(t); t.select();
    try { D.execCommand('copy'); } catch (e) { /* nothing more to try */ }
    D.body.removeChild(t);
  }

  // ── testimonials: only complete, agreed quotes are shown ─────────────────
  (function () {
    var list = (CFG.testimonials || []).filter(function (q) { return q && q.quote && q.name && q.role && q.company && q.agreed; });
    var box = $('[data-testimonials]');
    if (!box || !list.length) return;
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var html = '<ul class="tm-list">' + list.map(function (q) {
      var d = new Date(q.agreed + 'T00:00:00Z'), when = isNaN(d) ? esc(q.agreed) : d.getUTCDate() + ' ' + months[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
      return '<li class="reveal is-in"><blockquote class="tm-q">“' + esc(q.quote) + '”</blockquote><p class="tm-who"><b>' + esc(q.name) + '</b> · ' + esc(q.role) + ', ' + esc(q.company) + ' · agreed ' + when + '</p></li>';
    }).join('') + '</ul>';
    box.innerHTML = html;
  })();

  // ── the contact form: validates, then hands the message to e-mail ─────────
  $$('form[data-form]').forEach(function (form) {
    var done = $('.f-done', form);
    function field(n) { return form.elements[n]; }
    function err(n, msg) {
      var el = field(n), box = n === 'consent' ? $('.f-e--consent', form) : el.closest('.f').querySelector('.f-e');
      if (n !== 'consent') el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (box) box.textContent = msg || '';
      return !msg;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (n) { return String(field(n).value || '').trim(); };
      var ok = [
        err('name', v('name') ? '' : 'Please give your name.'),
        err('email', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('email')) ? '' : 'Please give an e-mail address we can reply to.'),
        err('message', v('message').length >= 5 ? '' : 'Please write a short message.'),
        err('consent', field('consent').checked ? '' : 'Please tick the box so we may reply.'),
      ].every(Boolean);
      if (!ok) { var bad = form.querySelector('[aria-invalid="true"]') || field('consent'); bad.focus(); return; }
      if (v('website')) { finish('sent'); return; }
      var data = { form: 'contact', page: W.location.href, sentAt: new Date().toISOString(), name: v('name'), company: v('company'), email: v('email'), phone: v('phone'), role: v('role'), topic: v('topic'), message: v('message') };
      if (CFG.formEndpoint) {
        fetch(CFG.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
          .then(function (r) { if (!r.ok) throw new Error(r.status); finish('sent'); })
          .catch(function () { mail(data); });
      } else mail(data);
    });
    function mail(d) {
      var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], n = new Date();
      var lines = ['Name: ' + d.name, 'Company: ' + (d.company || '—'), 'E-mail: ' + d.email, 'Telephone or WhatsApp: ' + (d.phone || '—'), 'Role: ' + d.role, 'About: ' + d.topic, '', d.message, '', 'Sent from neuraldrifts.com on ' + n.getDate() + ' ' + months[n.getMonth()] + ' ' + n.getFullYear() + '.'];
      var href = 'mailto:fleet@neuraldrifts.com?subject=' + encodeURIComponent('Message from ' + d.name + (d.company ? ', ' + d.company : '')) + '&body=' + encodeURIComponent(lines.join('\n'));
      form.setAttribute('data-last-mailto', href);
      var a = D.createElement('a'); a.href = href; a.style.display = 'none'; D.body.appendChild(a); a.click(); D.body.removeChild(a);
      finish('handed');
    }
    function finish(kind) {
      done.hidden = false;
      done.innerHTML = kind === 'sent'
        ? '<h3>Message received</h3><p>Thank you. A person will reply to the address you gave.</p>'
        : '<h3>Your message is ready to send</h3><p>Your e-mail app should now be open with the message written out. Send it from there and we will reply.</p><p>No e-mail app? Write to <a href="mailto:fleet@neuraldrifts.com">fleet@neuraldrifts.com</a> or message us on <a href="' + $('.hd-ic[href^="https://wa.me"]').getAttribute('href') + '" target="_blank" rel="noopener">WhatsApp</a>.</p>';
      done.focus && done.setAttribute('tabindex', '-1');
      done.focus();
    }
  });

  // ── start ─────────────────────────────────────────────────────────────────
  var r0 = routeFromHash();
  show(r0, true);
  if (W.location.hash.length > 1) onHash();
  onScroll();
})();
