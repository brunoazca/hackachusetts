"""All-type 311 volume for Cambridge and Somerville (the "who reports" control), same bins as Boston.

`report_volume` rows per ~100 m bin (floor(lat*1000), floor(lon*1000)) per month, 2023 on:
- Cambridge: every Commonwealth Connect request (2z9k-mv9g), by its point.
- Somerville: every 311 request (4pyi-uqq6), grouped server-side by census block and month, placed at the
  block centroid (same TIGERweb cache as regional.py), so bins are coarser there.
A refresh (`since`) recomputes from the previous month on.
"""
from __future__ import annotations

from collections import Counter
from datetime import date, timedelta

import os

import psycopg

from .. import db
from .common import _get_json, in_region, since_cutoff, socrata_paged, to_float
from .regional import CAM_ALL, CAM_DOMAIN, SOM_DATASET, SOM_DOMAIN, START, _block_centroids


def _write(conn: psycopg.Connection, city: str, sid: str, first_month: str, acc: Counter) -> int:
    conn.execute("delete from report_volume where city = %s and month >= %s", (city, date.fromisoformat(first_month + "-01")))
    with conn.cursor().copy("COPY report_volume (city, lat_bin, lon_bin, month, n_all, source_id) FROM STDIN") as cp:
        for (a, b, m), n in acc.items():
            cp.write_row((city, a, b, date.fromisoformat(m + "-01"), n, sid))
    conn.commit()
    return len(acc)


def _cambridge(conn: psycopg.Connection, first_month: str) -> int:
    sid = "cambridge-311-volume"
    db.upsert_source(conn, sid, "Cambridge Commonwealth Connect all-request volume per ~100 m bin per month",
                     f"https://{CAM_DOMAIN}/d/{CAM_ALL}", "derived; every issue type")
    acc: Counter = Counter()
    with db.ingest_run(conn, sid) as run:
        for page in socrata_paged(CAM_DOMAIN, CAM_ALL, f"ticket_created_date_time >= '{first_month}-01T00:00:00'",
                                  "lat,lng,ticket_created_date_time"):
            for r in page:
                lat, lon = to_float(r.get("lat")), to_float(r.get("lng"))
                m = (r.get("ticket_created_date_time") or "")[:7]
                if in_region(lat, lon) and len(m) == 7:
                    acc[(int(lat * 1000 // 1), int(lon * 1000 // 1), m)] += 1
        run["rows"] = _write(conn, "cambridge", sid, first_month, acc)
    return run["rows"]


def _somerville(conn: psycopg.Connection, first_month: str) -> int:
    sid = "somerville-311-volume"
    db.upsert_source(conn, sid, "Somerville 311 all-request volume per census block per month",
                     f"https://{SOM_DOMAIN}/d/{SOM_DATASET}", "derived; every type; placed at block centroids")
    rows = _som_grouped(first_month)
    cents = _block_centroids({r["block_code"] for r in rows})
    acc: Counter = Counter()
    with db.ingest_run(conn, sid) as run:
        for r in rows:
            lat, lon = cents.get(r["block_code"], (None, None))
            if in_region(lat, lon):
                acc[(int(lat * 1000 // 1), int(lon * 1000 // 1), r["m"][:7])] += int(r["n"])
        run["rows"] = _write(conn, "somerville", sid, first_month, acc)
    return run["rows"]


def _som_grouped(first_month: str) -> list[dict]:
    """Server-side GROUP BY block x month (SoQL); paged with $order on the group keys."""
    headers = {"X-App-Token": os.environ["SOCRATA_APP_TOKEN"]} if os.environ.get("SOCRATA_APP_TOKEN") else None
    out, offset = [], 0
    while True:
        page = _get_json(f"https://{SOM_DOMAIN}/resource/{SOM_DATASET}.json", {
            "$select": "block_code, date_trunc_ym(date_created) as m, count(*) as n",
            "$where": f"date_created >= '{first_month}-01T00:00:00' and block_code is not null",
            "$group": "block_code, m", "$order": "block_code, m", "$limit": 50000, "$offset": offset,
        }, headers)
        out.extend(page)
        if len(page) < 50000:
            return out
        offset += 50000


def run(conn: psycopg.Connection, since: str | None = None) -> int:
    cutoff = since_cutoff(since)
    first_month = START[:7] if cutoff is None else (cutoff.replace(day=1) - timedelta(days=1)).strftime("%Y-%m")
    return _cambridge(conn, first_month) + _somerville(conn, first_month)
