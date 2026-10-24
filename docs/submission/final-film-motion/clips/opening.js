/* Clip 1 — Opening, 14 s / 420 frames. Film time 0:00–0:14.
 * One line carries the story: a record line (report · closed · reported again) → the piper's pipe before a
 * storybook town → the line that groups records around one place in a modern grid → the pipe of the Piper logo.
 * Everything below is a pure function of clip time t. Edit points: config.js (opening.ev, opening.geo, copy). */
(function (root) {
  "use strict";
  root.PiperClips = root.PiperClips || {};

  root.PiperClips.opening = function build(clipRoot, C, M, B) {
    const K = C.opening, E = K.ev, G = K.geo, TX = C.text, COL = C.colors, CP = C.copy;
    const S = M.springs(C.springs);
    const { f2t, fprog, spr, EASE, lerp, svgEl, setO, svgT, reveal, mixColor, makeText, placeText, makeMasked, placeMasked, shapeEnv, shapeOut, textEnv, textIn } = M;
    const LOGO = B.lockupGeometry(G.lockup.W, G.lockup.cx, G.lockup.top);
    const LG = G.legend, REC = G.record, EV = G.evidence;

    // ---------- Geometry (SVG) ----------
    const svg = svgEl("svg", { class: "diagram", viewBox: "0 0 1920 1080" }, clipRoot);
    const cam = svgEl("g", { class: "camera" }, svg); // legend group: town, grid, pipe/line, holes, rats
    const gridExtra = svgEl("path", { class: "town", fill: "none", "stroke-width": LG.townWidth, d: `M${LG.gridExtra[0]} L${LG.gridExtra[1]}` }, cam);
    const town = LG.town.map(() => svgEl("path", { class: "town", fill: "none", "stroke-width": LG.townWidth }, cam));
    const rats = LG.rats.map(() => B.makeRat(cam));
    const line = svgEl("line", { "stroke-linecap": "round" }, cam); // THE line
    const holes = LG.holes.map(() => svgEl("circle", { r: LG.holeR, "stroke-width": 4, fill: COL.bg, stroke: COL.coral }, cam));

    const dot1 = svgEl("circle", { r: REC.markR, fill: COL.fg }, svg);
    const hollow = svgEl("circle", { r: REC.markR, fill: COL.bg, stroke: COL.fg, "stroke-width": 4 }, svg);
    const dot2 = svgEl("circle", { r: REC.markR, fill: COL.fg }, svg);
    const ring = svgEl("circle", { r: REC.ringR, fill: "none", stroke: COL.coral, "stroke-width": 4 }, svg);

    const pin = B.makePin(svg);
    const eDot = svgEl("circle", { r: EV.markR, fill: COL.fg }, svg);
    const eHollow = svgEl("circle", { r: EV.markR, fill: COL.bg, stroke: COL.fg, "stroke-width": 4 }, svg);
    const hs = EV.squareSize;
    const eSquare = svgEl("rect", { x: -hs / 2, y: -hs / 2, width: hs, height: hs, rx: 3, fill: COL.bg, stroke: COL.fg, "stroke-width": 4 }, svg);
    const tick = svgEl("line", { stroke: COL.edge, "stroke-width": 4, "stroke-linecap": "round" }, svg);

    // ---------- Text ----------
    const h1 = makeMasked(clipRoot, "hook", CP.hook1, TX.x, TX.headY, 1500, C.type.hook);
    const h2 = makeMasked(clipRoot, "hook", CP.hook2, TX.x, TX.headY, 1500, C.type.hook);
    const h3 = makeMasked(clipRoot, "phrase", CP.legend, TX.x, TX.headY, 1500, C.type.phrase);
    const h4 = makeMasked(clipRoot, "phrase", CP.purpose, TX.x, TX.headY, 1500, C.type.phrase);
    const lReport = makeText(clipRoot, "label", CP.lReport, "tc");
    const lClosed = makeText(clipRoot, "label", CP.lClosed, "tc");
    const lNew = makeText(clipRoot, "label", CP.lNew, "tc");
    const illus = makeText(clipRoot, "illus", CP.illustrative, "lm");
    const tagLegend = makeText(clipRoot, "eyebrow", CP.tagLegend, "tr");
    const tagBoston = makeText(clipRoot, "eyebrow", CP.tagBoston, "tr");
    const support = makeText(clipRoot, "support", CP.support, "tc");
    const L = B.buildLockup(clipRoot, LOGO);

    const LEN = { town: [], rat: 0, extra: 0 };
    const pathD = (pts) => "M" + pts.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" L");

    function measure() {
      town.forEach((p, i) => { p.setAttribute("d", pathD(LG.town[i])); LEN.town[i] = p.getTotalLength(); });
      LEN.extra = gridExtra.getTotalLength();
      LEN.rat = rats[0].body.getTotalLength();
      B.measureLockup(L);
    }

    const span = (r) => r[1] - r[0];

    function render(t) {
      // ======== Scenes A/B: the record line and its marks ========
      const p1 = fprog(t, E.line1[0], span(E.line1)), p2 = fprog(t, E.line2[0], span(E.line2));
      let lx1 = REC.x1, lx2 = REC.x1 + (REC.xMid - REC.x1) * p1 + (REC.x2 - REC.xMid) * p2, ly = REC.y, lw = REC.w, lcol = COL.edge;

      // ======== Scene C: anticipation, then the line becomes the pipe ========
      const ant = fprog(t, E.anticipate[0], span(E.anticipate), EASE.linear);
      const mPipe = spr(S.heavyResolve, t, E.toPipe);
      lx1 = lerp(lx1 - 6 * ant, LG.pipe.x1, mPipe); lx2 = lerp(lx2 - 6 * ant, LG.pipe.x2, mPipe);
      ly = lerp(ly + 4 * ant, LG.pipe.y, mPipe); lw = lerp(lw, LG.pipe.w, mPipe); lcol = mixColor(lcol, COL.coral, mPipe);

      // ======== Scene E: the pipe becomes the organizing line of the evidence composition ========
      const mOrg = spr(S.heavyResolve, t, E.morph);
      const oy = LOGO.pipe.y;
      lx1 = lerp(lx1, EV.x1, mOrg); lx2 = lerp(lx2, EV.x2, mOrg); ly = lerp(ly, oy, mOrg); lw = lerp(lw, EV.w, mOrg); lcol = mixColor(lcol, COL.edge, mOrg);

      // ======== Scene F: the organizing line becomes the logo pipe ========
      const mLogo = spr(S.heavyResolve, t, E.lineToPipe);
      lx1 = lerp(lx1, LOGO.pipe.x1, mLogo); lx2 = lerp(lx2, LOGO.pipe.x2, mLogo); ly = lerp(ly, LOGO.pipe.y, mLogo); lw = lerp(lw, LOGO.pipe.w, mLogo); lcol = mixColor(lcol, COL.coral, mLogo);
      const tailP = fprog(t, E.tail[0], span(E.tail));
      const handoff = M.clamp01((tailP - L.pipeFrac) / 0.12); // the lockup's own pipe has been drawn: hand over
      line.setAttribute("x1", lx1.toFixed(2)); line.setAttribute("x2", lx2.toFixed(2));
      line.setAttribute("y1", ly.toFixed(2)); line.setAttribute("y2", ly.toFixed(2));
      line.setAttribute("stroke", lcol); line.setAttribute("stroke-width", lw.toFixed(2));
      setO(line, 1 - handoff);

      // Marks and labels of the record scene
      const outData = shapeOut(t, E.dataOut);
      svgT(dot1, `translate(${REC.x1} ${REC.y}) scale(${outData.s.toFixed(4)})`); setO(dot1, outData.o);
      { const e = shapeEnv(t, E.closedPop, E.dataOut, S.smallPop); svgT(hollow, `translate(${REC.xMid} ${REC.y}) scale(${e.s.toFixed(4)})`); setO(hollow, e.o); }
      { const e = shapeEnv(t, E.reportPop, E.dataOut, S.smallPop); svgT(dot2, `translate(${REC.x2} ${REC.y}) scale(${e.s.toFixed(4)})`); setO(dot2, e.o); }
      { const e = shapeEnv(t, E.ringPop, E.dataOut, S.smallPop, { s0: 0.9 }); svgT(ring, `translate(${REC.x2} ${REC.y}) scale(${e.s.toFixed(4)})`); setO(ring, e.o); }
      const labelY = REC.y + REC.labelDY;
      { const e = textEnv(t, null, E.dataOut, S.textSettle); placeText(lReport, REC.x1, labelY, e.o, e.dy); }
      { const e = textEnv(t, E.closedLabel, E.dataOut, S.textSettle, { dy: 24 }); placeText(lClosed, REC.xMid, labelY, e.o, e.dy); }
      { const e = textEnv(t, E.newLabel, E.dataOut, S.textSettle, { dy: 24 }); placeText(lNew, REC.x2, labelY, e.o, e.dy); }

      // Headlines (same slot, left edge fixed)
      { const e = textEnv(t, null, E.h1Out, S.textSettle); placeMasked(h1, e.o, e.dy); }
      { const e = textEnv(t, E.h2In, E.h2Out, S.textSettle); placeMasked(h2, e.o, e.dy); }
      { const e = textEnv(t, E.h3In, E.h3Out, S.textSettle); placeMasked(h3, e.o, e.dy); }
      { const e = textEnv(t, E.h4In, E.exitAll, S.textSettle); placeMasked(h4, e.o, e.dy); }
      // Small labels
      { const e = t < f2t(E.illusIn) ? textEnv(t, null, E.dataOut, S.textSettle) : textEnv(t, E.illusIn, E.exitAll, S.textSettle, { dy: 16 }); placeText(illus, TX.x, TX.illusY, e.o, e.dy); }
      { const e = textEnv(t, E.legendTagIn, E.tagOut, S.textSettle, { dy: 16 }); placeText(tagLegend, TX.eyebrowX, TX.eyebrowY, e.o, e.dy); }
      { const e = textEnv(t, E.bostonIn, E.exitAll, S.textSettle, { dy: 16 }); placeText(tagBoston, TX.eyebrowX, TX.eyebrowY, e.o, e.dy); }

      // ======== Scene D: the legend (camera group) ========
      let k = 1 + (LG.camera.push - 1) * fprog(t, E.camera[0], span(E.camera), EASE.inOut);
      k = lerp(k, 1, fprog(t, E.cameraBack[0], span(E.cameraBack), EASE.inOut));
      svgT(cam, `translate(${LG.camera.ox} ${LG.camera.oy}) scale(${k.toFixed(5)}) translate(${-LG.camera.ox} ${-LG.camera.oy})`);

      const gridOut = 1 - fprog(t, E.gridOut[0], span(E.gridOut), EASE.linear);
      const townCol = mixColor(COL.fg, COL.edge, mOrg), townO = lerp(1, LG.gridOpacity, mOrg) * gridOut;
      town.forEach((p, i) => {
        const a = LG.town[i], b = LG.grid[i];
        if (mOrg > 0) p.setAttribute("d", pathD(a.map((pt, j) => [lerp(pt[0], b[j][0], mOrg), lerp(pt[1], b[j][1], mOrg)])));
        else p.setAttribute("d", pathD(a));
        p.setAttribute("stroke", townCol);
        const draw = fprog(t, E.townIn + i * E.townStagger, E.townDur);
        reveal(p, LEN.town[i], draw);
        if (draw >= 1) setO(p, townO); else if (draw > 0) setO(p, 1);
      });
      gridExtra.setAttribute("stroke", COL.edge);
      { const d = fprog(t, E.gridExtra[0], span(E.gridExtra)); reveal(gridExtra, LEN.extra, d); if (d > 0) setO(gridExtra, LG.gridOpacity * gridOut); }

      holes.forEach((h, i) => {
        const e = shapeEnv(t, E.holesIn + i * E.holeStagger, E.holesOut, S.smallPop, { s0: 0.7, oFrames: 3 });
        svgT(h, `translate(${LG.holes[i]} ${LG.pipe.y}) scale(${e.s.toFixed(4)})`); setO(h, e.o);
      });

      rats.forEach((r, i) => {
        const cfg = LG.rats[i], f0 = E.ratsIn + i * E.ratStagger;
        const draw = fprog(t, f0, E.ratDur);
        const face = fprog(t, f0 + E.ratDur, 3, EASE.linear);
        const x = lerp(cfg.x0, cfg.x1, spr(S.glide, t, E.ratsTravel + i * E.ratStagger));
        const out = shapeOut(t, E.ratsOut, 7, 0.94);
        svgT(r.g, `translate(${x.toFixed(2)} ${(LG.ground - 45 * cfg.s * out.s).toFixed(2)}) scale(${(cfg.s * out.s).toFixed(4)})`);
        reveal(r.body, LEN.rat, draw);
        setO(r.g, draw > 0 ? out.o : 0);
        setO(r.eye, face); setO(r.nose, face);
      });

      // ======== Scene E: evidence around one place ========
      { const e = shapeEnv(t, E.pinIn, E.exitAll, S.shapeSnap); svgT(pin, `translate(960 ${(oy + EV.pinDY).toFixed(2)}) scale(${e.s.toFixed(4)})`); setO(pin, e.o); }
      { const e = shapeEnv(t, E.marksIn, E.exitAll, S.shapeSnap); svgT(eDot, `translate(${EV.dotX} ${oy.toFixed(2)}) scale(${e.s.toFixed(4)})`); setO(eDot, e.o); }
      { const e = shapeEnv(t, E.marksIn + E.markStagger, E.exitAll, S.shapeSnap); svgT(eHollow, `translate(${EV.hollowX} ${oy.toFixed(2)}) scale(${e.s.toFixed(4)})`); setO(eHollow, e.o); }
      { const e = shapeEnv(t, E.marksIn + 2 * E.markStagger, E.exitAll, S.shapeSnap); svgT(eSquare, `translate(960 ${(oy + EV.squareDY).toFixed(2)}) scale(${e.s.toFixed(4)})`); setO(eSquare, e.o); }
      {
        const d = fprog(t, E.tick[0], span(E.tick)), out = shapeOut(t, E.exitAll);
        tick.setAttribute("x1", 960); tick.setAttribute("x2", 960);
        tick.setAttribute("y1", (oy + EV.tick[0]).toFixed(2)); tick.setAttribute("y2", (oy + EV.tick[0] + (EV.tick[1] - EV.tick[0]) * d).toFixed(2));
        setO(tick, d > 0 ? out.o : 0);
      }

      // ======== Scene F: the Piper lockup ========
      B.renderLockup(L, {
        visible: t >= f2t(E.tail[0]),
        tail: tailP,
        body: fprog(t, E.body[0], span(E.body)),
        face: fprog(t, E.face[0], span(E.face), EASE.linear),
        holes: [0, 1, 2].map((i) => { const x = spr(S.smallPop, t, E.holes2 + i * 3); return x <= 0 ? 0 : 0.7 + 0.3 * x; }),
        wordmark: textIn(t, E.wordmark, S.textSettle, 24, 8),
      });
      { const e = textIn(t, E.support, S.textSettle, 24, 8); placeText(support, 960, LOGO.bottom + G.supportDY, e.o, e.dy); }
    }

    return { id: K.id, duration: K.duration, frames: K.frames, fps: C.fps, insertAt: K.insertAt, scenes: K.scenes, stills: K.stills, measure, render, logo: LOGO };
  };
})(window);
