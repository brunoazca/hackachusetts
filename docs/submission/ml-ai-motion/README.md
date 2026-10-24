# Piper: how we use ML and AI (motion graphic)

A 60-second segment for the presentation video: **See → Act → Predict**. Every map and chart is drawn from the live data; the platform
scene is a JS simulation of the Piper UI using real numbers. 1920×1080, 30 fps, no audio (captions on screen).

| File | What |
|---|---|
| `piper-ml-ai.mp4` | the rendered film |
| `index.html` | the same film, playable in a browser (open it; `?t=12.3` shows one frame) |
| `film.html` + `data.json` → `build.py` → `index.html` | source: timeline code + extracted data |
| `render.mjs` | deterministic render: seeks `render(t)` per frame, pipes to ffmpeg (H.264) |
| `stills.mjs` | review stills at chosen times |

## Storyboard

A segment for a bigger video: a short section intro, then one headline per scene, no closing logo. A See → Act → Predict
strip stays top-right. Blue = model, red = what happened. Scenes dip to black between each other (no overlapping titles). 60 s.

| # | Time | Headline | Visual | Facts (source) |
|---|---|---|---|---|
| 0 | 0–3.8 s | Data, from start to finish | See → Act → Predict path draws, data points flow along it | — |
| 1 | 3.8–9.4 | What predicts rodent reports? | dataset chips with icons (Lucide): kept ✓ / struck out; "43 datasets tested" | `docs/rat-audit/AUDIT.md` |
| 2 | 9.4–15.0 | **See** · Every report, one live map | real 250 m grid, rodent reports last 12 weeks, slow push-in | model report run `risk-v1-20261024T210943` |
| 3 | 15.0–20.0 | **Act** · Learning from our neighbours | Cambridge smart boxes ×1.46 near vs ×1.61 elsewhere (descriptive); Somerville Rodent Assistance Program 545 requests | `correlations.three-city-comparison` |
| 4 | 20.0–27.2 | **Act** · Will it come back? | return-risk deciles + a real region solution by Claude Haiku with 3 guards | model report; `region_solutions` `g250_918_3597` |
| 5 | 27.2–34.8 | **Predict** · Every block, every week | forecast grid fills in, zoom to top block: 6.5 expected, top 3 drivers | forecast run |
| 6 | 34.8–42.0 | **Predict** · Where the model looked | weekly timeline (bar = share in top 10%) with playhead; Actual / Model / Both maps | long backtest, last 16 weeks |
| 7 | 42.0–48.6 | **Predict** · 146 weeks it never saw | weekly reports + top-10% share; 65% vs 50%, 145 / 146 weeks | long backtest |
| 8 | 48.6–56.2 | (platform) | Piper UI simulation: forecast on, Ask Piper question, real tool names, answer with sources; "Claude Sonnet 5.5"; "Simulated · real numbers" | forecast run top 4 blocks |
| 9 | 56.2–59.6 | See · Act · Predict | three words | — |

Cut from this version: the "What worked?" by-action slide (no single clear takeaway); kept in `film.html` as an unused scene.

## Rebuild

```bash
python3 build.py                                   # after editing film.html or data.json
npm i playwright                                   # once, in a scratch folder; Chromium from npx playwright install
FF=$(uv run --with imageio-ffmpeg python -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())")
node render.mjs "file://$PWD/index.html" piper-ml-ai.mp4 "$FF" 30
```

`data.json` was extracted from `docs/rat-audit/model-report/index.html` and the live `correlations` table on Oct 24, 2026.
