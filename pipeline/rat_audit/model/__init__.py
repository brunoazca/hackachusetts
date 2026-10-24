"""Public interface called by `rat_audit.jobs` (Modal): train / score / simulate.

Each receives an open psycopg connection and commits itself. Language is "expected
reports", never "rats" — the model forecasts 311 rodent *reports*.

* `train(conn)` — feature panel → 26-week rolling-origin backtest (baseline vs GBM) →
  final GBM on all observed weeks → `model_runs` rows (baseline + GBM) → artifact blob →
  site recurrence model. Returns a summary.
* `score(conn)` — loads the latest GBM artifact, writes `predictions` for the backtest
  weeks (with `actual`) and the next 4 weeks (from the coming Monday), with risk band,
  p_any and drivers; emerging hotspots go to the run's `metrics.emerging`.
* `simulate(conn, request)` — what-if for one cell or site: `{cell_id|site_id,
  interventions, weeks}` → `{baseline, scenario, delta, caveat}`.
"""
from __future__ import annotations

import io
import json
from datetime import date, datetime, timedelta, timezone

import numpy as np
import pandas as pd
import psycopg

from . import artifacts, backtest, explain
from .baseline import MODEL as BASELINE_MODEL
from .features import CORE, build_panel, cell_ids_for, monday
from .gbm import MODEL as GBM_MODEL, PARAMS, PoissonGBM
from .grid import build_grid, boston_boundary_from_db, grid_cells_count
from .recurrence import site_recurrence_logit
from .surface import build_surfaces

FUTURE_WEEKS = 4
CAVEAT = "Model estimate, not a measured effect. Expected 311 rodent reports, not a count of rats."


def _run_id(prefix: str) -> str:
    return f"{prefix}-{datetime.now(timezone.utc):%Y%m%dT%H%M%S}"


def _insert_run(conn, run_id, model, through, params, metrics, importance):
    conn.execute(
        """
        insert into model_runs (id, model, trained_through, params, metrics, feature_importance)
        values (%s, %s, %s, %s::jsonb, %s::jsonb, %s::jsonb)
        """,
        (run_id, model, through, json.dumps(params, default=str), json.dumps(metrics, default=str),
         json.dumps(importance, default=str)),
    )


def train(conn: psycopg.Connection) -> dict:
    panel = build_panel(conn)
    through = max(panel.loc[~panel["is_future"], "week_start"])
    metrics, bt = backtest.run(panel, features=CORE)

    gbm = PoissonGBM(CORE).fit(panel[~panel["is_future"]])
    importance = gbm.importance(panel)

    base_id, gbm_id = _run_id("baseline-v1"), _run_id("risk-v1")
    _insert_run(conn, base_id, BASELINE_MODEL, through, {"method": "mean of last 4 weeks"},
                {k: metrics[k] for k in ("backtest_weeks", "backtest_from", "backtest_to")}
                | {"mae": metrics["baseline_mae"], "top10pct_capture": metrics["baseline_top10pct_capture"]}, [])
    _insert_run(conn, gbm_id, GBM_MODEL, through, PARAMS | {"features": CORE}, metrics, importance)
    size = artifacts.save_model(conn, gbm_id, {
        "model": gbm, "features": CORE, "through": through,
        "backtest": bt[["cell_id", "week_start", "y", "baseline", "gbm"]],
    })
    conn.commit()

    recur = site_recurrence_logit(conn)
    recur.pop("_fitted", None)
    conn.commit()
    return {"model_run_id": gbm_id, "baseline_run_id": base_id, "trained_through": str(through),
            "metrics": metrics, "top_features": importance[:5], "artifact_bytes": size, "recurrence": recur}


def ensure_grid_cells(conn: psycopg.Connection) -> int:
    """`predictions.cell_id` references `grid_cells`. If Carol's table is still empty, seed it
    with the same 250 m fallback grid (same ids) so forecasts can be written. Never touches
    existing rows. Returns the number of rows inserted."""
    if grid_cells_count(conn) > 0:
        return 0
    cells = build_grid(boston_boundary_from_db(conn))
    with conn.cursor() as cur:
        cur.executemany(
            """
            insert into grid_cells (id, geom, lat, lon, city)
            values (%s, st_geogfromtext(%s), %s, %s, 'boston')
            on conflict (id) do nothing
            """,
            [(c["id"], "SRID=4326;" + c["geom_ll"].wkt, c["lat"], c["lon"]) for c in cells],
        )
    return len(cells)


def _copy_predictions(conn, df: pd.DataFrame) -> None:
    cols = ["cell_id", "week_start", "model_run_id", "expected", "p_any", "risk_band", "actual", "drivers"]
    with conn.cursor() as cur, cur.copy(f"copy predictions ({', '.join(cols)}) from stdin") as cp:
        for r in df[cols].itertuples(index=False):
            cp.write_row(r)


def score(conn: psycopg.Connection, *, future_start: date | None = None) -> dict:
    seeded = ensure_grid_cells(conn)
    latest = artifacts.load_latest(conn, GBM_MODEL)
    if latest is None:
        return {"skipped": "no trained model yet — run train first"}
    run_id, art = latest
    model: PoissonGBM = art["model"]
    if future_start is None:
        future_start = monday(date.today()) + timedelta(days=7)
    panel = build_panel(conn, through=art["through"], future_start=future_start, future_weeks=FUTURE_WEEKS)
    valid = {r[0] for r in conn.execute("select id from grid_cells")}

    # Next 4 weeks.
    fut = panel[panel["is_future"] & panel["cell_id"].isin(valid)].copy()
    fut["expected"] = model.predict(fut)
    fut["risk_band"] = explain.risk_bands(fut["expected"], fut["week_start"])
    first = fut[fut["week_start"] == fut["week_start"].min()]
    reference = panel[~panel["is_future"]].tail(200_000)
    drv = dict(zip(first["cell_id"], explain.drivers(model, first, reference)))
    fut["drivers"] = fut["cell_id"].map(drv)
    fut["actual"] = None
    emerging = explain.emerging(first, first["risk_band"])

    # Backtest weeks (out-of-sample GBM predictions from training, with actuals).
    bt = art["backtest"]
    bt = bt[bt["cell_id"].isin(valid)].copy()
    bt["expected"] = bt["gbm"]
    bt["risk_band"] = explain.risk_bands(bt["expected"], bt["week_start"])
    bt["actual"] = bt["y"].astype(int)
    bt["drivers"] = [[] for _ in range(len(bt))]

    out = pd.concat([bt, fut], ignore_index=True)
    out["model_run_id"] = run_id
    out["expected"] = out["expected"].astype(float).round(5)
    out["p_any"] = explain.p_any(out["expected"]).round(5)
    out["drivers"] = out["drivers"].map(lambda d: json.dumps(d or []))
    out["actual"] = out["actual"].astype(object).where(out["actual"].notna(), None)

    conn.execute("delete from predictions where model_run_id = %s", (run_id,))
    _copy_predictions(conn, out)
    em = [{"cell_id": r.cell_id, "kind": r.kind, "signals": r.signals} for r in emerging.itertuples()]
    conn.execute(
        "update model_runs set metrics = metrics || %s::jsonb where id = %s",
        (json.dumps({"emerging": em, "scored_at": datetime.now(timezone.utc).isoformat(),
                     "forecast_from": str(future_start)}), run_id),
    )
    surfaces = build_surfaces(conn, run_id)
    conn.commit()
    return {
        "model_run_id": run_id, "grid_cells_seeded": seeded,
        "backtest_rows": int(len(bt)), "forecast_rows": int(len(fut)),
        "forecast_weeks": sorted(str(w) for w in fut["week_start"].unique()),
        "bands": fut[fut["week_start"] == fut["week_start"].min()]["risk_band"].value_counts().to_dict(),
        "emerging": int((emerging["kind"] == "emerging_hotspot").sum()),
        "early_warning": int((emerging["kind"] == "early_warning").sum()),
        "surfaces": surfaces,
    }


# What-if interventions: feature -> multiplier on the underlying counts (features are log1p counts).
INTERVENTIONS = {
    "trash_storage": {"trash_storage_s4": 0.5, "trash_storage_s12": 0.5, "ring_trash_storage_s4": 0.5,
                      "ce_trash_storage_s4": 0.5, "ce_trash_storage_s12": 0.5, "ring_ce_trash_storage_s4": 0.5,
                      "ce_overfill_s4": 0.5, "ce_overfill_s12": 0.5},
    "clear_lot": {"weeds_s4": 0.0, "weeds_s12": 0.0, "dumping_s4": 0.5, "dumping_s12": 0.5,
                  "litter_s4": 0.5, "litter_s12": 0.5},
    "pest_followup": {"pest_s4": 0.5, "pest_s12": 0.5, "ring_pest_s4": 0.5},
}


def simulate(conn: psycopg.Connection, request: dict) -> dict:
    latest = artifacts.load_latest(conn, GBM_MODEL)
    if latest is None:
        return {"error": "no trained model yet"}
    run_id, art = latest
    model: PoissonGBM = art["model"]
    weeks = int(request.get("weeks") or FUTURE_WEEKS)
    interventions = [i for i in (request.get("interventions") or []) if i in INTERVENTIONS]
    unknown = [i for i in (request.get("interventions") or []) if i not in INTERVENTIONS]

    cell_id = request.get("cell_id")
    if not cell_id and request.get("site_id"):
        row = conn.execute("select lon, lat from sites where id = %s", (request["site_id"],)).fetchone()
        if not row:
            return {"error": f"unknown site_id {request['site_id']}"}
        cell_id = str(cell_ids_for(np.array([row[0]]), np.array([row[1]]))[0])
    if not cell_id:
        return {"error": "request needs cell_id or site_id"}

    panel = build_panel(conn, through=art["through"], future_start=monday(date.today()) + timedelta(days=7),
                        future_weeks=weeks)
    rows = panel[panel["is_future"] & (panel["cell_id"] == cell_id)]
    if rows.empty:
        return {"error": f"cell {cell_id} is outside the forecast grid"}
    base = model.predict(rows)
    alt = rows.copy()
    for name in interventions:
        for f, k in INTERVENTIONS[name].items():
            alt[f] = np.log1p(np.expm1(alt[f]) * k)
    scen = model.predict(alt)
    return {
        "model_run_id": run_id, "cell_id": cell_id, "weeks": weeks,
        "interventions": interventions, "ignored": unknown,
        "baseline": round(float(base.sum()), 3),
        "scenario": round(float(scen.sum()), 3),
        "delta": round(float(scen.sum() - base.sum()), 3),
        "by_week": [{"week_start": str(w), "baseline": round(float(b), 4), "scenario": round(float(s), 4)}
                    for w, b, s in zip(rows["week_start"], base, scen)],
        "caveat": CAVEAT,
    }


__all__ = ["train", "score", "simulate", "ensure_grid_cells", "INTERVENTIONS", "CAVEAT"]
