"""Job entry points shared by local runs and Modal.

Each track fills in its module; this file only wires them together:
- ingest: rat_audit.ingest.<source>.run(conn, since=None) -> rows
- analytics: rat_audit.analytics.run_all(conn)
- model: rat_audit.model.train(conn) / score(conn) / simulate(conn, request)
"""
from __future__ import annotations

import importlib

from . import db

# Order matters: 311 first (the map needs it), context last.
INGEST_SOURCES = [
    "t311",        # Boston 311 yearly 2023-2026 + new-system trash types
    "regional",    # Somerville 311, Cambridge sightings + smart boxes
    "cambridge",   # Cambridge food, housing pests, parcels, permits, schools
    "somerville",  # Somerville permits, MassGIS assessor parcels, schools
    "parcels",     # assessment FY25/FY26 (+ private owners)
    "food",        # food inspections, rodent violations
    "permits",     # demolitions, excavations, work zones
    "places_misc", # Big Belly, city lots, schools
    "enforcement", # code enforcement tickets (trash storage, overfilling, dumping)
    "weather",     # NOAA daily
    "events",      # licenses, Red Sox, move-out, holidays
    "context",     # tracts, Zillow, Airbnb, iNaturalist
    "demographics",  # ACS by tract for all three cities (after context creates the tracts)
]
# Live updates (see ingest/update_modes.py for the per-source list written to `sources.update_mode`):
#   LIVE   -> REFRESH_SOURCES: Refresh button (Modal `refresh`, ~15 s) and the daily cron
#   DAILY  -> DAILY_SOURCES minus REFRESH_SOURCES: daily cron only
#   STATIC -> everything else in INGEST_SOURCES: snapshots / closed years, re-run with a backfill
REFRESH_SOURCES = ["t311", "regional", "enforcement"]
DAILY_SOURCES = REFRESH_SOURCES + ["weather", "food", "permits", "cambridge", "somerville"]  # cambridge/somerville skip their static layers when since is set


def _run_source(name: str, since: str | None = None) -> dict:
    try:
        mod = importlib.import_module(f"rat_audit.ingest.{name}")
    except ModuleNotFoundError:
        return {"source": name, "skipped": "not implemented yet"}
    try:
        with db.connect() as conn:
            rows = mod.run(conn, since=since)
    except Exception as e:  # one broken source must not stop the others
        return {"source": name, "error": f"{type(e).__name__}: {e}"[:300]}
    return {"source": name, "rows": rows}


def ingest(name: str, since: str | None = None) -> dict:
    return _run_source(name, since)


def refresh(sources: list[str] | None = None) -> list[dict]:
    """New rows from fast-moving sources (re-reads the last 14 days to catch closures)."""
    return [_run_source(n, since="14d") for n in (sources or REFRESH_SOURCES)]


def _call(module: str, fn: str, *args) -> dict:
    """Call rat_audit.<module>.<fn>(conn, *args); skip cleanly until a track implements it."""
    try:
        target = getattr(importlib.import_module(f"rat_audit.{module}"), fn)
    except (ModuleNotFoundError, AttributeError):
        return {"skipped": f"{module}.{fn} not implemented yet"}
    with db.connect() as conn:
        return target(conn, *args)


def analytics() -> dict:
    return _call("analytics", "run_all")


def train() -> dict:
    return _call("model", "train")


def score() -> dict:
    return _call("model", "score")


def simulate(request: dict) -> dict:
    return _call("model", "simulate", request)
