# Rat Audit pipeline (Python worker)

One Python package, `rat_audit`, runs both locally and on **Modal** (workspace `brunocarvalho`, profile `harvard`).
It loads every source into Supabase, computes findings, trains/scores the forecast and serves the what-if simulator.
The web app (Vercel) only reads Supabase; its Refresh button calls the Modal `refresh` endpoint through `/api/refresh`.

## Layout

| Path | What |
|---|---|
| `rat_audit/db.py` | Postgres connection (`SUPABASE_DB_URL`), `upsert_source`, `ingest_run` context manager |
| `rat_audit/jobs.py` | Job registry: `INGEST_SOURCES`, `refresh()`, `analytics()`, `train()`, `score()`, `simulate()` |
| `rat_audit/ingest/<source>.py` | One module per source, each exposing `run(conn, since=None) -> int` (rows upserted) |
| `rat_audit/analytics/__init__.py` | `run_all(conn) -> dict` (grid, classifier, sites, outcomes, correlations, price impact) |
| `rat_audit/model/__init__.py` | `train(conn)`, `score(conn)`, `simulate(conn, request)` |
| `modal_app.py` | Modal functions and web endpoints (no crons) |

Modules that don't exist yet are skipped with `"not implemented yet"`, so the worker is always deployable.

## Run

```bash
cd pipeline
uv sync
set -a; . ../.env.local; set +a              # local runs read the same env
uv run python -c "from rat_audit import jobs; print(jobs.ingest('t311'))"

export MODAL_PROFILE=harvard
uv run modal deploy modal_app.py             # deploy (functions + endpoints)
uv run python -c "import modal; print(modal.Function.from_name('rat-audit','backfill').remote())"
```

## Which data is live

Each source's mode is defined once in `rat_audit/ingest/update_modes.py` and written to `sources.update_mode`
(`live` | `daily` | `static`) plus `sources.update_note`, so the UI and the agent can label every layer.

| Mode | When it updates | Sources |
|---|---|---|
| **live** | Refresh button (Modal `refresh`, ~15 s) | Boston 311 2026 + new system, 311 volume, code enforcement, Somerville 311, Cambridge rodent sightings, Cambridge smart rat boxes |
| **daily** | Manual `daily` run (no cron) | NOAA weather (~4-day lag), food inspections, building permits |
| **static** | Loaded once; re-run with `backfill` | Boston 311 2023–2025 (closed years), property assessment, SAM addresses, Big Belly, city lots, schools, colleges, Checkbook spending, tracts (SVI, TIGERweb, CDC asthma), Zillow, Inside Airbnb, iNaturalist, Marathon / move-out / Red Sox calendars |

A new source without an entry in `update_modes.py` fails at `db.upsert_source` on purpose.

## Modal functions

| Function | Trigger | Does |
|---|---|---|
| `ping` | manual | DB connectivity + deployed `jobs.py` hash |
| `ingest_source(name, since)` | manual / fan-out | one source |
| `backfill` | manual | all sources in parallel |
| `analytics_and_score` | after refresh, manual | findings + forecast scoring |
| `daily` | manual | refresh fast sources → analytics + score |
| `weekly_retrain` | manual | retrain + backtest → `model_runs` |
| `refresh` | POST endpoint, `Authorization: Bearer $RAT_AUDIT_WORKER_TOKEN` | fast refresh, then rescoring in background |
| `simulate` | POST endpoint, same token | what-if: `{cell_id|site_id, interventions, weeks}` → expected change |

Secret `rat-audit` (Modal) mirrors `.env.local`: `SUPABASE_DB_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`NEXT_PUBLIC_SUPABASE_URL`, `SOCRATA_APP_TOKEN`, `RAT_AUDIT_WORKER_TOKEN`. Recreate with
`modal secret create rat-audit --from-dotenv <file> --force` (needs `uv tool install modal --with python-dotenv`).

**Gotcha:** after a deploy, already-warm containers can keep serving the old code. Check `ping()["jobs_md5"]`
against `md5 -q rat_audit/jobs.py`; if they differ, `modal container list` and `modal container stop -y <id>`.
