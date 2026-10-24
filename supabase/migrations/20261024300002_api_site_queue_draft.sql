-- Draft Act-mode API (read-only). Owner: map/inspector track — replace when `sites` (analytics) is populated.
-- Until then a "site" is one address_key with repeat rodent reports 2024–2026 (not yet the 50 m DBSCAN
-- clusters of the spec). Ids are the first 16 hex chars of address_key: no address is exposed.
-- Same-day bulk loads count once (distinct open dates). A "return" is a report opened 1–60 days after
-- an earlier report at the site was closed. Due = last closure within 60 days AND the site has returned before.

create or replace function draft_sites(min_reports int default 3)
returns table (
  id text, address_block text, neighborhood text, city text, lat double precision, lon double precision,
  reports int, closures int, returns int, first_at date, last_at date, last_closed date,
  days_since_close int, last_note text, due boolean
)
language sql stable security definer set search_path = public as $$
  with r as (
    select address_key, opened_at, closed_at, closure_note, address_block, neighborhood, city, lat, lon,
           opened_at::date as d
    from incidents
    where category = 'rodent' and address_key is not null and opened_at >= '2024-01-01'
  ),
  agg as (
    select address_key,
           count(distinct d)::int as reports,
           count(closed_at)::int as closures,
           min(d) as first_at, max(d) as last_at,
           max(closed_at)::date as last_closed,
           mode() within group (order by address_block) as address_block,
           mode() within group (order by neighborhood) as neighborhood,
           min(city) as city, avg(lat) as lat, avg(lon) as lon
    from r group by 1 having count(distinct d) >= min_reports
  ),
  ret as (
    select a.address_key, count(distinct b.d)::int as returns
    from r a join r b on b.address_key = a.address_key
     and a.closed_at is not null
     and b.opened_at > a.closed_at + interval '1 day' and b.opened_at <= a.closed_at + interval '60 days'
    group by 1
  ),
  note as (
    select distinct on (address_key) address_key, closure_note
    from r where closed_at is not null and closure_note is not null
    order by address_key, closed_at desc
  )
  select left(g.address_key, 16), g.address_block, g.neighborhood, g.city, g.lat, g.lon,
         g.reports, g.closures, coalesce(t.returns, 0), g.first_at, g.last_at, g.last_closed,
         (current_date - g.last_closed)::int, n.closure_note,
         (g.last_closed >= current_date - 60 and coalesce(t.returns, 0) >= 1)
  from agg g left join ret t using (address_key) left join note n using (address_key)
$$;

create or replace function site_queue(lim int default 50, hood text default null)
returns setof jsonb
language sql stable security definer set search_path = public as $$
  select to_jsonb(s) from draft_sites() s
  where hood is null or s.neighborhood = hood
  order by s.due desc, s.returns desc, s.reports desc, s.last_at desc
  limit lim
$$;

create or replace function site_detail(site_id text) returns jsonb
language sql stable security definer set search_path = public as $$
  with s as (select * from draft_sites(1) where id = site_id),
  k as (select distinct address_key from incidents where left(address_key, 16) = site_id),
  reps as (
    select i.id, i.opened_at, i.closed_at, i.status, i.closure_note, i.action_tag
    from incidents i join k using (address_key) where i.category = 'rodent' and i.opened_at >= '2024-01-01'
  ),
  near as (
    select i.category, count(*)::int n
    from incidents i, s
    where i.opened_at >= now() - interval '12 months' and i.category <> 'rodent'
      and i.geom is not null
      and st_dwithin(i.geom, st_setsrid(st_makepoint(s.lon, s.lat), 4326)::geography, 100)
    group by 1
  ),
  vac as (
    select count(*)::int n from places p, s
    where p.kind = 'vacant_parcel' and p.geom is not null
      and st_dwithin(p.geom, st_setsrid(st_makepoint(s.lon, s.lat), 4326)::geography, 40)
  )
  select jsonb_build_object(
    'site', (select to_jsonb(s) from s),
    'reports', coalesce((select jsonb_agg(jsonb_build_object(
        'id', id, 'opened', opened_at::date, 'closed', closed_at::date, 'status', status,
        'note', closure_note, 'action', action_tag) order by opened_at) from reps), '[]'::jsonb),
    'drivers_100m_12mo', coalesce((select jsonb_object_agg(category, n) from near), '{}'::jsonb),
    'adjacent_vacant_parcels', (select n from vac),
    'source_ids', jsonb_build_array('boston-311-2024', 'boston-311-2025', 'boston-311-2026', 'boston-311-new', 'boston-code-enforcement')
  )
  where exists (select 1 from s)
$$;

grant execute on function draft_sites, site_queue, site_detail to anon, authenticated;
