"""Task 2.5: findings in `correlations` (R5.2, R5.4): trash-storage-vs-rodent, what-worked, move-out-spike.

Each finding is computed independently and reports its own status, so one missing input never
blocks the others. Every title is built from the computed numbers; none is presumed.
Language: "reports", never "rats"; associations, never effects.
"""
from __future__ import annotations

import math
import statistics
from collections import defaultdict
from datetime import date, timedelta

import numpy as np
import psycopg

from ..ingest.common import categories
from .common import (
    MissingInput, cell_ids_for, jsonb, local_date, partial_spearman, permutation_p, r2, spearman, strength,
)

YEAR = 2025
LIVED_IN_MIN_REPORTS = 50  # all-type 311 reports in the cell that year
TRASH_CATS = ["trash_storage", "trash_early", "missed_trash", "dumping", "litter", "dumpster", "move_in_trash"]
DEFAULT_STUDENT_ZIPS = ["02115", "02120", "02134", "02135", "02215"]
CHART_MAX_POINTS = 800


def _upsert(conn: psycopg.Connection, row: dict) -> None:
    conn.execute(
        """insert into correlations (id, title, question, method, unit, stat, strength, chart, caveat, group_name,
             source_ids, sort, computed_at)
           values (%(id)s, %(title)s, %(question)s, %(method)s, %(unit)s, %(stat)s::jsonb, %(strength)s,
             %(chart)s::jsonb, %(caveat)s, %(group_name)s, %(source_ids)s, %(sort)s, now())
           on conflict (id) do update set title = excluded.title, question = excluded.question,
             method = excluded.method, unit = excluded.unit, stat = excluded.stat, strength = excluded.strength,
             chart = excluded.chart, caveat = excluded.caveat, group_name = excluded.group_name,
             source_ids = excluded.source_ids, sort = excluded.sort, computed_at = now()""",
        {**row, "stat": jsonb(row["stat"]), "chart": jsonb(row["chart"])},
    )


# ---------------------------------------------------------------- trash storage vs rodent

def trash_vs_rodent(cells: list[str], rodent: dict[str, int], trash: dict[str, int], volume: dict[str, int],
                    ce_trash: dict[str, int] | None = None, n_perm: int = 499) -> dict:
    """Pure. Per-cell counts -> stats over lived-in cells (volume >= LIVED_IN_MIN_REPORTS)."""
    ids = sorted(c for c in cells if volume.get(c, 0) >= LIVED_IN_MIN_REPORTS)
    if len(ids) < 10:
        return {"n": len(ids), "rho_partial": None, "strength": "none", "insufficient": True}
    y = np.array([rodent.get(c, 0) for c in ids], float)
    x = np.array([trash.get(c, 0) for c in ids], float)
    v = np.array([volume[c] for c in ids], float)
    rho_raw = spearman(x, y)
    rho_part = partial_spearman(x, y, [v])
    p = permutation_p(lambda a, b: partial_spearman(a, b, [v]), x, y, rho_part, n_perm=n_perm)
    rho_rate = spearman(100 * x / v, 100 * y / v)
    out = {"n": len(ids), "rho_raw": r2(rho_raw), "rho_partial": r2(rho_part), "p_perm": r2(p, 4),
           "rho_rates": r2(rho_rate), "strength": strength(rho_part) if p < 0.05 else "none", "n_perm": n_perm,
           "rodent_total": int(y.sum()), "trash_total": int(x.sum())}
    if ce_trash:
        ce = np.array([ce_trash.get(c, 0) for c in ids], float)
        if ce.sum() > 0:
            out["ce_rho_partial"] = r2(partial_spearman(ce, y, [v]))
            out["ce_total"] = int(ce.sum())
    step = max(1, math.ceil(len(ids) / CHART_MAX_POINTS))
    out["points"] = [[r2(100 * x[i] / v[i], 2), r2(100 * y[i] / v[i], 2)] for i in range(0, len(ids), step)]
    return out


def _cell_counts(conn, cats: list[str], year: int, cells: set[str]) -> tuple[dict[str, dict[str, int]], set[str]]:
    rows = conn.execute(
        """select category, lat, lon, source_id from incidents
           where city = 'boston' and category = any(%s) and lat is not null
             and opened_at >= %s and opened_at < %s""",
        (cats, f"{year}-01-01 00:00-05", f"{year + 1}-01-01 00:00-05"),
    ).fetchall()
    ids = cell_ids_for([r[2] for r in rows], [r[1] for r in rows])
    out: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    srcs = set()
    for r, c in zip(rows, ids):
        if c in cells:
            out[r[0]][c] += 1
            srcs.add(r[3])
    return out, srcs


def _bin_counts(conn, table: str, col: str, where: str, params: tuple, cells: set[str]) -> tuple[dict, set]:
    rows = conn.execute(
        f"select lat_bin, lon_bin, sum({col})::int, array_agg(distinct source_id) from {table} "
        f"where city = 'boston' and {where} group by 1, 2", params,
    ).fetchall()
    ids = cell_ids_for([(r[1] + 0.5) / 1000 for r in rows], [(r[0] + 0.5) / 1000 for r in rows])
    out: dict[str, int] = defaultdict(int)
    srcs = set()
    for r, c in zip(rows, ids):
        if c in cells:
            out[c] += r[2]
            srcs.update(r[3])
    return out, srcs


def finding_trash(conn: psycopg.Connection, year: int = YEAR) -> dict:
    cells = {r[0] for r in conn.execute("select id from grid_cells where city = 'boston'").fetchall()}
    if not cells:
        raise MissingInput({"table": "grid_cells", "step": "grid", "why": "unit of analysis"})
    counts, src = _cell_counts(conn, ["rodent", "trash_storage"], year, cells)
    if not counts.get("rodent"):
        raise MissingInput({"table": "incidents", "where": f"category='rodent', {year}", "loader": "rat_audit.ingest.t311"})
    period = (date(year, 1, 1), date(year + 1, 1, 1))
    volume, vsrc = _bin_counts(conn, "report_volume", "n_all", "month >= %s and month < %s", period, cells)
    if not volume:
        raise MissingInput({"table": "report_volume", "where": f"month in {year}", "loader": "rat_audit.ingest.t311 (_volume)",
                            "why": "reporting-volume control"})
    ce, csrc = _bin_counts(conn, "signal_volume", "n", "category = 'ce_trash_storage' and month >= %s and month < %s",
                           period, cells)
    st = trash_vs_rodent(sorted(cells), counts["rodent"], counts.get("trash_storage", {}), volume, ce)
    rho = st.get("rho_partial")
    s = st["strength"]
    if st.get("insufficient"):
        title = "Not enough lived-in cells to test improper trash storage against rodent reports"
    elif s == "none":
        title = "Improper-trash reports and rodent reports show no clear link once reporting volume is controlled"
    else:
        sign = "more" if rho > 0 else "fewer"
        title = f"Blocks with more improper-trash reports have {sign} rodent reports ({s}, partial ρ = {rho:+.2f})"
    pts = st.pop("points", [])
    return {
        "id": "trash-storage-vs-rodent", "title": title,
        "question": "Do blocks with improper trash storage get more rodent reports?",
        "method": (f"Partial Spearman over 250 m cells, {year}: 311 improper-trash-storage reports vs rodent reports, "
                   f"controlling for all-type 311 volume; cells with >= {LIVED_IN_MIN_REPORTS} reports; permutation p."),
        "unit": "250 m grid cell", "stat": {**st, "year": year}, "strength": s,
        "chart": {"type": "scatter", "x_label": "Improper-trash reports per 100 311 reports",
                  "y_label": "Rodent reports per 100 311 reports",
                  "series": [{"name": f"Cells, {year}", "points": pts}]},
        "caveat": ("311 counts are reports, not rats. The volume control removes 'who reports', not every confounder; "
                   "this is an association at block level, not proof that trash causes rodent reports. "
                   "The ZIP-level +0.78 is a reporting artifact and is not shown."),
        "group_name": "food", "source_ids": sorted(src | vsrc | csrc), "sort": 20,
    }


# ---------------------------------------------------------------- what worked

def what_worked(by_tag: dict, labels: dict, a: str = "citation", b: str = "monitoring") -> dict:
    """Pure. by_tag from outcomes.compute -> stat, strength, chart, title."""
    rows = [(t, v) for t, v in by_tag.items() if v.get("n")]
    rows.sort(key=lambda tv: (-tv[1]["n"], tv[0]))
    contrast = None
    s = "none"
    va, vb = by_tag.get(a), by_tag.get(b)
    if va and vb and va.get("n") and vb.get("n"):
        pa, pb = va["n_recurred"] / va["n"], vb["n_recurred"] / vb["n"]
        se = math.sqrt(pa * (1 - pa) / va["n"] + pb * (1 - pb) / vb["n"])
        d = pa - pb
        lo, hi = d - 1.96 * se, d + 1.96 * se
        contrast = {"a": a, "b": b, "diff_pp": r2(100 * d, 2), "ci_pp": [r2(100 * lo, 2), r2(100 * hi, 2)]}
        if lo > 0 or hi < 0:
            s = "moderate" if abs(round(d, 6)) >= 0.05 else "weak"
    if contrast:
        ra, rb = by_tag[a]["recur_60d_pct"], by_tag[b]["recur_60d_pct"]
        la, lb = labels.get(a, a).lower(), labels.get(b, b).lower()
        if s == "none":
            title = (f"New reports within 60 days: {ra}% after {la} vs {rb}% after {lb}, "
                     "a difference the data cannot separate from chance")
        else:
            title = f"New reports within 60 days: {ra}% after {la} vs {rb}% after {lb}"
    else:
        title = "60-day repeat rate by city action (not enough citation or monitoring closures to compare)"
    chart = {"type": "bar", "x_label": "Closure action", "y_label": "% followed by a new report within 60 days",
             "series": [{"name": "60-day repeat rate", "points": [[labels.get(t, t), v["recur_60d_pct"]] for t, v in rows]},
                        {"name": "95% CI low", "points": [[labels.get(t, t), v["ci_low"]] for t, v in rows]},
                        {"name": "95% CI high", "points": [[labels.get(t, t), v["ci_high"]] for t, v in rows]}]}
    stat = {"by_tag": {t: {k: v[k] for k in ("n", "n_recurred", "n_censored", "recur_60d_pct", "ci_low", "ci_high",
                                              "median_days_to_next")} for t, v in rows},
            "contrast": contrast}
    return {"title": title, "stat": stat, "strength": s, "chart": chart}


def finding_what_worked(conn: psycopg.Connection, outcomes: dict | None) -> dict:
    if outcomes is None:
        rows = conn.execute(
            "select action_tag, n, n_recurred, n_censored, recur_60d_pct, ci_low, ci_high, median_days_to_next, "
            "source_ids, observed_through from action_outcomes"
        ).fetchall()
        if not rows:
            raise MissingInput({"table": "action_outcomes", "step": "outcomes"})
        by_tag = {r[0]: {"n": r[1], "n_recurred": r[2], "n_censored": r[3], "recur_60d_pct": r[4], "ci_low": r[5],
                         "ci_high": r[6], "median_days_to_next": r[7], "source_ids": r[8]} for r in rows}
        observed = str(rows[0][9])
    else:
        by_tag, observed = outcomes["by_tag"], outcomes["observed_through"]
    labels = {k: v["label"] for k, v in categories()["actions"].items()}
    w = what_worked(by_tag, labels)
    return {
        "id": "what-worked", "title": w["title"],
        "question": "Which city actions are followed by fewer repeat rodent reports at the same address?",
        "method": ("Closed Boston rodent cases by closure-note action tag; share with a new report at the same address "
                   f"1-60 days after closure. Cases closed in the last 60 days before {observed} are censored "
                   "(excluded), not counted as successes. 95% Wilson intervals; contrast with a normal interval."),
        "unit": "closed rodent case", "stat": {**w["stat"], "observed_through": observed}, "strength": w["strength"],
        "chart": w["chart"],
        "caveat": ("Observational. Inspectors pick the action from what they see, so harder cases may get stronger "
                   "actions; the rates are associations, not the effect of an action. Closure notes are free text "
                   "classified by rules."),
        "group_name": "action", "sort": 10,
        "source_ids": sorted({s for v in by_tag.values() for s in (v.get("source_ids") or [])}),
    }


# ---------------------------------------------------------------- move-out

def week_start(d: date) -> date:
    return d - timedelta(days=d.weekday())


def move_out(weekly: dict[tuple[str, str, date], int], years: list[int], baseline_weeks: int = 8,
             lag_weeks: tuple[int, int] = (1, 4)) -> dict:
    """Pure. weekly[(series, group, week_start)] counts; series in {trash, rodent}, group in {student, rest}."""
    per_year = {}
    curves: dict[tuple[str, str], dict[int, list[float]]] = defaultdict(lambda: defaultdict(list))
    for y in years:
        w0 = week_start(date(y, 9, 1))
        res = {}
        for series in ("trash", "rodent"):
            for group in ("student", "rest", "all"):
                def cnt(w):
                    if group == "all":
                        return weekly.get((series, "student", w), 0) + weekly.get((series, "rest", w), 0)
                    return weekly.get((series, group, w), 0)
                base = statistics.median(cnt(w0 - timedelta(weeks=k)) for k in range(1, baseline_weeks + 1))
                if base <= 0:
                    res[f"{series}_{group}"] = None
                    continue
                spike = cnt(w0) / base
                lag = statistics.mean(cnt(w0 + timedelta(weeks=k)) for k in range(lag_weeks[0], lag_weeks[1] + 1)) / base
                res[f"{series}_{group}"] = {"baseline": base, "week_of_sept1": cnt(w0), "ratio": r2(spike, 2),
                                            "lag_ratio": r2(lag, 2)}
                if group != "all":
                    for k in range(-baseline_weeks, 7):
                        curves[(series, group)][k].append(cnt(w0 + timedelta(weeks=k)) / base)
        per_year[str(y)] = res
    trash_all = [v["trash_all"]["ratio"] for v in per_year.values() if v.get("trash_all")]
    rodent_lag = [v["rodent_all"]["lag_ratio"] for v in per_year.values() if v.get("rodent_all")]
    lo = min(trash_all) if trash_all else None
    s = "none" if lo is None else "strong" if lo >= 1.5 else "moderate" if lo >= 1.2 else "weak" if lo >= 1.05 else "none"
    series = [{"name": f"{series.capitalize()} reports, {group} ZIPs",
               "points": [[k, r2(statistics.mean(v), 2)] for k, v in sorted(pts.items())]}
              for (series, group), pts in sorted(curves.items())]
    return {"per_year": per_year, "trash_ratio_min": lo, "trash_ratio_max": max(trash_all) if trash_all else None,
            "rodent_lag_ratios": rodent_lag, "strength": s, "series": series}


def finding_move_out(conn: psycopg.Connection) -> dict:
    zips, zsrc = DEFAULT_STUDENT_ZIPS, None
    ev = conn.execute(
        "select attrs->'zips', source_id from events where kind = 'move_out' and attrs ? 'zips' order by starts_at desc limit 1"
    ).fetchone()
    if ev and ev[0]:
        zips, zsrc = sorted(ev[0]), ev[1]
    as_of = conn.execute("select max(opened_at) from incidents where city = 'boston' and category = any(%s)",
                         (TRASH_CATS,)).fetchone()[0]
    first = conn.execute("select min(opened_at) from incidents where city = 'boston' and category = any(%s)",
                         (TRASH_CATS,)).fetchone()[0]
    if as_of is None:
        raise MissingInput({"table": "incidents", "where": f"category in {TRASH_CATS}", "loader": "rat_audit.ingest.t311"})
    last, first_d = local_date(as_of), local_date(first)
    years = [y for y in range(2023, last.year + 1)
             if week_start(date(y, 9, 1)) - timedelta(weeks=8) >= first_d
             and week_start(date(y, 9, 1)) + timedelta(weeks=7) <= last]
    if not years:
        raise MissingInput({"table": "incidents", "why": "need a full Jul-Oct window for at least one year"})
    rows = conn.execute(
        """select case when category = 'rodent' then 'rodent' else 'trash' end,
                  case when zip = any(%s) then 'student' else 'rest' end,
                  date_trunc('week', opened_at at time zone 'America/New_York')::date, count(*),
                  array_agg(distinct source_id)
           from incidents
           where city = 'boston' and (category = 'rodent' or category = any(%s))
             and extract(month from opened_at at time zone 'America/New_York') between 5 and 11
           group by 1, 2, 3""",
        (zips, TRASH_CATS),
    ).fetchall()
    weekly = {(r[0], r[1], r[2]): r[3] for r in rows}
    srcs = {s for r in rows for s in r[4]} | ({zsrc} if zsrc else set())
    m = move_out(weekly, years)
    lo, hi = m["trash_ratio_min"], m["trash_ratio_max"]
    lag = m["rodent_lag_ratios"]
    rodent_up = bool(lag) and min(lag) >= 1.1
    if lo is None:
        title = "Sept 1 move-out: not enough trash reports to measure a spike"
    else:
        title = (f"Trash reports jump {lo:.1f}-{hi:.1f}x the week of Sept 1 ({', '.join(map(str, years))}); "
                 + ("rodent reports also rise 1-4 weeks later" if rodent_up
                    else "rodent reports do not rise 1-4 weeks later"))
    stud = [v["trash_student"]["ratio"] for v in m["per_year"].values() if v.get("trash_student")]
    return {
        "id": "move-out-spike", "title": title,
        "question": "Is there a Sept 1 spike in student ZIPs, and do rodent reports follow?",
        "method": ("Weekly 311 trash reports (storage, out early, missed, dumping, litter, dumpster, move-in) and rodent "
                   "reports; the week containing Sept 1 vs the median of the 8 weeks before, per year; rodent lag = "
                   f"mean of weeks +1..+4 over the same baseline. Student ZIPs: {', '.join(zips)}."),
        "unit": "week x ZIP group",
        "stat": {"years": years, "student_zips": zips, "per_year": m["per_year"], "trash_ratio_min": lo,
                 "trash_ratio_max": hi, "trash_student_ratios": stud, "rodent_lag_ratios": lag,
                 "rodent_follows": rodent_up},
        "strength": m["strength"],
        "chart": {"type": "line", "x_label": "Weeks from the week of Sept 1",
                  "y_label": "Reports / median of the 8 weeks before", "series": m["series"]},
        "caveat": ("Strength refers to the trash spike. Reports measure complaints, not trash or rats; the spike is "
                   "seasonal and coincides with move-in as well as move-out. "
                   + ("" if rodent_up else "Rodent reports decline through the fall instead of following the trash spike.")),
        "group_name": "food", "source_ids": sorted(srcs), "sort": 30,
    }


FINDINGS = {
    "trash-storage-vs-rodent": ("grid", finding_trash),
    "what-worked": ("outcomes", finding_what_worked),
    "move-out-spike": (None, finding_move_out),
}


def run(conn: psycopg.Connection, outcomes: dict | None = None, skip: set[str] = frozenset()) -> dict:
    """Compute each finding on its own; `skip` names findings whose upstream step failed."""
    out = {}
    for fid, (dep, fn) in FINDINGS.items():
        if fid in skip:
            out[fid] = {"status": "skipped", "reason": f"upstream step '{dep}' failed"}
            continue
        try:
            row = fn(conn, outcomes) if fid == "what-worked" else fn(conn)
            _upsert(conn, row)
            conn.commit()
            out[fid] = {"status": "ok", "strength": row["strength"], "title": row["title"]}
        except MissingInput as e:
            conn.rollback()
            out[fid] = {"status": "missing_input", "need": e.need}
        except Exception as e:  # noqa: BLE001 - one finding must not stop the others
            conn.rollback()
            out[fid] = {"status": "error", "error": f"{type(e).__name__}: {e}"[:300]}
    return out
