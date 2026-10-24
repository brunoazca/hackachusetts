-- Every 250 m block gets a human name, so lists and cards never say "Unnamed block".
--   neighborhood: filled where empty, from the reports inside the block (most common value).
--   label:        the most common street block among those reports, e.g. "W Newton St".
-- map_forecast now returns both, so the map's priority grid and hover card can show them.
-- Owner: map track. Safe to re-run.

alter table grid_cells add column if not exists label text;

with named as (
  select g.id,
         mode() within group (order by i.neighborhood)  as hood,
         mode() within group (order by i.address_block) as block
  from grid_cells g
  join incidents i on i.geom is not null and st_intersects(i.geom, g.geom)
  group by g.id
)
update grid_cells g
set neighborhood = coalesce(g.neighborhood, n.hood),
    label        = coalesce(n.block, g.label)
from named n
where n.id = g.id;

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
        'band', p.risk_band, 'emerging', em.kind,
        'label', g.label, 'neighborhood', g.neighborhood)
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
