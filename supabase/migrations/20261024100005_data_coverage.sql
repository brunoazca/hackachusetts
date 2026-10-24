-- Data coverage registry: what we have, where (city), for which period, from which source.
-- The map uses it to fog the cities where an active layer has no data; the agent uses it to say
-- "we don't have that for Cambridge" instead of implying zero.

create or replace view data_coverage as
  select 'incident'::text as kind, category as layer, city, source_id,
         count(*)::bigint as rows, min(opened_at)::date as first_date, max(opened_at)::date as last_date,
         round(100.0 * count(lat) / count(*), 1) as pct_located
  from incidents group by category, city, source_id
  union all
  select 'place', kind, city, source_id, count(*), min(starts_at)::date, max(starts_at)::date,
         round(100.0 * count(lat) / count(*), 1)
  from places group by kind, city, source_id
  union all
  select 'parcel', 'buildings', city, source_id, count(*), null, null, round(100.0 * count(lat) / count(*), 1)
  from parcels group by city, source_id
  union all
  select 'tract', 'tracts', coalesce(city, 'region'), source_id, count(*), null, null, 100.0
  from tracts group by city, source_id
  union all
  select 'volume', 'report_volume', city, source_id, sum(n_all), min(month), max(month), 100.0
  from report_volume group by city, source_id
  union all
  select 'volume', category, city, source_id, sum(n), min(month), max(month), 100.0
  from signal_volume group by category, city, source_id;

-- Per layer x city summary for the UI (one row per layer and city, plus the live/daily/static mode).
create or replace function coverage_matrix() returns table (
  kind text, layer text, city text, rows bigint, first_date date, last_date date, update_mode text
)
language sql stable security definer set search_path = public as $$
  select c.kind, c.layer, c.city, sum(c.rows)::bigint, min(c.first_date), max(c.last_date),
         case when bool_or(s.update_mode = 'live') then 'live'
              when bool_or(s.update_mode = 'daily') then 'daily' else 'static' end
  from data_coverage c left join sources s on s.id = c.source_id
  group by 1, 2, 3
$$;

-- City outlines (union of each city's census tracts), used for the coverage fog.
create or replace function city_boundaries() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('type', 'FeatureCollection', 'features', coalesce(jsonb_agg(f), '[]'::jsonb))
  from (
    select jsonb_build_object(
      'type', 'Feature', 'id', city, 'properties', jsonb_build_object('city', city),
      'geometry', st_asgeojson(st_simplifypreservetopology(st_union(geom::geometry), 0.0003), 5)::jsonb
    ) f
    from tracts where city in ('boston', 'cambridge', 'somerville') group by city
  ) x
$$;

grant select on data_coverage to anon, authenticated;
grant execute on function coverage_matrix, city_boundaries to anon, authenticated;
