-- Smoothed forecast surface for the map (pipeline/rat_audit/model/surface.py).
-- One row per (run, period, level): the land area where expected rodent reports ≥ level.
-- period = '4w' (total over the forecast weeks) or a forecast week_start (YYYY-MM-DD). Owner: model track.

create table if not exists model_forecast_surface (
  model_run_id text not null references model_runs(id) on delete cascade,
  period       text not null,
  level        real not null,
  geojson      jsonb not null,
  primary key (model_run_id, period, level)
);
alter table model_forecast_surface enable row level security;

create or replace function forecast_surface(period text default '4w') returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('type', 'FeatureCollection', 'period', forecast_surface.period, 'features',
    coalesce(jsonb_agg(jsonb_build_object(
      'type', 'Feature', 'geometry', s.geojson, 'properties', jsonb_build_object('level', s.level)
    ) order by s.level), '[]'::jsonb))
  from model_forecast_surface s
  where s.model_run_id = forecast_run_id() and s.period = forecast_surface.period
$$;

grant execute on function forecast_surface to anon, authenticated;
