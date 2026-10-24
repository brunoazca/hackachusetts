// Deterministic render: seek render(t) per frame, screenshot, pipe JPEGs to ffmpeg (H.264, 1920×1080).
import { chromium } from "playwright";
import { spawn } from "node:child_process";
const [url, outFile, ffmpeg, fps = "30"] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto(url + "?capture"); await p.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
const dur = await p.evaluate(() => window.DUR), n = Math.ceil(dur * +fps);
const ff = spawn(ffmpeg, ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", fps, "-c:v", "mjpeg", "-i", "-",
  "-vf", "scale=in_range=pc:out_range=tv,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-color_range", "tv", "-movflags", "+faststart", outFile], { stdio: ["pipe", "inherit", "inherit"] });
for (let i = 0; i < n; i++) {
  await p.evaluate(t => window.render(t), i / +fps);
  const buf = await p.screenshot({ type: "jpeg", quality: 93 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
  if (i % 300 === 0) console.log(`frame ${i}/${n}`);
}
ff.stdin.end(); await new Promise(r => ff.on("close", r)); await b.close(); console.log("done", n, "frames", dur.toFixed(1), "s");
