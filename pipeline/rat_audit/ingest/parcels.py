"""Boston property assessment FY2026 (+ FY2025 values) -> `parcels`; owners -> `private.parcel_owners`.

The assessment has no coordinates. Points come from, in order:
1. the FY2025 parcel polygon centroid (city GIS MapServer, keyed by GIS_ID, so condo units get their lot),
2. RentSmart property table (pid -> lat/lon, ~28k parcels),
3. SAM address points matched on house number + street + ZIP (ranges and either end of a range),
4. the condo main parcel's point for condo units (CM_ID),
5. the nearest same-parity house number on the same street + ZIP within 20 numbers.

Vacant / unusable land parcels are also written to `places` (kind vacant_parcel, id vacant:<pid>).
Public columns never hold owner names or house numbers; owner + full address go to the private table
(mail_address is left null to save space; the reveal only needs owner + full_address).
"""
from __future__ import annotations

import bisect
import re

import psycopg

from .. import db
from .common import _get_json, address_block, ckan_paged, in_region, jsonb, to_float, upsert_generic, zip5

FY26 = "ee73430d-96c0-423e-ad21-c4cfb54c8961"
FY25 = "6b7e460e-33f6-4e61-80bc-1bef2e73ac54"
RENTSMART_PROPS = "f6b5aee9-8607-4ba8-ac6b-17b3ffb43084"
SAM = "fee8ee07-b8b5-4ee5-b540-5162590ba5c1"
PARCEL_GIS = "https://gisportal.boston.gov/arcgis/rest/services/Parcels/Parcels25/MapServer/0"
PAGE_URL = "https://data.boston.gov/dataset/property-assessment"
SAM_URL = "https://data.boston.gov/dataset/live-street-address-management-sam-addresses"

# Land with no building: rat harborage candidates. Parking lots and ancillary/underwater land excluded.
VACANT_DESC = {
    "RES LAND (Unusable)", "RESIDENTIAL LAND", "RES LAND (Secondary)", "COMMERCIAL LAND",
    "COM LAND (Unusable)", "COM LAND (Secondary)", "INDUSTRIAL LAND", "IND LAND (SECONDARY)", "IND LAND (UNUSABLE)",
}
UNITS_BY_LU = {"R1": 1, "R2": 2, "R3": 3, "CD": 1}

_WS = re.compile(r"\s+")
_UNIT = re.compile(r"\s+(?:#|UNIT\b|APT\b|STE\b|SUITE\b|COMM\.? UNIT).*$")
_NUM = re.compile(r"^(\d+)([A-Z]?)(?:-(\d+)[A-Z]?)?\s+(.+)$")


_UNIT_TOKEN = re.compile(r"^(?:\d+[A-Z]?|[A-Z]|[A-Z]?\d+[A-Z]?|PH\d*|\d+-\d+)$")
# SAM spells suffixes out (AVE, TER, PLZ); the assessment abbreviates (AV, TE, PZ).
_SUFFIX = {"AVE": "AV", "AVENUE": "AV", "TER": "TE", "TERRACE": "TE", "PARK": "PK", "WAY": "WY", "CIR": "CI",
           "CIRCLE": "CI", "PKWY": "PW", "PARKWAY": "PW", "HWY": "HW", "HIGHWAY": "HW", "LN": "LA", "LANE": "LA",
           "PLZ": "PZ", "PLAZA": "PZ", "BOULEVARD": "BLVD", "BL": "BLVD", "WHARF": "WH", "WHF": "WH", "RO": "ROW",
           "STREET": "ST", "ROAD": "RD", "PLACE": "PL", "COURT": "CT", "DRIVE": "DR", "SQUARE": "SQ", "CIRCUIT": "CC",
           "EXT": "XT"}


def _street(s: str | None) -> str:
    return _WS.sub(" ", (s or "").upper()).strip()


def _canon_street(s: str) -> str:
    """Drop trailing unit tokens ('HIGHLAND ST 3') and normalise the suffix."""
    toks = s.split(" ")
    while len(toks) > 1 and _UNIT_TOKEN.match(toks[-1]):
        toks.pop()
    toks[-1] = _SUFFIX.get(toks[-1], toks[-1])
    return " ".join(toks)


def _street_title(s: str | None) -> str | None:
    s = _WS.sub(" ", s or "").strip()
    return s.title() if s else None


def _num(v) -> float | None:
    if v in (None, "", "None"):
        return None
    return to_float(str(v).replace(",", "").replace("$", "").strip())


def _int(v) -> int | None:
    f = _num(v)
    return int(f) if f is not None else None


def _sam_index() -> tuple[dict, dict]:
    """exact[(num, street, zip)] -> (lat, lon); by_street[(street, zip)] -> sorted [(num, lat, lon)]."""
    exact: dict[tuple, tuple] = {}
    by_street: dict[tuple, list] = {}
    for page in ckan_paged(SAM, "full_address, zip_code, x_coord, y_coord", "y_coord <> ''"):
        for r in page:
            lat, lon = to_float(r["y_coord"]), to_float(r["x_coord"])
            if not in_region(lat, lon):
                continue
            m = _NUM.match(_UNIT.sub("", _street(r["full_address"])))
            if not m:
                continue
            lo, alpha, hi, st = m.groups()
            st = _canon_street(st)
            z = zip5(r["zip_code"])
            pt = (lat, lon)
            for k in {lo + alpha, lo, f"{lo}-{hi}" if hi else lo, hi or lo}:
                exact.setdefault((k, st, z), pt)
            by_street.setdefault((st, z), []).append((int(lo), lat, lon))
    for v in by_street.values():
        v.sort()
    return exact, by_street


def _centroid(rings: list) -> tuple | None:
    """Area-weighted centroid of the largest ring (shoelace)."""
    ring = max(rings, key=len) if rings else None
    if not ring or len(ring) < 3:
        return None
    a = cx = cy = 0.0
    for (x0, y0), (x1, y1) in zip(ring, ring[1:] + ring[:1]):
        c = x0 * y1 - x1 * y0
        a += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c
    if abs(a) < 1e-14:
        return sum(p[1] for p in ring) / len(ring), sum(p[0] for p in ring) / len(ring)
    return cy / (3 * a), cx / (3 * a)


def _polygon_points() -> dict[str, tuple]:
    out: dict[str, tuple] = {}
    offset = 0
    while True:
        d = _get_json(f"{PARCEL_GIS}/query", {
            "where": "1=1", "outFields": "MAP_PAR_ID", "returnGeometry": "true", "outSR": 4326,
            "geometryPrecision": 6, "maxAllowableOffset": 0.00003, "orderByFields": "OBJECTID",
            "resultOffset": offset, "resultRecordCount": 2000, "f": "json"})
        feats = d.get("features") or []
        for f in feats:
            pid = (f.get("attributes") or {}).get("MAP_PAR_ID")
            p = _centroid((f.get("geometry") or {}).get("rings") or [])
            if pid and p and in_region(*p):
                out.setdefault(pid, p)
        if not feats or not d.get("exceededTransferLimit"):
            return out
        offset += len(feats)


def _rentsmart_points() -> dict[str, tuple]:
    out: dict[str, tuple] = {}
    for page in ckan_paged(RENTSMART_PROPS, "rs_prop_pid, rs_prop_lat, rs_prop_long", "rs_prop_lat <> ''"):
        for r in page:
            lat, lon = to_float(r["rs_prop_lat"]), to_float(r["rs_prop_long"])
            if r["rs_prop_pid"] and in_region(lat, lon):
                out.setdefault(r["rs_prop_pid"], (lat, lon))
    return out


def _nearest(by_street: dict, st: str, z: str | None, n: int) -> tuple | None:
    pts = by_street.get((st, z))
    if not pts:
        return None
    i = bisect.bisect_left(pts, (n,))
    best = None
    for j in range(max(0, i - 25), min(len(pts), i + 25)):
        d = abs(pts[j][0] - n)
        if pts[j][0] % 2 == n % 2 and d <= 20 and (best is None or d < best[0]):
            best = (d, pts[j][1], pts[j][2])
    return best[1:] if best else None


def _same(a, b) -> bool:
    if isinstance(a, float) or isinstance(b, float):
        return a is not None and b is not None and abs(float(a) - float(b)) < 1e-7
    return a == b


def _changed(conn: psycopg.Connection, table: str, cols: list[str], rows: list[tuple]) -> list[tuple]:
    have = {r[0]: r for r in conn.execute(f"select {', '.join(cols)} from {table}").fetchall()}
    return [r for r in rows if r[0] not in have or not all(_same(a, b) for a, b in zip(r, have[r[0]]))]


def run(conn: psycopg.Connection, since: str | None = None) -> int:  # noqa: ARG001 - assessment has no dates
    sid = "boston-assessment-fy26"
    db.upsert_source(conn, sid, "Boston property assessment FY2026 (FY2025 values joined)", PAGE_URL,
                     f"resources {FY26} (FY26), {FY25} (FY25); points from parcel polygons {PARCEL_GIS}, RentSmart {RENTSMART_PROPS} and SAM {SAM}")
    db.upsert_source(conn, "boston-sam-addresses", "Boston SAM address points", SAM_URL, f"resource {SAM}")
    conn.commit()

    fy25: dict[str, float | None] = {}
    for page in ckan_paged(FY25, '"PID", "TOTAL_VALUE"', "TRUE"):
        for r in page:
            fy25[r["PID"]] = _num(r["TOTAL_VALUE"])
    rs = _rentsmart_points()
    poly = _polygon_points()
    exact, by_street = _sam_index()

    cols = ('"PID", "CM_ID", "GIS_ID", "ST_NUM", "ST_NUM2", "ST_NAME", "UNIT_NUM", "ZIP_CODE", "LU", "LU_DESC", "OWN_OCC", '
            '"OWNER", '
            '"RES_UNITS", "TOTAL_VALUE", "YR_BUILT", "CITY"')
    # Condo parking spaces (CP) are skipped: no rat signal, ~8.5k rows of DB budget.
    recs = [r for page in ckan_paged(FY26, cols, "TRUE") for r in page if r["LU"] != "CP"]

    pts: dict[str, tuple] = {}
    how = {"polygon": 0, "rentsmart": 0, "sam": 0, "condo_main": 0, "nearest": 0}
    for r in recs:  # pass 1: own point
        pid = r["PID"]
        st, z = _canon_street(_street(r["ST_NAME"])), zip5(r["ZIP_CODE"])
        if p := poly.get(pid) or poly.get(r["GIS_ID"] or ""):
            pts[pid] = p; how["polygon"] += 1
            continue
        if pid in rs:
            pts[pid] = rs[pid]; how["rentsmart"] += 1
            continue
        n1 = _street(r["ST_NUM"]).replace(" ", "")
        n2 = _street(r["ST_NUM2"]).replace(" ", "")
        for k in (f"{n1}-{n2}" if n2 else None, f"{n2}-{n1}" if n2 else None, n1, n2, re.sub(r"[A-Z]+$", "", n1)):
            if k and (p := exact.get((k, st, z))):
                pts[pid] = p; how["sam"] += 1
                break
    for r in recs:  # pass 2: condo units take their main parcel's point, then nearest number
        pid = r["PID"]
        if pid in pts:
            continue
        if r["CM_ID"] and (p := pts.get(r["CM_ID"]) or rs.get(r["CM_ID"])):
            pts[pid] = p; how["condo_main"] += 1
            continue
        m = re.match(r"\d+", _street(r["ST_NUM"]))
        if m and (p := _nearest(by_street, _canon_street(_street(r["ST_NAME"])), zip5(r["ZIP_CODE"]), int(m.group()))):
            pts[pid] = p; how["nearest"] += 1

    parcels, owners, vacant = [], [], []
    for r in recs:
        pid = r["PID"]
        z = zip5(r["ZIP_CODE"])
        block = address_block(_street_title(r["ST_NAME"]), z)
        lat, lon = pts.get(pid, (None, None))
        units = _int(r["RES_UNITS"])
        if units is None:
            units = UNITS_BY_LU.get(r["LU"])
        parcels.append((
            pid, sid, block, z, r["LU_DESC"] or r["LU"], _int(r["YR_BUILT"]) or None,
            {"Y": True, "N": False}.get((r["OWN_OCC"] or "").upper()), units,
            fy25.get(pid), _num(r["TOTAL_VALUE"]), lat, lon, "boston",
        ))
        num = "-".join(x for x in (r["ST_NUM"], r["ST_NUM2"]) if x)
        full = " ".join(x for x in (num, r["ST_NAME"], f"#{r['UNIT_NUM']}" if r["UNIT_NUM"] else None) if x)
        owners.append((pid, r["OWNER"], None, f"{full}, {r['CITY'] or 'BOSTON'} MA {z or ''}".strip(), sid))
        if r["LU_DESC"] in VACANT_DESC:
            vacant.append((
                f"vacant:{pid}", sid, "vacant_parcel", r["LU_DESC"].title(), block, None, None,
                jsonb({"pid": pid, "land_use": r["LU_DESC"], "value_fy26": _num(r["TOTAL_VALUE"]),
                         "located": pid in pts}),
                lat, lon, "boston",
            ))

    with db.ingest_run(conn, sid) as run_:
        pcols = ["pid", "source_id", "address_block", "zip", "land_use", "yr_built", "own_occ", "units",
                 "value_fy25", "value_fy26", "lat", "lon", "city"]
        ocols = ["pid", "owner", "mail_address", "full_address", "source_id"]
        # Only write rows that changed: a full rewrite doubles these tables with dead tuples (DB size cap).
        parcels_new = _changed(conn, "parcels", pcols, parcels)
        owners_new = _changed(conn, "private.parcel_owners", ocols, owners)
        for i in range(0, max(len(parcels_new), len(owners_new)), 20000):
            upsert_generic(conn, "parcels", pcols, parcels_new[i:i + 20000], key="pid")
            upsert_generic(conn, "private.parcel_owners", ocols, owners_new[i:i + 20000], key="pid", geom=False)
            conn.commit()
        print(f"parcels changed {len(parcels_new)}, owners changed {len(owners_new)}")
        conn.execute("delete from places where kind = 'vacant_parcel' and source_id = %s", (sid,))
        upsert_generic(conn, "places", ["id", "source_id", "kind", "name", "address_block", "starts_at", "ends_at",
                                        "attrs", "lat", "lon", "city"], vacant)
        run_["rows"] = len(parcels)
    located = len(pts)
    print(f"parcels {len(parcels)}, located {located} ({100 * located / max(1, len(parcels)):.1f}%) {how}; "
          f"vacant {len(vacant)} ({sum(1 for v in vacant if v[8] is not None)} located)")
    return len(parcels) + len(vacant)

