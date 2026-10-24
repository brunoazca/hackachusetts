"""Shared ingest helpers: source APIs, address privacy, note scrubbing, bulk upsert."""
from __future__ import annotations

import hashlib

import json
import os
import re
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import psycopg
import requests

BOSTON_TZ = ZoneInfo("America/New_York")
CKAN = "https://data.boston.gov/api/3/action/datastore_search_sql"
_session = requests.Session()
_session.headers["User-Agent"] = "rat-audit-boston (hackathon; civic research)"


# ---------- categories ----------

def categories() -> dict:
    here = Path(__file__).resolve()
    for p in (here.parents[3] / "contracts" / "categories.json", Path("/root/contracts/categories.json")):
        if p.exists():
            return json.loads(p.read_text())
    raise FileNotFoundError("contracts/categories.json not found")


def type_map(source_key: str) -> dict[str, str]:
    """{source type string -> category id} for one source key ('311', 'somerville-311', ...)."""
    out: dict[str, str] = {}
    for cat, spec in categories()["incident_categories"].items():
        for t in spec.get("sources", {}).get(source_key, []):
            out[t] = cat
    return out


# ---------- HTTP ----------

def _get_json(url: str, params: dict | None = None, headers: dict | None = None, tries: int = 4) -> object:
    for i in range(tries):
        try:
            r = _session.get(url, params=params, headers=headers, timeout=240)
            r.raise_for_status()
            return r.json()
        except Exception:  # noqa: BLE001 - retry any transport/server error
            if i == tries - 1:
                raise
            time.sleep(5 * (i + 1))
    raise RuntimeError("unreachable")


def ckan_sql(sql: str) -> list[dict]:
    d = _get_json(CKAN, {"sql": sql})
    if not d.get("success"):
        raise RuntimeError(str(d)[:300])
    return d["result"]["records"]


def ckan_paged(table: str, columns: str, where: str, page: int = 30000):
    """Yield pages of rows from an Analyze Boston datastore table, ordered by _id."""
    offset = 0
    while True:
        rows = ckan_sql(f'SELECT {columns} FROM "{table}" WHERE {where} ORDER BY _id LIMIT {page} OFFSET {offset}')
        if not rows:
            return
        yield rows
        if len(rows) < page:
            return
        offset += page


def socrata_paged(domain: str, dataset: str, where: str | None = None, select: str | None = None, page: int = 50000):
    headers = {}
    if tok := os.environ.get("SOCRATA_APP_TOKEN"):
        headers["X-App-Token"] = tok
    offset = 0
    while True:
        params = {"$limit": page, "$offset": offset, "$order": ":id"}
        if where:
            params["$where"] = where
        if select:
            params["$select"] = select
        rows = _get_json(f"https://{domain}/resource/{dataset}.json", params, headers)
        if not rows:
            return
        yield rows
        if len(rows) < page:
            return
        offset += page


# ---------- parsing ----------

def parse_local_ts(s: str | None) -> datetime | None:
    """Analyze Boston timestamps are local Boston time without an offset."""
    if not s or s in ("None", "NaT"):
        return None
    s = s.strip().replace("T", " ")
    if "+" in s[10:] or s.endswith("Z"):
        return datetime.fromisoformat(s.replace("Z", "+00:00")).astimezone(timezone.utc)
    s = s.split(".")[0]
    try:
        dt = datetime.strptime(s, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        dt = datetime.strptime(s[:10], "%Y-%m-%d")
    return dt.replace(tzinfo=BOSTON_TZ).astimezone(timezone.utc)


def to_float(v) -> float | None:
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    return f if f == f else None


def in_region(lat: float | None, lon: float | None) -> bool:
    """Boston + Cambridge + Somerville bounding box."""
    return lat is not None and lon is not None and 42.22 < lat < 42.42 and -71.20 < lon < -70.98


def zip5(z) -> str | None:
    if z in (None, "", "None"):
        return None
    digits = re.sub(r"\D", "", str(z))
    return digits.zfill(5)[:5] if digits else None


def since_cutoff(since: str | None) -> datetime | None:
    """'14d' -> now - 14 days; ISO date -> that date; None -> no cutoff."""
    if not since:
        return None
    if m := re.fullmatch(r"(\d+)d", since):
        return datetime.now(timezone.utc) - timedelta(days=int(m.group(1)))
    return datetime.fromisoformat(since).replace(tzinfo=timezone.utc)


# ---------- privacy ----------

_NUM = re.compile(r"^\s*(?:\d+[A-Za-z]?(?:\s*-\s*\d+[A-Za-z]?)?|\d+\s*1/2)\s+")
_WS = re.compile(r"\s+")


def street_only(street_with_number: str | None) -> str | None:
    """'133-135 Chiswick Rd' -> 'Chiswick Rd'. Intersections stay as they are."""
    if not street_with_number or street_with_number == "None":
        return None
    s = _WS.sub(" ", street_with_number.replace("&amp;", "&")).strip()
    s = _NUM.sub("", s)
    return s.title() if s.isupper() else s


def address_block(street_with_number: str | None, zip_code: str | None) -> str | None:
    st = street_only(street_with_number)
    if not st:
        return None
    return f"{st}, {zip_code}" if zip_code else st


def address_key(full_address: str | None, city: str = "boston") -> str | None:
    if not full_address or full_address == "None":
        return None
    norm = _WS.sub(" ", full_address.replace("&amp;", "&").upper()).strip()
    if norm.startswith("INTERSECTION"):
        return None  # intersections are not addresses; don't group them as chronic sites
    return hashlib.sha256(f"{city}|{norm}".encode()).hexdigest()


# Emails, including the malformed ones staff type ("first.last@ boston.gov", "first.last@boston gov").
_EMAIL = re.compile(r"[\w.+-]+\s*@\s*[\w-]+(?:\s*\.\s*[\w-]+|\s+(?:gov|com|org|net|edu)\b)+", re.I)
_DOTTED_NAME = re.compile(r"\b[a-z]+\.[a-z]+(?=\s*(?:@|boston\.?\s*gov))", re.I)
_PHONE = re.compile(r"(?:\b1[-. ])?\(?\b\d{3}\)?[-. ]\d{3}[-. ]\d{4}")
_AT_NUM = re.compile(r"@\s*\d+[A-Za-z]?\b(?!\s*(?:[ap]\.?m|:))", re.I)
_STAFF_TAIL = re.compile(r"\[staff\]\s*@\s*\S+")
_PREFIX = re.compile(
    r"^(?:Case (?:Closed|Resolved|Noted)\.?\s*)?"
    r"(?:Closed date\s*:\s*(?:\w{3} \w{3} \d{1,2} [\d:]+ \w{3} \d{4}|\d{4}-\d{2}-\d{2} [\d:.]+))?\s*"
    r"(?:Case (?:Noted|Resolved|Closed)\.?|Noted|Resolved)?\s*", re.I)
_SIGNOFF = re.compile(r"(?:[-–—,]\s*|\s{2,}|\.\s+)(?:Inspector\s+)?[A-Z][a-z]+(?:\s+[A-Z]\.?)?(?:\s+[A-Z][a-z]+)?\s*$")
_TITLE_NAME = re.compile(r"\b((?i:inspector|insp\.|officer|director|supervisor|commissioner|sgt\.?|lt\.?|captain|mr\.|ms\.|mrs\.))\s+[A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+)?")
# House numbers inside free text ("6/8 Webley", "24-26 Armington st"): any number right before a capitalized word.
_HOUSE_NUM = re.compile(r"\b\d+[A-Za-z]?(?:\s*[/&-]?\s*\d+[A-Za-z]?)*(?=\s+[A-Z][a-z])")


def clean_note(raw: str | None) -> str | None:
    """Drop the 311 boilerplate prefix; keep the inspector's note."""
    if not raw or raw == "None":
        return None
    s = _WS.sub(" ", raw.replace("&amp;", "&")).strip()
    s = _PREFIX.sub("", s).strip()
    return s or None


def scrub_note(note: str | None) -> str | None:
    """Public version of a closure note: no emails, no staff names."""
    if not note:
        return None
    s = _EMAIL.sub("[staff]", note)
    s = _DOTTED_NAME.sub("[staff]", s)
    s = _PHONE.sub("[phone]", s)
    s = _AT_NUM.sub("@ #", s)
    s = _TITLE_NAME.sub(lambda m: m.group(1) + " [staff]", s)
    s = _HOUSE_NUM.sub("#", s)
    s = _STAFF_TAIL.sub("[staff]", s)
    s = _SIGNOFF.sub("", s).strip()
    return s or None


# ---------- database ----------

INCIDENT_COLS = [
    "id", "source_id", "category", "subtype", "status", "opened_at", "closed_at", "address_block", "address_key",
    "zip", "neighborhood", "closure_note", "lat", "lon", "city", "geo_precision",
]


def _copy_rows(conn: psycopg.Connection, temp: str, cols: list[str], rows: list[tuple]) -> None:
    with conn.cursor().copy(f"COPY {temp} ({', '.join(cols)}) FROM STDIN") as cp:
        for r in rows:
            cp.write_row(r)


def upsert_incidents(conn: psycopg.Connection, rows: list[tuple]) -> int:
    """Bulk upsert into incidents. Never touches action_tag/action_confidence (analytics owns them)."""
    if not rows:
        return 0
    conn.execute("create temp table if not exists _inc (like incidents including defaults) on commit drop")
    _copy_rows(conn, "_inc", INCIDENT_COLS, rows)
    upd = ", ".join(f"{c} = excluded.{c}" for c in INCIDENT_COLS if c != "id")
    conn.execute(
        f"""insert into incidents ({', '.join(INCIDENT_COLS)}, geom)
            select {', '.join(INCIDENT_COLS)},
                   case when lat is not null then st_setsrid(st_makepoint(lon, lat), 4326)::geography end
            from _inc
            on conflict (id) do update set {upd}, geom = excluded.geom
            where (incidents.status, incidents.closed_at, incidents.closure_note, incidents.category, incidents.lat)
                  is distinct from (excluded.status, excluded.closed_at, excluded.closure_note, excluded.category, excluded.lat)"""
    )
    conn.execute("drop table if exists _inc")
    return len(rows)


def upsert_private_details(conn: psycopg.Connection, rows: list[tuple]) -> None:
    """rows: (incident_id, full_address, closure_note_raw, source_id)."""
    if not rows:
        return
    conn.execute("create temp table if not exists _det (like private.incident_details) on commit drop")
    _copy_rows(conn, "_det", ["incident_id", "full_address", "closure_note_raw", "source_id"], rows)
    conn.execute(
        """insert into private.incident_details select * from _det
           on conflict (incident_id) do update set full_address = excluded.full_address,
             closure_note_raw = excluded.closure_note_raw, source_id = excluded.source_id
           where (incident_details.full_address, incident_details.closure_note_raw)
                 is distinct from (excluded.full_address, excluded.closure_note_raw)"""
    )
    conn.execute("drop table if exists _det")


def upsert_generic(conn: psycopg.Connection, table: str, cols: list[str], rows: list[tuple], key: str = "id",
                   geom: bool = True) -> int:
    """Bulk upsert for places/events/listings/etc. Adds geom from lat/lon when the table has one."""
    if not rows:
        return 0
    tmp = f"_tmp_{table.replace('.', '_')}"
    conn.execute(f"create temp table if not exists {tmp} (like {table} including defaults) on commit drop")
    _copy_rows(conn, tmp, cols, rows)
    sel = ", ".join(cols)
    ins_cols = sel
    if geom:
        ins_cols += ", geom"
        sel += ", case when lat is not null then st_setsrid(st_makepoint(lon, lat), 4326)::geography end"
    keys = [k.strip() for k in key.split(",")]
    upd = ", ".join(f"{c} = excluded.{c}" for c in cols if c not in keys)
    if geom:
        upd += ", geom = excluded.geom"
    conn.execute(
        f"insert into {table} ({ins_cols}) select {sel} from {tmp} "
        f"on conflict ({key}) do update set {upd} "
        f"where ({', '.join(table.split('.')[-1] + '.' + c for c in cols if c not in keys)}) "
        f"is distinct from ({', '.join('excluded.' + c for c in cols if c not in keys)})"
    )
    conn.execute(f"drop table if exists {tmp}")
    return len(rows)


def jsonb(v) -> str:
    return json.dumps(v, default=str)


