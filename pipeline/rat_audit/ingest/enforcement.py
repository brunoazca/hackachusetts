"""Boston code enforcement tickets (trash storage, overfilling, weeds, dumping, dumpster permits), 2025 on (see START).

One source row per ticket x violation code; a ticket can carry several codes. The dataset has a
single date, `status_dttm`, used as opened_at (it is the ticket date for open tickets; no separate
issue or close date is published, so closed_at stays null). Void tickets are dropped. The owner
contact address is never read; the violation address goes to `private.incident_details`.
"""
from __future__ import annotations

import psycopg

from .. import db
from .common import (
    address_block, address_key, ckan_paged, in_region, parse_local_ts, since_cutoff, to_float, type_map,
    upsert_incidents, upsert_private_details, zip5,
)

RESOURCE = "90ed3816-5e70-443c-803d-9a71f44470be"
PAGE_URL = "https://data.boston.gov/dataset/public-works-violations"
START = "2025-01-01"  # 2023+ is ~245k rows; widened only once the DB has disk headroom


def _sql_list(values) -> str:
    return ", ".join("'" + v.replace("'", "''") + "'" for v in values)


def run(conn: psycopg.Connection, since: str | None = None) -> int:
    tmap = type_map("code-enforcement")
    cutoff = since_cutoff(since)
    sid = "boston-code-enforcement"
    db.upsert_source(conn, sid, "Boston code enforcement violations (trash, weeds, dumping)", PAGE_URL,
                     f"resource {RESOURCE}; date is status_dttm")
    where = (f"description IN ({_sql_list(tmap)}) AND status <> 'Void' "
             f"AND status_dttm >= '{cutoff.strftime('%Y-%m-%d') if cutoff else START}'")
    cols = ("ticket_no, code, status_dttm, status, description, violation_stno, violation_sthigh, "
            "violation_street, violation_suffix, violation_city, violation_zip, latitude, longitude")
    seen: set[str] = set()
    total, newest = 0, None
    with db.ingest_run(conn, sid) as run_:
        for page in ckan_paged(RESOURCE, cols, where):
            rows, private = [], []
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
                number = "-".join(x for x in (r["violation_stno"], r["violation_sthigh"]) if x and x != "None")
                z = zip5(r["violation_zip"])
                hood = (r["violation_city"] or "").title() or None
                full = ", ".join(x for x in (f"{number} {street}".strip() if street else None, hood, f"MA {z}" if z else None) if x) or None
                rows.append((
                    iid, sid, tmap[r["description"]], r["description"],
                    "closed" if r["status"] == "Closed" else "open", opened, None,
                    address_block(street, z), address_key(full), z, hood, None, lat, lon, "boston", "point",
                ))
                private.append((iid, full, None, sid))
                newest = max(newest, opened) if newest else opened
            total += upsert_incidents(conn, rows)
            upsert_private_details(conn, private)
            conn.commit()
        run_["rows"], run_["newest"] = total, newest
    return total
