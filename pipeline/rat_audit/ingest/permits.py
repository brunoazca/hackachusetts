"""Boston approved building permits 2023-> : demolitions and excavation-type work -> `places`.

- demolition: worktype RAZE (raze) and EXTDEM (exterior demolition)
- excavation: worktype SITE ("Excavation Borings Test Pits") and ground-up new construction
  (ERECT "Erect/New Construction", NEWCON), tagged attrs.subtype site_work | new_construction

Display only: the validation found no rodent-report effect around these permits (data-validation.md),
so the model does not use them; attrs.display_only says so. Name is the permit's generic work
description; applicant, owner and the free-text comments (which carry house numbers) are never stored.
"""
from __future__ import annotations

import psycopg

from .. import db
from .common import address_block, ckan_paged, in_region, jsonb, parse_local_ts, since_cutoff, to_float, upsert_generic, zip5

TABLE = "6ddcd912-32a0-43df-9908-63574f8c7e77"
PAGE_URL = "https://data.boston.gov/dataset/approved-building-permits"
START = "2023-01-01"
KIND = {"RAZE": ("demolition", "raze"), "EXTDEM": ("demolition", "exterior_demolition"),
        "SITE": ("excavation", "site_work"), "ERECT": ("excavation", "new_construction"),
        "NEWCON": ("excavation", "new_construction")}
NOTE = "Display only: no measurable effect on rodent reports in validation; not a model feature."


def run(conn: psycopg.Connection, since: str | None = None) -> int:
    sid = "boston-building-permits"
    db.upsert_source(conn, sid, "Boston approved building permits (demolition, excavation, new construction 2023–)",
                     PAGE_URL, f"resource {TABLE}")
    conn.commit()
    start = START
    if cutoff := since_cutoff(since):
        start = max(START, cutoff.strftime("%Y-%m-%d"))
    where = (f"worktype IN ({', '.join(repr(k) for k in KIND)}) AND issued_date >= '{start}' "
             "AND (worktype <> 'ERECT' OR permittypedescr = 'Erect/New Construction')")
    cols = "permitnumber, worktype, permittypedescr, description, status, declared_valuation, issued_date, expiration_date, address, zip, y_latitude, x_longitude"
    rows, newest = [], None
    for page in ckan_paged(TABLE, cols, where):
        for r in page:
            issued = parse_local_ts(r["issued_date"])
            if issued is None:
                continue
            kind, subtype = KIND[r["worktype"]]
            lat, lon = to_float(r["y_latitude"]), to_float(r["x_longitude"])
            if not in_region(lat, lon):
                lat = lon = None
            z = zip5(r["zip"])
            desc = " ".join((r["description"] or r["permittypedescr"] or r["worktype"]).split())
            attrs = {"permit": r["permitnumber"], "worktype": r["worktype"], "subtype": subtype,
                     "permit_type": r["permittypedescr"], "status": r["status"],
                     "declared_valuation": to_float((r["declared_valuation"] or "").replace("$", "").replace(",", "")),
                     "display_only": True, "note": NOTE}
            rows.append((f"permit:{r['permitnumber']}", sid, kind, desc[:80], address_block(r["address"], z),
                         issued, parse_local_ts(r["expiration_date"]), jsonb(attrs), lat, lon, "boston"))
            newest = max(newest, issued) if newest else issued
    with db.ingest_run(conn, sid) as run_:
        upsert_generic(conn, "places", ["id", "source_id", "kind", "name", "address_block", "starts_at", "ends_at",
                                        "attrs", "lat", "lon", "city"], rows)
        conn.commit()
        run_["rows"], run_["newest"] = len(rows), newest
    print(f"permits: {len(rows)} ({sum(1 for r in rows if r[2] == 'demolition')} demolition), "
          f"{sum(1 for r in rows if r[8] is not None)} located")
    return len(rows)
