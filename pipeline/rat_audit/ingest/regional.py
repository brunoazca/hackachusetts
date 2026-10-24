"""Regional sources outside Boston: Somerville 311 (rodent + trash/dumping/dead-animal evidence), Cambridge
rodent sightings, Cambridge service requests (trash/dumping/dead-animal evidence), Cambridge smart rat boxes.

Somerville 311 has no coordinates, only a 2020 census block GEOID; each request is placed at its
block centroid (TIGERweb, cached) with geo_precision='block_centroid'. Cambridge sightings carry
points, a street address and a free-text description: the full address and raw text go to
`private.incident_details`; the public row keeps the street and a scrubbed note.
"""
from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import psycopg

from .. import db
from .common import (
    _get_json, address_block, address_key, in_region, jsonb, parse_local_ts, scrub_note, since_cutoff,
    socrata_paged, to_float, type_map, upsert_generic, upsert_incidents, upsert_private_details, zip5,
)

START = "2023-01-01"  # same backfill window as Boston 311
CACHE = Path(__file__).resolve().parents[3] / ".cache" / "raw"
TIGER_BLOCKS = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Census2020/MapServer/10/query"

SOM_DOMAIN, SOM_DATASET = "data.somervillema.gov", "4pyi-uqq6"
CAM_DOMAIN, CAM_SIGHTINGS, CAM_BOXES = "data.cambridgema.gov", "uz4w-baz5", "78bs-b5ig"
CAM_ALL = "2z9k-mv9g"  # all Commonwealth Connect service requests; evidence types mapped in categories.json
MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september",
          "october", "november", "december"]


# ---------- free-text privacy (resident descriptions name their own house numbers and phones) ----------

_SUFFIX = (r"(?:st|street|ave|avenue|rd|road|pl|place|ct|court|ter|terrace|way|dr|drive|sq|square|pk|park|"
           r"ln|lane|blvd|boulevard|hwy|pkwy|parkway|row|cir|circle|hl|hill)\b")
_HOUSE_NO = re.compile(r"\b\d{1,5}[A-Za-z]?(?:\s*[-–&]\s*\d{1,5}[A-Za-z]?)?\s+(?=(?:[A-Za-z][\w'.]*\s+){0,3}" + _SUFFIX + ")", re.I)
_HOUSE_NO_AT = re.compile(r"\b(at|near|behind|outside|front of|across from)\s+\d{1,5}[A-Za-z]?(?:\s*-\s*\d{1,5})?\s+(?=[A-Za-z])", re.I)
_PHONE = re.compile(r"\(?\b\d{3}\)?[-.\s]?\d{3}[-.\s]\d{4}\b")


def scrub_text(s: str | None) -> str | None:
    if not s:
        return None
    s = re.sub(r"\s+", " ", s).strip()
    s = _PHONE.sub("[phone]", s)
    s = _HOUSE_NO.sub("", s)
    s = _HOUSE_NO_AT.sub(lambda m: m.group(1) + " ", s)
    return scrub_note(s)


# ---------- Somerville 311 ----------

def _block_centroids(geoids: set[str]) -> dict[str, tuple[float, float]]:
    """GEOID -> (lat, lon) from TIGERweb 2020 blocks, cached on disk."""
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / "somerville_block_centroids.json"
    cache: dict[str, list[float]] = json.loads(path.read_text()) if path.exists() else {}
    missing = sorted(g for g in geoids if g not in cache)
    for i in range(0, len(missing), 100):
        batch = missing[i:i + 100]
        d = _get_json(TIGER_BLOCKS, {
            "where": "GEOID IN (" + ",".join(f"'{g}'" for g in batch) + ")",
            "outFields": "GEOID,CENTLAT,CENTLON", "returnGeometry": "false", "f": "json",
        })
        for f in d.get("features", []):
            a = f["attributes"]
            cache[a["GEOID"]] = [float(a["CENTLAT"]), float(a["CENTLON"])]
    if missing:
        path.write_text(json.dumps(cache))
    return {g: tuple(v) for g, v in cache.items()}


def _somerville(conn: psycopg.Connection, cutoff) -> int:
    sid = "somerville-311"
    db.upsert_source(conn, sid, "Somerville 311 service requests", f"https://{SOM_DOMAIN}/d/{SOM_DATASET}",
                     "rodent + trash/dumping/dead-animal types; located at 2020 census block centroid (TIGERweb)")
    tmap = type_map("somerville-311")
    since = cutoff.strftime("%Y-%m-%dT%H:%M:%S") if cutoff else START
    where = "type in (" + ",".join("'" + t.replace("'", "''") + "'" for t in tmap) + f") and date_created >= '{since}'"
    raw = [r for page in socrata_paged(SOM_DOMAIN, SOM_DATASET, where,
                                      "id,type,date_created,most_recent_status,most_recent_status_date,block_code")
           for r in page]
    cents = _block_centroids({r["block_code"] for r in raw if r.get("block_code")})
    rows, newest = [], None
    with db.ingest_run(conn, sid) as run:
        for r in raw:
            opened = parse_local_ts(r.get("date_created"))
            if opened is None:
                continue
            lat, lon = cents.get(r.get("block_code") or "", (None, None))
            if not in_region(lat, lon):
                lat = lon = None
            closed = (r.get("most_recent_status") or "").lower() in ("closed", "resolved")
            rows.append((
                f"som311:{r['id']}", sid, tmap[r["type"]], r["type"].strip(), "closed" if closed else "open",
                opened, parse_local_ts(r.get("most_recent_status_date")) if closed else None,
                None, None, None, None, None, lat, lon, "somerville", "block_centroid",
            ))
            newest = max(newest, opened) if newest else opened
        run["rows"], run["newest"] = upsert_incidents(conn, rows), newest
        conn.commit()
    return len(rows)


# ---------- Cambridge rodent sightings ----------

# Cut at the city name, but not when it is the street ("1126 Cambridge St", "Somerville Ave").
_CITY_CUT = re.compile(
    r"\s+(?:cambridge|ケンブリッジ|somerville|boston)\b(?!\s+(?:st|street|ave|avenue|rd|road|pl|place|ter|terrace|pk|park|sq|square|hwy|ct)\b)|,",
    re.I,
)
_COORDS = re.compile(r"^\s*-?\d+\.\d+[,\s]+-?\d+\.\d+\s*$")


def _cam_address(full: str | None) -> tuple[str | None, str | None, str | None]:
    """'1–99 King St Cambridge MA 02140, United States' -> (normalized full address, '1-99 King St', '02140').

    The portal mixes several geocoder formats (and sometimes raw coordinates)."""
    if not full or _COORDS.match(full):
        return None, None, None
    full = full.replace("\u2013", "-").replace("\u2014", "-")
    street = _CITY_CUT.split(full, maxsplit=1)[0].strip() or None
    if street and re.fullmatch(r"[\d\s\-–&A-Za-z]{0,8}", street) and not re.search(r"[A-Za-z]{3}", street):
        street = None  # only a house number left: never publish it
    zips = re.findall(r"(?<![\d.])\d{5}(?![\d.])", full)
    return full, street, zip5(zips[-1]) if zips else None


def _cambridge_sightings(conn: psycopg.Connection, cutoff) -> int:
    sid = "cambridge-rodent-sightings"
    db.upsert_source(conn, sid, "Cambridge Commonwealth Connect rodent sightings",
                     f"https://{CAM_DOMAIN}/d/{CAM_SIGHTINGS}", "resident reports; internal work orders excluded")
    since = cutoff.strftime("%Y-%m-%dT%H:%M:%S") if cutoff else START
    # refresh also re-reads tickets updated in the window, so closures are picked up
    where = f"ticket_created_date_time >= '{since}'" + (f" or ticket_last_updated_date_time >= '{since}'" if cutoff else "")
    rows, private, newest = [], [], None
    with db.ingest_run(conn, sid) as run:
        for page in socrata_paged(CAM_DOMAIN, CAM_SIGHTINGS, where):
            for r in page:
                opened = parse_local_ts(r.get("ticket_created_date_time"))
                if opened is None:
                    continue
                lat, lon = to_float(r.get("lat")), to_float(r.get("lng"))
                if not in_region(lat, lon):
                    lat = lon = None
                full, street, z = _cam_address((r.get("address") or "").strip())
                title = (r.get("issue_type") or "").strip()
                desc = (r.get("issue_description") or "").strip()
                raw_note = " — ".join(x for x in (title if title != "Rodent Sighting" else "", desc) if x) or None
                status = (r.get("ticket_status") or "").lower()
                iid = f"camrod:{r['ticket_id']}"
                rows.append((
                    iid, sid, "rodent", "Rodent Sighting", "closed" if status in ("closed", "archived") else "open",
                    opened, parse_local_ts(r.get("ticket_closed_date_time")),
                    address_block(street, z), address_key(full, "cambridge"), z, None, scrub_text(raw_note),
                    lat, lon, "cambridge", "point",
                ))
                private.append((iid, full, raw_note, sid))
                newest = max(newest, opened) if newest else opened
        upsert_incidents(conn, rows)
        upsert_private_details(conn, private)
        run["rows"], run["newest"] = len(rows), newest
        conn.commit()
    return len(rows)


# ---------- Cambridge evidence (trash, dumping, dead animals) ----------

def _cambridge_evidence(conn: psycopg.Connection, cutoff) -> int:
    """Evidence types from all Commonwealth Connect requests. No free text kept (saves space; not needed)."""
    sid = "cambridge-311"
    db.upsert_source(conn, sid, "Cambridge Commonwealth Connect service requests (trash, dumping, dead animals)",
                     f"https://{CAM_DOMAIN}/d/{CAM_ALL}", "evidence types only; rodent sightings come from uz4w-baz5")
    tmap = type_map("cambridge-311")
    since = cutoff.strftime("%Y-%m-%dT%H:%M:%S") if cutoff else START
    types = ",".join("'" + t.replace("'", "''") + "'" for t in tmap)
    where = f"issue_type in ({types}) and (ticket_created_date_time >= '{since}'" + (
        f" or ticket_last_updated_date_time >= '{since}')" if cutoff else ")")
    rows, newest = [], None
    with db.ingest_run(conn, sid) as run:
        for page in socrata_paged(CAM_DOMAIN, CAM_ALL, where,
                                  "ticket_id,issue_type,ticket_status,ticket_created_date_time,ticket_closed_date_time,address,lat,lng"):
            for r in page:
                opened = parse_local_ts(r.get("ticket_created_date_time"))
                if opened is None or r.get("issue_type") not in tmap:
                    continue
                lat, lon = to_float(r.get("lat")), to_float(r.get("lng"))
                if not in_region(lat, lon):
                    lat = lon = None
                full, street, z = _cam_address((r.get("address") or "").strip())
                status = (r.get("ticket_status") or "").lower()
                rows.append((
                    f"cam311:{r['ticket_id']}", sid, tmap[r["issue_type"]], r["issue_type"],
                    "closed" if status in ("closed", "archived") else "open",
                    opened, parse_local_ts(r.get("ticket_closed_date_time")),
                    address_block(street, z), address_key(full, "cambridge"), z, None, None, lat, lon, "cambridge", "point",
                ))
                newest = max(newest, opened) if newest else opened
        run["rows"], run["newest"] = upsert_incidents(conn, rows), newest
        conn.commit()
    return len(rows)


# ---------- Cambridge smart rat boxes ----------

def _cambridge_boxes(conn: psycopg.Connection) -> int:
    """Deployment records with catch counts, not a rat census. Future and blank months are omitted, not zero."""
    sid = "cambridge-smart-rat-boxes"
    db.upsert_source(conn, sid, "Cambridge smart rat boxes", f"https://{CAM_DOMAIN}/d/{CAM_BOXES}",
                     "Modern Pest devices; serials are reused across deployments; no install date")
    now = datetime.now(timezone.utc)
    rows = []
    with db.ingest_run(conn, sid) as run:
        for page in socrata_paged(CAM_DOMAIN, CAM_BOXES):
            for r in page:
                lat, lon = to_float(r.get("latitude")), to_float(r.get("longitude"))
                if not in_region(lat, lon):
                    lat = lon = None
                monthly = {}
                for i, m in enumerate(MONTHS, start=1):
                    v = r.get(f"{m}_2026")
                    if (2026, i) <= (now.year, now.month) and v not in (None, ""):
                        monthly[f"2026-{i:02d}"] = int(float(v))
                annual = {k: int(float(r[f"total_{k}"])) for k in ("2023", "2024", "2025", "2026") if r.get(f"total_{k}") not in (None, "")}
                key = hashlib.sha1(f"{r.get('device_name')}|{r.get('address')}".encode()).hexdigest()[:8]
                rows.append((
                    f"smartbox:{r['serial_number']}:{key}", sid, "smart_box", f"Smart rat {(r.get('device_type') or 'device').lower()}",
                    address_block(r.get("address"), None), None, None,
                    jsonb({
                        "device_type": r.get("device_type"), "active": bool(r.get("active_site")),
                        "label": scrub_text(r.get("device_name")),
                        "total_since_install": int(float(r["total_since_install"])) if r.get("total_since_install") else None,
                        "prior_to_2023": int(float(r["prior_to_2023"])) if r.get("prior_to_2023") else None,
                        "annual_catches": annual, "monthly_catches": monthly,
                        "participatory_budgeting": r.get("participatory_budgeting") == "Yes",
                        "note": "Current month is partial; months after it and blank months are omitted, not zero.",
                    }),
                    lat, lon, "cambridge",
                ))
        n = upsert_generic(conn, "places", ["id", "source_id", "kind", "name", "address_block", "starts_at", "ends_at",
                                            "attrs", "lat", "lon", "city"], rows)
        run["rows"] = n
        conn.commit()
    return n


def run(conn: psycopg.Connection, since: str | None = None) -> int:
    cutoff = since_cutoff(since)
    total = _somerville(conn, cutoff) + _cambridge_sightings(conn, cutoff) + _cambridge_evidence(conn, cutoff)
    return total + _cambridge_boxes(conn)
