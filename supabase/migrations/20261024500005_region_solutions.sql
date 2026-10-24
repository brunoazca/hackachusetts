-- AI-written solution per ranked Insights region (insights spec §5.2 layer 2).
-- Written by pipeline/rat_audit/model/region_solution.py after each scoring run.
-- `input` is the exact evidence the AI saw (forecast, records, causes, solution
-- statistics), so the card and the agent can show it. Public read.
create table if not exists region_solutions (
  region_id        text primary key,           -- top cell id of the region
  forecast_run_id  text not null references model_runs(id) on delete cascade,
  rank             int not null,
  cell_ids         text[] not null,
  action           text not null,
  lane             text not null check (lane in ('sanitation','exclusion','enforcement','referral','inspect')),
  because          text not null,
  cites            jsonb not null default '[]'::jsonb,
  records          jsonb not null default '[]'::jsonb,   -- [{incident_id, todo}]
  unknowns         jsonb not null default '[]'::jsonb,
  rule_id          int,                                   -- when source = 'rules'
  source           text not null check (source in ('ai','rules')),
  llm_model        text,
  input_hash       text not null,
  input            jsonb not null,
  guard_errors     jsonb not null default '[]'::jsonb,   -- why AI output was rejected, if it was
  caveat           text not null,
  computed_at      timestamptz not null default now()
);
create index if not exists region_solutions_rank_idx on region_solutions (rank);

alter table region_solutions enable row level security;
drop policy if exists "public read" on region_solutions;
create policy "public read" on region_solutions for select using (true);
