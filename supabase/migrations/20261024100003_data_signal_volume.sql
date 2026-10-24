-- Per-category counts per ~100 m bin per month, for high-volume signals we don't keep row by row
-- (code enforcement 2023+). Same binning as report_volume: floor(lat*1000), floor(lon*1000).
create table if not exists signal_volume (
  city      text not null default 'boston',
  category  text not null,          -- e.g. ce_trash_storage, ce_overfill, ce_weeds, ce_dumping, ce_dumpster
  lat_bin   int not null,
  lon_bin   int not null,
  month     date not null,
  n         int not null,
  source_id text not null references sources(id),
  primary key (city, category, lat_bin, lon_bin, month)
);
alter table signal_volume enable row level security;
drop policy if exists "public read" on signal_volume;
create policy "public read" on signal_volume for select using (true);
