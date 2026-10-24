"""Task 2.3: chronic `sites` with score, recurrence, drivers, building, recommendations (R3.2, R3.9-R3.11).

- Rodent reports 2024-2026 at one `address_key`, after dedupe (see common.dedupe_reports).
- Recurrence: a report opened 1-60 local days after an earlier report at the key was closed.
- A key is a site with >= MIN_REPORTS reports or >= MIN_RECURRENCES recurrences.
- Score = 100 x (0.5 pct(recurrences) + 0.3 pct(reports) + 0.2 pct(recency)), clipped to 0-100.
  Percentiles share ties; recency is measured from the newest report in the data, not the clock,
  so a re-run on the same data gives the same scores. Rank breaks score ties by recurrences,
  reports, last report, then id; it is never adjusted by hand.
- Drivers: other incidents and places within 100 m during [first report - 30 days, last report].
- Building: nearest parcel point within 30 m. Adjacent vacant: a vacant-land parcel within 40 m that
  is not the site's own parcel (parcel points are centroids, so this is approximate).
- `summary` keys starting with `recur_` belong to the recurrence model and are kept on upsert.
"""
from __future__ import annotations

import statistics
from collections import Counter, defaultdict
from datetime import date, datetime

import numpy as np
import psycopg
from scipy.spatial import cKDTree

from ..ingest.common import categories
from .common import (
    MissingInput, Report, dedupe_reports, days, jsonb, local_date, pct_rank, project, recurrence_flags,
)

MIN_REPORTS = 3
MIN_RECURRENCES = 1
WEIGHTS = {"recurrences": 0.5, "reports": 0.3, "recency": 0.2}
DRIVER_RADIUS_M = 100
DRIVER_LEAD_DAYS = 30
BUILDING_RADIUS_M = 30
VACANT_RADIUS_M = 40
MAX_IDS = 20
SOFT_ACTIONS = {"monitoring", "inspection", "closed_no_action"}  # "noted" arrives as closed_no_action
TRASH_DUMPING = {"trash_storage", "dumping", "ce_trash_storage", "ce_dumping"}
SITE_SINCE = "2024-01-01"

REFS = {
    "nyc_containerization": {
        "label": "NYC DSNY: 311 rat sightings down >20% year over year with trash containerization; "
                 "-55% in the Hamilton Heights pilot zone",
        "url": "https://www.nyc.gov/site/dsny/news/25-039/nyc-rats-fleeing-an-incredible-12-straight-months-",
        "kind": "government",
    },
    "boston_pb_containers": {
        "label": "Boston participatory budgeting: $500,000 rat-prevention project (rodent-proof containers)",
        "url": "https://www.boston.gov/departments/participatory-budgeting/rat-prevention-initiatives-dense-residential-areas",
        "kind": "government",
    },
}
RESEARCH_WHAT_WORKED = ("Kiro Crew campaign 93c1ad29 (2025 closures): the share of addresses with a new report "
                        "within 60 days did not change after monitoring (14.1% -> 14.2%) and fell after a violation "
                        "(15.3% -> 12.2%). Observational.")


# ---------------------------------------------------------------- scoring

def score_sites(stats: list[dict]) -> list[dict]:
    """stats: [{id, report_count, recurrence_count, days_since_last}] -> same dicts + score, rank. Pure."""
    if not stats:
        return []
    rec = pct_rank([s["recurrence_count"] for s in stats])
    rep = pct_rank([s["report_count"] for s in stats])
    new = pct_rank([-s["days_since_last"] for s in stats])
    for s, a, b, c in zip(stats, rec, rep, new):
        raw = 100 * (WEIGHTS["recurrences"] * a + WEIGHTS["reports"] * b + WEIGHTS["recency"] * c)
        s["score"] = float(round(min(100.0, max(0.0, raw)), 2))
    order = sorted(stats, key=lambda s: (-s["score"], -s["recurrence_count"], -s["report_count"],
                                         s["days_since_last"], s["id"]))
    for i, s in enumerate(order, 1):
        s["rank"] = i
    return order


def site_id(key: str) -> str:
    return f"site_{key[:16]}"


def group_sites(reports: list[Report], as_of: date) -> tuple[list[dict], dict]:
    """Pure: dedupe, group by key, recurrence, filter chronic, score + rank."""
    kept, dd = dedupe_reports(reports)
    by_key: dict[str, list[Report]] = defaultdict(list)
    for r in kept:
        by_key[r.key].append(r)
    stats = []
    for key, rs in by_key.items():
        flags = recurrence_flags(rs)
        n, k = len(rs), sum(flags)
        if n < MIN_REPORTS and k < MIN_RECURRENCES:
            continue
        stats.append({
            "id": site_id(key), "key": key, "reports": rs, "flags": flags, "report_count": n,
            "recurrence_count": k, "days_since_last": (as_of - rs[-1].opened_day).days,
        })
    return score_sites(stats), dd


# ---------------------------------------------------------------- recommendations

def recommend(site: dict, drivers: list[dict], building: dict | None, adjacent: dict | None,
              outcomes: dict | None, labels: dict) -> list[dict]:
    """Rules from the research first (escalate, adjacent lot, containers), then the driver table. Pure."""
    recs: list[dict] = []
    src = sorted({r.source_id for r in site["reports"]})
    tags = [r.action_tag for r in site["reports"] if r.closed_at is not None and r.action_tag]
    last = tags[-2:]
    actions = labels["actions"]

    def add(rule, action, tag, because, evidence=None, refs=(), source_ids=None):
        recs.append({
            "id": f"{site['id']}:{rule}", "rule": rule, "action": action, "action_tag": tag,
            "owner": actions.get(tag, {}).get("owner", "ISD") if tag else "ISD",
            "because": because, "evidence": evidence or {}, "source_ids": source_ids or src,
            "references": [REFS[r] for r in refs],
        })

    # (1) R3.9 escalate when soft actions keep failing.
    if site["recurrence_count"] >= 2 and last and all(t in SOFT_ACTIONS for t in last):
        because = [f"{site['recurrence_count']} reports came back within 60 days of a closure here.",
                   f"The last {len(last)} closures were " + ", ".join(actions.get(t, {}).get("label", t) for t in last)
                   + "."]
        ev = {"last_actions": last}
        if outcomes:
            m, c = outcomes.get("monitoring"), outcomes.get("citation")
            if m and c and m.get("n") and c.get("n"):
                overlap = (m.get("ci_low") is not None and c.get("ci_low") is not None
                           and m["ci_low"] <= c["ci_high"] and c["ci_low"] <= m["ci_high"])
                because.append(f"Citywide in this data, {m['recur_60d_pct']}% of monitoring closures were followed by "
                               f"a new report within 60 days (n={m['n']}), vs {c['recur_60d_pct']}% after a citation "
                               f"(n={c['n']})"
                               + ("; the intervals overlap, so this data cannot separate the two. " if overlap else ". ")
                               + "Association, not effect.")
                ev["outcomes"] = {"monitoring": m["recur_60d_pct"], "citation": c["recur_60d_pct"]}
        because.append(RESEARCH_WHAT_WORKED)
        add("escalate", "Escalate: issue a citation or an abatement order instead of another monitoring closure",
            "citation", because, ev)
    # (2) R3.10 adjacent vacant parcel -> block-level visit.
    if adjacent:
        add("adjacent_lot", "Joint block visit: clear and bait the adjacent vacant parcel and notify that owner",
            "abatement_order",
            [f"A vacant-land parcel ({adjacent['land_use']}) lies about {adjacent['distance_m']} m from this address.",
             "Acting only at the reported address leaves the likely harborage next door untouched."],
            {"adjacent_vacant": adjacent}, source_ids=sorted(set(src) | {adjacent["source_id"]}))
    # (3) R3.11 trash storage / dumping dominate.
    inc = {d["category"]: d for d in drivers if d["type"] == "incident" and d["category"] != "rodent"}
    total = sum(d["count"] for d in inc.values())
    td = sum(d["count"] for c, d in inc.items() if c in TRASH_DUMPING)
    if td >= 3 and total and td / total >= 0.5:
        add("containers", "Sealed, rat-resistant containers for the block",
            "barrels",
            [f"{td} of {total} nearby driver reports ({round(100 * td / total)}%) are improper trash storage or "
             "dumping."],
            {"trash_dumping": td, "drivers_total": total}, refs=("nyc_containerization", "boston_pb_containers"),
            source_ids=sorted(set(src) | {s for c, d in inc.items() if c in TRASH_DUMPING for s in d["source_ids"]}))
    # (4) driver -> action table (knowledge/27_rat_signals_brainstorm.md §4).
    pl = {d["kind"]: d for d in drivers if d["type"] == "place"}
    if "trash_early" in inc and "containers" not in {r["rule"] for r in recs}:
        add("trash_early", "Warning, then fine, for barrels out early; deliver rat-resistant barrels", "warning",
            [f"{inc['trash_early']['count']} 'trash placed out early' reports within 100 m."],
            source_ids=sorted(set(src) | set(inc["trash_early"]["source_ids"])))
    for cat in ("dumpster", "ce_overfill"):
        if cat in inc:
            add("dumpster", "Order a compactor or more pickups for the overflowing dumpster", "warning",
                [f"{inc[cat]['count']} '{labels['incident'].get(cat, cat)}' records within 100 m."],
                source_ids=sorted(set(src) | set(inc[cat]["source_ids"])))
            break
    if "restaurant" in pl:
        add("restaurant", "Re-inspect the cited food business and ask for its waste contract", "inspection",
            [f"{pl['restaurant']['count']} food business(es) with rodent-related violations within 100 m."],
            source_ids=sorted(set(src) | set(pl["restaurant"]["source_ids"])))
    if "demolition" in pl:
        add("demolition", "Bait the surrounding blocks before demolition work starts; notify neighbors", "baiting",
            [f"{pl['demolition']['count']} demolition permit(s) within 100 m. Validation found no report spike after "
             "demolitions, consistent with pre-demolition baiting."],
            source_ids=sorted(set(src) | set(pl["demolition"]["source_ids"])))
    if "city_lot" in pl and not adjacent:
        add("city_lot", "Mow, clean and fence the city-owned lot", "cleanup",
            [f"{pl['city_lot']['count']} city-owned lot(s) within 100 m."],
            source_ids=sorted(set(src) | set(pl["city_lot"]["source_ids"])))
    if "school" in pl:
        add("school", "Joint plan with BPS facilities", "referral",
            [f"{pl['school']['count']} public school building(s) within 100 m."],
            source_ids=sorted(set(src) | set(pl["school"]["source_ids"])))
    if not recs:
        add("follow_up", "Inspect, record the cause in the closure note, and check again in 60 days", "inspection",
            [f"{site['report_count']} reports and {site['recurrence_count']} recurrences; no nearby driver stands out."])
    for i, r in enumerate(recs, 1):
        r["priority"] = i
    return recs


# ---------------------------------------------------------------- spatial context

class Points:
    """KD-tree over projected points with parallel attribute arrays."""

    def __init__(self, rows: list[tuple], lat_i: int, lon_i: int):
        rows = [r for r in rows if r[lat_i] is not None and r[lon_i] is not None]
        self.rows = rows
        if rows:
            x, y = project([r[lon_i] for r in rows], [r[lat_i] for r in rows])
            self.xy = np.column_stack([x, y])
            self.tree = cKDTree(self.xy)
        else:
            self.xy, self.tree = np.empty((0, 2)), None

    def near(self, x: float, y: float, r: float) -> list[int]:
        return [] if self.tree is None else sorted(self.tree.query_ball_point([x, y], r))

    def nearest(self, x: float, y: float, r: float) -> tuple[int, float] | None:
        if self.tree is None:
            return None
        d, i = self.tree.query([x, y], distance_upper_bound=r)
        return None if not np.isfinite(d) else (int(i), float(d))


def _overlaps(start, end, lo: datetime, hi: datetime) -> bool:
    if start is None and end is None:
        return True
    s = start or end
    e = end or start
    return s <= hi and e >= lo


def site_context(site: dict, xy: tuple[float, float] | None, incidents: Points, places: Points, parcels: Points,
                 labels: dict) -> tuple[list[dict], dict | None, dict | None]:
    """Drivers, building, adjacent vacant parcel for one site. Pure given the point indexes.

    incidents rows: (id, category, opened_at, source_id, address_key, lat, lon)
    places rows:    (id, kind, starts_at, ends_at, source_id, name, lat, lon)
    parcels rows:   (pid, land_use, yr_built, own_occ, units, source_id, lat, lon)
    """
    if xy is None:
        return [], None, None
    x, y = xy
    lo = site["reports"][0].opened_at - days(DRIVER_LEAD_DAYS)
    hi = site["reports"][-1].opened_at
    own_ids = {r.id for r in site["reports"]}
    groups: dict[tuple, dict] = {}
    for i in incidents.near(x, y, DRIVER_RADIUS_M):
        iid, cat, opened, sid, key, *_ = incidents.rows[i]
        if iid in own_ids or key == site["key"] or not (lo <= opened <= hi):
            continue
        g = groups.setdefault(("incident", cat), {"type": "incident", "category": cat,
                                                  "label": labels["incident"].get(cat, cat) + (
                                                      " (other addresses)" if cat == "rodent" else ""),
                                                  "count": 0, "ids": [], "source_ids": set()})
        g["count"] += 1
        g["ids"].append(iid)
        g["source_ids"].add(sid)
    for i in places.near(x, y, DRIVER_RADIUS_M):
        pid, kind, s, e, sid, *_ = places.rows[i]
        if kind == "vacant_parcel" or not _overlaps(s, e, lo, hi):
            continue
        g = groups.setdefault(("place", kind), {"type": "place", "kind": kind,
                                                "label": labels["place"].get(kind, kind),
                                                "count": 0, "ids": [], "source_ids": set()})
        g["count"] += 1
        g["ids"].append(pid)
        g["source_ids"].add(sid)
    drivers = []
    for g in groups.values():
        g["ids"] = sorted(g["ids"])[:MAX_IDS]
        g["source_ids"] = sorted(g["source_ids"])
        drivers.append(g)
    drivers.sort(key=lambda d: (-d["count"], d["type"], d.get("category") or d.get("kind")))

    building = None
    hit = parcels.nearest(x, y, BUILDING_RADIUS_M)
    if hit:
        p = parcels.rows[hit[0]]
        building = {"pid": p[0], "land_use": p[1], "yr_built": p[2], "own_occ": p[3], "units": p[4],
                    "source_id": p[5], "distance_m": round(hit[1], 1)}
    adjacent = None
    best = None
    for i in places.near(x, y, VACANT_RADIUS_M):
        row = places.rows[i]
        if row[1] != "vacant_parcel" or (building and row[0] == f"vacant:{building['pid']}"):
            continue
        d = float(np.hypot(*(places.xy[i] - np.array([x, y]))))
        if best is None or (d, row[0]) < best[0]:
            best = ((d, row[0]), row)
    if best:
        row = best[1]
        adjacent = {"id": row[0], "pid": row[0].split(":", 1)[-1], "land_use": row[5], "source_id": row[4],
                    "distance_m": round(best[0][0], 1)}
    return drivers, building, adjacent


def _labels() -> dict:
    c = categories()
    return {"incident": {k: v["label"] for k, v in c["incident_categories"].items()},
            "place": {k: v["label"] for k, v in c["place_kinds"].items()},
            "actions": c["actions"]}


def _mode(vals):
    vals = [v for v in vals if v]
    if not vals:
        return None
    c = Counter(vals)
    return sorted(c.items(), key=lambda kv: (-kv[1], kv[0]))[0][0]


# ---------------------------------------------------------------- run

def run(conn: psycopg.Connection, outcomes: dict | None = None) -> dict:
    rows = conn.execute(
        """select id, address_key, opened_at, closed_at, action_tag, source_id, address_block, zip, neighborhood,
                  lat, lon
           from incidents where city = 'boston' and category = 'rodent' and address_key is not null
             and opened_at >= %s""", (SITE_SINCE,),
    ).fetchall()
    if not rows:
        raise MissingInput({"table": "incidents", "where": f"city='boston' and category='rodent' and opened_at >= {SITE_SINCE}",
                            "loader": "rat_audit.ingest.t311", "why": "rodent reports grouped by address_key"})
    meta = {r[0]: r for r in rows}
    reports = [Report(*r[:6]) for r in rows]
    as_of = max(local_date(r.opened_at) for r in reports)
    sites, dd = group_sites(reports, as_of)
    labels = _labels()

    lo = min(s["reports"][0].opened_at for s in sites) - days(DRIVER_LEAD_DAYS) if sites else as_of
    incidents = Points(conn.execute(
        """select id, category, opened_at, source_id, address_key, lat, lon from incidents
           where city = 'boston' and lat is not null and category <> 'inat_rat' and opened_at >= %s""", (lo,),
    ).fetchall(), 5, 6)
    places = Points(conn.execute(
        "select id, kind, starts_at, ends_at, source_id, name, lat, lon from places where city = 'boston'"
    ).fetchall(), 6, 7)
    parcels = Points(conn.execute(
        "select pid, land_use, yr_built, own_occ, units, source_id, lat, lon from parcels where city = 'boston'"
    ).fetchall(), 6, 7)
    missing = []
    if not places.rows:
        missing.append({"table": "places", "loaders": ["rat_audit.ingest.parcels (vacant_parcel)", "food", "permits",
                                                       "places_misc"], "effect": "no place drivers / adjacent vacant"})
    if not parcels.rows:
        missing.append({"table": "parcels", "loader": "rat_audit.ingest.parcels", "effect": "no building facts"})

    out_rows = []
    for s in sites:
        pts = [(meta[r.id][9], meta[r.id][10]) for r in s["reports"] if meta[r.id][9] is not None]
        if pts:
            lat = float(statistics.median(p[0] for p in pts))
            lon = float(statistics.median(p[1] for p in pts))
            x, y = project([lon], [lat])
            xy = (float(x[0]), float(y[0]))
        else:
            lat = lon = None
            xy = None
        drivers, building, adjacent = site_context(s, xy, incidents, places, parcels, labels)
        recs = recommend(s, drivers, building, adjacent, outcomes, labels)
        timeline = [{"id": r.id, "opened_at": r.opened_at, "closed_at": r.closed_at, "action_tag": r.action_tag,
                     "recurred": f} for r, f in zip(s["reports"], s["flags"])][-60:]
        summary = {
            "drivers": drivers, "building": building, "adjacent_vacant": adjacent,
            "action_counts": dict(Counter(r.action_tag or "untagged" for r in s["reports"])),
            "timeline": timeline,
            "score_parts": {"weights": WEIGHTS, "days_since_last": s["days_since_last"], "as_of": as_of.isoformat()},
            "source_ids": sorted({r.source_id for r in s["reports"]}),
            "why": (f"{s['report_count']} rodent reports since {s['reports'][0].opened_day.isoformat()}, "
                    f"{s['recurrence_count']} within 60 days of a closure"
                    + (", vacant parcel next door" if adjacent else "") + "."),
        }
        m = [meta[r.id] for r in s["reports"]]
        out_rows.append((
            s["id"], _mode(x[6] for x in m) or "Unknown block", _mode(x[7] for x in m), _mode(x[8] for x in m),
            s["score"], s["rank"], s["report_count"], s["recurrence_count"], s["reports"][0].opened_at,
            s["reports"][-1].opened_at, building["pid"] if building else None, jsonb(summary), jsonb(recs), lat, lon,
        ))
    conn.execute(
        """create temp table _sites (id text, address_block text, zip text, neighborhood text, score real, rank int,
             report_count int, recurrence_count int, first_at timestamptz, last_at timestamptz, parcel_pid text,
             summary jsonb, recommended jsonb, lat float8, lon float8) on commit drop"""
    )
    with conn.cursor().copy("copy _sites from stdin") as cp:
        for r in out_rows:
            cp.write_row(r)
    conn.execute(
        """insert into sites (id, address_block, zip, neighborhood, score, rank, report_count, recurrence_count,
             first_at, last_at, parcel_pid, summary, recommended, geom, lat, lon, city, computed_at)
           select id, address_block, zip, neighborhood, score, rank, report_count, recurrence_count, first_at, last_at,
                  parcel_pid, summary, recommended,
                  case when lat is not null then st_setsrid(st_makepoint(lon, lat), 4326)::geography end,
                  lat, lon, 'boston', now()
           from _sites
           on conflict (id) do update set address_block = excluded.address_block, zip = excluded.zip,
             neighborhood = excluded.neighborhood, score = excluded.score, rank = excluded.rank,
             report_count = excluded.report_count, recurrence_count = excluded.recurrence_count,
             first_at = excluded.first_at, last_at = excluded.last_at, parcel_pid = excluded.parcel_pid,
             summary = excluded.summary || coalesce(
               (select jsonb_object_agg(k, v) from jsonb_each(sites.summary) e(k, v) where k like 'recur\\_%%'),
               '{}'::jsonb),
             recommended = excluded.recommended, geom = excluded.geom, lat = excluded.lat, lon = excluded.lon,
             city = excluded.city, computed_at = now()"""
    )
    # Keys no longer chronic: delete, unless an inspector decision points at them (then unrank + flag).
    removed = conn.execute(
        """delete from sites s where city = 'boston' and not exists (select 1 from _sites t where t.id = s.id)
           and not exists (select 1 from decisions d where d.site_id = s.id)"""
    ).rowcount
    retired = conn.execute(
        """update sites s set rank = null, summary = s.summary || '{"retired": true}'::jsonb
           where city = 'boston' and not exists (select 1 from _sites t where t.id = s.id)"""
    ).rowcount
    conn.commit()
    demo = [{"id": s["id"], "rank": s["rank"], "score": s["score"], "reports": s["report_count"],
             "recurrences": s["recurrence_count"], "address_block": r[1], "adjacent_vacant": bool(
                 json_has(r[11], "adjacent_vacant"))}
            for s, r in zip(sites, out_rows) if (r[1] or "").lower().startswith("normandy st")]
    return {"sites": len(sites), "as_of": as_of.isoformat(), "dedupe": dd, "removed": removed,
            "retired_kept_for_decisions": retired, "missing_inputs": missing,
            "top10": [{"rank": s["rank"], "id": s["id"], "score": s["score"], "address_block": r[1],
                       "reports": s["report_count"], "recurrences": s["recurrence_count"]}
                      for s, r in list(zip(sites, out_rows))[:10]],
            "normandy_st_check": demo}


def json_has(js: str, key: str) -> bool:
    import json
    v = json.loads(js).get(key)
    return v is not None
