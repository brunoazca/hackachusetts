#!/usr/bin/env node
// Writes timeline.json from config.js (the single source of truth) with measured spring responses.
//   node timeline.mjs
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const C = require("./config.js");
const M = require("./motion.js");
const FPS = C.fps;
const sec = (f) => +(f / FPS).toFixed(4);

const narration = {
  opening: [
    { film: "0:00–0:04", local: [0, 4], text: "A closed case. The same place reported again." },
    { film: "0:04–0:14", local: [4, 14], text: "Hamelin’s legend had a piper who led the rats away. We named ours Piper. For Boston, the way forward starts with evidence." },
  ],
  bridge: [{ film: "1:08–1:13", local: [0, 5], text: "The useful question is what surrounds this repeated pattern." }],
  closing: [{ film: "2:50–2:58", local: [0, 8], text: "Piper. Follow the rats. Give Boston a clearer place to start." }],
};

// Settling / hold windows derived from the event frames and the measured spring settle times.
const S = M.springs(C.springs);
const settleFrames = (name) => Math.ceil(S[name].settle * FPS);
const holds = {
  opening: [
    { name: "Closed settled", fromFrame: C.opening.ev.closedLabel + settleFrames("textSettle"), toFrame: C.opening.ev.h1Out - 1 },
    { name: "Reported again settled", fromFrame: C.opening.ev.newLabel + settleFrames("textSettle"), toFrame: C.opening.ev.dataOut - 1 },
    { name: "Legend settled", fromFrame: C.opening.ev.ratsTravel + 2 * C.opening.ev.ratStagger + settleFrames("glide"), toFrame: C.opening.ev.h3Out - 1 },
    { name: "New purpose settled", fromFrame: C.opening.ev.tick[1], toFrame: C.opening.ev.exitAll - 1 },
    { name: "Brand card settled (text)", fromFrame: C.opening.ev.support + settleFrames("textSettle"), toFrame: C.opening.frames - 1 },
    { name: "Brand card settled (geometry)", fromFrame: Math.max(C.opening.ev.face[1], C.opening.ev.holes2 + 6 + settleFrames("smallPop")), toFrame: C.opening.frames - 1 },
  ],
  bridge: [{ name: "Readable hold", fromFrame: 63, toFrame: 149 }],
  closing: [{ name: "Pixel-still hold", fromFrame: 120, toFrame: 239 }],
};

const evOut = (ev) => Object.fromEntries(Object.entries(ev).map(([k, v]) => [k, Array.isArray(v) ? { frames: v, seconds: v.map(sec) } : { frame: v, seconds: sec(v) }]));
const clips = ["opening", "bridge", "closing"].map((id) => {
  const k = C[id];
  return {
    id, file: `exports/${k.file}`, insertAt: k.insertAt, durationSeconds: k.duration, frames: k.frames, fps: FPS,
    frameRule: "frame f is rendered at t = f / 30; intervals are half-open [first, last + 1)",
    scenes: k.scenes.slice(0, -1).map((f, i) => ({ name: k.sceneNames[i], frames: [f, k.scenes[i + 1]], seconds: [sec(f), sec(k.scenes[i + 1])] })),
    reducedMotionStills: k.stills,
    events: evOut(k.ev),
    holds: holds[id].map((h) => ({ ...h, fromSeconds: sec(h.fromFrame), toSeconds: sec(h.toFrame) })),
    narration: narration[id],
  };
});

const out = {
  generated: new Date().toISOString().slice(0, 10),
  film: { totalLength: "2:58", fps: FPS, size: C.size },
  colors: C.colors,
  type: C.type,
  anchor: C.anchor,
  copy: C.copy,
  springs: Object.fromEntries(Object.entries(S).map(([k, s]) => [k, { omega: s.spec.omega, zeta: s.spec.zeta, settleSeconds: +s.settle.toFixed(3), overshootPercent: +(s.overshoot * 100).toFixed(2) }])),
  clips,
};
writeFileSync(join(here, "timeline.json"), JSON.stringify(out, null, 2) + "\n");
console.log("wrote timeline.json");
for (const [k, s] of Object.entries(S)) console.log(`${k.padEnd(13)} omega ${s.spec.omega} zeta ${s.spec.zeta}  settle ${s.settle.toFixed(3)} s  overshoot ${(s.overshoot * 100).toFixed(2)} %`);
