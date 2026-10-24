# Piper — final film motion clips

Three silent, spring-driven motion clips for the 2:58 submission film described in `docs/submission/video-script-final.md`. Built from SVG paths, text and code; nothing is a screenshot, and the product footage, news captures, Kiro clips and narration are supplied separately by the editor.

| Clip | File | Film insertion | Length | Frames |
|---|---|---|---|---|
| Opening | `exports/01-opening.mp4` | 0:00–0:14 | 14.000 s | 420 |
| Context bridge | `exports/02-context-bridge.mp4` | 1:08–1:13 | 5.000 s | 150 |
| Closing | `exports/03-closing.mp4` | 2:50–2:58 | 8.000 s | 240 |

All three: 1920 × 1080, 30 fps, H.264 (libx264, CRF 17), yuv420p, opaque `#111315` background, no audio stream, no controls or watermarks. `*.mp4` is ignored by this repository's `.gitignore`, so the masters live only on the render machine; re-render with the command below.

## The idea

One line carries the story. In the hook it is the record line (a filled report mark, a hollow recorded closure, a later report with a coral ring). It turns into the piper's pipe before a storybook town; three decorative rat silhouettes, drawn from the brand's own LineRat outline, follow it out of the gate. The town rearranges into an abstract street grid and the pipe becomes the line that groups three neutral records around one place marker. That line resolves into the actual pipe of the Piper lockup (`PiperLogo.tsx` geometry, Fraunces italic wordmark). The bridge keeps one place marker still while Reports, Responses and Nearby records connect to a ring around it. The closing starts from the same marker language and ends on the brand card, pixel-still for four seconds.

Diagram semantics: filled dot = a report; hollow circle = a recorded closed case; coral ring = a later report in an illustrative sequence; neutral connector = evidence grouped for review; outlined pin = the place being reviewed. "Illustrative sequence" stays legible during every abstract data diagram. The folklore passage is labeled THE LEGEND; the grid is labeled BOSTON and is not a map.

## Files

| File | Purpose |
|---|---|
| `index.html` | Gallery: clip selector, Play/Pause, Restart, scrubber, time and frame readout, reduced-motion toggle, notes |
| `config.js` | Single source of truth: frame-exact events, copy, geometry, anchor, spring tokens, colors, type sizes |
| `motion.js` | Closed-form damped-spring solver, bezier easing, text/shape envelopes, path reveal, DOM helpers |
| `brand.js` | LineRat paths, lockup arithmetic (copied from `PiperLogo.tsx` / `PiperLogo.css`), pin and silhouette builders |
| `clips/opening.js`, `clips/bridge.js`, `clips/closing.js` | Each clip: build the DOM once, `render(t)` derives the whole state from clip-local time |
| `film.js` | Player, controls, URL parameters, `window.piperMotion` API |
| `film.css` | Night tokens from `web/src/styles/piper.css`, typography, lockup CSS, controls |
| `assets/fonts/` | Atkinson Hyperlegible Next (variable, latin) and Fraunces SemiBold Italic (latin), OFL 1.1 licenses alongside |
| `render.mjs` | Deterministic renderer (Playwright Chromium + ffmpeg): video, stills, single frame, contact sheet, checks |
| `timeline.mjs` → `timeline.json` | Durations, insertion times, scenes, every event in frames and seconds, holds, narration, measured spring responses |
| `voiceover-reference.txt` | The supplied narration and its timing (text only) |
| `sound-cues.md` | Sparse cue suggestions; no audio was produced |
| `review/` | Representative PNG frames per clip and a labeled contact sheet per clip |
| `exports/` | The three MP4 masters (ignored by git) |

## Preview

Open `index.html` in a browser (a `file://` URL works; fonts are local). The stage scales uniformly with letterboxing; controls stay outside the 1920 × 1080 stage. Playback stops on the final composition and does not loop.

- `index.html?clip=opening` (or `bridge`, `closing`); `&t=4.2` loads paused at 4.2 s.
- `index.html?clip=opening&capture=1&t=4.2` renders a clean frame with no controls, full motion regardless of the OS reduced-motion setting.
- Keyboard: `Space` play/pause, `←`/`→` one frame, `Shift`+arrow one second, `Home`/`End`, `1`/`2`/`3` select a clip. Keys are ignored while a control has focus.
- A `prefers-reduced-motion: reduce` preference (or the toggle) shows each clip as still scenes (cuts, no motion) and does not autoplay.

```js
await window.piperMotion.ready     // fonts loaded, path lengths measured, first frame drawn
window.piperMotion.selectClip("bridge"); window.piperMotion.seek(2.1)   // complete state at 2.1 s, any order
window.piperMotion.play(); .pause(); .restart(); .setReducedMotion(true)
window.piperMotion.clip, .duration, .frames, .fps, .time, .playing, .springs, .logo
```

## Render

Requirements: Node 18+, ffmpeg on PATH, Playwright with Chromium. `render.mjs` resolves `playwright` from the current path, then `$PLAYWRIGHT_DIR/playwright`, then `~/.cache/piper-video/node_modules/playwright` (the install used by the earlier submission captures).

```bash
cd docs/submission/final-film-motion
node render.mjs all                                   # three masters + review frames + contact sheets + checks
node render.mjs video opening exports/01-opening.mp4  # one master
node render.mjs stills closing 0.55,1.8,3.2 review/closing
node render.mjs frame bridge 2.1 /tmp/bridge-2_1.png
node render.mjs sheet opening 0,1.5,3.8,7.2,10.6,13.9667 review/opening-contact-sheet.png
node render.mjs check opening                         # determinism, holds, fonts, page errors
node timeline.mjs                                     # regenerate timeline.json from config.js
```

Frames are captured deterministically: the renderer awaits `piperMotion.ready`, pauses, calls `seek(f / 30)` for `f = 0 … frames − 1`, waits two animation frames, and screenshots the stage at device scale 1. No extra frame is rendered at `t = duration`. The video command fails on any page error, failed asset request or missing brand font.

## Motion system

Springs are a closed-form second-order step response (`motion.js makeSpring`): underdamped `x(t) = 1 − e^(−ζωt)(cos ω_d t + (ζω/ω_d) sin ω_d t)`, critically damped `x(t) = 1 − e^(−ωt)(1 + ωt)`, zero initial velocity. Each spring is clamped to exactly 1 once `|x − 1|` stays under 0.0005 of the travel, so holds are bit-stable. Measured responses (also in `timeline.json`):

| Token | ω (rad/s) | ζ | Settle | Overshoot | Used for |
|---|---|---|---|---|---|
| shapeSnap | 22 | 0.72 | 0.497 s | 3.84 % | marks, pin, bridge symbols (scale 0.92 → 1, 40 px arrival) |
| smallPop | 28 | 0.68 | 0.388 s | 5.43 % | closure marker, report mark, coral ring, pipe holes (scale 0.7 → 1) |
| heavyResolve | 18 | 0.86 | 0.522 s | 0.50 % | line → pipe → organizing line → logo pipe, town → grid, bridge inward settle |
| textSettle | 26 | 1.00 | 0.385 s | 0 % | every text arrival (24–32 px rise, opacity ramps over 8 frames) |
| glide | 11 | 0.92 | 0.803 s | 0.06 % | the three silhouettes' travel (added token: a 190–240 px decorative move) |

Monotonic effects (path reveals, opacity, the camera push 1.00 → 1.08 and back, color mixes) use solved cubic-bezier curves, never springs. Text exits take 7 frames (about 70 % of the 10–12-frame entrances) with an ease-in. Connector endpoints are the reveal itself. The opening's camera is a single push on the legend group (frames 129–168), released during the town-to-grid morph (216–236), then locked; the bridge camera never moves.

## Edit points (frames at 30 fps; details in `timeline.json`)

**Opening.** 0–44 Closed (line draws 1–9, closure marker 8, label 10; settled by frame 22). 45–113 Reported again (line continues 45–54, new mark 53, ring 56, "Closed." exits 45, "Reported again." arrives 50; settled by 72). 114–128 the line anticipates (114–116) and becomes the pipe (116, settled 132); data marks and labels exit 114; THE LEGEND label 120. 129–215 A legend (town draws 124–146 in a 3-frame stagger, holes 134/137/140, silhouettes draw 136–150 and glide 146–175, camera push 129–168). 216–317 A new purpose (headline swap 216/223, BOSTON 222, silhouettes and holes exit 216, town → grid and pipe → organizing line 222–238, extra grid line 236–250, pin 238, marks 240/242/244, tick 244–254, "Illustrative sequence" 242; settled by 254). 318–419 Piper (everything else exits 318, grid fades 318–330, line → logo pipe 318–334, tail 332–348, body 340–358, face 356–362, holes 342/345/348, wordmark 336, supporting line 342; text settled by 354, geometry by 362, hold to 419).

**Bridge.** Frame 0: place marker at the anchor, "One place", "Illustrative sequence". 14/16/18 the three groups arrive (symbols shapeSnap from 40 px outward, labels textSettle). 20–34 connectors draw to the ring. 24–44 ring reveals. 36 the groups settle 32 px inward (heavyResolve). 40 "One place. More context." Hold 63–149; the marker never moves. The anchor is `anchor` in `config.js` (default 960, 560) and the group offsets follow it.

**Closing.** Frame 0: marker and short line. 4–20 the line extends to the logo-pipe span while the marker diminishes (6–16). 17 the line becomes the pipe (y, width, color). 26–48 tail, 36–58 body, 56–62 face, 44/47/50 holes. 54 wordmark (masked 24 px rise), 64 "Follow the rats.", 96 "Evidence for the next inspection." (settled by 108). Pixel-still 120–239. `footerUrl` in `config.js` is empty; set it only to a verified short URL and the card gains a third line without moving anything else.

## Checks

See the "Verification" section below for the results of the final render. `node render.mjs check <clip>` verifies, in one page: expected frame count; brand fonts loaded; out-of-order seeks (late → early → middle → same middle → late → early, byte-identical repeats); hold stillness (opening 380/419, bridge 63/100/149, closing 120/160/200/239 byte-identical); first and last frames not blank; zero page errors or failed requests.

## Verification

_Filled in after the final render; see below._

## Limits

- The clips were inspected as rendered still frames and encoded MP4 metadata; no human viewer test was run.
- The opening's brand card settles slightly later than the brief's nominal 11.50 / 11.70 s: text by 11.80 s (frame 354), geometry by 12.07 s (frame 362), leaving a 1.9 s hold. The timing is in `config.js opening.ev` if the editor wants it tighter.
- The three silhouettes are decorative; their draw-in and glide are the only passage with more than one moving object at a time.
