"""Cluster-based 60-day outcomes, base rates and matched observational comparison."""
from __future__ import annotations

import hashlib
import math
import statistics
from collections import defaultdict
from datetime import date

import numpy as np

from . import clustering
from .common import MissingInput, RECUR_MAX_DAYS, dedupe_reports, jsonb, recurrence_flags, wilson

BIAS_CAVEAT = ("Observational: the city does not assign actions at random. Inspectors may choose stronger "
               "actions for harder cases. These return rates and matched comparisons do not establish causation.")
# Selected after the Oct 23 local cluster cohort: 0/1/2 prior returns ~40–47%, 3+ ~85%.
# 25% flagged every eligible bucket; 50% separates the high-return group. Recalibrate on shared data.
DUE_THRESHOLD = 0.50


def bucket(n: int) -> str:
    return str(min(n, 3)) + ("+" if n >= 3 else "")


def rate(k, n):
    low, high = wilson(k, n)
    return {"n": n, "returns": k, "rate": k / n if n else None,
            "ci_low": low, "ci_high": high}


def episodes(reports, observed_through, window=RECUR_MAX_DAYS):
    """A closure is evaluable only after its entire observation window, even if it returned early."""
    result = []
    for site_id, rs in clustering.group(reports).items():
        flags = recurrence_flags(rs)
        for r in rs:
            if r.closed_day is None or r.closed_at < r.opened_at or r.closed_day > observed_through:
                continue
            next_reports = [o for o in rs if o.id != r.id and o.opened_at > r.opened_at
                            and 1 <= (o.opened_day - r.closed_day).days <= window
                            and o.opened_day <= observed_through]
            prior_returns = sum(f for other, f in zip(rs, flags) if other.opened_at <= r.closed_at)
            result.append({"id": r.id, "site_id": site_id, "tag": r.action_tag,
                "closed_day": r.closed_day, "year": r.closed_day.year,
                "month": r.closed_day.month, "neighborhood": r.neighborhood,
                "prior_reports": sum(o.opened_at < r.opened_at for o in rs),
                "prior_returns_bucket": bucket(prior_returns),
                "observed": (observed_through - r.closed_day).days >= window,
                "returned": bool(next_reports),
                "next_report_id": next_reports[0].id if next_reports else None,
                "days_to_next": (next_reports[0].opened_day - r.closed_day).days if next_reports else None,
                "source_ids": sorted({r.source_id} | {o.source_id for o in next_reports})})
    return result


def matched_comparison(rows, seed=20261024):
    """One mature closure per site, exact match on prior-count bucket, neighborhood and month.

    Pair bootstrap gives the interval for the risk ratio; no unpaired citywide
    rate is used as evidence that enforcement is better.
    """
    by_site = defaultdict(list)
    for e in rows:
        if e["observed"] and e["tag"] in {"citation", "abatement_order", "monitoring"} and e["neighborhood"]:
            by_site[e["site_id"]].append(e)
    strata = defaultdict(lambda: [[], []])
    for sid, group in sorted(by_site.items()):
        e = min(group, key=lambda e: (e["closed_day"], e["id"]))
        n = e["prior_reports"]
        prior = str(n) if n < 3 else "3-4" if n < 5 else "5+"
        key = (prior, e["neighborhood"], e["month"])
        strata[key][int(e["tag"] == "monitoring")].append(e)
    pairs = []
    for key, arms in sorted(strata.items()):
        arms = [sorted(arm, key=lambda e: hashlib.sha256(f"{seed}:{e['id']}".encode()).digest()) for arm in arms]
        pairs.extend(zip(*arms))
    a = np.array([int(x["returned"]) for x, _ in pairs])
    b = np.array([int(y["returned"]) for _, y in pairs])
    n = len(pairs)
    rr = float(a.mean() / b.mean()) if n and b.sum() else None
    ci = None
    if n >= 10 and a.sum() and b.sum():
        rng = np.random.default_rng(seed)
        estimates = []
        for _ in range(999):
            ix = rng.integers(0, n, n)
            if b[ix].sum():
                estimates.append(float(a[ix].sum() / b[ix].sum()))
        if len(estimates) >= 950:
            ci = [float(v) for v in np.quantile(estimates, [.025, .975])]
    return {"n_pairs": n, "enforcement": rate(int(a.sum()), n), "monitoring": rate(int(b.sum()), n),
            "risk_ratio": rr, "ci_95": ci, "seed": seed, "caveat": BIAS_CAVEAT,
            "method": "one mature closure per site; exact prior-report bucket × neighborhood × month; pair bootstrap",
            "strength": "weak" if ci and (ci[0] > 1 or ci[1] < 1) else "none"}


def compute(reports, observed_through: date, window=RECUR_MAX_DAYS, *, prepared=False):
    kept, dd = (reports, {"kept": len(reports)}) if prepared else dedupe_reports(reports)
    rows = episodes(kept, observed_through, window)
    by_tag = {}
    for tag in sorted({e["tag"] for e in rows if e["tag"]}):
        all_tag = [e for e in rows if e["tag"] == tag]
        mature = [e for e in all_tag if e["observed"]]
        k, n = sum(e["returned"] for e in mature), len(mature)
        rr = rate(k, n)
        days = [e["days_to_next"] for e in mature if e["returned"]]
        yearly = {}
        for year in sorted({e["year"] for e in all_tag}):
            yr = [e for e in mature if e["year"] == year]
            yy = rate(sum(e["returned"] for e in yr), len(yr))
            yearly[str(year)] = {**yy, "recurred": yy["returns"],
                                "n_censored": sum(e["year"] == year and not e["observed"] for e in all_tag),
                                "closures": sum(e["year"] == year for e in all_tag)}
        by_tag[tag] = {"n": n, "n_recurred": k, "n_censored": len(all_tag) - n,
            "recur_60d_pct": round(100 * rr["rate"], 2) if n else None,
            "ci_low": round(100 * rr["ci_low"], 2) if n else None,
            "ci_high": round(100 * rr["ci_high"], 2) if n else None,
            "median_days_to_next": float(statistics.median(days)) if days else None,
            "by_year": yearly, "source_ids": sorted({s for e in all_tag for s in e["source_ids"]}),
            "caveat": BIAS_CAVEAT}
    base = []
    for b in ("0", "1", "2", "3+"):
        rs = [e for e in rows if e["prior_returns_bucket"] == b and e["observed"]]
        base.append({"prior_returns_bucket": b, **rate(sum(e["returned"] for e in rs), len(rs)),
                     "source_ids": sorted({s for e in rs for s in e["source_ids"]}),
                     "observed_through": observed_through.isoformat(), "threshold": DUE_THRESHOLD})
    return {"by_tag": by_tag, "base_rates": base, "matched": matched_comparison(rows),
            "dedupe": dd, "observed_through": observed_through.isoformat(), "window_days": window,
            "unit": "50 m DBSCAN site", "caveat": BIAS_CAVEAT}


def load_reports(conn, since=None):
    # `since` retained for callers; the shared cluster definition fixes the 2024–2026 cohort.
    return clustering.load(conn)[0]


def run(conn):
    reports = load_reports(conn)
    if not reports:
        raise MissingInput({"table": "incidents", "step": "classify",
                            "why": "no 50 m clusters of at least 3 retained Boston rodent reports"})
    observed = conn.execute("select max((opened_at at time zone 'America/New_York')::date) "
                            "from incidents where city='boston' and category='rodent'").fetchone()[0]
    res = compute(reports, observed, prepared=True)
    with conn.cursor() as cur:
        for tag, v in res["by_tag"].items():
            if not v["n"]:
                continue
            cur.execute("""insert into action_outcomes (action_tag, n, recur_60d_pct, median_days_to_next,
                n_recurred, n_censored, window_days, observed_through, ci_low, ci_high, by_year, source_ids)
                values (%s,%s,%s,%s,%s,%s,60,%s,%s,%s,%s::jsonb,%s)
                on conflict (action_tag) do update set n=excluded.n, recur_60d_pct=excluded.recur_60d_pct,
                median_days_to_next=excluded.median_days_to_next, n_recurred=excluded.n_recurred,
                n_censored=excluded.n_censored, window_days=60, observed_through=excluded.observed_through,
                ci_low=excluded.ci_low, ci_high=excluded.ci_high, by_year=excluded.by_year,
                source_ids=excluded.source_ids, computed_at=now()""",
                (tag, v["n"], v["recur_60d_pct"], v["median_days_to_next"], v["n_recurred"], v["n_censored"],
                 observed, v["ci_low"], v["ci_high"], jsonb(v["by_year"]), v["source_ids"]))
        cur.execute("delete from action_outcomes where not (action_tag = any(%s))",
                    ([t for t, v in res["by_tag"].items() if v["n"]],))
        for v in res["base_rates"]:
            cur.execute("""insert into base_rates (prior_returns_bucket,n,returns,rate,ci_low,ci_high,
                observed_through,source_ids,due_threshold) values (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                on conflict (prior_returns_bucket) do update set n=excluded.n, returns=excluded.returns,
                rate=excluded.rate, ci_low=excluded.ci_low, ci_high=excluded.ci_high,
                observed_through=excluded.observed_through, source_ids=excluded.source_ids,
                due_threshold=excluded.due_threshold, computed_at=now()""",
                (v["prior_returns_bucket"], v["n"], v["returns"], v["rate"], v["ci_low"], v["ci_high"],
                 observed, v["source_ids"], DUE_THRESHOLD))
    conn.commit()
    res["rows"] = sum(v["n"] > 0 for v in res["by_tag"].values())
    return res
