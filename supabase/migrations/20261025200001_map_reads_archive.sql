-- The map's time window now reaches back to 2016: map_incidents, map_incident_bins and incident_detail
-- also read `incidents_archive` (Boston 311 2016-2022). Archive rows are lean (category, time, point):
-- shown as closed (every case from those years is long closed at the source), no address, no note.
-- Owner: map track.
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
                                       'city', i.city, 'approx', i.approx)
    ) f
    from (
      select id, category, status, opened_at, city, lon, lat, geo_precision <> 'point' as approx from incidents
      union all
      select id, category, 'closed', opened_at, city, lon, lat, false from incidents_archive
    ) i
    where i.lat between min_lat and max_lat and i.lon between min_lon and max_lon
      and (categories is null or i.category = any(categories))
      and i.opened_at >= since and i.opened_at < until + 1
    order by i.opened_at desc
    limit max_rows
  ) s
$$;

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
    from (
      select category, status, opened_at, lon, lat from incidents
      union all
      select category, 'closed', opened_at, lon, lat from incidents_archive
    ) i
    where lat between min_lat and max_lat and lon between min_lon and max_lon
      and category = any(categories)
      and opened_at >= since and opened_at < until + 1
    group by category, floor(lat / cell), floor(lon / cell)
  ) x
$$;

create or replace function incident_detail(incident_id text) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select jsonb_build_object(
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
     where i.id = incident_id),
    (select jsonb_build_object(
       'incident', jsonb_build_object('id', a.id, 'category', a.category, 'subtype', null, 'status', 'closed',
                                      'opened_at', a.opened_at, 'closed_at', null, 'address_block', null, 'zip', null,
                                      'neighborhood', null, 'closure_note', null, 'action_tag', null,
                                      'city', a.city, 'geo_precision', 'point'),
       'source', to_jsonb(s),
       'same_address', '[]'::jsonb
     )
     from incidents_archive a join sources s on s.id = a.source_id
     where a.id = incident_id)
  )
$$;

grant execute on function map_incidents, map_incident_bins, incident_detail to anon, authenticated;
