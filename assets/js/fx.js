/* Effects, written for this page in plain WebGL and canvas, with no libraries:
   blinds      — the GradientBlinds shader
   magnet      — the MagnetLines field
   aurorahead  — the watchkeeper, drawn by the supplied AuroraHead engine
   globe       — a wireframe globe with trade lanes
   Every effect pauses off-screen and in background tabs, and is disposed when its page closes. */
var ND_FX = (function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var now = function () { return performance.now(); };

  function hexToRgb(h) {
    h = String(h).replace('#', '');
    if (h.length === 3) h = h.replace(/(.)/g, '$1$1');
    var n = parseInt(h, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
    return s;
  }
  function prog(gl, vs, fs) {
    var p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'position');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link');
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); }
    return { p: p, u: u };
  }
  // Runs a loop only while the element is on screen, the tab is visible and the page is open.
  function lifecycle(el, frame) {
    var raf = 0, onScreen = false, alive = true, last = now();
    function tick() {
      raf = 0;
      if (!alive || !onScreen || document.hidden) return;
      var t = now(), dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      frame(dt, t / 1000);
      raf = requestAnimationFrame(tick);
    }
    function start() { if (!raf && alive && onScreen && !document.hidden) { last = now(); raf = requestAnimationFrame(tick); } }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
    var io = new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; if (onScreen) start(); else stop(); }, { threshold: 0.01 });
    io.observe(el);
    function vis() { if (document.hidden) stop(); else start(); }
    document.addEventListener('visibilitychange', vis);
    return {
      start: start,
      stop: stop,
      dispose: function () { alive = false; stop(); io.disconnect(); document.removeEventListener('visibilitychange', vis); },
    };
  }
  function insideRect(r, x, y) { return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; }

  // ══ GradientBlinds ════════════════════════════════════════════════════════
  var BLINDS_VS = 'attribute vec2 position;varying vec2 vUv;void main(){vUv=position*0.5+0.5;gl_Position=vec4(position,0.0,1.0);}';
  var BLINDS_FS = [
    'precision mediump float;',
    'uniform vec3 iResolution;uniform vec2 iMouse;uniform float iTime;uniform float uAngle;uniform float uNoise;uniform float uBlindCount;',
    'uniform float uSpotlightRadius;uniform float uSpotlightSoftness;uniform float uSpotlightOpacity;uniform float uMirror;uniform float uDistort;uniform float uShineFlip;',
    'uniform vec3 uColor0;uniform vec3 uColor1;uniform vec3 uColor2;uniform vec3 uColor3;uniform vec3 uColor4;uniform vec3 uColor5;uniform vec3 uColor6;uniform vec3 uColor7;uniform int uColorCount;',
    'varying vec2 vUv;',
    'float rand(vec2 co){return fract(sin(dot(co,vec2(12.9898,78.233)))*43758.5453);}',
    'vec2 rotate2D(vec2 p,float a){float c=cos(a);float s=sin(a);return mat2(c,-s,s,c)*p;}',
    'vec3 grad(float t){float tt=clamp(t,0.0,1.0);int count=uColorCount;if(count<2)count=2;float scaled=tt*float(count-1);float seg=floor(scaled);float f=fract(scaled);',
    'if(seg<1.0)return mix(uColor0,uColor1,f);if(seg<2.0&&count>2)return mix(uColor1,uColor2,f);if(seg<3.0&&count>3)return mix(uColor2,uColor3,f);',
    'if(seg<4.0&&count>4)return mix(uColor3,uColor4,f);if(seg<5.0&&count>5)return mix(uColor4,uColor5,f);if(seg<6.0&&count>6)return mix(uColor5,uColor6,f);',
    'if(seg<7.0&&count>7)return mix(uColor6,uColor7,f);if(count>7)return uColor7;if(count>6)return uColor6;if(count>5)return uColor5;if(count>4)return uColor4;',
    'if(count>3)return uColor3;if(count>2)return uColor2;return uColor1;}',
    'void main(){vec2 fragCoord=vUv*iResolution.xy;vec2 uv0=fragCoord.xy/iResolution.xy;float aspect=iResolution.x/iResolution.y;vec2 p=uv0*2.0-1.0;p.x*=aspect;',
    'vec2 pr=rotate2D(p,uAngle);pr.x/=aspect;vec2 uv=pr*0.5+0.5;vec2 uvMod=uv;',
    'if(uDistort>0.0){float a=uvMod.y*6.0;float b=uvMod.x*6.0;float w=0.01*uDistort;uvMod.x+=sin(a)*w;uvMod.y+=cos(b)*w;}',
    'float t=uvMod.x;if(uMirror>0.5){t=1.0-abs(1.0-2.0*fract(t));}',
    'vec3 base=grad(t);vec2 offset=vec2(iMouse.x/iResolution.x,iMouse.y/iResolution.y);float d=length(uv0-offset);',
    'float r=max(uSpotlightRadius,1e-4);float dn=d/r;float spot=(1.0-2.0*pow(dn,uSpotlightSoftness))*uSpotlightOpacity;',
    'float stripe=fract(uvMod.x*max(uBlindCount,1.0));if(uShineFlip>0.5)stripe=1.0-stripe;',
    'vec3 col=vec3(spot)+base-vec3(stripe);col+=(rand(gl_FragCoord.xy+iTime)-0.5)*uNoise;gl_FragColor=vec4(col,1.0);}',
  ].join('\n');

  function blinds(host) {
    var d = host.dataset;
    var o = {
      colors: (d.colors || '#FF9FFC,#5227FF').split(','), angle: +(d.angle || 0), noise: +(d.noise || 0.3), count: +(d.count || 16), minWidth: +(d.minwidth || 60),
      damp: 0.15, mirror: d.mirror === 'true', spot: +(d.spot || 0.5), soft: +(d.soft || 1), spotOp: +(d.spotop || 1), distort: +(d.distort || 0), shine: d.shine || 'left',
    };
    var canvas = document.createElement('canvas');
    var gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true }) || canvas.getContext('experimental-webgl');
    if (!gl) { host.classList.add('no-gl'); return null; }
    host.appendChild(canvas);
    var P;
    try { P = prog(gl, BLINDS_VS, BLINDS_FS); } catch (e) { canvas.remove(); host.classList.add('no-gl'); return null; }
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(P.p);
    var stops = o.colors.slice(0, 8), count = Math.max(2, stops.length);
    if (stops.length === 1) stops.push(stops[0]);
    while (stops.length < 8) stops.push(stops[stops.length - 1]);
    for (var i = 0; i < 8; i++) { var c = hexToRgb(stops[i]); gl.uniform3f(P.u['uColor' + i], c[0], c[1], c[2]); }
    gl.uniform1i(P.u.uColorCount, count);
    gl.uniform1f(P.u.uAngle, (o.angle * Math.PI) / 180);
    gl.uniform1f(P.u.uNoise, o.noise);
    gl.uniform1f(P.u.uSpotlightRadius, o.spot);
    gl.uniform1f(P.u.uSpotlightSoftness, o.soft);
    gl.uniform1f(P.u.uSpotlightOpacity, o.spotOp);
    gl.uniform1f(P.u.uMirror, o.mirror ? 1 : 0);
    gl.uniform1f(P.u.uDistort, o.distort);
    gl.uniform1f(P.u.uShineFlip, o.shine === 'right' ? 1 : 0);
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5), W = 1, H = 1, mouse = [0, 0], tgt = [0, 0], first = true, lastUser = -1e9;
    function resize() {
      var r = host.getBoundingClientRect();
      W = Math.max(1, Math.floor(r.width * dpr)); H = Math.max(1, Math.floor(r.height * dpr));
      canvas.width = W; canvas.height = H;
      gl.viewport(0, 0, W, H);
      gl.uniform3f(P.u.iResolution, W, H, 1);
      var eff = Math.max(1, Math.min(o.count, Math.floor(r.width / o.minWidth)));
      gl.uniform1f(P.u.uBlindCount, eff);
      if (first) { first = false; mouse = [W * 0.62, H * 0.58]; tgt = mouse.slice(); }
      if (reduce) render(0);
    }
    function render(t) {
      gl.uniform2f(P.u.iMouse, mouse[0], mouse[1]);
      gl.uniform1f(P.u.iTime, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function onMove(e) {
      if (e.pointerType === 'touch') return;
      var r = host.getBoundingClientRect();
      if (!insideRect(r, e.clientX, e.clientY)) return;
      tgt = [(e.clientX - r.left) * dpr, (r.height - (e.clientY - r.top)) * dpr];
      lastUser = now();
    }
    window.addEventListener('pointermove', onMove, { passive: true });
    var ro = new ResizeObserver(resize); ro.observe(host);
    resize();
    var L = reduce ? null : lifecycle(host, function (dt, t) {
      if (now() - lastUser > 2600) {
        tgt = [W * (0.55 + 0.3 * Math.sin(t * 0.21)), H * (0.5 + 0.26 * Math.sin(t * 0.29 + 1.2))];
      }
      var f = 1 - Math.exp(-dt / Math.max(1e-4, o.damp * (now() - lastUser > 2600 ? 6 : 1)));
      mouse[0] += (tgt[0] - mouse[0]) * f; mouse[1] += (tgt[1] - mouse[1]) * f;
      render(t);
    });
    return {
      dispose: function () {
        if (L) L.dispose(); ro.disconnect(); window.removeEventListener('pointermove', onMove);
        var ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext();
        canvas.remove();
      },
    };
  }

  // ══ MagnetLines ═══════════════════════════════════════════════════════════
  function magnet(host) {
    var rows = +host.dataset.rows || 9, cols = +host.dataset.cols || 9, base = -10;
    var stage = host.parentNode, out = stage && stage.querySelector('[data-set]');
    host.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
    host.style.gridTemplateRows = 'repeat(' + rows + ', 1fr)';
    var spans = [], frag = document.createDocumentFragment();
    for (var i = 0; i < rows * cols; i++) { var s = document.createElement('span'); s.style.setProperty('--r', base + 'deg'); frag.appendChild(s); spans.push(s); }
    host.appendChild(frag);
    var centres = [], size = 1;
    function measure() {
      var hr = host.getBoundingClientRect(); size = hr.width;
      centres = spans.map(function (sp) { return [sp.offsetLeft + sp.offsetWidth / 2, sp.offsetTop + sp.offsetHeight / 2]; });
      void hr;
    }
    measure();
    var ro = new ResizeObserver(measure); ro.observe(host);
    var px = 0, py = 0, lastUser = -1e9, pending = false;
    function point(lx, ly) { // in host coordinates
      var hot = size * 0.17;
      for (var k = 0; k < spans.length; k++) {
        var cx = centres[k][0], cy = centres[k][1];
        var b = lx - cx, a = ly - cy, c = Math.sqrt(a * a + b * b) || 1;
        var r = (Math.acos(b / c) * 180 / Math.PI) * (ly > cy ? 1 : -1);
        spans[k].style.setProperty('--r', r.toFixed(1) + 'deg');
        spans[k].classList.toggle('is-hot', c < hot);
      }
      if (out) {
        var brg = (Math.atan2(lx - size / 2, -(ly - size / 2)) * 180 / Math.PI + 360) % 360;
        out.textContent = ('00' + Math.round(brg) % 360).slice(-3) + '°';
      }
    }
    function fromClient(x, y) { var r = host.getBoundingClientRect(); px = x - r.left; py = y - r.top; lastUser = now(); if (!pending) { pending = true; requestAnimationFrame(function () { pending = false; point(px, py); }); } }
    function onMove(e) { if (e.pointerType === 'touch') return; fromClient(e.clientX, e.clientY); }
    function onDown(e) { if (e.pointerType === 'touch' || e.pointerType === 'pen') fromClient(e.clientX, e.clientY); }
    function onTouchMove(e) { if (e.pointerType === 'touch') fromClient(e.clientX, e.clientY); }
    window.addEventListener('pointermove', onMove, { passive: true });
    host.addEventListener('pointerdown', onDown, { passive: true });
    host.addEventListener('pointermove', onTouchMove, { passive: true });
    if (reduce) { point(size * 0.78, size * 0.3); return { dispose: function () { ro.disconnect(); window.removeEventListener('pointermove', onMove); host.innerHTML = ''; } }; }
    var L = lifecycle(host, function (dt, t) {
      if (now() - lastUser < 2600) return;
      var ang = t * 0.42, R = size * 0.3;
      point(size / 2 + Math.cos(ang) * R, size / 2 + Math.sin(ang * 1.3) * R * 0.8);
    });
    return {
      dispose: function () {
        L.dispose(); ro.disconnect();
        window.removeEventListener('pointermove', onMove); host.removeEventListener('pointerdown', onDown); host.removeEventListener('pointermove', onTouchMove);
        host.innerHTML = '';
      },
    };
  }

  // ══ The watchkeeper: the Neural Drift assistant head (supplied engine, see aurora-head.js) ══════════
  // The engine pauses itself off-screen and in background tabs, and keeps still for reduced motion.
  function aurorahead(host) {
    var E = window.AuroraHeadEngine;
    if (!E || !E.createAuroraHead) return null;
    var h = E.createAuroraHead(host, {
      theme: host.getAttribute('data-theme') || 'light',
      face: host.getAttribute('data-face') || 'calm',
      framing: host.getAttribute('data-framing') || 'stage',
    });
    host.__ah = h;
    host.setAttribute('data-state', 'idle');
    return { dispose: function () { host.__ah = null; h.destroy(); } };
  }

  // ══ Globe with trade lanes ════════════════════════════════════════════════
  function globe(canvas) {
    var g = canvas.getContext('2d');
    if (!g) return null;
    var D2R = Math.PI / 180, dpr = Math.min(window.devicePixelRatio || 1, 2), W = 1, H = 1, R = 1, cx = 0, cy = 0;
    var lon0 = 70, lat0 = 16;
    var P = { sg: [1.29, 103.85], rtm: [51.95, 4.14], nbo: [29.87, 121.55], van: [49.29, -123.11], san: [-23.96, -46.33], qdo: [36.07, 120.38], hou: [29.76, -95.36], phe: [-20.31, 118.58], fuj: [25.12, 56.33], dur: [-29.86, 31.03] };
    var lanes = [['nbo', 'van'], ['sg', 'fuj'], ['fuj', 'rtm'], ['phe', 'qdo'], ['san', 'dur'], ['dur', 'sg'], ['hou', 'rtm']];
    function vec(lat, lon) { var a = lat * D2R, b = lon * D2R; return [Math.cos(a) * Math.cos(b), Math.cos(a) * Math.sin(b), Math.sin(a)]; }
    function back(v) { return [Math.asin(Math.max(-1, Math.min(1, v[2]))) / D2R, Math.atan2(v[1], v[0]) / D2R]; }
    var arcs = lanes.map(function (l) {
      var a = vec(P[l[0]][0], P[l[0]][1]), b = vec(P[l[1]][0], P[l[1]][1]);
      var dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2], om = Math.acos(Math.max(-1, Math.min(1, dot))), so = Math.sin(om) || 1, pts = [];
      for (var i = 0; i <= 72; i++) { var t = i / 72, s1 = Math.sin((1 - t) * om) / so, s2 = Math.sin(t * om) / so; pts.push(back([a[0] * s1 + b[0] * s2, a[1] * s1 + b[1] * s2, a[2] * s1 + b[2] * s2])); }
      return pts;
    });
    function proj(lat, lon) {
      var p = lat * D2R, l = (lon - lon0) * D2R, t = lat0 * D2R;
      var x = Math.cos(p) * Math.sin(l), y = Math.sin(p), z = Math.cos(p) * Math.cos(l);
      var y2 = y * Math.cos(t) - z * Math.sin(t), z2 = y * Math.sin(t) + z * Math.cos(t);
      return [cx + R * x, cy - R * y2, z2];
    }
    function resize() {
      var r = canvas.getBoundingClientRect();
      W = Math.max(1, Math.floor(r.width * dpr)); H = Math.max(1, Math.floor(r.height * dpr));
      canvas.width = W; canvas.height = H; cx = W / 2; cy = H / 2; R = Math.min(W, H) * 0.42;
    }
    function line(pts, style, width) {
      g.strokeStyle = style; g.lineWidth = width; g.beginPath();
      var pen = false;
      for (var i = 0; i < pts.length; i++) {
        var q = proj(pts[i][0], pts[i][1]);
        if (q[2] > 0) { if (pen) g.lineTo(q[0], q[1]); else { g.moveTo(q[0], q[1]); pen = true; } } else pen = false;
      }
      g.stroke();
    }
    var grat = [];
    for (var la = -75; la <= 75; la += 15) { var a = []; for (var lo = -180; lo <= 180; lo += 3) a.push([la, lo]); grat.push([a, la === 0]); }
    for (var lo2 = -180; lo2 < 180; lo2 += 15) { var b = []; for (var la2 = -90; la2 <= 90; la2 += 3) b.push([la2, lo2]); grat.push([b, false]); }
    function draw(t) {
      g.clearRect(0, 0, W, H);
      var glow = g.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R * 1.05);
      glow.addColorStop(0, 'rgba(66,194,217,0.16)'); glow.addColorStop(0.7, 'rgba(14,90,111,0.10)'); glow.addColorStop(1, 'rgba(10,22,40,0)');
      g.fillStyle = glow; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(107,216,236,0.42)'; g.lineWidth = 1.2 * dpr; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
      grat.forEach(function (gl2) { line(gl2[0], gl2[1] ? 'rgba(107,216,236,0.28)' : 'rgba(107,216,236,0.11)', dpr); });
      arcs.forEach(function (pts, k) {
        line(pts, 'rgba(107,216,236,0.7)', 1.5 * dpr);
        var u = ((t * 0.045 + k * 0.17) % 1), idx = Math.floor(u * (pts.length - 1)), q = proj(pts[idx][0], pts[idx][1]);
        if (q[2] > 0) {
          var rg = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], 9 * dpr);
          rg.addColorStop(0, 'rgba(255,255,255,0.95)'); rg.addColorStop(0.35, 'rgba(107,216,236,0.6)'); rg.addColorStop(1, 'rgba(107,216,236,0)');
          g.fillStyle = rg; g.beginPath(); g.arc(q[0], q[1], 9 * dpr, 0, Math.PI * 2); g.fill();
        }
      });
      Object.keys(P).forEach(function (k) { var q = proj(P[k][0], P[k][1]); if (q[2] > 0) { g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(q[0], q[1], 2.2 * dpr, 0, Math.PI * 2); g.fill(); } });
    }
    var ro = new ResizeObserver(function () { resize(); draw(0); }); ro.observe(canvas);
    resize(); draw(0);
    if (reduce) return { dispose: function () { ro.disconnect(); } };
    var L = lifecycle(canvas, function (dt, t) { lon0 -= dt * 3.2; draw(t); });
    return { dispose: function () { L.dispose(); ro.disconnect(); } };
  }

  return { blinds: blinds, magnet: magnet, aurorahead: aurorahead, globe: globe };
})();
