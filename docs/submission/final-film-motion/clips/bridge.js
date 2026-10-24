/* Clip 2 — Context bridge, 5 s / 150 frames. Film time 1:08–1:13.
 * One selected place stays put at the configured anchor; three kinds of records (Reports, Responses, Nearby
 * records) connect to a ring around it. Camera locked. Holds from frame 63 to the end for a clean match cut. */
(function (root) {
  "use strict";
  root.PiperClips = root.PiperClips || {};

  root.PiperClips.bridge = function build(clipRoot, C, M, B) {
    const K = C.bridge, E = K.ev, G = K.geo, TX = C.text, COL = C.colors, CP = C.copy, A = C.anchor;
    const S = M.springs(C.springs);
    const { f2t, fprog, spr, EASE, lerp, svgEl, setO, svgT, reveal, makeText, placeText, makeMasked, placeMasked, shapeIn, textIn, measureText } = M;

    const svg = svgEl("svg", { class: "diagram", viewBox: "0 0 1920 1080" }, clipRoot);

    // Open ring around the place (gap on the right, where the "One place" label sits).
    const g = (G.ringGapDeg * Math.PI) / 180, R = G.ringR;
    const ringD = `M${(A.x + R * Math.cos(g)).toFixed(2)} ${(A.y + R * Math.sin(g)).toFixed(2)} A${R} ${R} 0 1 1 ${(A.x + R * Math.cos(-g)).toFixed(2)} ${(A.y + R * Math.sin(-g)).toFixed(2)}`;
    const ringArc = svgEl("path", { d: ringD, fill: "none", stroke: COL.edge, "stroke-width": 3, "stroke-linecap": "round" }, svg);

    const groups = G.groups.map((gr, i) => {
      const base = { x: A.x + gr.dx, y: A.y + gr.dy };
      const len = Math.hypot(gr.dx, gr.dy), inward = { x: -gr.dx / len, y: -gr.dy / len };
      const conn = svgEl("line", { stroke: COL.edge, "stroke-width": 4, "stroke-linecap": "round" }, svg);
      let sym;
      if (i === 0) sym = svgEl("circle", { r: G.symR, fill: COL.fg }, svg);
      else if (i === 1) sym = svgEl("circle", { r: G.symR, fill: COL.bg, stroke: COL.fg, "stroke-width": 4 }, svg);
      else { const s = G.squareSize; sym = svgEl("rect", { x: -s / 2, y: -s / 2, width: s, height: s, rx: 3, fill: COL.bg, stroke: COL.fg, "stroke-width": 4 }, svg); }
      const anchor = gr.side === "left" ? "rm" : gr.side === "right" ? "lm" : "tc";
      const label = makeText(clipRoot, "label", CP.groups[i], anchor);
      return { gr, base, inward, conn, sym, label };
    });

    const pin = B.makePin(svg);
    const onePlace = makeText(clipRoot, "small", CP.onePlace, "lm");
    const h1 = makeMasked(clipRoot, "phrase-bridge", CP.bridgeHead, TX.x, TX.headY, 1500, C.type.phraseBridge);
    const illus = makeText(clipRoot, "illus", CP.illustrative, "lm");

    const LEN = { ring: 0 };
    function measure() { LEN.ring = ringArc.getTotalLength(); }

    function render(t) {
      // The place: fully present on frame 0 and never moves.
      svgT(pin, `translate(${A.x} ${A.y})`); setO(pin, 1);
      placeText(onePlace, A.x + G.placeLabelDX, A.y, 1, 0);
      placeText(illus, TX.x, TX.illusY, 1, 0);

      const settle = spr(S.heavyResolve, t, E.settle);
      groups.forEach((gp, i) => {
        const f0 = E.groupsIn + i * E.stagger;
        const arrive = shapeIn(t, f0, S.shapeSnap, 0.92, 4);
        const a = spr(S.shapeSnap, t, f0);
        // start G.arrive px outward, spring into position, later settle G.inward px toward the place
        const off = -G.arrive * (1 - a) + G.inward * settle;
        const x = gp.base.x + gp.inward.x * off, y = gp.base.y + gp.inward.y * off;
        svgT(gp.sym, `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${arrive.s.toFixed(4)})`); setO(gp.sym, arrive.o);
        const te = textIn(t, f0, S.textSettle, 24, 8);
        if (gp.gr.side === "left") placeText(gp.label, x - G.labelGap, y, te.o, te.dy);
        else if (gp.gr.side === "right") placeText(gp.label, x + G.labelGap, y, te.o, te.dy);
        else placeText(gp.label, x, y + G.belowGap, te.o, te.dy);
        // connector from the symbol edge to the ring; its endpoint is the reveal
        const p = fprog(t, E.connectors + i * E.stagger, E.connDur, EASE.out);
        const sx = x + gp.inward.x * (G.symR + G.connectorPad), sy = y + gp.inward.y * (G.symR + G.connectorPad);
        const ex = A.x - gp.inward.x * R, ey = A.y - gp.inward.y * R;
        gp.conn.setAttribute("x1", sx.toFixed(2)); gp.conn.setAttribute("y1", sy.toFixed(2));
        gp.conn.setAttribute("x2", lerp(sx, ex, p).toFixed(2)); gp.conn.setAttribute("y2", lerp(sy, ey, p).toFixed(2));
        setO(gp.conn, p > 0 ? 1 : 0);
      });

      reveal(ringArc, LEN.ring, fprog(t, E.ring[0], E.ring[1] - E.ring[0]));
      { const e = textIn(t, E.h1In, S.textSettle, 32, 8); placeMasked(h1, e.o, e.dy); }
    }

    return { id: K.id, duration: K.duration, frames: K.frames, fps: C.fps, insertAt: K.insertAt, scenes: K.scenes, stills: K.stills, measure, render };
  };
})(window);
