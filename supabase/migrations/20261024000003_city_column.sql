-- Regional scope: Boston + Cambridge + Somerville. Every spatial row names its city.
alter table incidents add column if not exists city text not null default 'boston';
alter table places    add column if not exists city text not null default 'boston';
alter table events    add column if not exists city text;            -- null = regional / citywide
alter table parcels   add column if not exists city text not null default 'boston';
alter table sites     add column if not exists city text not null default 'boston';
alter table tracts    add column if not exists city text;
alter table grid_cells add column if not exists city text;
-- Somerville 311 has no coordinates, only a census block code; points are block centroids.
alter table incidents add column if not exists geo_precision text not null default 'point';  -- point | block_centroid
create index if not exists incidents_city_idx on incidents (city, category, opened_at desc);
