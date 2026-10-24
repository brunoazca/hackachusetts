/* Clip 3 — Closing, 8 s / 240 frames. Film time 2:50–2:58.
 * The place marker and a short organizing line; the line becomes the pipe of the Piper logo; the wordmark,
 * "Follow the rats." and "Evidence for the next inspection." settle. Pixel-still from frame 120 to 239. */
(function (root) {
  "use strict";
  root.PiperClips = root.PiperClips || {};

  root.PiperClips.closing = function build(clipRoot, C, M, B) {
    const K = C.closing, E = K.ev, G = K.geo, COL = C.colors, CP = C.copy, A = C.anchor;
    const S = M.springs(C.springs);
    const { f2t, fprog, spr, EASE, lerp, svgEl, setO, svgT, mixColor, makeText, placeText, shapeOut, textIn } = M;
    const LOGO = B.lockupGeometry(G.lockup.W, G.lockup.cx, G.lockup.top);

    const svg = svgEl("svg", { class: "diagram", viewBox: "0 0 1920 1080" }, clipRoot);
    const line = svgEl("line", { "stroke-linecap": "round" }, svg);
    const pin = B.makePin(svg);
    const L = B.buildLockup(clipRoot, LOGO);
    const tagline = makeText(clipRoot, "tagline", CP.tagline, "tc");
    const support = makeText(clipRoot, "support-closing", CP.support, "tc");
    const footer = C.footerUrl ? makeText(clipRoot, "footer", C.footerUrl, "tc") : null;

    function measure() { B.measureLockup(L); }
    const span = (r) => r[1] - r[0];

    function render(t) {
      // The thread: a short line under the place, extending toward the logo pipe while the marker diminishes.
      const ext = fprog(t, E.extend[0], span(E.extend), EASE.out);
      const y0 = A.y + G.line.dy;
      let lx1 = lerp(G.line.x1, LOGO.pipe.x1, ext), lx2 = lerp(G.line.x2, LOGO.pipe.x2, ext), ly = y0, lw = G.line.w, lcol = COL.edge;
      const m = spr(S.heavyResolve, t, E.lineToPipe);
      ly = lerp(ly, LOGO.pipe.y, m); lw = lerp(lw, LOGO.pipe.w, m); lcol = mixColor(lcol, COL.coral, m);
      const tailP = fprog(t, E.tail[0], span(E.tail));
      const handoff = M.clamp01((tailP - L.pipeFrac) / 0.12);
      line.setAttribute("x1", lx1.toFixed(2)); line.setAttribute("x2", lx2.toFixed(2));
      line.setAttribute("y1", ly.toFixed(2)); line.setAttribute("y2", ly.toFixed(2));
      line.setAttribute("stroke", lcol); line.setAttribute("stroke-width", lw.toFixed(2));
      setO(line, 1 - handoff);

      { const e = shapeOut(t, E.pinOut[0], span(E.pinOut), 0.6); svgT(pin, `translate(${A.x} ${A.y}) scale(${e.s.toFixed(4)})`); setO(pin, e.o); }

      B.renderLockup(L, {
        visible: t >= f2t(E.tail[0]),
        tail: tailP,
        body: fprog(t, E.body[0], span(E.body)),
        face: fprog(t, E.face[0], span(E.face), EASE.linear),
        holes: [0, 1, 2].map((i) => { const x = spr(S.smallPop, t, E.holes + i * E.holeStagger); return x <= 0 ? 0 : 0.7 + 0.3 * x; }),
        wordmark: textIn(t, E.wordmark, S.textSettle, 24, 8),
      });
      { const e = textIn(t, E.tagline, S.textSettle, 24, 8); placeText(tagline, 960, LOGO.bottom + G.taglineDY, e.o, e.dy); }
      { const e = textIn(t, E.support, S.textSettle, 24, 8); placeText(support, 960, LOGO.bottom + G.supportDY, e.o, e.dy); }
      if (footer) { const e = textIn(t, E.support, S.textSettle, 24, 8); placeText(footer, 960, LOGO.bottom + G.footerDY, e.o, e.dy); }
    }

    return { id: K.id, duration: K.duration, frames: K.frames, fps: C.fps, insertAt: K.insertAt, scenes: K.scenes, stills: K.stills, measure, render, logo: LOGO };
  };
})(window);
