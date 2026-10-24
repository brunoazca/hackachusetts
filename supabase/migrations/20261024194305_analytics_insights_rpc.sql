-- Task 2.8: payload agreed with the Insights front (feat/rat-audit-insights, 471a2a5).
-- Based on web/src/components/insights/RPC_PROPOSAL.md; JSONB payloads preserved.
-- Read-only, invoker permissions; the integrator applies this migration.
create or replace function public.insights_summary()
returns jsonb
language sql stable security invoker
set search_path = ''
as $$
  with run as (
    select * from public.model_runs
    where model in ('cell_week_poisson_gbm', 'cell_week_baseline_mean4')
    order by (model = 'cell_week_poisson_gbm') desc, created_at desc, id desc limit 1
  ),
  future as (
    select p.* from public.predictions p join run on p.model_run_id = run.id
    where p.actual is null and p.week_start >= date_trunc('week', now() at time zone 'America/New_York')::date
  )
  select jsonb_build_object(
    'correlations', coalesce((select jsonb_agg(to_jsonb(c) order by c.sort, c.id) from public.correlations c), '[]'::jsonb),
    'price_impact', coalesce((select jsonb_agg(to_jsonb(i) order by i.id) from public.price_impact i), '[]'::jsonb),
    'sources', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'url', s.url, 'retrieved_at', s.retrieved_at) order by s.id)
      from public.sources s where s.id in (
        select unnest(source_ids) from public.correlations union select unnest(source_ids) from public.price_impact)
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
        join public.grid_cells g on g.id = f.cell_id), '[]'::jsonb)
    ) end
  );
$$;

revoke all on function public.insights_summary() from public;
grant execute on function public.insights_summary() to anon, authenticated, service_role;
