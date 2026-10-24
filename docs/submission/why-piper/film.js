/* Why Piper — 10-second motion graphic.
 * Choreography follows "Recipe A — scattered inputs become a clear outcome, 10 seconds" from
 * docs/submission/motion-graphics-from-scratch-claude.md:
 *   0.0–1.0 establish headline + three placed records · 1.0–2.4 records travel to one alignment (80 ms stagger)
 *   2.4–3.2 connecting line + short label · 3.2–5.0 hold · 5.0–6.0 shared shape expands into the result container
 *   6.0–6.8 result phrase, supporting objects settle · 6.8–10 resolved hold, ending on the Piper lockup.
 * Everything visible is derived from absolute time t (seconds): no timers, no accumulated state, exact seeks.
 * Edit points: COPY (index.html), TOKENS (film.css), T (times), G (geometry), LOGO (lockup size).
 */
(() => {
  "use strict";

  const FILM = { duration: 10, fps: 30 };

  // ---------- Easing: proper cubic-bezier solver (solve x for time, then evaluate y) ----------
  function cubicBezier(p1x, p1y, p2x, p2y) {
    const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
    const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    const solveX = (x) => {
      let t = x;
      for (let i = 0; i < 8; i++) {
        const e = sx(t) - x;
        if (Math.abs(e) < 1e-6) return t;
        const d = dx(t);
        if (Math.abs(d) < 1e-6) break;
        t -= e / d;
      }
      let lo = 0, hi = 1; t = x;
      while (hi - lo > 1e-7) {
        const e = sx(t);
        if (Math.abs(e - x) < 1e-6) return t;
        if (x > e) lo = t; else hi = t;
        t = (lo + hi) / 2;
      }
      return t;
    };
    return (x) => (x <= 0 ? 0 : x >= 1 ? 1 : sy(solveX(x)));
  }
  const EASE = {
    enter: cubicBezier(0.16, 1, 0.3, 1),
    travel: cubicBezier(0.65, 0, 0.35, 1),
    exit: cubicBezier(0.4, 0, 1, 1),
    linear: (x) => x,
  };
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const prog = (t, t0, dur, ease = EASE.enter) => ease(clamp01((t - t0) / dur));
  const lerp = (a, b, p) => a + (b - a) * p;

  // ---------- Beats (half-open intervals) and keyframe times, in seconds ----------
  const SCENES = [0, 2.4, 5.0, 7.4, 10];
  const STILLS = [0.95, 4.2, 7.0, 9.6]; // settled frame of each beat, used by reduced-motion playback
  const T = {
    ctxIn: 0.0, h1In: 0.05, illusIn: 0.3,
    marksIn: 0.4, markLabelsIn: 0.6,          // three records, 80 ms stagger
    travel: 1.0,                              // records travel into alignment, 80 ms stagger
    lineIn: 2.4, placeIn: 2.85, lPlaceIn: 3.0, // connecting line, then the short label
    h1Out: 4.85, h2In: 5.0, expand: 5.05,     // result container expands from the line
    nearIn: 5.9, lNearIn: 6.1, subIn: 6.2,    // supporting objects settle; result phrase
    marksOut: 7.4, lineTravel: 7.45, tailIn: 8.1, holesIn: 8.15, ratIn: 8.2, wordmarkIn: 8.4, taglineIn: 8.55, descIn: 8.65,
  };
  const DUR = { headIn: 0.5, headOut: 0.25, label: 0.3, mark: 0.35, draw: 0.7, travel: 1.0, expand: 0.9, exit: 0.3, stagger: 0.08 };

  // ---------- Geometry (design units, 1920 × 1080) ----------
  const G = {
    // records: scattered → aligned on the shared timeline
    D1: [{ x: 880, y: 500 }, { x: 940, y: 620 }],
    H: [{ x: 1300, y: 840 }, { x: 1220, y: 620 }],
    D2: [{ x: 1620, y: 560 }, { x: 1500, y: 620 }],
    labelDY: 52,                                           // mark labels sit below their mark
    P: { x: 780, y: 620 }, lPlace: { x: 780, y: 568 },      // place marker at the start of the line, label above
    axis: { x: 780, y: 620, len: 780, w: 3 },               // connecting line
    panel: { x: 660, y: 480, w: 1020, h: 400 },             // result container
    N: [{ x: 780, y: 790 }, { x: 1020, y: 790 }, { x: 1260, y: 790 }], NW: 220, NH: 44,
    lNearby: { x: 780, y: 758 },
    text: { x: 120, ctxY: 96, headY: 168, subY: 300, illusY: 976 },
    tagline: { x: 960, y: 744 }, descriptor: { x: 960, y: 812 },
  };

  // Lockup: same arithmetic as PiperLogo.tsx (width → height 0.44 w, svg height round(w·46/86), bottom-aligned).
  function lockupGeometry(W, cx, cy) {
    const H = Math.round(W * 0.44);
    const svgH = Math.round((W * 46) / 86);
    const s = Math.min(W / 86, svgH / 46);
    const xOff = (W - 86 * s) / 2;
    const left = Math.round(cx - W / 2), top = Math.round(cy - H / 2);
    const ux = (x) => left + xOff + (x - 14) * s;
    const uy = (y) => top + H - svgH + (y - 10) * s;
    // Tail path after CSS `translateX(2.8px) scaleX(0.9)`: x' = 2.8 + 0.9 x. Pipe is H from 66 to 97 at y = 50.
    return { W, H, svgH, s, left, top, fontSize: W * 0.2,
      pipe: { x1: ux(2.8 + 0.9 * 66), x2: ux(2.8 + 0.9 * 97), y: uy(50), w: 1.4 * s } };
  }
  const LOGO = lockupGeometry(720, 960, 500);
  const LOGO_SMALL = lockupGeometry(240, 1680, 150); // static summary only

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const stage = $("stage"), viewport = $("viewport");
  const el = {};
  ["panel", "axis2", "N1", "N2", "N3", "P", "D1", "H", "D2", "r2",
    "ctx", "h1", "h2", "sub", "staticMsg", "illus", "lPlace", "lRep1", "lClosed", "lRep2", "lNearby",
    "logo", "tagline", "descriptor"].forEach((id) => (el[id] = $(id)));

  const logoParts = (root) => ({
    root,
    body: root.querySelector(".piper-rat path:first-child"),
    eye: root.querySelector(".piper-eye"), nose: root.querySelector(".piper-nose"),
    tail: root.querySelector(".piper-tail"),
    holes: [".hole-1", ".hole-2", ".hole-3"].map((c) => root.querySelector(c)),
    wordmark: root.querySelector(".wordmark"),
  });
  function sizeLockup(root, geo) {
    root.style.left = geo.left + "px"; root.style.top = geo.top + "px";
    root.style.width = geo.W + "px"; root.style.height = geo.H + "px";
    const svg = root.querySelector("svg");
    svg.setAttribute("width", geo.W); svg.setAttribute("height", geo.svgH);
    root.querySelector(".wordmark").style.fontSize = geo.fontSize + "px";
  }
  sizeLockup(el.logo, LOGO);
  const logo = logoParts(el.logo);
  const logoSmallRoot = el.logo.cloneNode(true);
  logoSmallRoot.removeAttribute("id");
  logoSmallRoot.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
  sizeLockup(logoSmallRoot, LOGO_SMALL);
  stage.appendChild(logoSmallRoot);
  const logoSmall = logoParts(logoSmallRoot);

  const LEN = {}; // path lengths, measured once after fonts/layout
  const HOLE_DX = [-4.4, -5.3, -6.2];

  // ---------- Low-level setters (transform + opacity on DOM, dash reveal on SVG) ----------
  const setO = (node, o) => { node.style.opacity = o <= 0 ? "0" : o >= 1 ? "1" : o.toFixed(3); };
  const svgT = (node, str) => node.setAttribute("transform", str);
  const mark = (node, pos, o, s = 1, extra = "") =>
    { setO(node, o); svgT(node, `translate(${pos.x.toFixed(2)} ${pos.y.toFixed(2)}) scale(${s.toFixed(4)}) ${extra}`); };
  const reveal = (node, len, frac, fromEnd = false) => {
    const v = len * clamp01(frac);
    node.setAttribute("stroke-dasharray", `${len} ${len}`);
    node.setAttribute("stroke-dashoffset", fromEnd ? (v - len).toFixed(2) : (len - v).toFixed(2));
    setO(node, v > 0.5 ? 1 : 0);
  };
  const strip = (node, pos, w, h, o, s = 1) => {
    setO(node, o);
    svgT(node, `translate(${(pos.x + w / 2).toFixed(2)} ${(pos.y + h / 2).toFixed(2)}) scale(${s.toFixed(4)}) translate(${-w / 2} ${-h / 2})`);
  };
  const text = (node, x, y, o, dy = 0) => {
    setO(node, o);
    const anchor = node.dataset.anchor;
    const ax = anchor === "center" ? "-50%" : "0";
    const ay = anchor ? "-50%" : "0";
    node.style.transform = `translate(${x.toFixed(2)}px, ${(y + dy).toFixed(2)}px) translate(${ax}, ${ay})`;
  };
  // Entrance/exit envelope: opacity, vertical offset, scale.
  function env(t, tin, tout, { din = DUR.label, dout = DUR.exit, dy = 12, dyOut = -8, s0 = 1 } = {}) {
    const a = tin == null ? 1 : prog(t, tin, din, EASE.enter);
    const b = tout == null ? 0 : prog(t, tout, dout, EASE.exit);
    return { o: a * (1 - b), dy: dy * (1 - a) + dyOut * b, s: lerp(s0, 1, a) };
  }
  // Position along travel keys: pts[i] → pts[i+1] during moves[i] = {from, to}
  function track(t, pts, moves) {
    let x = pts[0].x, y = pts[0].y;
    for (let i = 0; i < moves.length; i++) {
      const m = moves[i];
      if (t <= m.from) break;
      const p = prog(t, m.from, m.to - m.from, EASE.travel);
      x = lerp(x, pts[i + 1].x, p); y = lerp(y, pts[i + 1].y, p);
      if (t < m.to) break;
    }
    return { x, y };
  }

  // ---------- The film: complete visible state at time t ----------
  function render(t) {
    const tx = G.text.x;
    const out = 1 - prog(t, T.marksOut, DUR.exit, EASE.exit); // everything but the line leaves before the logo

    // Context, headlines, result phrase, illustrative label
    { const e = env(t, T.ctxIn, T.marksOut); text(el.ctx, tx, G.text.ctxY, e.o, e.dy); }
    { const e = env(t, T.h1In, T.h1Out, { din: DUR.headIn, dout: DUR.headOut, dy: 24, dyOut: -16 }); text(el.h1, tx, G.text.headY, e.o, e.dy); }
    { const e = env(t, T.h2In, T.marksOut, { din: DUR.headIn, dout: DUR.headOut, dy: 24, dyOut: -16 }); text(el.h2, tx, G.text.headY, e.o, e.dy); }
    { const e = env(t, T.subIn, T.marksOut, { din: 0.5, dout: DUR.headOut, dy: 16, dyOut: -10 }); text(el.sub, tx, G.text.subY, e.o, e.dy); }
    { const e = env(t, T.illusIn, T.marksOut); text(el.illus, tx, G.text.illusY, e.o, e.dy); }
    text(el.staticMsg, tx, G.text.subY - 8, 1, 0);

    // Three records: placed apart, then travel along distinct paths into one alignment (80 ms stagger).
    const recs = [[el.D1, el.lRep1, G.D1, 0], [el.H, el.lClosed, G.H, 1], [el.D2, el.lRep2, G.D2, 2]];
    const pos = [];
    for (const [node, label, pts, i] of recs) {
      const p = track(t, pts, [{ from: T.travel + i * DUR.stagger, to: T.travel + i * DUR.stagger + DUR.travel }]);
      pos[i] = p;
      const e = env(t, T.marksIn + i * DUR.stagger, null, { din: DUR.mark, dy: 0, s0: 0.94 });
      mark(node, p, e.o * out, e.s);
      const le = env(t, T.markLabelsIn + i * DUR.stagger, T.marksOut);
      text(label, p.x, p.y + G.labelDY, le.o, le.dy);
    }
    // Coral ring: the report after the closure. Drawn once with the record, then carried with it.
    svgT(el.r2, `translate(${pos[2].x.toFixed(2)} ${pos[2].y.toFixed(2)}) rotate(-90)`);
    reveal(el.r2, LEN.r2, prog(t, T.marksIn + 2 * DUR.stagger + 0.1, 0.6));
    setO(el.r2, Math.min(+el.r2.style.opacity, out));

    // Place marker and its label: the short label that names the relationship
    { const e = env(t, T.placeIn, null, { din: DUR.mark, dy: 0, s0: 0.94 }); mark(el.P, G.P, e.o * out, e.s); }
    { const e = env(t, T.lPlaceIn, T.marksOut, { dy: -10 }); text(el.lPlace, G.lPlace.x, G.lPlace.y, e.o, e.dy); }

    // Result container: opens from the connecting line (scaleY from ≈0 at the line), records stay put.
    {
      const p = prog(t, T.expand, DUR.expand, EASE.travel), g = G.panel;
      const sy = lerp(0.006, 1, p), sx = lerp(G.axis.len / g.w, 1, p);
      svgT(el.panel, `translate(${G.axis.x + G.axis.len / 2} ${G.axis.y}) scale(${sx.toFixed(5)} ${sy.toFixed(5)}) translate(${-(G.axis.x + G.axis.len / 2)} ${-G.axis.y})`);
      setO(el.panel, prog(t, T.expand, 0.2, EASE.linear) * out);
    }
    // Supporting objects: nearby records settle beneath the timeline
    [el.N1, el.N2, el.N3].forEach((node, i) => {
      const e = env(t, T.nearIn + i * DUR.stagger, T.marksOut, { din: DUR.mark, dy: 0, s0: 0.96 });
      strip(node, G.N[i], G.NW, G.NH, e.o, e.s);
    });
    { const e = env(t, T.lNearIn, T.marksOut); text(el.lNearby, G.lNearby.x, G.lNearby.y, e.o, e.dy); }

    // Connecting line → logo pipe. One rect: drawn as the timeline, travels and thickens, covered by the coral tail.
    {
      const a = G.axis, pipe = LOGO.pipe, pipeLen = pipe.x2 - pipe.x1;
      const draw = prog(t, T.lineIn, DUR.draw);
      const tr = prog(t, T.lineTravel, 0.65, EASE.travel);
      const x = lerp(a.x, pipe.x1, tr), y = lerp(a.y, pipe.y, tr);
      const sx = lerp((a.len / pipeLen) * draw, 1, tr), sy = lerp(a.w / pipe.w, 1, tr);
      el.axis2.setAttribute("width", pipeLen.toFixed(2)); el.axis2.setAttribute("height", pipe.w.toFixed(2));
      svgT(el.axis2, `translate(${x.toFixed(2)} ${(y - (pipe.w * sy) / 2).toFixed(2)}) scale(${sx.toFixed(5)} ${sy.toFixed(5)})`);
      setO(el.axis2, draw > 0.01 ? 1 - prog(t, T.tailIn + 0.2, 0.2, EASE.exit) : 0);
    }

    // Ending: the lockup draws; the tail starts at the pipe end so the baseline continues without a cut
    renderLockup(logo, {
      tail: prog(t, T.tailIn, 0.65), holes: HOLE_DX.map((_, i) => prog(t, T.holesIn + i * DUR.stagger, 0.24)),
      body: prog(t, T.ratIn, 0.7), face: prog(t, T.ratIn + 0.5, 0.2, EASE.linear),
      wordmark: prog(t, T.wordmarkIn, 0.4), visible: t >= T.tailIn ? 1 : 0,
    });
    { const e = env(t, T.taglineIn, null, { din: 0.45, dy: 16 }); text(el.tagline, G.tagline.x, G.tagline.y, e.o, e.dy); }
    { const e = env(t, T.descIn, null, { din: 0.4, dy: 12 }); text(el.descriptor, G.descriptor.x, G.descriptor.y, e.o, e.dy); }
  }

  function renderLockup(L, st) {
    setO(L.root, st.visible);
    reveal(L.tail, LEN.tail, st.tail, true);
    L.holes.forEach((h, i) => { h.style.transform = `translateX(${HOLE_DX[i]}px) scale(${st.holes[i].toFixed(4)})`; setO(h, st.holes[i] > 0 ? 1 : 0); });
    reveal(L.body, LEN.body, st.body);
    setO(L.eye, st.face); setO(L.nose, st.face);
    setO(L.wordmark, st.wordmark); L.wordmark.style.transform = `translateY(${(8 * (1 - st.wordmark)).toFixed(2)}px)`;
  }

  // ---------- Modes ----------
  const params = new URLSearchParams(location.search);
  const isCapture = params.get("capture") === "1";
  const isStatic = params.get("static") === "1";
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let reducedMotion = prefersReduced;

  function sceneIndex(t) { for (let i = SCENES.length - 2; i >= 0; i--) if (t >= SCENES[i]) return i; return 0; }
  const quantize = (t) => STILLS[sceneIndex(Math.min(t, FILM.duration - 1e-6))];

  function renderStatic() {
    document.body.classList.add("static");
    render(STILLS[2]);
    setO(el.ctx, 1); el.ctx.style.transform = "translate(120px, 96px)";
    renderLockup(logoSmall, { tail: 1, holes: [1, 1, 1], body: 1, face: 1, wordmark: 1, visible: 1 });
  }

  // ---------- Playback clock ----------
  let current = 0, playing = false, wallStart = 0, tStart = 0, raf = 0;
  function draw(t) {
    current = Math.max(0, Math.min(FILM.duration, t));
    if (isStatic) { renderStatic(); } else { render(reducedMotion ? quantize(current) : current); setO(logoSmall.root, 0); }
    updateControls();
  }
  function tick() {
    if (!playing) return;
    const t = tStart + (performance.now() - wallStart) / 1000;
    if (t >= FILM.duration) { draw(FILM.duration); playing = false; updateControls(); return; }
    draw(t);
    raf = requestAnimationFrame(tick);
  }
  function play() {
    if (playing) return;
    if (current >= FILM.duration) current = 0;
    playing = true; wallStart = performance.now(); tStart = current;
    updateControls();
    raf = requestAnimationFrame(tick);
  }
  function pause() { playing = false; cancelAnimationFrame(raf); updateControls(); }
  function seek(seconds) { pause(); draw(Number(seconds) || 0); }
  function restart() { pause(); draw(0); play(); }
  function setReducedMotion(enabled) { reducedMotion = !!enabled; $("rmToggle").checked = reducedMotion; draw(current); }

  // ---------- Controls (outside the stage) ----------
  const btnPlay = $("btnPlay"), btnRestart = $("btnRestart"), scrub = $("scrub"), timeOut = $("time"), rmToggle = $("rmToggle");
  scrub.max = String(FILM.duration);
  function updateControls() {
    btnPlay.textContent = playing ? "Pause" : current >= FILM.duration ? "Replay" : "Play";
    btnPlay.setAttribute("aria-pressed", playing ? "true" : "false");
    if (document.activeElement !== scrub) scrub.value = current.toFixed(4);
    const f = Math.min(FILM.duration * FILM.fps - 1, Math.round(current * FILM.fps));
    const mm = String(Math.floor(current / 60)).padStart(2, "0"), ss = (current % 60).toFixed(2).padStart(5, "0");
    timeOut.textContent = `${mm}:${ss} · f ${f}`;
  }
  btnPlay.addEventListener("click", () => (playing ? pause() : play()));
  btnRestart.addEventListener("click", restart);
  scrub.addEventListener("input", () => seek(parseFloat(scrub.value)));
  rmToggle.addEventListener("change", () => setReducedMotion(rmToggle.checked));
  document.addEventListener("keydown", (e) => {
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "button" || tag === "textarea" || tag === "select" || tag === "a") return;
    if (e.key === " ") { e.preventDefault(); playing ? pause() : play(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); seek(current - (e.shiftKey ? 1 : 1 / FILM.fps)); }
    else if (e.key === "ArrowRight") { e.preventDefault(); seek(current + (e.shiftKey ? 1 : 1 / FILM.fps)); }
    else if (e.key === "Home") { e.preventDefault(); seek(0); }
    else if (e.key === "End") { e.preventDefault(); seek(FILM.duration); }
  });

  // ---------- Uniform stage scaling with letterboxing ----------
  function fit() {
    if (isCapture) return;
    const w = viewport.clientWidth, h = viewport.clientHeight;
    const s = Math.min(w / 1920, h / 1080);
    stage.style.transform = `translate(${((w - 1920 * s) / 2).toFixed(2)}px, ${((h - 1080 * s) / 2).toFixed(2)}px) scale(${s.toFixed(5)})`;
  }
  function layoutViewport() {
    if (isCapture) return;
    viewport.style.height = Math.max(300, window.innerHeight - $("controls").offsetHeight) + "px";
    fit();
  }
  window.addEventListener("resize", layoutViewport);
  if (isCapture) document.documentElement.classList.add("capture");

  // ---------- Ready: fonts, measurements, first frame ----------
  const ready = (async () => {
    const faces = ['700 100px "Atkinson Hyperlegible Next"', '500 38px "Atkinson Hyperlegible Next"', '600 60px "Atkinson Hyperlegible Next"', 'italic 600 144px "Fraunces"'];
    try { await Promise.all(faces.map((f) => document.fonts.load(f))); await document.fonts.ready; } catch (_) { /* fall back to system fonts */ }
    LEN.r2 = el.r2.getTotalLength();
    LEN.tail = logo.tail.getTotalLength();
    LEN.body = logo.body.getTotalLength();
    layoutViewport();
    const t0 = params.has("t") ? parseFloat(params.get("t")) || 0 : 0;
    draw(t0);
    rmToggle.checked = reducedMotion;
    const autoplay = !isCapture && !isStatic && !params.has("t") && !prefersReduced;
    if (prefersReduced && !isStatic && !isCapture && !params.has("t")) {
      location.replace("?static=1"); // reduced motion defaults to the static summary; Play then runs still scenes
    }
    if (autoplay) play();
    return true;
  })();

  window.piperFilm = {
    duration: FILM.duration, fps: FILM.fps, ready,
    seek, play, pause, restart, setReducedMotion,
    get time() { return current; }, get playing() { return playing; },
    scenes: SCENES, stills: STILLS, logo: LOGO,
  };
})();
