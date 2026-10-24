# Why Piper — 10-second motion graphic

A silent, standalone explainer: three records sit apart (a report, a closure, a new report after it), travel into one timeline for one place, and the timeline opens into a place review with nearby context. Piper brings it together; the timeline becomes the logo's pipe. The choreography follows **Recipe A — scattered inputs become a clear outcome, 10 seconds** from `docs/submission/motion-graphics-from-scratch-claude.md`. Built from editable text, SVG geometry and procedural motion; nothing is a screenshot.

## Files

| File | Purpose |
|---|---|
| `index.html` | Stage markup (all copy and diagram geometry), playback controls, plain-text transcript |
| `film.js` | The film: every visible state is a pure function of time `t`; keyframe times `T`, geometry `G`, lockup size `LOGO`, easing and the `window.piperFilm` API |
| `film.css` | Night-palette tokens, typography, lockup CSS (copied from `web/src/components/brand/PiperLogo.css`), controls |
| `assets/fonts/` | Atkinson Hyperlegible Next (variable, latin) and Fraunces SemiBold Italic (latin) with their OFL 1.1 licenses |
| `render.mjs` | Deterministic frame renderer (Playwright + ffmpeg): MP4, stills or a single frame |
| `why-piper.mp4` | Rendered master: 1920 × 1080, 30 fps, 300 frames, 10.000 s, H.264 yuv420p, no playback chrome |
| `stills/` | Rendered frames: one settled frame per beat and intermediate transition frames |
| `voiceover.txt` | Optional narration script (text only; no audio was produced) |

## Preview

Open `index.html` in a browser (a `file://` URL works; fonts are local). The stage scales uniformly with letterboxing and plays automatically, stopping at 10 s.

- Controls: Play/Pause, Restart, scrubber, Reduced motion, Static summary. Keyboard: `Space` play/pause, `←`/`→` one frame, `Shift`+arrow one second, `Home`/`End`. Keys are ignored while a control is focused.
- `index.html?t=4.2` loads paused at 4.2 s.
- `index.html?capture=1&t=4.2` renders a clean 1920 × 1080 frame with controls hidden.
- `index.html?static=1` shows the static summary: the core message, the organized place review and the lockup.
- `prefers-reduced-motion: reduce` opens the static summary by default; pressing Play then runs the film as four still scenes (cuts, no motion). The Reduced motion checkbox does the same at any time.

Browser API (all implemented in `film.js`):

```js
window.piperFilm.ready            // Promise: fonts loaded, path lengths measured, first frame drawn
window.piperFilm.seek(4.2)        // pause and render the complete state at 4.2 s (order-independent)
window.piperFilm.play(); window.piperFilm.pause(); window.piperFilm.restart();
window.piperFilm.setReducedMotion(true)
window.piperFilm.time, .playing, .duration (10), .fps (30)
```

## Rendering

Requirements: Node 18+, ffmpeg on PATH, Playwright with Chromium. `render.mjs` imports `playwright` from the current resolution path, then from `$PLAYWRIGHT_DIR/playwright`, then from `~/.cache/piper-video/node_modules/playwright` (the install used by the other submission captures).

```bash
cd docs/submission/why-piper
node render.mjs video why-piper.mp4                 # 300 frames, each rendered by seek(f / 30), piped to ffmpeg
node render.mjs stills 0.9,1.7,2.9,4.2,5.5,7.0,8.0,8.6,9.6 stills
node render.mjs frame 7 /tmp/frame7.png
```

Frames are captured deterministically: the renderer awaits `piperFilm.ready`, pauses, reads the frame count from the page (duration × fps), calls `seek(f / 30)` for `f = 0 … 299`, waits two animation frames for paint, and screenshots at 1920 × 1080 with device scale 1. No arbitrary delays. The video command prints an `ffprobe` summary (dimensions, frame rate, counted frames, duration, pixel format) and fails on any page error or failed asset request.

## Timeline (half-open intervals, 30 fps, 300 frames)

| Time | Frames | Recipe A step | What happens |
|---|---|---|---|
| 0.0–1.0 s | 0–29 | Establish headline + three placed circles | “Boston · Rodent reports”, **Reports can return.** Three records appear apart with labels: Report received (dot), Case closed (hollow), New report (dot with coral ring). 80 ms stagger. |
| 1.0–2.4 s | 30–71 | Circles travel to a shared alignment | The three records travel along distinct paths into one line, in order; labels ride with them. 1.0 s travel, 80 ms stagger. |
| 2.4–3.2 s | 72–95 | Connecting line + short label | The timeline draws through the records; a place marker arrives at its start with **One place** above it. |
| 3.2–5.0 s | 96–149 | Hold the organized system | One place, three records, read in order. |
| 5.0–6.0 s | 150–179 | Shared shape expands into the result container | Headline becomes **Piper brings it together.** The timeline opens vertically into the review panel; the records stay in place (focal anchor). |
| 6.0–6.8 s | 180–203 | Result phrase; supporting objects settle | **Evidence for the next inspection.** Nearby records settle beneath the timeline. |
| 6.8–7.4 s | 204–221 | Hold the resolved composition | — |
| 7.4–10.0 s | 222–299 | Ending (unchanged from the 24 s cut) | Marks fade (7.4–7.7), the timeline travels into the exact logo-pipe position and thickness (7.45–8.1), the coral tail draws from the pipe end, holes pop, the rat and wordmark draw. **Follow the rats.** / Rodent report intelligence for Boston. Settled by ≈9.05 s, held to the last frame. |

Motion vocabulary (`film.js`, `DUR` and `EASE`): headline 500 ms in / 250 ms out with 24 px travel; labels 300 ms with 12 px; marks 350 ms from scale 0.94; stroke reveals 600–700 ms (path-length aware, `getTotalLength`); record travel 1000 ms with 80 ms stagger; container expansion 900 ms; exits 250–300 ms. Curves: arrivals `cubic-bezier(0.16, 1, 0.3, 1)`, travel `cubic-bezier(0.65, 0, 0.35, 1)`, exits `cubic-bezier(0.4, 0, 1, 1)`, solved with a Newton/bisection Bézier evaluator.

## Meaning of the marks

- Filled dot: a report. Never a rat or a population.
- Hollow circle: a recorded closed case. Not proof that the place is clear.
- Coral ring: another report at the same place after a closure (illustrative).
- Neutral lines and the panel: grouping for review. No causation, rat movement or treatment effectiveness is implied.
- The “Illustrative sequence” label is on screen for every diagram scene. No addresses, case ids, dates or statistics appear.

## Sources used

- Product claims: `README.md`, `docs/submission/description.md`, `docs/submission/demo-script.md`.
- Palette and type: `web/src/styles/piper.css`, `web/src/app/layout.tsx`, `docs/design/foundations/motion.md`.
- Logo: `web/src/components/brand/LineRat.tsx` (path data), `PiperLogo.tsx` (container ratio 0.44, wordmark `right`/`bottom`/font-size arithmetic) and `PiperLogo.css` (rat/tail/hole transforms), reproduced one-to-one in `index.html` and `film.css`.

## Fonts and licensing

The app loads its fonts through `next/font/google`; the woff2 files bundled here are the Google-Fonts latin subsets that build cached under `web/.next/static/media/` (Atkinson Hyperlegible Next variable wght 200–800; Fraunces SemiBold Italic static). Both are SIL Open Font License 1.1; the license text with each family's copyright line is in `assets/fonts/`. For wider redistribution, swap in the upstream release files from the projects named in those license files. Atkinson Hyperlegible Mono is not used (no data labels needed it). If the local fonts fail to load the page falls back to Helvetica/Arial and Georgia; the renderer reports that as a failed request.

## Checks performed

- Fonts: `document.fonts.check` true for both families; no failed requests; zero console errors or page errors in capture, preview and static modes.
- Seeking: out-of-order seeks (9.9 → 2 → 7 → 0 → 4.2) produce a frame byte-identical to a direct seek to 4.2; same for 0.95.
- Clock: play from 3 s advances; pause holds; restart returns to 0 and plays; playback stops at 10 s without looping.
- Reduced motion: still-scene rendering at 1.5 s equals the normal frame at 0.95 s; `prefers-reduced-motion` opens `?static=1`.
- `?t=4.2` loads paused at frame 126; keyboard stepping and Space verified.
- Frames inspected at 0.9, 1.7, 2.9, 4.2, 5.5, 7.0, 8.0, 8.6 and 9.6 s at full size and at 960 px wide; label spacing on the aligned timeline was widened after the first pass.
- MP4 verified with `ffprobe`: h264, 1920 × 1080, yuv420p, 30/1 fps, 300 counted frames, duration 10.000000 s.

## Limitations

- No audio. `voiceover.txt` is a script only.
- The MP4 was rendered with headless Chromium; a different browser build may rasterize strokes and glyphs slightly differently, but the timing is frame-exact.
- The lockup CSS uses `transform-box: fill-box` on the pipe holes so they can pop in place; the product's static logo does not need it. The settled geometry is identical.
