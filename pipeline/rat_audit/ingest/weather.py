"""NOAA GHCN-Daily, Boston Logan (USW00014739): precipitation, snowfall, max/min temperature, mid-2015 on.

Only temperature showed a relationship with rodent reports in validation; rain and snow are kept
as columns but no rain/snow events are derived.
"""
from __future__ import annotations

from datetime import date, timedelta

import psycopg

from .. import db
from .common import _get_json, since_cutoff, to_float, upsert_generic

STATION = "USW00014739"
API = "https://www.ncei.noaa.gov/access/services/data/v1"
START = "2015-06-01"  # half a year before the model history (2016)


def run(conn: psycopg.Connection, since: str | None = None) -> int:
    cutoff = since_cutoff(since)
    sid = "noaa-ghcnd-logan"
    db.upsert_source(conn, sid, "NOAA GHCN-Daily, Boston Logan Airport", f"{API}?dataset=daily-summaries&stations={STATION}",
                     "PRCP, SNOW in inches; TMAX, TMIN in °F; recent days lag ~3-5 days")
    start = cutoff.date().isoformat() if cutoff else START
    end = (date.today() + timedelta(days=1)).isoformat()
    recs = _get_json(API, {"dataset": "daily-summaries", "stations": STATION, "dataTypes": "PRCP,SNOW,TMAX,TMIN",
                           "startDate": start, "endDate": end, "units": "standard", "format": "json"})
    rows = [(date.fromisoformat(r["DATE"]), sid, to_float(r.get("PRCP")), to_float(r.get("SNOW")),
             to_float(r.get("TMAX")), to_float(r.get("TMIN"))) for r in recs]
    with db.ingest_run(conn, sid) as run_:
        n = upsert_generic(conn, "weather_daily", ["day", "source_id", "precip_in", "snow_in", "tmax_f", "tmin_f"],
                           rows, key="day", geom=False)
        run_["rows"] = n
        conn.commit()
    return n
