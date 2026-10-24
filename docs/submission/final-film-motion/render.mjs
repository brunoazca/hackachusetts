#!/usr/bin/env node
// Deterministic renderer for the Piper final-film motion clips (Playwright Chromium + ffmpeg).
//
//   node render.mjs video <clip> [out.mp4]              every frame f at t = f/30 → H.264 yuv420p 1920×1080 30 fps, no audio
//   node render.mjs stills <clip> <t1,t2,...> [dir]      PNG frames at the given seconds (full size)
//   node render.mjs frame <clip> <t> <out.png>           one frame
//   node render.mjs sheet <clip> <t1,t2,...> <out.png>   labeled contact sheet of those frames
//   node render.mjs check <clip>                         determinism (out-of-order seeks), hold stillness, fonts, errors
//   node render.mjs all                                  the three masters, review frames, contact sheets, checks, ffprobe
//
// Clips: opening | bridge | closing. Playwright is resolved from the local tree, $PLAYWRIGHT_DIR, or the
// ~/.cache/piper-video install used by the earlier submission captures.
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { homedir } from "node:os";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const CONFIG = createRequire(import.meta.url)("./config.js");
const FPS = CONFIG.fps;
const CLIPS = ["opening", "bridge", "closing"];

async function loadPlaywright() {
  const candidates = [
    "playwright",
    process.env.PLAYWRIGHT_DIR && join(process.env.PLAYWRIGHT_DIR, "playwright", "index.mjs"),
    join(homedir(), ".cache/piper-video/node_modules/playwright/index.mjs"),
    "/opt/homebrew/lib/node_modules/playwright/index.mjs",
  ].filter(Boolean);
  for (const c of candidates) { try { return await import(c.startsWith("/") ? pathToFileURL(c).href : c); } catch (_) { /* next */ } }
  throw new Error("Playwright not found. npm i playwright && npx playwright install chromium, or set PLAYWRIGHT_DIR.");
}

async function openFilm(clip, { scale = 1 } = {}) {
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale, reducedMotion: "no-preference" });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("requestfailed", (r) => errors.push("request failed: " + r.url()));
  await page.goto(pathToFileURL(join(here, "index.html")).href + `?capture=1&clip=${clip}`);
  const readyInfo = await page.evaluate(() => window.piperMotion.ready);
  if (!readyInfo.fontsLoaded) errors.push("brand fonts did not load");
  await page.evaluate(() => window.piperMotion.pause());
  const frames = await page.evaluate(() => window.piperMotion.frames);
  const frameAt = async (seconds) => {
    await page.evaluate((s) => window.piperMotion.seek(s), seconds);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    return page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 1920, height: 1080 } });
  };
  return { browser, page, frameAt, errors, frames };
}

function probe(out) {
  return execFileSync("ffprobe", ["-v", "error", "-count_frames", "-show_entries",
    "stream=index,codec_type,codec_name,width,height,r_frame_rate,nb_read_frames,pix_fmt:format=duration,nb_streams", "-of", "default=nw=1", out]).toString().trim();
}

async function renderVideo(clip, out) {
  out = resolve(out || join(here, "exports", CONFIG[clip].file));
  mkdirSync(dirname(out), { recursive: true });
  const { browser, frameAt, errors, frames } = await openFilm(clip);
  const expected = CONFIG[clip].frames;
  if (frames !== expected) errors.push(`page reports ${frames} frames, config says ${expected}`);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-frames:v", String(expected), "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", "-r", String(FPS), out], { stdio: ["pipe", "inherit", "inherit"] });
  const started = Date.now();
  for (let f = 0; f < expected; f++) {
    const png = await frameAt(f / FPS);
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once("drain", r));
    if (f % 60 === 0) process.stderr.write(`${clip} frame ${f}/${expected}\n`);
  }
  ff.stdin.end();
  await new Promise((r, j) => ff.on("close", (c) => (c === 0 ? r() : j(new Error("ffmpeg exit " + c)))));
  await browser.close();
  console.log(`wrote ${out} in ${((Date.now() - started) / 1000).toFixed(0)} s\n${probe(out)}`);
  if (errors.length) { console.error("page errors:", errors); process.exitCode = 1; }
  return out;
}

const fname = (t) => `t${t.toFixed(3).replace(".", "_")}s_f${Math.round(t * FPS)}.png`;

async function renderStills(clip, times, dir) {
  dir = resolve(dir || join(here, "review", clip));
  mkdirSync(dir, { recursive: true });
  const { browser, frameAt, errors } = await openFilm(clip);
  for (const t of times) { const file = join(dir, fname(t)); writeFileSync(file, await frameAt(t)); console.log(file); }
  await browser.close();
  if (errors.length) { console.error("page errors:", errors); process.exitCode = 1; }
}

async function renderFrame(clip, t, out) {
  out = resolve(out); mkdirSync(dirname(out), { recursive: true });
  const { browser, frameAt, errors } = await openFilm(clip);
  writeFileSync(out, await frameAt(t)); console.log(out);
  await browser.close();
  if (errors.length) { console.error("page errors:", errors); process.exitCode = 1; }
}

// Contact sheet: frames at half size (960 × 540) in 3 columns, each labeled with time and frame.
async function renderSheet(clip, times, out) {
  out = resolve(out); mkdirSync(dirname(out), { recursive: true });
  const { browser, page, frameAt, errors } = await openFilm(clip);
  const tiles = [];
  for (const t of times) tiles.push({ t, png: (await frameAt(t)).toString("base64") });
  const sheet = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const k = CONFIG[clip];
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;background:#0B0C0D;color:#AEB5BC;font:600 20px/1.3 "Helvetica Neue",Arial,sans-serif;padding:24px}
    h1{font-size:26px;color:#F2F3F1;margin:0 0 16px} .grid{display:grid;grid-template-columns:repeat(3,600px);gap:24px 24px}
    figure{margin:0} img{display:block;width:600px;height:337.5px;outline:1px solid #2F353B} figcaption{margin-top:6px}
    </style></head><body><h1>Piper · ${clip} · ${k.duration.toFixed(3)} s · ${k.frames} frames · film ${k.insertAt}</h1><div class="grid">` +
    tiles.map((x) => `<figure><img src="data:image/png;base64,${x.png}"><figcaption>${x.t.toFixed(3)} s · frame ${Math.round(x.t * FPS)}</figcaption></figure>`).join("") +
    `</div></body></html>`;
  await sheet.setContent(html);
  await sheet.screenshot({ path: out, fullPage: true });
  console.log(out);
  await browser.close();
  if (errors.length) { console.error("page errors:", errors); process.exitCode = 1; }
}

// Determinism + holds. Renders in one page, compares PNG bytes.
async function check(clip) {
  const { browser, page, frameAt, errors, frames } = await openFilm(clip);
  const k = CONFIG[clip], dur = k.duration;
  const report = { clip, frames, expectedFrames: k.frames, fontsLoaded: !errors.includes("brand fonts did not load") };
  const eq = (a, b) => a.equals(b);
  // out-of-order seeks: late → early → middle → same middle (middle compared with a fresh render of the same time)
  const mid = +(dur * 0.47).toFixed(4);
  const late = await frameAt(dur - 1 / FPS);
  const early = await frameAt(0.5);
  const m1 = await frameAt(mid);
  const m2 = await frameAt(mid);
  const lateAgain = await frameAt(dur - 1 / FPS);
  const earlyAgain = await frameAt(0.5);
  report.seekDeterministic = eq(m1, m2) && eq(late, lateAgain) && eq(early, earlyAgain);
  // holds
  const stillRanges = { opening: [[380, 419]], bridge: [[63, 100, 149]], closing: [[120, 160, 200, 239]] }[clip];
  report.holds = [];
  for (const fr of stillRanges) {
    const imgs = []; for (const f of fr) imgs.push(await frameAt(f / FPS));
    report.holds.push({ frames: fr, identical: imgs.every((im) => eq(im, imgs[0])) });
  }
  // first and last frame are not blank
  const first = await frameAt(0), last = await frameAt((k.frames - 1) / FPS);
  const nonBlank = async (buf) => page.evaluate(async (b64) => {
    const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
    const c = document.createElement("canvas"); c.width = 192; c.height = 108; const x = c.getContext("2d"); x.drawImage(img, 0, 0, 192, 108);
    const d = x.getImageData(0, 0, 192, 108).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 60 || d[i + 1] > 60 || d[i + 2] > 60) n++;
    return n;
  }, buf.toString("base64"));
  report.firstFrameLitPixels = await nonBlank(first); report.lastFrameLitPixels = await nonBlank(last);
  // spring responses actually used
  report.springs = await page.evaluate(() => Object.fromEntries(Object.entries(window.piperMotion.springs).map(([k, s]) => [k, { omega: s.spec.omega, zeta: s.spec.zeta, settleSeconds: +s.settle.toFixed(3), overshoot: +(s.overshoot * 100).toFixed(2) + " %" }])));
  report.pageErrors = errors;
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
  if (errors.length || !report.seekDeterministic || report.holds.some((h) => !h.identical)) process.exitCode = 1;
  return report;
}

const REVIEW_TIMES = {
  opening: [0, 0.5, 1.5, 2.15, 3.8, 4.3, 5.5, 7.2, 8.7, 10.6, 11.7, 13.9667],
  bridge: [0, 0.45, 1.2, 2.1, 4.9667, 2.5],
  closing: [0, 0.55, 1.8, 3.2, 4.0, 7.9667],
};

const [mode, a1, a2, a3] = process.argv.slice(2);
const times = (s) => s.split(",").map(Number);
if (mode === "video" && CLIPS.includes(a1)) await renderVideo(a1, a2);
else if (mode === "stills" && CLIPS.includes(a1)) await renderStills(a1, times(a2), a3);
else if (mode === "frame" && CLIPS.includes(a1)) await renderFrame(a1, Number(a2), a3);
else if (mode === "sheet" && CLIPS.includes(a1)) await renderSheet(a1, times(a2), a3);
else if (mode === "check" && CLIPS.includes(a1)) await check(a1);
else if (mode === "all") {
  for (const c of CLIPS) {
    await renderVideo(c);
    await renderStills(c, REVIEW_TIMES[c], join(here, "review", c));
    await renderSheet(c, REVIEW_TIMES[c], join(here, "review", `${c}-contact-sheet.png`));
    await check(c);
  }
} else { console.log("usage: node render.mjs video|stills|frame|sheet|check <clip> ... | all   (clips: opening, bridge, closing)"); process.exit(2); }
