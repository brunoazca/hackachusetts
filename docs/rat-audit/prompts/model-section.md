# Prompt — Model section (forecast, emerging hotspots, recurrence, what-if)

Copy everything below the line into the new session.

---

You own the **prediction models** for "Rat Audit Boston", a hackathon app (Hackachusetts, deadline **8 PM today, Oct 24 2026**; scope freeze 4:30 PM). Repo: `/Users/brunoazca/LocalDocuments/Hackachusetts/hackachusetts`. Work directly on `main`; commit small and **push often** (`git pull --rebase --autostash origin main && git push origin main`). Plain commit messages — no Co-Authored-By or session trailer lines. Log each real piece of work with `.kiro/klog.sh "Bruno" "—" "<did>" "<why>" "<files>" "<idea>"`. Never commit `.env.local`; a pre-commit secret scanner runs.

## Read first
- `.kiro/specs/rat-audit/requirements.md` — **R6** (prediction) is your spec; also R3.2e/R3.5 (what the UI shows).
- `.kiro/specs/rat-audit/design.md` §5 "Prediction" — features, backtest, explanations, emerging hotspots, what-if, recurrence model.
- `.kiro/specs/rat-audit/data-validation.md` + `knowledge/19_rat_data_validation.md` + `knowledge/sources/rats/validation/*_results.txt` — which signals actually predict (tested today). **Use these features; don't re-add the nulls** (rain, snow, demolitions, events, restaurants, Big Belly, holidays).
- `docs/rat-audit/CONTRACT.md`, `docs/rat-audit/TEAM.md` — ownership. `pipeline/README.md` — the Modal worker.
- Schema: `supabase/migrations/*.sql` (tables `grid_cells`, `model_runs`, `predictions`, `sites`, `incidents`, `report_volume`, `places`, `parcels`, `weather_daily`).

## You own (edit only these)
`pipeline/rat_audit/model/**`, `pipeline/tests/test_model*.py`, new migrations named `supabase/migrations/2026102450xxxx_model_*.sql`. Shared files (`pipeline/modal_app.py`, `pipeline/rat_audit/{db,jobs}.py`, `pipeline/pyproject.toml`) — only if you must, minimal, and say so in your report.

## Interface you must implement (already wired into the Modal worker)
`pipeline/rat_audit/jobs.py` calls these in `rat_audit.model` (each receives an open psycopg connection; commit yourself):
- `train(conn) -> dict` — fit + 26-week rolling-origin backtest; write a `model_runs` row (metrics, feature_importance with plain-language labels, params, trained_through). Return a short summary.
- `score(conn) -> dict` — load the latest model, write `predictions` for the backtest weeks (with `actual`) and the **next 4 weeks** starting Monday 2026-10-26; set `risk_band`, `p_any = 1 - exp(-expected)`, per-row `drivers` (top 3–5, `{feature, label, contribution, value}`); flag **emerging hotspots** (design §5). Return counts.
- `simulate(conn, request) -> dict` — what-if (P2): `{cell_id | site_id, interventions: [...], weeks: 4}` → `{baseline, scenario, delta, caveat: "model estimate, not a measured effect"}`.
- Also the **site recurrence** model (`site_recurrence_logit`, design §5): P(new rodent report at the same `address_key` within 60 days of a closure). Write `model_runs` + `sites.summary.recur_p` — coordinate: the analytics owner (Carol) writes `sites`; you only update `summary->recur_p` with `jsonb_set`.

Persist the trained model so `score`/`simulate` on Modal can load it: store a pickled/joblib blob in a new table (e.g. `model_artifacts(model_run_id, blob bytea)`) via your own migration — Modal containers have no shared disk.

## Data (being loaded right now by the data section)
- `incidents` — Boston 311 2023–2026 (rodent, pest, dead_animal, trash_storage, trash_early, missed_trash, dumping, litter, dumpster, sanitation, weeds, vacant_lot, abandoned_building, construction_debris, move_in_trash, bite), plus Cambridge/Somerville rows (`city`). Columns: `category, status, opened_at, closed_at, address_key, lat, lon, zip, neighborhood, action_tag`.
- `report_volume(city, lat_bin, lon_bin, month, n_all)` — all-type 311 counts per ~100 m bin (floor(lat*1000), floor(lon*1000)) per month: your **reporting-volume control**.
- `signal_volume(city, category, lat_bin, lon_bin, month, n)` — **code-enforcement tickets 2023+ aggregated** per ~100 m bin per month (categories `ce_trash_storage`, `ce_overfill`, `ce_weeds`, `ce_dumping`, `ce_dumpster`). Individual tickets are in `incidents` only for the last 12 months — use `signal_volume` for features.
- Coming next: parcels (year built, units — already loaded, ~79% with coordinates), weather (temperature), move-out dates (`events` kind `move_out`).
- **New (14:45):** `tracts.attrs.acs` for all 238 tracts in Boston, Cambridge, Somerville (ACS 2024 5-year via Census Reporter): `pop`, `median_income`, `pct_renters`, `pct_poverty`, `pct_people_of_color`, `pct_limited_english_hh`, `pct_housing_pre1940`, `pct_housing_pre1960` (218 matched; 20 Boston 2010-GEOID tracts have `acs_match: false`). Use population for per-resident rates and housing age / renters as static cell features (spatial join cell centroid → tract). Cambridge and Somerville now also have evidence rows in `incidents` (missed_trash, dead_animal, litter, dumping; Somerville also trash_storage, trash_early, dumpster). Coverage per layer × city: `select * from coverage_matrix()`.
- **DB space:** now an 8 GB disk (Pro); still keep tables lean.** Keep `predictions` lean (≈ cells × 30 weeks; drivers ≤ 5 short items), store at most 2 model artifacts, and delete old `model_runs`' predictions when you re-score. If writes fail with "read-only transaction", stop and tell the data section.
- Check progress: `select category, city, count(*) from incidents group by 1,2` and `select * from ingest_runs order by id desc limit 10`. Build and unit-test against whatever exists; re-run once data is complete.
- `grid_cells` (~250 m) is owned by Carol (analytics). If it's still empty when you need it, build the grid yourself in a helper the analytics owner can reuse (250 m squares in EPSG:26986, clipped to Boston neighborhoods) and tell the team — don't block.

## Model requirements (R6)
- Target: rodent reports per cell per ISO week (Boston first; Cambridge cells P2).
- Features: per data-validation.md — lags (t-1, mean t-1..t-4, mean t-1..t-12, same week last year), leading 311 signals in cell + ring (dead animal, indoor pest, improper trash storage, overflowing, out early, weeds, litter, move-in trash) t-1..t-12, code-enforcement tickets, static controls (non-rodent 311 volume, address count, median year built, units), calendar (week-of-year sin/cos, move-out flag), mean temperature last 4 weeks.
- `HistGradientBoostingRegressor(loss="poisson")` (scikit-learn; already in `pipeline/pyproject.toml`).
- **Baseline first** (mean of last 4 weeks) written as its own `model_runs`/`predictions` so the map has a forecast even if the model slips; then the GBM. Report MAE vs baseline and top-10% cell capture vs baseline. If the model does not beat the baseline, say so in `model_runs.metrics` — never hide it.
- Language everywhere: "expected reports", not rats.
- Tests (pytest + hypothesis): predictions non-negative, `p_any ∈ [0,1]`, risk bands monotonic in `expected`, deterministic with a fixed seed, no future leakage in features (feature week < target week).

## Running
```bash
cd pipeline && uv sync && set -a && . ../.env.local && set +a
uv run python -c "from rat_audit import jobs; print(jobs.train()); print(jobs.score())"   # local
export MODAL_PROFILE=harvard && uv run modal deploy modal_app.py                          # deploy worker
uv run python -c "import modal; print(modal.Function.from_name('rat-audit','analytics_and_score').remote())"
```
Modal gotcha: after a deploy, warm containers may serve old code — compare `ping()["jobs_md5"]` with `md5 -q rat_audit/jobs.py`; stop stale ones with `modal container stop -y <id>`. The Modal app also runs `weekly_retrain` (Mon 09:00 UTC) and `daily` (refresh → analytics → score).

## Done means
`model_runs` has a baseline row and a GBM row with honest metrics; `predictions` has backtest + next-4-week rows for every Boston cell with drivers and risk bands; emerging hotspots flagged; `sites.summary.recur_p` filled; tests green; deployed on Modal; pushed. Report: metrics vs baseline, top features, emerging-hotspot count, Normandy St (Dorchester 02121) cell's forecast, anything skipped.
