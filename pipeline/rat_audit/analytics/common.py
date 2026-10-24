"""Shared analytics helpers: projection, grid ids, dedupe, rank statistics, strength labels."""
from __future__ import annotations

import json
import math
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import numpy as np
from pyproj import Transformer
from scipy.stats import rankdata

BOSTON_TZ = ZoneInfo("America/New_York")
CELL_M = 250
SRID_M = 26986  # Massachusetts State Plane, meters
RECUR_MIN_DAYS = 1
RECUR_MAX_DAYS = 60
BULK_SAME_DAY = 5  # >= this many reports at one key on one date count as one (bulk load)

_to_m = Transformer.from_crs(4326, SRID_M, always_xy=True)
_to_ll = Transformer.from_crs(SRID_M, 4326, always_xy=True)


class MissingInput(RuntimeError):
    """A required table or source has no usable rows. `need` says exactly what to load."""

    def __init__(self, need: dict):
        self.need = need
        super().__init__(json.dumps(need))


def project(lon, lat):
    """lon/lat arrays (EPSG:4326) -> x/y meters (EPSG:26986)."""
    return _to_m.transform(np.asarray(lon, dtype=float), np.asarray(lat, dtype=float))


def unproject(x, y):
    return _to_ll.transform(np.asarray(x, dtype=float), np.asarray(y, dtype=float))


def cell_id(col: int, row: int) -> str:
    """Same scheme as rat_audit.model.grid: global 250 m lattice in EPSG:26986."""
    return f"g250_{col}_{row}"


def cell_ids_for(lon, lat) -> list[str | None]:
    lon = np.asarray(lon, dtype=float)
    lat = np.asarray(lat, dtype=float)
    out: list[str | None] = [None] * len(lon)
    ok = np.isfinite(lon) & np.isfinite(lat)
    if ok.any():
        x, y = project(lon[ok], lat[ok])
        cols = np.floor(x / CELL_M).astype(int)
        rows = np.floor(y / CELL_M).astype(int)
        for i, c, r in zip(np.flatnonzero(ok), cols, rows):
            out[i] = cell_id(int(c), int(r))
    return out


def local_date(ts: datetime | None) -> date | None:
    if ts is None:
        return None
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    return ts.astimezone(BOSTON_TZ).date()


@dataclass(frozen=True)
class Report:
    """One report; key is the private address hash, site_id is its 50 m cluster."""

    id: str
    key: str
    opened_at: datetime
    closed_at: datetime | None
    action_tag: str | None
    source_id: str
    site_id: str | None = None
    cause_tag: str = "none"
    note: str | None = None
    neighborhood: str | None = None

    @property
    def opened_day(self) -> date:
        return local_date(self.opened_at)

    @property
    def closed_day(self) -> date | None:
        return local_date(self.closed_at)


def dedupe_reports(reports: list[Report]) -> tuple[list[Report], dict]:
    """Drop exact duplicates, cases closed as `duplicate`, and collapse same-day bulk loads.

    - Same id twice: kept once.
    - Same key + identical opened_at timestamp: kept once (re-filed copy).
    - action_tag == 'duplicate': the note says it duplicates an open case; not a new report.
    - >= BULK_SAME_DAY reports at one key on one local date: counted as one (bulk load).
    Deterministic: the survivor is the smallest id. Returns (kept sorted by opened_at, id), stats.
    """
    stats = {"input": len(reports), "dup_id": 0, "dup_timestamp": 0, "tag_duplicate": 0, "bulk_collapsed": 0}
    by_id: dict[str, Report] = {}
    for r in sorted(reports, key=lambda r: r.id):
        if r.id in by_id:
            stats["dup_id"] += 1
            continue
        by_id[r.id] = r
    seen_ts: dict[tuple, Report] = {}
    for r in by_id.values():
        if r.action_tag == "duplicate":
            stats["tag_duplicate"] += 1
            continue
        k = (r.key, r.opened_at)
        if k in seen_ts:
            stats["dup_timestamp"] += 1
            continue
        seen_ts[k] = r
    groups: dict[tuple, list[Report]] = {}
    for r in seen_ts.values():
        groups.setdefault((r.key, r.opened_day), []).append(r)
    kept: list[Report] = []
    for g in groups.values():
        g.sort(key=lambda r: r.id)
        if len(g) >= BULK_SAME_DAY:
            stats["bulk_collapsed"] += len(g) - 1
            kept.append(g[0])
        else:
            kept.extend(g)
    kept.sort(key=lambda r: (r.opened_at, r.id))
    stats["kept"] = len(kept)
    return kept, stats


def recurrence_flags(reports: list[Report]) -> list[bool]:
    """For reports at ONE key sorted by opened_at: True if opened 1-60 days after an earlier closure.

    Days are local calendar days between the earlier report's closed_at and this report's opened_at.
    The first report can never be a recurrence, so sum(flags) <= len(reports) - 1.
    """
    flags: list[bool] = []
    closed_days: list[date] = []
    for r in reports:
        od = r.opened_day
        hit = any(RECUR_MIN_DAYS <= (od - cd).days <= RECUR_MAX_DAYS for cd in closed_days)
        flags.append(hit)
        if r.closed_day is not None:
            closed_days.append(r.closed_day)
    return flags


def pct_rank(values) -> np.ndarray:
    """Percentile in [0, 1] with ties sharing the average rank; a single value gets 1.0."""
    v = np.asarray(values, dtype=float)
    n = len(v)
    if n == 0:
        return v
    if n == 1:
        return np.ones(1)
    return (rankdata(v, method="average") - 1) / (n - 1)


def spearman(x, y) -> float:
    x = np.asarray(x, dtype=float)
    y = np.asarray(y, dtype=float)
    if len(x) < 3:
        return float("nan")
    rx, ry = rankdata(x), rankdata(y)
    if rx.std() == 0 or ry.std() == 0:
        return float("nan")
    return float(np.corrcoef(rx, ry)[0, 1])


def _residual(r, z):
    z = np.column_stack([np.ones(len(r)), z])
    beta, *_ = np.linalg.lstsq(z, r, rcond=None)
    return r - z @ beta


def partial_spearman(x, y, controls) -> float:
    """Spearman of x and y after removing the (ranked) controls from both by least squares."""
    x = np.asarray(x, dtype=float)
    y = np.asarray(y, dtype=float)
    if len(x) < 4:
        return float("nan")
    c = np.column_stack([rankdata(np.asarray(col, dtype=float)) for col in controls])
    ex, ey = _residual(rankdata(x), c), _residual(rankdata(y), c)
    if ex.std() == 0 or ey.std() == 0:
        return float("nan")
    return float(np.corrcoef(ex, ey)[0, 1])


def permutation_p(stat_fn, x, y, observed: float, n_perm: int = 999, seed: int = 20261024) -> float:
    """Two-sided permutation p for a correlation statistic (y shuffled; fixed seed = repeatable)."""
    if not math.isfinite(observed):
        return float("nan")
    rng = np.random.default_rng(seed)
    y = np.asarray(y)
    hits = 0
    for _ in range(n_perm):
        s = stat_fn(x, rng.permutation(y))
        if math.isfinite(s) and abs(s) >= abs(observed) - 1e-12:
            hits += 1
    return (hits + 1) / (n_perm + 1)


def strength(rho: float) -> str:
    """|rho| >= .5 strong, >= .3 moderate, >= .1 weak, else none (design.md §4)."""
    if rho is None or not math.isfinite(rho):
        return "none"
    a = abs(rho)
    return "strong" if a >= 0.5 else "moderate" if a >= 0.3 else "weak" if a >= 0.1 else "none"


def wilson(k: int, n: int, z: float = 1.96) -> tuple[float | None, float | None]:
    if n == 0:
        return None, None
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return max(0.0, c - h), min(1.0, c + h)


def r2(x, nd: int = 3):
    if x is None:
        return None
    x = float(x)
    return round(x, nd) if math.isfinite(x) else None


def jsonb(v) -> str:
    return json.dumps(v, default=str)


def days(n: int) -> timedelta:
    return timedelta(days=n)


def public_note(note):
    """Additional defense for copied CRM metadata and misspelled staff titles in public case summaries."""
    import re
    from ..ingest.common import scrub_note
    if not note:
        return None
    if re.search(r"Case Ref|Created by|Raised by|Allocated To|CRM service account", note, re.I):
        return "[Closure contains internal case metadata; use the logged reveal for the original.]"
    note = re.sub(r"\b(?i:inspectior|inspecter|insepctor|inspetor|inspector)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}",
                  "Inspector [staff]", note)
    return scrub_note(note)
