<!-- Exported from Kiro Crew Research Lab. Campaign 072d5a66, status complete, 2 cycles, completed 2026-10-24 14:13, parent none. -->

> **Question:** For Boston 311 'Rodent Activity' reports 2023-2026, test whether a simple model can beat the baseline 'mean of the last 4 weeks' at forecasting weekly rodent reports per ~250 m grid cell one week ahead. Use a rolling-origin backtest over the most recent 26 weeks. Candidate features known at prediction time: lags (t-1, mean t-1..t-4, mean t-1..t-12, same week last year), trash-storage and illegal-dumping reports in the cell over the last 4 weeks, week of year (sin/cos), Sept 1 move-out flag. Model: Poisson gradient boosting (sklearn HistGradientBoostingRegressor(loss='poisson')) or Poisson GLM. Data: data.boston.gov CKAN, query with https://data.boston.gov/api/3/action/datastore_search_sql (the portal blocks extract and coalesce; compute durations locally). 311 yearly tables: 2026 1a0b420d-99f1-4887-9851-990b2a5a6e17, 2025 9d7c2214-4709-478a-a2e8-fb2020a5bb94, 2024 dff4d804-5031-443a-8409-8344efd0e5c8, 2023 e6013a93-1321-4f2a-bf91-8d8a02f1e62f (fields type, open_dt, closed_dt, closure_reason, location, location_zipcode, neighborhood, latitude, longitude). Trash types since Aug 2025 are in the new-system table 254adca6-64ab-4c5c-9fc0-a6da622be185 (service_name, open_date, latitude, longitude).
>
> **Success criteria:** A backtest table (baseline vs model: MAE, top-10% capture) with the number of cells and weeks, the top features, and a clear recommendation: ship the model, or ship the baseline.

# Research Findings — Campaign 072d5a66

**Question:** Can a simple model beat the "mean of last 4 weeks" baseline at forecasting weekly Boston 311 rodent reports per ~250m grid cell, one week ahead? Rolling-origin backtest over 26 weeks.

---

## Cycle 0 — Pipeline + first backtest

Pulled all Boston 311 rodent reports 2023-2026 (19,473 with coordinates) and the two feature types — `Improper Storage of Trash (Barrels)` + `Illegal Dumping` (82,432 total) — from the CKAN SQL API ([data.boston.gov](https://data.boston.gov/api/3/action/datastore_search_sql)). Binned to a ~250m grid (0.00225° lat × 0.003045° lon ≈ 250m at Boston's latitude), keeping the 1,140 cells that ever had a rodent report. Built a weekly panel (157 weeks, 2023-01-02 → 2025-12-29).

Ran a rolling-origin backtest over the most recent 26 full weeks. Baseline = mean of the cell's last 4 weeks. Model = `HistGradientBoostingRegressor(loss='poisson')` with lags (t-1, mean 4, mean 12, same week last year), trash/dumping counts over last 4 weeks, week-of-year sin/cos, and a Sept move-out flag.

| Metric | Baseline (mean last 4) | Poisson GBM | Winner |
|---|---|---|---|
| MAE | 0.0447 | 0.0527 (+17.8%) | **baseline** |
| Top-10% capture | 0.229 | 0.257 | **model** |
| Cells | 1,140 | — | — |
| Backtest weeks | 26 | — | — |

Permutation importance (MAE drop): `woy_sin` and `trash4` tie at top (0.0007), then `woy_cos` (0.0004), `dump4` (0.0001). Lag/mean features show ~0 or slightly negative — they encode the same signal the baseline already uses.

**Why the split result:** the panel is ultra-sparse — mean 0.032 reports per cell per week. MAE rewards predicting near-zero everywhere, so the Poisson model (which spreads probability mass to find hot cells) is punished on MAE but ranks the hot cells better. Top-10% cells by total volume already capture ~49.5% of all reports, and the week-to-week top-10% set is stable (Jaccard 0.62) — the "where" is largely a fixed chronic set.

---

## Research State

**Answered:**
- Primary backtest numbers exist: MAE baseline 0.0447 vs model 0.0527; top-10% capture baseline 0.229 vs model 0.257 (1,140 cells, 26 weeks).
- Cell stability: top-10% Jaccard 0.62 week-to-week; chronic cells hold ~50% of reports.
---

## Cycle 1 — Controls: static map, lags-only, full features

Ran a 4-way comparison on the identical 26-week backtest to isolate where any edge comes from.

| Approach | MAE | Top-10% capture |
|---|---|---|
| Baseline (mean last 4 wks) | 0.0447 | 0.229 |
| Static chronic map (frozen train-period totals) | 0.0522 | 0.232 |
| GBM, lags + calendar only | 0.0512 | 0.225 |
| **GBM, full (incl. trash + dumping)** | 0.0527 | **0.257** |

**The decisive finding:** a dumb static map of chronic cells matches the baseline (0.232 ≈ 0.229), and a GBM using only lag/calendar features does **no** better (0.225). The **only** approach that beats ~0.23 is the one that adds recent trash-storage + illegal-dumping co-reports (0.257, +12% capture). So the useful predictive signal is *co-located sanitation complaints*, not autoregressive history. On MAE, every model loses to the baseline because the grid is near-zero everywhere.

**Definition of Done: MET (verification.passed=true).** Recommendation below.

---

## Research State

**Answered (all 4 sub-questions):**
- Q1 MAE & capture: baseline MAE 0.0447 / cap 0.229; model MAE 0.0527 / cap 0.257 (1,140 cells, 26 weeks).
- Q2 features that matter: trash-storage (`trash4`) + illegal-dumping co-reports and week-of-year — these are the ONLY features that lift capture; lags duplicate the baseline.
- Q3 worth building?: a generic one-week point forecaster is NOT worth building (loses MAE, lags add nothing). The one real win is +12% hot-cell capture from a trash+dumping-weighted re-rank.
- Q4 chronic stability: top-10% cells are stable (Jaccard 0.62) and chronic cells already hold ~50% of reports — "chronic" is most of the signal.

**Recommendation (draft):** Ship the **baseline / static chronic-cell map** as the default. Only add the Poisson GBM if the app's goal is hot-cell *targeting* (capture), and then its value is specifically the trash+dumping co-report feature, not the time-series modeling. Do not sell it as a better point forecast.

**Open / weak:** recommendation is solid but could use one robustness check — does the trash/dumping capture edge hold if the grid size or capture threshold (top-5% / top-20%) changes? Optional.

**Dead-ends:** lag-only GBM (no better than static map); MAE as the headline metric (sparsity makes "predict ~0" win).
