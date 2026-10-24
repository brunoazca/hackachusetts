#!/usr/bin/env python3
"""Render the static cards and overlays for the Piper demo as PNG (1920x1080) with headless Chrome."""
import subprocess, pathlib, sys
OUT = pathlib.Path(__file__).parent / 'cards'; OUT.mkdir(exist_ok=True)
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
CSS = """<style>
:root{--soot:#0F0D0C;--bone:#EDE6DA;--brass:#C9A55C;--verm:#F0643C;--delft:#8FAEE0;--ox:#7A1E2C;--fg2:rgba(237,230,218,.68)}
*{box-sizing:border-box} html,body{margin:0;width:1920px;height:1080px;overflow:hidden}
body{background:var(--soot);color:var(--bone);font-family:"Atkinson Hyperlegible Next","Atkinson Hyperlegible",-apple-system,"Helvetica Neue",Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
body.clear{background:transparent}
.display{font-family:"Bodoni Moda","Bodoni 72","Didot",serif;font-style:italic;font-weight:500}
.mono{font-family:"Atkinson Hyperlegible Mono",Menlo,"SF Mono",monospace;letter-spacing:.14em;text-transform:uppercase}
.center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 180px}
.big{font-size:88px;line-height:1.1;font-weight:700;letter-spacing:-.02em;max-width:1500px}
.sub{font-size:40px;color:var(--fg2);margin-top:34px;line-height:1.35;max-width:1400px}
.eyebrow{font-size:22px;color:var(--brass);margin-bottom:34px}
.foot{position:absolute;bottom:72px;left:120px;right:120px;font-size:24px;color:rgba(237,230,218,.55)}
.bars{width:1360px;margin-top:40px}
.bar{display:grid;grid-template-columns:560px 1fr 150px;align-items:center;gap:28px;margin:22px 0;font-size:34px}
.bar .lab{text-align:right;color:var(--bone)}
.bar .trk{height:30px;background:rgba(237,230,218,.08);border-radius:6px;overflow:hidden}
.bar .fil{height:100%;background:var(--brass);border-radius:6px}
.bar .fil.null{background:rgba(237,230,218,.25)}
.bar .val{font-variant-numeric:tabular-nums;font-weight:700;text-align:left}
.kv{display:flex;gap:80px;justify-content:center;flex-wrap:wrap;margin-top:30px}
.kv div{min-width:230px;text-align:center}
.kv .n{font-size:96px;font-weight:700;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.kv .l{font-size:24px;color:var(--fg2);margin-top:6px}
.wm{position:absolute;left:0;right:0;top:96px;text-align:center}
.wm .name{font-size:150px;color:var(--brass);line-height:1}
.wm .tagline{font-size:46px;color:var(--bone);margin-top:10px}
.proto{position:absolute;top:28px;right:28px;font-size:22px;color:var(--bone);background:rgba(15,13,12,.85);border:1.5px solid var(--brass);border-radius:8px;padding:8px 16px;letter-spacing:.12em;text-transform:uppercase}
.slate{position:absolute;inset:48px;border:2px dashed rgba(237,230,218,.22);border-radius:18px}
.tag{position:absolute;top:84px;left:96px;font-size:22px;color:var(--brass)}
.cursor{position:absolute;left:0;top:0}
</style>"""
def card(name, body, clear=False):
    html = OUT / f'{name}.html'; png = OUT / f'{name}.png'
    html.write_text(f'<!doctype html><html><head><meta charset="utf-8">{CSS}</head><body class="{"clear" if clear else ""}">{body}</body></html>')
    args = [CHROME,'--headless=new','--disable-gpu','--hide-scrollbars','--window-size=1920,1080',f'--screenshot={png}']
    if clear: args.append('--default-background-color=00000000')
    subprocess.run(args+[f'file://{html}'], check=True, capture_output=True); html.unlink(); print('card', png.name)

def bar(lab, val, pct, null=False):
    return f'<div class="bar"><div class="lab">{lab}</div><div class="trk"><div class="fil {"null" if null else ""}" style="width:{pct}%"></div></div><div class="val">{val}</div></div>'

card('wm_piper', '<div class="wm"><div class="display name">Piper</div></div>', True)
card('wm_tag', '<div class="wm"><div class="display name">Piper</div><div class="display tagline">Follow the rats.</div></div>', True)
card('proto', '<div class="proto">Prototype</div>', True)
card('S05_newswall_slate', '<div class="slate"></div><div class="tag mono">S05 · news wall · to assemble</div><div class="center"><div class="big">Rats are in the news.</div><div class="sub">Tile the 22 headline screenshots from Drive / Hackachusetts / NewsPrints here. Screenshots only, never retyped.</div></div>')
card('S16_impact', '<div class="center"><div class="eyebrow mono">Impact · data-audit, Oct 24 2026</div><div class="big"><span style="color:var(--verm)">49%</span> of schools sit near top rat blocks</div><div class="sub">35% for blocks overall · <b style="color:var(--bone)">$776K+</b> city pest-control spend, FY2026</div></div><div class="foot">Sources: 66 of 134 schools in or beside a top-10% rodent cell (2024–26) · Boston Checkbook FY2026, vendor-name match (lower bound)</div>')
card('S19_signals', '<div class="center"><div class="eyebrow mono">What predicts rodent reports · ward-month cells</div><div class="bars">'+bar('Warm months → more reports','+0.87',87)+bar("Last year's reports here",'+0.32',32)+bar('Trash stored badly','+0.18',18)+bar('Dead-animal reports','+0.14',14)+bar('Indoor-pest reports','+0.11',11)+'</div><div class="sub" style="margin-top:44px">Heat says when. History says where.</div></div>')
card('S21_matched', '<div class="center"><div class="eyebrow mono">Matched test · citation or abatement vs monitoring</div><div class="big">Risk ratio <span style="color:var(--bone)">1.03</span></div><div class="sub">95% CI 0.89–1.20 · No clear difference, in every year.</div></div>')
card('S22_history', '<div class="center"><div class="eyebrow mono">Return within 60 days</div><div class="bars">'+bar('No prior reports','8–12%',12)+bar('5+ prior reports','56–75%',75)+'</div><div class="sub" style="margin-top:44px">History says where.</div></div>')
card('S28_counts', '<div class="center"><div class="eyebrow mono">Built with Kiro · spec first</div><div class="kv"><div><div class="n">8</div><div class="l">hooks</div></div><div><div class="n">6</div><div class="l">agents</div></div><div><div class="n">7</div><div class="l">steering files</div></div><div><div class="n">5</div><div class="l">specs</div></div><div><div class="n">8</div><div class="l">MCP servers</div></div><div><div class="n">159</div><div class="l">logged work entries</div></div></div></div>')
card('S30_title', '<div class="center"><div class="display" style="font-size:160px;color:var(--brass);line-height:1">Piper</div><div class="display" style="font-size:56px;color:var(--bone);margin-top:6px">Rat Audit Boston</div><div class="display" style="font-size:46px;color:var(--bone);margin-top:48px">Follow the rats.</div></div>')
def slate(sid, title, note):
    card(f'{sid}_slate', f'<div class="slate"></div><div class="tag mono">{sid} · Kiro · to record</div><div class="center"><div class="big">{title}</div><div class="sub">{note}</div></div>')
slate('S24','.kiro/specs/rat-audit/','Tree open with v2-spec.md. Static. Real system cursor, still.')
slate('S25','accessibility-check hook','Save a UI file; the hook fires. Static.')
slate('S26','civic-judge.json','The judge agent and its review output. Static.')
slate('S27','boston-opendata MCP call','A tool call returning data.boston.gov rows. Static.')
# cursor (1.35x of a 24px arrow => 32px tall), transparent
card('cursor', '<svg class="cursor" width="40" height="48" viewBox="0 0 24 28"><path d="M2 2 L2 22 L7.5 17 L11 25 L14.5 23.5 L11 15.5 L18 15.5 Z" fill="#111" stroke="#F2F3F1" stroke-width="1.6" stroke-linejoin="round"/></svg>', True)
