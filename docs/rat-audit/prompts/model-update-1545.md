# Model section — update (Oct 24, 15:45)

New data since the last run (`risk-v1-20261024T185032`, which used 38 features, none from ACS, Boston grid only):

- `report_volume` now covers **Cambridge** (13–18k requests/yr, by point) and **Somerville** (~80k/yr, at census-block centroids), same ~100 m bins as Boston. The who-reports control exists for all three cities.
- Cambridge and Somerville evidence in `incidents`: dead_animal, litter, dumping, missed_trash (both); pest (CAM housing violations 769, SOM 574); weeds (SOM 4,523); construction_debris (both); trash_storage, trash_early, dumpster (SOM only).
- Parcels with year built for all three cities: `parcels` with `city` boston / cambridge (28,850) / somerville (18,997).
- ACS for all 238 tracts: `tracts.attrs.acs` (pop, pct_renters, pct_housing_pre1940, pct_poverty, median_income, …).
- Per layer × city coverage: `select * from coverage_matrix()`.

## Asks, in order

1. **Ablation for ACS** — train the current Boston model with and without the `acs_*` features; write both to `model_runs` (e.g. `params.ablation = "no_acs" | "acs"`) with top-10% capture and MAE vs baseline. This answers "how much do demographics help?".
2. **Three-city model** — extend `grid_cells` to Cambridge and Somerville and train on features that exist in all three cities only: rodent lags (cell + ring), dead_animal, litter, dumping, missed_trash, pest, construction_debris, report_volume (`vol_311_52`), parcels count / median year built / units (`parcels` has every city now; drop the `city = 'boston'` filter in features.py), ACS, calendar, temperature, plus a `city` categorical. Keep Boston-only signals (code enforcement, trash_storage in CAM) out of the shared model, or set them to NaN outside Boston (HistGradientBoosting handles NaN) — never 0, which would read as "no problem here".
3. Report per-city top-10% capture vs baseline (Boston, Cambridge, Somerville separately) in `model_runs.metrics.per_city`, and keep saying when MAE does not improve.
4. Somerville points are block centroids: use a ring of ≥ 250 m around cells there, and say so in the caveat.
