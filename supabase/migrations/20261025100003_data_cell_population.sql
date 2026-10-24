-- Residents per 250 m cell (insights spec §5.4a): each tract's population split across the cells by the share of
-- the tract's area inside each cell (areal interpolation; people assumed uniform within a tract). Population is
-- the only demographic the Insights region cards use. Static: rerun the insert when the grid or tracts change.
-- Owner: data track.

create table if not exists cell_population (
  cell_id    text primary key references grid_cells(id) on delete cascade,
  pop        numeric not null,
  tract_ids  text[] not null default '{}',
  source_ids text[] not null default '{}'
);
alter table cell_population enable row level security;

delete from cell_population;
insert into cell_population (cell_id, pop, tract_ids, source_ids)
select g.id,
       round(coalesce(sum(t.pop * st_area(st_intersection(g.g, t.g)) / nullif(st_area(t.g), 0)), 0)),
       array_remove(array_agg(distinct t.geoid), null),
       array_remove(array_agg(distinct t.source_id), null)
from (select id, st_transform(geom::geometry, 26986) g from grid_cells) g
left join (
  select geoid, st_transform(geom::geometry, 26986) g,
         -- ACS 2024 when the tract matched; Boston's 2010 SVI tracts that changed GEOID keep their SVI population.
         coalesce((attrs->'acs'->>'pop')::numeric, (attrs->>'pop')::numeric) pop,
         case when attrs->'acs'->>'pop' is not null then 'census-reporter-acs' else source_id end source_id
  from tracts
) t on st_intersects(g.g, t.g) and t.pop is not null
group by g.id;

-- Residents in a set of cells (an Insights region), with the sources to cite.
create or replace function region_population(cell_ids text[]) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'pop', coalesce(sum(p.pop), 0),
    'n_cells', count(*) filter (where p.pop > 0),
    'sources', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'url', s.url))
                         from sources s where s.id in (select unnest(source_ids) from cell_population
                                                       where cell_id = any(region_population.cell_ids))), '[]'::jsonb))
  from cell_population p where p.cell_id = any(region_population.cell_ids)
$$;

grant execute on function region_population to anon, authenticated;

-- The full demographic profile on the region cards was noise; the cards now show residents only.
drop function if exists region_context(text[]);
