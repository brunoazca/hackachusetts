"""Task 2.4: `action_outcomes` ("what worked"), 60-day repeat rate by closure action (R3.2f, R5.2).

Subject = a closed Boston rodent case with an address key and an action tag (after dedupe:
same-day bulk loads count once, `duplicate` cases are not reports). Outcome = a new report at the
same key opened 1-60 local days after the subject's closure.

Observation window: a case closed less than 60 days before the data's newest rodent report
(`observed_through`) has not been watched for 60 days yet. It is counted as censored and left out
of the rate, so recent cases can never look like successes.

Observational: inspectors choose the action from what they see, so the rates are associations,
never the effect of the action.
"""
from __future__ import annotations

import statistics
from collections import defaultdict
from datetime import date

import psycopg

from .common import RECUR_MAX_DAYS, RECUR_MIN_DAYS, MissingInput, Report, dedupe_reports, local_date, wilson


def compute(reports: list[Report], observed_through: date, window: int = RECUR_MAX_DAYS) -> dict:
    """Pure. reports: Boston rodent reports (any status). Returns {by_tag, dedupe, observed_through}."""
    kept, dd = dedupe_reports(reports)
    by_key: dict[str, list[Report]] = defaultdict(list)
    for r in kept:
        by_key[r.key].append(r)
    acc: dict[str, dict] = defaultdict(lambda: {"n": 0, "recurred": 0, "censored": 0, "days": [],
                                                "by_year": defaultdict(lambda: [0, 0]), "source_ids": set()})
    for rs in by_key.values():
        opened_days = [r.opened_day for r in rs]
        for r in rs:
            if r.closed_at is None or not r.action_tag:
                continue
            a = acc[r.action_tag]
            cd = r.closed_day
            if (observed_through - cd).days < window:
                a["censored"] += 1
                continue
            gaps = [(od - cd).days for od in opened_days if RECUR_MIN_DAYS <= (od - cd).days <= window]
            a["n"] += 1
            a["source_ids"].add(r.source_id)
            y = a["by_year"][cd.year]
            y[0] += 1
            if gaps:
                a["recurred"] += 1
                a["days"].append(min(gaps))
                y[1] += 1
    by_tag = {}
    for tag in sorted(acc):
        a = acc[tag]
        lo, hi = wilson(a["recurred"], a["n"])
        by_tag[tag] = {
            "n": a["n"], "n_recurred": a["recurred"], "n_censored": a["censored"],
            "recur_60d_pct": round(100 * a["recurred"] / a["n"], 2) if a["n"] else None,
            "ci_low": round(100 * lo, 2) if lo is not None else None,
            "ci_high": round(100 * hi, 2) if hi is not None else None,
            "median_days_to_next": float(statistics.median(a["days"])) if a["days"] else None,
            "by_year": {str(y): {"n": v[0], "recurred": v[1]} for y, v in sorted(a["by_year"].items())},
            "source_ids": sorted(a["source_ids"]),
        }
    return {"by_tag": by_tag, "dedupe": dd, "observed_through": observed_through.isoformat(), "window_days": window}


def load_reports(conn: psycopg.Connection, since: str = "2023-01-01") -> list[Report]:
    rows = conn.execute(
        """select id, address_key, opened_at, closed_at, action_tag, source_id from incidents
           where city = 'boston' and category = 'rodent' and address_key is not null and opened_at >= %s""",
        (since,),
    ).fetchall()
    return [Report(*r) for r in rows]


def run(conn: psycopg.Connection) -> dict:
    reports = load_reports(conn)
    if not reports:
        raise MissingInput({"table": "incidents", "where": "city='boston' and category='rodent'",
                            "loader": "rat_audit.ingest.t311", "why": "rodent cases with address_key"})
    observed_through = max(local_date(r.opened_at) for r in reports)
    res = compute(reports, observed_through)
    rows = [(t, v["n"], v["recur_60d_pct"], v["median_days_to_next"], v["n_recurred"], v["n_censored"],
             res["window_days"], observed_through, v["ci_low"], v["ci_high"], v["by_year"], v["source_ids"])
            for t, v in res["by_tag"].items() if v["n"] > 0]
    from .common import jsonb
    with conn.cursor() as cur:
        cur.executemany(
            """insert into action_outcomes (action_tag, n, recur_60d_pct, median_days_to_next, n_recurred, n_censored,
                 window_days, observed_through, ci_low, ci_high, by_year, source_ids, computed_at)
               values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s, now())
               on conflict (action_tag) do update set n = excluded.n, recur_60d_pct = excluded.recur_60d_pct,
                 median_days_to_next = excluded.median_days_to_next, n_recurred = excluded.n_recurred,
                 n_censored = excluded.n_censored, window_days = excluded.window_days,
                 observed_through = excluded.observed_through, ci_low = excluded.ci_low, ci_high = excluded.ci_high,
                 by_year = excluded.by_year, source_ids = excluded.source_ids, computed_at = now()""",
            [r[:10] + (jsonb(r[10]), r[11]) for r in rows],
        )
    conn.execute("delete from action_outcomes where not (action_tag = any(%s))", ([r[0] for r in rows],))
    conn.commit()
    res["rows"] = len(rows)
    return res
