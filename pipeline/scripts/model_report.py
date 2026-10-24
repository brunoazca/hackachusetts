"""Build the model report page (docs/rat-audit/model-report/index.html) from the live database.

Exports three datasets and injects them into docs/rat-audit/model-report/template.html:

* forecast  — next 4 weeks per 250 m block from the newest scored run (`forecast_run_id()`),
              with drivers, emerging flags and neighborhood;
* compare   — actual vs model: `bt26` = the run's own 26-week backtest (saved in its artifact),
              `bt` = a long rolling-origin backtest since 2024 (slow: ~45 min, retrain every 8 weeks);
              plus `recur` = recurrence model test-set calibration and current scores per block.

Usage (from pipeline/, with SUPABASE_DB_URL set):
    uv run python scripts/model_report.py            # everything, incl. the long backtest
    uv run python scripts/model_report.py --quick    # skip the long backtest (reuses data/bt_long.json if present)
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

import pandas as pd
import psycopg
from sklearn.linear_model import LogisticRegression

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from rat_audit.model import artifacts  # noqa: E402
from rat_audit.model.backtest import run as run_backtest  # noqa: E402
from rat_audit.model.features import CORE, build_panel, cell_ids_for  # noqa: E402
from rat_audit.model.recurrence import _load, build_cases, fit  # noqa: E402

OUT = Path(__file__).resolve().parents[2] / "docs" / "rat-audit" / "model-report"
LONG_FROM = "2024-01-01"


def export_forecast(conn) -> dict:
    run = conn.execute("select forecast_run_id()").fetchone()[0]
    m, through = conn.execute("select metrics, trained_through from model_runs where id = %s", (run,)).fetchone()
    rows = conn.execute(
        "select cell_id, week_start, expected, p_any, risk_band, drivers from predictions "
        "where model_run_id = %s and actual is null order by week_start", (run,)).fetchall()
    weeks = sorted({str(r[1]) for r in rows})
    cells: dict[str, dict] = {}
    for cid, w, e, p, b, d in rows:
        i = weeks.index(str(w))
        x = cells.setdefault(cid, {"e": [None] * len(weeks), "b": [None] * len(weeks)})
        x["e"][i] = round(e, 3)
        x["b"][i] = "v" if b == "very_high" else b[0]
        if i == 0:
            x["p"] = round(p, 3)
            x["d"] = [[k["label"], round(k["contribution"], 3), k["value"]] for k in d[:3]]
    last = conn.execute("select max(week_start) from predictions where model_run_id = %s and actual is not null", (run,)).fetchone()[0]
    for cid, a in conn.execute(
            "select cell_id, sum(actual) from predictions where model_run_id = %s and actual is not null "
            "and week_start > %s::date - 84 group by 1", (run, last)):
        if cid in cells:
            cells[cid]["a"] = int(a)
    for cid, h in conn.execute(
            "select g.id, mode() within group (order by i.neighborhood) from grid_cells g join incidents i "
            "on i.city = 'boston' and i.neighborhood is not null and st_dwithin(i.geom, g.geom, 0) group by 1"):
        if cid in cells:
            cells[cid]["n"] = h
    em = {x["cell_id"]: ("h" if x["kind"] == "emerging_hotspot" else "w") for x in m.get("emerging", [])}
    out = []
    for cid, x in cells.items():
        _, col, row = cid.split("_")
        x.update(i=cid, c=int(col), r=int(row))
        if cid in em:
            x["m"] = em[cid]
        out.append(x)
    keys = ["mae", "baseline_mae", "top10pct_capture", "baseline_top10pct_capture", "backtest_from", "backtest_to", "actual_reports"]
    return {"meta": {"run": run, "weeks": weeks, "trained_through": str(through), "metrics": {k: m[k] for k in keys}}, "cells": out}


def summarize_backtest(bt: pd.DataFrame, refit: int) -> dict:
    bt = bt.copy()
    bt["week_start"] = bt["week_start"].astype(str)
    weeks = sorted(bt["week_start"].unique())

    def cap(g, col):
        k = max(1, round(len(g) * 0.1))
        return g.nlargest(k, col)["y"].sum() / max(g["y"].sum(), 1)

    weekly = [{"w": w, "y": int(g.y.sum()), "g": round(float(g.gbm.sum()), 1), "b": round(float(g.baseline.sum()), 1),
               "cg": round(float(cap(g, "gbm")), 3), "cb": round(float(cap(g, "baseline")), 3)} for w, g in bt.groupby("week_start")]
    bins = [0, .02, .05, .1, .2, .4, .7, 1.2, 99]
    cal = []
    for col in ("gbm", "baseline"):
        t = bt.groupby(pd.cut(bt[col], bins, right=False), observed=True).agg(
            pred=(col, "mean"), act=("y", "mean"), n=("y", "size")).reset_index()
        cal.append([{"lo": float(r[col].left), "hi": float(r[col].right), "pred": round(r.pred, 4),
                     "act": round(r.act, 4), "n": int(r.n)} for _, r in t.iterrows()])
    py = bt.pivot(index="cell_id", columns="week_start", values="y").reindex(columns=weeks).fillna(0).astype(int)
    pg = bt.pivot(index="cell_id", columns="week_start", values="gbm").reindex(columns=weeks).fillna(0)
    cells = {cid: [py.loc[cid].tolist(), [round(v, 2) for v in pg.loc[cid].tolist()]] for cid in py.index}
    return {"weeks": weeks, "weekly": weekly, "cal": cal, "cells": cells, "refit": refit}


def export_recurrence(conn) -> dict:
    rodent, cosig = _load(conn)
    cases = build_cases(rodent, cosig)
    res = fit(cases)
    obs = cases[cases["observed"]].sort_values("closed_at")
    cut = pd.Timestamp(res["metrics"]["test_from"], tz="UTC")
    tr, te = obs[obs.closed_at <= cut], obs[obs.closed_at > cut]
    m = LogisticRegression(max_iter=2000).fit(tr[res["features"]], tr["y"])
    te = te.assign(p=m.predict_proba(te[res["features"]])[:, 1])
    te["dec"] = pd.qcut(te["p"].rank(method="first"), 10, labels=False)
    cal = [{"d": int(d) + 1, "pred": round(float(g.p.mean()), 3), "act": round(float(g.y.mean()), 3), "n": int(len(g))}
           for d, g in te.groupby("dec")]
    ll = pd.DataFrame(conn.execute(
        "select id, lon, lat from incidents where city = 'boston' and category = 'rodent' and lon is not null").fetchall(),
        columns=["id", "lon", "lat"])
    end = cases["closed_at"].max()
    recent = cases[cases["closed_at"] > end - pd.Timedelta(days=90)].merge(ll, on="id")
    recent = recent.assign(p=res["model"].predict_proba(recent[res["features"]])[:, 1])
    recent["cell"] = cell_ids_for(recent.lon.values, recent.lat.values)
    by_cell = {}
    for cid, g in recent.groupby("cell"):
        top = g.sort_values("p", ascending=False).iloc[0]
        by_cell[cid] = [int(len(g)), round(float(g.p.mean()), 3), round(float(g.p.max()), 3), top.address_block or ""]
    mt = res["metrics"]
    return {"auc": round(mt["auc"], 3), "base_rate": round(mt["base_rate"], 3), "n_train": mt["n_train"], "n_test": mt["n_test"],
            "test_from": mt["test_from"], "test_rate": round(float(te.y.mean()), 3), "cal": cal,
            "factors": [[f["label"], f["direction"], f["importance"]] for f in res["feature_importance"][:8]],
            "recent_from": str((end - pd.Timedelta(days=90)).date()), "recent_to": str(end.date()),
            "recent_n": int(len(recent)), "cells": by_cell}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--quick", action="store_true", help="skip the ~45 min long backtest")
    args = ap.parse_args()
    data = OUT / "data"
    data.mkdir(parents=True, exist_ok=True)
    with psycopg.connect(os.environ["SUPABASE_DB_URL"]) as conn:
        forecast = export_forecast(conn)
        print("forecast:", forecast["meta"]["run"], len(forecast["cells"]), "cells", flush=True)
        art = artifacts.load_model(conn, forecast["meta"]["run"])
        bt26 = summarize_backtest(art["backtest"], refit=4)
        recur = export_recurrence(conn)
        print("recurrence: AUC", recur["auc"], flush=True)
        long_path = data / "bt_long.json"
        if not args.quick:
            panel = build_panel(conn, through=pd.Timestamp(forecast["meta"]["trained_through"]).date())
            weeks = sorted(panel.loc[~panel["is_future"], "week_start"].unique())
            n = sum(1 for w in weeks if str(w) >= LONG_FROM)
            print("long backtest:", n, "weeks (slow)", flush=True)
            metrics, bt = run_backtest(panel, weeks=n, refit_every=8, features=CORE)
            json.dump(summarize_backtest(bt, refit=8) | {"metrics": metrics}, open(long_path, "w"), separators=(",", ":"))
    compare = {"bt26": bt26, "recur": recur}
    if long_path.exists():
        compare["bt"] = json.load(open(long_path))
    tpl = (OUT / "template.html").read_text()
    html = tpl.replace("__FORECAST__", json.dumps(forecast, separators=(",", ":"))).replace(
        "__COMPARE__", json.dumps(compare, separators=(",", ":")))
    (OUT / "index.html").write_text(html)
    print("wrote", OUT / "index.html", f"{len(html) // 1024} KB")


if __name__ == "__main__":
    main()
