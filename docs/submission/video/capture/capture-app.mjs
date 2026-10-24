// Capture the deployed app for S03/S04 (context still), S17 (Assess + forecast, screencast), S18 (layer hover still), S20 (forecast block still).
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
const OUT = process.argv[2];
const browser = await chromium.launch({ channel:'chrome', headless:true, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport:{width:1920,height:1080}, deviceScaleFactor:2 });
const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
const log = { boxes:{}, events:[], notes:[] }; const T0 = Date.now(); const now = () => (Date.now()-T0)/1000;
const box = async (loc) => { const b = await loc.boundingBox().catch(()=>null); return b && [Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)]; };
const ease = u => 6*u**5 - 15*u**4 + 10*u**3;
let cur = [1100, 600];
async function moveTo(x, y, ms, tag){ const [x0,y0]=cur; const steps=Math.max(6, Math.round(ms/16)); for (let i=1;i<=steps;i++){ const e=ease(i/steps); const px=x0+(x-x0)*e, py=y0+(y-y0)*e; await page.mouse.move(px,py); log.events.push({t:now(),type:'move',x:px,y:py,tag}); await page.waitForTimeout(ms/steps); } cur=[x,y]; }
async function click(tag){ log.events.push({t:now(),type:'click',x:cur[0],y:cur[1],tag}); await page.mouse.down(); await page.waitForTimeout(60); await page.mouse.up(); }
let cast = null;
async function startCast(name){ cast = { name, frames:[], dir:`${OUT}/${name}` }; mkdirSync(cast.dir,{recursive:true}); cdp.on('Page.screencastFrame', async ({data, metadata, sessionId}) => { if (!cast) return; cast.frames.push({t:now(), file:`${cast.dir}/f${String(cast.frames.length).padStart(5,'0')}.jpg`}); writeFileSync(cast.frames.at(-1).file, Buffer.from(data,'base64')); await cdp.send('Page.screencastFrameAck',{sessionId}).catch(()=>{}); }); await cdp.send('Page.startScreencast',{format:'jpeg',quality:90,maxWidth:3840,maxHeight:2160,everyNthFrame:1}); log.events.push({t:now(),type:'cast_start',tag:name}); }
async function stopCast(){ await cdp.send('Page.stopScreencast'); const c=cast; cast=null; log.events.push({t:now(),type:'cast_stop',tag:c.name}); writeFileSync(`${c.dir}/frames.json`, JSON.stringify(c.frames.map(f=>({t:f.t,file:f.file})))); return c.frames.length; }

await page.goto('https://piper-app.vercel.app/', { waitUntil:'networkidle', timeout:60000 }); await page.waitForTimeout(6000);
// --- Act context (S03/S04)
await page.getByText('Act',{exact:true}).first().click({force:true}); await page.waitForTimeout(3500);
await page.mouse.move(1100,600); cur=[1100,600];
log.boxes.queue_panel = await box(page.locator('section').getByText(/Site queue/).first().locator('xpath=ancestor::div[contains(@class,"absolute")][1]'));
log.boxes.live_badge = await box(page.getByText(/Live · updated/).first());
log.boxes.first_row = await box(page.locator('section button').filter({hasText:/reports/}).first());
log.boxes.aside = await box(page.locator('aside').first());
log.boxes.mode_act = await box(page.getByText('Act',{exact:true}).first()); log.boxes.mode_assess = await box(page.getByText('Assess',{exact:true}).first());
await page.screenshot({ path:`${OUT}/act_context.png` }); log.notes.push('act_context.png: Act mode, no filter, nothing selected; cursor rest at 1100,600');
// --- Assess + forecast (S17), screencast
await startCast('assess_cast'); await page.waitForTimeout(600);
const assessB = log.boxes.mode_assess; await moveTo(assessB[0]+assessB[2]/2, assessB[1]+assessB[3]/2, 600, 'to_assess'); await page.waitForTimeout(350); await click('assess'); await page.waitForTimeout(900);
const cb = page.locator('input[type=checkbox]').first(); const cbB = await box(cb); log.boxes.forecast_toggle = cbB;
await moveTo(cbB[0]+cbB[2]/2, cbB[1]+cbB[3]/2, 450, 'to_forecast'); await page.waitForTimeout(350); await click('forecast'); await page.waitForTimeout(4500);
await moveTo(1100, 900, 400, 'rest'); await page.waitForTimeout(1200);
log.notes.push('assess_cast frames: '+ await stopCast());
log.boxes.forecast_ctl = await box(page.getByText(/Expected rodent reports/).first()); log.boxes.next4 = await box(page.getByText(/Next 4 weeks/).first());
await page.screenshot({ path:`${OUT}/assess_forecast.png` });
// --- Layer hover (S18): Construction debris row with 'no effect'
const row = page.getByText('Construction debris',{exact:true}).first(); await row.scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
let rb = await box(row.locator('xpath=..')); const rtb = await box(row); if (!rb) rb = rtb; log.boxes.layer_row = rb; log.boxes.layer_row_text = rtb;
const lab = page.getByText(/no effect/).first(); log.boxes.tested_label = await box(lab);
log.boxes.layer_panel = await box(page.locator('section').getByText('Layers',{exact:true}).first().locator('xpath=ancestor::div[contains(@class,"absolute")][1]')).catch(()=>null);
await moveTo(rb[0]+40, rb[1]+rb[3]/2, 450, 'to_layer'); await page.waitForTimeout(600);
await page.screenshot({ path:`${OUT}/layer_hover.png` });
await moveTo(1100, 900, 350, 'rest');
// --- Forecast block card (S20): try to find an emerging block, else any block
let hit=null, any=null;
outer: for (const y of [220,330,440,550,660,770,880,990]) for (const x of [420,520,620,720,820,920,1020,1120,1220,1320,1420]) {
  await page.mouse.click(x,y); await page.waitForTimeout(700);
  const t=(await page.locator('aside').innerText()).replace(/\s+/g,' ');
  if (/FORECAST BLOCK/.test(t)) { any = any || [x,y]; if (/Emerging hotspot/.test(t)) { hit=[x,y]; break outer; } }
}
const pt = hit || any; log.notes.push(`cell: emerging=${!!hit} point=${pt}`);
if (pt) { await moveTo(1100,600,200,'pre'); await moveTo(pt[0],pt[1],600,'to_block'); await page.waitForTimeout(350); await click('block'); await page.waitForTimeout(1500);
  log.boxes.cell_header = await box(page.locator('aside').getByText(/FORECAST BLOCK/).first()); log.boxes.cell_emerging = await box(page.locator('aside').getByText(/Emerging hotspot/).first());
  log.boxes.cell_estimate = await box(page.locator('aside').getByText(/Model estimate|expected reports/).first());
  await moveTo(pt[0]+180, pt[1]+120, 300, 'away'); await page.waitForTimeout(400);
  await page.screenshot({ path:`${OUT}/cell_card.png` }); }
writeFileSync(`${OUT}/log.json`, JSON.stringify(log,null,1));
console.log(JSON.stringify({boxes:log.boxes, notes:log.notes}, null, 1));
await browser.close();
