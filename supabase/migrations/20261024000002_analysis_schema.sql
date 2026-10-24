-- Analysis outputs: correlations, prediction, price impact. Written by the analytics track,
-- read by the Insights panel, the map (forecast layer) and the agent.

-- One row per finding we show. chart is a small, render-ready payload.
create table if not exists correlations (
  id          text primary key,              -- e.g. 'trash-storage-vs-rodent'
  title       text not null,                 -- plain-language headline
  question    text not null,                 -- what we tested
  method      text not null,                 -- e.g. 'Spearman over 250 m cells, 2025'
  unit        text,                          -- unit of analysis
  stat        jsonb not null,                -- {rho, p, n} | {lift, ci:[lo,hi], n} | {before, after, control_before, control_after}
  strength    text not null,                 -- strong | moderate | weak | none
  chart       jsonb not null,                -- {type:'scatter'|'bar'|'line'|'event_study', x_label, y_label, series:[{name, points:[[x,y],...]}]}
  caveat      text not null,
  group_name  text not null,                 -- food | shelter | displace | weather | reports | impact | price | action
  source_ids  text[] not null default '{}',
  sort        int not null default 100,
  computed_at timestamptz not null default now()
);

-- Square grid used for prediction and area stats (~250 m cells, Boston only).
create table if not exists grid_cells (
  id           text primary key,             -- 'g250_<col>_<row>'
  geom         geography(polygon, 4326) not null,
  lat          double precision not null,
  lon          double precision not null,
  neighborhood text,
  zip          text
);
create index if not exists grid_cells_geom_idx on grid_cells using gist (geom);

create table if not exists model_runs (
  id          text primary key,              -- e.g. 'risk-v1-20261024T1500'
  model       text not null,                 -- 'cell_week_poisson_gbm' | 'site_recurrence_logit'
  trained_through date,
  params      jsonb not null default '{}'::jsonb,
  metrics     jsonb not null default '{}'::jsonb,   -- {backtest_weeks, mae, baseline_mae, top10pct_capture, baseline_top10pct_capture, auc}
  feature_importance jsonb not null default '[]'::jsonb, -- [{feature, label, importance}]
  created_at  timestamptz not null default now()
);

-- Forecast per cell per week. actual is filled when the week has passed (backtest + live scoring).
create table if not exists predictions (
  cell_id       text not null references grid_cells(id),
  week_start    date not null,
  model_run_id  text not null references model_runs(id),
  expected      real not null,               -- expected rodent reports that week
  p_any         real not null,               -- P(>=1 report)
  risk_band     text not null,               -- low | elevated | high | very_high
  actual        int,
  drivers       jsonb not null default '[]'::jsonb,   -- [{feature, label, contribution, value}] top 3-5
  primary key (cell_id, week_start, model_run_id)
);
create index if not exists predictions_week_idx on predictions (week_start);

-- Price and cost impact findings (exploratory, with explicit caveats).
create table if not exists price_impact (
  id          text primary key,              -- e.g. 'assessed-change-chronic-vs-matched'
  title       text not null,
  scope       text not null,                 -- city | zip | site
  scope_id    text,
  metric      text not null,
  value       jsonb not null,
  caveat      text not null,
  source_ids  text[] not null default '{}',
  computed_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['correlations','grid_cells','model_runs','predictions','price_impact']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "public read" on %I', t);
    execute format('create policy "public read" on %I for select using (true)', t);
  end loop;
end $$;
