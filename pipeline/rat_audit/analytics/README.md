# Analytics core (tasks 2.1–2.5, 2.7)

> **Partial handoff; not Spec v2 complete.** Compared with `main` at `f72541f`:
> task 2.2 has `action_tag` coverage reporting, but measured coverage is below 90% and `cause_tag`
> is not implemented. Task 2.3 still groups by `address_key` and computes a composite score;
> it does not implement `ST_ClusterDBSCAN` (EPSG:26986, 50 m, minpoints 3), the v2 summary fields,
> the five ordered rules or the legal-lane filter. Existing recommendations include baiting,
> which the v2 recommendation policy excludes. Revalidate recurrence/outcomes after changing
> the site definition. The model modules already exist on `main` and are not owned by this handoff.
>
> Migration `20261024600001_analytics_core.sql` matches CONTRACT's `*_analytics_*.sql` naming
> pattern, but does not add the v2 `cause_tag` column or the rest of the v2-loop schema.


`run_all(conn)` is what `rat_audit.jobs.analytics()` calls. It needs migration
`supabase/migrations/20261024600001_analytics_core.sql` (additive: new columns on `grid_cells` and
`action_outcomes`, plus the `analytics_runs` table).

## Run it (integrator, after the data load)

```bash
cd pipeline
supabase db push                               # or apply 20261024600001_analytics_core.sql
uv run python -m rat_audit.analytics           # all steps; exit code 1 if any step is not ok
uv run python -m rat_audit.analytics --steps grid,classify   # a subset
# on Modal: jobs.analytics() (already wired; no change to jobs.py / modal_app.py)
```

Then check the result (read-only; every row should say `ok = true`):

```bash
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f pipeline/rat_audit/analytics/validate.sql
```

It checks the migration, the last `analytics_runs` row, grid ids and clip, classifier coverage per year
(the 90% rows fail until ingest keeps the closure prefix), outcome windows and intervals, site score
bounds, ranks and recommendations, the three findings, the cost rows, and that every cited `source_id`
exists. On the local real-data run (Oct 24) it gave 20 passes and 4 failures, all of them the classifier
target (2023 86.08%, 2024 88.70%, 2025 89.51%, 2026 89.32%).

Inputs it reads: `tracts` (Boston, `climate-ready-boston-svi`), `incidents` (311 + code enforcement),
`report_volume`, `signal_volume`, `places`, `parcels`, `spending`, `events` (move_out), `decisions`.

## Steps and dependencies

| Step | Needs | Writes |
|---|---|---|
| `grid` | `tracts` (Boston boundary) | `grid_cells` |
| `classify` | rodent `incidents.closure_note` | `incidents.action_tag`, `action_confidence` |
| `outcomes` | `classify` | `action_outcomes` |
| `sites` | `classify` (+ `outcomes` numbers for the evidence text) | `sites` |
| `correlations` | trash ← `grid`; what-worked ← `outcomes`; move-out ← incidents only | `correlations` |
| `costs` | `spending`, `places(restaurant)`, `sites` | `price_impact` |

When a required step fails, the dependent step is **skipped**. It never runs on stale data. Each step
commits on its own. Incomplete findings or missing cost inputs produce `status: partial`,
`ok: false`, and CLI exit code 1. Invalid or empty step selections are rejected before DB access.
A completed computation is not proof that classifier coverage meets the 90% quality target.
The result and the `analytics_runs.steps` row look like this:

```json
{"ok": false, "run_id": 12, "steps": {
  "grid": {"status": "missing_input", "need": {"table": "tracts", "where": "city = 'boston' and source_id = 'climate-ready-boston-svi'", "loader": "rat_audit.ingest.context (...)"}},
  "classify": {"status": "ok", "classified": 10403, "updated": 10403, "coverage": {"by_year": {"2025": {"non_unknown": 0.895, "meets_threshold": false, "...": "..."}}}},
  "outcomes": {"status": "ok", "observed_through": "2026-10-23", "by_tag": {"monitoring": {"n": 3427, "recur_60d_pct": 12.63, "ci_low": 11.56, "ci_high": 13.79, "n_censored": 43}}},
  "sites": {"status": "ok", "sites": 1121, "top10": [], "normandy_st_check": [], "missing_inputs": []},
  "correlations": {"status": "partial", "findings": {"trash-storage-vs-rodent": {"status": "skipped"}, "what-worked": {"status": "ok"}, "move-out-spike": {"status": "ok"}}},
  "costs": {"status": "partial", "missing_inputs": [{"row": "cost-pest-control-payments", "table": "spending", "source_id": "boston-checkbook"}]}}}
```

## Output formats

**`grid_cells`**: `id = g250_<floor(x/250)>_<floor(y/250)>` in EPSG:26986, the same lattice as
`rat_audit.model.grid`. `geom` is the cell clipped to the union of Boston tracts. If a coastline clip
splits a cell, `geom` is the convex hull of the pieces and `land_frac` keeps the true clipped share.
Other columns: `col`, `row`, `land_frac`, `boundary_source`, `neighborhood` (the tract covering most
of the cell), `zip` (the most common incident ZIP). Cells that drop out are deleted, unless
`predictions` still references them.

**`incidents.action_tag`**: one of the contract actions. Only closed Boston rodent cases get a tag;
open cases are cleared to null. `action_confidence`: 0.9 rule match, 0.6 conditional → monitoring,
1.0 empty note, 0 unknown.

**`action_outcomes`** (one row per tag): `n`, `n_recurred`, `recur_60d_pct`, `ci_low`/`ci_high` (95% Wilson,
in %), `median_days_to_next`, `n_censored`, `window_days` (60), `observed_through`, `by_year`, `source_ids`.

**`sites`**: `id = site_<address_key[:16]>`, `score` 0–100, `rank` (null = retired but kept because a
decision references it), `report_count`, `recurrence_count`, `first_at`/`last_at`, `parcel_pid`.

`summary` holds:
- `drivers`: `[{type: incident|place, category|kind, label, count, ids[≤20], source_ids}]`
- `building`: `{pid, land_use, yr_built, own_occ, units, distance_m, source_id}`
- `adjacent_vacant`: `{id, pid, land_use, distance_m, source_id}`
- `action_counts`, `timeline[≤60]`, `score_parts`, `source_ids`, `why`
- `retired?`
- keys starting with `recur_` are written by the model and preserved on every run

`recommended` is a list of `{id, rule, action, action_tag, owner, priority, because[], evidence, source_ids, references[{label,url,kind}]}`.
Rules run in order: `escalate` (R3.9), `adjacent_lot` (R3.10), `containers` (R3.11), then the driver
table (`trash_early`, `dumpster`, `restaurant`, `demolition`, `city_lot`, `school`), with a `follow_up` fallback.

**`correlations`**: ids `trash-storage-vs-rodent`, `what-worked`, `move-out-spike`. The columns follow the
schema, and `chart` is `{type: scatter|bar|line, x_label, y_label, series:[{name, points:[[x,y]]}]}`.
Titles are built from the computed numbers. Strength is `none` unless the permutation p < 0.05 for
the trash finding, or the interval excludes 0 for what-worked.

**`price_impact`**: ids `cost-pest-control-payments` (USD by fiscal year and department),
`cost-restaurant-rodent-citations` (businesses and violations for 2025, explicit vs all, plus totals since 2024),
and `cost-repeat-cases-chronic-sites` (**cases**, never visits or dollars). Every row carries the
R7.5 price caveat.

## Tests

```bash
cd pipeline
uv run --group dev pytest rat_audit/analytics/tests -q                 # unit + property tests (no DB)
docker run -d --name rat-analytics-pg -e POSTGRES_PASSWORD=test -p 54329:5432 postgis/postgis:16-3.4
ANALYTICS_TEST_DB_URL=postgresql://postgres:test@localhost:54329/postgres \
  uv run --group dev pytest rat_audit/analytics/tests/test_integration_db.py -q
```

The integration test creates and drops its own database from all migrations and loads synthetic
`fx-` rows only. It refuses Supabase URLs.

## Known limits

- Ingest's `clean_note` strips the 311 prefix ("Case Noted."). On public notes the classifier reaches
  89.5% (2025) and 89.3% (2026) non-unknown; on the raw portal text it reaches 97.6% and 96.2%. Most of
  the remaining unknowns are "message has been left with constituent", which names no action. To
  restore the research's treatment, ingest would need to keep the prefix (for example as a flag).
- Restaurant per-year counts are a lower bound when a business has more than 20 citations, because
  `attrs` keeps the last 20.
- Adjacent vacant uses parcel centroids within 40 m, so it is approximate.


## Resumption validation — 2026-10-24

Scope: analytics-core only, branch `feat/rat-audit-analytics-core`, starting commit `8814c1d`.
Existing uncommitted implementation and migration preserved; no migration, merge, push or deploy performed.

This worktree has no `.env.local`; `rat_audit.db` reads the process environment, not dotenv files.
Load the existing file explicitly from this worktree (never print variables or enable shell tracing):

```bash
set +x
set -a
. /Users/mcarolinaporto/Projetos/hackachusetts/.env.local
set +a
```

Loading was verified. The file contains the public Supabase URL/key but no `SUPABASE_DB_URL`;
loading it does not enable the SQL worker. Shared-project MCP access was denied and public API GET
returned HTTP 401 with the supplied credentials, so shared schema/data were **not revalidated**.
The earlier shared-grid/site-ID conflicts in the log remain unconfirmed integration dependencies.

Current evidence:
- **108 unit/property/mock tests passed**, including 16 new mocked regression cases; **2 integration
  tests skipped**. Those tests apply migrations to a disposable DB, which this session did not permit.
  Their assertions were aligned with the new `partial` status, but they were not rerun against a DB.
- Existing local real-data container `rat-analytics-real`: `validate.sql`, with
  `default_transaction_read_only=on`, returned **20 true and 4 false checks** over persisted outputs.
  All four failures are classifier coverage: 2023 **86.08%**, 2024 **88.70%**, 2025 **89.51%**,
  2026 **89.32%**. The 90% target remains unmet; no inferred actions were added to inflate it.
- Real inputs were also recomputed in memory through SELECT-only reads, without mocks or writes:
  19,496 rodent reports through Oct 23; 180 tracts → **2,412 cells** matching persisted IDs;
  **1,121 sites** matching persisted scores/ranks/counts; outcome sample sizes and rates matched.
  Normandy St's best rank remains **28** (the demo pin/top-three requirement is not resolved here).
- Recomputed findings: trash partial rho **0.269** (weak, permutation p **0.002**); monitoring
  **12.63%** vs citation **11.19%** recurrence, difference CI **[-4.07, 1.19] percentage points**.
  Move-out was checked only as a persisted finding, not recomputed in this session. Costs were
  recomputed from local inputs; none of these checks reran the worker's DB-writing pipeline.
- Secret scan passed, including exact-value matching against the supplied env file.

Post-rebase check against `main` at `f72541f`: **108 passed / 2 skipped** again, with 37 existing
Shapely deprecation warnings from `model/grid.py`. The entire `pipeline/rat_audit/model/` subtree
matches main. The only rebase conflict was the log; both histories were preserved. Secret scanning
and diff whitespace checks passed. This confirms branch compatibility for the tested paths, not
completion of the Spec v2 gaps listed above or validation of the shared database.
