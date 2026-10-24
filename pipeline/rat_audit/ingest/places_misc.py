"""Static Boston places: Big Belly bins, city-owned lots, public schools, colleges -> `places`.

None of these have dates, so `since` is ignored (each load replaces its own kind).
House numbers are stripped from every public address (Big Belly descriptions included).
"""
from __future__ import annotations

import re

import psycopg

from .. import db
from .common import address_block, ckan_paged, in_region, jsonb, street_only, to_float, upsert_generic, zip5
from .parcels import _centroid

BIGBELLY = "15e7fa44-b9a8-42da-82e1-304e43460095"
CITY_LOTS = "93481af5-81ed-4850-a637-baf6e83eed43"
SCHOOLS = "6ceeff38-a0db-46df-b5be-f8cfdea0186d"
COLLEGES = "f59456d7-4b3d-407d-9fcd-4a6ae473afcb"
COLS = ["id", "source_id", "kind", "name", "address_block", "starts_at", "ends_at", "attrs", "lat", "lon", "city"]

_LOC = re.compile(r"\(?\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)")
_PAIR = re.compile(r"(-7[01]\.\d+)\s+(4[12]\.\d+)")
_ZIP = re.compile(r"\b(02\d{3})\b")


def _pt(lat, lon) -> tuple[float | None, float | None]:
    lat, lon = to_float(lat), to_float(lon)
    return (lat, lon) if in_region(lat, lon) else (None, None)


def _wkt_centroid(wkt: str | None) -> tuple[float | None, float | None]:
    """Centroid of the first polygon ring of a (MULTI)POLYGON WKT."""
    first = (wkt or "").split(")")[0]
    ring = [[float(x), float(y)] for x, y in _PAIR.findall(first)]
    p = _centroid([ring]) if len(ring) >= 3 else None
    return _pt(*p) if p else (None, None)


def _load(conn: psycopg.Connection, sid: str, name: str, url: str, table: str, kind: str, rows: list[tuple]) -> int:
    db.upsert_source(conn, sid, name, url, f"resource {table}")
    conn.commit()
    with db.ingest_run(conn, sid) as run_:
        conn.execute("delete from places where kind = %s and source_id = %s", (kind, sid))
        upsert_generic(conn, "places", COLS, rows)
        conn.commit()
        run_["rows"] = len(rows)
    print(f"{kind}: {len(rows)} rows, {sum(1 for r in rows if r[8] is not None)} located")
    return len(rows)


def _bigbelly(conn) -> int:
    rows = {}
    for page in ckan_paged(BIGBELLY, '_id, description, "Location"', "TRUE"):
        for r in page:
            m = _LOC.match(r["Location"] or "")
            lat, lon = _pt(m.group(1), m.group(2)) if m else (None, None)
            desc = re.sub(r"\s*\(.*?\)\s*", " ", r["description"] or "").strip()
            pid = f"bigbelly:{lat:.5f},{lon:.5f}" if lat is not None else f"bigbelly:{r['_id']}"
            rows[pid] = (pid, "boston-bigbelly", "bigbelly", "Big Belly sealed bin", street_only(desc) or None,
                         None, None, jsonb({}), lat, lon, "boston")
    return _load(conn, "boston-bigbelly", "Boston Big Belly solar compacting bins",
                 "https://data.boston.gov/dataset/big-belly-locations", BIGBELLY, "bigbelly", list(rows.values()))


def _city_lots(conn) -> int:
    rows = {}
    for page in ckan_paged(CITY_LOTS, '"PARCELID", "STREETNAME", the_geom', "TRUE", page=2000):
        for r in page:
            pid = r["PARCELID"]
            if not pid or pid in rows:
                continue
            lat, lon = _wkt_centroid(r["the_geom"])
            st = (r["STREETNAME"] or "").strip().title() or None
            rows[pid] = (f"citylot:{pid}", "boston-city-lots", "city_lot", "City-owned lot", st, None, None,
                         jsonb({"pid": pid}), lat, lon, "boston")
    return _load(conn, "boston-city-lots", "Boston city-owned property (lots)",
                 "https://data.boston.gov/dataset/city-of-boston-owned-property", CITY_LOTS, "city_lot", list(rows.values()))


def _schools(conn) -> int:
    rows = []
    for page in ckan_paged(SCHOOLS, '"BLDG_ID", "BLDG_NAME", "ADDRESS", "ZIPCODE", "SCH_ID", "SCH_NAME", "SCH_LABEL", "SCH_TYPE", "POINT_X", "POINT_Y"', "TRUE"):
        for r in page:
            lat, lon = _pt(r["POINT_Y"], r["POINT_X"])
            sch, bldg = str(int(to_float(r["SCH_ID"]) or 0)), str(int(to_float(r["BLDG_ID"]) or 0))
            rows.append((f"school:{sch}-{bldg}", "boston-public-schools", "school", r["SCH_LABEL"] or r["SCH_NAME"],
                         address_block(r["ADDRESS"], zip5(r["ZIPCODE"])), None, None,
                         jsonb({"school_type": r["SCH_TYPE"], "school": r["SCH_NAME"], "building": r["BLDG_NAME"]}),
                         lat, lon, "boston"))
    return _load(conn, "boston-public-schools", "Boston public schools",
                 "https://data.boston.gov/dataset/public-schools", SCHOOLS, "school", rows)


def _colleges(conn) -> int:
    rows = []
    for page in ckan_paged(COLLEGES, '"Id", "Name", "Address", "NumStudents13", "CampusHous", "Latitude", "Longitude"', "TRUE"):
        for r in page:
            lat, lon = _pt(r["Latitude"], r["Longitude"])
            street = (r["Address"] or "").split(",")[0]
            z = _ZIP.search(r["Address"] or "")
            rows.append((f"college:{r['Id']}", "boston-colleges", "college", r["Name"],
                         address_block(street, z.group(1) if z else None), None, None,
                         jsonb({"students": to_float(r["NumStudents13"]),
                                "campus_housing": (r["CampusHous"] or "").strip() or None}),
                         lat, lon, "boston"))
    return _load(conn, "boston-colleges", "Colleges and universities in Boston",
                 "https://data.boston.gov/dataset/colleges-and-universities", COLLEGES, "college", rows)


def run(conn: psycopg.Connection, since: str | None = None) -> int:  # noqa: ARG001 - static layers
    return _bigbelly(conn) + _city_lots(conn) + _schools(conn) + _colleges(conn)
