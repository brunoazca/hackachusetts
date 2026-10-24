# Forecast on the map

How the prediction models show up in the app, what is drafted, and what is left.
Owner: model track (Bruno). Map/inspector files are Gui's; the draft only adds new files plus a few wiring lines.

## What the models give the map

| Model | Output | Where |
|---|---|---|
| `cell_week_poisson_gbm` (forecast) | Expected 311 rodent reports per 250 m block for each of the next 4 weeks, chance of ≥1 report, relative risk band, top drivers in plain language | `predictions` (rows with `actual is null`), latest run via `forecast_run_id()` |
| same run, backtest | 26 past weeks with model expectation **and** the actual count | `predictions` (rows with `actual`) |
| emerging hotspots | Blocks with a high forecast but ≤1 rodent report in 12 weeks (+ early warnings: dead-animal/pest rising) | `model_runs.metrics->'emerging'` |
| `site_recurrence_logit` | Chance a rodent report returns to the same address within 60 days of a closure (AUC 0.71) | `sites.summary->'recur_p'` once `sites` is filled |
| what-if | Expected change for a block or site under an intervention | Modal `simulate` endpoint (token-protected) |

Always say "expected reports", never "rats". Every view carries the caveat "Model estimate, not a measured effect".

## Drafted (Oct 24)

- **RPCs** — `supabase/migrations/20261024500002_model_forecast_api.sql` (applied):
  - `forecast_run()` → run id, trained-through date, forecast weeks, backtest metrics, caveat.
  - `map_forecast(min_lon, min_lat, max_lon, max_lat, week default first forecast week, min_expected default 0.01)` → GeoJSON of blocks with `expected`, `p_any`, `band`, `emerging`. Blocks under 0.01 are left out (≈1,350 of 3,442 remain).
  - `cell_detail(cell_id)` → neighborhood, next 4 weeks, drivers, last 12 weeks actual vs expected, emerging signals.
- **Web** (new files): `lib/forecast.ts` (fetchers + log color scale), `components/map/ForecastLayer.tsx` (fill colored on log10 of expected: 0.01 → 0.1 → 1 → 10+, dashed blue outline for emerging hotspots), `components/map/ForecastControl.tsx` (top-right toggle, week picker, legend, backtest line), `components/inspector/CellCard.tsx` (block card).
- **Wiring** (small edits): `MapView.tsx` renders the layer under the heatmaps, makes `forecast-fill` clickable → `select({kind:"cell"})`, and shows the control in Assess mode; `InspectorPanel.tsx` routes `kind === "cell"` to `CellCard`. Uses the existing `layers.forecast` and `forecastWeek` in `map-store.ts`.
- Preview of the same views as a standalone page (actual vs model, recurrence): see the model artifact "Boston Rodent Forecast".

## Ideas, in priority order

1. **Forecast layer** (P0, drafted) — blocks colored by expected reports, week picker, emerging outline.
2. **Block card "Why here?"** (P0, drafted) — expected reports, % chance, 4-week strip, top drivers, last 12 weeks actual vs model.
3. **"How did the model do last week?" toggle** (P1) — overlay: model expectation as fill, actual reports as red dots sized by count. The fastest way to show judges the model works. Data: `predictions` rows with `actual`, same RPC with a past `week` (needs `map_forecast` to accept backtest weeks — drop the `actual is null` filter when `week` is in the past).
4. **What-if buttons on the block card** (P1) — "Store trash correctly / Clear the lot / Pest follow-up" → `/api/simulate` (new server route next to `/api/refresh`, forwards to Modal with `RAT_AUDIT_WORKER_TOKEN`) → "−1.4 expected reports over 4 weeks".
5. **Return-risk badge on sites** (P1, after Carol fills `sites`) — "42% chance reports return within 60 days" from `sites.summary.recur_p`; also a sort option in the Act queue.
6. **Agent tool** (P2, Carol) — `forecast({week, emerging})` sets `layers.forecast`, `forecastWeek` and flies to the top blocks.
7. **Insights panel** (P2, Carol) — backtest chart (actual vs model vs 4-week average), capture 64% vs 54%.

## Notes

- `grid_cells` was empty, so `score` seeded it with the same 250 m fallback grid (3,442 cells, ids `g250_<col>_<row>`). Carol can replace it; ids stay compatible.
- Forecast refreshes with Modal: daily cron rescoring (10:00 UTC), retrain Mondays (09:00 UTC).
