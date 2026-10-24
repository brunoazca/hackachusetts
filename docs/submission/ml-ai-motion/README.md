# Piper: how we use ML and AI (motion graphic)

An 80-second film for the presentation: **See → Act → Predict**. Every map and chart is drawn from the live data; the platform
scene is a JS simulation of the Piper UI using real numbers. 1920×1080, 30 fps, no audio (captions on screen).

| File | What |
|---|---|
| `piper-ml-ai.mp4` | the rendered film |
| `index.html` | the same film, playable in a browser (open it; `?t=12.3` shows one frame) |
| `film.html` + `data.json` → `build.py` → `index.html` | source: timeline code + extracted data |
| `render.mjs` | deterministic render: seeks `render(t)` per frame, pipes to ffmpeg (H.264) |
| `stills.mjs` | review stills at chosen times |

## Storyboard

A See → Act → Predict strip stays top-right from scene 3 to scene 9. Blue = model, red = what happened.

| # | Time | Scene | Visual | Facts (source) |
|---|---|---|---|---|
| 1 | 0–4.6 s | Title: "See it. Act on it. Predict it." | typography | — |
| 2 | 4.6–11.2 | The ground truth: what predicts rodent reports | counters + kept / struck-out dataset chips | 51 sources, ~580k Boston 311 reports 2016–today, 43 datasets tested (`docs/rat-audit/AUDIT.md`) |
| 3 | 11.2–18.8 | **See**: every report on one live map | real 250 m grid, rodent reports last 12 weeks | 19,263 of 19,496 Boston rodent cases tagged with the city's action (rules); equity finding (tract partial correlations) |
| 4 | 18.8–26.8 | **Act**: what worked in Boston's records | bars: new report within 60 days by action | `correlations.what-worked`: matched enforcement 45% vs monitoring 46%, RR 0.96 (95% CI 0.78–1.21), 181 pairs; citation −5.5 pts unadjusted |
| 5 | 26.8–33.6 | **Act**: learning from Cambridge and Somerville | three columns | `correlations.three-city-comparison`: 231 Cambridge smart boxes, 2,870 catches in 2026, sightings ×1.46 near boxes vs ×1.61 elsewhere (descriptive); Somerville Rodent Assistance Program 545 requests / 764 reports (last 12 months); reports per 1,000 residents Boston 10.3, Somerville 9.4, Cambridge 4.4 |
| 6 | 33.6–42.2 | **Act**: per site (ML + AI) | recurrence deciles + a real region solution | `site_recurrence_logit` test deciles (model report); `region_solutions` row `g250_918_3597` written by Claude Haiku, with its guards |
| 7 | 42.2–51.2 | **Predict**: expected reports per block | real forecast grid fills in, zoom to the top block, drivers | run `risk-v1-20261024T210943`, South Boston / Waterfront 6.5 expected over 4 weeks |
| 8 | 51.2–58.6 | **Predict**: did reports land where the model looked? | three maps (actual / model / both), 16 weeks auto-advance, top-10% outline | long backtest, last 16 weeks (`model-report/data/bt_long.json`) |
| 9 | 58.6–66.2 | **Predict**: 146 weeks | weekly reports + top-10% share charts | 65% vs 50%, better in 145 of 146 weeks |
| 10 | 66.2–74.6 | In the platform (simulation) | Piper UI: forecast toggle, Ask Piper question, tool calls (`get_insights`, `map_show_forecast`, `map_highlight`), answer with sources | Claude Sonnet 5.5; top-4 blocks from the forecast run |
| 11 | 74.6–79.6 | See · Act · Predict → Piper, "Follow the rats." | typography | — |

Labelled on screen as needed: "observational", "descriptive, not proof", "simulated session, real numbers", "expected reports, not rats".

## Rebuild

```bash
python3 build.py                                   # after editing film.html or data.json
npm i playwright                                   # once, in a scratch folder; Chromium from npx playwright install
FF=$(uv run --with imageio-ffmpeg python -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())")
node render.mjs "file://$PWD/index.html" piper-ml-ai.mp4 "$FF" 30
```

`data.json` was extracted from `docs/rat-audit/model-report/index.html` and the live `correlations` table on Oct 24, 2026.
