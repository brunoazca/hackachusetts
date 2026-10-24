-- Infinite scroll for the Insight panel ranking: insight_ranking(lim, off). Same rows as before
-- (ranked regions first, then the worst lone cells), plus `total` on every row for the list footer.
drop function if exists insight_ranking(int);
create or replace function insight_ranking(lim int default 20, off int default 0) returns jsonb
language sql stable security definer set search_path = public as $$
  with u as (
    select 'region' entry, region_id id, rank, 0 grp, cell_ids, action, lane, because, source, locations,
           input->'region' region, computed_at from region_solutions
    union all
    select 'cell', cell_id, rank, 1, cell_ids, action, lane, because, source, locations,
           input->'region', computed_at from cell_solutions
  ), n as (select u.*, row_number() over (order by grp, rank) position, count(*) over () total from u)
  select coalesce(jsonb_agg(to_jsonb(n) - 'grp' order by position), '[]'::jsonb)
  from n where position > off and position <= off + lim
$$;
grant execute on function insight_ranking(int, int) to anon, authenticated;

-- Map click on empty ground -> the Boston 250 m block under it (null outside the grid).
create or replace function cell_at(lat double precision, lon double precision) returns text
language sql stable security definer set search_path = public as $$
  select c.id from grid_cells c
  where c.id = cell_of(st_setsrid(st_makepoint(cell_at.lon, cell_at.lat), 4326)::geography) and c.city = 'boston'
$$;
grant execute on function cell_at(double precision, double precision) to anon, authenticated;
