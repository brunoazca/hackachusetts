# Analytics core — Spec v2

Front A / Carol, branch `feat/rat-audit-analytics-core`. This front produces the
numbers consumed by Insights, the site inspector and the agent. It does not build
the UI or train Bruno's forecast models.

## Current shared status — migrations applied (2026-10-24)

The three analytics migrations below are installed in shared project `rat-audit`
(`vfizpwajekykmbcrport`) through the authorized Supabase connection. This supersedes
older access-blocked statements. The Python refresh has **not** run: the supplied
session-pooler connection reaches Supabase but returns `password authentication failed`.
The dotenv was parsed in memory; no credential was printed, copied or committed.
The standard dotenv parser agrees with the loader; keyword-parameter connections
rule out URI escaping. Session and transaction pooler endpoints both reject
authentication; the postgres role is enabled and not expired. Direct connection
could not resolve its hostname here, so it cannot establish password validity.
The user confirms the database password; comparison with the dashboard pooler host
is pending. A transient pooler credential cache is possible but unconfirmed.

- Migration history now records `20261024194305`, `20261025000000` and
  `20261025000001` with their analytics names. Existing baseline tables had no
  migration-history rows. Only these three analytics entries were reconciled;
  the integrator must reconcile the baseline before using a blanket migration push.
- Exact before/after checks across all three migrations preserved **206,520
  predictions, 39 model runs and 2 model artifacts**. Predictions checksum:
  `5faa3115a1b526bfc25714834ec10f94`; artifacts checksum:
  `e698a89253cbd456dcdc497da7890c52`. Both still matched at 20:43 UTC.
  The model-runs checksum changed in a later read while its count stayed 39;
  the cause is not established, and no analytics refresh had run. Do not describe
  that later model metadata as unchanged.
- Real shared, read-only `anon` RPC checks passed: Insights returns forecast run
  `risk-v1-20261024T185032` and four future weeks; queue returns legacy rows;
  supporting RPCs execute. Findings/costs are still empty pending refresh.
- A **synthetic, rolled-back** shared transaction exercised `design_trial` as
  `anon`: one pair and a pending result. Confirmed zero test sites, trials and
  trial pairs afterward. This is public-role/transaction validation, not a real trial.
- Carol explicitly authorized public demo trial writes and termination of the
  three identified idle sessions that blocked DDL. No other sessions were terminated.
- Existing out-of-scope issue: `model_artifacts` has RLS disabled and `anon` has
  SELECT/INSERT privileges. The data/model owner should review this before main
  integration ([Supabase advisory](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)).
- Local evidence remains 141 unit/property/mock tests, five read-only PostGIS
  fixture tests, five disposable migration/runtime tests, and a passing production
  build/TypeScript check. These do not establish a successful shared Python refresh
  or deployed UI flow. Regional-input and real AI-check-provider gaps remain explicit.

No main merge/push or deploy was performed. The feature branch is the handoff target.

## Earlier local validation — authorized migrations (2026-10-24)

This update supersedes the earlier unexecuted-migration status below. Carol authorized
shared migrations and analytics; access to the correct Supabase project is still missing.
No shared migration/refresh, main merge/push or deploy has occurred.

- 141 unit/property/mock tests passed; five native read-only SQL fixture tests
  passed separately. The default run skips the ten opt-in database tests, all run
  separately. 37 existing Shapely deprecation warnings remain in model/grid.py.
- Five disposable PostGIS integration tests passed: migrations installed; P0 ran
  twice; legacy/v2 queue and detail compatibility; seeded trial writes, reproducibility,
  active-site exclusions, pending/mature results, frozen member snapshots; support RPCs
  and required rejection reasons. Synthetic fixtures, admin role; not shared data or
  public-role validation.
- Exact predictions, model_runs and model_artifacts snapshots stayed unchanged after
  migrations and repeated refreshes. Prediction-referenced grid cells survive pruning.
  Site recur_* probabilities survive unchanged membership and are invalidated when
  members change; cell-week predictions remain unchanged.
- SQL Wilson bounds now handle zero/all returns exactly; containment checked for all
  counts with sample sizes 1–100. The legacy queue remains available until v2 refresh,
  and old address-based detail IDs remain readable afterward.
- Production Next.js build and TypeScript passed with supplied dotenv values loaded
  in memory only. No frontend source or lockfile changed. This does not verify the
  separate Insights branch or a deployed end-to-end flow.
- Shared access is the remaining deployment blocker: connected plugin lists other
  projects; CLI has no login; supplied dotenv has no SQL URL. User chose plugin
  reconnection. Verify migration history and existing public-role grants before applying.
  Missing regional inputs and a configured real AI-check adapter remain separate gaps.

## Earlier delivery evidence (before migration authorization)


| Tasks | Implementation | Validation / remaining dependency |
|---|---|---|
| 2.1 | Boston 250 m grid, stable model-compatible IDs | Unit/property and earlier local real-data validation |
| 2.2 | Action + cause tags; separate coverage reports | Local public notes: 2025 **90.52%**, 2026 **90.24%** non-unknown; ≥90% gate passes |
| 2.3–2.4 | 50 m DBSCAN clusters, counts, returns, case summary, five ordered recommendations, legal lanes, outcomes and Wilson intervals | Native PostGIS SELECT plus real inputs, computed in memory; persistence not tested |
| 2.0, 2.19–2.21, 2.23 | V2 schema; base rates/Due, queue/case, seeded trial design/results, practice shift, enforcement gaps, follow-ups | SQL/PLpgSQL parsed; selected SQL bodies exercised without installing functions; migration and writing RPCs unexecuted |
| 2.5, 2.7 | Three core findings, matched what-worked headline, counted costs with source date | Calculation tests; local source reads; new persisted outputs pending authorized refresh |
| 2.8 backend | `insights_summary()` from C's `RPC_PROPOSAL.md` | Empty/populated/forecast SELECT fixtures and existing real local rows passed; shared RPC deployment pending |
| 2.9 | Nine dated research findings, including honest nulls | Explicit `dated_research` label and source; not presented as live recalculations |
| 2.12, 2.14 | Matched assessments, listings, Zillow, regional reports and smart-box comparison | Synthetic calculation tests; real reads described below; missing inputs stay explicit |
| 2.17–2.18 backend | Neighborhood rank, low-reporting tract context, schools-near-hotspots card | Equity query found 177 eligible local tracts; UI integration belongs to the map/Insights fronts |
| 2.22 | Expected-vs-actual month; validated cached AI-check adapter, preserves human edits | Fake-LLM cache/privacy tests only; real model adapter not configured |

The worker writes data. It was **not** run against the shared database during this
handoff. No migration was applied locally or remotely. A compiled file or a passing
SELECT fixture is not a validated deployment or a complete migration test.

## Migrations

All files follow CONTRACT's `*_analytics_*.sql` pattern:

- `20261024194305_analytics_insights_rpc.sql`: stable, invoker RPC; unchanged JSONB
  finding/cost payloads, cited sources, latest GBM (baseline fallback only when no
  GBM), future weeks in Boston time and deterministic top five cells.
- `20261025000000_analytics_core.sql`: existing core columns and run log. Renamed
  from `20261024600001_analytics_core.sql` because fetched main uses version
  `20261024600001` for `incidents_archive`. **If a database already recorded the
  old analytics version, the integrator must reconcile its migration history;
  do not blindly replay the renamed migration.**
- `20261025000001_analytics_v2_loop.sql`: cause, base rates, reject reason, trials
  and RPCs. Ordered after legacy migrations that use invalid clock hours in their
  numeric versions. No other front's migration was edited.

`insights_summary` relies on the tables' existing SELECT grants and public-read
RLS policies, just like C's proposal. The automatic approval review rejected an
extra table-GRANT expansion; those grants were not added. Verify existing privileges
as part of authorized deployment. Creating the RPC alone does not populate empty
`correlations`/`price_impact` tables: the analytics refresh must also run.

## Semantics consumers must retain

Sites are Boston rodent reports in 2024–2026, after duplicate removal and same-key,
same-local-day bulk collapse (≥5 → one), then
`ST_ClusterDBSCAN(ST_Transform(geom,26986),eps:=50,minpoints:=3)`.
Noise is excluded. Density-connected clusters can extend farther than a 50 m radius.
IDs hash the earliest retained incident, deterministic for the same input; backfills
and cluster merges can change IDs. Historical sites are retired, preserving decision
and trial references. No approval is transferred to another cluster.

A return opens 1–60 Boston calendar days after an earlier closure in the same site.
Outcomes require the entire 60-day window, including cases that returned early.
The queue sorts Due first, then returns in 12 months. Legacy `sites.score` is zero
only to satisfy the old schema and is omitted from the new queue/case RPC payload.
Model-owned `recur_*` keys survive only when the retained member IDs are unchanged.

Local base rates for 0/1/2/3+ prior returns are **40.01%, 41.51%, 47.17%, 84.93%**.
The placeholder 25% would flag every bucket; **50%** separates the high-return
bucket in these local inputs. Recalibrate on the shared cohort. The threshold is
stored in `base_rates`, carried into the case and checked against the current date
by the RPC. Counts are reported complaints, not rat population.

`summary` includes full timeline, ladder, closure speed by action vs citywide,
same-day share, last five scrubbed notes with both tags, sources, drivers, building,
vacant adjacency, trash tickets, enforcement gap, neighborhood rank, equity,
expected month, season-adjusted 90-day counts and a Normandy demo pin. Recommendations
use exactly the first applicable rule: untried citation/abatement after repeated
soft-action returns; vacant lot; trash containers; sewer referral; cause inspection.
Historical baiting may appear in notes/outcomes, never in recommendations.

Rates in `action_outcomes` are **percentages**; base rates, yearly breakdowns and
trial Wilson intervals are **fractions**. The what-worked headline uses exact
matching on prior-report bucket × neighborhood × month, one mature closure/site,
and a seeded pair bootstrap. The unadjusted contrast is supporting detail only.
No causal effectiveness claim is made.

Trials match neighborhood × prior-return bucket × trash-ticket tercile, exclude
active trial sites, and use a supplied seed. Results stay pending until both clock
and observed data cover 60 days. The prospective outcome is a report on days 1–60
within 50 m of any frozen cluster member; it does not silently redefine arms after
clusters merge. Designing a trial does not carry out an intervention.

Research findings retain their Oct 24 source/method and are not current fits.
Price comparisons are exploratory; costs count payments, citations and **cases**,
never inferred visits/hours/damage. Population vintages and missing regional inputs
remain visible; the loaded census populations are not the requested current ACS.

## Running and testing

`rat_audit.db` reads process environment; it does not auto-load dotenv. This worktree
has no copied secret file. Load the supplied file without echo/tracing:

```bash
set +x
set -a
. /Users/mcarolinaporto/Projetos/hackachusetts/.env.local
set +a
```

The supplied file was verified to have public Supabase settings but no SQL URL.
A SQL worker needs `SUPABASE_DB_URL`. Earlier shared access attempts returned MCP
permission denied / HTTP 401; these credentials do not establish shared validation.

After the integrator separately authorizes/applies schema and supplies a SQL
connection, the existing worker entry point remains `run_all(conn)` / jobs.analytics:

```bash
cd pipeline
uv run python -m rat_audit.analytics --steps grid,classify,outcomes,sites,correlations,costs,research
```

All steps also include `impact`, `regional`, `unknowns`. Missing inputs produce
partial/skipped statuses and a nonzero CLI exit. To enable actual AI drafts, call
`run_all(conn, unknowns_drafter=adapter)` or `unknowns.run(conn, draft=adapter)`.
The adapter receives `(instructions, public_evidence)` and returns 2–3 question
strings (or a JSON array string). No provider keys are read or model calls made by
this module. Results are cached in `summary.unknowns`; the consumer edits
`answer`/`edited`, retaining the check ID. The UI/provider integration is still needed.

```bash
cd pipeline
uv run --group dev pytest rat_audit/analytics/tests -q -p no:cacheprovider
# Optional existing PostGIS connection; fixture forces default_transaction_read_only=on:
# ANALYTICS_READONLY_DB_URL=<connection> uv run --group dev pytest rat_audit/analytics/tests/test_rpc_sql.py -q
```

`ANALYTICS_TEST_DB_URL` enables a different suite that creates/drops a disposable DB
and applies migrations. **It was deliberately unset here**; both tests are skipped.
`validate.sql` is a read-only post-integration validator requiring the new schema;
it cannot validate uninstalled functions. Do not confuse it with applying schema.

## Evidence from this handoff (2026-10-24)

- **141 unit/property/mock tests passed**. Seven skipped in that invocation: two
  migration integration tests and five opt-in read-only SQL tests. The **five SQL
  tests passed separately** on native PostGIS, using synthetic CTE fixtures; no DDL.
- SQL and PLpgSQL parsed for all analytics migrations. Installation, role-level
  execution and the writing `design_trial` RPC remain untested.
- Real local data through Oct 23: **11,530 retained clustered reports, 1,073 sites,
  228 Due**. Reclassified original public notes before clustering in a read-only
  CTE; recomputed outcomes/recommendations in memory. Every recommendation passed
  the legal filter. No persistence mocks were used for this core recomputation.
- Action coverage 2023/2024 = **86.98%/89.39%** (below 90%); 2025/2026 =
  **90.52%/90.24%** (the Spec v2 acceptance years). Contact-only notes remain unknown.
  Cause assigned to every closure; named causes in 2025/26 = **8.88%/13.90%**.
  `none` means the note names no cause, not that a cause does not exist.
- Matched comparison: **181 pairs, RR 0.964, 95% bootstrap CI [0.782,1.209]**,
  no conclusive difference. Normandy's main cluster: **28 reports, 22 returns,
  rank 44, Due, adjacent vacant parcel, demo_pinned**. No artificial rank boost.
- The Insights SELECT on existing local persisted outputs returned three findings,
  three costs and ten resolving source citations; forecast null because that local
  DB has no model runs. Forecast branches were tested with synthetic SQL fixtures.

- P1 real-input checks: matched assessments, listings, ZIP prices, schools and
  building context all computed successfully, with sources resolving. Ranked v2
  sites were supplied as a SELECT-only CTE and output writers were suppressed:
  this validates the calculations/queries, **not persistence or an end-to-end run**.
  The indexed proximity query completed in 0.31 s; schools query about 33 s locally.
- Regional SELECT succeeded but is **partial**: the local copy has 46 Boston
  report-months, no Cambridge/Somerville report months and no eligible smart-box
  follow-up cohort. Populations are 2010/2020 census, not current ACS. Data ingestion
  and a genuine three-city comparison remain blocked on those inputs.
- Remaining operational checks: apply migrations with separate authorization;
  run persistence/writing-RPC tests and shared refresh; connect the UI; configure
  the AI-check adapter. No merge, main push, deploy or shared-DB write was performed.
