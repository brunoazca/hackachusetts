-- Persisted trained-model blobs so Modal (no shared disk) can reload a fitted model.
-- model_runs.id is text in this schema, so the FK column is text too.
create table if not exists model_artifacts (
  model_run_id text not null references model_runs(id) on delete cascade,
  blob         bytea not null,
  created_at   timestamptz not null default now(),
  primary key (model_run_id)
);
