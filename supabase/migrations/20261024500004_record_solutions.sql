-- Per-record proposed solution (insights spec §5.2 layer 1). Written by
-- pipeline/rat_audit/model/solution.py (model record_solution_gbm); read by the
-- insights region assembly and the AI region_solutions job. Public read, like predictions.
create table if not exists record_solutions (
  incident_id          text primary key references incidents(id) on delete cascade,
  model_run_id         text not null references model_runs(id) on delete cascade,
  done_action          text not null,          -- action read from the closure note
  action               text not null,          -- proposed legal action (never baiting)
  label                text not null,
  owner                text,
  p_return             real not null,          -- P(rodent report at same address within 60 d) under `action`
  p_return_monitoring  real not null,          -- same, under monitoring (reference)
  gain                 real not null,
  confident            boolean not null,       -- false => "inspect and record the cause"
  alternatives         jsonb not null default '[]'::jsonb,  -- [{action,label,p_return,n_cases}]
  because              jsonb not null default '[]'::jsonb,  -- context facts, plain text
  caveat               text not null,
  computed_at          timestamptz not null default now()
);
create index if not exists record_solutions_run_idx on record_solutions (model_run_id);

alter table record_solutions enable row level security;
drop policy if exists "public read" on record_solutions;
create policy "public read" on record_solutions for select using (true);
