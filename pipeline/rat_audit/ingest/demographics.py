"""ACS demographics for every tract we map (Boston, Cambridge, Somerville), from Census Reporter.

The Census Bureau API now needs a key; Census Reporter serves the same ACS 5-year tables without one.
Values go into `tracts.attrs.acs` with plain keys, so all three cities share one demographic lens
(the Climate Ready SVI fields exist for Boston only). Boston's SVI tracts use 2010 GEOIDs; tracts whose
GEOID changed in 2020 get no ACS match and are flagged `acs_match: false`.
"""
from __future__ import annotations

import json

import psycopg

from .. import db
from .common import _get_json

API = "https://api.censusreporter.org/1.0/data/show/latest"
COUNTIES = ["05000US25025", "05000US25017"]  # Suffolk (Boston), Middlesex (Cambridge, Somerville)
TABLES = "B01003,B19013,B25003,B17001,B03002,B25034,C16002"


def _share(d: dict, num: list[str], den: str) -> float | None:
    total = d.get(den)
    if not total:
        return None
    return round(100.0 * sum(d.get(k) or 0 for k in num) / total, 1)


def _fields(t: dict) -> dict:
    e = {k: v for tbl in t.values() for k, v in tbl["estimate"].items()}
    return {
        "pop": e.get("B01003001"),
        "median_income": e.get("B19013001"),
        "pct_renters": _share(e, ["B25003003"], "B25003001"),
        "pct_poverty": _share(e, ["B17001002"], "B17001001"),
        "pct_people_of_color": None if not e.get("B03002001") else round(100.0 - _share(e, ["B03002003"], "B03002001"), 1),
        "pct_limited_english_hh": _share(e, ["C16002004", "C16002007", "C16002010", "C16002013"], "C16002001"),
        "pct_housing_pre1940": _share(e, ["B25034011"], "B25034001"),
        "pct_housing_pre1960": _share(e, ["B25034009", "B25034010", "B25034011"], "B25034001"),
    }


def run(conn: psycopg.Connection, since: str | None = None) -> int:
    sid = "census-reporter-acs"
    db.upsert_source(conn, sid, "ACS 5-year estimates by tract (via Census Reporter)", "https://censusreporter.org/",
                     f"tables {TABLES}; counties Suffolk + Middlesex")
    acs: dict[str, dict] = {}
    release = None
    for county in COUNTIES:
        d = _get_json(API, {"table_ids": TABLES, "geo_ids": f"140|{county}"})
        release = d.get("release", {}).get("name", release)
        for geo, tables in d["data"].items():
            acs[geo.split("US", 1)[1]] = _fields(tables)
    geoids = [r[0] for r in conn.execute("select geoid from tracts")]
    matched = 0
    with db.ingest_run(conn, sid) as run_:
        for g in geoids:
            vals = acs.get(g)
            patch = {"acs": vals, "acs_release": release, "acs_match": vals is not None}
            matched += vals is not None
            conn.execute("update tracts set attrs = attrs || %s::jsonb where geoid = %s", (json.dumps(patch), g))
        conn.commit()
        run_["rows"] = matched
    return matched
