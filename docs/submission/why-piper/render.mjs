#!/usr/bin/env node
// Deterministic renderer for the Why Piper film.
//
//   node render.mjs video [out.mp4]            every frame at f/30 s → H.264 yuv420p 1920×1080 30 fps
//   node render.mjs stills 2.8,6.5,13.5 [dir]  PNG frames at the given seconds (default dir: stills/)
//   node render.mjs frame 13.5 out.png         one frame
//
// Needs: Playwright (chromium) and ffmpeg on PATH. Set PLAYWRIGHT_DIR to a node_modules folder that
// contains "playwright" when it is not resolvable from this directory.
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { homedir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const FPS = 30; let FRAMES = 0; // frame count is read from the page (piperFilm.duration × fps)

async function loadPlaywright() {
  const candidates = [
    "playwright",
    process.env.PLAYWRIGHT_DIR && join(process.env.PLAYWRIGHT_DIR, "playwright", "index.mjs"),
    join(homedir(), ".cache/piper-video/node_modules/playwright/index.mjs"),
    "/opt/homebrew/lib/node_modules/playwright/index.mjs",
  ].filter(Boolean);
  for (const c of candidates) {
    try { return await import(c.startsWith("/") ? pathToFileURL(c).href : c); } catch (_) { /* next */ }
  }
  throw new Error("Playwright not found. npm i playwright && npx playwright install chromium, or set PLAYWRIGHT_DIR.");
}

async function openFilm(extraQuery = "") {
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, reducedMotion: "no-preference" });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("requestfailed", (r) => errors.push("request failed: " + r.url()));
  await page.goto(pathToFileURL(join(here, "index.html")).href + "?capture=1" + extraQuery);
  await page.evaluate(() => window.piperFilm.ready);
  await page.evaluate(() => window.piperFilm.pause());
  FRAMES = await page.evaluate(() => Math.round(window.piperFilm.duration * window.piperFilm.fps));
  const frameAt = async (seconds) => {
    await page.evaluate((s) => window.piperFilm.seek(s), seconds);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    return page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 1920, height: 1080 } });
  };
  return { browser, page, frameAt, errors };
}

const [mode, a1, a2] = process.argv.slice(2);

if (mode === "video") {
  const out = resolve(a1 || join(here, "why-piper.mp4"));
  const { browser, frameAt, errors } = await openFilm();
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-frames:v", String(FRAMES), "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", "-r", String(FPS), out], { stdio: ["pipe", "inherit", "inherit"] });
  const started = Date.now();
  for (let f = 0; f < FRAMES; f++) {
    const png = await frameAt(f / FPS);
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once("drain", r));
    if (f % 60 === 0) process.stderr.write(`frame ${f}/${FRAMES}\n`);
  }
  ff.stdin.end();
  await new Promise((r, j) => ff.on("close", (c) => (c === 0 ? r() : j(new Error("ffmpeg exit " + c)))));
  await browser.close();
  const probe = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-count_frames",
    "-show_entries", "stream=width,height,r_frame_rate,nb_read_frames,pix_fmt,codec_name:format=duration", "-of", "default=nw=1", out]).toString();
  console.log(`wrote ${out} in ${((Date.now() - started) / 1000).toFixed(0)} s\n${probe}`);
  if (errors.length) { console.error("page errors:", errors); process.exit(1); }
} else if (mode === "stills" || mode === "frame") {
  const times = (a1 || "0.9,1.7,2.9,4.2,5.6,7.0,8.0,8.6,9.6").split(",").map(Number);
  const dir = mode === "frame" ? dirname(resolve(a2)) : resolve(a2 || join(here, "stills"));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const { browser, frameAt, errors } = await openFilm();
  const { writeFileSync } = await import("node:fs");
  for (const t of times) {
    const file = mode === "frame" ? resolve(a2) : join(dir, `t${t.toFixed(2).replace(".", "_")}s_f${Math.round(t * FPS)}.png`);
    writeFileSync(file, await frameAt(t));
    console.log(file);
  }
  await browser.close();
  if (errors.length) { console.error("page errors:", errors); process.exit(1); }
} else {
  console.log("usage: node render.mjs video [out.mp4] | stills t1,t2,... [dir] | frame t out.png");
  process.exit(2);
}
