-- Aggregated map data for zoomed-out views, so nothing is truncated: one feature per
-- (category, grid cell) with the count, the open count and the newest date. The client sizes the cell
-- to the zoom (≈ 12 px). Owner: map track.
create or replace function map_incident_bins(
  min_lon double precision, min_lat double precision, max_lon double precision, max_lat double precision,
  categories text[], since date, until date, cell double precision
) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('type', 'FeatureCollection', 'features', coalesce(jsonb_agg(f), '[]'::jsonb))
  from (
    select jsonb_build_object(
      'type', 'Feature',
      'geometry', jsonb_build_object('type', 'Point', 'coordinates',
                    jsonb_build_array(round(avg(lon)::numeric, 5), round(avg(lat)::numeric, 5))),
      'properties', jsonb_build_object('category', category, 'n', count(*),
                                       'n_open', count(*) filter (where status = 'open'),
                                       'newest', max(opened_at)::date)
    ) f
    from incidents
    where lat between min_lat and max_lat and lon between min_lon and max_lon
      and category = any(categories)
      and opened_at >= since and opened_at < until + 1
    group by category, floor(lat / cell), floor(lon / cell)
  ) x
$$;
grant execute on function map_incident_bins to anon, authenticated;
