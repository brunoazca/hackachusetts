"""Context layers: census tracts (SVI, asthma, population), Zillow prices, Inside Airbnb rat reviews,
iNaturalist rat observations, and city pest-control spending.

All of this is context only (see .kiro/specs/rat-audit/data-audit.md): none of it feeds the forecast.
Raw downloads are cached under <repo>/.cache/raw/ so re-runs don't re-download.
"""
from __future__ import annotations

import csv
import gzip
import hashlib
import html
import json
import os
import re
from datetime import date, datetime
from pathlib import Path

import psycopg

from .. import db
from .common import _get_json, _session, ckan_sql, in_region, jsonb, to_float, upsert_generic, upsert_incidents

RAW = Path(os.environ.get("RAW_CACHE") or Path(__file__).resolve().parents[3] / ".cache" / "raw")


def _cached(url: str, name: str, params: dict | None = None) -> Path:
    p = RAW / name
    if not p.exists() or p.stat().st_size == 0:
        p.parent.mkdir(parents=True, exist_ok=True)
        r = _session.get(url, params=params, timeout=600)
        r.raise_for_status()
        p.write_bytes(r.content)
    return p


# ---------- census tracts ----------

SVI_PAGE = "https://data.boston.gov/dataset/climate-ready-boston-social-vulnerability"
SVI_URL = ("https://bostonopendata-boston.opendata.arcgis.com/api/download/v1/items/"
           "34f2c48b670d4b43a617b1540f20efe3/geojson?layers=0")
TIGER_URL = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Census2020/MapServer/6/query"
PLACES_URL = "https://data.cdc.gov/resource/cwsq-ngmh.json"
# Climate Ready field -> plain key (counts; *_pct is share of tract population)
SVI_FIELDS = {
    "TotDis": "svi_disability", "TotChild": "svi_children", "OlderAdult": "svi_older_adults",
    "Low_to_No": "svi_low_income", "LEP": "svi_limited_english", "POC2": "svi_people_of_color",
    "MedIllnes": "svi_medical_illness",
}


def _tract_label(geoid: str) -> str:
    t = geoid[5:]
    return f"{int(t[:4])}" + (f".{t[4:]}" if t[4:] != "00" else "")


def _regional_city(geoid: str) -> str | None:
    """Middlesex 2020 tracts 3501-3515 are Somerville; 3521-3550 and 3594 (Harvard) are Cambridge.
    Checked against 2020 Census city totals (Somerville 81,045; Cambridge 118,403)."""
    if not geoid.startswith("25017"):
        return None
    n = int(geoid[5:9])
    return "somerville" if 3501 <= n <= 3515 else "cambridge" if 3521 <= n <= 3550 or n == 3594 else None


def _upsert_tracts(conn: psycopg.Connection, rows: list[tuple]) -> None:
    """rows: (geoid, source_id, name, attrs_json, geojson_geometry, city)."""
    with conn.cursor() as cur:
        cur.executemany(
            """insert into tracts (geoid, source_id, name, attrs, geom, city)
               values (%s, %s, %s, %s::jsonb,
                 st_multi(st_collectionextract(st_makevalid(st_simplifypreservetopology(
                   st_setsrid(st_geomfromgeojson(%s), 4326), 0.00005)), 3))::geography, %s)  -- ~5 m
               on conflict (geoid) do update set source_id = excluded.source_id, name = excluded.name,
                 attrs = excluded.attrs, geom = excluded.geom, city = excluded.city""",
            rows,
        )


def tracts(conn: psycopg.Connection) -> int:
    db.upsert_source(conn, "climate-ready-boston-svi", "Climate Ready Boston social vulnerability (2010 tracts)",
                     SVI_PAGE, "Analyze Boston GeoJSON; counts from ACS 2008-2012 / Census 2010")
    db.upsert_source(conn, "census-tigerweb-2020", "Census TIGERweb 2020 tracts (Cambridge, Somerville)",
                     "https://tigerweb.geo.census.gov/", "geometry + 2020 Census POP100/HU100")
    db.upsert_source(conn, "cdc-places", "CDC PLACES: current asthma among adults, census tract",
                     "https://data.cdc.gov/d/cwsq-ngmh", "BRFSS model-based crude prevalence; 2020 tracts")
    with db.ingest_run(conn, "climate-ready-boston-svi") as run:
        svi = json.loads(_cached(SVI_URL, "svi/svi.geojson").read_text())
        tiger = json.loads(_cached(TIGER_URL, "tiger_tracts.geojson", {
            "where": "STATE='25' AND COUNTY IN ('017','025')", "outFields": "GEOID,COUNTY,BASENAME,POP100,HU100",
            "outSR": "4326", "f": "geojson", "returnGeometry": "true"}).read_text())
        asthma: dict[str, float] = {}
        for county in ("Suffolk", "Middlesex"):
            for r in _get_json(PLACES_URL, {"stateabbr": "MA", "countyname": county, "measureid": "CASTHMA",
                                            "$limit": 5000}):
                if (v := to_float(r.get("data_value"))) is not None:
                    asthma[r["locationname"]] = v
        rows = []
        for f in svi["features"]:
            p = f["properties"]
            gid, pop = p["GEOID10"], p.get("POP100_RE") or 0
            attrs = {"pop": pop, "housing_units": p.get("HU100_RE"), "neighborhood": p.get("Name"),
                     "tract": _tract_label(gid), "area_acres": p.get("AREA_ACRES"), "tract_vintage": 2010}
            for k, key in SVI_FIELDS.items():
                v = to_float(p.get(k))
                attrs[key] = v
                attrs[f"{key}_pct"] = round(100 * v / pop, 1) if v is not None and pop else None
            if gid in asthma:
                attrs.update(asthma_pct=asthma[gid], asthma_method="exact")
            rows.append((gid, "climate-ready-boston-svi", f"{p.get('Name')} · tract {_tract_label(gid)}",
                         jsonb(attrs), json.dumps(f["geometry"]), "boston"))
        n_regional = 0
        for f in tiger["features"]:
            p = f["properties"]
            city = _regional_city(p["GEOID"])
            if not city:
                continue
            attrs = {"pop": p.get("POP100"), "housing_units": p.get("HU100"), "tract": p["BASENAME"], "tract_vintage": 2020}
            if p["GEOID"] in asthma:
                attrs.update(asthma_pct=asthma[p["GEOID"]], asthma_method="exact")
            rows.append((p["GEOID"], "census-tigerweb-2020", f"{city.title()} · tract {p['BASENAME']}",
                         jsonb(attrs), json.dumps(f["geometry"]), city))
            n_regional += 1
        _upsert_tracts(conn, rows)
        # Boston SVI tracts are 2010 vintage; PLACES uses 2020 tracts. Where a 2010 tract was split or
        # redrawn, take the area-weighted asthma of the overlapping 2020 Suffolk tracts.
        conn.execute("create temp table _t20 (geoid text, asthma real, geom geometry) on commit drop")
        with conn.cursor() as cur:
            cur.executemany(
                "insert into _t20 values (%s, %s, st_makevalid(st_setsrid(st_geomfromgeojson(%s), 4326)))",
                [(f["properties"]["GEOID"], asthma[f["properties"]["GEOID"]], json.dumps(f["geometry"]))
                 for f in tiger["features"] if f["properties"]["COUNTY"] == "025" and f["properties"]["GEOID"] in asthma],
            )
        conn.execute(
            """update tracts t set attrs = t.attrs || jsonb_build_object('asthma_pct', round(w.v::numeric, 1),
                 'asthma_method', 'area_weighted_2020')
               from (select t.geoid, sum(s.asthma * st_area(st_intersection(t.geom::geometry, s.geom)))
                              / nullif(sum(st_area(st_intersection(t.geom::geometry, s.geom))), 0) v
                     from tracts t join _t20 s on st_intersects(t.geom::geometry, s.geom)
                     where t.city = 'boston' and not (t.attrs ? 'asthma_pct')
                     group by t.geoid) w
               where t.geoid = w.geoid and w.v is not null"""
        )
        conn.commit()
        run["rows"] = len(rows)
    return len(rows)


# ---------- Zillow ----------

ZHVI_URL = "https://files.zillowstatic.com/research/public_csvs/zhvi/Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv"
ZORI_URL = "https://files.zillowstatic.com/research/public_csvs/zori/Zip_zori_uc_sfrcondomfr_sm_month.csv"


def _zillow_series(path: Path) -> dict[tuple[str, date], float]:
    out = {}
    with path.open(newline="") as fh:
        for r in csv.DictReader(fh):
            z = r["RegionName"].zfill(5)
            if r["State"] != "MA" or not z.startswith("021"):
                continue
            for k, v in r.items():
                if re.fullmatch(r"\d{4}-\d{2}-\d{2}", k) and k >= "2020-01" and (f := to_float(v)) is not None:
                    out[(z, date(int(k[:4]), int(k[5:7]), 1))] = round(f, 2)
    return out


def zillow(conn: psycopg.Connection) -> int:
    db.upsert_source(conn, "zillow-zhvi", "Zillow Home Value Index by ZIP (mid-tier, smoothed, SA)",
                     "https://www.zillow.com/research/data/", ZHVI_URL)
    db.upsert_source(conn, "zillow-zori", "Zillow Observed Rent Index by ZIP (smoothed)",
                     "https://www.zillow.com/research/data/", ZORI_URL)
    with db.ingest_run(conn, "zillow-zhvi") as run:
        zhvi = _zillow_series(_cached(ZHVI_URL, "zillow/zhvi.csv"))
        zori = _zillow_series(_cached(ZORI_URL, "zillow/zori.csv"))
        rows = [(z, m, "zillow-zhvi" if (z, m) in zhvi else "zillow-zori", zhvi.get((z, m)), zori.get((z, m)))
                for z, m in sorted(zhvi.keys() | zori.keys())]
        n = upsert_generic(conn, "zip_prices", ["zip", "month", "source_id", "zhvi", "zori"], rows, key="zip, month",
                           geom=False)
        conn.commit()
        run["rows"] = n
    return n


# ---------- Inside Airbnb ----------

ABNB_BASE = "https://data.insideairbnb.com/united-states/ma/boston/2026-09-19/data"
RAT_RE = re.compile(r"\b(rats?|mice|mouse|rodents?)\b", re.I)
# "rat" inside words never matches (\b); these are the remaining non-rodent uses seen in spot checks.
NOISE_RE = re.compile(
    r"\b(mouse ?pads?|computer mouse|wireless mouse|mouse and keyboard|keyboard and mouse|mickey mouse|"
    r"rat ?race|rat pack|gym rats?|mall rats?|lab rats?|museum rats?|beach rats?|"
    r"rat und tat|guten rat|einen rat|dem rat|ihren rat|seinen rat|"  # German "Rat" = advice
    r"cat and mouse|church mouse|quiet as a mouse|mouse ?click|"
    r"(?:laptop|usb) mouse|(?:very|really|so|super) mice|"  # typo for "nice"
    r"(?:no|never (?:saw|seen|had)|without)\s+(?:\w+\s+(?:or|and)\s+)?(?:rats?|mice|mouse|rodents?))\b",  # "no mice"
    re.I,
)
_TAGS = re.compile(r"<[^>]+>")


def _review_text(s: str) -> str:
    return re.sub(r"\s+", " ", _TAGS.sub(" ", html.unescape(s or ""))).strip()


def _is_rat_review(text: str) -> bool:
    return RAT_RE.search(NOISE_RE.sub(" ", text)) is not None


def _excerpt(text: str, limit: int = 200) -> str:
    m = RAT_RE.search(text)
    start = max(0, m.start() - 90)
    s = text[start:start + limit]
    if start > 0:
        s = "…" + s[1:]
    if start + limit < len(text):
        s = s[:-1] + "…"
    return s


def _scrub_names(text: str, names: list[str | None]) -> str:
    """Replace the reviewer's and host's names (each word of them) with [name]."""
    for n in names:
        for w in re.findall(r"[^\W\d_]{2,}", n or ""):
            if w.lower() not in ("and", "the", "by", "host", "inn", "home", "suites", "stay"):
                text = re.sub(rf"\b{re.escape(w)}\b", "[name]", text)
    return text


def airbnb(conn: psycopg.Connection) -> int:
    sid = "inside-airbnb-boston"
    db.upsert_source(conn, sid, "Inside Airbnb Boston (snapshot 2026-09-19)", "https://insideairbnb.com/get-the-data/",
                     "listings + reviews; rat mentions by keyword with a noise filter; no reviewer names kept")
    with db.ingest_run(conn, sid) as run:
        lpath = _cached(f"{ABNB_BASE}/listings.csv.gz", "airbnb/listings.csv.gz")
        rpath = _cached(f"{ABNB_BASE}/reviews.csv.gz", "airbnb/reviews.csv.gz")
        with gzip.open(lpath, "rt", newline="") as fh:
            listings = {r["id"]: r for r in csv.DictReader(fh)}
        counts: dict[str, int] = {}
        hits: dict[str, list[tuple[str, str]]] = {}
        newest = None
        with gzip.open(rpath, "rt", newline="") as fh:
            for r in csv.DictReader(fh):
                lid = r["listing_id"]
                counts[lid] = counts.get(lid, 0) + 1
                newest = max(newest or r["date"], r["date"])
                text = _review_text(r["comments"])
                if _is_rat_review(text):
                    names = [r["reviewer_name"], (listings.get(lid) or {}).get("host_name")]
                    hits.setdefault(lid, []).append((r["date"], _scrub_names(_excerpt(text), names)))
        rows = []
        for lid, r in listings.items():
            h = sorted(hits.get(lid, []), reverse=True)
            # Keep the table slim: every listing with a rat review, plus a stable 10% sample of the rest.
            if not counts.get(lid) or (not h and int(hashlib.md5(lid.encode()).hexdigest(), 16) % 10):
                continue
            price = to_float(re.sub(r"[$,]", "", r.get("price") or ""))
            rows.append((
                f"abnb:{lid}", sid, r.get("neighbourhood_cleansed") or None, price, counts[lid], len(h),
                jsonb([{"date": d, "excerpt": e} for d, e in h[:3]]),
                to_float(r["latitude"]), to_float(r["longitude"]),
            ))
        conn.execute("delete from listings where source_id = %s and not (id = any(%s))", (sid, [r[0] for r in rows]))
        n = upsert_generic(conn, "listings", ["id", "source_id", "neighbourhood", "price", "review_count",
                                              "rat_review_count", "rat_review_samples", "lat", "lon"], rows)
        conn.commit()
        run["rows"] = n
        run["newest"] = datetime.fromisoformat(newest) if newest else None
    return n


# ---------- iNaturalist ----------

INAT_URL = "https://api.inaturalist.org/v1/observations"


def inaturalist(conn: psycopg.Connection) -> int:
    sid = "inaturalist"
    db.upsert_source(conn, sid, "iNaturalist Rattus observations (Boston-Cambridge-Somerville bbox)",
                     "https://www.inaturalist.org/observations?taxon_name=Rattus",
                     "community observations; obscured points are fuzzed by iNaturalist; observer names not kept")
    with db.ingest_run(conn, sid) as run:
        rows, newest, page = [], None, 1
        while True:
            d = _get_json(INAT_URL, {"taxon_name": "Rattus", "nelat": 42.42, "nelng": -70.98, "swlat": 42.22,
                                     "swlng": -71.2, "per_page": 200, "page": page, "order_by": "id", "order": "asc"})
            for o in d["results"]:
                if not o.get("observed_on") or not o.get("location"):
                    continue
                lat, lon = (to_float(x) for x in o["location"].split(","))
                if not in_region(lat, lon):
                    continue
                opened = datetime.fromisoformat(o["observed_on"])
                taxon = (o.get("taxon") or {}).get("name")
                obscured = o.get("obscured") or o.get("geoprivacy") in ("obscured", "private")
                rows.append((
                    f"inat:{o['id']}", sid, "inat_rat", f"{taxon} ({o.get('quality_grade')})", "closed",
                    opened, None, None, None, None, None, None, lat, lon, "region",
                    "obscured" if obscured else "point",
                ))
                newest = max(newest, opened) if newest else opened
            if page * 200 >= d["total_results"] or not d["results"]:
                break
            page += 1
        n = upsert_incidents(conn, rows)
        # City from the tract polygon the point falls in; outside Boston/Cambridge/Somerville stays 'region'.
        conn.execute(
            """update incidents i set city = coalesce(
                 (select t.city from tracts t where st_intersects(t.geom, i.geom) limit 1), 'region')
               where i.source_id = %s""", (sid,))
        conn.commit()
        run["rows"], run["newest"] = n, newest
    return n


# ---------- City spending ----------

CHECKBOOK_PAGE = "https://data.boston.gov/dataset/checkbook-explorer"
# resource -> column-name separator (older tables use underscores). FY is derived from the Entered date,
# because the FY2023 table labels Jul-Oct 2022 as FY2022.
CHECKBOOK = {
    "5ce2ff98-3313-40d2-88bd-47eae9e5a654": "_",  # Jul 2022 - Jun 2023
    "0b7c9c5f-d1c2-46e7-b738-6ab37a110eef": " ",  # FY2024 (portal only has July 2023)
    "84dfc1af-28bd-4f17-804a-9cc0c09a237e": " ",  # FY2025
    "d22fdd5c-7e4c-41b7-a3eb-dfc57a87b245": " ",  # FY2026
}
PEST_VENDOR = re.compile(r"\b(pest|exterminat\w*|extermingating|terminix|orkin)\b", re.I)


def _fiscal_year(entered: str) -> int | None:
    s = str(entered)[:10]
    try:
        d = datetime.strptime(s, "%Y-%m-%d") if "-" in s else datetime.strptime(str(entered).split()[0], "%m/%d/%Y")
    except ValueError:
        return None
    return d.year + 1 if d.month >= 7 else d.year


def spending(conn: psycopg.Connection) -> int:
    sid = "boston-checkbook"
    db.upsert_source(conn, sid, "City of Boston Checkbook Explorer: pest-control vendor payments", CHECKBOOK_PAGE,
                     "vendor-name match (pest/exterminat*/Terminix/Orkin); lower bound; FY2024 table is incomplete")
    with db.ingest_run(conn, sid) as run:
        acc: dict[tuple[int, str, str], list] = {}
        for res, s in CHECKBOOK.items():
            v, dn, m = f'"Vendor{s}Name"', f'"Dept{s}Name"', f'"Monetary{s}Amount"'
            recs = ckan_sql(
                f'SELECT "Entered" e, {v} v, {dn} d, {m} a FROM "{res}" '
                f"WHERE {v} ILIKE '%pest%' OR {v} ILIKE '%extermin%' OR {v} ILIKE '%terminix%' OR {v} ILIKE '%orkin%'"
            )
            for r in recs:
                fy, amt = _fiscal_year(r["e"]), to_float(r["a"])
                if fy is None or amt is None or not (2023 <= fy <= 2026) or not PEST_VENDOR.search(r["v"] or ""):
                    continue
                k = (fy, (r["d"] or "").strip(), (r["v"] or "").strip())
                a = acc.setdefault(k, [0.0, 0])
                a[0] += amt
                a[1] += 1
        rows = [(
            f"fy{fy}:{re.sub(r'[^a-z0-9]+', '-', d.lower()).strip('-')}:{re.sub(r'[^a-z0-9]+', '-', v.lower()).strip('-')}",
            sid, fy, d or None, v, round(a, 2), n,
        ) for (fy, d, v), (a, n) in acc.items()]
        conn.execute("delete from spending where source_id = %s", (sid,))
        n = upsert_generic(conn, "spending", ["id", "source_id", "fiscal_year", "department", "vendor", "amount",
                                              "n_payments"], rows, geom=False)
        conn.commit()
        run["rows"] = n
    return n


def run(conn: psycopg.Connection, since: str | None = None) -> int:
    total = 0
    for fn in (tracts, zillow, airbnb, inaturalist, spending):  # tracts first: iNaturalist city uses them
        total += fn(conn)
    return total
