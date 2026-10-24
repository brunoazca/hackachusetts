# Piper: how we use ML and AI (motion graphic)

A 63-second segment for the presentation video: **See → Act → Predict**. Every map and chart is drawn from the live data; the platform
scene is a JS simulation of the Piper UI using real numbers. 1920×1080, 30 fps, no audio (captions on screen).

| File | What |
|---|---|
| `piper-ml-ai.mp4` | the rendered film |
| `index.html` | the same film, playable in a browser (open it; `?t=12.3` shows one frame) |
| `film.html` + `data.json` → `build.py` → `index.html` | source: timeline code + extracted data |
| `render.mjs` | deterministic render: seeks `render(t)` per frame, pipes to ffmpeg (H.264) |
| `stills.mjs` | review stills at chosen times |

## Storyboard

A segment for a bigger video: no opening title or closing logo, one short headline per scene. A See → Act → Predict
strip stays top-right. Blue = model, red = what happened. 63 s.

| # | Time | Headline | Visual | Facts (source) |
|---|---|---|---|---|
| 1 | 0–5.6 s | What predicts rodent reports? | dataset chips: kept ✓ / struck out; "43 datasets tested" | `docs/rat-audit/AUDIT.md` |
| 2 | 5.6–11.2 | **See** · Every report, one live map | real 250 m grid, rodent reports last 12 weeks | model report run `risk-v1-20261024T210943` |
| 3 | 11.2–17.6 | **Act** · What worked? | bars: came back within 60 days by action; 45% enforcement vs 46% monitoring, "no clear difference", matched 181 pairs | `correlations.what-worked` |
| 4 | 17.6–23.2 | **Act** · Learning from our neighbours | Cambridge smart boxes ×1.46 near vs ×1.61 elsewhere (descriptive); Somerville Rodent Assistance Program 545 requests in 12 months | `correlations.three-city-comparison` |
| 5 | 23.2–30.4 | **Act** · Will it come back? | return-risk deciles (predicted vs came back) + a real region solution by Claude Haiku with 3 guards | model report; `region_solutions` `g250_918_3597` |
| 6 | 30.4–38.0 | **Predict** · Every block, every week | forecast grid fills in, zoom to top block: 6.5 expected, top 3 drivers | forecast run |
| 7 | 38.0–45.2 | **Predict** · Where the model looked | Actual / Model / Both maps, 16 weeks, top-10% outline and weekly % | long backtest |
| 8 | 45.2–51.8 | **Predict** · 146 weeks it never saw | weekly reports + top-10% share; 65% vs 50%, 145 / 146 weeks | long backtest |
| 9 | 51.8–59.4 | (platform) | Piper UI simulation: forecast on, Ask Piper question, real tool names, answer with sources; tag "Claude Sonnet 5.5", note "Simulated · real numbers" | forecast run top 4 blocks |
| 10 | 59.4–62.8 | See · Act · Predict | three words | — |

## Rebuild

```bash
python3 build.py                                   # after editing film.html or data.json
npm i playwright                                   # once, in a scratch folder; Chromium from npx playwright install
FF=$(uv run --with imageio-ffmpeg python -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())")
node render.mjs "file://$PWD/index.html" piper-ml-ai.mp4 "$FF" 30
```

`data.json` was extracted from `docs/rat-audit/model-report/index.html` and the live `correlations` table on Oct 24, 2026.
