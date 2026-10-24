"""Cambridge equivalents of the Boston-only layers (all on data.cambridgema.gov).

- Sanitary Inspections (ryb9-qzmw): food establishments with pest-code or rodent-sign violations 2024-> ->
  `places` kind restaurant, same attrs shape as food.py. The portal has no license number, so one place per
  business name + address (id camfood:<hash>).
- Housing Code Violations (f8su-kv88): 410.550 pest violations ("Extermination of Insects, Rodents and Skunks" /
  "Elimination of Pests") 2023-> -> incidents category pest, one per inspection case (id camhcv:<case>).
- Property Database (eey2-rv59): FY2026 per PID (FY2025 value joined) -> `parcels` (pid cam:<PID>); owners ->
  `private.parcel_owners`; vacant/undevelopable land -> places kind vacant_parcel. Half the FY2026 rows have no
  coordinates: those take the same PID's FY2025 point, then the parcel polygon centroid (c392-hjk3, by GIS ID).
- Demolition Permits (kcfi-ackv) and New Construction permits (9qm7-wbdc) 2023-> -> places demolition / excavation
  (display only, like permits.py). Applicant, licensee and architect names are never read.
- Public school locations (9xx9-tt7e) -> places kind school.

Construction complaints come from regional._cambridge_evidence (categories.json maps "Construction Complaint").
With `since` (daily cron) the static layers (parcels, schools) are skipped; the daily ones are small and reload fully.
"""
from __future__ import annotations

import hashlib
import re

import psycopg

from .. import db
from .common import (
    address_block, address_key, in_region, jsonb, parse_local_ts, socrata_paged, street_only, to_float,
    upsert_generic, upsert_incidents, upsert_private_details, zip5,
)
from .parcels import _centroid, _changed
from .regional import _HOUSE_NO, _HOUSE_NO_AT, _cam_address, scrub_text

DOMAIN = "data.cambridgema.gov"
SANITARY, HOUSING, PROPERTY, PARCEL_POLY = "ryb9-qzmw", "f8su-kv88", "eey2-rv59", "c392-hjk3"
DEMOLITION, NEW_CONSTRUCTION, SCHOOLS = "kcfi-ackv", "9qm7-wbdc", "9xx9-tt7e"
PLACE_COLS = ["id", "source_id", "kind", "name", "address_block", "starts_at", "ends_at", "attrs", "lat", "lon", "city"]
PERMIT_NOTE = "Display only: no measurable effect on rodent reports in validation; not a model feature."


def _url(dataset: str) -> str:
    return f"https://{DOMAIN}/d/{dataset}"


def _pt(lat, lon) -> tuple[float | None, float | None]:
    lat, lon = to_float(lat), to_float(lon)
    return (lat, lon) if in_region(lat, lon) else (None, None)


# Leading house-number tokens: '44.5-46', '1/2', '0REAR', '5-A', '11-1/2' (ordinals like '5th' are street names).
_LEAD_NO = re.compile(r"^(?:(?!\d+(?:st|nd|rd|th)\b)\S*\d\S*\s+|rear\s+)+", re.I)


def _street(street_with_number: str | None) -> str | None:
    s = _LEAD_NO.sub("", " ".join((street_with_number or "").split()))
    return street_only(s) if s else None


def _block(full: str | None) -> tuple[str | None, str | None, str | None]:
    """'847 Cambridge St, Unit 2, Cambridge, MA 02141' -> (full, 'Cambridge St, 02141', '02141').

    These portals use 'street, [unit,] city, state zip', so the street is the part before the first comma
    (regional._cam_address cuts at the first ' Cambridge', which eats 'Cambridge St')."""
    full = (full or "").strip()
    if "," not in full:
        full, street, z = _cam_address(full)
        return full, address_block(_street(street), z), z
    zips = re.findall(r"(?<![\d.])\d{5}(?![\d.])", full)
    z = zip5(zips[-1]) if zips else None
    return full, address_block(_street(full.split(",", 1)[0]), z), z


_HTML = re.compile(r"<[^>]*>|<[^>]*$")
_WITH_NAME = re.compile(r"\b(with|by|from|to)\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b")


def _scrub_comment(s: str | None) -> str | None:
    """Inspector comments: drop pasted HTML, staff names ('Revisited with Dave Power'), then the usual scrub."""
    if not s:
        return None
    s = _HTML.sub(" ", s)
    s = _WITH_NAME.sub(lambda m: m.group(1) + " [staff]", s)
    return scrub_text(s)


# ---------- food establishments (sanitary inspections) ----------

FOOD_START = "2024-01-01"
_RODENT_LIKE = " or ".join(f"upper(inpector_comments) like '%{w}%'"
                           for w in ("RODENT", "MICE", "MOUSE", " RAT", "DROPPING"))
_EXPLICIT = re.compile(r"\b(rodents?|mice|mouse|rats?|droppings?|gnaw\w*)\b", re.I)
MAX_VIOLATIONS = 20


def _food(conn: psycopg.Connection) -> int:
    sid = "cambridge-food-inspections"
    db.upsert_source(conn, sid, "Cambridge sanitary inspections (pest / rodent violations, 2024–)", _url(SANITARY),
                     "code 6-501.111 Controlling Pests or comments naming rodents; one place per business + address")
    conn.commit()
    where = f"case_open_date >= '{FOOD_START}' and (code_description like '%Pest%' or {_RODENT_LIKE})"
    biz: dict[str, dict] = {}
    for page in socrata_paged(DOMAIN, SANITARY, where,
                              "id,business_name,full_address,code_number,code_description,case_open_date,status,"
                              "inpector_comments,latitude,longitude"):
        for r in page:
            when = parse_local_ts(r.get("case_open_date"))
            # Building-level inspections are named by address ('1105 Massachusetts Ave - Retail Shared Trash Room').
            name = _HOUSE_NO_AT.sub(lambda m: m.group(1) + " ", _HOUSE_NO.sub("", " ".join((r.get("business_name") or "").split())))
            if when is None or not name:
                continue
            full, block, _ = _block(r.get("full_address"))
            key = hashlib.sha1(f"{name.upper()}|{(full or '').upper()}".encode()).hexdigest()[:12]
            b = biz.setdefault(key, {"rows": {}, "name": name, "block": block, "loc": _pt(r.get("latitude"), r.get("longitude"))})
            if b["loc"][0] is None:
                b["loc"] = _pt(r.get("latitude"), r.get("longitude"))
            comment = r.get("inpector_comments")
            b["rows"][(when.date(), r.get("code_number"))] = {
                "date": when.date().isoformat(), "at": when, "case": r.get("id"),
                "desc": (r.get("code_description") or "").strip() or None,
                "comment": _scrub_comment(comment), "result": None, "status": r.get("status"),
                "explicit": bool(_EXPLICIT.search(comment or "")),
            }
    rows, newest = [], None
    for key, b in biz.items():
        vs = sorted(b["rows"].values(), key=lambda v: v["at"])
        first, last = vs[0]["at"], vs[-1]["at"]
        newest = max(newest, last) if newest else last
        attrs = {
            "license": None, "business_type": "Food establishment",
            "n_rodent_violations": len(vs), "n_explicit": sum(v["explicit"] for v in vs),
            "last_result": vs[-1]["status"], "last_citation": last.date().isoformat(),
            "rodent_violations": [{k: v[k] for k in ("date", "desc", "comment", "result", "status", "explicit")}
                                  for v in vs[-MAX_VIOLATIONS:]],
        }
        rows.append((f"camfood:{key}", sid, "restaurant", b["name"], b["block"], first, None, jsonb(attrs),
                     *b["loc"], "cambridge"))
    with db.ingest_run(conn, sid) as run_:
        conn.execute("delete from places where source_id = %s", (sid,))
        upsert_generic(conn, "places", PLACE_COLS, rows)
        conn.commit()
        run_["rows"], run_["newest"] = len(rows), newest
    print(f"cambridge food: {len(rows)} businesses, {sum(1 for r in rows if r[8] is not None)} located")
    return len(rows)


# ---------- housing code violations: indoor pests ----------

HCV_START = "2023-01-01"
_PEST = re.compile(r"rodent|\brats?\b|mice|mouse|insect|pest|infest|extermin|roach|bed ?bug", re.I)


def _housing(conn: psycopg.Connection) -> int:
    sid = "cambridge-housing-violations"
    db.upsert_source(conn, sid, "Cambridge housing code violations (pest / extermination, 2023–)", _url(HOUSING),
                     "code 410.550 and other pest-worded violations; one incident per inspection case")
    conn.commit()
    cases: dict[str, dict] = {}
    for page in socrata_paged(DOMAIN, HOUSING, f"case_open_date >= '{HCV_START}'",
                              "id,full_address,code,description,status,issue_date,case_open_date,latitude,longitude"):
        for r in page:
            desc = (r.get("description") or "").strip()
            if not (_PEST.search(desc) or r.get("code") == "410.550"):
                continue
            c = cases.setdefault(r["id"], {"r": r, "descs": []})
            if desc not in c["descs"]:
                c["descs"].append(desc)
    rows, private, newest = [], [], None
    for cid, c in cases.items():
        r = c["r"]
        opened = parse_local_ts(r.get("case_open_date"))
        if opened is None:
            continue
        full, block, z = _block(r.get("full_address"))
        lat, lon = _pt(r.get("latitude"), r.get("longitude"))
        closed = (r.get("status") or "").lower() == "complete"
        iid = f"camhcv:{cid}"
        rows.append((iid, sid, "pest", "; ".join(c["descs"])[:120], "closed" if closed else "open",
                     opened, parse_local_ts(r.get("issue_date")) if closed else None,
                     block, address_key(full, "cambridge"), z, None, None, lat, lon, "cambridge", "point"))
        private.append((iid, full, None, sid))
        newest = max(newest, opened) if newest else opened
    with db.ingest_run(conn, sid) as run_:
        upsert_incidents(conn, rows)
        upsert_private_details(conn, private)
        conn.commit()
        run_["rows"], run_["newest"] = len(rows), newest
    print(f"cambridge housing pest: {len(rows)} cases, {sum(1 for r in rows if r[12] is not None)} located")
    return len(rows)


# ---------- property database ----------

FY_LATEST, FY_PREV = 2026, 2025
# Land with no (usable) building. Parking lots excluded, like Boston.
_VACANT = re.compile(r"vacant|vacnt|udv|dev-land|lnd-imp undev", re.I)
UNITS_BY_CLASS = {"SNGL-FAM-RES": 1, "TWO-FAM-RES": 2, "THREE-FM-RES": 3, "CONDOMINIUM": 1, "CNDO LUX": 1}


def _int(v) -> int | None:
    f = to_float(v)
    return int(f) if f is not None else None


def _polygon_points() -> dict[str, tuple]:
    out: dict[str, tuple] = {}
    for page in socrata_paged(DOMAIN, PARCEL_POLY, None, "ml,the_geom", page=5000):
        for r in page:
            g = r.get("the_geom") or {}
            polys = g.get("coordinates") or []
            rings = [p[0] for p in polys if p] if g.get("type") == "MultiPolygon" else polys[:1]
            if (p := _centroid(rings)) and r.get("ml") and in_region(*p):
                out.setdefault(r["ml"], p)
    return out


def _parcels(conn: psycopg.Connection) -> int:
    sid = "cambridge-assessment-fy26"
    db.upsert_source(conn, sid, "Cambridge property database FY2026 (FY2025 values joined)", _url(PROPERTY),
                     f"latest fiscal year per PID; points from the dataset, FY2025 rows, parcel polygons {PARCEL_POLY}")
    conn.commit()
    cols = ("pid,gisid,bldgnum,address,unit,latitude,longitude,propertyclass,yearofassessment,residentialexemption,"
            "assessedvalue,interior_numunits,condition_yearbuilt,owner_name,owner_coownername")
    by_pid: dict[str, list[dict]] = {}
    prev: dict[str, dict] = {}
    for page in socrata_paged(DOMAIN, PROPERTY, f"yearofassessment in ({FY_PREV}, {FY_LATEST})", cols):
        for r in page:
            if r.get("pid") is None:
                continue
            if int(r["yearofassessment"]) == FY_LATEST:
                by_pid.setdefault(r["pid"], []).append(r)
            elif r["pid"] not in prev or prev[r["pid"]].get("latitude") is None:
                prev[r["pid"]] = r
    poly = _polygon_points()

    parcels, owners, vacant = [], [], []
    how = {"dataset": 0, "fy25": 0, "polygon": 0}
    for pid, recs in by_pid.items():
        recs.sort(key=lambda r: _int(r.get("bldgnum")) or 0)
        r = recs[0]
        lat, lon = _pt(r.get("latitude"), r.get("longitude"))
        if lat is not None:
            how["dataset"] += 1
        elif (p := prev.get(pid)) and (pt := _pt(p.get("latitude"), p.get("longitude")))[0] is not None:
            lat, lon = pt; how["fy25"] += 1
        elif pt := poly.get(r.get("gisid") or ""):
            lat, lon = pt; how["polygon"] += 1
        cls = r.get("propertyclass")
        units = sum(_int(x.get("interior_numunits")) or 0 for x in recs) or UNITS_BY_CLASS.get(cls)
        yrs = [y for x in recs if (y := _int(x.get("condition_yearbuilt")))]
        block = _street(r.get("address"))
        value26 = to_float(r.get("assessedvalue"))
        parcels.append((
            f"cam:{pid}", sid, block, None, cls, min(yrs) if yrs else None,
            {"true": True, "false": False}.get((r.get("residentialexemption") or "").lower()), units,
            to_float((prev.get(pid) or {}).get("assessedvalue")), value26, lat, lon, "cambridge",
        ))
        owner = " & ".join(x for x in (r.get("owner_name"), r.get("owner_coownername")) if x) or None
        full = " ".join(x for x in (r.get("address"), f"#{r['unit']}" if r.get("unit") else None) if x)
        owners.append((f"cam:{pid}", owner, None, f"{full}, CAMBRIDGE MA", sid))
        if cls and _VACANT.search(cls):
            vacant.append((
                f"vacant:cam:{pid}", sid, "vacant_parcel", cls.title(), block, None, None,
                jsonb({"pid": f"cam:{pid}", "land_use": cls, "value_fy26": value26, "located": lat is not None}),
                lat, lon, "cambridge",
            ))

    with db.ingest_run(conn, sid) as run_:
        pcols = ["pid", "source_id", "address_block", "zip", "land_use", "yr_built", "own_occ", "units",
                 "value_fy25", "value_fy26", "lat", "lon", "city"]
        ocols = ["pid", "owner", "mail_address", "full_address", "source_id"]
        parcels_new = _changed(conn, "parcels", pcols, parcels)
        owners_new = _changed(conn, "private.parcel_owners", ocols, owners)
        upsert_generic(conn, "parcels", pcols, parcels_new, key="pid")
        upsert_generic(conn, "private.parcel_owners", ocols, owners_new, key="pid", geom=False)
        conn.execute("delete from places where kind = 'vacant_parcel' and source_id = %s", (sid,))
        upsert_generic(conn, "places", PLACE_COLS, vacant)
        conn.commit()
        run_["rows"] = len(parcels)
    located = sum(1 for p in parcels if p[10] is not None)
    print(f"cambridge parcels {len(parcels)} (changed {len(parcels_new)}), located {located} "
          f"({100 * located / max(1, len(parcels)):.1f}%) {how}; vacant {len(vacant)}")
    return len(parcels) + len(vacant)


# ---------- permits ----------

PERMIT_START = "2023-01-01"


def _permits(conn: psycopg.Connection) -> int:
    sid = "cambridge-building-permits"
    db.upsert_source(conn, sid, "Cambridge demolition + new construction permits (2023–)", _url(DEMOLITION),
                     f"demolition {DEMOLITION}, new construction {NEW_CONSTRUCTION}; display only")
    conn.commit()
    rows, newest = [], None
    for page in socrata_paged(DOMAIN, DEMOLITION, f"issue_date >= '{PERMIT_START}'",
                              "id,full_address,latitude,longitude,status,building_use,issue_date,project_end_date,"
                              "demolition_description,description,demolition_cost,count_of_units_demolished"):
        for r in page:
            issued = parse_local_ts(r.get("issue_date"))
            if issued is None:
                continue
            _, block, _ = _block(r.get("full_address"))
            end = parse_local_ts(r.get("project_end_date"))
            name = _scrub_comment(r.get("description")) or r.get("demolition_description") or "Demolition"
            attrs = {"permit": r["id"], "subtype": "demolition", "status": r.get("status"),
                     "building_use": r.get("building_use"), "scope": r.get("demolition_description"),
                     "units_demolished": _int(r.get("count_of_units_demolished")),
                     "declared_valuation": to_float(r.get("demolition_cost")), "display_only": True, "note": PERMIT_NOTE}
            rows.append((f"campermit:demo:{r['id']}", sid, "demolition", name[:80], block, issued,
                         end if end and end >= issued else None, jsonb(attrs),
                         *_pt(r.get("latitude"), r.get("longitude")), "cambridge"))
            newest = max(newest, issued) if newest else issued
    for page in socrata_paged(DOMAIN, NEW_CONSTRUCTION, f"issue_date >= '{PERMIT_START}'",
                              "id,full_address,latitude,longitude,status,issue_date,license_expiration_date,"
                              "proposed_building_use,description_of_work,total_cost_of_construction,"
                              "proposed_count_of_dwelling"):
        for r in page:
            issued = parse_local_ts(r.get("issue_date"))
            if issued is None:
                continue
            _, block, _ = _block(r.get("full_address"))
            end = parse_local_ts(r.get("license_expiration_date"))
            attrs = {"permit": r["id"], "subtype": "new_construction", "status": r.get("status"),
                     "permit_type": "New Construction", "proposed_use": r.get("proposed_building_use"),
                     "proposed_units": _int(r.get("proposed_count_of_dwelling")),
                     "declared_valuation": to_float(r.get("total_cost_of_construction")),
                     "display_only": True, "note": PERMIT_NOTE}
            rows.append((f"campermit:new:{r['id']}", sid, "excavation",
                         (_scrub_comment(r.get("description_of_work")) or "New construction")[:80], block, issued,
                         end if end and end >= issued else None, jsonb(attrs),
                         *_pt(r.get("latitude"), r.get("longitude")), "cambridge"))
            newest = max(newest, issued) if newest else issued
    rows = list({r[0]: r for r in rows}.values())  # a permit appears once per review row; keep one
    with db.ingest_run(conn, sid) as run_:
        upsert_generic(conn, "places", PLACE_COLS, rows)
        conn.commit()
        run_["rows"], run_["newest"] = len(rows), newest
    print(f"cambridge permits: {len(rows)} ({sum(1 for r in rows if r[2] == 'demolition')} demolition), "
          f"{sum(1 for r in rows if r[8] is not None)} located")
    return len(rows)


# ---------- schools ----------

def _schools(conn: psycopg.Connection) -> int:
    sid = "cambridge-public-schools"
    db.upsert_source(conn, sid, "Cambridge public school locations", _url(SCHOOLS), f"dataset {SCHOOLS}")
    conn.commit()
    rows = []
    for page in socrata_paged(DOMAIN, SCHOOLS):
        for r in page:
            lon, lat = ((r.get("the_geom") or {}).get("coordinates") or [None, None])[:2]
            name = (r.get("site_name") or "").strip()
            slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
            rows.append((f"camschool:{slug}", sid, "school", name, _street(r.get("address")), None, None,
                         jsonb({"school": name, "school_type": "Public", "shelter": r.get("shelter") == "YES"}),
                         *_pt(lat, lon), "cambridge"))
    with db.ingest_run(conn, sid) as run_:
        conn.execute("delete from places where kind = 'school' and source_id = %s", (sid,))
        upsert_generic(conn, "places", PLACE_COLS, rows)
        conn.commit()
        run_["rows"] = len(rows)
    return len(rows)


def run(conn: psycopg.Connection, since: str | None = None) -> int:
    total = _food(conn) + _housing(conn) + _permits(conn)
    if not since:
        total += _parcels(conn) + _schools(conn)
    return total
