# Piper demo video — render notes

Rendered from `docs/submission/shot-plan.json` (timings, narration) and `docs/submission/video-script.md` §8 (capture and motion direction) on 2026-10-24.

| File | Content |
|---|---|
| `piper-demo.mp4` | 1920×1080, 60 fps, H.264 High, yuv420p, AAC 48 kHz (silent pacing track). 2:55. Captions burned in from the shot plan's narration lines. |
| `piper-demo.en.srt` | The same captions as a sidecar, timed to the shot plan (replace with the recorded voice's timing when it exists). |
| `capture/` | Playwright scripts that drove the deployed app and the Piper mockup, the event logs they wrote (`app-log.json`, `mock-log.json`: measured boxes in CSS px and every cursor move and click with timestamps), the animation screencast script (`cast.mjs`), and `mockup-prototype.patch`. |
| `edit/` | `edit.py` renders the video from `shot-plan.json` with ffmpeg; `cards.py` renders the cards and overlays with headless Chrome; `cards/` holds the rendered PNGs. |

## How the shots were sourced

| Shots | Source | Notes |
|---|---|---|
| S01, S02, S06, S09 | `beat4-animation.html` slices (`?t=23.7`, `?t=0&to=7.8`, `?t=10.3&to=27.3`) | Captured in real time through CDP screencast at 1920×1080 (about 21 fps, resampled to 60). Camera 1.0×, static, as the brief requires. |
| S03, S04, S17, S18, S20 | The deployed app, `https://piper-app.vercel.app` (the URL the brief lists redirects here) | Headless Chrome with software WebGL, 1920×1080 CSS px at `deviceScaleFactor: 2`, so the 1.4–1.5× crops come from 3840×2160 source pixels. Act mode queue with the Live badge (S03/S04), Assess mode with the forecast toggle (S17), the layer panel's tested label "Construction debris · no effect" (S18), and a real **Emerging hotspot** block card in Charlestown (S20). |
| S07, S08, S10, S11, S12, S13, S14, S29 | The Piper mockup (`docs/design/mockup/`, now on `main`), tagged **Prototype** on screen | The deployed app has no Normandy St case in its queue (it is address-level and Normandy St is not Due in the 60-day window) and no Approve, work order or Prove screens. The mockup has the flow. Its illustrative copy for Normandy St was replaced with the approved facts from the script (18 reports, the ladder, the vacant lot classed RES LAND (Unusable), the Rule 2 recommendation and because line, the source line, the draft work order with check-again Dec 23, 2026). Other sites' illustrative counts were hidden. The exact change is `capture/mockup-prototype.patch`. |
| S16, S19, S21, S22, S28, S30 | Cards rendered by `edit/cards.py` | Hamelin palette from the script header. Bodoni (Bodoni 72, the installed stand-in for Bodoni Moda) only on S30 and the S01–S02 wordmark. |
| S05 | Slate | The 22 headline screenshots are in Drive / Hackachusetts / NewsPrints, not in the repo. Drop the news wall over this 4 s slate. |
| S24–S27 | Slates | The Kiro recordings are in Drive / Hackachusetts, not in the repo. Candidates per slate are named on screen. |

## Shots cut or changed (per §8.4: never fake a success state)

- **S15 (parcel card "RES LAND (Unusable)")**: not built in the app or the mockup. Cut; the work order holds through its 2 s.
- **S23 (Prove trial designer)**: not built, not in the mockup. Cut; the history card (S22) holds through its 10 s and the S23 narration line plays over it.
- **S17 (Assess + forecast fill)**: the map renders through software WebGL at a few frames per second in headless Chrome, so the screencast was too choppy to use. The shot is a before still and an after still joined by a 400 ms dissolve, with the cursor path rebuilt from the event log. Same for the mockup's Approve sheet (S13 → S14 is a cut to the opened sheet).
- **S07**: the mockup's own select animation (fly-to and rings) captured smoothly and is used as recorded.
- **Counts card (S28)**: `KIRO_LOG.md` had 159 `###` entries at render time (the shot plan said 148). Agents: 6.

## Limits to state in the delivery note

- The deployed app is still the pre-Piper UI (neutral light theme). The Piper UI (`web/src/styles/piper.css`) landed on `main` during the render and was not yet deployed when the product shots were captured, so product shots and prototype shots differ in look.
- No voice yet. The audio track is silence; captions carry the narration. A team member records the voiceover, then re-time `piper-demo.en.srt`.
- Fonts: Atkinson Hyperlegible Next and Bodoni Moda are not installed on the render machine. Captions and labels fall back to the system sans; the wordmark uses Bodoni 72.
- No Retina OS screen recording was possible (the display is 1512×982 points). Product and mockup frames were captured headless at `deviceScaleFactor: 2`, which gives the same 3840×2160 pixels for the crops.
- Viewer test: not done. Nobody new to the project has been asked the three questions in §8.12.

## Reproduce

```
cd docs/submission/video/capture
node capture-app.mjs <out>/app          # deployed app (needs: npm i playwright; npx playwright install chromium; Google Chrome installed)
node capture-s17.mjs <out>/app/assess_cast1x
node capture-mock.mjs <out>/mock file://<patched mockup>/index.html
node cast.mjs "file://.../beat4-animation.html?t=23.7" 4.0 <out>/anim_logo.mp4   # and the other two slices
cd ../edit && python3 cards.py && python3 edit.py   # ffmpeg 9 with libx264; edit.py expects raw/ next to it
```

Raw 4K captures stay outside the repo (they are large).
