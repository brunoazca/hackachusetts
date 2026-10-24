"""Spec v2 sites: 50 m clusters, raw counts, Due-first ordering and legal-lane recommendations."""
from __future__ import annotations

import hashlib
import json
import re
import statistics
from collections import Counter, defaultdict
from datetime import date, datetime, time, timedelta

import numpy as np
from scipy.spatial import cKDTree

from ..ingest.common import categories
from .common import public_note as scrub_note
from . import clustering
from .common import BOSTON_TZ, MissingInput, Report, days, jsonb, local_date, project, recurrence_flags
from .outcomes import BIAS_CAVEAT, DUE_THRESHOLD, bucket, episodes

DRIVER_RADIUS_M = 100
DRIVER_LEAD_DAYS = 30
BUILDING_RADIUS_M = 30
VACANT_RADIUS_M = 40
MAX_IDS = 20
SOFT_ACTIONS = {"monitoring", "inspection"}
TRASH_DUMPING = {"trash_storage", "trash_early", "dumping", "litter", "dumpster", "missed_trash",
                 "vacant_lot", "move_in_trash", "ce_trash_storage", "ce_dumping", "ce_overfill"}
LEGAL_LANES = {"sanitation", "exclusion", "enforcement", "referral"}
BANNED = re.compile(r"\b(poison\w*|rodenticid\w*|bait\w*|pesticid\w*)\b", re.I)
SITE_SINCE = "2024-01-01"
REFS = {
    "nyc_containerization": {"label": "NYC DSNY containerization results (external context)",
        "url": "https://www.nyc.gov/site/dsny/news/25-039/nyc-rats-fleeing-an-incredible-12-straight-months-",
        "kind": "government"},
    "boston_pb_containers": {"label": "Boston $500,000 rat-prevention container project (external context)",
        "url": "https://www.boston.gov/departments/participatory-budgeting/rat-prevention-initiatives-dense-residential-areas",
        "kind": "government"},
}


def rank_sites(stats):
    """Due first, then returns in 12 months; deterministic ties. No composite score."""
    ordered = sorted(stats, key=lambda s: (-int(s.get("due", False)), -s.get("returns_12mo", 0),
        -s["report_count"], s["days_since_last"], s["id"]))
    hoods = Counter()
    for i, s in enumerate(ordered, 1):
        s["rank"] = i
        hoods[s.get("neighborhood")] += 1
        s["rank_neighborhood"] = hoods[s.get("neighborhood")]
    return ordered


def group_sites(reports, as_of, base_rates=None):
    rates = {v["prior_returns_bucket"]: v for v in (base_rates or [])}
    stats = []
    for sid, rs in clustering.group(reports).items():
        flags = recurrence_flags(rs)
        closed = [r for r in rs if r.closed_at and r.closed_at >= r.opened_at and r.closed_day <= as_of]
        latest = max(closed, key=lambda r: (r.closed_at, r.id)) if closed else None
        prior = sum(f for r, f in zip(rs, flags) if latest and r.opened_at <= latest.closed_at)
        base = rates.get(bucket(prior))
        since = (as_of - latest.closed_day).days if latest else None
        threshold = base.get("threshold", DUE_THRESHOLD) if base else DUE_THRESHOLD
        due = bool(since is not None and 0 <= since <= 60 and base and base.get("n", 0)
                   and base["rate"] is not None and base["rate"] >= threshold)
        stats.append({"id": sid, "reports": rs, "flags": flags, "report_count": len(rs),
            "recurrence_count": sum(flags), "returns_12mo": sum(f and 0 <= (as_of-r.opened_day).days < 365
                                                              for r, f in zip(rs, flags)),
            "closure_count": len(closed), "last_closed_at": latest.closed_at if latest else None,
            "last_action": latest.action_tag if latest else None, "days_since_close": since,
            "days_since_last": (as_of-rs[-1].opened_day).days,
            "prior_returns_bucket": bucket(prior), "base_rate": base, "due": due, "due_threshold": threshold,
            "neighborhood": _mode(r.neighborhood for r in rs),
            "address_keys": {r.key for r in rs}, "as_of_at": datetime.combine(as_of, time.max, BOSTON_TZ)})
    return rank_sites(stats), {"kept": len(reports), "definition": "PostGIS DBSCAN 50 m, minpoints 3, bulk collapsed"}


def legal_recommendations(recommendations):
    return [r for r in recommendations if r.get("lane") in LEGAL_LANES
            and r.get("action_tag") != "baiting" and not BANNED.search(json.dumps(r))]


def recommend(site, drivers, building, adjacent, outcomes, labels):
    """R3.9: exactly the first applicable rule; a final legal-lane filter is mandatory."""
    rs = site["reports"]
    src = sorted({r.source_id for r in rs})
    returned = episodes(rs, max(r.opened_day for r in rs))
    soft = [e for e in returned if e["tag"] in SOFT_ACTIONS and e["returned"]]
    tried = {r.action_tag for r in rs if r.closed_at}
    available = next((tag for tag in ("citation", "abatement_order") if tag not in tried), None)
    inc = [d for d in drivers if d["type"] == "incident" and d["category"] != "rodent"]
    total = sum(d["count"] for d in inc)
    trash = sum(d["count"] for d in inc if d["category"] in TRASH_DUMPING)
    refs, evidence = [], {}
    if len(soft) >= 2 and available:
        rule, lane, tag = "escalate", "enforcement", available
        action = "Consider an untried " + ("citation" if tag == "citation" else "abatement order")
        because = [f"Monitoring or inspection was tried {len(soft)} times here with a return after each.",
                   "Untested here, worth trying; citywide matched research found no measurable difference "
                   "between enforcement and monitoring (RR 1.03, 95% CI 0.89–1.20). " + BIAS_CAVEAT]
        evidence = {"failed_closure_ids": [e["id"] for e in soft], "untried_action": tag}
        refs = [{"label": "Matched observational validation (Oct 24)",
                 "url": "https://github.com/brunoazca/hackachusetts/blob/main/.kiro/specs/rat-audit/data-audit.md",
                 "kind": "research"}]
    elif adjacent:
        rule, lane, tag = "adjacent_lot", "sanitation", "cleanup"
        action = "Joint block visit, notice to the lot owner or managing agency, and clearing"
        because = [f"A vacant-land parcel is about {adjacent['distance_m']} m away; verify the site and parcel together."]
        evidence = {"adjacent_vacant": adjacent}
        src = sorted(set(src) | {adjacent["source_id"]})
    elif total and trash / total > .5:
        rule, lane, tag = "containers", "sanitation", "barrels"
        action = "Container compliance visit and sealed containers"
        because = [f"{trash} of {total} nearby driver records concern trash or dumping.",
                   "NYC containerization and Boston's container project are external context, not a measured local effect."]
        evidence = {"trash_records": trash, "driver_records": total}
        refs = list(REFS.values())
        src = sorted(set(src) | {s for d in inc if d["category"] in TRASH_DUMPING for s in d["source_ids"]})
    elif any(r.cause_tag == "sewer" for r in sorted((r for r in rs if r.closed_at),
                                                   key=lambda r: (r.closed_at, r.id))[-5:]):
        rule, lane, tag = "sewer", "referral", "referral"
        action = "Refer to BWSC for a catch-basin check"
        because = ["A recent closure note names a sewer or catch basin; verify the suspected source."]
        evidence = {"note_ids": [r.id for r in rs if r.cause_tag == "sewer"][-5:]}
    else:
        rule, lane, tag = "inspect_cause", "exclusion", "inspection"
        action = "Inspect entry points and record the cause; check again in 60 days"
        because = [f"{site['report_count']} reports and {site['recurrence_count']} returns; the cause needs field verification."]
    result = {"id": f"{site['id']}:{rule}", "rule": rule, "lane": lane, "action": action,
        "action_tag": tag, "owner": "BWSC" if rule == "sewer" else labels["actions"].get(tag, {}).get("owner", "ISD"),
        "priority": 1, "because": because, "evidence": evidence, "source_ids": src, "references": refs}
    return legal_recommendations([result])


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
        ticket = cat.startswith("ce_")
        lower = site.get("as_of_at", hi) - days(365) if ticket else lo
        upper = site.get("as_of_at", hi) if ticket else hi
        if iid in own_ids or key in site.get("address_keys", set()) or not (lower <= opened <= upper):
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



def seasonal_factors(reports, as_of):
    """Use complete calendar years only; no partial current month in the seasonal fit."""
    history = [r for r in reports if r.opened_day.year < as_of.year]
    counts = Counter(r.opened_day.month for r in history)
    total = sum(counts.values())
    return {m: 12 * counts[m] / total if total else 1.0 for m in range(1, 13)}


def case_summary(site, as_of, city_speeds, factors, meta, drivers, building, adjacent, outcomes=None):
    rs = site["reports"]
    events = {e["id"]: e for e in episodes(rs, as_of)}
    closed = sorted((r for r in rs if r.id in events), key=lambda r: (r.closed_at, r.id))
    by_tag = {}
    for tag in sorted({r.action_tag for r in closed if r.action_tag}):
        durations = [(r.closed_at-r.opened_at).total_seconds()/86400 for r in closed if r.action_tag == tag]
        by_tag[tag] = {"n": len(durations), "site_median_days": statistics.median(durations),
                       "citywide_median_days": city_speeds.get(tag)}
    elapsed = max((as_of - date(rs[0].opened_day.year, 1, 1)).days + 1, 1)
    yearly_mean = len(rs) * 365.25 / elapsed
    expected = yearly_mean / 12 * factors[as_of.month]
    recent = [r for r in rs if 0 <= (as_of-r.opened_day).days < 90]
    exp90 = sum(yearly_mean / 365.25 * factors[(as_of-timedelta(days=i)).month] for i in range(90))
    timeline = [{"id": r.id, "opened_at": r.opened_at, "closed_at": r.closed_at, "action_tag": r.action_tag,
                 "cause_tag": r.cause_tag, "recurred": flag,
                 "closure_followed_by_return": events.get(r.id, {}).get("returned", False),
                 "return_id": events.get(r.id, {}).get("next_report_id"), "source_id": r.source_id}
                for r, flag in zip(rs, site["flags"])]
    source_ids = sorted({r.source_id for r in rs} | {s for d in drivers for s in d["source_ids"]}
                        | ({building["source_id"]} if building else set())
                        | ({adjacent["source_id"]} if adjacent else set()))
    tickets = sum(d["count"] for d in drivers if d.get("category", "").startswith("ce_")
                  and d["category"] in TRASH_DUMPING)
    return {"definition": "dbscan_50m_min3_v2", "as_of": str(as_of), "source_ids": source_ids,
        "incident_ids": sorted({i for r in rs for i in meta[r.id]["member_ids"]}),
        "representative_ids": [r.id for r in rs], "address_keys": sorted(site["address_keys"]),
        "reports": site["report_count"], "closures": site["closure_count"], "returns": site["recurrence_count"],
        "returns_12mo": site["returns_12mo"], "last_closed_at": site["last_closed_at"],
        "last_action": site["last_action"], "days_since_close": site["days_since_close"],
        "due": site["due"], "base_rate": site["base_rate"], "due_threshold": site["due_threshold"],
        "prior_returns_bucket": site["prior_returns_bucket"], "rank_neighborhood": site["rank_neighborhood"],
        "timeline": timeline,
        "ladder": [{"id": r.id, "closed_at": r.closed_at, "action_tag": r.action_tag,
                    "returned": events[r.id]["returned"], "return_id": events[r.id]["next_report_id"],
                    "days_to_return": events[r.id]["days_to_next"], "source_id": r.source_id} for r in closed],
        "speed": {"by_action": by_tag,
                  "median_days": statistics.median((r.closed_at-r.opened_at).total_seconds()/86400 for r in closed) if closed else None,
                  "same_day_share": sum(r.closed_day == r.opened_day for r in closed)/len(closed) if closed else None,
                  "caveat": "Same-day closure is a possible closure without a visit, not proof."},
        "notes": [{"id": r.id, "note": scrub_note(r.note), "closed_at": r.closed_at,
                   "action_tag": r.action_tag, "cause_tag": r.cause_tag, "source_id": r.source_id} for r in closed[-5:]],
        "action_counts": dict(Counter(r.action_tag for r in closed if r.action_tag)),
        "drivers": drivers, "building": building, "adjacent_vacant": adjacent,
        "trash_tickets_12mo": tickets, "enforcement_gap": site["due"] and tickets == 0,
        "expected_month": {"expected": expected, "actual": sum(r.opened_day.year == as_of.year and r.opened_day.month == as_of.month for r in rs),
                           "yearly_mean": yearly_mean, "seasonal_factor": factors[as_of.month],
                           "month": as_of.strftime("%Y-%m"), "observed_through": str(as_of)},
        "season_adj": len(recent)/exp90 if exp90 else None,
        "season_adj_counts": {"actual_90d": len(recent), "expected_90d": exp90},
        "what_worked": {"by_tag": outcomes or {}, "caveat": BIAS_CAVEAT},
        "demo_pinned": any((meta[r.id]["address_block"] or "").lower().startswith("normandy st, 02121") for r in rs),
        "why": f"{len(rs)} reports, {site['closure_count']} closures and {site['recurrence_count']} returns in a 50 m cluster."}



def equity_context(conn):
    """Low all-311 reporting per resident, not a claim about infestation or access."""
    rows = conn.execute("""with counts as (
      select t.geoid,t.source_id,t.attrs,(t.attrs->>'pop')::float8 as pop,
        coalesce(sum(v.n_all),0) as reports,array_remove(array_agg(distinct v.source_id),null) as sources
      from tracts t left join report_volume v on v.city='boston' and v.month>='2025-01-01' and v.month<'2026-01-01'
        and st_covers(t.geom::geometry,st_setsrid(st_makepoint((v.lon_bin+.5)/1000.,(v.lat_bin+.5)/1000.),4326))
      where t.city='boston' and (t.attrs->>'pop')::float8>0 group by t.geoid), rates as (
      select *,1000*reports/pop as rate from counts), cuts as (
      select percentile_disc(.2) within group(order by rate) as cutoff from rates)
      select geoid,rate,rate<=cutoff,pop,attrs->>'tract_vintage',source_id,sources,reports from rates cross join cuts""").fetchall()
    return {r[0]: {'tract_id':r[0], 'reports_per_1000_residents':r[1], 'low_reporting':r[2],
                  'population':r[3], 'population_vintage':r[4], 'source_ids':sorted(set([r[5]]+r[6])),
                  'reports':r[7], 'period':'2025', 'method':'Lowest quintile of all-311 reports per resident; binned point assignment',
                  'caveat':'311 counts are reports, not rats. Historical population and reporting access differ; a low count is not low risk.'}
            for r in rows} if any(r[6] for r in rows) else {}

def run(conn, outcomes=None):
    reports, meta = clustering.load(conn)
    if not reports:
        raise MissingInput({"table": "incidents", "why": "No 50 m clusters after bulk collapse", "loader": "rat_audit.ingest.t311"})
    as_of = conn.execute("select max((opened_at at time zone 'America/New_York')::date) from incidents "
                        "where city='boston' and category='rodent'").fetchone()[0]
    base_rows = conn.execute("select prior_returns_bucket,n,returns,rate,ci_low,ci_high,due_threshold,source_ids "
                             "from base_rates").fetchall()
    if not base_rows:
        raise MissingInput({"table": "base_rates", "step": "outcomes"})
    bases = [dict(zip(("prior_returns_bucket","n","returns","rate","ci_low","ci_high","threshold","source_ids"), r)) for r in base_rows]
    sites, dd = group_sites(reports, as_of, bases)
    labels = _labels()
    equity = equity_context(conn)
    tract_by_report = dict(conn.execute("""select i.id,(select t.geoid from tracts t where t.city='boston'
      and st_covers(t.geom::geometry,i.geom::geometry) order by t.geoid limit 1)
      from incidents i where i.city='boston' and i.category='rodent' and i.geom is not null""").fetchall())
    lo = min(r.opened_at for r in reports)-days(DRIVER_LEAD_DAYS)
    incidents = Points(conn.execute("select id,category,opened_at,source_id,address_key,lat,lon from incidents "
        "where city='boston' and lat is not null and category <> 'inat_rat' and opened_at >= %s", (lo,)).fetchall(),5,6)
    places = Points(conn.execute("select id,kind,starts_at,ends_at,source_id,name,lat,lon from places where city='boston'").fetchall(),6,7)
    parcels = Points(conn.execute("select pid,land_use,yr_built,own_occ,units,source_id,lat,lon from parcels where city='boston'").fetchall(),6,7)
    city_speeds = dict(conn.execute("""select action_tag, percentile_cont(.5) within group
        (order by extract(epoch from closed_at-opened_at)/86400)
        from incidents where city='boston' and category='rodent' and status='closed'
        and closed_at >= opened_at and action_tag is not null group by action_tag""").fetchall())
    factors = seasonal_factors(reports, as_of)
    # All monthly rodent counts, including DBSCAN noise, define citywide seasonality.
    monthly = conn.execute("""select extract(month from opened_at at time zone 'America/New_York')::int,count(*)
        from incidents where city='boston' and category='rodent' and opened_at >= '2024-01-01'
        and opened_at < %s group by 1""", (f"{as_of.year}-01-01 00:00-05",)).fetchall()
    if sum(n for _, n in monthly):
        factors = {m: 12*dict(monthly).get(m,0)/sum(n for _,n in monthly) for m in range(1,13)}
    out_rows, demos = [], []
    for s in sites:
        pts = [meta[r.id] for r in s["reports"]]
        lat, lon = statistics.median(p["lat"] for p in pts), statistics.median(p["lon"] for p in pts)
        x,y = project([lon],[lat])
        drivers, building, adjacent = site_context(s,(float(x[0]),float(y[0])),incidents,places,parcels,labels)
        summary = case_summary(s,as_of,city_speeds,factors,meta,drivers,building,adjacent,outcomes)
        tract_id = _mode(tract_by_report.get(r.id) for r in s['reports'])
        summary['equity'] = equity.get(tract_id, {'low_reporting':None,'status':'missing population or reporting denominator'})
        summary['source_ids'] = sorted(set(summary['source_ids']) | set(summary['equity'].get('source_ids', [])))
        recs = recommend(s,drivers,building,adjacent,outcomes,labels)
        block = _mode(p["address_block"] for p in pts) or "Unknown block"
        out_rows.append((s["id"],block,_mode(p["zip"] for p in pts),s["neighborhood"],0,s["rank"],s["report_count"],
            s["recurrence_count"],s["reports"][0].opened_at,s["reports"][-1].opened_at,
            building["pid"] if building else None,jsonb(summary),jsonb(recs),lat,lon))
        if summary["demo_pinned"]:
            demos.append({"id":s["id"],"rank":s["rank"],"reports":s["report_count"],"returns":s["recurrence_count"],
                          "demo_pinned":True,"adjacent_vacant":bool(adjacent)})
    conn.execute("""create temp table _sites (id text,address_block text,zip text,neighborhood text,score real,rank int,
        report_count int,recurrence_count int,first_at timestamptz,last_at timestamptz,parcel_pid text,
        summary jsonb,recommended jsonb,lat float8,lon float8) on commit drop""")
    with conn.cursor().copy("copy _sites from stdin") as cp:
        for row in out_rows:
            cp.write_row(row)
    conn.execute("""insert into sites (id,address_block,zip,neighborhood,score,rank,report_count,recurrence_count,
        first_at,last_at,parcel_pid,summary,recommended,geom,lat,lon,city,computed_at)
        select id,address_block,zip,neighborhood,score,rank,report_count,recurrence_count,first_at,last_at,
        parcel_pid,summary,recommended,st_setsrid(st_makepoint(lon,lat),4326)::geography,lat,lon,'boston',now() from _sites
        on conflict (id) do update set address_block=excluded.address_block,zip=excluded.zip,neighborhood=excluded.neighborhood,
        score=0,rank=excluded.rank,report_count=excluded.report_count,recurrence_count=excluded.recurrence_count,
        first_at=excluded.first_at,last_at=excluded.last_at,parcel_pid=excluded.parcel_pid,
        summary=excluded.summary || coalesce((select jsonb_object_agg(k,v) from jsonb_each(sites.summary) e(k,v)
          where k in ('unknowns','unknowns_cache')),'{}'::jsonb) || case when sites.summary->'representative_ids'=excluded.summary->'representative_ids'
          then coalesce((select jsonb_object_agg(k,v) from jsonb_each(sites.summary) e(k,v) where left(k,6)='recur_'),'{}'::jsonb)
          else '{}'::jsonb end,
        recommended=excluded.recommended,geom=excluded.geom,lat=excluded.lat,lon=excluded.lon,computed_at=now()""")
    # Keep historical IDs for decisions/trials; never transfer an approval to a new cluster.
    retired = conn.execute("""update sites s set rank=null,summary=s.summary || '{"retired":true,"due":false}'::jsonb
        where city='boston' and not exists (select 1 from _sites t where t.id=s.id)""").rowcount
    conn.commit()
    return {"sites":len(sites),"as_of":str(as_of),"dedupe":dd,"retired":retired,"normandy_st_check":demos,
            "due":sum(s["due"] for s in sites),"top10":[{"id":s["id"],"rank":s["rank"],"reports":s["report_count"],
            "returns":s["recurrence_count"],"due":s["due"]} for s in sites[:10]],
            "missing_inputs": ([{"table":"places","effect":"no place drivers"}] if not places.rows else []) +
                              ([{"table":"parcels","effect":"no building facts"}] if not parcels.rows else []) +
                              ([{"table":"tracts / report_volume","effect":"no equity denominator"}] if not equity else [])}
