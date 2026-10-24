-- Insight card for every cell with rodent history outside the ranked regions (one-cell
-- regions). Starts as the rules card with the AI input stored; solve_cell() (on demand)
-- replaces it with the AI card and caches it. Same columns as region_solutions.
create table if not exists cell_solutions (
  cell_id          text primary key,
  forecast_run_id  text not null references model_runs(id) on delete cascade,
  rank             int not null,                         -- cell_severity.rank
  cell_ids         text[] not null,
  action           text not null,
  lane             text not null check (lane in ('sanitation','exclusion','enforcement','referral','inspect')),
  because          text not null,
  cites            jsonb not null default '[]'::jsonb,
  records          jsonb not null default '[]'::jsonb,
  unknowns         jsonb not null default '[]'::jsonb,
  rule_id          int,
  source           text not null check (source in ('ai','rules')),
  llm_model        text,
  input_hash       text not null,
  input            jsonb not null,
  guard_errors     jsonb not null default '[]'::jsonb,
  caveat           text not null,
  computed_at      timestamptz not null default now(),
  locations        jsonb not null default '[]'::jsonb
);
alter table cell_solutions enable row level security;
drop policy if exists "public read" on cell_solutions;
create policy "public read" on cell_solutions for select using (true);

-- Boston level of each nearby-cause kind: mean count within 150 m of a recent rodent report.
-- Lets the insight RPCs say "3.4 times the Boston level" for any point.
create table if not exists cause_baselines (
  kind                    text primary key,
  per_report_within_150m  real not null,
  computed_at             timestamptz not null default now()
);
alter table cause_baselines enable row level security;
drop policy if exists "public read" on cause_baselines;
create policy "public read" on cause_baselines for select using (true);
