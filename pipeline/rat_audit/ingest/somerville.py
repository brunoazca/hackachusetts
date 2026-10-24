"""Somerville equivalents of the Boston-only layers: building permits, assessor parcels, schools.

- permits: "Applications for Permits and Licenses" (nneb-s3f7), 2023-> . Demolition Permit -> places kind
  demolition; Building Permit "* New Construction" -> kind excavation (attrs.subtype new_construction).
  Somerville publishes no excavation / foundation permit type. Points are the portal's own lat/lon; rows
  without one are skipped. Name is the generic permit subtype; the free-text project description and the
  applicant are never stored.
- parcels: MassGIS Level 3 standardized assessor parcels (statewide layer, TOWN_ID 274 only). Point = polygon
  centroid (condo units share their lot's polygon). value_fy26 holds TOTAL_VAL of the latest fiscal year
  MassGIS has for Somerville (attrs/notes say which). Owner + site address -> `private.parcel_owners` only.
  Vacant land (DOR classes 130-132, 390-392, 440-442) -> places kind vacant_parcel.
- schools: MassGIS PK-12 schools, TOWN = SOMERVILLE -> places kind school.
"""
from __future__ import annotations

import re
from collections import Counter

import psycopg

from .. import db
from .common import _get_json, address_block, in_region, jsonb, parse_local_ts, since_cutoff, socrata_paged, \
    to_float, upsert_generic, zip5
from .parcels import _changed, _street_title
from .permits import NOTE as PERMIT_NOTE, _LEAD_NUM

DOMAIN, PERMITS = "data.somervillema.gov", "nneb-s3f7"
MASSGIS = "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL"
L3 = f"{MASSGIS}/L3_Parcels_FeatureService_4326/FeatureServer/1"
SCHOOLS = f"{MASSGIS}/Schools/FeatureServer/0"
TOWN_ID = 274
START = "2023-01-01"
COLS = ["id", "source_id", "kind", "name", "address_block", "starts_at", "ends_at", "attrs", "lat", "lon", "city"]

# MA DOR property type classification (first three digits of the 4-character Somerville code).
DOR = {"101": "Single family", "102": "Condominium", "103": "Mobile home", "104": "Two-family",
       "105": "Three-family", "106": "Accessory land with improvement", "109": "Multiple houses on one parcel",
       "111": "Apartments (4-8 units)", "112": "Apartments (more than 8 units)", "121": "Rooming house",
       "122": "Fraternity / sorority", "123": "Residence hall / dormitory", "125": "Other congregate housing",
       "130": "Vacant residential land (developable)", "131": "Vacant residential land (potentially developable)",
       "132": "Vacant residential land (undevelopable)", "140": "Child care facility",
       "390": "Vacant commercial land (developable)", "391": "Vacant commercial land (potentially developable)",
       "392": "Vacant commercial land (undevelopable)", "440": "Vacant industrial land (developable)",
       "441": "Vacant industrial land (potentially developable)", "442": "Vacant industrial land (undevelopable)",
       "995": "Condominium master parcel"}
VACANT = {"130", "131", "132", "390", "391", "392", "440", "441", "442"}
UNITS_BY_CLASS = {"101": 1, "102": 1, "104": 2, "105": 3}

_ZIP = re.compile(r"\b(02\d{3})\b")
_WS = re.compile(r"\s+")


def _land_use(code: str | None) -> tuple[str | None, str | None]:
    """'1040' -> ('104', 'Two-family'); '0322' -> ('0322', 'Mixed use'); '3220' -> ('322', 'Commercial')."""
    if not code:
        return None, None
    if code.startswith("0"):
        return code, "Mixed use"
    cls = code[:3]
    if cls in DOR:
        return cls, DOR[cls]
    return cls, {"1": "Residential", "2": "Open space", "3": "Commercial", "4": "Industrial", "5": "Personal property",
                 "6": "Forest", "7": "Agricultural", "8": "Recreational", "9": "Exempt"}.get(code[0])


def _arcgis_all(layer: str, where: str, fields: str, **extra) -> list[dict]:
    out, offset = [], 0
    while True:
        d = _get_json(f"{layer}/query", {"where": where, "outFields": fields, "orderByFields": "OBJECTID",
                                         "resultOffset": offset, "resultRecordCount": 2000, "outSR": 4326,
                                         "f": "json", **extra})
        feats = d.get("features") or []
        out.extend(feats)
        if not feats or not d.get("exceededTransferLimit"):
            return out
        offset += len(feats)


def _pt(lat, lon) -> tuple[float | None, float | None]:
    lat, lon = to_float(lat), to_float(lon)
    return (lat, lon) if in_region(lat, lon) else (None, None)


# ---------- permits ----------

def _permits(conn: psycopg.Connection, cutoff) -> int:
    sid = "somerville-building-permits"
    db.upsert_source(conn, sid, "Somerville permits (demolition, new construction 2023–)",
                     f"https://{DOMAIN}/d/{PERMITS}", "Applications for Permits and Licenses; Permitting category")
    conn.commit()
    start = max(START, cutoff.strftime("%Y-%m-%d")) if cutoff else START
    where = (f"issue_date >= '{start}' AND application_category = 'Permitting' AND "
             "(application_type = 'Demolition Permit' OR "
             "(application_type = 'Building Permit' AND application_subtype like '%New Construction'))")
    sel = ("application_id,application_number,application_type,application_subtype,status,issue_date,"
           "expiration_date,application_address,application_latitude,application_longitude")
    rows, skipped, newest = [], 0, None
    for page in socrata_paged(DOMAIN, PERMITS, where, sel):
        for r in page:
            issued = parse_local_ts(r.get("issue_date"))
            lat, lon = _pt(r.get("application_latitude"), r.get("application_longitude"))
            if issued is None or lat is None:
                skipped += 1
                continue
            demo = r["application_type"] == "Demolition Permit"
            sub = (r.get("application_subtype") or "").strip()
            subtype = ("accessory_structure" if "Accessory" in sub else "raze") if demo else "new_construction"
            addr = r.get("application_address") or ""
            z = _ZIP.search(addr)
            street = _LEAD_NUM.sub("", addr.split(",")[0])
            attrs = {"permit": r.get("application_number"), "worktype": r["application_type"], "subtype": subtype,
                     "permit_type": sub, "status": r.get("status"), "display_only": True, "note": PERMIT_NOTE}
            name = f"Demolition: {sub[0].lower() + sub[1:]}" if demo else sub
            rows.append((f"sompermit:{r['application_id']}", sid, "demolition" if demo else "excavation", name[:80],
                         address_block(street, z.group(1) if z else None), issued,
                         parse_local_ts(r.get("expiration_date")), jsonb(attrs), lat, lon, "somerville"))
            newest = max(newest, issued) if newest else issued
    with db.ingest_run(conn, sid) as run_:
        upsert_generic(conn, "places", COLS, rows)
        conn.commit()
        run_["rows"], run_["newest"] = len(rows), newest
    print(f"somerville permits: {len(rows)} ({sum(1 for r in rows if r[2] == 'demolition')} demolition), "
          f"{skipped} skipped without a location")
    return len(rows)


# ---------- parcels ----------

def _parcels(conn: psycopg.Connection) -> int:
    sid = "somerville-assessment-massgis"
    feats = _arcgis_all(L3, f"TOWN_ID={TOWN_ID}",
                        "LOC_ID,PROP_ID,USE_CODE,YEAR_BUILT,UNITS,TOTAL_VAL,FY,SITE_ADDR,FULL_STR,ZIP,OWNER1,"
                        "OWN_ADDR,OWN_CITY", returnCentroid="true", returnGeometry="false")
    recs = {}
    for f in feats:
        a = f["attributes"]
        if a.get("PROP_ID") and a.get("USE_CODE"):
            recs.setdefault(a["PROP_ID"], (a, f.get("centroid") or {}))
    fys = Counter(a["FY"] for a, _ in recs.values())
    db.upsert_source(conn, sid, "Somerville assessor parcels (MassGIS Level 3 standardized assessor data)",
                     "https://www.mass.gov/info-details/massgis-data-property-tax-parcels",
                     f"{L3} where TOWN_ID={TOWN_ID}; fiscal years {dict(fys)}; value_fy26 holds TOTAL_VAL of that FY")
    conn.commit()

    # ZIP is filled for under a third of Somerville records: borrow it from the street when the street has one ZIP.
    by_street: dict[str, set] = {}
    for a, _ in recs.values():
        if (z := zip5(a.get("ZIP"))) and a.get("FULL_STR"):
            by_street.setdefault(a["FULL_STR"].upper(), set()).add(z)

    parcels, owners, vacant = [], [], []
    for prop, (a, c) in recs.items():
        pid = f"som:{prop}"
        st = _WS.sub(" ", (a.get("FULL_STR") or "")).strip().upper()
        z = zip5(a.get("ZIP"))
        if not z and len(by_street.get(st, ())) == 1:
            z = next(iter(by_street[st]))
        lat, lon = _pt(c.get("y"), c.get("x"))
        cls, lu = _land_use(a["USE_CODE"])
        units = a.get("UNITS") or UNITS_BY_CLASS.get(cls)
        site = _WS.sub(" ", a.get("SITE_ADDR") or "").strip().upper()
        own = _WS.sub(" ", a.get("OWN_ADDR") or "").strip().upper()
        own_occ = bool(site) and own == site and "SOMERVILLE" in (a.get("OWN_CITY") or "").upper()
        block = address_block(_street_title(st), z)
        val = to_float(a.get("TOTAL_VAL"))
        parcels.append((pid, sid, block, z, lu or a["USE_CODE"], a.get("YEAR_BUILT") or None, own_occ, units,
                        None, val, lat, lon, "somerville"))
        owners.append((pid, a.get("OWNER1"), None, f"{site}, SOMERVILLE MA {z or ''}".strip(), sid))
        if cls in VACANT:
            vacant.append((f"vacant:{pid}", sid, "vacant_parcel", lu, block, None, None,
                           jsonb({"pid": pid, "land_use": lu, "use_code": a["USE_CODE"], "value_fy26": val,
                                  "fiscal_year": a.get("FY"), "located": lat is not None}),
                           lat, lon, "somerville"))

    with db.ingest_run(conn, sid) as run_:
        pcols = ["pid", "source_id", "address_block", "zip", "land_use", "yr_built", "own_occ", "units",
                 "value_fy25", "value_fy26", "lat", "lon", "city"]
        ocols = ["pid", "owner", "mail_address", "full_address", "source_id"]
        parcels_new = [r for r in _changed(conn, "parcels", pcols, parcels)]
        owners_new = [r for r in _changed(conn, "private.parcel_owners", ocols, owners)]
        upsert_generic(conn, "parcels", pcols, parcels_new, key="pid")
        upsert_generic(conn, "private.parcel_owners", ocols, owners_new, key="pid", geom=False)
        conn.execute("delete from places where kind = 'vacant_parcel' and source_id = %s", (sid,))
        upsert_generic(conn, "places", COLS, vacant)
        conn.commit()
        run_["rows"] = len(parcels)
    located = sum(1 for p in parcels if p[10] is not None)
    print(f"somerville parcels {len(parcels)} (changed {len(parcels_new)}), located {located}, "
          f"zip {sum(1 for p in parcels if p[3])}, yr_built {sum(1 for p in parcels if p[5])}, FY {dict(fys)}; "
          f"vacant {len(vacant)}")
    return len(parcels) + len(vacant)


# ---------- schools ----------

def _schools(conn: psycopg.Connection) -> int:
    sid = "somerville-public-schools"
    db.upsert_source(conn, sid, "Somerville PK-12 schools (MassGIS)",
                     "https://www.mass.gov/info-details/massgis-data-massachusetts-schools-pre-k-through-high-school",
                     f"{SCHOOLS} where TOWN='SOMERVILLE'")
    conn.commit()
    rows = []
    for f in _arcgis_all(SCHOOLS, "TOWN='SOMERVILLE'", "SCHID,NAME,ADDRESS,ZIPCODE,GRADES,TYPE_DESC,DIST_NAME"):
        a, g = f["attributes"], f.get("geometry") or {}
        lat, lon = _pt(g.get("y"), g.get("x"))
        rows.append((f"school:som-{a['SCHID']}", sid, "school", a["NAME"],
                     address_block(a.get("ADDRESS"), zip5(a.get("ZIPCODE"))), None, None,
                     jsonb({"school_type": a.get("TYPE_DESC"), "grades": a.get("GRADES"), "district": a.get("DIST_NAME")}),
                     lat, lon, "somerville"))
    with db.ingest_run(conn, sid) as run_:
        conn.execute("delete from places where kind = 'school' and source_id = %s", (sid,))
        upsert_generic(conn, "places", COLS, rows)
        conn.commit()
        run_["rows"] = len(rows)
    print(f"somerville schools: {len(rows)}, {sum(1 for r in rows if r[8] is not None)} located")
    return len(rows)


def run(conn: psycopg.Connection, since: str | None = None) -> int:
    cutoff = since_cutoff(since)
    n = _permits(conn, cutoff)
    if cutoff:  # parcels and schools are static snapshots; only a backfill reloads them
        return n
    return n + _parcels(conn) + _schools(conn)
