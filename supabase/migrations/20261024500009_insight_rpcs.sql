-- One Insight panel, one call per kind of map selection (insights spec rev. 3):
--   nothing / cell / drawn area -> area_insight(cell_ids)
--   rodent report               -> record_insight(incident_id)   (non-rodent ids are routed to evidence_insight)
--   evidence (311 or place)     -> evidence_insight(kind, id)
-- Every payload has `kind`, `caveat` and enough ids to link places and reports. Read-only, public.
-- Reads: region_solutions, cell_solutions, cell_severity, record_solutions, cause_baselines (model track).

-- 250 m grid cell id for a point (same lattice as grid_cells / pipeline grid.py: EPSG:26986, floor(x/250)).
create or replace function cell_of(g geography) returns text
language sql immutable as $$
  select 'g250_' || floor(st_x(st_transform(g::geometry, 26986)) / 250)::int
      || '_' || floor(st_y(st_transform(g::geometry, 26986)) / 250)::int
$$;

create or replace function cause_label(kind text) returns text
language sql immutable as $$
  select case kind
    when 'vacant_parcel' then 'vacant parcels' when 'restaurant' then 'restaurants / food places'
    when 'excavation' then 'excavation permits' when 'demolition' then 'demolition permits'
    when 'city_lot' then 'city-owned lots' when 'bigbelly' then 'public trash bins' when 'school' then 'schools'
    when 'trash_storage' then 'improper trash storage 311' when 'dumping' then 'illegal dumping 311'
    when 'missed_trash' then 'missed trash pickup 311' when 'dumpster' then 'dumpster 311'
    when 'trash_early' then 'trash out early 311' when 'dead_animal' then 'dead animal 311'
    when 'pest' then 'indoor pest 311'
    when 'ce_trash_storage' then 'code enforcement: trash storage' when 'ce_overfill' then 'code enforcement: overfilled bins'
    when 'ce_dumping' then 'code enforcement: dumping' when 'ce_weeds' then 'code enforcement: overgrown lot'
    else replace(kind, '_', ' ') end
$$;

-- Possible causes within 150 m of a point: places (any time) and 311 (the 90 days before `at`),
-- with distance to the nearest and the Boston level from cause_baselines.
create or replace function nearby_causes(g geography, at timestamptz default now()) returns jsonb
language sql stable security definer set search_path = public as $$
  with hits as (
    select p.kind, st_distance(p.geom, g) d, p.source_id from places p
    where p.kind in ('vacant_parcel','restaurant','excavation','demolition','city_lot','bigbelly','school')
      and st_dwithin(p.geom, g, 150)
    union all
    select i.category, st_distance(i.geom, g), i.source_id from incidents i
    where i.category in ('trash_storage','dumping','missed_trash','dumpster','trash_early','dead_animal','pest')
      and i.opened_at between at - interval '90 days' and at and st_dwithin(i.geom, g, 150)
  ), agg as (
    select kind, count(*) n, round(min(d))::int nearest_m, array_agg(distinct source_id) srcs from hits group by kind
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'kind', a.kind, 'label', cause_label(a.kind), 'count', a.n, 'nearest_m', a.nearest_m,
      'boston_per_report_within_150m', b.per_report_within_150m,
      'times_boston', case when b.per_report_within_150m > 0 then round((a.n / b.per_report_within_150m)::numeric, 1) end,
      'source_ids', to_jsonb(a.srcs))
    order by case when b.per_report_within_150m > 0 then a.n / b.per_report_within_150m end desc nulls last), '[]'::jsonb)
  from agg a left join cause_baselines b on b.kind = a.kind
$$;

-- Forecast weeks summed over a set of cells (newest forecast run).
create or replace function cells_forecast(cell_ids text[]) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('week', w, 'expected', round(e::numeric, 2)) order by w), '[]'::jsonb)
  from (select week_start w, sum(expected) e from predictions
        where model_run_id = forecast_run_id() and actual is null and cell_id = any(cell_ids)
        group by week_start order by week_start limit 4) f
$$;

-- Area: one cell (its region's card if it is in a ranked region, else its own cell card) or a drawn
-- set of cells (sums + the regions and cells it touches, worst first).
create or replace function area_insight(cell_ids text[]) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  rid text; sol jsonb; cells text[] := area_insight.cell_ids; one boolean := array_length(area_insight.cell_ids, 1) = 1;
begin
  if one then
    select region_id into rid from cell_severity where cell_id = area_insight.cell_ids[1];
    if rid is not null then
      select to_jsonb(r), r.cell_ids into sol, cells from region_solutions r where r.region_id = rid;
    else
      select to_jsonb(c) into sol from cell_solutions c where c.cell_id = area_insight.cell_ids[1];
    end if;
  end if;
  return jsonb_build_object(
    'kind', 'area',
    'cell_ids', to_jsonb(cells),
    'region_id', rid,
    'solution', sol,                                   -- null for drawn areas and cells without rodent history
    'solution_table', case when rid is not null then 'region_solutions' when sol is not null then 'cell_solutions' end,
    'can_generate_ai', sol is not null and rid is null and sol->>'source' = 'rules',
    'severity', (select jsonb_build_object(
        'observed_12w', coalesce(sum(observed_12w), 0), 'expected_4w', round(coalesce(sum(expected_4w), 0)::numeric, 1),
        'expected_returns_60d', round(coalesce(sum(expected_returns_60d), 0)::numeric, 1),
        'score', round(coalesce(sum(severity), 0)::numeric, 1), 'best_rank', min(rank),
        'rank_of', (select count(*) from cell_severity))
      from cell_severity s where s.cell_id = any(cells)),
    'forecast', cells_forecast(cells),
    'regions', (select coalesce(jsonb_agg(jsonb_build_object('region_id', r.region_id, 'rank', r.rank, 'action', r.action,
                                                             'lane', r.lane) order by r.rank), '[]'::jsonb)
                from region_solutions r where r.region_id in (select region_id from cell_severity where cell_id = any(cells))),
    'cells', (select coalesce(jsonb_agg(jsonb_build_object('cell_id', s.cell_id, 'rank', s.rank, 'severity', s.severity,
                                                           'region_id', s.region_id) order by s.rank), '[]'::jsonb)
              from (select * from cell_severity where cell_id = any(cells) order by rank limit 20) s),
    'computed_at', (select max(computed_at) from cell_severity),
    'caveat', 'Model estimate of 311 rodent reports, not a count of rats. Solutions compare past cases; not a measured effect.');
end $$;

-- Rodent report: will it come back, what to do, why. Non-rodent ids are evidence.
create or replace function record_insight(incident_id text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  i incidents%rowtype; cid text; rid text; rs record_solutions%rowtype; card jsonb; line jsonb;
begin
  select * into i from incidents where id = incident_id;
  if not found then return null; end if;
  if i.category <> 'rodent' then return evidence_insight('incident', incident_id); end if;
  cid := cell_of(i.geom);
  select region_id into rid from cell_severity where cell_id = cid;
  select * into rs from record_solutions where record_solutions.incident_id = i.id;
  if rid is not null then select to_jsonb(r) into card from region_solutions r where r.region_id = rid;
  else select to_jsonb(c) into card from cell_solutions c where c.cell_id = cid; end if;
  select e into line from jsonb_array_elements(coalesce(card->'records', '[]'::jsonb)) e where e->>'incident_id' = i.id;
  return jsonb_build_object(
    'kind', 'record',
    'incident', jsonb_build_object('id', i.id, 'category', i.category, 'status', i.status, 'opened_at', i.opened_at,
      'closed_at', i.closed_at, 'address_block', i.address_block, 'neighborhood', i.neighborhood, 'lat', i.lat, 'lon', i.lon,
      'source_id', i.source_id),
    'cell_id', cid, 'region_id', rid,
    'outlook', jsonb_build_object(
      'p_return_60d_if_monitoring', rs.p_return_monitoring,
      'p_return_60d_if_best', rs.p_return, 'best_action', rs.label, 'confident', rs.confident,
      'alternatives', coalesce(rs.alternatives, '[]'::jsonb),
      'cell_forecast', cells_forecast(array[cid]),
      'cell_severity', (select to_jsonb(s) - 'forecast_run_id' - 'computed_at' from cell_severity s where s.cell_id = cid)),
    'solution', jsonb_build_object(
      'todo', line->>'todo',                            -- the area card's line for this report (AI or rules)
      'area_action', card->>'action', 'area_lane', card->>'lane', 'area_source', card->>'source',
      'model_action', rs.label, 'model_because', coalesce(rs.because, '[]'::jsonb), 'city_did', rs.done_action),
    'evidence', jsonb_build_object(
      'nearby_causes', nearby_causes(i.geom, i.opened_at),
      'address_history', (select coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'opened', o.opened_at::date,
                              'closed', o.closed_at::date, 'city_did', s.done_action) order by o.opened_at), '[]'::jsonb)
                          from incidents o left join record_solutions s on s.incident_id = o.id
                          where i.address_key is not null and o.address_key = i.address_key and o.category = 'rodent'
                            and o.opened_at > i.opened_at - interval '2 years')),
    'model_run_id', rs.model_run_id,
    'caveat', coalesce(rs.caveat, 'No model estimate for this report.'));
end $$;

-- Evidence: a non-rodent 311 report or a place. What it is, and the rodent reports within 150 m that it
-- may relate to: 90 days before vs after it (time-bound items) or the last 12 months (fixed places).
create or replace function evidence_insight(kind text, id text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  g geography; t0 timestamptz; item jsonb; ekind text;
begin
  if kind = 'incident' then
    select i.geom, i.opened_at, i.category, jsonb_build_object('id', i.id, 'category', i.category, 'label', cause_label(i.category),
             'status', i.status, 'opened_at', i.opened_at, 'closed_at', i.closed_at, 'address_block', i.address_block,
             'lat', i.lat, 'lon', i.lon, 'source_id', i.source_id)
      into g, t0, ekind, item from incidents i where i.id = evidence_insight.id;
  else
    select p.geom, p.starts_at, p.kind, jsonb_build_object('id', p.id, 'category', p.kind, 'label', cause_label(p.kind),
             'name', p.name, 'starts_at', p.starts_at, 'ends_at', p.ends_at, 'address_block', p.address_block,
             'lat', p.lat, 'lon', p.lon, 'source_id', p.source_id)
      into g, t0, ekind, item from places p where p.id = evidence_insight.id;
  end if;
  if g is null then return null; end if;
  return jsonb_build_object(
    'kind', 'evidence',
    'item', item,
    'cell_id', cell_of(g),
    'window', case when t0 is null then 'last 12 months' else '90 days before vs 90 days after' end,
    'rodent_before', case when t0 is null then null else
      (select count(*) from incidents r where r.category = 'rodent' and st_dwithin(r.geom, g, 150)
         and r.opened_at >= t0 - interval '90 days' and r.opened_at < t0) end,
    'after_days', case when t0 is null then null else least(90, greatest(0, extract(day from now() - t0)::int)) end,
    'rodent_after', (select count(*) from incidents r where r.category = 'rodent' and st_dwithin(r.geom, g, 150)
         and r.opened_at >= coalesce(t0, now() - interval '12 months')
         and r.opened_at < coalesce(t0 + interval '90 days', now())),
    'related_rodent_reports', (select coalesce(jsonb_agg(x order by x->>'opened' desc), '[]'::jsonb) from (
        select jsonb_build_object('id', r.id, 'opened', r.opened_at::date, 'address_block', r.address_block,
                 'distance_m', round(st_distance(r.geom, g))::int, 'p_return_60d', s.p_return_monitoring,
                 'city_did', s.done_action) x
        from incidents r left join record_solutions s on s.incident_id = r.id
        where r.category = 'rodent' and st_dwithin(r.geom, g, 150)
          and r.opened_at >= coalesce(t0 - interval '90 days', now() - interval '12 months')
          and r.opened_at < coalesce(t0 + interval '90 days', now())
        order by r.opened_at desc limit 30) q),
    'same_kind_nearby', (select e from jsonb_array_elements(nearby_causes(g, coalesce(t0, now()))) e
                         where e->>'kind' = ekind),
    'nearby_causes', nearby_causes(g, coalesce(t0, now())),
    'boston_level', (select per_report_within_150m from cause_baselines b where b.kind = ekind),
    'caveat', 'Rodent reports near this item, not proven to be caused by it. Reports, not rats.');
end $$;

grant execute on function cell_of, cause_label, nearby_causes, cells_forecast, area_insight, record_insight, evidence_insight
  to anon, authenticated;

-- Drawn area (GeoJSON polygon from the map's area selection) -> the cells it touches -> area_insight.
create or replace function area_insight_polygon(geojson jsonb) returns jsonb
language sql stable security definer set search_path = public as $$
  select area_insight(coalesce(array_agg(c.id order by c.id), '{}'))
  from grid_cells c
  where c.city = 'boston' and st_intersects(c.geom, st_setsrid(st_geomfromgeojson(geojson::text), 4326)::geography)
$$;
grant execute on function area_insight_polygon to anon, authenticated;
