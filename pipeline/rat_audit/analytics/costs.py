"""Task 2.7: costs we can count, in `price_impact` (R7.4, R7.5).

Three rows, each written only from its own input; a missing input is reported, never filled in:
- `cost-pest-control-payments`: Checkbook payments to pest-control vendors (`spending`).
- `cost-restaurant-rodent-citations`: rodent-related food-inspection violations (`places` kind restaurant).
- `cost-repeat-cases-chronic-sites`: rodent cases reported at chronic sites (`sites` + `incidents`).

No report count is turned into visits, staff hours or dollars: the data records cases and closure
notes, not visits or time. No price or property-value claim is made here (research campaigns
c3c9bd8f and 0651afa1 found no devaluation; the "5-20% value loss" figures are industry marketing).
"""
from __future__ import annotations

import json
import re
from collections import Counter, defaultdict

import psycopg

from .common import MissingInput, jsonb

ON_SITE_ACTIONS = {"inspection", "citation", "warning", "baiting", "abatement_order", "collections", "barrels",
                   "cleanup", "no_violation"}
_NEGATED = re.compile(r"\bno (\w+ ){0,3}(mice|mouse|rodents?|rats?|droppings|evidence)\b|\b(not|none) (observed|seen|found)\b",
                      re.I)
PRICE_CAVEAT = ("No peer-reviewed study links rodents to home prices; the '5-20% value loss' figures are industry "
                "marketing. These are costs that can be counted, not a price effect.")


def _upsert(conn, row: dict) -> None:
    conn.execute(
        """insert into price_impact (id, title, scope, scope_id, metric, value, caveat, source_ids, computed_at)
           values (%(id)s, %(title)s, %(scope)s, %(scope_id)s, %(metric)s, %(value)s::jsonb, %(caveat)s,
                   %(source_ids)s, now())
           on conflict (id) do update set title = excluded.title, scope = excluded.scope, scope_id = excluded.scope_id,
             metric = excluded.metric, value = excluded.value, caveat = excluded.caveat,
             source_ids = excluded.source_ids, computed_at = now()""",
        {**row, "value": jsonb(row["value"])},
    )


def pest_payments(rows: list[tuple]) -> dict:
    """Pure. rows: (fiscal_year, department, vendor, amount, n_payments, source_id)."""
    by_fy: dict[int, dict] = {}
    for fy, dept, vendor, amount, n, _ in rows:
        d = by_fy.setdefault(fy, {"fiscal_year": fy, "amount": 0.0, "n_payments": 0, "departments": Counter()})
        d["amount"] += float(amount)
        d["n_payments"] += int(n)
        d["departments"][dept or "Unknown"] += float(amount)
    out = []
    for fy in sorted(by_fy):
        d = by_fy[fy]
        out.append({"fiscal_year": fy, "amount": round(d["amount"], 2), "n_payments": d["n_payments"],
                    "departments": [{"department": k, "amount": round(v, 2)}
                                    for k, v in sorted(d["departments"].items(), key=lambda kv: (-kv[1], kv[0]))]})
    return {"by_fiscal_year": out, "currency": "USD"}


def restaurant_citations(rows: list[tuple], year: int) -> dict:
    """Pure. rows: (place_id, attrs dict, source_id). Counts from the per-violation list in attrs.

    attrs.rodent_violations keeps the last 20 citations per business, so per-year counts are a
    lower bound for businesses with more than 20; n_rodent_violations / n_explicit are full totals.
    """
    biz_year, biz_year_explicit = set(), set()
    viol_year = explicit_year = negated = 0
    total = total_explicit = 0
    capped = 0
    for pid, attrs, _ in rows:
        attrs = attrs if isinstance(attrs, dict) else json.loads(attrs or "{}")
        total += int(attrs.get("n_rodent_violations") or 0)
        total_explicit += int(attrs.get("n_explicit") or 0)
        vs = attrs.get("rodent_violations") or []
        if int(attrs.get("n_rodent_violations") or 0) > len(vs):
            capped += 1
        for v in vs:
            if str(v.get("date", ""))[:4] != str(year):
                continue
            viol_year += 1
            biz_year.add(pid)
            if v.get("explicit"):
                if _NEGATED.search(v.get("comment") or ""):
                    negated += 1  # "no mice observed" names mice without citing them
                    continue
                explicit_year += 1
                biz_year_explicit.add(pid)
    return {"year": year, "businesses": len(biz_year), "violations": viol_year,
            "businesses_explicit": len(biz_year_explicit), "violations_explicit": explicit_year,
            "explicit_negated_excluded": negated,
            "since_2024": {"businesses": len(rows), "violations": total, "violations_explicit": total_explicit},
            "businesses_with_capped_history": capped,
            "lower_bound": capped > 0}


def repeat_cases(sites: list[tuple], tags: dict[str, Counter]) -> dict:
    """Pure. sites: (id, report_count, recurrence_count); tags: site_id -> Counter(action_tag)."""
    chronic = [s for s in sites if s[2] >= 1]
    cases = sum(s[1] for s in chronic)
    recur = sum(s[2] for s in chronic)
    t = Counter()
    for s in chronic:
        t.update(tags.get(s[0], Counter()))
    on_site = sum(v for k, v in t.items() if k in ON_SITE_ACTIONS)
    return {"sites_with_recurrence": len(chronic), "cases": cases, "recurrences": recur,
            "cases_with_on_site_action_in_note": on_site, "by_action": dict(sorted(t.items())),
            "units": "cases (not visits, not hours, not dollars)"}


def run(conn: psycopg.Connection, year: int = 2025, use_sites: bool = True) -> dict:
    out, missing = {}, []

    sp = conn.execute(
        "select fiscal_year, department, vendor, amount, n_payments, source_id from spending order by 1, 2, 3"
    ).fetchall()
    if sp:
        v = pest_payments(sp)
        latest = v["by_fiscal_year"][-1]
        _upsert(conn, {
            "id": "cost-pest-control-payments", "scope": "city", "scope_id": "boston", "metric": "usd_paid",
            "title": f"City payments to pest-control vendors: ${latest['amount']:,.0f} in FY{latest['fiscal_year']}",
            "value": v, "source_ids": sorted({r[5] for r in sp}),
            "caveat": ("Lower bound: Checkbook payments matched on vendor name (pest, exterminat*, Terminix, Orkin); "
                       "not every payment is for rodents. The FY2024 table holds only July 2023, so FY2024 is "
                       "incomplete, not a drop. " + PRICE_CAVEAT),
        })
        out["pest_payments"] = {"status": "ok", "fiscal_years": [d["fiscal_year"] for d in v["by_fiscal_year"]]}
    else:
        missing.append({"row": "cost-pest-control-payments", "table": "spending", "source_id": "boston-checkbook",
                        "loader": "rat_audit.ingest.context (spending)"})

    rs = conn.execute(
        "select id, attrs, source_id from places where kind = 'restaurant' and city = 'boston' order by id"
    ).fetchall()
    if rs:
        v = restaurant_citations(rs, year)
        _upsert(conn, {
            "id": "cost-restaurant-rodent-citations", "scope": "city", "scope_id": "boston", "metric": "violations",
            "title": (f"{v['businesses_explicit']:,} food businesses got {v['violations_explicit']:,} inspection "
                      f"violations naming rodents or mice in {year}"),
            "value": v, "source_ids": sorted({r[2] for r in rs}),
            "caveat": ("Food-inspection violations whose inspector comment names rodents, mice, rats or droppings "
                       "('explicit'), minus comments that negate them ('no mice observed'); the broader set also "
                       "includes generic pest codes. One citation per business, day and code. Counted from inspector "
                       "comments, so it differs from a count by rodent/vermin violation code. "
                       + ("Per-year counts are a lower bound: the stored history keeps the last 20 citations per "
                          "business. " if v["lower_bound"] else "")
                       + "No fine or revenue amount is published in this data. " + PRICE_CAVEAT),
        })
        out["restaurant_citations"] = {"status": "ok", "year": year}
    else:
        missing.append({"row": "cost-restaurant-rodent-citations", "table": "places", "where": "kind='restaurant'",
                        "source_id": "boston-food-inspections", "loader": "rat_audit.ingest.food"})

    st = [] if not use_sites else conn.execute(
        "select id, report_count, recurrence_count, summary->'action_counts', summary->'source_ids' "
        "from sites where city = 'boston' and rank is not null"
    ).fetchall()
    if st:
        tags = defaultdict(Counter)
        for sid, _, _, ac, _ in st:
            for k, n in (ac or {}).items():
                tags[sid][k] += int(n)
        v = repeat_cases([s[:3] for s in st], tags)
        _upsert(conn, {
            "id": "cost-repeat-cases-chronic-sites", "scope": "city", "scope_id": "boston", "metric": "cases",
            "title": (f"{v['cases']:,} rodent cases were reported at {v['sites_with_recurrence']:,} addresses "
                      f"where reports came back; {v['recurrences']:,} came back within 60 days of a closure"),
            "value": v, "source_ids": sorted({s for r in st for s in (r[4] or [])}),
            "caveat": ("Counts cases, not inspector visits: a closure note does not record whether or how often someone "
                       "went on site, nor staff time, so no visit count or dollar figure is derived. "
                       "'On-site action' means the note names an inspection, citation, warning, baiting, abatement, "
                       "cleanup or a no-violation finding. " + PRICE_CAVEAT),
        })
        out["repeat_cases"] = {"status": "ok"}
    else:
        missing.append({"row": "cost-repeat-cases-chronic-sites", "table": "sites", "step": "sites",
                        "why": "sites step failed this run" if not use_sites else "no ranked sites"})

    conn.commit()
    if not out:
        raise MissingInput({"all": missing})
    return {"rows": out, "missing_inputs": missing}
