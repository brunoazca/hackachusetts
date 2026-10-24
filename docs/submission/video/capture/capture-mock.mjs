// Capture the patched Piper mockup for S07/S08/S10/S11/S12/S13/S14/S29 (tagged "Prototype" in the edit).
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
const OUT = process.argv[2]; const URL = process.argv[3];
const browser = await chromium.launch({ channel:'chrome', headless:true });
const ctx = await browser.newContext({ viewport:{width:1920,height:1080}, deviceScaleFactor:2 });
const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
const log = { boxes:{}, events:[], notes:[] }; const T0 = Date.now(); const now = () => (Date.now()-T0)/1000;
const box = async (loc) => { const b = await loc.boundingBox().catch(()=>null); return b && [Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)]; };
const ease = u => 6*u**5 - 15*u**4 + 10*u**3;
let cur = [900, 560];
async function moveTo(x, y, ms, tag){ const [x0,y0]=cur; const steps=Math.max(6, Math.round(ms/16)); for (let i=1;i<=steps;i++){ const e=ease(i/steps); const px=x0+(x-x0)*e, py=y0+(y-y0)*e; await page.mouse.move(px,py); log.events.push({t:now(),type:'move',x:px,y:py,tag}); await page.waitForTimeout(ms/steps); } cur=[x,y]; }
async function click(tag){ log.events.push({t:now(),type:'click',x:cur[0],y:cur[1],tag}); await page.mouse.down(); await page.waitForTimeout(60); await page.mouse.up(); }
let cast=null;
cdp.on('Page.screencastFrame', async ({data, metadata, sessionId}) => { if (cast){ const f=`${cast.dir}/f${String(cast.frames.length).padStart(5,'0')}.jpg`; cast.frames.push({t:now(), file:f}); writeFileSync(f, Buffer.from(data,'base64')); } await cdp.send('Page.screencastFrameAck',{sessionId}).catch(()=>{}); });
async function startCast(name){ cast={name, frames:[], dir:`${OUT}/${name}`}; mkdirSync(cast.dir,{recursive:true}); await cdp.send('Page.startScreencast',{format:'jpeg',quality:90,maxWidth:3840,maxHeight:2160,everyNthFrame:1}); log.events.push({t:now(),type:'cast_start',tag:name}); }
async function stopCast(){ await cdp.send('Page.stopScreencast'); const c=cast; cast=null; log.events.push({t:now(),type:'cast_stop',tag:c.name}); writeFileSync(`${c.dir}/frames.json`, JSON.stringify(c.frames)); return c.frames.length; }

await page.goto(URL, { waitUntil:'load' }); await page.waitForTimeout(2000);
await page.evaluate(() => { const r = document.querySelector('#appRoot').getBoundingClientRect(); window.scrollTo(0, window.scrollY + r.top - 140); });
await page.waitForTimeout(800);
const app = page.locator('#appRoot'); log.boxes.frame = await box(app);
const side = page.locator('#side-body'); log.boxes.side = await box(side);
await page.mouse.move(900,560); cur=[900,560];
// S07: click Normandy in "This week's 10"
const item = app.locator('li button[data-id="s3"]').first(); const ib = await box(item); log.boxes.list_item = ib;
log.boxes.list_panel = await box(item.locator('xpath=ancestor::ul[1]'));
await page.screenshot({ path:`${OUT}/map_list.png` });
await startCast('select_cast'); await page.waitForTimeout(500);
await moveTo(ib[0]+ib[2]*0.5, ib[1]+ib[3]/2, 500, 'to_normandy'); await page.waitForTimeout(350); await click('normandy'); await page.waitForTimeout(2600);
await moveTo(760, 980, 350, 'to_empty_map'); await page.waitForTimeout(900);
log.notes.push('select_cast frames: '+await stopCast());
// S08 / S10: case top + pin position
await page.waitForTimeout(500);
log.boxes.pin = await box(app.locator('#g-sites .site[data-id="s3"]'));
log.boxes.case_headline = await box(side.locator('.dossier-h').first());
log.boxes.case_street = await box(side.getByText(/Normandy St, 02121/).first());
await page.screenshot({ path:`${OUT}/case_top.png` });
// S11: sources line in view
const srcEl = side.getByText(/Sources: Boston 311 \(2024/).first(); await srcEl.evaluate(e=>e.scrollIntoView({block:'end'})); await page.waitForTimeout(900);
log.boxes.source_line = await box(srcEl); log.boxes.drivers_eyebrow = await box(side.getByText(/What feeds it/).first());
await page.screenshot({ path:`${OUT}/case_sources.png` });
// S12: recommendation
const reco = side.locator('.action.escalate').first(); await reco.evaluate(e=>e.scrollIntoView({block:'center'})); await page.waitForTimeout(900);
log.boxes.reco_card = await box(reco); log.boxes.reco_title = await box(reco.locator('.t-title')); const ab = await box(reco.locator('[data-approve]')); log.boxes.approve = ab;
await page.screenshot({ path:`${OUT}/case_reco.png` });
// S13/S14: approve
await startCast('approve_cast'); await page.waitForTimeout(600);
await moveTo(ab[0]+ab[2]/2, ab[1]+ab[3]/2, 450, 'to_approve'); await page.waitForTimeout(350); await click('approve'); await page.waitForTimeout(400);
await moveTo(ab[0]+ab[2]/2+140, ab[1]+ab[3]/2+60, 400, 'away'); await page.waitForTimeout(2800);
log.notes.push('approve_cast frames: '+await stopCast());
const sheet = page.locator('.sheet').first(); log.boxes.sheet = await box(sheet); log.boxes.wo_title = await box(sheet.locator('#wo-title')); log.boxes.wo_draft = await box(sheet.getByText(/Draft — for inspector use/).first()); log.boxes.seal = await box(sheet.locator('.seal'));
await page.screenshot({ path:`${OUT}/work_order.png` });
// S29: close sheet, approved card visible with map
writeFileSync(`${OUT}/log.json`, JSON.stringify(log,null,1));
try { await page.locator('[data-close-sheet]').first().click({timeout:5000}); } catch(e) { await page.keyboard.press('Escape'); } await page.waitForTimeout(800);
log.boxes.approved_line = await box(side.getByText(/Approved · follow up/).first());
await page.screenshot({ path:`${OUT}/approved.png` });
writeFileSync(`${OUT}/log.json`, JSON.stringify(log,null,1));
console.log(JSON.stringify({boxes:log.boxes, notes:log.notes},null,1));
await browser.close();
