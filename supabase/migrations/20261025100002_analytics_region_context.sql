-- Block profile for an Insights region (a set of 250 m cells), next to the city-wide median per value,
-- so a card can say "older buildings / lower income than the typical block". Context only, not a cause.
-- Counts (parcels, units) are summed over the region; everything else is the mean of the cells that have it.
-- Owner: analytics track. Reads grid_cell_context (20261025100001).

create or replace function region_context(cell_ids text[]) returns jsonb
language sql stable security definer set search_path = public as $$
  with kv as (
    select x.cell_id, e.key, e.value::numeric val
    from grid_cell_context x, jsonb_each_text(x.attrs) e
  ),
  region as (
    select key, case when key in ('parcels', 'units') then sum(val) else round(avg(val), 1) end val
    from kv where cell_id = any(region_context.cell_ids) group by key
  ),
  city as (
    select key, round(percentile_cont(0.5) within group (order by val)::numeric, 1) val from kv group by key
  ),
  src as (
    select distinct unnest(source_ids) id from grid_cell_context where cell_id = any(region_context.cell_ids)
  )
  select jsonb_build_object(
    'n_cells', (select count(*) from grid_cell_context where cell_id = any(region_context.cell_ids) and attrs <> '{}'::jsonb),
    'attrs', coalesce((select jsonb_object_agg(key, val) from region), '{}'::jsonb),
    'city_median', coalesce((select jsonb_object_agg(key, val) from city), '{}'::jsonb),
    'computed_at', (select max(computed_at) from grid_cell_context),
    'sources', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'url', s.url))
                         from sources s join src on src.id = s.id), '[]'::jsonb))
$$;

grant execute on function region_context to anon, authenticated;
