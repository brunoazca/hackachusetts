"""Three-city panel (Boston, Cambridge, Somerville) on features all three can have.

Experiment-only: the production model is still `features.build_panel` (Boston). This builds
one row per (city cell, ISO week) from 2023-01-02, with the same lagged windows, so a pooled
model and per-city models can be backtested side by side (`per_city_metrics`).

* Cells: Boston = Carol's `grid_cells`; Cambridge/Somerville = the same 250 m lattice built in
  memory over each city's incident footprint (never written to `grid_cells`). Ids are prefixed
  with the city (`cambridge:g250_…`) because border cells share a lattice id.
* A 311 signal a city does not collect is NaN for that city's cells, never 0 (0 would read as
  "no problem here"); HistGradientBoosting routes NaN on its own.
* Somerville points are census-block centroids, so in-cell counts are coarse there; the ring
  (8 neighbouring cells, ~250 m around) carries most of its spatial signal.
"""
from __future__ import annotations

from datetime import date, timedelta

import numpy as np
import pandas as pd
import psycopg

from .backtest import top_capture
from .features import (
    ACS, LABELS, _acs, _counts, _cum, _ring, _weather, _window_sum, cell_ids_for, monday,
)
from .grid import CELL_M, build_grid, load_or_build_cells

CITIES = ["boston", "cambridge", "somerville"]
START = date(2023, 1, 2)
# Signals collected in at least two of the three cities; NaN where a city lacks one.
SHARED_SIGNALS = ["dead_animal", "pest", "litter", "dumping", "weeds", "trash_storage", "trash_early"]
SHARED_RING = ["dead_animal", "pest", "litter", "dumping"]

SHARED = (
    ["rodent_l1", "rodent_m4", "rodent_m12", "rodent_ly", "ring_rodent_m4", "ring_rodent_m12"]
    + [f"{k}_s{w}" for k in SHARED_SIGNALS for w in (4, 12)]
    + [f"ring_{k}_s4" for k in SHARED_RING]
    + ["vol_311_52", "parcels", "yr_built_med", "units", "woy_sin", "woy_cos", "move_out", "tmax_m4"]
)
WITH_ACS = SHARED + list(ACS)
CITY_CODE = {c: i for i, c in enumerate(CITIES)}
LABELS.setdefault("city_code", "City")


def _cells(conn: psycopg.Connection, city: str) -> list[dict]:
    if city == "boston":
        cells = load_or_build_cells(conn)
    else:
        gj = conn.execute(
            """
            select st_asgeojson(st_buffer(st_convexhull(st_collect(geom::geometry))::geography, %s)::geometry)
            from incidents where city = %s and geom is not null
            """,
            (CELL_M / 2, city),
        ).fetchone()[0]
        cells = build_grid(__import__("json").loads(gj))
    for c in cells:
        if c["col"] is None:
            _, col, row = c["id"].split("_")
            c["col"], c["row"] = int(col), int(row)
    return cells


def _city_panel(conn: psycopg.Connection, city: str, weeks: pd.DatetimeIndex, wx: pd.DataFrame) -> pd.DataFrame:
    cells = _cells(conn, city)
    ids = [c["id"] for c in cells]
    pos = {cid: i for i, cid in enumerate(ids)}
    cols = np.array([c["col"] for c in cells])
    rows = np.array([c["row"] for c in cells])
    inc = pd.DataFrame(
        conn.execute(
            "select category, opened_at, lon, lat from incidents where city = %s and lon is not null "
            "and opened_at >= %s and opened_at < %s",
            (city, weeks[0].date(), (weeks[-1] + pd.Timedelta(days=7)).date()),
        ).fetchall(),
        columns=["category", "opened_at", "lon", "lat"],
    )
    t = pd.to_datetime(inc["opened_at"], utc=True).dt.tz_convert("America/New_York").dt.tz_localize(None).dt.normalize()
    inc["week"] = t - pd.to_timedelta(t.dt.weekday, unit="D")
    inc["cell_id"] = cell_ids_for(inc["lon"].values, inc["lat"].values)
    present = set(inc["category"].unique())

    def mat(sel):
        return _counts(inc[sel], pos, weeks)

    f: dict[str, np.ndarray] = {}
    rod = mat(inc["category"] == "rodent")
    c = _cum(rod)
    f["rodent_l1"], f["rodent_m4"] = _window_sum(c, 1, 1), _window_sum(c, 1, 4) / 4
    f["rodent_m12"], f["rodent_ly"] = _window_sum(c, 1, 12) / 12, _window_sum(c, 52, 52)
    rr = _cum(_ring(rod, cols, rows))
    f["ring_rodent_m4"], f["ring_rodent_m12"] = _window_sum(rr, 1, 4) / 4, _window_sum(rr, 1, 12) / 12
    nan = np.full_like(rod, np.nan)
    for k in SHARED_SIGNALS:
        if k not in present:
            f[f"{k}_s4"] = f[f"{k}_s12"] = nan
            if k in SHARED_RING:
                f[f"ring_{k}_s4"] = nan
            continue
        m = mat(inc["category"] == k)
        cm = _cum(m)
        f[f"{k}_s4"], f[f"{k}_s12"] = np.log1p(_window_sum(cm, 1, 4)), np.log1p(_window_sum(cm, 1, 12))
        if k in SHARED_RING:
            f[f"ring_{k}_s4"] = np.log1p(_window_sum(_cum(_ring(m, cols, rows)), 1, 4))
    f["vol_311_52"] = np.log1p(_window_sum(_cum(mat(inc["category"] != "rodent")), 1, 52))

    n_c, n_w = len(ids), len(weeks)
    p = pd.DataFrame({"cell_id": np.repeat([f"{city}:{i}" for i in ids], n_w),
                      "week_start": np.tile(weeks.values, n_c), "y": rod.ravel(), "city": city})
    for k, v in f.items():
        p[k] = v.ravel().astype(np.float32)

    par = pd.DataFrame(conn.execute("select lon, lat, yr_built, units from parcels where city = %s and lon is not null",
                                    (city,)).fetchall(), columns=["lon", "lat", "yr_built", "units"])
    par["cid"] = cell_ids_for(par["lon"].values, par["lat"].values)
    par["yr_built"] = pd.to_numeric(par["yr_built"], errors="coerce").where(lambda s: s.between(1700, 2030))
    par["units"] = pd.to_numeric(par["units"], errors="coerce")
    st = pd.DataFrame(index=pd.Index(ids, name="cid")).join(
        par.groupby("cid").agg(parcels=("lon", "size"), yr_built_med=("yr_built", "median"), units=("units", "sum")))
    st[["parcels", "units"]] = st[["parcels", "units"]].fillna(0)
    st["yr_built_med"] = st["yr_built_med"].fillna(st["yr_built_med"].median())
    st = st.join(_acs(conn, cells))
    st.index = [f"{city}:{i}" for i in st.index]
    p = p.merge(st, left_on="cell_id", right_index=True, how="left")
    p = p.merge(wx[["tmax_m4"]], left_on="week_start", right_index=True, how="left")
    return p


def build_city_panel(conn: psycopg.Connection, *, through: date | None = None, cities=CITIES) -> pd.DataFrame:
    """Observed rows only (no future weeks): cell_id, week_start, y, city, city_code + WITH_ACS."""
    if through is None:
        last = conn.execute("select max(opened_at) from incidents where category = 'rodent' and city = 'boston'").fetchone()[0]
        through = monday(last) - timedelta(days=7)
    weeks = pd.date_range(pd.Timestamp(START), pd.Timestamp(monday(through)), freq="7D")
    wk = _weather(conn, weeks)
    tm = np.concatenate([[0.0], np.cumsum(wk["tmax"].values)])
    t = np.arange(len(weeks))
    lo = np.clip(t - 4, 0, None)
    wx = pd.DataFrame({"tmax_m4": (tm[t] - tm[lo]) / np.maximum(t - lo, 1)}, index=weeks)
    p = pd.concat([_city_panel(conn, c, weeks, wx) for c in cities], ignore_index=True)
    woy = p["week_start"].dt.isocalendar().week.astype(float)
    p["woy_sin"], p["woy_cos"] = np.sin(2 * np.pi * woy / 52.18), np.cos(2 * np.pi * woy / 52.18)
    ws = p["week_start"]
    p["move_out"] = ((ws.dt.month == 8) & (ws.dt.day >= 26) | (ws.dt.month == 9) & (ws.dt.day <= 7)).astype(float)
    p["city_code"] = p["city"].map(CITY_CODE).astype(float)
    p["is_future"] = False
    p["week_start"] = p["week_start"].dt.date
    return p


def per_city_metrics(preds: pd.DataFrame) -> dict:
    """Top-10% capture and MAE per city (ranked within the city each week), GBM vs 4-week mean."""
    out = {}
    for city, g in preds.assign(city=preds["cell_id"].str.split(":").str[0]).groupby("city"):
        out[city] = {
            "cells": int(g["cell_id"].nunique()), "actual_reports": int(g["y"].sum()),
            "top10pct_capture": round(top_capture(g, "gbm"), 4),
            "baseline_top10pct_capture": round(top_capture(g, "baseline"), 4),
            "mae": round(float((g["gbm"] - g["y"]).abs().mean()), 5),
            "baseline_mae": round(float((g["baseline"] - g["y"]).abs().mean()), 5),
        }
        out[city]["mae_beats_baseline"] = out[city]["mae"] < out[city]["baseline_mae"]
    return out


__all__ = ["CITIES", "SHARED", "WITH_ACS", "build_city_panel", "per_city_metrics"]
