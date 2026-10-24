# Insights panel — task 2.8

Owns `web/src/components/insights/**`. Requirements: R5.1/R5.4, R6.2–3/R6.6,
R7.4–5. The database writers, shared shell, map and migrations belong to other
fronts. Work started on `feat/rat-audit-insights` at `1af6bcd`. It is now committed
and integrated into local `main`; see the latest verification below.

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
