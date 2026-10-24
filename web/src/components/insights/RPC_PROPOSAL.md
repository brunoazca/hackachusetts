# Proposed RPC: `insights_summary()` (for the integrator)

The Insights panel reads through one read-only RPC, following the project contract
(browser → Supabase RPCs with GET, anon key). It does not exist yet. Until it is deployed the
panel shows "Results not available yet" (PostgREST `PGRST202`), never placeholder data.

Suggested file: `supabase/migrations/<ts>_analytics_insights_rpc.sql`
(analytics track naming; owner decides).

```sql
create or replace function insights_summary()
returns jsonb
language sql stable security invoker
set search_path = public
as $$
  with run as (
    select * from model_runs
    where model in ('cell_week_poisson_gbm', 'cell_week_baseline_mean4')
    order by (model = 'cell_week_poisson_gbm') desc, created_at desc, id desc limit 1
  ),
  future as (
    select p.* from predictions p join run on p.model_run_id = run.id
    where p.actual is null and p.week_start >= date_trunc('week', now())::date
  )
  select jsonb_build_object(
    'correlations', coalesce((select jsonb_agg(to_jsonb(c) order by c.sort, c.id) from correlations c), '[]'::jsonb),
    'price_impact', coalesce((select jsonb_agg(to_jsonb(i) order by i.id) from price_impact i), '[]'::jsonb),
    'sources', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'url', s.url, 'retrieved_at', s.retrieved_at) order by s.id)
      from sources s where s.id in (
        select unnest(source_ids) from correlations union select unnest(source_ids) from price_impact)
    ), '[]'::jsonb),
    'forecast', case when exists (select 1 from run) then jsonb_build_object(
      'run', (select to_jsonb(run) from run),
      'weeks', coalesce((
        select jsonb_agg(w order by w->>'week_start') from (
          select jsonb_build_object(
            'week_start', week_start,
            'expected_total', sum(expected),
            'cells', count(*),
            'bands', jsonb_build_object(
              'low', count(*) filter (where risk_band = 'low'),
              'elevated', count(*) filter (where risk_band = 'elevated'),
              'high', count(*) filter (where risk_band = 'high'),
              'very_high', count(*) filter (where risk_band = 'very_high'))) as w
          from future group by week_start) s), '[]'::jsonb),
      'top_cells', coalesce((
        select jsonb_agg(jsonb_build_object(
          'cell_id', f.cell_id, 'week_start', f.week_start, 'expected', f.expected, 'p_any', f.p_any,
          'risk_band', f.risk_band, 'neighborhood', g.neighborhood, 'drivers', f.drivers) order by f.expected desc, f.cell_id)
        from (select * from future where week_start = (select min(week_start) from future)
              order by expected desc, cell_id limit 5) f
        join grid_cells g on g.id = f.cell_id), '[]'::jsonb)
    ) end
  );
$$;

grant execute on function insights_summary() to anon, authenticated;
```

## Payload (TypeScript: `InsightsPayload` in `types.ts`)

| Key | Shape | Empty |
|---|---|---|
| `correlations` | `correlations` rows as-is | `[]` |
| `price_impact` | `price_impact` rows as-is | `[]` |
| `sources` | referenced `{id, name, url, retrieved_at}` source rows | `[]` |
| `forecast.run` | latest `model_runs` row | `forecast: null` |
| `forecast.weeks` | `[{week_start, expected_total, cells, bands:{low,elevated,high,very_high}}]` future weeks only | `[]` |
| `forecast.top_cells` | top 5 cells of the next week, with `neighborhood` and `drivers` | `[]` |

## Conventions the panel relies on (analytics + model tracks)

- `model_runs.metrics`: `{backtest_weeks, mae, baseline_mae, top10pct_capture, baseline_top10pct_capture}`;
  capture values are shares 0..1. A missing `baseline_*` is shown as "No comparison available".
- Baseline fallback run: the model pipeline writes `model = 'cell_week_baseline_mean4'`, with
  its own scores in `metrics.mae` and `metrics.top10pct_capture`. The panel puts those scores
  in the baseline column and also supports the older explicit `baseline_*` fields. It labels
  this run "Baseline: mean of the last 4 weeks" (R6.6). The CTE above prefers the latest GBM
  run, falling back to the latest baseline only when no GBM exists; it does not select the
  baseline merely because its MAE is better. Both comparisons remain visible for GBM runs.
- Ties use `id`/`cell_id` for deterministic selection and top-cell ordering.
- The client uses `rpc("insights_summary", undefined, { get: true })`; keep the function
  `STABLE` and read-only. Shared-database changes remain the integrator's responsibility.
- `price_impact.value`: a counted cost has `"kind": "cost"` (or an id starting with `cost`);
  everything else is shown as **exploratory**. Headline key, in order: `usd`, `amount_usd`,
  `total_usd`, `amount`, `count`, `diff`, `difference`, `diff_pct`, `value`, `rho`; otherwise
  show labelled details/tables without an arbitrary headline.
  Key suffixes: `_usd` → dollars, `_pct` → percent, `_share` → 0..1 share; `ci` → 95% CI; `n` → sample size.
- `correlations.stat`: `{rho,p,n}` | `{lift,ci,n}` | `{before,after,control_before,control_after,n}`; other
  numeric keys are shown as-is. `chart.type` ∈ `scatter | bar | line | event_study`; event-study x is
  days from the event (0 = event). Bar x may be a category string; line x may be an ISO date.

## Read-only verification (2026-10-24)

The shared project still returns 404/PGRST202 for this RPC. Public table reads found
0 correlations, 0 price-impact rows, 6 model runs (4 cell-week, 2 recurrence), 206,520
predictions and 3,442 grid cells. Baseline/model score adaptation and server rendering
were tested from the stored rows; the RPC success path and its aggregates remain
unvalidated on the shared project. No SQL in this proposal was applied.

## Analytics payload details verified from persisted local rows

Keep JSONB fields intact in the RPC (no reconstruction or field dropping):

- `stat.by_tag[tag]`: `n`, `n_censored`, `recur_60d_pct`, `ci_low`, `ci_high`.
  Rates and intervals are percentages 0–100, not shares. The panel shows them
  together and distinguishes incomplete follow-up from an observed non-repeat.
- `stat.contrast`: `{a, b, diff_pp, ci_pp:[low,high]}` is the current **unadjusted**
  contrast in percentage points; it does not supply the Spec v2 matched analysis.
- `stat.insufficient: true` must remain distinct from an observed null result.
- `value.by_fiscal_year[].departments[]`: `{department, amount}`; `currency: "USD"`
  applies to the department amounts as well as annual totals.

The uploaded analytics branch at `f410efe` contains no `insights_summary` function.
Local persisted-row and intercepted-browser validation passed for these shapes;
the shared RPC still returned 404/PGRST202 on the follow-up check. This proposal
remains unexecuted.

The `sources` collection supplies the citation metadata required by R5.1 and
steering/tech.md. The client accepts older envelopes without it and explicitly
labels the missing details; that fallback is not full citation compliance. Links
accept HTTP(S) only. No extra browser queries or database writes were introduced.
