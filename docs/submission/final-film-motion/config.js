/* Piper final-film motion — single source of truth for timing, copy, geometry, springs and colors.
 * Loaded by the browser (window.PIPER_CONFIG) and by node (timeline.mjs / render.mjs via require).
 * Times are integer frames at 30 fps; a two-element array is a half-open range [first, last+1).
 */
(function (root) {
  "use strict";

  const FPS = 30;

  // Hamelin gate arch sampled as a polyline (center 900,560 r 40) so it can morph point-for-point.
  const gate = [[860, 660], [860, 560]];
  for (let i = 1; i <= 5; i++) { const a = Math.PI - (Math.PI * i) / 6; gate.push([+(900 + 40 * Math.cos(a)).toFixed(2), +(560 - 40 * Math.sin(a)).toFixed(2)]); }
  gate.push([940, 560], [940, 660]);
  // Straight target with n evenly spaced points (so every town polyline has a same-count grid target).
  const straight = (x1, y1, x2, y2, n) => Array.from({ length: n }, (_, i) => [x1 + ((x2 - x1) * i) / (n - 1), y1 + ((y2 - y1) * i) / (n - 1)]);

  const town = [
    [[200, 660], [1720, 660]],                                                                  // ground
    [[260, 660], [260, 540], [330, 470], [400, 540], [400, 600], [470, 600], [470, 500], [560, 420], [650, 500], [650, 660]], // gable row
    [[700, 660], [700, 400], [740, 340], [780, 400], [780, 660]],                                // tower
    [[780, 600], [860, 600]],                                                                   // wall to the gate
    gate,                                                                                       // gate arch
  ];
  const grid = [
    straight(600, 790, 1320, 790, 2),   // ground → lower street
    straight(660, 420, 660, 800, 10),   // gable row → street
    straight(860, 420, 860, 800, 5),    // tower → street
    straight(1060, 420, 1060, 800, 2),  // wall → street
    straight(1260, 420, 1260, 800, gate.length), // gate → street
  ];

  const CONFIG = {
    fps: FPS,
    size: { w: 1920, h: 1080 },
    colors: { bg: "#111315", fg: "#F2F3F1", fg2: "#AEB5BC", line: "#2F353B", edge: "#68717A", coral: "#FF5A4E" },

    // Second-order springs: omega (rad/s), zeta (damping ratio). Unit step, zero initial velocity.
    springs: {
      shapeSnap: { omega: 22, zeta: 0.72 },   // geometric arrivals, ~4% overshoot
      smallPop: { omega: 28, zeta: 0.68 },    // report accents and pipe holes, ~5% overshoot
      heavyResolve: { omega: 18, zeta: 0.86 }, // major regrouping, almost no bounce
      textSettle: { omega: 26, zeta: 1.0 },   // critically damped text travel
      glide: { omega: 11, zeta: 0.92 },       // decorative silhouettes travelling a long way
    },

    type: { hook: 148, phrase: 112, phraseBridge: 100, support: 42, label: 38, small: 36, eyebrow: 30, illus: 30, tagline: 60, closingSupport: 40 },
    text: { x: 160, headY: 170, illusY: 875, eyebrowX: 1760, eyebrowY: 96 },
    anchor: { x: 960, y: 560 }, // editorial match position of the selected place marker (bridge and closing)
    footerUrl: "",              // optional verified short URL for the closing card; empty = nothing rendered

    copy: {
      hook1: "Closed.", hook2: "Reported again.",
      legend: "A legend.", purpose: "A new purpose.",
      tagLegend: "THE LEGEND", tagBoston: "BOSTON",
      illustrative: "Illustrative sequence",
      lReport: "Report", lClosed: "Closed", lNew: "New report",
      support: "Evidence for the next inspection.",
      bridgeHead: "One place. More context.", onePlace: "One place",
      groups: ["Reports", "Responses", "Nearby records"],
      tagline: "Follow the rats.",
      wordmark: "Piper",
    },

    opening: {
      id: "opening", file: "01-opening.mp4", duration: 14, frames: 420, insertAt: "0:00",
      scenes: [0, 45, 114, 129, 216, 318, 420],
      sceneNames: ["Closed", "Reported again", "Turn the line into the story", "A legend", "A new purpose", "Piper"],
      stills: [36, 100, 100, 190, 290, 400],
      geo: {
        record: { y: 610, x1: 560, xMid: 960, x2: 1360, w: 5, markR: 13, ringR: 30, labelDY: 44 },
        legend: {
          pipe: { x1: 940, x2: 1640, y: 520, w: 6 }, holes: [1460, 1520, 1580], holeR: 11,
          camera: { ox: 940, oy: 560, push: 1.08 },
          town, grid, gridExtra: [[600, 450], [1320, 450]], townWidth: 4, gridOpacity: 0.6,
          ground: 660,
          rats: [{ s: 3.4, x0: 960, x1: 1150 }, { s: 2.9, x0: 1090, x1: 1300 }, { s: 2.6, x0: 1200, x1: 1440 }],
        },
        evidence: { x1: 600, x2: 1320, w: 5, dotX: 760, hollowX: 1160, squareDY: 110, squareSize: 28, tick: [22, 96], markR: 13, pinDY: -28 },
        lockup: { W: 660, cx: 960, top: 365 }, supportDY: 72,
      },
      ev: {
        line1: [1, 9], closedPop: 8, closedLabel: 10,
        line2: [45, 54], reportPop: 53, ringPop: 56, newLabel: 60, h1Out: 45, h2In: 50,
        dataOut: 114, anticipate: [114, 116], toPipe: 116, h2Out: 118, legendTagIn: 120, h3In: 128,
        townIn: 124, townStagger: 3, townDur: 10, holesIn: 134, holeStagger: 3,
        ratsIn: 136, ratStagger: 2, ratDur: 10, ratsTravel: 146, camera: [129, 168],
        h3Out: 216, h4In: 223, tagOut: 216, bostonIn: 222, ratsOut: 216, holesOut: 216, cameraBack: [216, 236],
        morph: 222, gridExtra: [236, 250], pinIn: 238, marksIn: 240, markStagger: 2, tick: [244, 254], illusIn: 242,
        exitAll: 318, gridOut: [318, 330], lineToPipe: 318, tail: [332, 348], body: [340, 358], face: [356, 362], holes2: 342, wordmark: 336, support: 342,
      },
    },

    bridge: {
      id: "bridge", file: "02-context-bridge.mp4", duration: 5, frames: 150, insertAt: "1:08",
      scenes: [0, 14, 36, 63, 150],
      sceneNames: ["Keep the place", "Three kinds of evidence", "One organized view", "Readable hold"],
      stills: [8, 8, 120, 120],
      geo: {
        // offsets from the anchor; label side relative to the symbol
        groups: [{ dx: -380, dy: -220, side: "left" }, { dx: 380, dy: -220, side: "right" }, { dx: 0, dy: 220, side: "below" }],
        arrive: 40, inward: 32, symR: 14, squareSize: 26, labelGap: 34, belowGap: 34,
        ringR: 140, ringGapDeg: 20, connectorPad: 12, placeLabelDX: 172,
      },
      ev: { groupsIn: 14, stagger: 2, connectors: 20, connDur: 14, settle: 36, ring: [24, 44], h1In: 40 },
    },

    closing: {
      id: "closing", file: "03-closing.mp4", duration: 8, frames: 240, insertAt: "2:50",
      scenes: [0, 17, 54, 96, 120, 240],
      sceneNames: ["Continue the thread", "The line becomes the pipe", "The name and line", "The purpose", "Four seconds of stillness"],
      stills: [3, 200, 200, 200, 200],
      geo: { line: { x1: 840, x2: 1080, dy: 40, w: 5 }, lockup: { W: 740, cx: 960, top: 296 }, taglineDY: 90, supportDY: 170, footerDY: 236 },
      ev: { extend: [4, 20], pinOut: [6, 16], lineToPipe: 17, tail: [26, 48], body: [36, 58], face: [56, 62], holes: 44, holeStagger: 3, wordmark: 54, tagline: 64, support: 96 },
    },
  };

  root.PIPER_CONFIG = CONFIG;
  if (typeof module !== "undefined" && module.exports) module.exports = CONFIG;
})(typeof window !== "undefined" ? window : globalThis);
