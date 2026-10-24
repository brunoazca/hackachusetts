// S17 at 1x (camera stays at context), so the screencast runs at a usable frame rate.
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
const OUT = process.argv[2]; mkdirSync(OUT,{recursive:true});
const browser = await chromium.launch({ channel:'chrome', headless:true, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport:{width:1920,height:1080}, deviceScaleFactor:1 });
const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
const log = { events:[], boxes:{} }; const T0=Date.now(); const now=()=>(Date.now()-T0)/1000; const ease=u=>6*u**5-15*u**4+10*u**3; let cur=[1100,600];
async function moveTo(x,y,ms,tag){ const [x0,y0]=cur; const n=Math.max(6,Math.round(ms/16)); for(let i=1;i<=n;i++){ const e=ease(i/n); const px=x0+(x-x0)*e, py=y0+(y-y0)*e; await page.mouse.move(px,py); log.events.push({t:now(),type:'move',x:px,y:py,tag}); await page.waitForTimeout(ms/n);} cur=[x,y]; }
async function click(tag){ log.events.push({t:now(),type:'click',x:cur[0],y:cur[1],tag}); await page.mouse.down(); await page.waitForTimeout(60); await page.mouse.up(); }
const frames=[]; cdp.on('Page.screencastFrame', async ({data,sessionId})=>{ const f=`${OUT}/f${String(frames.length).padStart(5,'0')}.jpg`; frames.push({t:now(),file:f}); writeFileSync(f,Buffer.from(data,'base64')); await cdp.send('Page.screencastFrameAck',{sessionId}).catch(()=>{}); });
await page.goto('https://piper-app.vercel.app/', { waitUntil:'networkidle', timeout:60000 }); await page.waitForTimeout(6000);
await page.getByText('Act',{exact:true}).first().click({force:true}); await page.waitForTimeout(3000); await page.mouse.move(1100,600);
const ab = await page.getByText('Assess',{exact:true}).first().boundingBox(); log.boxes.assess=[ab.x,ab.y,ab.width,ab.height];
await cdp.send('Page.startScreencast',{format:'jpeg',quality:88,maxWidth:1920,maxHeight:1080,everyNthFrame:1}); log.events.push({t:now(),type:'cast_start'});
await page.waitForTimeout(600);
await moveTo(ab.x+ab.width/2, ab.y+ab.height/2, 600, 'to_assess'); await page.waitForTimeout(350); await click('assess'); await page.waitForTimeout(900);
const cb = await page.locator('input[type=checkbox]').first().boundingBox(); log.boxes.toggle=[cb.x,cb.y,cb.width,cb.height];
await moveTo(cb.x+cb.width/2, cb.y+cb.height/2, 450, 'to_forecast'); await page.waitForTimeout(350); await click('forecast'); await page.waitForTimeout(4500);
await moveTo(1100, 900, 400, 'rest'); await page.waitForTimeout(1500);
await cdp.send('Page.stopScreencast'); log.events.push({t:now(),type:'cast_stop'});
writeFileSync(`${OUT}/frames.json`, JSON.stringify(frames)); writeFileSync(`${OUT}/log.json`, JSON.stringify(log,null,1));
console.log('S17 frames', frames.length, 'over', frames.at(-1).t - frames[0].t, 's');
await browser.close();
