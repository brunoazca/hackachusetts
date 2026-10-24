import { chromium } from "playwright";
const [url, out, ...times] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const errs = []; p.on("pageerror", e => errs.push(String(e))); p.on("console", m => m.type() === "error" && errs.push(m.text()));
await p.goto(url + "?capture"); await p.waitForFunction(() => window.ready === true, null, { timeout: 30000 });
for (const t of times) { await p.evaluate(t => window.render(+t), t); await p.screenshot({ path: `${out}/t${t}.png` }); }
console.log("errors:", errs.length ? errs.join(" | ") : "none"); await b.close();
