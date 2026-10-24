/* Piper final-film motion — shared helpers. Every function maps absolute clip time to a state; nothing accumulates. */
(function (root) {
  "use strict";

  const FPS = 30;
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const lerp = (a, b, p) => a + (b - a) * p;
  const f2t = (f) => f / FPS;

  // ---------- Closed-form damped oscillator: unit step response, x(0) = 0, v(0) = 0 ----------
  // omega: natural frequency (rad/s); zeta: damping ratio. Clamped to exactly 1 once |x − 1| stays under eps.
  function makeSpring(spec, eps = 0.0005) {
    const { omega, zeta } = spec;
    let raw;
    if (zeta < 1) {
      const wd = omega * Math.sqrt(1 - zeta * zeta), k = (zeta * omega) / wd;
      raw = (t) => 1 - Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + k * Math.sin(wd * t));
    } else if (zeta === 1) {
      raw = (t) => 1 - Math.exp(-omega * t) * (1 + omega * t);
    } else {
      const r = Math.sqrt(zeta * zeta - 1), s1 = -omega * (zeta - r), s2 = -omega * (zeta + r);
      raw = (t) => 1 - (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s2 - s1);
    }
    const step = 1 / 600;
    let settle = 0;
    for (let t = 4; t >= 0; t -= step) { if (Math.abs(raw(t) - 1) >= eps) { settle = t + step; break; } }
    let peak = 1;
    for (let t = 0; t < settle; t += step) peak = Math.max(peak, raw(t));
    const fn = (t) => (t <= 0 ? 0 : t >= settle ? 1 : raw(t));
    fn.settle = settle; fn.overshoot = peak - 1; fn.spec = spec;
    return fn;
  }
  function springs(map) { const out = {}; for (const k in map) out[k] = makeSpring(map[k]); return out; }

  // ---------- Easing (true cubic-bezier solve) for monotonic effects ----------
  function cubicBezier(p1x, p1y, p2x, p2y) {
    const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
    const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t, sy = (t) => ((ay * t + by) * t + cy) * t, dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    const solveX = (x) => {
      let t = x;
      for (let i = 0; i < 8; i++) { const e = sx(t) - x; if (Math.abs(e) < 1e-6) return t; const d = dx(t); if (Math.abs(d) < 1e-6) break; t -= e / d; }
      let lo = 0, hi = 1; t = x;
      while (hi - lo > 1e-7) { const e = sx(t); if (Math.abs(e - x) < 1e-6) return t; if (x > e) lo = t; else hi = t; t = (lo + hi) / 2; }
      return t;
    };
    return (x) => (x <= 0 ? 0 : x >= 1 ? 1 : sy(solveX(x)));
  }
  const EASE = { out: cubicBezier(0.16, 1, 0.3, 1), inOut: cubicBezier(0.65, 0, 0.35, 1), in: cubicBezier(0.4, 0, 1, 1), linear: (x) => x };
  const prog = (t, t0, dur, ease = EASE.out) => ease(clamp01((t - t0) / dur));
  const fprog = (t, f0, frames, ease = EASE.out) => prog(t, f2t(f0), f2t(frames), ease);
  const spr = (S, t, f0) => S(t - f2t(f0));
  const fade = (t, f0, frames = 6) => fprog(t, f0, frames, EASE.linear);

  // ---------- Envelopes ----------
  // Text: opacity ramps monotonically over oFrames; vertical travel is critically damped (textSettle).
  function textIn(t, f0, S, dy = 32, oFrames = 8) { if (f0 == null) return { o: 1, dy: 0 }; return { o: fprog(t, f0, oFrames, EASE.out), dy: dy * (1 - spr(S, t, f0)) }; }
  function textOut(t, f0, frames = 7, dy = -24) { if (f0 == null) return { o: 1, dy: 0 }; const p = fprog(t, f0, frames, EASE.in); return { o: 1 - p, dy: dy * p }; }
  function textEnv(t, fIn, fOut, S, o = {}) { const a = textIn(t, fIn, S, o.dy, o.oFrames), b = textOut(t, fOut, o.outFrames, o.outDy); return { o: a.o * b.o, dy: a.dy + b.dy }; }
  // Shapes: scale springs from s0 to 1; opacity ramps monotonically; exits accelerate and shrink slightly.
  function shapeIn(t, f0, S, s0 = 0.92, oFrames = 4) { if (f0 == null) return { o: 1, s: 1 }; const x = spr(S, t, f0); return { o: fprog(t, f0, oFrames, EASE.linear), s: s0 + (1 - s0) * x }; }
  function shapeOut(t, f0, frames = 7, s1 = 0.9) { if (f0 == null) return { o: 1, s: 1 }; const p = fprog(t, f0, frames, EASE.in); return { o: 1 - p, s: 1 + (s1 - 1) * p }; }
  function shapeEnv(t, fIn, fOut, S, o = {}) { const a = shapeIn(t, fIn, S, o.s0, o.oFrames), b = shapeOut(t, fOut, o.outFrames, o.s1); return { o: a.o * b.o, s: a.s * b.s }; }

  // ---------- Color (linear mix; never sprung) ----------
  function parseColor(c) {
    if (c[0] === "#") return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
    const m = c.match(/[\d.]+/g); return m.slice(0, 3).map(Number);
  }
  function mixColor(a, b, p) { const A = parseColor(a), B = parseColor(b), q = clamp01(p); return "rgb(" + A.map((v, i) => Math.round(lerp(v, B[i], q))).join(",") + ")"; }

  // ---------- DOM (browser only) ----------
  const NS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs = {}, parent) { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; }
  const setO = (n, o) => { n.style.opacity = o <= 0 ? "0" : o >= 1 ? "1" : o.toFixed(4); };
  const svgT = (n, s) => n.setAttribute("transform", s);
  // Path-length-aware reveal. At 1 the dash attributes are removed so later geometry changes cannot leave gaps.
  function reveal(n, len, frac, fromEnd = false) {
    const f = clamp01(frac);
    if (f >= 1) { n.removeAttribute("stroke-dasharray"); n.removeAttribute("stroke-dashoffset"); setO(n, 1); return; }
    if (f <= 0) { setO(n, 0); return; }
    const v = len * f;
    n.setAttribute("stroke-dasharray", `${len} ${len}`);
    n.setAttribute("stroke-dashoffset", (fromEnd ? v - len : len - v).toFixed(3));
    setO(n, 1);
  }
  const ANCHOR_T = { tl: "", c: " translate(-50%, -50%)", tr: " translate(-100%, 0)", lm: " translate(0, -50%)", rm: " translate(-100%, -50%)", tc: " translate(-50%, 0)" };
  function makeText(parent, cls, content, anchor = "tl") { const n = document.createElement("p"); n.className = "txt " + cls; n.textContent = content; n.dataset.anchor = anchor; parent.appendChild(n); return n; }
  function placeText(n, x, y, o, dy = 0) { setO(n, o); n.style.transform = `translate(${x.toFixed(2)}px, ${(y + dy).toFixed(2)}px)` + ANCHOR_T[n.dataset.anchor || "tl"]; }
  // Masked line: a fixed clipping box with glyph clearance (ascenders 48 px, descenders 18 px); the text moves inside it.
  function makeMasked(parent, cls, content, x, y, w, h) {
    const padT = 48, padB = 18, padX = 24;
    const wrap = document.createElement("div"); wrap.className = "mask";
    wrap.style.cssText = `left:${x - padX}px;top:${y - padT}px;width:${w + 2 * padX}px;height:${h + padT + padB}px`;
    const n = document.createElement("p"); n.className = "txt " + cls; n.textContent = content;
    n.style.left = padX + "px"; n.style.top = padT + "px";
    wrap.appendChild(n); parent.appendChild(wrap); return n;
  }
  function placeMasked(n, o, dy) { setO(n, o); n.style.transform = `translateY(${dy.toFixed(2)}px)`; }
  function measureText(font, text) { const c = measureText.c || (measureText.c = document.createElement("canvas").getContext("2d")); c.font = font; return c.measureText(text).width; }

  const api = { FPS, clamp01, lerp, f2t, makeSpring, springs, cubicBezier, EASE, prog, fprog, spr, fade, textIn, textOut, textEnv, shapeIn, shapeOut, shapeEnv, mixColor, svgEl, setO, svgT, reveal, makeText, placeText, makeMasked, placeMasked, measureText };
  root.PiperMotion = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
