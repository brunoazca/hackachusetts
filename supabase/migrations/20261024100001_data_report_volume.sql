-- All-type 311 volume per ~100 m bin per month: the "who reports" control for analytics and the model.
-- Bins are floor(lat*1000), floor(lon*1000); re-aggregate to any grid.
create table if not exists report_volume (
  city      text not null default 'boston',
  lat_bin   int not null,
  lon_bin   int not null,
  month     date not null,
  n_all     int not null,          -- every 311 report in the bin that month
  source_id text not null references sources(id),
  primary key (city, lat_bin, lon_bin, month)
);
alter table report_volume enable row level security;
drop policy if exists "public read" on report_volume;
create policy "public read" on report_volume for select using (true);
