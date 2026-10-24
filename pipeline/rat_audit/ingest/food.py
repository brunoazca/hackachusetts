"""Boston food establishment inspections: rodent-related violations 2024-> -> `places` kind restaurant.

One place per license (id food:<licenseno>). The row filter is the one used in validation
(pull_grid.py): violdesc or inspector comments mention rodents / mice / mouse / rat. Some of those
hits are generic pest codes (e.g. fly paper under "Removing Dead or Trapped ... Rodents"), so each
violation carries `explicit` = the comment itself names a rodent sign, and attrs count both.
Licensee person names (namefirst/namelast/legalowner) are never read.
"""
from __future__ import annotations

import re

import psycopg

from .. import db
from .common import (
    address_block, ckan_paged, in_region, jsonb, parse_local_ts, scrub_note, since_cutoff, upsert_generic, zip5,
)

TABLE = "4582bec6-2b4f-4f9e-bc55-cbaa73117f4c"
PAGE_URL = "https://data.boston.gov/dataset/food-establishment-inspections"
START = "2024-01-01"
RODENT_WHERE = ("(violdesc ILIKE '%rodent%' OR violdesc ILIKE '%mice%' OR comments ILIKE '%rodent%' "
                "OR comments ILIKE '%mouse%' OR comments ILIKE '%mice%' OR comments ILIKE '% rat %')")
_EXPLICIT = re.compile(r"\b(rodents?|mice|mouse|rats?|droppings?|gnaw\w*)\b", re.I)
_LOC = re.compile(r"\(?\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)")
MAX_VIOLATIONS = 20


def _loc(s: str | None) -> tuple[float | None, float | None]:
    m = _LOC.match(s or "")
    if not m:
        return None, None
    lat, lon = float(m.group(1)), float(m.group(2))
    return (lat, lon) if in_region(lat, lon) else (None, None)


def run(conn: psycopg.Connection, since: str | None = None) -> int:
    sid = "boston-food-inspections"
    db.upsert_source(conn, sid, "Boston food establishment inspections (rodent-related violations, 2024–)",
                     PAGE_URL, f"resource {TABLE}")
    conn.commit()
    where = f"{RODENT_WHERE} AND resultdttm >= '{START}'"
    if cutoff := since_cutoff(since):
        # Re-aggregate the full 2024-> history of any license with a new rodent citation.
        recent = {r["licenseno"] for p in ckan_paged(TABLE, "licenseno",
                  f"{where} AND resultdttm >= '{cutoff.strftime('%Y-%m-%d')}'") for r in p if r["licenseno"]}
        if not recent:
            return 0
        where += " AND licenseno IN (" + ", ".join("'" + l.replace("'", "''") + "'" for l in recent) + ")"
    cols = "licenseno, businessname, descript, result, resultdttm, violation, violdesc, viol_status, comments, address, zip, location"

    biz: dict[str, dict] = {}
    for page in ckan_paged(TABLE, cols, where):
        for r in page:
            lic = r["licenseno"]
            when = parse_local_ts(r["resultdttm"])
            if not lic or when is None:
                continue
            b = biz.setdefault(lic, {"rows": {}, "name": r["businessname"], "kind": r["descript"],
                                     "addr": r["address"], "zip": zip5(r["zip"]), "loc": _loc(r["location"])})
            if b["loc"][0] is None:
                b["loc"] = _loc(r["location"])
            # Re-inspections repeat the same citation; keep one per day x violation code, latest result wins.
            b["rows"][(when.date(), r["violation"])] = {
                "date": when.date().isoformat(), "at": when, "code": r["violation"],
                "desc": (r["violdesc"] or "").replace("  ", ", ").strip() or None,
                "comment": scrub_note(r["comments"]) if r["comments"] not in (None, "None") else None,
                "result": r["result"], "status": r["viol_status"],
                "explicit": bool(_EXPLICIT.search(r["comments"] or "")),
            }

    rows, newest = [], None
    for lic, b in biz.items():
        vs = sorted(b["rows"].values(), key=lambda v: v["at"])
        first, last = vs[0]["at"], vs[-1]["at"]
        newest = max(newest, last) if newest else last
        attrs = {
            "license": lic, "business_type": b["kind"],
            "n_rodent_violations": len(vs), "n_explicit": sum(v["explicit"] for v in vs),
            "last_result": vs[-1]["result"], "last_citation": last.date().isoformat(),
            "rodent_violations": [{k: v[k] for k in ("date", "desc", "comment", "result", "status", "explicit")}
                                  for v in vs[-MAX_VIOLATIONS:]],
        }
        lat, lon = b["loc"]
        rows.append((f"food:{lic}", sid, "restaurant", b["name"], address_block(b["addr"], b["zip"]),
                     first, None, jsonb(attrs), lat, lon, "boston"))

    with db.ingest_run(conn, sid) as run_:
        upsert_generic(conn, "places", ["id", "source_id", "kind", "name", "address_block", "starts_at", "ends_at",
                                        "attrs", "lat", "lon", "city"], rows)
        conn.commit()
        run_["rows"], run_["newest"] = len(rows), newest
    print(f"food: {len(rows)} businesses, {sum(1 for r in rows if r[8] is not None)} located")
    return len(rows)
