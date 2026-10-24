"""Boston 311 yearly tables 2016-2022 into `incidents_archive` (model history, no address or note).

Same type map, region and City Hall placeholder filters as t311. Closed years: static, loaded once.
Rows without a usable point are dropped (the model only uses located rows).
"""
from __future__ import annotations

import psycopg

from .. import db
from .common import ckan_paged, in_region, parse_local_ts, to_float, type_map
from .t311 import PAGE_URL, _placeholder, _sql_list

YEARLY = {
    2016: "b7ea6b1b-3ca4-4c5b-9713-6dc1db52379a",
    2017: "30022137-709d-465e-baae-ca155b51927d",
    2018: "2be28d90-3a90-4af1-a3f6-f28c1e25880a",
    2019: "ea2e4696-4a2d-429c-9807-d02eb92e0222",
    2020: "6ff6a6fd-3141-4440-a880-6f60a37fe789",
    2021: "f53ebccd-bc61-49f9-83db-625f209c95f5",
    2022: "81a7b022-f8fc-4da5-80e4-b160058ca207",
}


def _year(conn: psycopg.Connection, year: int, table: str, tmap: dict[str, str]) -> int:
    sid = f"boston-311-{year}"
    db.upsert_source(conn, sid, f"Boston 311 service requests {year}", PAGE_URL, f"resource {table}; model history only")
    total = 0
    with db.ingest_run(conn, sid) as run:
        conn.execute("delete from incidents_archive where source_id = %s", (sid,))
        with conn.cursor().copy(
            "COPY incidents_archive (id, source_id, city, category, opened_at, lon, lat) FROM STDIN"
        ) as cp:
            seen: set[str] = set()
            for page in ckan_paged(table, "case_enquiry_id, type, open_dt, latitude, longitude",
                                   f"type IN ({_sql_list(tmap)})"):
                for r in page:
                    lat, lon = to_float(r["latitude"]), to_float(r["longitude"])
                    opened = parse_local_ts(r["open_dt"])
                    iid = f"311:{r['case_enquiry_id']}"
                    if lat is None or not in_region(lat, lon) or _placeholder(lat, lon) or opened is None or iid in seen:
                        continue
                    seen.add(iid)
                    cp.write_row((iid, sid, "boston", tmap[r["type"]], opened, lon, lat))
                    total += 1
        conn.commit()
        run["rows"] = total
    return total


def run(conn: psycopg.Connection, since: str | None = None) -> int:
    if since:  # closed years: nothing to refresh
        return 0
    tmap = type_map("311")
    return sum(_year(conn, y, t, tmap) for y, t in YEARLY.items())
