-- Analytics core (tasks 2.1-2.5, 2.7). Additive only: new columns on analytics-owned tables and a run log.

-- grid_cells: lattice indexes, clipped land share, and the boundary the clip used.
alter table grid_cells add column if not exists col int;
alter table grid_cells add column if not exists row int;
alter table grid_cells add column if not exists land_frac real;          -- clipped area / 62,500 m²
alter table grid_cells add column if not exists boundary_source text;    -- sources.id of the clip boundary

-- action_outcomes: counts behind the rate, the 60-day observation window and its censoring.
alter table action_outcomes add column if not exists n_recurred int;
alter table action_outcomes add column if not exists n_censored int;          -- closed < window days before observed_through
alter table action_outcomes add column if not exists window_days int;
alter table action_outcomes add column if not exists observed_through date;   -- newest rodent report in the data
alter table action_outcomes add column if not exists ci_low real;             -- 95% Wilson, percent
alter table action_outcomes add column if not exists ci_high real;
alter table action_outcomes add column if not exists by_year jsonb not null default '{}'::jsonb;
alter table action_outcomes add column if not exists source_ids text[] not null default '{}';

-- One row per rat_audit.analytics.run_all() call: per-step status, counts, coverage, missing inputs.
create table if not exists analytics_runs (
  id          bigserial primary key,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  ok          boolean,
  steps       jsonb not null default '{}'::jsonb
);
alter table analytics_runs enable row level security;
drop policy if exists "public read" on analytics_runs;
create policy "public read" on analytics_runs for select using (true);
