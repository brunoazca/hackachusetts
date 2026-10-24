-- Block profile per 250 m grid cell: who lives there (ACS + Climate Ready SVI + asthma, area-weighted from the
-- census tracts the cell overlaps) and how old its buildings are (assessor parcels inside the cell).
-- Static context for the map and the Insights region cards; not a model output. Owner: analytics track.

create table if not exists grid_cell_context (
  cell_id     text primary key references grid_cells(id) on delete cascade,
  attrs       jsonb not null default '{}'::jsonb,
  source_ids  text[] not null default '{}',
  computed_at timestamptz not null default now()
);
alter table grid_cell_context enable row level security;

-- Rebuilds the whole table (3.6k cells, a few seconds). Rerun after tracts or parcels are re-ingested.
create or replace function refresh_grid_cell_context() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  delete from grid_cell_context;
  with cells as (
    select id, st_transform(geom::geometry, 26986) g from grid_cells
  ),
  -- One numeric value per (tract, field): shares, rates and medians only (no counts), so an area-weighted mean is fair.
  tract_vals as (
    select t.geoid, st_transform(t.geom::geometry, 26986) g, v.src source_id, v.key, v.val
    from tracts t,
    lateral (
      select key, value::numeric val, 'census-reporter-acs' src from jsonb_each_text(case when jsonb_typeof(t.attrs->'acs') = 'object' then t.attrs->'acs' else '{}'::jsonb end)
      where key in ('median_income', 'pct_renters', 'pct_poverty', 'pct_people_of_color',
                    'pct_limited_english_hh', 'pct_housing_pre1940', 'pct_housing_pre1960')
        and value ~ '^-?[0-9.]+$'
      union all
      select key, value::numeric, case when key = 'asthma_pct' then 'cdc-places' else t.source_id end from jsonb_each_text(t.attrs)
      where (key = 'asthma_pct' or key like 'svi\_%\_pct') and value ~ '^-?[0-9.]+$'
      union all
      select 'pop_per_km2', round(1e6 * (t.attrs->>'pop')::numeric / nullif(st_area(st_transform(t.geom::geometry, 26986))::numeric, 0)), t.source_id
      where t.attrs->>'pop' ~ '^[0-9.]+$'
    ) v
  ),
  overlap as (
    select c.id cell_id, tv.key, tv.val, tv.source_id, st_area(st_intersection(c.g, tv.g)) w
    from cells c join tract_vals tv on st_intersects(c.g, tv.g)
  ),
  people as (
    select cell_id, jsonb_object_agg(key, val) attrs, array_agg(distinct source_id) srcs
    from (
      select cell_id, key, round(sum(val * w)::numeric / nullif(sum(w), 0)::numeric, 1) val, min(source_id) source_id
      from overlap where w > 0 group by cell_id, key
    ) x group by cell_id
  ),
  bld as (
    select c.id cell_id,
      jsonb_strip_nulls(jsonb_build_object(
        'parcels',             count(*),
        'yr_built_median',     percentile_cont(0.5) within group (order by y)::int,
        'pct_built_pre1900',   round(100.0 * count(*) filter (where y < 1900) / nullif(count(y), 0), 1),
        'pct_built_pre1940',   round(100.0 * count(*) filter (where y < 1940) / nullif(count(y), 0), 1),
        'pct_built_1980_plus', round(100.0 * count(*) filter (where y >= 1980) / nullif(count(y), 0), 1),
        'units',               sum(p.units),
        'pct_owner_occupied',  round(100.0 * count(*) filter (where p.own_occ) / nullif(count(p.own_occ), 0), 1),
        'value_median_fy26',   round(percentile_cont(0.5) within group (order by p.value_fy26)::numeric)
      )) attrs,
      array_agg(distinct p.source_id) srcs
    from grid_cells c
    join parcels p on st_intersects(c.geom, p.geom),
    lateral (select case when p.yr_built between 1700 and 2030 then p.yr_built end y) yy
    group by c.id
  )
  insert into grid_cell_context (cell_id, attrs, source_ids)
  select g.id,
         coalesce(pe.attrs, '{}'::jsonb) || coalesce(b.attrs, '{}'::jsonb),
         array(select distinct unnest(coalesce(pe.srcs, '{}') || coalesce(b.srcs, '{}')))
  from grid_cells g
  left join people pe on pe.cell_id = g.id
  left join bld b on b.cell_id = g.id;
  get diagnostics n = row_count;
  return n;
end $$;

-- Every cell with its profile, for the optional "250 m blocks" choropleth (fetched only when switched on).
create or replace function map_cell_context() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('type', 'FeatureCollection',
    'computed_at', (select max(computed_at) from grid_cell_context),
    'features', coalesce(jsonb_agg(jsonb_build_object(
      'type', 'Feature', 'id', g.id,
      'geometry', st_asgeojson(g.geom::geometry, 5)::jsonb,
      'properties', jsonb_build_object('id', g.id) || x.attrs
    )), '[]'::jsonb))
  from grid_cell_context x join grid_cells g on g.id = x.cell_id
  where x.attrs <> '{}'::jsonb
$$;

-- One cell's profile with its sources, for the cell card and the Insights region cards.
create or replace function cell_context(cell_id text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('cell_id', x.cell_id, 'attrs', x.attrs, 'computed_at', x.computed_at,
    'sources', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'url', s.url))
                         from sources s where s.id = any(x.source_ids)), '[]'::jsonb))
  from grid_cell_context x where x.cell_id = cell_context.cell_id
$$;

grant execute on function map_cell_context, cell_context to anon, authenticated;
revoke execute on function refresh_grid_cell_context from anon, authenticated;

select refresh_grid_cell_context();
