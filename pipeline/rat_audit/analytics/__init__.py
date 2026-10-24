"""Analytics core: grid, closure classifier, outcomes, sites, findings, counted costs.

`run_all(conn)` is what `rat_audit.jobs.analytics()` calls. Steps and what each one needs:

    grid          tracts (Boston boundary)                     -> grid_cells
    classify      incidents (rodent closure notes)             -> incidents.action_tag
    outcomes      classify                                     -> action_outcomes
    sites         classify (+ outcomes for the evidence text)  -> sites
    correlations  trash <- grid, what-worked <- outcomes,      -> correlations
                  move-out <- incidents only
    costs         spending, places(restaurant), sites          -> price_impact

A step whose required upstream step failed in this run is skipped, not run on stale data. Each step
commits on its own, so a failure never undoes the steps before it. The result (and an
`analytics_runs` row) says, per step: status ok | partial | skipped | missing_input | error, counts, timing,
and for missing inputs exactly which table/loader is needed.
"""
from __future__ import annotations

import time
from datetime import datetime, timezone

import psycopg

from . import classify, correlations, costs, grid, outcomes, sites, research, impact, regional, unknowns
from .common import MissingInput, jsonb

STEPS = ["grid", "classify", "outcomes", "sites", "correlations", "costs", "research", "impact", "regional", "unknowns"]
REQUIRES = {"outcomes": ["classify"], "sites": ["classify", "outcomes"], "impact": ["sites", "grid"], "unknowns": ["sites"]}


def _log_start(conn: psycopg.Connection) -> int | None:
    try:
        rid = conn.execute("insert into analytics_runs default values returning id").fetchone()[0]
        conn.commit()
        return rid
    except psycopg.Error:
        conn.rollback()
        return None


def _log_end(conn: psycopg.Connection, rid: int | None, ok: bool, steps: dict) -> None:
    if rid is None:
        return
    try:
        conn.execute("update analytics_runs set finished_at = now(), ok = %s, steps = %s::jsonb where id = %s",
                     (ok, jsonb(steps), rid))
        conn.commit()
    except psycopg.Error:
        conn.rollback()


def select_steps(steps: list[str] | None) -> list[str]:
    """Validate before touching the DB; run a nonempty subset in dependency order."""
    if steps is None:
        return list(STEPS)
    if not steps:
        raise ValueError("at least one analytics step is required")
    unknown = set(steps) - set(STEPS)
    if unknown:
        raise ValueError(f"unknown analytics steps: {', '.join(repr(s) for s in sorted(unknown))}")
    return [s for s in STEPS if s in steps]


def run_all(conn: psycopg.Connection, steps: list[str] | None = None, *, unknowns_drafter=None) -> dict:
    wanted = select_steps(steps)
    rid = _log_start(conn)
    res: dict[str, dict] = {}
    oc: dict | None = None

    def status(name: str) -> str | None:
        return res.get(name, {}).get("status")

    for name in wanted:
        failed = [d for d in REQUIRES.get(name, []) if d in wanted and status(d) != "ok"]
        if failed:
            res[name] = {"status": "skipped", "reason": f"requires {', '.join(failed)}, which did not succeed"}
            continue
        t0 = time.monotonic()
        try:
            if name == "grid":
                out = grid.run(conn)
            elif name == "classify":
                out = classify.run(conn)
            elif name == "outcomes":
                out = outcomes.run(conn)
                oc = out
            elif name == "sites":
                out = sites.run(conn, outcomes=oc["by_tag"] if oc else None)
            elif name == "correlations":
                skip = set()
                if "grid" in wanted and status("grid") != "ok":
                    skip.add("trash-storage-vs-rodent")
                if "outcomes" in wanted and status("outcomes") != "ok":
                    skip.add("what-worked")
                out = {"findings": correlations.run(conn, outcomes=oc, skip=skip)}
            elif name == "costs":
                out = costs.run(conn, use_sites=not ("sites" in wanted and status("sites") != "ok"))
            elif name == "research":
                out = research.run(conn)
            elif name == "impact":
                out = impact.run(conn)
            elif name == "regional":
                out = regional.run(conn)
            elif name == "unknowns":
                out = unknowns.run(conn, draft=unknowns_drafter)
            step_status = "ok"
            if name == "correlations":
                statuses = [f["status"] for f in out["findings"].values()]
                if not any(s == "ok" for s in statuses):
                    step_status = "error"
                elif not all(s == "ok" for s in statuses):
                    step_status = "partial"
            elif name in {"costs", "sites", "impact", "regional", "unknowns"} and out.get("missing_inputs"):
                step_status = "partial"
            res[name] = {"status": step_status, **out}
        except MissingInput as e:
            conn.rollback()
            res[name] = {"status": "missing_input", "need": e.need}
        except Exception as e:  # noqa: BLE001 - one step must not stop the independent ones
            conn.rollback()
            res[name] = {"status": "error", "error": f"{type(e).__name__}: {e}"[:500]}
        res[name]["seconds"] = round(time.monotonic() - t0, 2)
    ok = all(r["status"] == "ok" and r.get("quality_ok", True) for r in res.values())
    _log_end(conn, rid, ok, res)
    return {"ok": ok, "run_id": rid, "finished_at": datetime.now(timezone.utc).isoformat(), "steps": res}


__all__ = ["run_all", "STEPS"]
