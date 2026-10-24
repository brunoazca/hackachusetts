"""Boston code enforcement tickets (trash storage, overfilling, weeds, dumping, dumpster permits).

Two outputs, to stay inside the DB size budget:
- `signal_volume`: every 2023+ ticket counted per category per ~100 m bin per month (GROUP BY in CKAN,
  no rows downloaded).
- `incidents`: individual tickets for the last ROW_MONTHS months only (map display, inspector card).

One source row per ticket x violation code; a ticket can carry several codes. The dataset has a
single date, `status_dttm`, used as opened_at (it is the ticket date for open tickets; no separate
issue or close date is published, so closed_at stays null). Void tickets are dropped. The owner
contact address is never read, and no private details are kept: the street block is enough.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

import psycopg

from .. import db
from .common import (
    address_block, ckan_paged, ckan_sql_all, in_region, parse_local_ts, since_cutoff, to_float, type_map,
    upsert_incidents, zip5,
)

RESOURCE = "90ed3816-5e70-443c-803d-9a71f44470be"
PAGE_URL = "https://data.boston.gov/dataset/public-works-violations"
AGG_START = "2023-01-01"
ROW_MONTHS = 6


def _sql_list(values) -> str:
    return ", ".join("'" + v.replace("'", "''") + "'" for v in values)


def _base_where(tmap: dict[str, str], start: str) -> str:
    return f"description IN ({_sql_list(tmap)}) AND status <> 'Void' AND status_dttm >= '{start}'"


def _months(first: str, last: str) -> list[str]:
    y, m = map(int, first.split("-"))
    out = []
    while f"{y:04d}-{m:02d}" <= last:
        out.append(f"{y:04d}-{m:02d}")
        y, m = (y + 1, 1) if m == 12 else (y, m + 1)
    return out


def _volume(conn: psycopg.Connection, tmap: dict[str, str], sid: str, first_month: str) -> int:
    """Recompute signal_volume from first_month ('YYYY-MM') on, replacing those months.

    One CKAN GROUP BY per month (paged by ckan_sql_all past the 32k-row response cap)."""
    acc: dict[tuple[str, int, int, str], int] = {}
    months = _months(first_month, datetime.now(timezone.utc).strftime("%Y-%m"))
    for i, m in enumerate(months):
        nxt = months[i + 1] + "-01" if i + 1 < len(months) else "9999-01-01"
        recs = ckan_sql_all(
            f"SELECT description d, floor(latitude::numeric*1000) a, floor(longitude::numeric*1000) b, count(*) n "
            f"FROM \"{RESOURCE}\" WHERE {_base_where(tmap, m + '-01')} AND status_dttm < '{nxt}' "
            f"AND latitude IS NOT NULL GROUP BY 1,2,3", order_by="1,2,3",
        )
        for r in recs:
            if r["a"] is None:
                continue
            a, b = int(float(r["a"])), int(float(r["b"]))
            if 42220 <= a <= 42420 and -71200 <= b <= -70980:
                k = (tmap[r["d"]], a, b, m)
                acc[k] = acc.get(k, 0) + int(r["n"])
    conn.execute("delete from signal_volume where source_id = %s and month >= %s",
                 (sid, date.fromisoformat(first_month + "-01")))
    with conn.cursor().copy("COPY signal_volume (city, category, lat_bin, lon_bin, month, n, source_id) FROM STDIN") as cp:
        for (cat, a, b, m), n in acc.items():
            cp.write_row(("boston", cat, a, b, date.fromisoformat(m + "-01"), n, sid))
    conn.commit()
    return len(acc)


def _rows(conn: psycopg.Connection, tmap: dict[str, str], sid: str, start: datetime) -> tuple[int, object]:
    cols = ("ticket_no, code, status_dttm, status, description, violation_street, violation_suffix, "
            "violation_city, violation_zip, latitude, longitude")
    seen: set[str] = set()
    total, newest = 0, None
    for page in ckan_paged(RESOURCE, cols, _base_where(tmap, start.strftime("%Y-%m-%d"))):
        rows = []
        for r in page:
            iid = f"ce:{r['ticket_no']}:{r['code']}"
            opened = parse_local_ts(r["status_dttm"])
            if iid in seen or opened is None:  # the source repeats some ticket x code rows verbatim
                continue
            seen.add(iid)
            lat, lon = to_float(r["latitude"]), to_float(r["longitude"])
            if not in_region(lat, lon):
                lat = lon = None
            street = " ".join(x for x in (r["violation_street"], r["violation_suffix"]) if x and x != "None").title() or None
            z = zip5(r["violation_zip"])
            hood = (r["violation_city"] or "").title() or None
            rows.append((
                iid, sid, tmap[r["description"]], r["description"],
                "closed" if r["status"] == "Closed" else "open", opened, None,
                address_block(street, z), None, z, hood, None, lat, lon, "boston", "point",
            ))
            newest = max(newest, opened) if newest else opened
        total += upsert_incidents(conn, rows)
        conn.commit()
    return total, newest


def run(conn: psycopg.Connection, since: str | None = None) -> int:
    tmap = type_map("code-enforcement")
    cutoff = since_cutoff(since)
    sid = "boston-code-enforcement"
    db.upsert_source(conn, sid, "Boston code enforcement violations (trash, weeds, dumping)", PAGE_URL,
                     f"resource {RESOURCE}; date is status_dttm; 2023+ aggregated in signal_volume, "
                     f"last {ROW_MONTHS} months as incidents")
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(days=round(ROW_MONTHS * 30.44))
    if cutoff:  # refresh: current + previous month of counts, rows for the window
        first_month = (now.replace(day=1) - timedelta(days=1)).strftime("%Y-%m")
        row_start = max(cutoff, window_start)
    else:
        first_month, row_start = AGG_START[:7], window_start
    with db.ingest_run(conn, sid) as run_:
        _volume(conn, tmap, sid, first_month)
        total, newest = _rows(conn, tmap, sid, row_start)
        # keep the incidents table to a rolling window
        conn.execute("delete from incidents where source_id = %s and opened_at < %s", (sid, window_start))
        conn.commit()
        run_["rows"], run_["newest"] = total, newest
    return total
