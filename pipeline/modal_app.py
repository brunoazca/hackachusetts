"""Rat Audit worker on Modal: ingestion, analytics, forecast and the what-if simulator.

Deploy:  cd pipeline && MODAL_PROFILE=harvard uv run modal deploy modal_app.py
Run one: MODAL_PROFILE=harvard uv run modal run modal_app.py::backfill
Secret `rat-audit` holds SUPABASE_DB_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL,
SOCRATA_APP_TOKEN and RAT_AUDIT_WORKER_TOKEN (the bearer token the web app sends).
"""
from __future__ import annotations

import os

import modal
from fastapi import Header, HTTPException

image = (
    modal.Image.debian_slim(python_version="3.12")
    .uv_pip_install(
        "psycopg[binary]>=3.2", "requests>=2.32", "pandas>=2.2", "numpy>=2.0", "scipy>=1.14",
        "scikit-learn>=1.5", "shapely>=2.0", "pyproj>=3.6", "fastapi[standard]>=0.115",
    )
    .add_local_file("../contracts/categories.json", "/root/contracts/categories.json")
    .add_local_python_source("rat_audit")
)
secrets = [modal.Secret.from_name("rat-audit")]
app = modal.App("rat-audit", image=image, secrets=secrets)


@app.function(timeout=600)
def ping() -> dict:
    from rat_audit import db
    return db.ping()


@app.function(timeout=3600, cpu=2.0, memory=4096)
def ingest_source(name: str, since: str | None = None) -> dict:
    from rat_audit import jobs
    return jobs.ingest(name, since)


@app.function(timeout=3600)
def backfill() -> list[dict]:
    """Full load: every source in parallel (311 is the long pole)."""
    from rat_audit import jobs
    return list(ingest_source.map(jobs.INGEST_SOURCES))


@app.function(timeout=3600, cpu=4.0, memory=8192)
def analytics_and_score() -> dict:
    from rat_audit import jobs
    return {"analytics": jobs.analytics(), "score": jobs.score()}


@app.function(timeout=3600)  # manual: refresh fast sources → analytics + score (no cron: one-day hackathon)
def daily() -> dict:
    from rat_audit import jobs
    return {"refresh": jobs.refresh(jobs.DAILY_SOURCES), "after": analytics_and_score.remote()}


@app.function(timeout=3600, cpu=4.0, memory=8192)  # manual: retrain + backtest (no cron)
def weekly_retrain() -> dict:
    from rat_audit import jobs
    return jobs.train()


def _authorized(authorization: str | None) -> bool:
    return authorization == f"Bearer {os.environ['RAT_AUDIT_WORKER_TOKEN']}"


@app.function(timeout=900)
@modal.fastapi_endpoint(method="POST")
def refresh(authorization: str | None = Header(default=None)) -> dict:
    """Called by the app's Refresh button through Vercel /api/refresh (token stays server-side)."""
    from rat_audit import jobs
    if not _authorized(authorization):
        raise HTTPException(status_code=401, detail="unauthorized")
    result = jobs.refresh()
    analytics_and_score.spawn()  # recompute findings + forecast in the background
    return {"refresh": result, "rescoring": "started"}


@app.function(timeout=120, cpu=2.0, memory=4096, min_containers=0)
@modal.fastapi_endpoint(method="POST")
def simulate(request: dict, authorization: str | None = Header(default=None)) -> dict:
    """What-if: {cell_id|site_id, interventions:[...] , weeks:4} -> expected change (model estimate)."""
    from rat_audit import jobs
    if not _authorized(authorization):
        raise HTTPException(status_code=401, detail="unauthorized")
    return jobs.simulate(request)
