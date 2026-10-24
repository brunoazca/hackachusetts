# Insights panel — task 2.8

Owns `web/src/components/insights/**`. Requirements: R5.1/R5.4, R6.2–3/R6.6,
R7.4–5. The database writers, shared shell, map and migrations belong to other
fronts. Work started on `feat/rat-audit-insights` at `1af6bcd`. It is now committed
and integrated into local `main`; see the latest verification below.

## Evidence-first panel — 2026-10-24 16:56

**Local integration verified at 16:58:** clean main fast-forwarded from `cf4389b`
to `96be3bc` (including `b9e61dc`). Main production build and real browser checks
on port 3000 passed; all observed forecast/map/queue RPCs returned 200 in this run.
The existing in-app tab now displays the new Insights panel. Final local suite:
58 synthetic/mock/SSR + 5 prior-real-export checks passed. Evidence: `build-main.log`,
`tests-final.log`, `browser-main.json`, `main-night.png` and `main-forecast.png` in the
scratch directory below. No push or deployment.

Rebased this front onto main `cf4389b`, retaining main's Piper UI and research
component, all previous log entries and the matched-v2 follow-up (`b9e61dc`).
Carol's latest review identified a product problem: a technical forecast dump and
three empty sections did not explain what the evidence means.

- Research findings now lead the panel when the current findings table is empty.
  The existing report's repeat-risk contrast (8–12% versus 56–75%) and matched
  comparison (RR 1.03, CI 0.89–1.20) have a visible historical label/date, pinned
  source links and observational limitations. They are not newly computed DB rows.
  Published findings replace this fallback when present.
- Forecast explains the real tradeoff: top-decile capture 64.3% versus 54.3%, but
  count MAE 0.075 versus 0.071. Raw IDs, drivers, four-week tables and scores remain
  available in closed, keyboard-accessible details. No model results were changed.
- Two buttons reuse existing map-store actions: review places with repeat reports;
  select the forecast's first week and enable its map layer. One pending-results
  notice replaces repeated empty costs/price/findings sections.
- All edited panels use existing theme tokens; no dependencies or shared-shell
  changes. Re-read TEAM/CONTRACT/spec and Carol's assignment: this remains task 2.8.

Verification:

- **58 synthetic/mock/SSR checks passed**; **5 checks on an older real local export
  passed**. The export is test input only, not a production fallback.
- **4 shared-database checks passed; 3 skipped** because correlations and
  price_impact are still empty and there are no finding/cost source references.
  Forecast comparison covers 13,768 real predictions across four weeks.
- Scoped ESLint and production build passed. Build retains two Next font-fallback
  metadata warnings; no compile/type errors.
- Real browser at port 3038: Insights GET 200, source-labelled research, honest
  forecast summary, keyboard disclosure, both map actions and night/bone themes.
  No uncaught JS errors or internal panel overflow (378/378 px), including a
  390 px viewport. The shared shell still slightly clips the panel's left border
  (content x=-1) and overlaps controls on mobile; full mobile acceptance is open.
- One map_forecast request returned 500 during the browser run; an independent
  read-only GET immediately returned 200 with 1,345 cells. forecast_surface,
  forecast_run and site_queue returned 200. Do not infer durable map/API reliability
  from the panel tests. The map/model owner should investigate if this recurs.
- Initial browser harness attempts incorrectly blocked read-only RPCs sent by POST
  and looked for a switch before opening its menu. Corrected the harness after
  checking the stable read-only SQL; no server responses were mocked.

Evidence: `/private/tmp/insights-product-review-20261024/` (`tests-local.log`,
`live.log`, `build.log`, `browser-preview.json`, theme/forecast/mobile screenshots).
Generated stale dev cache was moved to a scratch backup before restarting the
preview. No secrets printed, shared writes, migration changes, push or deploy.
Fresh findings/cost/price results remain Analytics A's publishing dependency.

## RPC now live; v2 client follow-up — 2026-10-24 16:34

Analytics supplied/applied the RPC outside this front. Public-key GET now returns
HTTP 200 and the forecast renders from the real shared database. The first call
returned 500/57014 during the migration window; subsequent isolated/live/browser
calls succeeded. This does not yet certify findings or cost results: both tables
still have zero rows in this check.

- **Real shared data:** 4 live tests passed, 3 explicitly skipped for missing
  findings/costs/citation references. Compared 13,768 predictions over 4 weeks,
  3,442 cells/week, exact risk-band counts and top-five cell values. No mocks.
- **Numerical diagnosis:** SQL `sum(real)` vs JS double summation differed by at
  most 0.00124 reports in these four totals. Replaced the arbitrary fixed relative
  tolerance with the float32 sequential-summation error bound; counts, bands and
  top cells remain exact assertions. Evidence: `forecast-diagnostic.json`.
- **Independent diagnostics:** RPC failures no longer prevent raw stored-model
  checks from running. Integration checks still fail on RPC errors, rather than
  turning errors into skips. The test week boundary now matches America/New_York.
- **Client compatibility:** handles Analytics v2 `matched` and
  `unadjusted_contrast`; preserves ratio, supplied interval and pair count, labels
  descriptive case counts separately, and marks unavailable matched intervals as
  insufficient data. No matched effect is inferred or calculated in the client.
- **Synthetic/mocks/SSR:** 54 passed (5 new regressions). These validate the new v2
  contract with synthetic data; v2 results have not yet been published for live
  validation. Five checks against the earlier real local export also passed.
- Scoped ESLint and `pnpm build` passed on the Insights worktree.
- Browser on `http://localhost:3038`: real GET 200, 4 forecast weeks, explicit
  model-vs-baseline comparisons, no uncaught errors and no panel overflow
  (419 px content/scroll). No response interception or fixtures.

The integrator finished main at `cf4389b` during this check. A separate browser run
on `http://127.0.0.1:3000` confirmed the same real forecast, GET 200, no page errors
and 380/380 px panel width in the new shell. Its initial harness tried a hidden tab;
opening the new **Open Insights** rail button first fixed the harness. This main
run verifies the already-integrated forecast; the new matched adapter remains on
the feature branch for integration. Screenshot inspection then found stale main
dev CSS: missing `--p-fg`/`--p-panel`, transparent panels and dark text. Restarting
alone did not fix it. Stopped only this session's server, moved `.next/dev` into the
scratch backup, and restarted; the final browser check loaded the expected tokens,
light text on dark panels and 378/378 px content/scroll. No main source edits. Final
evidence: `browser-main-fresh.json` and `forecast-main-fresh.png`.

Evidence and backups: `/private/tmp/insights-migration-validation-20261024/`.
No shared database writes, pipeline runs, RPC/migration changes, merge, push or
deployment were performed by this front. Main was in an unrelated merge when
work started, so all edits remained in this worktree.

### Starting the app locally

The ignored `web/.env.local` symlink points to the supplied root env; Next loads it
itself. From `web/`, use `pnpm dev`. Avoid `node --env-file=… next dev`: this installed
Next forwards that flag into child `NODE_OPTIONS`, which Node rejects. Node/tsx
standalone tests may still use `--env-file=.env.local`. The main checkout also now
has this ignored symlink (created during the startup fix); values were not copied.

## Local main integration — 2026-10-24 15:57

Integrated the Insights branch after updating it over main's newer work. The merge
uses main `7559202` and Insights `8a707a9` (implementation `5a3ff40`), retaining the
shared shell/map/model changes and all existing log entries. This section supersedes
the older Git-status observations below.

The combined **main checkout** passed the five-file runner (58 passed / 4 skipped,
including the fixture-module load) and **pnpm build**. Breakdown: 49 synthetic/mock
checks, 5 checks on exported real local rows, 3 public-key availability/model checks;
4 RPC integration comparisons remain skipped. No endpoint or production-data fallback
was added. This integration has not been pushed or deployed by this front.

For this main checkout, dependencies were installed with `pnpm install --frozen-lockfile`.
It has the existing env at the repository root, but no `web/.env.local` symlink.
Run Node checks from `web/` with `--env-file=../.env.local`; the build was invoked as
`pnpm build` in a child process inheriting those loaded variables. No env values were
printed or copied and no dependency manifest/lockfile changed. The worktree commands
below refer to its pre-existing `web/.env.local` symlink.

Evidence: `/private/tmp/insights-main-integration-20261024/tests-on-main.log` and
`build-on-main.log`. The analytics RPC and shared mobile-shell acceptance remain the
previously documented integration dependencies.

## Rebase verification — 2026-10-24

At Carol's explicit request, committed the preserved implementation as `76135ce`,
then rebased over the 58 commits on local `main` (`3d73243`). The rebased implementation
is `471a2a5`. The actual conflict was only `.kiro/KIRO_LOG.md`, not InsightsPanel:
all 131 main log entries and 19 added Insights entries were retained. Main's historical
log corrections were also kept. InsightsPanel kept its client boundary and new component
imports; all main changes outside this front came through the rebase unchanged.

Executed **all five files in `__tests__/`**, from `web/`, with the real env and local
read-only export loaded. Node reported **62 entries: 58 passed, 4 skipped, 0 failed**:

- 49 synthetic/mocked adapter and SSR tests passed.
- 5 tests against persisted real local analytics/source rows passed.
- 3 shared-database checks passed: unavailable endpoint handling and stored GBM/baseline
  score adaptation/SSR. The four RPC comparisons (findings, costs, forecast, citations)
  skipped because `insights_summary()` still returns 404/PGRST202.
- The remaining successful entry is loading `fixtures.ts`; it is not another assertion
  or another real-data validation. There are four test files plus that fixture module.

**`pnpm build` passed after the rebase.** The pnpm wrapper installed the one dependency
already added by main (`lucide-static`), then ran main's worker-copy prebuild and Next
production compilation/typecheck successfully. Insights added no dependency or lockfile
change. Public correlations and price_impact still have zero rows.

The full proposal SQL was sent, as Carol requested, to the existing **A - ANALYTICS**
chat (`01a16f49-47a6-7991-b4e9-ad8f9387287e`) for analytics to prepare/review the migration.
The handoff explicitly preserves the read-only/no-migration-application restriction.
No RPC or migration was created or applied by this front; unavailable is still correct.

Evidence: `/private/tmp/insights-rebase-20261024/` contains the pre-rebase backup,
three log versions, `tests-after-rebase.log` and `build-after-rebase.log`.
No push, merge into main or deploy was performed. Earlier sections below record earlier
checks and should not be read as the latest Git status.

## Current scope audit — 2026-10-24

Re-read root/web READMEs, `web/AGENTS.md`, steering, TEAM, CONTRACT, the local spec,
the task log and the updated requirements/tasks on local `main` (`3d73243`).
Carol owns analytics and the agent collectively; **this worktree was assigned
2.8**, as recorded in the initial 13:25 log entry. It does not own all Carol tasks.
The user's branch-preservation/read-only instructions override older steering
that says to work directly on main.

| Responsibility | Status and owner |
|---|---|
| 2.8 / R5.1, R5.4: cards, charts, nulls, caveats, citations | Implemented and checked here. Names, links and retrieval dates now render when the RPC supplies `sources`; missing metadata is explicit. |
| 2.8 / R6.2–3, R6.6: baseline/model scores, features, cell drivers | Implemented; real stored model/baseline SSR passes. Actual RPC aggregates remain blocked. Model training is Bruno/2.6. |
| 2.8 / R7.4–5: counted costs, department payments, exploratory caveats | Implemented; real persisted local rows pass. The shared tables remain empty. |
| R9.1 / desktop R9.4 within Insights | Desktop replay, accessible chart alternatives, details keyboard toggle, focusable action table and source links passed. This is not a complete app accessibility certification. |
| 2.1–2.5, 2.7, 2.9, 2.12, 2.14 | Analytics producers, owned by A/Carol's other front. No recomputation or writes here. Current v2 matched headline and other missing findings require producer output. |
| 2.13 (P1 finding → map), 2.18 (schools impact), 4.1–4.6 (agent) | Separate tasks, not completed or claimed by this 2.8 handoff. The added department table does not implement school proximity analysis. |
| RPC migration / publication of real analytics | A/integrator dependency, still missing. The proposal now includes source metadata; it has not been executed. |
| R9.4 mobile shell / task 5 integration | Shared `web/src/app/page.tsx` still fixes the aside at 420 px with `shrink-0`; a 390 px viewport clips content. Integrator/UI owns the shell fix. |

**Do not mark task 2.8 fully accepted yet.** Client checks are green, but real RPC
success and complete citations depend on the integration above. The app-wide demo,
mobile shell, merge compatibility and deployment are not validated by this build.
No task checklist outside this front was marked complete.

### Latest verification

- **49/49 synthetic, mock and SSR tests passed.** Three new regressions exposed
  absent citation metadata and invalid date-like x-axis labels emitting NaN.
  The client now keeps valid metadata, permits only HTTP(S) source links, and
  treats unparseable date labels as categories. Legacy payloads still render.
- **5/5 real local exported-row/SSR tests passed:** 3 findings, 3 costs, 13 action
  groups, 40 department rows, and all 10 referenced sources resolved. Queries ran
  in `BEGIN READ ONLY` with `default_transaction_read_only=on`; no pipeline run.
- **Shared live suite: 3 passed, 4 skipped, 0 failed.** Availability handling and
  stored GBM/baseline SSR passed; finding, cost, forecast aggregate and source
  metadata integration comparisons all skip because the RPC is 404/PGRST202.
  Public correlations and price_impact still have 0 rows.
- **Browser with real-data replay:** passed at 1280×800, including 18 citation links
  across the cards, retrieved dates, keyboard access and no uncaught errors or
  horizontal panel overflow. HTTP response interception remains explicit.
- **Mobile check:** 390×844 exposes the shared 420 px shell issue above; it did not
  pass full-app mobile acceptance. The Insights content itself fit its 419 px box.
- **TypeScript, scoped ESLint, production build, whitespace check and secret scan
  with the existing real env reference passed.** No dependency or lockfile change.

The final audit artifacts and pre-audit backup are under
`/private/tmp/insights-final-audit-20261024/`: `before/`, `export-analytics.sql`,
`analytics-real-with-sources.json`, `browser-audit.mjs`, browser result JSON and
screenshots. These exports are test evidence only and never imported by app code.
Earlier sections below are dated history; their smaller test counts are superseded
by this audit.

## Local environment

Run commands from `web/`. Its existing, git-ignored `.env.local` is a symlink to
`/Users/mcarolinaporto/Projetos/hackachusetts/.env.local`. Next loads it automatically;
Node/tsx tests need `--env-file=.env.local`. No values need to be printed or copied.
The root of this worktree has no `.env.local`, so run the commands below from `web/`.

The panel and live tests use only `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. Live tests reject methods other than GET/HEAD.
Production uses `rpc("insights_summary", undefined, { get: true })`.

## Run tests

From `/Users/mcarolinaporto/Projetos/hackachusetts-insights/web`:

```bash
# Synthetic fixtures, mocked fetch results, static React rendering; no database.
npx --yes --package=tsx@4.19.2 tsx --test src/components/insights/__tests__/parse.test.ts src/components/insights/__tests__/render.test.tsx

# Real local SELECT export (including sources); no database access in this test.
INSIGHTS_ANALYTICS_ROWS=/tmp/insights-analytics-rows.json \
  npx --yes --package=tsx@4.19.2 tsx --test src/components/insights/__tests__/analytics-rows.test.ts

# Real public-key reads; no fixtures or writes. Missing prerequisites are explicit skips.
npx --yes --package=tsx@4.19.2 tsx --env-file=.env.local --test src/components/insights/__tests__/live.test.ts

./node_modules/.bin/tsc --noEmit --incremental false
./node_modules/.bin/eslint src/components/insights
./node_modules/.bin/next build
```

The handoff reused the installed npm-cache copy of tsx 4.19.2 via
`node --import <tsx-directory>/dist/loader.mjs --test ...`; no package or lockfile
was changed. Node 26.3.0 reports a non-failing tsx `module.register()` deprecation.
Without loaded env, all seven live tests explicitly skip. A green exit with skips
is not proof of a working live Insights panel.

## Handoff fixes and evidence — 2026-10-24

- Baseline runs actually use `model = cell_week_baseline_mean4` and store their
  own scores in `mae` / `top10pct_capture`. Those now appear in the baseline column;
  legacy `baseline_*` fields still work, including zero values.
- The RPC envelope is validated before adaptation/rendering. Invalid arrays,
  rows and forecast shapes yield an error with Retry instead of a rejected load
  promise or an incorrect empty state. JSONB statistics and chart adapters retain
  their existing per-card fallback behavior.
- The proposed RPC now names the actual baseline model and has deterministic
  tie ordering. It is a proposal only; no SQL was executed from it.
- The original 37 tests passed. Three regression tests failed before these fixes;
  the resulting 40 synthetic/unit/render tests all passed.
- TypeScript, scoped ESLint, production build with `.env.local`, and the repository
  secret scanner passed. The scanner was also pointed at the existing symlink so
  exact values from the real env were included without displaying them.

### Real data (public-key reads)

Observed: `correlations = 0`, `price_impact = 0`, `model_runs = 6` (four cell-week,
two recurrence), `predictions = 206520`, `grid_cells = 3442`.

The live suite reported **3 passed, 3 skipped, 0 failed**:

1. Real RPC GET returns 404/PGRST202; the unavailable state is correct.
2. Stored GBM run `risk-v1-20261024T185032` survived adaptation and server rendering:
   MAE 0.07518 vs baseline 0.07132 (worse); top-10% capture 0.6429 vs 0.5433 (better).
3. Stored baseline run `baseline-v1-20261024T185032` rendered MAE 0.07132 and
   top-10% capture 0.5433 in the baseline column.
4. RPC finding comparisons: **skipped**, RPC missing.
5. RPC cost/price comparisons: **skipped**, RPC missing.
6. RPC forecast totals/top-cell comparisons: **skipped**, RPC missing.

The model checks adapt stored rows directly and render React on the server; they
are not browser success-path validation. Forecast aggregate comparisons paginate
raw predictions once the RPC exists, avoiding the REST row cap.

### Browser (local Chrome, 1280×800)

Seven scenarios passed against the existing dev server on port 3038:

- **Real, no interception:** GET RPC → 404 → unavailable message.
- **Simulated network failure:** automatic client retries → error → manual Retry
  → real GET 404 → unavailable, without reloading.
- **Simulated database timeout:** error → Retry → real unavailable state.
- **Synthetic malformed payload:** error with Retry, no stuck loading state.
- **Delayed synthetic fixture:** loading → ready; four findings and four charts.
- **Synthetic baseline envelope:** 0.071 MAE and 54.3% capture, no `n/a`.
- **Synthetic empty envelope:** unavailable message.

Initial harness runs timed out because clicks raced page hydration. The corrected
harness waits for hydration/selected tab and sets CORS headers on synthetic
responses. The final six-scenario run recorded no uncaught page errors; the
separate network-abort/recovery check passed too.

Local evidence and preserved pre-handoff files (no env copies):
`/private/tmp/insights-codex-handoff-20261024/` — `before/`, `before-sha256.json`,
`browser-check.ts`, `browser-results.json`, `network-check.mjs`,
`network-results.json`, `browser-real-unavailable.png`, `browser-fixture-baseline.png`.
These are local scratch artifacts, not committed repository files.

## Analytics branch follow-up — 2026-10-24

The uploaded `feat/rat-audit-analytics-core` was verified locally and via
`git ls-remote` at `f410efe2d1bcd6fad4998285dfe0d1205405e1f9` (implementation
`3884561`). Its migration adds analytics fields/runs, **not** `insights_summary()`.
Insights remains on its original branch/HEAD; no merge, rebase or cherry-pick.

### Changes and synthetic checks

- Added per-action sample sizes, excluded/censored cases, repeat rates and 95% CIs
  together in an accessible, expandable table. Rates retain up to two decimal places.
- Exposed the supplied contrast and CI as **unadjusted**; it is not a matched or
  causal estimate. The panel never substitutes reference-study numbers for output.
- Preserved nested department payments under their fiscal years; these were
  previously dropped by the adapter.
- An insufficient-data result now says **Insufficient data**, not **No association
  found**. Real null findings retain their existing prominence.
- Six new regressions failed before the fixes. Final synthetic/unit/SSR suite:
  **46 passed, 0 failed**. TypeScript, scoped ESLint and production build passed.

### Real local outputs, separately from live integration

Read the existing `rat-analytics-real` PostgreSQL container under
`default_transaction_read_only=on`. A SELECT exported 3 correlations and 3 costs
computed at **2026-10-24 18:40:16–17 UTC**. The pipeline was not run again.
The export stays in local scratch; production never imports it.

`__tests__/analytics-rows.test.ts`: **4 passed, 0 failed**, covering source text,
charts, null findings, all 13 action groups and their denominators/censoring/CIs,
all 40 department rows across four fiscal years, cost units and lower-bound caveats.
These are real persisted-row adapter/SSR tests, not RPC tests. Without
`INSIGHTS_ANALYTICS_ROWS`, the exported-row tests explicitly skip.

Browser replay of that same export passed: 3 findings, 3 charts, 3 cost cards;
13 action rows; FY2026 school payments rendered as $629,685; no uncaught errors
or horizontal panel overflow. **The data was real, but the HTTP response was
intercepted.** This does not validate a deployed RPC. Visual checks confirmed the
sample table, department totals and adjacent caveats.

To reproduce with the existing local container, from `web/`:

```bash
docker exec -e PGOPTIONS='-c default_transaction_read_only=on' rat-analytics-real \
  psql -U postgres -d postgres -X -A -t -v ON_ERROR_STOP=1 \
  -c "select jsonb_build_object('correlations',coalesce((select jsonb_agg(to_jsonb(c) order by c.sort,c.id) from correlations c),'[]'::jsonb),'price_impact',coalesce((select jsonb_agg(to_jsonb(p) order by p.id) from price_impact p),'[]'::jsonb),'sources',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'url',s.url,'retrieved_at',s.retrieved_at) order by s.id) from sources s where s.id in (select unnest(source_ids) from correlations union select unnest(source_ids) from price_impact)),'[]'::jsonb),'forecast',null);" \
  > /tmp/insights-analytics-rows.json
INSIGHTS_ANALYTICS_ROWS=/tmp/insights-analytics-rows.json \
  npx --yes --package=tsx@4.19.2 tsx --test src/components/insights/__tests__/analytics-rows.test.ts
```

The shared-project live suite was rerun after the branch upload: **3 passed,
3 skipped**, with 0 public correlations, 0 public price-impact rows, four cell-week
model runs and RPC **404/PGRST202**. Passing cases cover availability handling and
stored model/baseline SSR; finding/cost/forecast RPC comparisons remain blocked.

### Limits of the current A handoff

- A's own README labels it partial Spec v2: classifier coverage below 90%, no
  `cause_tag`, and address grouping instead of the specified site clustering/rules.
  Those producer changes are outside the Insights front.
- The available what-worked comparison is unadjusted; matched comparison output
  remains an upstream dependency.
- Persisted repeat-cost output predates A's title correction: it still says
  cases “were opened and closed”; current A code says “were reported”. The panel
  preserves the stored title and caveat. The local data must be regenerated by
  its owner to validate that correction; no data was rewritten here.

Evidence and pre-change backups (no env copies):
`/private/tmp/insights-analytics-handoff-20261024/` — `before/`,
`analytics-local-real.json`, `browser-analytics.mjs`, `browser-analytics-results.json`,
`browser-real-rows-{finding,actions,costs}.png`.

## Remaining integration work

The forecast implementation is committed on local `main` under
`pipeline/rat_audit/model/` (including `8d92dd9` and `0418b43`), and stored model
runs/predictions were already confirmed by the read-only checks above. The model
is therefore available; the missing `insights_summary()` RPC is the blocker to
showing its results in this panel. A or the integrator owns the migration; see
[RPC_PROPOSAL.md](./RPC_PROPOSAL.md).

Once the RPC is available, rerun the live suite and the browser success path
without interception. Forecast integration can be validated even while correlations
and costs are empty; those sections should retain their individual empty states.
Analytics must populate those tables separately for their real-result comparisons
(they were still empty in the live rerun after the analytics branch upload).
Until then task 2.8 is not validated end to end with real results. The client now
renders full citation metadata from `sources` and explicitly labels missing metadata;
the RPC must supply it to close the citation integration gap. The shared mobile-shell
issue is also tracked above. No migrations, database writes, merge, push or deployment
were performed.
