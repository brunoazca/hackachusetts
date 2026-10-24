-- Draft map API (read-only). Owner: map track (Gui) — extend or replace freely.
-- Points are rounded to 4 decimals (~10 m) so exact house positions are not exposed.

create or replace function map_incidents(
  min_lon double precision, min_lat double precision, max_lon double precision, max_lat double precision,
  categories text[] default null, since date default (now() - interval '90 days')::date,
  until date default now()::date, max_rows int default 20000
) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('type', 'FeatureCollection', 'features', coalesce(jsonb_agg(f), '[]'::jsonb))
  from (
    select jsonb_build_object(
      'type', 'Feature',
      'id', i.id,
      'geometry', jsonb_build_object('type', 'Point', 'coordinates', jsonb_build_array(round(i.lon::numeric, 4), round(i.lat::numeric, 4))),
      'properties', jsonb_build_object('id', i.id, 'category', i.category, 'status', i.status,
                                       'opened', to_char(i.opened_at at time zone 'America/New_York', 'YYYY-MM-DD'),
                                       'city', i.city, 'approx', i.geo_precision <> 'point')
    ) f
    from incidents i
    where i.lat between min_lat and max_lat and i.lon between min_lon and max_lon
      and (categories is null or i.category = any(categories))
      and i.opened_at >= since and i.opened_at < until + 1
    order by i.opened_at desc
    limit max_rows
  ) s
$$;

create or replace function incident_detail(incident_id text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'incident', to_jsonb(i) - 'geom' - 'address_key' - 'lat' - 'lon',
    'source', to_jsonb(s),
    'same_address', coalesce((
      select jsonb_agg(jsonb_build_object('id', o.id, 'category', o.category, 'status', o.status,
                                          'opened', o.opened_at::date, 'closed', o.closed_at::date, 'note', o.closure_note)
                       order by o.opened_at)
      from incidents o where i.address_key is not null and o.address_key = i.address_key and o.id <> i.id
    ), '[]'::jsonb)
  )
  from incidents i join sources s on s.id = i.source_id
  where i.id = incident_id
$$;

create or replace function layer_counts(since date default (now() - interval '90 days')::date)
returns table (category text, city text, n bigint)
language sql stable security definer set search_path = public as $$
  select category, city, count(*) from incidents where opened_at >= since group by 1, 2
$$;

grant execute on function map_incidents, incident_detail, layer_counts to anon, authenticated;
