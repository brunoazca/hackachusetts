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
| S01–S02 | The Piper intro from `docs/design/mockup/` (the one-line rat mark draws itself, "Piper" sets, "Follow the rats."), captured full-frame at 1920×1080 with everything else on the page hidden | Replaces the plan's "wordmark over the pin collapse". The pin collapse still pays off at the end of S09. 400 ms dissolve into the app at 7.0 s. |
| S06, S09 | `beat4-animation.html` slices (`?t=0&to=7.8`, `?t=10.3&to=27.3`) | Captured in real time through CDP screencast at 1920×1080 (about 21 fps, resampled to 60). Camera 1.0×, static, as the brief requires. |
| S03, S04 | The deployed app, `https://piper-app.vercel.app`, **after** it switched to the Piper UI: "Places to visit" queue, "Review suggested" flags, "Latest import N minutes ago" badge | Headless Chrome with software WebGL at `deviceScaleFactor: 2`. |
| S17, S18, S20 | The deployed app **before** the Piper UI landed (light theme) | Assess mode with the forecast toggle (S17), the layer panel's tested label "Construction debris · no effect" (S18), a real **Emerging hotspot** block card in Charlestown (S20). The new UI moved these controls into an icon rail; they need a new rehearsal and capture (`capture/capture-app.mjs` has the old selectors). |
| S07, S08, S10, S11, S12, S13, S14, S29 | The Piper mockup (`docs/design/mockup/`, now on `main`), tagged **Prototype** on screen | The deployed app has no Normandy St case in its queue (it is address-level and Normandy St is not Due in the 60-day window) and no Approve, work order or Prove screens. The mockup has the flow. Its illustrative copy for Normandy St was replaced with the approved facts from the script (18 reports, the ladder, the vacant lot classed RES LAND (Unusable), the Rule 2 recommendation and because line, the source line, the draft work order with check-again Dec 23, 2026). Other sites' illustrative counts were hidden. The exact change is `capture/mockup-prototype.patch`. |
| S16, S19, S21, S22, S28, S30 | Cards rendered by `edit/cards.py` | Hamelin palette from the script header. Bodoni (Bodoni 72, the installed stand-in for Bodoni Moda) only on S30 and the S01–S02 wordmark. |
| S05 | News wall built from 10 of the 22 headline screenshots in Drive / Hackachusetts / NewsPrints (Huntington News, Axios, Boston Herald, CBS News, The Boston Globe, Boston 25 ×2, Wicked Local, NBC Boston ×2) | Unedited screenshots, 2 columns × 5, staggered in over 1.5 s, then static. No push-in. |
| S24–S27 | The Kiro recordings from Drive / Hackachusetts, 4K, centre crop at 1.3×, real system cursor as recorded | S24 Spec Builder (specs tree, spec chat); S25 Kiro Crew task runner, research DAG; S26 Task Runner with approval gates ("prediction models for Rat Audit Boston"); S27 Research Lab (sourced queries against data.boston.gov). No recording shows a hook firing or the civic-judge agent, so **the S25 and S26 narration lines were changed to match the footage** (see below). |

## Shots cut or changed (per §8.4: never fake a success state)

- **S15 (parcel card "RES LAND (Unusable)")**: not built in the app or the mockup. Cut; the work order holds through its 2 s.
- **S23 (Prove trial designer)**: not built, not in the mockup. Cut; the history card (S22) holds through its 10 s and the S23 narration line plays over it.
- **S17 (Assess + forecast fill)**: the map renders through software WebGL at a few frames per second in headless Chrome, so the screencast was too choppy to use. The shot is a before still and an after still joined by a 400 ms dissolve, with the cursor path rebuilt from the event log. Same for the mockup's Approve sheet (S13 → S14 is a cut to the opened sheet).
- **S07**: the mockup's own select animation (fly-to and rings) captured smoothly and is used as recorded.
- **Counts card (S28)**: `KIRO_LOG.md` had 159 `###` entries at render time (the shot plan said 148). Agents: 6.

## Narration lines changed to match real footage (voice not recorded yet)

| Shot | Shot plan | In this render |
|---|---|---|
| S25 | Hooks check accessibility and secrets on every save. | A crew of agents ran the research tasks, step by step. |
| S26 | A judge agent reviewed our own build. | Approval gates held each step until a person checked it. |

Both appear in the burned-in captions and in `piper-demo.en.srt`. Revert them in `edit/edit.py` (`OVERRIDE`) if the team records a hook firing and the judge agent instead.

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
