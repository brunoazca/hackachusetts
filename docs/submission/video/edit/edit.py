#!/usr/bin/env python3
"""Render the Piper demo from docs/submission/shot-plan.json.
Sources: Retina captures of the deployed app and of the patched Piper mockup (Playwright + CDP),
the three animation slices, and the generated cards. Camera crops, cursor and callouts share the
source coordinate system; captions and tags are drawn in output space. ffmpeg + headless Chrome only."""
import json, subprocess, pathlib, math, sys, os

ROOT = pathlib.Path('/Users/guilhermeavila/Desktop/ProjetosOficial/Hackachusetts/hackachusetts')
PLAN = json.load(open(ROOT / 'docs/submission/shot-plan.json'))
S = pathlib.Path(__file__).parent                      # scratchpad/video
RAW = S / 'raw'; CARDS = S / 'cards'; W = S / 'work'; W.mkdir(exist_ok=True)
OUTDIR = ROOT / 'docs/submission/video'; OUTDIR.mkdir(exist_ok=True)
FPS = 60; OW, OH = 1920, 1080
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
APP = json.load(open(RAW / 'app/log.json'))['boxes']
MOCK = json.load(open(RAW / 'mock/log.json'))['boxes']
M = PLAN['motion']
BRASS = '0xC9A55C'

def run(args, quiet=True):
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode: print(' '.join(str(a) for a in args)[:600]); print(r.stderr[-1500:]); sys.exit(1)
    return r

def ease_expr(var, t1, t2):
    """Quintic ease 6u^5-15u^4+10u^3 of var between t1 and t2 (seconds), as an ffmpeg expression."""
    if t2 <= t1: return f'if(lt({var},{t1}),0,1)'
    u = f'clip(({var}-{t1})/({t2-t1}),0,1)'
    return f'(6*pow({u},5)-15*pow({u},4)+10*pow({u},3))'

# ---------- geometry ----------
def box169(cx, cy, w, bounds):
    """16:9 box of width w centred at (cx,cy), clamped inside bounds=[x,y,W,H]."""
    h = w * 9 / 16; bx, by, bw, bh = bounds
    x = min(max(cx - w/2, bx), bx + bw - w); y = min(max(cy - h/2, by), by + bh - h)
    return [x, y, w, h]
def center(b): return (b[0] + b[2]/2, b[1] + b[3]/2)

# ---------- text PNGs (captions, labels, tags) ----------
CSS = """<style>*{box-sizing:border-box}html,body{margin:0;background:transparent;overflow:hidden;width:%dpx;height:%dpx}
body{font-family:"Atkinson Hyperlegible Next","Atkinson Hyperlegible",-apple-system,"Helvetica Neue",Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.cap{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:center}
.cap span{display:inline-block;max-width:%dpx;font-size:%dpx;line-height:1.3;color:#EDE6DA;background:rgba(15,13,12,.82);padding:10px 22px;border-radius:8px;text-align:center}
.lab{position:absolute;left:0;top:0;font-size:%dpx;line-height:1.2;color:#EDE6DA;background:rgba(15,13,12,.85);border:2px solid #C9A55C;border-radius:8px;padding:6px 12px;white-space:nowrap}
.lane{position:absolute;left:0;top:0;font-size:%dpx;color:#EDE6DA;background:rgba(15,13,12,.85);border-left:4px solid #C9A55C;padding:10px 18px;white-space:nowrap}
</style>"""
_png_cache = {}
def text_png(kind, text, scale=1):
    key = (kind, text, scale)
    if key in _png_cache: return _png_cache[key]
    n = len(_png_cache); out = W / f'txt_{n}.png'; html = W / f'txt_{n}.html'
    if kind == 'cap': w, h = OW, 140; body = f'<div class="cap"><span>{text}</span></div>'
    elif kind == 'lab': w, h = 1400*scale, 80*scale; body = f'<div class="lab">{text}</div>'
    else: w, h = 1400*scale, 90*scale; body = f'<div class="lane">{text}</div>'
    css = CSS % (w, h, int(OW*0.7), 34, int(26*scale), int(30*scale))
    html.write_text(f'<!doctype html><html><head><meta charset="utf-8">{css}</head><body>{body}</body></html>')
    run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', f'--window-size={int(w)},{int(h)}', '--default-background-color=00000000', f'--screenshot={out}', f'file://{html}'])
    _png_cache[key] = out; return out

# ---------- cast (VFR jpeg frames) -> CFR mp4 ----------
def cast_to_video(dir_, out, size):
    frames = json.load(open(dir_ / 'frames.json'))
    lst = dir_ / 'list.txt'; txt = ''
    for i, f in enumerate(frames):
        d = (frames[i+1]['t'] - f['t']) if i + 1 < len(frames) else 1/30
        txt += f"file '{f['file']}'\nduration {max(d, 0.001):.4f}\n"
    txt += f"file '{frames[-1]['file']}'\n"; lst.write_text(txt)
    run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-vf', f'fps={FPS},scale={size[0]}:{size[1]}', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', '-pix_fmt', 'yuv420p', out])
    return frames[0]['t']

# ---------- segment builder ----------
ENC = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', str(FPS)]

def segment(sid, dur, src, src_kind, *, dpr=1, cam=None, cursor=None, clicks=(), callouts=(), overlays=(), proto=False):
    """src_kind: 'png' | 'video' | 'anim'. cam=[(0, boxA, 0), (t_move, boxB, ms)] in CSS px (dpr-scaled here).
    cursor: list of legs (t0, t1, (x0,y0), (x1,y1)) in CSS px; shown from the first leg's t0 to end (or hidden after a leg tagged hide).
    callouts: (box_css, t_in, t_out, label). overlays: (png, t_in, t_out, x, y, fade_in) in output space."""
    out = W / f'{sid}.mp4'
    if out.exists() and os.environ.get('REUSE'): return out
    inputs = ['-loop', '1', '-framerate', str(FPS), '-i', str(src)] if src_kind == 'png' else ['-i', str(src)]
    fc = []; cur = '[0:v]'; nin = 1
    if dpr != 1 or src_kind == 'png':
        fc.append(f'{cur}format=rgba[s0]'); cur = '[s0]'
    # cursor in source space
    if cursor:
        inputs += ['-loop', '1', '-framerate', str(FPS), '-i', str(CARDS / 'cursor.png')]; ci = nin; nin += 1
        sc = 1.35 * dpr / 1.35  # cursor.png is already drawn at 1.35x of a 24px arrow at 1x
        fc.append(f'[{ci}:v]scale=iw*{sc}:ih*{sc}[cur]')
        xs, ys = [], []
        legs = sorted(cursor, key=lambda l: l[0])
        def path(axis):
            e = str(legs[0][2][axis] * dpr)
            for leg in legs:
                t0, t1, a, b = leg[:4]
                E = ease_expr('t', t0, t1)
                e = f'if(lt(t,{t0}),{e},{a[axis]*dpr}+({(b[axis]-a[axis])*dpr})*{E})'
            return e
        t_show = legs[0][0]; t_hide = [l for l in legs if len(l) > 4 and l[4] == 'hide']
        enable = f'gte(t,{t_show})' + (f'*lt(t,{t_hide[0][1]})' if t_hide else '')
        fc.append(f"{cur}[cur]overlay=x='{path(0)}':y='{path(1)}':enable='{enable}':format=auto[c1]"); cur = '[c1]'
        for k, (tc, (cx, cy)) in enumerate(clicks):
            inputs += ['-loop', '1', '-framerate', str(FPS), '-i', str(CARDS / 'click.png')]; ki = nin; nin += 1
            fc.append(f'[{ki}:v]scale=iw*{dpr}:ih*{dpr}[k{k}]')
            fc.append(f"{cur}[k{k}]overlay=x={cx*dpr-24*dpr}:y={cy*dpr-24*dpr}:enable='between(t,{tc},{tc+0.16})':format=auto[ck{k}]"); cur = f'[ck{k}]'
    # callouts in source space: brass outline + label above the box
    for k, (bx, t_in, t_out, label) in enumerate(callouts):
        x, y, w, h = [v * dpr for v in bx]; pad = 6 * dpr
        fc.append(f"{cur}drawbox=x={x-pad}:y={y-pad}:w={w+2*pad}:h={h+2*pad}:color={BRASS}@1:t={2*dpr}:enable='between(t,{t_in},{t_out})'[co{k}]"); cur = f'[co{k}]'
        if label:
            lp = text_png('lab', label, dpr); inputs += ['-loop', '1', '-framerate', str(FPS), '-i', str(lp)]; li = nin; nin += 1
            fc.append(f"{cur}[{li}:v]overlay=x={x-pad}:y={max(0, y-pad-44*dpr-8*dpr)}:enable='between(t,{t_in},{t_out})':format=auto[cl{k}]"); cur = f'[cl{k}]'
    # camera (zoompan): cam = [(t, box, ms), ...] in CSS px; the first entry is the starting frame
    if cam:
        keys = [(t, [v*dpr for v in b], ms) for (t, b, ms) in cam]
        var = 'on/60' if src_kind == 'png' else 'in/60'
        def piece(idx):
            e = str(keys[0][1][idx])
            for (tk, bk, ms), (_, bp, _) in zip(keys[1:], keys[:-1]):
                E = ease_expr(var, tk, tk + ms/1000)
                e = f'if(lt({var},{tk}),{e},{bp[idx]}+({bk[idx]-bp[idx]})*{E})'
            return e
        z = f"(iw/({piece(2)}))"; x = f"({piece(0)})"; y = f"({piece(1)})"
        d = int(round(dur*FPS)) if src_kind == 'png' else 1
        fc.append(f"{cur}zoompan=z='{z}':x='{x}':y='{y}':d={d}:s={OW}x{OH}:fps={FPS}[zp]"); cur = '[zp]'
    else:
        fc.append(f'{cur}scale={OW}:{OH}:flags=lanczos[zp]'); cur = '[zp]'
    # output-space overlays (prototype tag, wordmarks)
    for k, (png, t_in, t_out, x, y, fade) in enumerate(overlays):
        inputs += ['-loop', '1', '-framerate', str(FPS), '-i', str(png)]; oi = nin; nin += 1
        f = f'[{oi}:v]format=rgba' + (f',fade=t=in:st={t_in}:d={fade}:alpha=1' if fade else '') + f'[ov{k}]'
        fc.append(f); fc.append(f"{cur}[ov{k}]overlay=x={x}:y={y}:enable='between(t,{t_in},{t_out})':format=auto[o{k}]"); cur = f'[o{k}]'
    fc.append(f'{cur}format=yuv420p,fps={FPS}[v]')
    run(['ffmpeg', '-y', '-loglevel', 'error', *inputs, '-filter_complex', ';'.join(fc), '-map', '[v]', '-t', f'{dur:.3f}', *ENC, '-an', str(out)])
    return out

def still_from_video(video, at, out):
    run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{at}', '-i', str(video), '-frames:v', '1', str(out)]); return out

def dissolve(a, b, ms, out):
    """Replace the last/first ms/2 of a and b with a cross-dissolve: returns (a', xf, b')."""
    da = float(run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(a)]).stdout.strip())
    db = float(run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(b)]).stdout.strip())
    d = ms / 1000
    run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(a), '-i', str(b), '-filter_complex', f'[0:v][1:v]xfade=transition=fade:duration={d}:offset={da-d:.3f},format=yuv420p[v]', '-map', '[v]', *ENC, '-an', str(out)])
    return out

# ---------- shots ----------
shots = {s['id']: s for s in PLAN['shots']}
def T(sid): s = shots[sid]; return s['start_time'], s['end_time'], s['end_time'] - s['start_time']
segs = []  # (sid, path)

# S01 + S02: animation logo slice with wordmark, then freeze with tagline
t0, t1, d = T('S01')
anim = RAW / 'anim_logo.mp4'
segs.append(('S01', segment('S01', d, anim, 'anim', overlays=[(CARDS/'wm_piper.png', 0.8, 99, 0, 0, 0.6)])))
t0, t1, d = T('S02'); last = still_from_video(anim, 3.5, W / 'S01_last.png')
segs.append(('S02', segment('S02', d, last, 'png', overlays=[(CARDS/'wm_tag.png', 0.0, 99, 0, 0, 0.5)])))

# S03/S04: real app, Act mode context (DPR2 still); cursor appears at rest in S04
ctx_png = RAW / 'app/act_context.png'; FULL = [0, 0, 1920, 1080]
ctx2_png = RAW / 'app2/places_context.png'   # redesigned Piper deployment (captured after the first render started)
t0, t1, d = T('S03'); segs.append(('S03', segment('S03', d + 0.4, ctx2_png, 'png', dpr=2)))
t0, t1, d = T('S04'); segs.append(('S04', segment('S04', d, ctx2_png, 'png', dpr=2, cursor=[(0.3, 0.31, (1100, 600), (1100, 600))])))
# S05: news wall slate (screenshots not available in the repo)
t0, t1, d = T('S05'); segs.append(('S05', segment('S05', d, CARDS/'S05_newswall_slate.png', 'png')))
# S06: paradox slice (stops at 7.8 s)
t0, t1, d = T('S06'); segs.append(('S06', segment('S06', d, RAW/'anim_paradox.mp4', 'anim')))

# ---- mockup shots (Prototype) ----
FR = MOCK['frame']; FR169 = [FR[0], FR[1] + (FR[3] - FR[2]*9/16)/2, FR[2], FR[2]*9/16]   # 16:9 window inside the 1280x800 frame
PROTO = (CARDS/'proto.png', 0, 999, 0, 0, 0)
# S07: select Normandy in the list (mock select_cast, DPR2): zoom to the list at 32.5 (shot-relative 0.7), cursor to the row, click, zoom out at 34.8 (3.0)
t0, t1, d = T('S07')
sel_video = W / 'select_cast.mp4'; cast_t0 = cast_to_video(RAW/'mock/select_cast', sel_video, (3840, 2160))
ev = json.load(open(RAW/'mock/log.json'))['events']; t_click = next(e['t'] for e in ev if e['type']=='click' and e['tag']=='normandy') - cast_t0
li = MOCK['list_item']; lp = MOCK['list_panel'] or li
listbox = box169(*center(lp), FR[2]/1.4, FR169)
# align the capture so the click lands at 2.7 s into the shot (34.5 on the timeline)
shift = t_click - 2.7
run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{max(shift,0):.3f}', '-i', str(sel_video), '-t', f'{d:.3f}', *ENC, '-an', str(W/'S07_src.mp4')])
cur_rest = (FR[0] + 480, FR[1] + 560)
segs.append(('S07', segment('S07', d, W/'S07_src.mp4', 'video', dpr=2,
    cam=[(0, FR169, 0), (0.7, listbox, M['zoom_in_ms']), (3.0, FR169, M['zoom_out_ms'])],      # starts zoomed on the list (zoom-in happened on the cut), zooms out for the fly
    cursor=[(0.9, 1.4, cur_rest, center(li)), (2.9, 3.25, center(li), (FR[0]+460, FR[1]+690))], clicks=[(2.7, center(li))],
    overlays=[PROTO])))
# S08: case panel top, zoom to it at 42.0 (shot-relative 2.5)
t0, t1, d = T('S08'); side = MOCK['side']
casebox = box169(side[0] + side[2]/2, side[1] + 200, FR[2]/1.4, FR169)
segs.append(('S08', segment('S08', d, RAW/'mock/case_top.png', 'png', dpr=2, cam=[(0, FR169, 0), (2.5, casebox, M['zoom_in_ms'])], overlays=[PROTO])))
# S09: reveal slice
t0, t1, d = T('S09'); segs.append(('S09', segment('S09', d, RAW/'anim_reveal.mp4', 'anim')))
# S10: match-cut: live pin at the same screen point as the animation's pin (960, 560)
t0, t1, d = T('S10'); pin = MOCK['pin']; pc = center(pin); w = FR[2]/1.3; h = w*9/16
pinbox = [min(max(pc[0] - 0.5*w, FR169[0]), FR169[0]+FR169[2]-w), min(max(pc[1] - (560/1080)*h, FR169[1]), FR169[1]+FR169[3]-h), w, h]
segs.append(('S10', segment('S10', d, RAW/'mock/case_top.png', 'png', dpr=2, cam=[(0, pinbox, 0), (0, pinbox, 1)], overlays=[PROTO])))
# S11: timeline, drivers and the source line, brass outline on the source line
t0, t1, d = T('S11'); srcl = MOCK['source_line']
srcbox = box169(side[0] + side[2]/2, srcl[1] - 160, FR[2]/1.5, FR169)
segs.append(('S11', segment('S11', d, RAW/'mock/case_sources.png', 'png', dpr=2, cam=[(0, srcbox, 0), (0, srcbox, 1)],
    callouts=[(srcl, 1.5, 6.5, 'The city\'s own records, cited')], overlays=[PROTO])))
# S12: recommendation
t0, t1, d = T('S12'); reco = MOCK['reco_card']; ab = MOCK['approve']
recobox = box169(side[0] + side[2]/2, reco[1] + reco[3]/2, FR[2]/1.5, FR169)
segs.append(('S12', segment('S12', d, RAW/'mock/case_reco.png', 'png', dpr=2, cam=[(0, recobox, 0), (0, recobox, 1)],
    cursor=[(0.0, 0.01, cur_rest, cur_rest)], overlays=[PROTO])))
# S13: reframe to include the sheet landing zone, cursor to Approve, click at 2.2 (82.7)
t0, t1, d = T('S13'); sheet = MOCK['sheet']
landbox = box169((sheet[0] + sheet[2]/2 + ab[0] + ab[2]/2)/2, (sheet[1] + 260), FR[2]/1.4, FR169)
segs.append(('S13', segment('S13', d, RAW/'mock/case_reco.png', 'png', dpr=2, cam=[(0, recobox, 0), (0.0, landbox, 500)],
    cursor=[(1.15, 1.6, cur_rest, center(ab))], clicks=[(2.2, center(ab))],
    callouts=[(ab, 0.6, 3.0, 'A human approves every action')], overlays=[PROTO])))
# S14: work order sheet (still after the click; the capture's sheet animation was too choppy to use), short dissolve from S13's last frame
t0, t1, d = T('S14')
wo = segment('S14', d, RAW/'mock/work_order.png', 'png', dpr=2, cam=[(0, landbox, 0), (0, landbox, 1)],
    cursor=[(0.0, 0.4, center(ab), (ab[0]+ab[2]/2+140, ab[1]+ab[3]/2+60), 'hide')], overlays=[PROTO])
segs.append(('S14', wo))
# S15: parcel card is not built in the app or the mockup -> cut; hold the work order instead
t0, t1, d = T('S15'); segs.append(('S15', segment('S15', d, RAW/'mock/work_order.png', 'png', dpr=2, cam=[(0, landbox, 0), (0, landbox, 1)], overlays=[PROTO])))
# S16: impact card
t0, t1, d = T('S16'); segs.append(('S16', segment('S16', d, CARDS/'S16_impact.png', 'png')))
# S17: Assess + forecast: before/after stills (map screencast too choppy), cursor path from the plan
t0, t1, d = T('S17'); am = APP['mode_assess']; tg = APP['forecast_toggle']
before = segment('S17a', 1.8, ctx_png, 'png', dpr=2, cursor=[(0.3, 0.9, (1100, 600), center(am))], clicks=[(0.9, center(am))])
after = segment('S17b', d - 1.8 + 0.4, RAW/'app/assess_forecast.png', 'png', dpr=2, cursor=[(0.0, 0.45, center(am), center(tg)), (0.9, 1.3, center(tg), (1100, 900))], clicks=[(0.6, center(tg))])
segs.append(('S17', dissolve(before, after, 400, W/'S17.mp4')))
# S18: layer panel hover, brass outline on the tested label
t0, t1, d = T('S18'); lr = APP['layer_row']; tl = APP['tested_label']
laybox = box169(lr[0] + 400, lr[1] + 20, 1920/1.5, FULL)
segs.append(('S18', segment('S18', d, RAW/'app/layer_hover.png', 'png', dpr=2, cam=[(0, FULL, 0), (0.0, laybox, M['zoom_in_ms'])],
    cursor=[(0.0, 0.45, (1100, 900), (lr[0] + 40, lr[1] + lr[3]/2)), (5.2, 5.55, (lr[0] + 40, lr[1] + lr[3]/2), (lr[0] + 600, lr[1] - 100))],
    callouts=[(tl, 2.5, 5.5, 'We label what doesn\'t work')])))
# S19: signals card
t0, t1, d = T('S19'); segs.append(('S19', segment('S19', d, CARDS/'S19_signals.png', 'png')))
# S20: emerging block card: cut to context, cursor to the block, click, zoom to the card
t0, t1, d = T('S20'); ce = APP['cell_emerging']; pt = (820, 220); est = APP['cell_estimate']
cellbox = box169(1920 - 1371/2 + 60, ce[1] + 120, 1920/1.4, FULL)
segs.append(('S20', segment('S20', d, RAW/'app/cell_card.png', 'png', dpr=2, cam=[(0, FULL, 0), (2.1, cellbox, M['zoom_in_ms'])],
    cursor=[(0.4, 1.0, (1100, 900), pt), (2.4, 2.7, pt, (pt[0]+180, pt[1]+120), 'hide')], clicks=[(1.7, pt)],
    callouts=[(ce, 3.3, 8.5, 'Risk before the reports')])))
# S21 + S22: cards; S23 (Prove) is not built -> cut, S22 holds through its slot
t0, t1, d = T('S21'); segs.append(('S21', segment('S21', d, CARDS/'S21_matched.png', 'png')))
t0, t1, d = T('S22'); d23 = T('S23')[2]; segs.append(('S22', segment('S22', d + d23, CARDS/'S22_history.png', 'png')))
# S24-S27: Kiro slates (recordings are in Drive, not in the repo)
for sid in ['S24', 'S25', 'S26', 'S27']:
    t0, t1, d = T(sid); segs.append((sid, segment(sid, d, CARDS/f'{sid}_slate.png', 'png')))
# S28: counts; S29: approved action on the mock map; S30: title
t0, t1, d = T('S28'); segs.append(('S28', segment('S28', d, CARDS/'S28_counts.png', 'png')))
t0, t1, d = T('S29'); segs.append(('S29', segment('S29', d, RAW/'mock/approved.png', 'png', dpr=2, cam=[(0, FR169, 0), (0, FR169, 1)], overlays=[PROTO])))
t0, t1, d = T('S30'); segs.append(('S30', segment('S30', d, CARDS/'S30_title.png', 'png')))

# ---------- assemble: S02 -> S03 dissolve (400 ms), then concat ----------
order = [p for _, p in segs]
i02 = [i for i, (sid, _) in enumerate(segs) if sid == 'S02'][0]
merged = dissolve(order[i02], order[i02+1], 400, W/'S02S03.mp4')
order = order[:i02] + [merged] + order[i02+2:]
lst = W / 'concat.txt'; lst.write_text(''.join(f"file '{p}'\n" for p in order))
video = W / 'video.mp4'
run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', video])

# ---------- captions (output space, global time) + label lane + SRT ----------
lines = [(l['start'], l['text']) for sh in PLAN['shots'] for l in (sh.get('narration') or [])]
lines.sort()
def srt_t(t): ms = int(round(t*1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000); return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
inputs = ['-i', str(video)]; fc = []; cur = '[0:v]'; srt = []; n = 1
for i, (t, text) in enumerate(lines):
    dur = max(1.2, len(text) / 16); end = min(t + dur, lines[i+1][0] - 0.1 if i + 1 < len(lines) else t + dur)
    png = text_png('cap', text); inputs += ['-loop', '1', '-framerate', str(FPS), '-i', str(png)]
    fc.append(f"{cur}[{n}:v]overlay=x=0:y={OH-140}:enable='between(t,{t:.2f},{end:.2f})':format=auto[c{i}]"); cur = f'[c{i}]'; n += 1
    srt.append(f'{len(srt)+1}\n{srt_t(t)} --> {srt_t(end)}\n{text}\n')
lane = text_png('lane', 'Every count is a 311 report, not a rat.'); inputs += ['-loop', '1', '-framerate', str(FPS), '-i', str(lane)]
fc.append(f"{cur}[{n}:v]overlay=x=24:y={OH-140-70}:enable='between(t,13.0,19.5)':format=auto[lane]"); cur = '[lane]'; n += 1
fc.append(f'{cur}format=yuv420p[v]')
final = OUTDIR / 'piper-demo.mp4'
run(['ffmpeg', '-y', '-loglevel', 'error', *inputs, '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-filter_complex', ';'.join(fc),
     '-map', '[v]', '-map', f'{n}:a', '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', str(FPS),
     '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', str(final)])
(OUTDIR / 'piper-demo.en.srt').write_text('\n'.join(srt))
print(run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_name,width,height,r_frame_rate:format=duration', '-of', 'compact', str(final)]).stdout)
