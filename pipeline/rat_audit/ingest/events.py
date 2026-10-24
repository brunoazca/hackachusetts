"""Time-bound events: Sept 1 student move-out (citywide), Boston Marathon, Red Sox home games at Fenway.

Move-out is the one event with a validated effect on trash and rodent reports. Marathon and
Red Sox games are display-only: validation found no effect, and attrs.note says so.
"""
from __future__ import annotations

from datetime import date, datetime, time, timedelta

import psycopg

from .. import db
from .common import BOSTON_TZ, _get_json, jsonb, upsert_generic

YEARS = range(2023, 2027)
MOVE_OUT_ZIPS = ["02134", "02135", "02215", "02120", "02115"]
FENWAY = (42.3467, -71.0972)
FINISH_LINE = (42.3496, -71.0782)  # Boylston St at Copley Square
MLB = "https://statsapi.mlb.com/api/v1/schedule"
COLS = ["id", "source_id", "kind", "title", "starts_at", "ends_at", "attrs", "lat", "lon", "city"]
NO_EFFECT = "Display only: validation found no measurable effect on rodent or trash reports."


def _local(d: date, t: time = time(0)) -> datetime:
    return datetime.combine(d, t, BOSTON_TZ)


def _move_out(conn: psycopg.Connection) -> list[tuple]:
    sid = "boston-move-out"
    db.upsert_source(conn, sid, "Boston Sept 1 student move-out window", "https://www.boston.gov/move-boston",
                     "Aug 25 - Sep 7 each year; lease turnover concentrated in student ZIPs")
    return [(f"move_out:{y}", sid, "move_out", f"Sept 1 student move-out {y}", _local(date(y, 8, 25)),
             _local(date(y, 9, 7), time(23, 59)),
             jsonb({"zips": MOVE_OUT_ZIPS, "note": "Lease turnover; bulk trash and furniture on curbs."}),
             None, None, "boston") for y in YEARS]


def _patriots_day(y: int) -> date:
    d = date(y, 4, 1)
    first_monday = d + timedelta(days=(0 - d.weekday()) % 7)
    return first_monday + timedelta(weeks=2)


def _marathon(conn: psycopg.Connection) -> list[tuple]:
    sid = "boston-marathon"
    db.upsert_source(conn, sid, "Boston Marathon (Patriots' Day, third Monday of April)", "https://www.baa.org/races/boston-marathon")
    return [(f"marathon:{y}", sid, "sports", f"Boston Marathon {y}", _local(_patriots_day(y), time(9)),
             _local(_patriots_day(y), time(18)), jsonb({"venue": "Finish line, Boylston St", "note": NO_EFFECT}),
             *FINISH_LINE, "boston") for y in YEARS]


def _red_sox(conn: psycopg.Connection) -> list[tuple]:
    sid = "mlb-red-sox-schedule"
    db.upsert_source(conn, sid, "MLB Stats API: Red Sox schedule", f"{MLB}?sportId=1&teamId=111", "home games at Fenway Park only")
    rows: dict[str, tuple] = {}
    for y in YEARS:
        d = _get_json(MLB, {"sportId": 1, "teamId": 111, "season": y})
        for day in d.get("dates", []):
            for g in day["games"]:
                state = g["status"].get("detailedState", "")
                if g["venue"]["name"] != "Fenway Park" or g["teams"]["home"]["team"]["id"] != 111:
                    continue
                if state.startswith(("Postponed", "Cancelled", "Suspended")):
                    continue
                start = datetime.fromisoformat(g["gameDate"].replace("Z", "+00:00"))
                rows[f"redsox:{g['gamePk']}"] = (
                    f"redsox:{g['gamePk']}", sid, "sports", f"Red Sox vs {g['teams']['away']['team']['name']}",
                    start, start + timedelta(hours=3),
                    jsonb({"venue": "Fenway Park", "game_type": g["gameType"], "status": state, "note": NO_EFFECT}),
                    *FENWAY, "boston",
                )
    return list(rows.values())


def run(conn: psycopg.Connection, since: str | None = None) -> int:
    # Small, fully re-read every time; `since` is accepted for the common signature.
    total = 0
    for sid, build in (("boston-move-out", _move_out), ("boston-marathon", _marathon), ("mlb-red-sox-schedule", _red_sox)):
        rows = build(conn)
        with db.ingest_run(conn, sid) as run_:
            run_["rows"] = upsert_generic(conn, "events", COLS, rows)
            conn.commit()
        total += run_["rows"]
    return total
