// Record a slice of the animation in real time through CDP screencast, then mux to MP4 with ffmpeg.
// usage: node cast.mjs <url> <seconds> <out.mp4>
import { spawn, execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const [url, secs, out] = process.argv.slice(2);
const port = 9400 + Math.floor(Math.random()*90);
const prof = mkdtempSync('/private/tmp/claude-503/-Users-guilhermeavila-Desktop-ProjetosOficial-Hackachusetts-hackachusetts/17b79f18-91e2-4036-96c2-b3228f9730c7/scratchpad/prof-');
const dir = mkdtempSync('/private/tmp/claude-503/-Users-guilhermeavila-Desktop-ProjetosOficial-Hackachusetts-hackachusetts/17b79f18-91e2-4036-96c2-b3228f9730c7/scratchpad/frames-');
const chrome = spawn(CHROME, ['--headless=new','--disable-gpu','--hide-scrollbars','--window-size=1920,1080',`--remote-debugging-port=${port}`,`--user-data-dir=${prof}`,'about:blank'], {stdio:'ignore'});
const sleep = ms => new Promise(r=>setTimeout(r,ms));
let list=[]; for (let i=0;i<50;i++){ try{ list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (list.length) break; }catch{} await sleep(100); }
const page = list.find(t=>t.type==='page');
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r=>ws.onopen=r);
let id=0; const pending={}; const frames=[]; let t0=null;
ws.onmessage = e => { const m=JSON.parse(e.data);
  if(m.id&&pending[m.id]){pending[m.id](m.result);delete pending[m.id];}
  if(m.method==='Page.screencastFrame'){ const {data,metadata,sessionId}=m.params; if(t0===null) t0=metadata.timestamp;
    frames.push({t:metadata.timestamp-t0, data}); send('Page.screencastFrameAck',{sessionId}); } };
const send=(method,params={})=>new Promise(r=>{const i=++id;pending[i]=r;ws.send(JSON.stringify({id:i,method,params}));});
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});
await send('Page.startScreencast',{format:'jpeg',quality:92,maxWidth:1920,maxHeight:1080,everyNthFrame:1});
await send('Page.navigate',{url});
await sleep(secs*1000 + 400);
await send('Page.stopScreencast');
// write frames + concat list with real durations
let listTxt=''; frames.forEach((f,i)=>{ const p=`${dir}/f${String(i).padStart(5,'0')}.jpg`; writeFileSync(p, Buffer.from(f.data,'base64'));
  const next = frames[i+1] ? frames[i+1].t : f.t + 1/30; listTxt += `file '${p}'\nduration ${Math.max(0.001,next-f.t).toFixed(4)}\n`; });
if (frames.length) listTxt += `file '${dir}/f${String(frames.length-1).padStart(5,'0')}.jpg'\n`;
writeFileSync(`${dir}/list.txt`, listTxt);
ws.close(); chrome.kill();
// skip the first ~0.35 s (page load/blank) by trimming in ffmpeg; -ss on concat output
execFileSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',`${dir}/list.txt`,'-vf','fps=30,scale=1920:1080:flags=lanczos,format=yuv420p','-c:v','libx264','-preset','medium','-crf','18','-movflags','+faststart',out]);
const dur = execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',out]).toString().trim();
console.log('frames', frames.length, 'avg fps', (frames.length/secs).toFixed(1), 'out', out, 'duration', dur);
process.exit(0);
