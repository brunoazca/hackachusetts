-- Severity per 250 m cell (insights spec §5.1), the ranking input for the Insights tab.
-- Written by pipeline/rat_audit/model/region_solution.py together with region_solutions.
-- severity = observed_12w + expected_4w + expected_returns_60d (all in reports, no weights);
-- smoothed = severity + 0.5 × Σ 8 neighbours (§5.5). Public read.
create table if not exists cell_severity (
  cell_id               text primary key,
  forecast_run_id       text not null references model_runs(id) on delete cascade,
  observed_12w          int not null,     -- rodent reports in the cell, last 12 weeks
  expected_4w           real not null,    -- Σ predictions.expected, next 4 forecast weeks
  expected_returns_60d  real not null,    -- Σ over active addresses of P(return within 60 d | monitoring), record_solutions
  severity              real not null,
  smoothed              real not null,
  rank                  int not null,     -- by smoothed, 1 = worst
  region_id             text,             -- region_solutions.region_id when the cell is in a ranked region
  computed_at           timestamptz not null default now()
);
create index if not exists cell_severity_rank_idx on cell_severity (rank);

alter table cell_severity enable row level security;
drop policy if exists "public read" on cell_severity;
create policy "public read" on cell_severity for select using (true);
