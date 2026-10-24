# Model audit: Boston rodent report forecast

What the prediction models do, how they were tested, how well they work, and where they fall short.
Interactive version: open [`index.html`](index.html) in a browser (self-contained, no server needed).
Owner: model track (Bruno). Built Oct 24, 2026. Rebuild with `pipeline/scripts/model_report.py`.

## Summary

- **Forecast** (`cell_week_poisson_gbm`): expected 311 rodent reports per 250 m block per week, for the next 4 weeks.
  Current run `risk-v1-20261024T210943`, trained on data through Oct 12, 2026.
- On 26 weeks it never saw (Apr 20 – Oct 12, 2026), the model's top 10% of blocks held **65% of all rodent reports**,
  against **54%** for the obvious alternative (each block's average of its last 4 weeks). It ranked better in **26 of 26 weeks**.
- Per-block error is about the same as that average (MAE 0.0734 vs 0.0713). **Use it to decide where to look, not to promise exact counts.**
- **Recurrence** (`site_recurrence_logit`): chance that rodent reports return to the same address within 60 days of a case closing.
  On 2,964 later cases it never saw, AUC **0.71** (0.50 = coin flip). The riskiest 10% of cases came back 42% of the time; the safest 10%, 8%.
- Both models predict **reports people file**, not rats. A block with no reports may have rats nobody reported.

## What the models predict

| Model | Unit | Output | Where it is stored |
|---|---|---|---|
| Forecast (Poisson gradient boosting) | 250 m block × ISO week | expected reports, chance of ≥1 report, risk band, top drivers | `predictions`, `model_runs` |
| 4-week average (baseline) | same | mean of the block's last 4 weeks | `model_runs` (comparison only) |
| Recurrence (logistic regression) | closed rodent case | P(new report at the same address within 60 days) | `model_runs`, `sites.summary.recur_p` |
| Emerging hotspots | block | high forecast but ≤1 report in the last 12 weeks; early warning when dead-animal + indoor-pest reports rise | `model_runs.metrics.emerging` |

## Data and features (forecast)

- Target: Boston 311 rodent reports per block per week (`incidents`, category `rodent`), 3,586 blocks of 250 m.
- Training: weeks from 2017 on, **excluding Mar 2020 – Jun 2021** (pandemic changed what got reported); lags still use those weeks.
- Every feature for week *t* uses only weeks before *t*. Tests in `pipeline/tests/test_model_features.py` check this.
- 33 features in use (`CORE` in `pipeline/rat_audit/model/features.py`):
  - rodent reports in the block last week, last 4 and 12 weeks, same week last year; same in the 8 neighbouring blocks;
  - leading 311 signals in the block and next door, last 4 and 12 weeks: dead animals, indoor pests, improper trash storage, trash out early, weeds, litter, move-in trash, illegal dumping;
  - reporting volume (all other 311 reports in the last year), parcels, median year built, housing units;
  - week of year, the Sept 1 move-out week, average high temperature in the last 4 weeks.

## How it was tested

**Rolling origin, out of sample.** For each test period the model is retrained on data **before** that period only, then predicts each week
of the period. No week is ever predicted by a model that saw it.

| Test | Period | Weeks | Retrained every |
|---|---|---|---|
| Short (the saved run) | Apr 20 – Oct 12, 2026 | 26 | 4 weeks |
| Long | Jan 1, 2024 – Oct 12, 2026 | 146 | 8 weeks |

Two measures:
- **Top-10% capture**: each week, rank blocks by prediction; share of that week's real reports inside the top 10%. This is what matters for sending inspectors.
- **MAE**: average absolute error per block-week.

## Results: forecast

### Short test (current model, 26 weeks, 4,248 real reports)

| | Model | 4-week average |
|---|---|---|
| Reports in the top 10% of blocks | **65.0%** | 54.3% |
| Weeks where it ranked better | **26 of 26** | — |
| MAE per block-week | 0.0734 | **0.0713** |
| Total expected vs actual | 4,021 vs 4,248 (−5%) | 4,025 (−5%) |

**Calibration** (all block-weeks grouped by what the model predicted):

| Model predicted | Block-weeks | Avg predicted | Avg actual |
|---|---|---|---|
| 0–0.02 | 60,532 | 0.002 | 0.003 |
| 0.02–0.05 | 9,473 | 0.033 | 0.040 |
| 0.05–0.1 | 8,149 | 0.072 | 0.080 |
| 0.1–0.2 | 6,213 | 0.140 | 0.158 |
| 0.2–0.4 | 3,269 | 0.276 | 0.285 |
| 0.4–0.7 | 1,270 | 0.513 | 0.524 |
| 0.7–1.2 | 489 | 0.870 | 0.775 |
| 1.2+ | 97 | 1.481 | 1.062 |

Close to the diagonal up to ~0.7 expected reports; above 1.2 it overestimates by about a third. The 4-week average
overestimates more at every level above 0.2 (e.g. predicts 0.83 where 0.49 happen), because a block's busy month rarely repeats.

### Long test (Jan 2024 – Oct 2026, 146 weeks, 15,406 real reports)

| | Model | 4-week average |
|---|---|---|
| Reports in the top 10% of blocks | **64.0%** | 49.3% |
| Weeks where it ranked better | **145 of 146** | — |
| MAE per block-week | 0.0496 | **0.0489** |

These numbers are from the previous model version (training from 2023, 38 features incl. code-enforcement tickets).
The rerun with the current model is in progress; when it finishes, `index.html` and this table are updated from `data/bt_long.json`.

### What was tried and not kept

Promotion rule: a group of new inputs is kept only if top-10% capture improves by ≥0.5 points **and** MAE does not get worse (26-week test).

| Change | Capture | MAE | Kept? |
|---|---|---|---|
| Rain, snow, events, demolitions, excavations, restaurants, Big Belly, vacant parcels | +0.1 pt | −0.0002 | no (noise) |
| City lots | +0.45 pt | worse | no |
| More weather (heavy rain, hot days, freeze days) | +0.23 pt | worse | no |
| ACS demographics | +0.14 pt | worse | no |
| Building permits | +0.09 pt | worse | no |
| iNaturalist rat sightings | −0.02 pt | — | no |
| More neighbour signals (litter, dumping, overflow) | −0.14 pt | better | no |
| Food inspections with rodent violations | −0.40 pt | — | no |
| All of the above together | +0.09 pt | worse | no |
| Training window 2017+ without the pandemic (vs 2023+) | 0.643 → 0.651 | 0.0752 → 0.0740 | **yes** |
| Code-enforcement tickets out (data only from Apr 2026) | 0.651 → 0.650 | 0.0740 → 0.0734 | **yes** |

Leave-one-group-out: removing rodent history, neighbouring blocks or season each costs ~0.8–0.9 points of capture.
All experiment runs are rows in `model_runs` with model `cell_week_poisson_gbm_ablation` and `cell_week_poisson_gbm_cities`.

## Results: recurrence

- 15,953 closed Boston rodent cases with a full 60-day window; 12.5% had a return report.
- Trained on cases closed before Feb 23, 2026; tested on the 2,964 closed after (13.2% returned).
- **AUC 0.71** vs 0.50 for the base rate.

| Predicted risk group (deciles) | Predicted return | Actually returned |
|---|---|---|
| 1 (lowest) | 6.6% | 8.4% |
| 2 | 7.5% | 5.4% |
| 3 | 8.1% | 5.1% |
| 4 | 8.7% | 5.1% |
| 5 | 9.8% | 9.8% |
| 6 | 11.1% | 9.5% |
| 7 | 13.0% | 12.8% |
| 8 | 16.5% | 12.5% |
| 9 | 25.7% | 20.9% |
| 10 (highest) | 49.8% | 42.1% |

What moves it: earlier rodent reports at the address (none → lower; 5 or more → higher), nearby trash-storage and pest
reports in the 90 days before closure (higher), time of year. The closure action (what the city did) is not used yet:
`action_tag` was empty when this model was trained.

## Current forecast (run `risk-v1-20261024T210943`)

- Weeks of Oct 26, Nov 2, Nov 9, Nov 16, 2026: about 139, 137, 129, 127 expected reports city-wide.
- 136 blocks expect 1 or more reports over the 4 weeks; 144 emerging hotspots; 117 early warnings.
- Highest: South Boston / Waterfront (6.5 over 4 weeks, 27 reports in the last 12 weeks), South End (4.6), Mission Hill (4.3), Beacon Hill (4.3).
  Main drivers there: recent rodent reports, dead-animal and indoor-pest reports nearby.

## Limitations

- **Reports, not rats.** Areas that report less (fewer 311 users, more renters, language barriers) look safer than they are.
  Reporting volume is a feature to partly control for this, not a fix.
- **Exact counts are weak.** MAE is no better than the 4-week average; the value is in ranking blocks.
- **Overestimates the busiest blocks** (predicted 1.5, actual 1.1 on average).
- **Recurrence ignores what the city did** until closure actions are classified.
- **Boston only.** Cambridge and Somerville were tested (`cell_week_poisson_gbm_cities`): capture 41–46% in Cambridge and 35% in Somerville,
  with much less data; not shown on the map.
- **What-if results are model estimates**, not measured effects of interventions.

## Reproduce

```bash
cd pipeline && set -a && . ../.env.local && set +a
uv run pytest -q tests/                              # model tests
uv run python -c "import psycopg,os; from rat_audit import model; c=psycopg.connect(os.environ['SUPABASE_DB_URL']); print(model.train(c)); print(model.score(c))"
uv run python scripts/model_report.py --quick        # rebuild index.html (reuses data/bt_long.json)
uv run python scripts/model_report.py                # also rerun the long backtest (45–90 min)
```

## Files

| Path | What |
|---|---|
| `pipeline/rat_audit/model/features.py` | feature panel, CORE and candidate groups, no-leakage windows |
| `pipeline/rat_audit/model/gbm.py`, `baseline.py`, `backtest.py` | models and rolling-origin backtest |
| `pipeline/rat_audit/model/recurrence.py` | recurrence model |
| `pipeline/rat_audit/model/explain.py` | drivers, risk bands, emerging hotspots |
| `pipeline/rat_audit/model/surface.py` | smoothed, land-clipped map surface |
| `pipeline/rat_audit/model/__init__.py` | `train` / `score` / `simulate` (called by Modal) |
| `pipeline/scripts/model_report.py` | builds this report's `index.html` |
| `docs/rat-audit/model-report/template.html` | page template; `data/bt_long.json` = long backtest |
