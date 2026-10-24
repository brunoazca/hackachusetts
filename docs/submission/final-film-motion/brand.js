/* Piper brand geometry for the film: the LineRat mark, the lockup arithmetic of PiperLogo.tsx / PiperLogo.css,
 * the neutral place marker, and the decorative rat silhouette. Paths are copied from web/src/components/brand/. */
(function (root) {
  "use strict";
  const M = root.PiperMotion;

  // LineRat.tsx — viewBox 14 10 86 46, pipe at y = 50, holes at x = 72 / 81 / 90 (r 2.1).
  const RAT_BODY = "M46 43 Q35 45 28 40 C24 36 28 24 38 20 C35 16 38 12 42 14 C46 16 45 20 42 22 C48 18 54 21 61 24 C55 27 51 28 48 31 C45 34 45 37 49 37";
  const RAT_EYE = "M50.5 25 h0", RAT_NOSE = "M61 24 h0";
  const TAIL = "M28 40 C20 42 19 46 28 48 C37 50 49 50 66 50 H97";
  const PIPE_LEN_USER = 31; // the straight H segment 66 → 97
  const HOLES = [72, 81, 90], HOLE_DX = [-4.4, -5.3, -6.2]; // PiperLogo.css moves the holes with the shortened pipe
  // Neutral outlined location mark, local coordinates: head centred at (0, −6), tip at (0, 28).
  const PIN = "M0 28 C-13 12 -19 3 -19 -6 A19 19 0 1 1 19 -6 C19 3 13 12 0 28 Z";

  // PiperLogo.tsx: wrapper width W → height round(0.44 W); svg bottom-aligned, height round(W·46/86); wordmark
  // font-size 0.2 W, right edge at ((100 − 90.1)/86) of W, bottom at 30 %. Tail CSS: translateX(2.8px) scaleX(0.9).
  function lockupGeometry(W, cx, top) {
    const H = Math.round(W * 0.44), svgH = Math.round((W * 46) / 86);
    const s = Math.min(W / 86, svgH / 46), xOff = (W - 86 * s) / 2;
    const left = Math.round(cx - W / 2);
    const ux = (x) => left + xOff + (x - 14) * s, uy = (y) => top + H - svgH + (y - 10) * s;
    return {
      W, H, svgH, s, left, top, bottom: top + H, cx, fontSize: W * 0.2,
      pipe: { x1: ux(2.8 + 0.9 * 66), x2: ux(2.8 + 0.9 * 97), y: uy(50), w: 1.4 * s },
    };
  }

  function buildLockup(parent, geo) {
    const el = document.createElement("span"); el.className = "lockup";
    el.innerHTML =
      `<svg viewBox="14 10 86 46" width="${geo.W}" height="${geo.svgH}">` +
      `<g class="piper-rat"><path class="rat-body" d="${RAT_BODY}"/><path class="piper-eye" d="${RAT_EYE}"/><path class="piper-nose" d="${RAT_NOSE}"/></g>` +
      `<g class="accent-group"><path class="piper-tail" d="${TAIL}"/>` +
      HOLES.map((x, i) => `<circle class="hole hole-${i + 1}" cx="${x}" cy="50" r="2.1"/>`).join("") +
      `</g></svg><span class="wordmark">Piper</span>`;
    el.style.left = geo.left + "px"; el.style.top = geo.top + "px"; el.style.width = geo.W + "px"; el.style.height = geo.H + "px";
    const wordmark = el.querySelector(".wordmark"); wordmark.style.fontSize = geo.fontSize + "px";
    parent.appendChild(el);
    return {
      root: el, geo, len: {}, pipeFrac: 0,
      body: el.querySelector(".rat-body"), eye: el.querySelector(".piper-eye"), nose: el.querySelector(".piper-nose"),
      tail: el.querySelector(".piper-tail"), holes: Array.from(el.querySelectorAll(".hole")), wordmark,
    };
  }
  function measureLockup(L) { L.len.tail = L.tail.getTotalLength(); L.len.body = L.body.getTotalLength(); L.pipeFrac = PIPE_LEN_USER / L.len.tail; }

  // st: { visible, tail 0..1 (revealed from the pipe end backwards), body 0..1, face 0..1, holes [scale×3], wordmark {o, dy} }
  function renderLockup(L, st) {
    M.setO(L.root, st.visible ? 1 : 0);
    M.reveal(L.tail, L.len.tail, st.tail, true);
    M.reveal(L.body, L.len.body, st.body);
    M.setO(L.eye, st.face); M.setO(L.nose, st.face);
    L.holes.forEach((h, i) => {
      const s = Math.max(0, st.holes[i]);
      h.style.transform = `translateX(${HOLE_DX[i]}px) scale(${s.toFixed(4)})`;
      M.setO(h, s > 0.001 ? 1 : 0);
    });
    M.setO(L.wordmark, st.wordmark.o);
    L.wordmark.style.transform = `translateY(${st.wordmark.dy.toFixed(2)}px)`;
  }

  function makePin(parent) {
    const g = M.svgEl("g", { class: "pin" }, parent);
    M.svgEl("path", { d: PIN }, g);
    M.svgEl("circle", { cx: 0, cy: -6, r: 5, class: "pin-dot" }, g);
    return g;
  }
  // Decorative silhouette: the brand rat outline only (no tail/pipe), drawn as a line.
  function makeRat(parent) {
    const g = M.svgEl("g", { class: "rat" }, parent);
    const body = M.svgEl("path", { d: RAT_BODY, class: "rat-body" }, g);
    const eye = M.svgEl("path", { d: RAT_EYE, class: "rat-face" }, g);
    const nose = M.svgEl("path", { d: RAT_NOSE, class: "rat-face" }, g);
    return { g, body, eye, nose };
  }

  root.PiperBrand = { RAT_BODY, TAIL, HOLES, HOLE_DX, PIN, lockupGeometry, buildLockup, measureLockup, renderLockup, makePin, makeRat };
})(window);
