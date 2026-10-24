"""Boston 311: yearly tables 2023-2026 (rodent + drivers) and the new-system table (trash types).

Public rows go to `incidents` (block-level address, scrubbed note); full address and the raw
note go to `private.incident_details`. All-type volume per ~100 m bin per month goes to
`report_volume` (the reporting-propensity control).
"""
from __future__ import annotations

from datetime import date

import psycopg

from .. import db
from .common import (
    address_block, address_key, ckan_paged, ckan_sql, clean_note, in_region, parse_local_ts, scrub_note,
    since_cutoff, to_float, type_map, upsert_generic, upsert_incidents, upsert_private_details, zip5,
)

YEARLY = {
    2023: "e6013a93-1321-4f2a-bf91-8d8a02f1e62f",
    2024: "dff4d804-5031-443a-8409-8344efd0e5c8",
    2025: "9d7c2214-4709-478a-a2e8-fb2020a5bb94",
    2026: "1a0b420d-99f1-4887-9851-990b2a5a6e17",
}
NEW_SYSTEM = "254adca6-64ab-4c5c-9fc0-a6da622be185"
PAGE_URL = "https://data.boston.gov/dataset/311-service-requests"
CITY_HALL = (42.3594, -71.0587)  # 311 default location; drop rows that sit exactly on it


def _placeholder(lat: float, lon: float) -> bool:
    return abs(lat - CITY_HALL[0]) < 2e-4 and abs(lon - CITY_HALL[1]) < 2e-4


def _sql_list(values) -> str:
    return ", ".join("'" + v.replace("'", "''") + "'" for v in values)


def _yearly(conn: psycopg.Connection, year: int, table: str, tmap: dict[str, str], cutoff) -> tuple[int, object]:
    sid = f"boston-311-{year}"
    db.upsert_source(conn, sid, f"Boston 311 service requests {year}", PAGE_URL, f"resource {table}")
    where = f"type IN ({_sql_list(tmap)})"
    if cutoff:
        where += f" AND open_dt >= '{cutoff.strftime('%Y-%m-%d')}'"
    cols = ("case_enquiry_id, open_dt, closed_dt, case_status, closure_reason, type, location, "
            "location_street_name, location_zipcode, neighborhood, latitude, longitude")
    total, newest = 0, None
    with db.ingest_run(conn, sid) as run:
        for page in ckan_paged(table, cols, where):
            rows, private = [], []
            for r in page:
                lat, lon = to_float(r["latitude"]), to_float(r["longitude"])
                if not in_region(lat, lon) or _placeholder(lat, lon):
                    lat = lon = None
                opened = parse_local_ts(r["open_dt"])
                if opened is None:
                    continue
                z = zip5(r["location_zipcode"])
                note_raw = clean_note(r["closure_reason"])
                iid = f"311:{r['case_enquiry_id']}"
                rows.append((
                    iid, sid, tmap[r["type"]], r["type"],
                    "closed" if (r["case_status"] or "").lower() == "closed" else "open",
                    opened, parse_local_ts(r["closed_dt"]),
                    address_block(r["location_street_name"], z), address_key(r["location"]),
                    z, r["neighborhood"] or None, scrub_note(note_raw), lat, lon, "boston", "point",
                ))
                private.append((iid, r["location"], note_raw, sid))
                newest = max(newest, opened) if newest else opened
            total += upsert_incidents(conn, rows)
            upsert_private_details(conn, private)
            conn.commit()
        run["rows"], run["newest"] = total, newest
    return total, newest


def _new_system(conn: psycopg.Connection, tmap: dict[str, str], cutoff) -> int:
    sid = "boston-311-new"
    db.upsert_source(conn, sid, "Boston 311 service requests (new system, Aug 2025–)", PAGE_URL, f"resource {NEW_SYSTEM}")
    where = f"service_name IN ({_sql_list(tmap)})"
    if cutoff:
        where += f" AND open_date >= '{cutoff.strftime('%Y-%m-%d')}'"
    cols = ("case_id, open_date, close_date, case_status, closure_reason, closure_comments, service_name, "
            "full_address, street_number, street_name, zip_code, neighborhood, latitude, longitude")
    total = 0
    with db.ingest_run(conn, sid) as run:
        for page in ckan_paged(NEW_SYSTEM, cols, where):
            rows, private = [], []
            for r in page:
                lat, lon = to_float(r["latitude"]), to_float(r["longitude"])
                if not in_region(lat, lon) or _placeholder(lat, lon):
                    lat = lon = None
                opened = parse_local_ts(r["open_date"])
                if opened is None:
                    continue
                z = zip5(r["zip_code"])
                note_raw = clean_note(" ".join(x for x in (r["closure_reason"], r["closure_comments"]) if x and x != "None"))
                iid = f"311n:{r['case_id']}"
                rows.append((
                    iid, sid, tmap[r["service_name"]], r["service_name"],
                    "closed" if (r["case_status"] or "").lower() == "closed" else "open",
                    opened, parse_local_ts(r["close_date"]),
                    address_block(r["street_name"], z), address_key(r["full_address"]),
                    z, r["neighborhood"] or None, scrub_note(note_raw), lat, lon, "boston", "point",
                ))
                private.append((iid, r["full_address"], note_raw, sid))
            total += upsert_incidents(conn, rows)
            upsert_private_details(conn, private)
            conn.commit()
        run["rows"] = total
    return total


def _volume(conn: psycopg.Connection, years: list[int]) -> int:
    """All-type 311 counts per ~100 m bin per month (reporting-propensity control).

    Recomputes every month from min(years) on, summing the yearly tables and the new system,
    then replaces those months, so re-running a refresh never double counts.
    """
    first_month = f"{min(years)}-01"
    specs = [(YEARLY[y], "open_dt") for y in years] + [(NEW_SYSTEM, "open_date")]
    acc: dict[tuple[int, int, str], int] = {}
    for table, col in specs:
        recs = ckan_sql(
            f'SELECT floor(latitude::numeric*1000) a, floor(longitude::numeric*1000) b, left({col}::text,7) m, count(*) n '
            f'FROM "{table}" WHERE latitude IS NOT NULL GROUP BY 1,2,3'
        )
        for r in recs:
            if r["a"] is None or not r["m"] or r["m"] < first_month:
                continue
            a, b = int(float(r["a"])), int(float(r["b"]))
            if 42220 <= a <= 42420 and -71200 <= b <= -70980:
                acc[(a, b, r["m"])] = acc.get((a, b, r["m"]), 0) + int(r["n"])
    sid = "boston-311-volume"
    db.upsert_source(conn, sid, "Boston 311 all-type volume per ~100 m bin per month", PAGE_URL,
                     "derived from the yearly tables and the new-system table")
    conn.execute("delete from report_volume where city = 'boston' and month >= %s", (date.fromisoformat(first_month + "-01"),))
    with conn.cursor().copy("COPY report_volume (city, lat_bin, lon_bin, month, n_all, source_id) FROM STDIN") as cp:
        for (a, b, m), n in acc.items():
            cp.write_row(("boston", a, b, date.fromisoformat(m + "-01"), n, sid))
    conn.commit()
    return len(acc)


def run(conn: psycopg.Connection, since: str | None = None) -> int:
    tmap = type_map("311")
    cutoff = since_cutoff(since)
    years = sorted(YEARLY) if cutoff is None else [y for y in YEARLY if y >= cutoff.year]
    total = 0
    for y in years:
        n, _ = _yearly(conn, y, YEARLY[y], tmap, cutoff)
        total += n
    total += _new_system(conn, tmap, cutoff)
    _volume(conn, years)
    return total
