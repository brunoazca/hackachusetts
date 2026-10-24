-- Read-only RPCs for the forecast layer and the cell card (design §6: map_forecast, cell_detail).
-- Owner: model track. Reads the newest cell_week_poisson_gbm run that has predictions.

create index if not exists predictions_run_week_idx on predictions (model_run_id, week_start);

-- Newest scored forecast run.
create or replace function forecast_run_id() returns text
language sql stable security definer set search_path = public as $$
  select r.id from model_runs r
  where r.model = 'cell_week_poisson_gbm'
    and exists (select 1 from predictions p where p.model_run_id = r.id)
  order by r.created_at desc limit 1
$$;

-- Run summary + the forecast weeks the map can show.
create or replace function forecast_run() returns jsonb
language sql stable security definer set search_path = public as $$
  with r as (select * from model_runs where id = forecast_run_id())
  select jsonb_build_object(
    'run_id', r.id,
    'trained_through', r.trained_through,
    'weeks', (select coalesce(jsonb_agg(w order by w), '[]'::jsonb) from (
               select distinct week_start w from predictions where model_run_id = r.id and actual is null) x),
    'metrics', jsonb_build_object(
      'top10pct_capture', r.metrics->'top10pct_capture',
      'baseline_top10pct_capture', r.metrics->'baseline_top10pct_capture',
      'mae', r.metrics->'mae', 'baseline_mae', r.metrics->'baseline_mae',
      'backtest_from', r.metrics->'backtest_from', 'backtest_to', r.metrics->'backtest_to'),
    'caveat', 'Model estimate of 311 rodent reports, not a count of rats.'
  ) from r
$$;

-- GeoJSON of forecast cells in a bbox for one week (default: first forecast week).
-- Cells below min_expected are left out so the map is not covered in near-empty squares.
create or replace function map_forecast(
  min_lon double precision, min_lat double precision, max_lon double precision, max_lat double precision,
  week date default null, min_expected real default 0.01
) returns jsonb
language sql stable security definer set search_path = public as $$
  with run as (select forecast_run_id() id),
  wk as (
    select coalesce(week, (select min(week_start) from predictions, run
                           where model_run_id = run.id and actual is null)) w
  ),
  em as (
    select e->>'cell_id' cell_id, e->>'kind' kind
    from model_runs, run, jsonb_array_elements(coalesce(metrics->'emerging', '[]'::jsonb)) e
    where model_runs.id = run.id
  )
  select jsonb_build_object('type', 'FeatureCollection', 'week', (select w from wk), 'features',
    coalesce(jsonb_agg(jsonb_build_object(
      'type', 'Feature',
      'geometry', st_asgeojson(g.geom::geometry, 6)::jsonb,
      'properties', jsonb_build_object(
        'id', p.cell_id, 'expected', round(p.expected::numeric, 4), 'p_any', round(p.p_any::numeric, 3),
        'band', p.risk_band, 'emerging', em.kind)
    )), '[]'::jsonb))
  from predictions p
  join run on p.model_run_id = run.id
  join wk on p.week_start = wk.w
  join grid_cells g on g.id = p.cell_id
  left join em on em.cell_id = p.cell_id
  where p.actual is null
    and (p.expected >= min_expected or em.kind is not null)
    and g.lon between min_lon - 0.005 and max_lon + 0.005
    and g.lat between min_lat - 0.005 and max_lat + 0.005
$$;

-- Everything the cell card needs: next 4 weeks, why (drivers), the last 12 weeks actual vs expected.
create or replace function cell_detail(cell_id text, week date default null) returns jsonb
language sql stable security definer set search_path = public as $$
  with run as (select forecast_run_id() id),
  c as (select * from grid_cells where id = cell_id),
  fut as (
    select p.week_start, p.expected, p.p_any, p.risk_band, p.drivers
    from predictions p, run where p.model_run_id = run.id and p.cell_id = cell_detail.cell_id and p.actual is null
  ),
  hist as (
    select p.week_start, p.expected, p.actual
    from predictions p, run where p.model_run_id = run.id and p.cell_id = cell_detail.cell_id and p.actual is not null
    order by p.week_start desc limit 12
  ),
  em as (
    select e from model_runs, run, jsonb_array_elements(coalesce(metrics->'emerging', '[]'::jsonb)) e
    where model_runs.id = run.id and e->>'cell_id' = cell_detail.cell_id
  ),
  hood as (
    select i.neighborhood from incidents i, c
    where i.city = 'boston' and i.neighborhood is not null and i.geom is not null
      and st_intersects(i.geom, c.geom)
    group by 1 order by count(*) desc limit 1
  )
  select jsonb_build_object(
    'cell', (select jsonb_build_object('id', c.id, 'lat', c.lat, 'lon', c.lon,
                                       'neighborhood', (select neighborhood from hood)) from c),
    'run_id', (select id from run),
    'week', coalesce(week, (select min(week_start) from fut)),
    'forecast', coalesce((select jsonb_agg(jsonb_build_object('week', week_start, 'expected', round(expected::numeric, 4),
                         'p_any', round(p_any::numeric, 3), 'band', risk_band) order by week_start) from fut), '[]'::jsonb),
    'drivers', coalesce((select drivers from fut order by week_start limit 1), '[]'::jsonb),
    'history', coalesce((select jsonb_agg(jsonb_build_object('week', week_start, 'actual', actual,
                         'expected', round(expected::numeric, 4)) order by week_start) from hist), '[]'::jsonb),
    'emerging', (select e from em limit 1),
    'caveat', 'Model estimate of 311 rodent reports, not a count of rats.'
  )
$$;

grant execute on function forecast_run_id, forecast_run, map_forecast, cell_detail to anon, authenticated;
