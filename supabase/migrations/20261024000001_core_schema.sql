-- Rat Audit core schema. Shared contract for the data, map and agent tracks.
-- Privacy: no owner names, no staff names. Addresses are stored as a block label
-- ("Normandy St, 02121"); points are kept at source precision for spatial joins
-- but the API returns them snapped (see snap() below).

create extension if not exists postgis;

-- Every fact in the app cites one of these.
create table if not exists sources (
  id            text primary key,          -- e.g. 'boston-311-2026'
  name          text not null,
  url           text not null,
  retrieved_at  timestamptz not null default now(),
  notes         text
);

-- 311 reports and similar point incidents (rodent, pest, trash drivers, harborage).
-- category values: see contracts/categories.json
create table if not exists incidents (
  id                 text primary key,     -- source case id, prefixed by source ('311:101005...')
  source_id          text not null references sources(id),
  category           text not null,        -- rodent | pest | bite | dead_animal | trash_storage | trash_early | missed_trash | dumping | litter | dumpster | vacant_lot | abandoned_building | weeds | construction_debris | sanitation
  subtype            text,                 -- original 311 type string
  status             text not null,        -- open | closed
  opened_at          timestamptz not null,
  closed_at          timestamptz,
  address_block      text,                 -- house number removed
  address_key        text,                 -- hashed full address, for recurrence grouping only
  zip                text,
  neighborhood       text,
  closure_note       text,
  action_tag         text,                 -- see contracts/categories.json actions
  action_confidence  real,
  geom               geography(point, 4326),
  lat                double precision,
  lon                double precision
);
create index if not exists incidents_geom_idx on incidents using gist (geom);
create index if not exists incidents_cat_time_idx on incidents (category, opened_at desc);
create index if not exists incidents_addr_idx on incidents (address_key);

-- Fixed places that drive or protect against rats.
-- kind: restaurant | demolition | excavation | work_zone | bigbelly | vacant_parcel | city_lot | school | park | market
create table if not exists places (
  id             text primary key,
  source_id      text not null references sources(id),
  kind           text not null,
  name           text,                     -- business / project name; never a person
  address_block  text,
  starts_at      timestamptz,
  ends_at        timestamptz,
  attrs          jsonb not null default '{}'::jsonb,  -- e.g. restaurant: {rodent_violations:[{date,desc}], license}
  geom           geography(point, 4326),
  lat            double precision,
  lon            double precision
);
create index if not exists places_geom_idx on places using gist (geom);
create index if not exists places_kind_idx on places (kind);

-- Time-bound events. geom null = citywide (rain, holidays, move-out).
-- kind: entertainment | one_day_alcohol | sports | move_out | holiday | rain | snow | heat | market_day
create table if not exists events (
  id          text primary key,
  source_id   text not null references sources(id),
  kind        text not null,
  title       text not null,
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  attrs       jsonb not null default '{}'::jsonb,
  geom        geography(point, 4326),
  lat         double precision,
  lon         double precision
);
create index if not exists events_time_idx on events (starts_at);
create index if not exists events_geom_idx on events using gist (geom);

create table if not exists weather_daily (
  day        date primary key,
  source_id  text not null references sources(id),
  precip_in  real,
  snow_in    real,
  tmax_f     real,
  tmin_f     real
);

-- Parcels for building facts and price impact. No owner names.
create table if not exists parcels (
  pid            text primary key,
  source_id      text not null references sources(id),
  address_block  text,
  zip            text,
  land_use       text,
  yr_built       int,
  own_occ        boolean,
  units          int,
  value_fy25     numeric,
  value_fy26     numeric,
  geom           geography(point, 4326),
  lat            double precision,
  lon            double precision
);
create index if not exists parcels_geom_idx on parcels using gist (geom);

-- Market prices, ZIP x month (Zillow ZHVI home value, ZORI rent).
create table if not exists zip_prices (
  zip        text not null,
  month      date not null,
  source_id  text not null references sources(id),
  zhvi       numeric,
  zori       numeric,
  primary key (zip, month)
);

-- Short-stay listings with rat-review counts (Inside Airbnb).
create table if not exists listings (
  id                 text primary key,
  source_id          text not null references sources(id),
  neighbourhood      text,
  price              numeric,
  review_count       int,
  rat_review_count   int,
  rat_review_samples jsonb not null default '[]'::jsonb,  -- [{date, excerpt}] short excerpts only
  geom               geography(point, 4326),
  lat                double precision,
  lon                double precision
);
create index if not exists listings_geom_idx on listings using gist (geom);

-- Census tracts with vulnerability and health context.
create table if not exists tracts (
  geoid      text primary key,
  source_id  text not null references sources(id),
  name       text,
  attrs      jsonb not null default '{}'::jsonb,   -- {svi_*, asthma_pct, pop}
  geom       geography(multipolygon, 4326)
);
create index if not exists tracts_geom_idx on tracts using gist (geom);

-- Computed: chronic sites (recurring rodent reports grouped by address_key).
create table if not exists sites (
  id                text primary key,
  address_block     text not null,
  zip               text,
  neighborhood      text,
  score             real not null,          -- 0..100
  rank              int,
  report_count      int not null,
  recurrence_count  int not null,           -- reports arriving >=1 day after a prior case was closed, within 60 days
  first_at          timestamptz,
  last_at           timestamptz,
  parcel_pid        text,
  summary           jsonb not null default '{}'::jsonb,     -- {drivers:[...], building:{...}, why:"..."}
  recommended       jsonb not null default '[]'::jsonb,     -- [{action, owner, because:[...], source_ids:[...]}]
  geom              geography(point, 4326),
  lat               double precision,
  lon               double precision,
  computed_at       timestamptz not null default now()
);
create index if not exists sites_geom_idx on sites using gist (geom);

-- Computed: what happened after each kind of city action.
create table if not exists action_outcomes (
  action_tag       text primary key,
  n                int not null,
  recur_60d_pct    real not null,
  median_days_to_next real,
  computed_at      timestamptz not null default now()
);

-- Human decisions (the inspector approval step). Demo data only.
create table if not exists decisions (
  id          uuid primary key default gen_random_uuid(),
  site_id     text not null references sites(id),
  action      text not null,
  owner       text,
  status      text not null default 'approved',   -- approved | edited | rejected
  note        text,
  follow_up_on date,
  created_at  timestamptz not null default now()
);

-- Ingestion runs, so the UI can show "live as of".
create table if not exists ingest_runs (
  id          bigserial primary key,
  source_id   text not null,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  rows_upserted int,
  newest_record_at timestamptz,
  ok          boolean,
  message     text
);

-- Public read, no public writes (writes go through the service role).
do $$
declare t text;
begin
  foreach t in array array['sources','incidents','places','events','weather_daily','parcels','zip_prices','listings','tracts','sites','action_outcomes','ingest_runs','decisions']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "public read" on %I', t);
    execute format('create policy "public read" on %I for select using (true)', t);
  end loop;
end $$;
-- Demo: anyone may record an inspector decision (no auth in the demo).
drop policy if exists "demo insert" on decisions;
create policy "demo insert" on decisions for insert with check (true);
