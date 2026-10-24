-- Clickable places in AI region text. The AI writes places as [label](L<n>); this column
-- maps each id to {id, label, block, lat, lon, incident_ids} so the card can fly the map there.
alter table region_solutions add column if not exists locations jsonb not null default '[]'::jsonb;
