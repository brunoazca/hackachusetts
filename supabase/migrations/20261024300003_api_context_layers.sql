-- Context layers for the map (read-only). Owner: map track.

-- Tracts with ACS demographics (all three cities), SVI (Boston) and asthma, for choropleths.
create or replace function map_tracts() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('type', 'FeatureCollection', 'features', coalesce(jsonb_agg(f), '[]'::jsonb))
  from (
    select jsonb_build_object(
      'type', 'Feature', 'id', geoid,
      'properties', jsonb_build_object(
        'geoid', geoid, 'city', city, 'name', name,
        'pct_housing_pre1940', (attrs->'acs'->>'pct_housing_pre1940')::numeric,
        'pct_renters', (attrs->'acs'->>'pct_renters')::numeric,
        'pct_poverty', (attrs->'acs'->>'pct_poverty')::numeric,
        'median_income', (attrs->'acs'->>'median_income')::numeric,
        'pop', (attrs->'acs'->>'pop')::numeric,
        'asthma_pct', (attrs->>'asthma_pct')::numeric),
      'geometry', st_asgeojson(geom, 5)::jsonb
    ) f from tracts
  ) x
$$;

-- Buildings (Boston parcels) in a bbox, for zoomed-in views. No owner names (they stay in `private`).
create or replace function map_parcels(min_lon double precision, min_lat double precision,
                                       max_lon double precision, max_lat double precision, max_rows int default 6000)
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('type', 'FeatureCollection', 'features', coalesce(jsonb_agg(f), '[]'::jsonb))
  from (
    select jsonb_build_object(
      'type', 'Feature', 'id', pid,
      'geometry', jsonb_build_object('type', 'Point',
                    'coordinates', jsonb_build_array(round(lon::numeric, 5), round(lat::numeric, 5))),
      'properties', jsonb_build_object('pid', pid, 'yr_built', nullif(yr_built, 0), 'units', units,
                                       'own_occ', own_occ, 'land_use', land_use, 'block', address_block)
    ) f
    from parcels
    where lat between min_lat and max_lat and lon between min_lon and max_lon
    limit max_rows
  ) x
$$;

grant execute on function map_tracts, map_parcels to anon, authenticated;
