// S03/S04 on the redesigned (Piper) deployment: "Places to visit" context still at 2x, plus boxes.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const OUT = process.argv[2];
const browser = await chromium.launch({ channel:'chrome', headless:true, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport:{width:1920,height:1080}, deviceScaleFactor:2 });
const page = await ctx.newPage();
const box = async (loc) => { const b = await loc.boundingBox().catch(()=>null); return b && [Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)]; };
await page.goto('https://piper-app.vercel.app/', { waitUntil:'networkidle', timeout:60000 }); await page.waitForTimeout(8000);
await page.mouse.move(1100, 600);
const log = { boxes: {} };
log.boxes.queue_title = await box(page.getByText('Places to visit',{exact:true}).first());
log.boxes.badge = await box(page.getByText(/Latest import/).first());
log.boxes.first_row = await box(page.locator('button').filter({hasText:/reports/}).first());
log.boxes.review = await box(page.getByText('Review suggested',{exact:true}).first());
await page.screenshot({ path:`${OUT}/places_context.png` });
writeFileSync(`${OUT}/log.json`, JSON.stringify(log,null,1)); console.log(JSON.stringify(log));
await browser.close();
