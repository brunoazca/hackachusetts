/* Piper final-film motion — player, gallery and the window.piperMotion API.
 * Deterministic: seek(s) renders the complete state at s; play() only advances a clock and calls the same render. */
(function () {
  "use strict";
  const C = window.PIPER_CONFIG, M = window.PiperMotion, B = window.PiperBrand;
  const FPS = C.fps;
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const isCapture = params.get("capture") === "1";
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let reducedMotion = isCapture ? false : prefersReduced; // capture always renders the full-motion film

  const stage = $("stage"), viewport = $("viewport");
  const ORDER = ["opening", "bridge", "closing"];
  const clips = {};
  for (const id of ORDER) {
    const el = document.createElement("div"); el.className = "clip"; el.id = "clip-" + id; stage.appendChild(el);
    clips[id] = window.PiperClips[id](el, C, M, B); clips[id].root = el;
  }

  let active = null, current = 0, playing = false, wallStart = 0, tStart = 0, raf = 0;

  // Reduced motion: the film as still scenes (cuts, no motion).
  function quantize(clip, t) {
    const last = Math.min(t, clip.duration - 1e-6) * FPS;
    for (let i = clip.scenes.length - 2; i >= 0; i--) if (last >= clip.scenes[i]) return clip.stills[i] / FPS;
    return clip.stills[0] / FPS;
  }
  function draw(t) {
    current = Math.max(0, Math.min(active.duration, Number(t) || 0));
    active.render(reducedMotion ? quantize(active, current) : current);
    updateControls();
  }
  function tick() {
    if (!playing) return;
    const t = tStart + (performance.now() - wallStart) / 1000;
    if (t >= active.duration) { draw(active.duration); playing = false; updateControls(); return; }
    draw(t); raf = requestAnimationFrame(tick);
  }
  function play() { if (playing) return; if (current >= active.duration) current = 0; playing = true; wallStart = performance.now(); tStart = current; updateControls(); raf = requestAnimationFrame(tick); }
  function pause() { playing = false; cancelAnimationFrame(raf); updateControls(); }
  function seek(seconds) { pause(); draw(seconds); }
  function restart() { pause(); draw(0); play(); }
  function setReducedMotion(on) { reducedMotion = !!on; rmToggle.checked = reducedMotion; draw(current); }
  function selectClip(id) {
    if (!clips[id]) throw new Error("unknown clip " + id);
    pause(); active = clips[id];
    for (const k of ORDER) clips[k].root.style.display = k === id ? "block" : "none";
    scrub.max = String(active.duration);
    clipButtons.forEach((b) => b.setAttribute("aria-pressed", b.dataset.clip === id ? "true" : "false"));
    info.textContent = `${active.frames} frames · 30 fps · film ${active.insertAt}`;
    if (!isCapture) { const u = new URL(location.href); u.searchParams.set("clip", id); u.searchParams.delete("t"); history.replaceState(null, "", u); }
    draw(0);
  }

  // ---------- Controls ----------
  const btnPlay = $("btnPlay"), btnRestart = $("btnRestart"), scrub = $("scrub"), timeOut = $("time"), rmToggle = $("rmToggle"), info = $("info");
  const clipButtons = Array.from(document.querySelectorAll("#clipButtons button"));
  function updateControls() {
    if (!active) return;
    btnPlay.textContent = playing ? "Pause" : current >= active.duration ? "Replay" : "Play";
    btnPlay.setAttribute("aria-pressed", playing ? "true" : "false");
    if (document.activeElement !== scrub) scrub.value = current.toFixed(4);
    const f = Math.min(active.frames - 1, Math.round(current * FPS));
    const mm = String(Math.floor(current / 60)).padStart(2, "0"), ss = (current % 60).toFixed(3).padStart(6, "0");
    timeOut.textContent = `${mm}:${ss} · f ${f} / ${active.frames}`;
  }
  btnPlay.addEventListener("click", () => (playing ? pause() : play()));
  btnRestart.addEventListener("click", restart);
  scrub.addEventListener("input", () => seek(parseFloat(scrub.value)));
  rmToggle.addEventListener("change", () => setReducedMotion(rmToggle.checked));
  clipButtons.forEach((b) => b.addEventListener("click", () => selectClip(b.dataset.clip)));
  document.addEventListener("keydown", (e) => {
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "button" || tag === "textarea" || tag === "select" || tag === "a") return;
    if (e.key === " ") { e.preventDefault(); playing ? pause() : play(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); seek(current - (e.shiftKey ? 1 : 1 / FPS)); }
    else if (e.key === "ArrowRight") { e.preventDefault(); seek(current + (e.shiftKey ? 1 : 1 / FPS)); }
    else if (e.key === "Home") { e.preventDefault(); seek(0); }
    else if (e.key === "End") { e.preventDefault(); seek(active.duration - 1 / FPS); }
    else if (e.key === "1" || e.key === "2" || e.key === "3") { e.preventDefault(); selectClip(ORDER[Number(e.key) - 1]); }
  });

  // ---------- Uniform stage scaling with letterboxing ----------
  function fit() {
    if (isCapture) return;
    const w = viewport.clientWidth, h = viewport.clientHeight, s = Math.min(w / 1920, h / 1080);
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
    const faces = ['700 148px "Atkinson Hyperlegible Next"', '700 112px "Atkinson Hyperlegible Next"', '600 38px "Atkinson Hyperlegible Next"', '600 30px "Atkinson Hyperlegible Next"', 'italic 600 148px "Fraunces"'];
    await Promise.all(faces.map((f) => document.fonts.load(f)));
    await document.fonts.ready;
    const ok = faces.every((f) => document.fonts.check(f));
    if (!ok) console.error("brand fonts did not load");
    for (const id of ORDER) clips[id].root.style.display = "block"; // measure while rendered
    for (const id of ORDER) clips[id].measure();
    selectClip(ORDER.includes(params.get("clip")) ? params.get("clip") : "opening");
    layoutViewport();
    rmToggle.checked = reducedMotion;
    const t0 = params.has("t") ? parseFloat(params.get("t")) || 0 : 0;
    draw(t0);
    if (!isCapture && !params.has("t") && !prefersReduced) play();
    return { fontsLoaded: ok };
  })();

  window.piperMotion = {
    ready, fps: FPS, clips: ORDER, config: C,
    get clip() { return active ? active.id : null; },
    get duration() { return active ? active.duration : 0; },
    get frames() { return active ? active.frames : 0; },
    get time() { return current; }, get playing() { return playing; }, get reducedMotion() { return reducedMotion; },
    selectClip, seek, play, pause, restart, setReducedMotion,
    springs: M.springs(C.springs),
    logo: { opening: clips.opening.logo, closing: clips.closing.logo },
  };
})();
