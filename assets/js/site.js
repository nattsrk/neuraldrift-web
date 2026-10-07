/* Neural Drift · menus, drawer, photo slots, forms, reveal. No external requests. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var EMAIL = 'fleet@neuraldrifts.com';
  var header = $('#site-header');
  var desktop = window.matchMedia('(min-width: 1021px)');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var path = location.pathname.replace(/index\.html$/, '');

  /* header shadow */
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* current section in the nav */
  var section = path.split('/')[1] || '';
  var map = { ge6: 'ge6', 'who-we-serve': 'serve', company: 'company' };
  $$('[data-menu]').forEach(function (b) { if (map[section] === b.getAttribute('data-menu')) b.setAttribute('aria-current', 'true'); });
  $$('[data-section]').forEach(function (a) { if (a.getAttribute('data-section') === section) a.setAttribute('aria-current', path === '/' + section + '/' ? 'page' : 'true'); });
  $$('.menu a, .drawer a').forEach(function (a) { if (a.getAttribute('href') === path) a.setAttribute('aria-current', 'page'); });

  /* dropdown menus */
  var open = null, timer = null;
  function show(b) {
    if (open === b) return;
    hide();
    b.setAttribute('aria-expanded', 'true');
    document.getElementById(b.getAttribute('aria-controls')).classList.add('open');
    document.body.classList.add('scrim');
    open = b;
  }
  function hide() {
    if (!open) return;
    open.setAttribute('aria-expanded', 'false');
    document.getElementById(open.getAttribute('aria-controls')).classList.remove('open');
    document.body.classList.remove('scrim');
    open = null;
  }
  $$('[data-menu]').forEach(function (b) {
    var li = b.parentNode;
    b.addEventListener('click', function () { if (open === b) hide(); else show(b); });
    li.addEventListener('mouseenter', function () {
      if (!desktop.matches || !window.matchMedia('(hover: hover)').matches) return;
      clearTimeout(timer); timer = setTimeout(function () { show(b); }, 60);
    });
    li.addEventListener('mouseleave', function () {
      if (!desktop.matches) return;
      clearTimeout(timer); timer = setTimeout(hide, 160);
    });
    li.addEventListener('focusout', function (e) { if (open === b && e.relatedTarget && !li.contains(e.relatedTarget)) hide(); });
  });
  document.addEventListener('click', function (e) { if (open && !open.parentNode.contains(e.target)) hide(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (open) { var b = open; hide(); b.focus(); }
    if (header.classList.contains('drawer-open')) { closeDrawer(); menuBtn.focus(); }
  });

  /* mobile drawer */
  var menuBtn = $('.menu-btn');
  function setInert(on) { ['main', '.site-footer'].forEach(function (s) { var el = $(s); if (el) el.inert = on; }); }
  function closeDrawer() {
    header.classList.remove('drawer-open');
    document.body.classList.remove('lock');
    setInert(false);
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Open the menu');
  }
  menuBtn.addEventListener('click', function () {
    if (header.classList.contains('drawer-open')) { closeDrawer(); return; }
    header.classList.add('drawer-open');
    document.body.classList.add('lock');
    setInert(true);
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.setAttribute('aria-label', 'Close the menu');
  });
  $$('.drawer a').forEach(function (a) { a.addEventListener('click', closeDrawer); });
  desktop.addEventListener('change', function () { closeDrawer(); hide(); });

  /* photo slots → files in /media (ship-NN from the Neural Drift ship set). [file, focal point] */
  var MEDIA = {
    'pillar-voyage': ['ship-12', '50% 60%'], 'pillar-compliance': ['ship-07', '50% 50%'], 'pillar-analytics': ['ship-05', '70% 75%'],
    'solutions-hero': ['ship-06', '50% 50%'], 'ge6-fit': ['ship-09', '50% 50%'], 'home-platform': ['ship-11', '72% 50%'], 'home-stakes': ['ship-09', '50% 50%'],
    'voyage-hero': ['ship-12', '50% 55%'], 'voyage-overview': ['ship-12', '50% 60%'], 'voyage-routing': ['ship-05', '70% 75%'], 'voyage-watch': ['ship-11', '72% 40%'], 'voyage-reroute': ['ship-10', '25% 100%'], 'voyage-faq': ['ship-07', '50% 50%'],
    'compliance-hero': ['ship-11', '60% 40%'], 'compliance-overview': ['ship-05', '70% 75%'], 'compliance-carbon': ['ship-07', '50% 50%'], 'compliance-cii': ['ship-11', '72% 40%'], 'compliance-biofouling': ['ship-06', '50% 35%'], 'compliance-faq': ['ship-10', '25% 100%'],
    'analytics-hero': ['ship-09', '50% 50%'], 'analytics-overview': ['ship-11', '72% 50%'], 'analytics-hull': ['ship-12', '50% 60%'], 'analytics-clean': ['ship-05', '70% 75%'], 'analytics-voyage': ['ship-07', '50% 50%'], 'analytics-faq': ['ship-10', '25% 100%'],
    'segment-container': ['ship-07', '50% 60%'], 'serve-hero': ['ship-12', '45% 60%'], 'serve-users': ['ship-11', '72% 50%'],
    'company-hero': ['ship-06', '50% 50%'], 'company-about': ['ship-07', '50% 50%'], 'serve-about': ['ship-12', '50% 60%'], 'company-story': ['ship-07', '50% 50%'], 'company-principles': ['ship-11', '72% 45%'], 'company-careers': ['ship-12', '50% 60%'],
    'cta-band': ['ship-10', '50% 100%']
  };
  /* photo slots: show /media/<slot>.webp|jpg once the file exists */
  function loadPhoto(fig) {
    var slot = fig.getAttribute('data-slot');
    var m = MEDIA[slot];
    var file = m ? m[0] : slot;
    var exts = ['webp', 'jpg'];
    (function next(i) {
      if (i >= exts.length) return;
      var img = new Image();
      img.alt = fig.getAttribute('data-alt') || '';
      img.decoding = 'async';
      if (m) img.style.objectPosition = m[1];
      img.onload = function () { fig.insertBefore(img, fig.firstChild); fig.classList.add('has-img'); };
      img.onerror = function () { next(i + 1); };
      img.src = '/media/' + file + '.' + exts[i];
    })(0);
  }
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); loadPhoto(en.target); } });
  }, { rootMargin: '300px 0px' }) : null;
  $$('.ph[data-slot]').forEach(function (f) { if (io) io.observe(f); else loadPhoto(f); });

  /* reveal on scroll */
  var rv = 'IntersectionObserver' in window && !reduced.matches ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); rv.unobserve(en.target); } });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }) : null;
  $$('.rv').forEach(function (el) { if (rv) rv.observe(el); else el.classList.add('in'); });


  /* tabs: keep the current tab in view; on section pages follow the scroll */
  $$('.tabs').forEach(function (nav) {
    var row = $('.tabs-in', nav);
    function reveal(t) { if (t && row.scrollWidth > row.clientWidth) row.scrollTo({ left: t.offsetLeft - 16, behavior: reduced.matches ? 'auto' : 'smooth' }); }
    reveal($('.tab.on', nav));
    if (!nav.classList.contains('spy') || !('IntersectionObserver' in window)) return;
    var map = {};
    $$('.tab', nav).forEach(function (t) { var id = (t.getAttribute('href') || '').split('#')[1]; var el = id && document.getElementById(id); if (el) map[id] = t; });
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        $$('.tab', nav).forEach(function (t) { t.classList.toggle('on', t === map[en.target.id]); });
        reveal(map[en.target.id]);
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(map).forEach(function (id) { io2.observe(document.getElementById(id)); });
  });


  /* home: pinned video reveal, driven by scroll (never plays on its own) */
  $$('.reveal-pin').forEach(function (sec) {
    var v = $('video', sec), stage = $('.stage', sec), copy = $('.copy', sec);
    if (!v || reduced.matches) return;
    v.addEventListener('loadedmetadata', function () { v.pause(); });
    var ticking = false;
    function clamp(x) { return Math.max(0, Math.min(1, x)); }
    function frame() {
      ticking = false;
      var r = sec.getBoundingClientRect(), pinH = window.innerHeight;
      var p = clamp(-r.top / Math.max(1, r.height - pinH));
      var e = clamp(p * 1.6);
      stage.style.width = (60 + 40 * e) + '%';
      stage.style.height = (25 + 75 * e) + '%';
      stage.style.borderRadius = (22 * (1 - e)) + 'px';
      copy.style.opacity = clamp((p - 0.45) * 3);
      if (v.duration) {
        var t = p * (v.duration - 0.05);
        if (!v.seeking && Math.abs(v.currentTime - t) > 0.03) { if (v.fastSeek) v.fastSeek(t); else v.currentTime = t; }
      }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    frame();
  });


  /* home: the scroll story */
  var story = $('#story');
  if (story) {
    var brand = $('.home-brand'), hdrLogo = $('.site-header .logo');
    var stage = $('#stage'), vid = $('#story-vid'), cue = $('#cue'), fin = $('#final'), routeSvg = $('#route'), least = $('#least');
    var lines = $$('.story .line'), rail = $$('.story-rail i');
    var LEN = least.getTotalLength(); least.style.strokeDasharray = LEN; least.style.strokeDashoffset = LEN;
    vid.addEventListener('loadedmetadata', function () { vid.pause(); });
    vid.addEventListener('seeked', function () { storyScroll(); });
    function c(x) { return Math.max(0, Math.min(1, x)); }
    function ease(x) { return 1 - Math.pow(1 - x, 3); }
    function brandTarget() {
      var r = hdrLogo.getBoundingClientRect();
      document.documentElement.style.setProperty('--hb-x', r.left + 'px');
      document.documentElement.style.setProperty('--hb-y', r.top + (r.height - r.width * 95 / 380) / 2 + 'px');
      document.documentElement.style.setProperty('--hb-w', r.width + 'px');
    }
    function pull(el, p, a, b) {
      var w = .06, i = ease(c((p - a) / w)), o = ease(c((p - (b - w)) / w));
      el.style.opacity = i * (1 - o);
      el.style.transform = 'translate(-50%,-50%) translateY(' + ((1 - i) * 90 - o * 110) + 'px) scaleY(' + (1 + (1 - i) * .18 + o * .25) + ')';
      el.style.filter = 'blur(' + ((1 - i) * 10 + o * 12) + 'px)';
    }
    var sTick = false;
    function storyFrame() {
      sTick = false;
      document.body.classList.toggle('moved', window.scrollY > 4);
      if (reduced.matches) return;
      var r = story.getBoundingClientRect(), p = c(-r.top / (r.height - window.innerHeight));
      var s = ease(c(p / .07));
      cue.style.opacity = 1 - s;
      cue.style.transform = 'translateY(' + (-s * 160) + 'px) scaleY(' + (1 + s * .5) + ')';
      cue.style.filter = 'blur(' + (s * 10) + 'px)';
      var base = window.innerWidth <= 760 ? 86 : 60, e = ease(c((p - .01) / .26));
      stage.style.width = base + (100 - base) * e + 'vw';
      stage.style.height = 25 + 75 * e + 'vh';
      stage.style.borderRadius = 26 * (1 - e) + 'px';
      stage.style.marginTop = 10 * (1 - e) + 'vh';
      lines.forEach(function (l) { pull(l, p, +l.getAttribute('data-in'), +l.getAttribute('data-out')); });
      routeSvg.style.opacity = c((p - .33) / .03) * (1 - c((p - .52) / .04));
      least.style.strokeDashoffset = LEN * (1 - ease(c((p - .34) / .16)));
      var f = ease(c((p - .80) / .08));
      fin.style.opacity = f;
      fin.style.transform = 'translateY(' + (1 - f) * 40 + 'px)';
      fin.classList.toggle('on', f > .5);
      var ch = p < .32 ? 0 : p < .54 ? 1 : p < .80 ? 2 : 3;
      rail.forEach(function (i, k) { i.classList.toggle('on', k === ch); });
      if (vid.duration && !vid.seeking) {
        var t = c(p / .9) * (vid.duration - .05);
        if (Math.abs(vid.currentTime - t) > .03) { if (vid.fastSeek) vid.fastSeek(t); else vid.currentTime = t; }
      }
    }
    function storyScroll() { if (!sTick) { sTick = true; requestAnimationFrame(storyFrame); } }
    window.addEventListener('scroll', storyScroll, { passive: true });
    window.addEventListener('resize', function () { brandTarget(); storyScroll(); });
    brandTarget();
    storyFrame();
  }

  /* book a demo: ?interest=voyage|compliance|analytics */
  var want = new URLSearchParams(location.search).get('interest');
  if (want) { var box = $('input[name="interest"][value="' + want.replace(/[^a-z0-9-]/g, '') + '"]'); if (box) box.checked = true; }

  /* forms: validate, then open the visitor's own e-mail app */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var LABELS = { interest: 'Wants to see', name: 'Name', company: 'Company', email: 'Work e-mail', phone: 'Phone or WhatsApp', role: 'Role', fleet: 'Ships in fleet', types: 'Ship types', country: 'Country', topic: 'Topic', message: 'Message' };
  function validate(form) {
    var first = null;
    $$('.field[data-field]', form).forEach(function (f) {
      var input = f.querySelector('input:not([type=hidden]), select, textarea');
      var ok = true;
      if (f.hasAttribute('data-group-required')) ok = !!f.querySelector('input:checked');
      else if (input && input.required) ok = input.type === 'checkbox' ? input.checked : (input.value.trim() !== '' && (input.type !== 'email' || EMAIL_RE.test(input.value.trim())));
      var err = f.querySelector('.err');
      if (ok) f.removeAttribute('data-invalid'); else f.setAttribute('data-invalid', '');
      if (input) {
        if (ok) { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); }
        else { input.setAttribute('aria-invalid', 'true'); if (err) input.setAttribute('aria-describedby', err.id); }
      }
      if (!ok && !first) first = input;
    });
    if (first) first.focus();
    return !first;
  }
  $$('form[data-form]').forEach(function (form) {
    var kind = form.getAttribute('data-form');
    form.addEventListener('input', function (e) { var f = e.target.closest('[data-invalid]'); if (f) f.removeAttribute('data-invalid'); });
    form.addEventListener('change', function (e) { var f = e.target.closest('[data-invalid]'); if (f) f.removeAttribute('data-invalid'); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var errBox = $('.form-error', form);
      errBox.classList.remove('show');
      if (!validate(form)) { errBox.textContent = 'Please check the highlighted fields.'; errBox.classList.add('show'); return; }
      var data = {};
      $$('input, select, textarea', form).forEach(function (el) {
        if (!el.name || el.name === 'website' || el.name === 'consent') return;
        if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) return;
        var v = String(el.getAttribute('data-label') || el.value).trim();
        if (v) data[el.name] = data[el.name] ? data[el.name] + ', ' + v : v;
      });
      var trap = form.querySelector('input[name=website]');
      var order = kind === 'demo' ? ['interest', 'name', 'company', 'email', 'phone', 'role', 'fleet', 'types', 'country', 'message'] : ['name', 'company', 'email', 'fleet', 'types', 'message'];
      var body = order.filter(function (k) { return data[k]; }).map(function (k) { return LABELS[k] + ': ' + data[k]; }).join('\n') + '\n\nSent from neuraldrifts.com';
      var subject = (kind === 'demo' ? 'Demo request: ' : 'Fleet enquiry: ') + (data.company || data.name || '');
      if (!(trap && trap.value)) {
        var a = document.createElement('a');
        a.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        document.body.appendChild(a); a.click(); a.remove();
      }
      var st = document.getElementById(kind + '-status');
      var det = document.createElement('details');
      det.innerHTML = '<summary>Show the text to copy</summary><pre></pre>';
      det.querySelector('pre').textContent = 'To: ' + EMAIL + '\nSubject: ' + subject + '\n\n' + body;
      st.appendChild(det);
      form.hidden = true;
      st.classList.add('show');
      st.focus();
    });
  });
})();
