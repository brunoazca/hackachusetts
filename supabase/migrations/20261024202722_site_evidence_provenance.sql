-- Read-only provenance for the existing address-based place review.
-- Independent of draft_sites/site_detail so this migration also works on a fresh
-- database, where the historical API migrations sort after this CLI timestamp.
create or replace function public.site_evidence(site_id text) returns jsonb
language sql stable security invoker set search_path = public as $$
  with reps as materialized (
    select id, source_id, address_key, opened_at, closed_at, lat, lon
    from incidents
    where left(address_key, 16) = site_id
      and category = 'rodent' and opened_at >= '2024-01-01'
  ),
  center as (
    select st_setsrid(st_makepoint(avg(lon), avg(lat)), 4326)::geography as geom from reps
  ),
  near as materialized (
    select i.category, i.source_id
    from incidents i cross join center c
    where i.opened_at >= now() - interval '12 months' and i.category <> 'rodent'
      and i.geom is not null and st_dwithin(i.geom, c.geom, 100)
  ),
  vac as materialized (
    select p.source_id from places p cross join center c
    where p.kind = 'vacant_parcel' and p.geom is not null and st_dwithin(p.geom, c.geom, 40)
  ),
  ids as (
    select source_id from reps union select source_id from near union select source_id from vac
  ),
  source_rows as (
    select s.id, s.name, s.url, s.retrieved_at, s.update_mode, s.update_note,
           latest.finished_at as last_success_at, latest.newest_record_at
    from sources s join ids on ids.source_id = s.id
    left join lateral (
      select finished_at, newest_record_at from ingest_runs
      where source_id = s.id and ok and finished_at is not null
      order by finished_at desc limit 1
    ) latest on true
  )
  select jsonb_build_object(
    'as_of', now(), 'nearby_since', now() - interval '12 months',
    'reports', (select jsonb_agg(jsonb_build_object(
      'id', b.id, 'source_id', b.source_id,
      'after_closure', exists (
        select 1 from reps a where a.address_key = b.address_key and a.closed_at is not null
          and b.opened_at > a.closed_at + interval '1 day'
          and b.opened_at <= a.closed_at + interval '60 days'
      )) order by b.opened_at, b.id) from reps b),
    'report_source_ids', (select jsonb_agg(distinct source_id) from reps),
    'nearby', coalesce((select jsonb_agg(to_jsonb(n) order by n.count desc, n.category) from (
      select category, count(*)::int as count, array_agg(distinct source_id) as source_ids
      from near group by category
    ) n), '[]'::jsonb),
    'vacant', jsonb_build_object('count', (select count(*) from vac),
      'source_ids', coalesce((select jsonb_agg(distinct source_id) from vac), '[]'::jsonb)),
    'sources', coalesce((select jsonb_agg(to_jsonb(s) order by s.name) from source_rows s), '[]'::jsonb)
  ) where exists (select 1 from reps)
$$;

revoke all on function public.site_evidence(text) from public;
grant execute on function public.site_evidence(text) to anon, authenticated;
comment on function public.site_evidence(text) is
  'Actual contributing sources, per-source retrieval/import times, and spatial evidence for one address-based place. Obeys caller RLS.';
