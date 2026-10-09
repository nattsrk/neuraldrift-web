/* AuroraHead engine: the Neural Drift assistant head (supplied component, compiled build, unchanged).
   A WebGL aurora sphere with a glowing line face that turns toward the pointer; 2D-canvas fallback.
   Exposes window.AuroraHeadEngine.createAuroraHead(host, { theme, face, state, framing, interactive, quality }). */
var AuroraHeadEngine = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/engine.ts
  var engine_exports = {};
  __export(engine_exports, {
    createAuroraHead: () => createAuroraHead
  });
  var FRAMINGS = {
    stage: { cx: 0.5, cy: 0.47, r: 0.29, floor: 0.885, bob: 0.012, shadow: true },
    avatar: { cx: 0.5, cy: 0.5, r: 0.36, floor: 0.95, bob: 6e-3, shadow: false }
  };
  var MAX_YAW = 0.56;
  var MAX_PITCH = 0.34;
  var VERT = "attribute vec2 aPos;void main(){gl_Position=vec4(aPos,0.0,1.0);}";
  var FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uC;
uniform float uR;
uniform float uFloor;
uniform float uT;
uniform mat3 uRot;
uniform vec3 uL;
uniform float uDark;
uniform float uPulse;
uniform float uPulseA;
uniform vec3 uFlow;
uniform float uAttn;
uniform float uLift;
uniform float uShadow;

vec3 h33(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx) * 2.0 - 1.0;
}
float gn(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float a = dot(h33(i), f);
  float b = dot(h33(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0));
  float c = dot(h33(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0));
  float d = dot(h33(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0));
  float e = dot(h33(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0));
  float g = dot(h33(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0));
  float h = dot(h33(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0));
  float k = dot(h33(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0));
  return mix(mix(mix(a, b, u.x), mix(c, d, u.x), u.y), mix(mix(e, g, u.x), mix(h, k, u.x), u.y), u.z);
}
float fbm(vec3 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    s += a * gn(p);
    p = p * 2.02 + vec3(1.7, 9.2, 3.1);
    a *= 0.5;
  }
  return s;
}
void main() {
  vec2 p = (gl_FragCoord.xy - uC) / uR;
  float r = length(p);
  vec4 o = vec4(0.0);
  if (uShadow > 0.5) {
    vec2 sp = vec2((gl_FragCoord.x - uC.x) / (uR * (0.72 - 0.12 * uLift)), (gl_FragCoord.y - uFloor) / (uR * 0.12));
    float sh = exp(-dot(sp, sp) * 1.5) * (0.17 - 0.06 * uLift) * (1.0 - uDark);
    o = vec4(vec3(0.30, 0.28, 0.52) * sh, sh);
  }
  if (r < 1.6) {
    float z = sqrt(max(1.0 - r * r, 0.0));
    vec3 n = r < 1.0 ? vec3(p, z) : vec3(p / r, 0.0);
    vec3 q = uRot * n;
    // slow, large-scale flow field
    vec3 w = q * 0.9 + uFlow;
    vec3 wp = vec3(gn(w + vec3(0.0, 0.0, uT * 0.10)), gn(w + vec3(5.2, 1.3, -uT * 0.08)), gn(w + vec3(2.7, 4.1, uT * 0.07)));
    vec3 wq = q + wp * 0.75;
    float big = gn(wq * 0.9 + vec3(0.0, uT * 0.06, 0.0)) * 0.7 + gn(wq * 1.8 - vec3(uT * 0.05, 0.0, 0.0)) * 0.3;
    float m = gn(wq * 0.7 + vec3(3.1, uT * 0.04, 1.7));
    vec3 cCy = vec3(0.30, 0.86, 0.97);
    vec3 cVi = vec3(0.60, 0.45, 0.98);
    vec3 cBl = vec3(0.42, 0.60, 1.0);
    vec3 col = mix(cBl, cVi, smoothstep(-0.30, 0.30, big));
    col = mix(col, cCy, smoothstep(-0.05, 0.38, m));
    // inner layer gives depth
    vec3 qi = uRot * vec3(p * 0.8, -z * 0.6);
    float deep = gn(qi * 1.1 + wp * 0.4 + vec3(uT * 0.05, 0.0, 0.0));
    col = mix(col, mix(cVi, cCy, smoothstep(-0.3, 0.3, deep)), 0.25);
    // aurora ribbons: soft curtains of light that fade in and out along their length
    float rib = pow(0.5 + 0.5 * sin(3.2 * wq.y + 2.4 * big + uT * 0.30), 3.0)
              * smoothstep(-0.2, 0.5, gn(wq * 1.3 + vec3(0.0, 0.0, uT * 0.12)));
    float rib2 = pow(0.5 + 0.5 * sin(2.6 * wq.x - 3.0 * m - uT * 0.22), 4.0)
              * smoothstep(-0.1, 0.6, gn(wq * 1.1 + vec3(7.3, uT * 0.10, 0.0)));
    float ribs = clamp((rib * 0.70 + rib2 * 0.45) * (1.0 + 0.5 * uAttn), 0.0, 0.88);
    vec3 ribCol = mix(vec3(0.80, 0.98, 1.0), vec3(0.92, 0.86, 1.0), 0.5 + 0.5 * sin(uT * 0.2 + wq.x * 2.0));
    float dif = max(dot(n, uL), 0.0);
    float fre = pow(1.0 - z, 2.0);
    float spe = pow(max(reflect(-uL, n).z, 0.0), 30.0);
    float core = 1.0 - r * r;
    float bounce = fre * smoothstep(0.1, -0.7, n.y);
    float ring = exp(-pow((r - uPulse * 1.25) * 6.0, 2.0)) * uPulseA;
    vec3 c1;
    if (uDark < 0.5) {
      c1 = col * (0.66 + 0.38 * dif + 0.12 * core);
      c1 = mix(c1, ribCol, ribs);
      c1 = mix(c1, vec3(1.0), clamp(spe * 0.50 + ring * 0.55, 0.0, 1.0));
      c1 += fre * vec3(0.55, 0.85, 1.0) * 0.14 + bounce * vec3(0.55, 0.95, 1.0) * 0.18;
    } else {
      c1 = col * (0.62 + 0.34 * dif + 0.18 * core);
      c1 = mix(c1, ribCol, ribs * 0.75);
      c1 = mix(c1, vec3(0.95, 0.98, 1.0), clamp(spe * 0.40 + ring * 0.55, 0.0, 1.0));
      c1 += fre * mix(cCy, cVi, 0.5) * 0.22 + bounce * cCy * 0.20;
    }
    float wisp = gn(vec3(p * 1.7, uT * 0.07 + 3.0)) * 0.65 + gn(vec3(p * 3.4, uT * 0.11 + 8.0)) * 0.35;
    float re = r + wisp * 0.09;
    float body = 1.0 - smoothstep(0.66, 1.05, re);
    vec3 haloCol = mix(cCy, cVi, 0.5 + 0.5 * sin(atan(p.y, p.x + 0.0001) + uT * 0.2 + big * 2.0));
    c1 = mix(haloCol * (uDark > 0.5 ? 0.9 : 1.0), c1, smoothstep(0.0, 0.6, body));
    float halo = exp(-pow(max(re - 0.74, 0.0) * (uDark > 0.5 ? 2.5 : 2.7), 2.0)) * (uDark > 0.5 ? 0.50 : 0.44);
    float a = body * (0.92 + 0.05 * uAttn) + (1.0 - body) * halo;
    o = vec4(clamp(c1, 0.0, 1.0) * a, a) + o * (1.0 - a);
  }
  gl_FragColor = o;
}
`;
  var clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  var smooth = (a, b, v) => {
    const t = clamp((v - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  var ease = (rate, dt) => 1 - Math.exp(-rate * dt);
  function mul(a, b) {
    return [
      a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
      a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
      a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
      a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
      a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
      a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
      a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
      a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
      a[6] * b[2] + a[7] * b[5] + a[8] * b[8]
    ];
  }
  function rotation(yaw, pitch, roll) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const cr = Math.cos(roll), sr = Math.sin(roll);
    const ry = [cy, 0, sy, 0, 1, 0, -sy, 0, cy];
    const rx = [1, 0, 0, 0, cp, -sp, 0, sp, cp];
    const rz = [cr, -sr, 0, sr, cr, 0, 0, 0, 1];
    return mul(rz, mul(rx, ry));
  }
  var apply = (m, v) => [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2]
  ];
  var onSphere = (x, y) => {
    const d = x * x + y * y;
    if (d >= 0.999) {
      const s = Math.sqrt(0.999 / d);
      return [x * s, y * s, Math.sqrt(1e-3)];
    }
    return [x, y, Math.sqrt(1 - d)];
  };
  var norm3 = (v) => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  var cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  function createAuroraHead(host, options = {}) {
    var _a, _b, _c, _d, _e;
    let theme = (_a = options.theme) != null ? _a : "light";
    let face = (_b = options.face) != null ? _b : "calm";
    let state = (_c = options.state) != null ? _c : "idle";
    const fr = FRAMINGS[(_d = options.framing) != null ? _d : "stage"];
    const interactive = (_e = options.interactive) != null ? _e : true;
    const fixedQ = typeof options.quality === "number" ? clamp(options.quality, 0.4, 1) : null;
    const mqCoarse = typeof window.matchMedia === "function" ? window.matchMedia("(pointer: coarse)") : null;
    const mqReduce = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    let quality = fixedQ != null ? fixedQ : mqCoarse && mqCoarse.matches ? 0.6 : 0.8;
    let reduced = !!(mqReduce && mqReduce.matches);
    if (window.getComputedStyle(host).position === "static") host.style.position = "relative";
    const makeCanvas = () => {
      const c = document.createElement("canvas");
      c.setAttribute("aria-hidden", "true");
      c.style.position = "absolute";
      c.style.display = "block";
      c.style.pointerEvents = "none";
      return c;
    };
    let aur = makeCanvas();
    const fc = makeCanvas();
    host.appendChild(aur);
    host.appendChild(fc);
    const fctx = fc.getContext("2d");
    let gl = null;
    let prog = null;
    let vbo = null;
    let c2 = null;
    let off = null;
    const U = {};
    const UNAMES = ["uC", "uR", "uFloor", "uT", "uRot", "uL", "uDark", "uPulse", "uPulseA", "uFlow", "uAttn", "uLift", "uShadow"];
    const compile = (g, type, src) => {
      const s = g.createShader(type);
      if (!s) return null;
      g.shaderSource(s, src);
      g.compileShader(s);
      if (!g.getShaderParameter(s, g.COMPILE_STATUS)) {
        console.warn("[AuroraHead] shader compile failed:", g.getShaderInfoLog(s));
        g.deleteShader(s);
        return null;
      }
      return s;
    };
    const initGL = () => {
      let g = null;
      try {
        g = aur.getContext("webgl", {
          alpha: true,
          premultipliedAlpha: true,
          antialias: false,
          depth: false,
          stencil: false,
          preserveDrawingBuffer: false,
          powerPreference: "low-power"
        });
      } catch {
        g = null;
      }
      if (!g) return false;
      if (g.isContextLost()) return false;
      const vs = compile(g, g.VERTEX_SHADER, VERT);
      const fs = compile(g, g.FRAGMENT_SHADER, FRAG);
      if (!vs || !fs) return false;
      const p = g.createProgram();
      if (!p) return false;
      g.attachShader(p, vs);
      g.attachShader(p, fs);
      g.bindAttribLocation(p, 0, "aPos");
      g.linkProgram(p);
      g.deleteShader(vs);
      g.deleteShader(fs);
      if (!g.getProgramParameter(p, g.LINK_STATUS)) {
        console.warn("[AuroraHead] program link failed:", g.getProgramInfoLog(p));
        g.deleteProgram(p);
        return false;
      }
      const b = g.createBuffer();
      g.bindBuffer(g.ARRAY_BUFFER, b);
      g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
      g.useProgram(p);
      g.enableVertexAttribArray(0);
      g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);
      for (const n of UNAMES) U[n] = g.getUniformLocation(p, n);
      gl = g;
      prog = p;
      vbo = b;
      return true;
    };
    const initFallback = () => {
      const fresh = makeCanvas();
      host.replaceChild(fresh, aur);
      aur = fresh;
      c2 = aur.getContext("2d");
      off = document.createElement("canvas");
    };
    const onLost = (e) => {
      e.preventDefault();
      gl = null;
      prog = null;
      vbo = null;
    };
    const onRestored = () => {
      if (initGL()) {
        resize();
        kick();
      }
    };
    if (!initGL()) initFallback();
    aur.addEventListener("webglcontextlost", onLost, false);
    aur.addEventListener("webglcontextrestored", onRestored, false);
    let cssSize = 1, offX = 0, offY = 0;
    let pX = 0, pY = 0, hasP = false, inside = false, lastMove = -1e9, lastEvT = 0, pvx = 0, pvy = 0;
    let onScreen = true, docVisible = !document.hidden, destroyed = false;
    let raf = 0, running = false, last = 0, frames = 0, perfAcc = 0, perfN = 0;
    let t = 0, tFlow = 0;
    let yaw = 0, pitch = 0, roll = 0, vYaw = 0, vPitch = 0, tYaw = 0, tPitch = 0;
    let gazeX = 0, gazeY = 0, attn = 0, attnT = 0, browL = 0, browR = 0;
    let blinkT = -1, nextBlink = 2.2, blinkS = 1, doubleBlink = false;
    let pulseP = 1, pulseA = 0;
    const flow = [0, 0, 0];
    let mouth = 0, mouthT = 0, extLevel = 0, levelAt = -1e9;
    let bob = 0;
    function resize() {
      if (destroyed) return;
      const w = host.clientWidth;
      const h = host.clientHeight || w;
      cssSize = Math.max(1, Math.min(w || h, h));
      offX = (w - cssSize) / 2;
      offY = (h - cssSize) / 2;
      const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
      for (const c of [aur, fc]) {
        c.style.left = `${offX}px`;
        c.style.top = `${offY}px`;
        c.style.width = `${cssSize}px`;
        c.style.height = `${cssSize}px`;
      }
      const fpx = Math.max(16, Math.round(cssSize * dpr));
      if (fc.width !== fpx || fc.height !== fpx) {
        fc.width = fpx;
        fc.height = fpx;
      }
      const apx = Math.max(16, Math.round(cssSize * dpr * quality));
      if (aur.width !== apx || aur.height !== apx) {
        aur.width = apx;
        aur.height = apx;
      }
      if (off && (off.width !== apx || off.height !== apx)) {
        off.width = apx;
        off.height = apx;
      }
      kick();
    }
    const headCentre = () => {
      const r = host.getBoundingClientRect();
      return [r.left + offX + cssSize * fr.cx, r.top + offY + cssSize * fr.cy];
    };
    const onMove = (e) => {
      const now = performance.now();
      if (hasP) {
        const dtE = Math.max(8, now - lastEvT);
        pvx = pvx * 0.6 + clamp((e.clientX - pX) / dtE * 1e3, -4e3, 4e3) * 0.4;
        pvy = pvy * 0.6 + clamp((e.clientY - pY) / dtE * 1e3, -4e3, 4e3) * 0.4;
      }
      pX = e.clientX;
      pY = e.clientY;
      hasP = true;
      inside = true;
      lastMove = now;
      lastEvT = now;
      kick();
    };
    const onDown = (e) => {
      onMove(e);
      const [hx, hy] = headCentre();
      if (Math.hypot(e.clientX - hx, e.clientY - hy) <= cssSize * fr.r * 1.25) {
        pulseP = 0;
        pulseA = 1;
        vPitch += reduced ? 0 : 0.9;
        kick();
      }
    };
    const onLeave = () => {
      inside = false;
      kick();
    };
    const onVis = () => {
      docVisible = !document.hidden;
      if (docVisible) kick();
    };
    const onMQ = () => {
      reduced = !!(mqReduce && mqReduce.matches);
      kick();
    };
    const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver((entries) => {
      const e = entries[entries.length - 1];
      onScreen = !!e && e.isIntersecting;
      if (onScreen) kick();
    }, { rootMargin: "160px" }) : null;
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => resize()) : null;
    function kick() {
      if (running || destroyed || !onScreen || !docVisible) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
    function settled() {
      return Math.abs(tYaw - yaw) < 8e-4 && Math.abs(tPitch - pitch) < 8e-4 && Math.abs(vYaw) < 2e-3 && Math.abs(vPitch) < 2e-3 && Math.abs(attnT - attn) < 2e-3 && Math.abs(mouthT - mouth) < 2e-3 && pulseA <= 1e-3;
    }
    function tick(now) {
      if (!running) return;
      const dt = clamp((now - last) / 1e3, 0, 0.05);
      last = now;
      step(dt, now);
      draw();
      frames += 1;
      if (fixedQ === null && gl && !reduced && frames > 40) {
        perfAcc += dt;
        perfN += 1;
        if (perfN >= 45) {
          const avg = perfAcc / perfN;
          perfAcc = 0;
          perfN = 0;
          if (avg > 0.027 && quality > 0.45) {
            quality = Math.max(0.45, quality - 0.1);
            resize();
          }
        }
      }
      if (destroyed || !onScreen || !docVisible || reduced && settled()) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    }
    function step(dt, now) {
      t += dt;
      const motion = reduced ? 0 : 1;
      let ty = 0, tp = 0;
      attnT = 0;
      if (interactive && hasP && inside && now - lastMove < 3500) {
        const [hx, hy] = headCentre();
        const dx = pX - hx, dy = pY - hy;
        const D = Math.max(220, cssSize * 0.95);
        const k = reduced ? 0.6 : 1;
        ty = MAX_YAW * Math.tanh(dx / D) * k;
        tp = MAX_PITCH * Math.tanh(dy / D) * k;
        attnT = smooth(2.6, 1.1, Math.hypot(dx, dy) / Math.max(1, cssSize * fr.r));
      } else if (motion) {
        ty = 0.1 * Math.sin(t * 0.23) + 0.04 * Math.sin(t * 0.61 + 0.5);
        tp = 0.05 * Math.sin(t * 0.31 + 1);
      }
      if (state === "thinking") {
        ty = ty * 0.3 + 0.18;
        tp = tp * 0.3 - 0.17;
      }
      if (state === "speaking") tp += motion * 0.035 * Math.sin(t * 4.4) * (0.4 + mouth);
      tYaw = ty;
      tPitch = tp;
      const ks = reduced ? 26 : 34;
      const cs = 2 * Math.sqrt(ks) * (reduced ? 1 : 0.8);
      vYaw += ((ty - yaw) * ks - vYaw * cs) * dt;
      yaw += vYaw * dt;
      vPitch += ((tp - pitch) * ks - vPitch * cs) * dt;
      pitch += vPitch * dt;
      roll = -yaw * 0.12 + motion * 0.025 * Math.sin(t * 0.43);
      const gx = clamp((ty - yaw) / MAX_YAW, -1, 1) * 0.045 + ty / MAX_YAW * 0.02;
      const gy = -(clamp((tp - pitch) / MAX_PITCH, -1, 1) * 0.035 + tp / MAX_PITCH * 0.016);
      gazeX += (gx - gazeX) * ease(14, dt);
      gazeY += (gy - gazeY) * ease(14, dt);
      attn += (attnT - attn) * ease(5, dt);
      const think = state === "thinking" ? 1 : 0;
      browL += (attn * 0.022 + think * (0.03 + motion * 8e-3 * Math.sin(t * 2.1)) - browL) * ease(8, dt);
      browR += (attn * 0.022 - think * 4e-3 - browR) * ease(8, dt);
      if (motion) {
        if (blinkT < 0 && t >= nextBlink) blinkT = 0;
        if (blinkT >= 0) {
          blinkT += dt;
          const b = blinkT;
          blinkS = b < 0.07 ? 1 - b / 0.07 * 0.92 : b < 0.11 ? 0.08 : b < 0.24 ? 0.08 + (b - 0.11) / 0.13 * 0.92 : 1;
          if (b >= 0.24) {
            blinkT = -1;
            blinkS = 1;
            if (!doubleBlink && Math.random() < 0.18) {
              doubleBlink = true;
              nextBlink = t + 0.12;
            } else {
              doubleBlink = false;
              nextBlink = t + 2.6 + Math.random() * 3.6;
            }
          }
        }
      } else {
        blinkT = -1;
        blinkS = 1;
      }
      if (pulseA > 0) {
        pulseP = Math.min(1, pulseP + dt / 0.9);
        pulseA = Math.max(0, 1 - pulseP);
      }
      pvx *= Math.exp(-dt * 3);
      pvy *= Math.exp(-dt * 3);
      flow[0] = (flow[0] + pvx * dt * 35e-5 * motion) % 997;
      flow[1] = (flow[1] - pvy * dt * 35e-5 * motion) % 997;
      const stir = Math.min(1.2, Math.hypot(pvx, pvy) / 1800);
      const sMul = state === "thinking" ? 2.4 : state === "speaking" ? 1.5 : 1;
      tFlow = (tFlow + dt * motion * sMul * (1 + attn * 0.5 + stir)) % 3600;
      const ext = now - levelAt < 350;
      if (state === "speaking") {
        mouthT = ext ? extLevel : reduced ? 0.3 : 0.35 + 0.65 * Math.abs(Math.sin(t * 7.3) * Math.sin(t * 2.9 + 0.7));
      } else {
        mouthT = 0;
      }
      mouth += (mouthT - mouth) * ease(18, dt);
      bob = motion * Math.sin(t * Math.PI * 2 * 0.17);
    }
    function draw() {
      const cyBox = fr.cy - bob * fr.bob;
      const rot = rotation(yaw, pitch, roll);
      if (gl && prog) drawGL(gl, rot, cyBox);
      else if (c2 && off) draw2D(c2, off, cyBox);
      drawFace(rot, cyBox);
    }
    function drawGL(g, rot, cyBox) {
      const S = aur.width;
      g.viewport(0, 0, S, S);
      g.uniform2f(U.uC, S * fr.cx, S * (1 - cyBox));
      g.uniform1f(U.uR, S * fr.r);
      g.uniform1f(U.uFloor, S * (1 - fr.floor));
      g.uniform1f(U.uT, tFlow);
      g.uniformMatrix3fv(U.uRot, false, rot);
      const lx = -0.42 + 0.3 * (yaw / MAX_YAW);
      const ly = 0.62 - 0.22 * (pitch / MAX_PITCH);
      const ln = Math.hypot(lx, ly, 0.7);
      g.uniform3f(U.uL, lx / ln, ly / ln, 0.7 / ln);
      g.uniform1f(U.uDark, theme === "dark" ? 1 : 0);
      g.uniform1f(U.uPulse, pulseP);
      g.uniform1f(U.uPulseA, pulseA);
      g.uniform3f(U.uFlow, flow[0], flow[1], flow[2]);
      g.uniform1f(U.uAttn, attn);
      g.uniform1f(U.uLift, 0.5 + 0.5 * bob);
      g.uniform1f(U.uShadow, fr.shadow ? 1 : 0);
      g.clearColor(0, 0, 0, 0);
      g.clear(g.COLOR_BUFFER_BIT);
      g.drawArrays(g.TRIANGLES, 0, 3);
    }
    function draw2D(c, o, cyBox) {
      const S = aur.width;
      const cx = S * fr.cx, cy = S * cyBox, R = S * fr.r;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, S, S);
      if (fr.shadow && theme === "light") {
        const fy = S * fr.floor;
        const sg = c.createRadialGradient(cx, fy, 0, cx, fy, R * 0.75);
        sg.addColorStop(0, "rgba(77,71,133,0.16)");
        sg.addColorStop(1, "rgba(77,71,133,0)");
        c.save();
        c.translate(cx, fy);
        c.scale(1, 0.18);
        c.translate(-cx, -fy);
        c.fillStyle = sg;
        c.beginPath();
        c.arc(cx, fy, R * 0.75, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
      const ox = o.getContext("2d");
      if (!ox) return;
      ox.setTransform(1, 0, 0, 1, 0, 0);
      ox.globalCompositeOperation = "source-over";
      ox.clearRect(0, 0, S, S);
      const cols = [
        [79, 217, 245, 0.95],
        [148, 110, 250, 0.95],
        [105, 148, 255, 0.95],
        [235, 246, 255, 0.8]
      ];
      cols.forEach(([rr, gg, bb, aa], i) => {
        const a = tFlow * 0.35 * (i % 2 ? 1 : -1) + i * 1.7;
        const bx = cx + Math.cos(a) * R * 0.38 + yaw / MAX_YAW * R * 0.25;
        const by = cy + Math.sin(a * 1.3) * R * 0.34 + pitch / MAX_PITCH * R * 0.2;
        const gr = ox.createRadialGradient(bx, by, 0, bx, by, R * (i === 3 ? 0.45 : 0.95));
        gr.addColorStop(0, `rgba(${rr},${gg},${bb},${aa})`);
        gr.addColorStop(1, `rgba(${rr},${gg},${bb},0)`);
        ox.fillStyle = gr;
        ox.fillRect(0, 0, S, S);
      });
      ox.globalCompositeOperation = "destination-in";
      const m = ox.createRadialGradient(cx, cy, R * 0.72, cx, cy, R * 1.12);
      m.addColorStop(0, "rgba(0,0,0,0.95)");
      m.addColorStop(1, "rgba(0,0,0,0)");
      ox.fillStyle = m;
      ox.fillRect(0, 0, S, S);
      ox.globalCompositeOperation = "source-over";
      c.drawImage(o, 0, 0);
    }
    function drawFace(rot, cyBox) {
      if (!fctx) return;
      const S = fc.width;
      const k = S / 1e3;
      fctx.setTransform(1, 0, 0, 1, 0, 0);
      fctx.clearRect(0, 0, S, S);
      const cx = fr.cx * 1e3, cy = cyBox * 1e3, R = fr.r * 1e3;
      const small = clamp((240 - cssSize) / 180, 0, 1);
      const lw = 1 + 1.6 * small;
      const es = 1 + 0.35 * small;
      const proj = (v) => [cx + v[0] * R, cy - v[1] * R];
      const pt = (x, y) => proj(apply(rot, onSphere(x, y)));
      const strokes = [];
      const fills = [];
      const line = (n, f, w, fadeEnds = false) => {
        const p = new Path2D();
        let pen = false;
        for (let i = 0; i <= n; i += 1) {
          const [x, y] = f(i / n);
          const v = apply(rot, onSphere(x, y));
          if (v[2] < 0.03) {
            pen = false;
            continue;
          }
          const s = proj(v);
          if (pen) p.lineTo(s[0], s[1]);
          else p.moveTo(s[0], s[1]);
          pen = true;
        }
        const ends = fadeEnds ? [pt(...f(0)), pt(...f(1))] : void 0;
        strokes.push({ p, w: w * lw, fade: ends });
      };
      const oval = (ex, ey, rad, sy) => {
        const c = onSphere(ex, ey);
        const tx = norm3([c[2], 0, -c[0]]);
        const ty = cross(c, tx);
        const p = new Path2D();
        for (let i = 0; i <= 28; i += 1) {
          const a = i / 28 * Math.PI * 2;
          const ca = Math.cos(a) * rad, sa = Math.sin(a) * rad * sy;
          const s = proj(apply(rot, [c[0] + ca * tx[0] + sa * ty[0], c[1] + ca * tx[1] + sa * ty[1], c[2] + ca * tx[2] + sa * ty[2]]));
          if (i === 0) p.moveTo(s[0], s[1]);
          else p.lineTo(s[0], s[1]);
        }
        p.closePath();
        return p;
      };
      const phase = t * 9;
      const mouthLine = () => {
        line(28, (s) => [
          -0.09 + 0.18 * s,
          -0.28 - 0.013 * Math.sin(Math.PI * s) + mouth * 0.05 * Math.sin(Math.PI * 3 * s + phase) * Math.sin(Math.PI * s)
        ], 10.5);
      };
      if (face === "calm") {
        const er = 0.043 * (1 + 0.06 * attn) * es;
        fills.push(oval(-0.255 + gazeX, 0.05 + gazeY, er, blinkS), oval(0.255 + gazeX, 0.05 + gazeY, er, blinkS));
        line(16, (s) => [-0.15 - 0.21 * s, 0.245 + browL - 0.01 * s + 0.014 * Math.sin(Math.PI * s)], 11.5);
        line(16, (s) => [0.15 + 0.21 * s, 0.245 + browR - 0.01 * s + 0.014 * Math.sin(Math.PI * s)], 11.5);
        mouthLine();
      } else if (face === "horizon") {
        const er = 0.043 * (1 + 0.06 * attn) * es;
        fills.push(oval(-0.24 + gazeX, 0.06 + gazeY + browL * 0.5, er, blinkS), oval(0.24 + gazeX, 0.06 + gazeY + browR * 0.5, er, blinkS));
        line(72, (s) => {
          const x = -0.93 + 1.86 * s;
          return [x, -0.25 + mouth * 0.045 * Math.sin(x * 26 - phase) * Math.exp(-(x * x) / 0.05)];
        }, 6.5, true);
      } else {
        const rr = 0.056 * (1 + 0.06 * attn) * es;
        strokes.push({ p: oval(-0.255 + gazeX, 0.05 + gazeY + browL * 0.5, rr, blinkS), w: 8 * lw });
        strokes.push({ p: oval(0.255 + gazeX, 0.05 + gazeY + browR * 0.5, rr, blinkS), w: 8 * lw });
        mouthLine();
      }
      fctx.setTransform(k, 0, 0, k, 0, 0);
      fctx.lineCap = "round";
      fctx.lineJoin = "round";
      const passes = theme === "dark" ? [
        { rgb: "150,215,255", a: 0.55, blur: 34 },
        { rgb: "255,255,255", a: 0.95, blur: 10 },
        { rgb: "255,255,255", a: 1, blur: 0 }
      ] : [
        { rgb: "255,255,255", a: 0.85, blur: 28 },
        { rgb: "255,255,255", a: 1, blur: 8 },
        { rgb: "255,255,255", a: 1, blur: 0 }
      ];
      const glowK = k * (1 - 0.4 * small);
      for (const ps of passes) {
        const solid = `rgba(${ps.rgb},${ps.a})`;
        fctx.shadowColor = ps.blur > 0 ? solid : "rgba(0,0,0,0)";
        fctx.shadowBlur = ps.blur * glowK;
        fctx.fillStyle = solid;
        for (const st of strokes) {
          if (st.fade) {
            const [a0, a1] = st.fade;
            const gr = fctx.createLinearGradient(a0[0], a0[1], a1[0], a1[1]);
            gr.addColorStop(0, `rgba(${ps.rgb},0)`);
            gr.addColorStop(0.28, solid);
            gr.addColorStop(0.72, solid);
            gr.addColorStop(1, `rgba(${ps.rgb},0)`);
            fctx.strokeStyle = gr;
          } else {
            fctx.strokeStyle = solid;
          }
          fctx.lineWidth = st.w;
          fctx.stroke(st.p);
        }
        for (const f of fills) fctx.fill(f);
      }
      fctx.shadowBlur = 0;
      fctx.shadowColor = "rgba(0,0,0,0)";
    }
    function destroy() {
      if (destroyed) return;
      destroyed = true;
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onLeave);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", resize);
      if (io) io.disconnect();
      if (ro) ro.disconnect();
      if (mqReduce && typeof mqReduce.removeEventListener === "function") mqReduce.removeEventListener("change", onMQ);
      aur.removeEventListener("webglcontextlost", onLost, false);
      aur.removeEventListener("webglcontextrestored", onRestored, false);
      if (gl) {
        const lose = gl.getExtension("WEBGL_lose_context");
        if (prog) gl.deleteProgram(prog);
        if (vbo) gl.deleteBuffer(vbo);
        if (lose) lose.loseContext();
      }
      gl = null;
      prog = null;
      vbo = null;
      c2 = null;
      aur.remove();
      fc.remove();
    }
    if (interactive) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onDown, { passive: true });
      document.documentElement.addEventListener("mouseleave", onLeave);
      window.addEventListener("blur", onLeave);
    }
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("resize", resize);
    if (io) io.observe(host);
    if (ro) ro.observe(host);
    if (mqReduce && typeof mqReduce.addEventListener === "function") mqReduce.addEventListener("change", onMQ);
    resize();
    return {
      setTheme: (v) => {
        theme = v;
        kick();
      },
      setFace: (v) => {
        face = v;
        kick();
      },
      setState: (v) => {
        state = v;
        kick();
      },
      setLevel: (v) => {
        extLevel = clamp(v, 0, 1);
        levelAt = performance.now();
        kick();
      },
      destroy
    };
  }
  return __toCommonJS(engine_exports);
})();
