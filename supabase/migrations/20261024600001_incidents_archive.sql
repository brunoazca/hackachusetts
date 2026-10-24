-- Boston 311 history before 2023 (2016-2022), lean: category, time and point only.
-- Model training history (lags, same-week-last-year, pre-pandemic seasons); the map keeps
-- reading `incidents` (2023+). No address, no note.
create table if not exists incidents_archive (
  id         text primary key,
  source_id  text not null references sources(id),
  city       text not null default 'boston',
  category   text not null,
  opened_at  timestamptz not null,
  lon        double precision,
  lat        double precision
);
create index if not exists incidents_archive_city_time on incidents_archive (city, opened_at);

create or replace view data_coverage as
  select 'incident'::text as kind, category as layer, city, source_id,
         count(*)::bigint as rows, min(opened_at)::date as first_date, max(opened_at)::date as last_date,
         round(100.0 * count(lat) / count(*), 1) as pct_located
  from incidents group by category, city, source_id
  union all
  select 'incident_history', category, city, source_id, count(*), min(opened_at)::date, max(opened_at)::date,
         round(100.0 * count(lat) / count(*), 1)
  from incidents_archive group by category, city, source_id
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

alter table incidents_archive enable row level security;
grant select on incidents_archive to anon, authenticated;
create policy incidents_archive_read on incidents_archive for select using (true);
