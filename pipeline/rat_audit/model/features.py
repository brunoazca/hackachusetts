"""Per-cell, per-ISO-week feature matrix for the rodent forecast (design §5, R6).

Target `y` = Boston rodent reports in a 250 m cell during an ISO week (Monday start).
Every feature for week t uses data from weeks < t only (no leakage):

* CORE — what validation showed predicts: rodent lags (t-1, mean t-1..4, mean t-1..12,
  same week last year), ring (8 neighbour cells) rodent lags, leading 311 signals in
  cell + ring (dead animal, indoor pest, improper trash storage, overflowing, out early,
  weeds, litter, move-in trash, dumping), code-enforcement tickets, static controls
  (trailing-year non-rodent 311 volume, parcel count, median year built, units),
  calendar (week-of-year sin/cos, Sept 1 move-out flag) and mean max temperature.
* CANDIDATE — signals that were null in the univariate validation (rain, snow,
  demolitions/excavations, restaurants, Big Belly bins, vacant parcels, events). Kept in a
  separate group so the backtest can test them with and without; the model keeps them
  only if they improve held-out error.

Backtest of new data, Oct 24 (26 weeks; CORE = top-10% capture 0.643, MAE 0.0752). Promotion
needs ≥ +0.5 pt capture and no worse MAE; nothing passed, so CORE is unchanged:
city lots +0.45 pt (MAE worse), extra weather +0.23 (worse), ACS +0.14 (worse), permits +0.09
(worse), iNaturalist −0.02, ring litter/dumping/overflow −0.14 (MAE better), food-inspection
rodent fails −0.40, all together +0.09 (worse). Not tested: ce_dumping/ce_weeds/ce_dumpster
(data only from 2026-04-25) and smart rat boxes (no rows). Leave-one-group-out: dropping rodent
history, neighbours or season costs ~0.8–0.9 pt; dropping total 311 volume improves MAE 1.4%.
Rows in `model_runs` where model = 'cell_week_poisson_gbm_ablation'.

Cells come from `grid.load_or_build_cells` (Carol's `grid_cells`, else the 250 m fallback).
Points map to cells by the same EPSG:26986 lattice, so ids match either way.
"""
from __future__ import annotations

from datetime import date, timedelta

import numpy as np
import pandas as pd
import psycopg
from pyproj import Transformer

from .grid import CELL_M, SRID_LL, SRID_M, load_or_build_cells

START = date(2016, 1, 4)  # first Monday of the data (2016-2022 from incidents_archive)
# Training rows (y) start after a one-year burn-in so every lag, incl. same week last year, is real.
TRAIN_FROM = date(2017, 1, 2)
# Weeks kept as lag inputs but never as training targets (y = NaN): the pandemic shift (reports
# jumped ~50% in 2020 as restaurants closed). Backtest 2026-04-20..10-12, top-10% capture:
# 2023 start 0.643, 2017+ with pandemic 0.643, 2017+ without it 0.651 (MAE 0.0752 -> 0.0740).
SKIP_WEEKS: list[tuple[date, date]] = [(date(2020, 3, 9), date(2021, 6, 28))]
_to_m = Transformer.from_crs(SRID_LL, SRID_M, always_xy=True)

# 311 / code-enforcement categories used as leading signals (contracts/categories.json ids).
SIGNALS = {
    "dead_animal": "Dead animal reports",
    "pest": "Indoor pest reports",
    "trash_storage": "Improper trash storage reports",
    "ce_overfill": "Overflowing trash tickets",
    "trash_early": "Trash out early reports",
    "weeds": "Overgrown weeds reports",
    "litter": "Litter reports",
    "move_in_trash": "Move-in trash reports",
    "dumping": "Illegal dumping reports",
    "ce_trash_storage": "Trash storage code-enforcement tickets",
}
RING_SIGNALS = ["dead_animal", "pest", "trash_storage", "ce_trash_storage"]
RING_CANDIDATE = ["litter", "dumping", "ce_overfill"]
PLACE_KINDS = ["demolition", "excavation", "restaurant", "bigbelly", "vacant_parcel", "city_lot"]
# ACS 5-year tract values (tracts.attrs.acs) joined to the cell centroid; static.
ACS = {
    "acs_renters": ("pct_renters", "Share of households renting (census tract)"),
    "acs_pre1940": ("pct_housing_pre1940", "Share of housing built before 1940 (census tract)"),
    "acs_poverty": ("pct_poverty", "Share of residents in poverty (census tract)"),
    "acs_density": (None, "People per km² (census tract)"),
}

LABELS: dict[str, str] = {
    "rodent_l1": "Rodent reports last week",
    "rodent_m4": "Rodent reports, last 4 weeks (avg)",
    "rodent_m12": "Rodent reports, last 12 weeks (avg)",
    "rodent_ly": "Rodent reports same week last year",
    "ring_rodent_m4": "Rodent reports in neighbouring blocks, last 4 weeks (avg)",
    "ring_rodent_m12": "Rodent reports in neighbouring blocks, last 12 weeks (avg)",
    "vol_311_52": "All other 311 reports here, last year",
    "parcels": "Number of parcels",
    "yr_built_med": "Median year built",
    "units": "Housing units",
    "woy_sin": "Time of year",
    "woy_cos": "Time of year",
    "move_out": "Sept 1 move-out week",
    "tmax_m4": "Average high temperature, last 4 weeks",
    "precip_s4": "Rain, last 4 weeks (inches)",
    "snow_s4": "Snow, last 4 weeks (inches)",
    "events_s4": "Events nearby, last 4 weeks",
    "food_rodent_s12": "Failed food inspections for rodents/pests, last 12 weeks",
    "food_rodent_s52": "Failed food inspections for rodents/pests, last year",
    "permit_new_s4": "New demolition/construction permits, last 4 weeks",
    "permit_new_s12": "New demolition/construction permits, last 12 weeks",
    "permit_active_m4": "Active demolition/construction permits, last 4 weeks (avg)",
    "permit_active_m12": "Active demolition/construction permits, last 12 weeks (avg)",
    "inat_rat_s52": "iNaturalist rat sightings, last year",
    "missed_trash_s4": "Missed trash pickup reports, last 4 weeks",
    "missed_trash_s12": "Missed trash pickup reports, last 12 weeks",
    "sanitation_s4": "Sanitation reports, last 4 weeks",
    "sanitation_s12": "Sanitation reports, last 12 weeks",
    "dumpster_s4": "Dumpster reports, last 4 weeks",
    "dumpster_s12": "Dumpster reports, last 12 weeks",
    "construction_debris_s4": "Construction debris reports, last 4 weeks",
    "construction_debris_s12": "Construction debris reports, last 12 weeks",
    "abandoned_building_s4": "Abandoned building reports, last 4 weeks",
    "abandoned_building_s12": "Abandoned building reports, last 12 weeks",
    "vacant_lot_s4": "Vacant lot reports, last 4 weeks",
    "vacant_lot_s12": "Vacant lot reports, last 12 weeks",
    "precip_l1": "Rain last week (inches)",
    "precip_s12": "Rain, last 12 weeks (inches)",
    "heavy_rain_s4": "Heavy-rain days (≥ 0.5 in), last 4 weeks",
    "hot_days_s4": "Hot days (≥ 85 °F), last 4 weeks",
    "freeze_days_s12": "Hard-freeze nights (≤ 20 °F), last 12 weeks",
}
for _k, _v in SIGNALS.items():
    LABELS[f"{_k}_s4"] = f"{_v}, last 4 weeks"
    LABELS[f"{_k}_s12"] = f"{_v}, last 12 weeks"
for _k in RING_SIGNALS:
    LABELS[f"ring_{_k}_s4"] = f"{SIGNALS[_k]} in neighbouring blocks, last 4 weeks"
for _k in RING_CANDIDATE:
    LABELS[f"ring_{_k}_s4"] = f"{SIGNALS[_k]} in neighbouring blocks, last 4 weeks"
for _k, (_, _v) in ACS.items():
    LABELS[_k] = _v
for _k in PLACE_KINDS:
    LABELS[f"place_{_k}"] = f"{_k.replace('_', ' ').capitalize()} sites in this cell"

# Code-enforcement tickets are kept as rows for the last 6 months only (ingest/enforcement.py), so
# their features are 0 before 2026-04 and switch on inside the backtest window. Out of CORE:
# backtest 2017+ without pandemic, MAE 0.0740 -> 0.0734, capture 0.651 -> 0.650.
CE_FEATURES = [f"{k}_s{w}" for k in SIGNALS if k.startswith("ce_") for w in (4, 12)] + [
    f"ring_{k}_s4" for k in RING_SIGNALS + RING_CANDIDATE if k.startswith("ce_")]
CORE = [f for f in (
    ["rodent_l1", "rodent_m4", "rodent_m12", "rodent_ly", "ring_rodent_m4", "ring_rodent_m12"]
    + [f"{k}_s{w}" for k in SIGNALS for w in (4, 12)]
    + [f"ring_{k}_s4" for k in RING_SIGNALS]
    + ["vol_311_52", "parcels", "yr_built_med", "units", "woy_sin", "woy_cos", "move_out", "tmax_m4"]
) if f not in CE_FEATURES]
# New-data groups, tested one at a time against CORE (see backtest results in the commit log).
CANDIDATE_GROUPS = {
    "food": ["food_rodent_s12", "food_rodent_s52"],
    "permits": ["permit_new_s4", "permit_new_s12", "permit_active_m4", "permit_active_m12"],
    "acs": list(ACS),
    "city_lots": ["place_city_lot"],
    "inat": ["inat_rat_s52"],
    "ring_more": [f"ring_{k}_s4" for k in RING_CANDIDATE],
    "code_enforcement": CE_FEATURES,
    # 311 types loaded 2016+ (incidents + incidents_archive) but not in CORE.
    "more_311": [f"{k}_s{w}" for k in ("missed_trash", "sanitation", "dumpster", "construction_debris",
                                        "abandoned_building", "vacant_lot") for w in (4, 12)],
    "weather_more": ["precip_s4", "snow_s4", "precip_l1", "precip_s12", "heavy_rain_s4", "hot_days_s4",
                     "freeze_days_s12"],
}
CANDIDATE = list(dict.fromkeys(
    ["precip_s4", "snow_s4", "events_s4"] + [f"place_{k}" for k in PLACE_KINDS if k != "city_lot"]
    + [f for g in CANDIDATE_GROUPS.values() for f in g]
))


def label(feature: str) -> str:
    return LABELS.get(feature, feature.replace("_", " "))


def monday(d) -> date:
    d = pd.Timestamp(d).date()
    return d - timedelta(days=d.weekday())


def cell_ids_for(lon: np.ndarray, lat: np.ndarray) -> np.ndarray:
    """Map lon/lat points to `g250_<col>_<row>` ids on the EPSG:26986 lattice."""
    x, y = _to_m.transform(np.asarray(lon, float), np.asarray(lat, float))
    col = np.floor(np.asarray(x) / CELL_M).astype(int)
    row = np.floor(np.asarray(y) / CELL_M).astype(int)
    return np.char.add(np.char.add(np.char.add("g250_", col.astype(str)), "_"), row.astype(str))


def _window_sum(cum: np.ndarray, a: int, b: int) -> np.ndarray:
    """Sum over weeks [t-b, t-a] for every t, from a cumulative sum with a leading zero column.

    cum has shape (cells, weeks + 1), cum[:, t] = sum of weeks < t. Out-of-range weeks count 0.
    """
    n = cum.shape[1] - 1
    t = np.arange(n)
    hi = np.clip(t - a + 1, 0, n)
    lo = np.clip(t - b, 0, n)
    return cum[:, hi] - cum[:, lo]


def _cum(m: np.ndarray) -> np.ndarray:
    return np.concatenate([np.zeros((m.shape[0], 1)), np.cumsum(m, axis=1)], axis=1)


def _ring(m: np.ndarray, cols: np.ndarray, rows: np.ndarray) -> np.ndarray:
    """Sum of the 8 neighbouring cells' values (cells not in the grid count 0)."""
    index = {(c, r): i for i, (c, r) in enumerate(zip(cols, rows))}
    out = np.zeros_like(m)
    for dc in (-1, 0, 1):
        for dr in (-1, 0, 1):
            if dc == 0 and dr == 0:
                continue
            src = np.array([index.get((c + dc, r + dr), -1) for c, r in zip(cols, rows)])
            ok = src >= 0
            out[ok] += m[src[ok]]
    return out


def _counts(df: pd.DataFrame, cell_pos: dict, weeks: pd.DatetimeIndex) -> np.ndarray:
    """(cells × weeks) count matrix from rows with `cell_id` and `week`."""
    m = np.zeros((len(cell_pos), len(weeks)), dtype=np.float32)
    if df.empty:
        return m
    wpos = {w: i for i, w in enumerate(weeks)}
    ci = df["cell_id"].map(cell_pos)
    wi = df["week"].map(wpos)
    ok = ci.notna() & wi.notna()
    np.add.at(m, (ci[ok].astype(int).values, wi[ok].astype(int).values), 1)
    return m


def _load_incidents(conn: psycopg.Connection, start: date, end: date) -> pd.DataFrame:
    rows = conn.execute(
        """
        select category, opened_at, lon, lat
        from incidents
        where city = 'boston' and lon is not null and lat is not null
          and opened_at >= %s and opened_at < %s
        union all
        select category, opened_at, lon, lat
        from incidents_archive
        where city = 'boston' and lon is not null and lat is not null
          and opened_at >= %s and opened_at < %s
        """,
        (start, end, start, end),
    ).fetchall()
    df = pd.DataFrame(rows, columns=["category", "opened_at", "lon", "lat"])
    if df.empty:
        return df.assign(cell_id=[], week=[])
    df["opened_at"] = pd.to_datetime(df["opened_at"], utc=True).dt.tz_convert("America/New_York")
    df["week"] = (df["opened_at"].dt.tz_localize(None).dt.normalize()
                  - pd.to_timedelta(df["opened_at"].dt.weekday, unit="D"))
    df["cell_id"] = cell_ids_for(df["lon"].values, df["lat"].values)
    return df


def _static(conn: psycopg.Connection, cell_pos: dict) -> pd.DataFrame:
    rows = conn.execute(
        "select lon, lat, yr_built, units from parcels where city = 'boston' and lon is not null"
    ).fetchall()
    p = pd.DataFrame(rows, columns=["lon", "lat", "yr_built", "units"])
    p["cell_id"] = cell_ids_for(p["lon"].values, p["lat"].values) if len(p) else []
    p["yr_built"] = pd.to_numeric(p["yr_built"], errors="coerce").where(lambda s: s.between(1700, 2030))
    p["units"] = pd.to_numeric(p["units"], errors="coerce")
    g = p.groupby("cell_id").agg(parcels=("lon", "size"), yr_built_med=("yr_built", "median"), units=("units", "sum"))

    rows = conn.execute(
        "select kind, lon, lat from places where city = 'boston' and lon is not null and kind = any(%s)",
        (PLACE_KINDS,),
    ).fetchall()
    pl = pd.DataFrame(rows, columns=["kind", "lon", "lat"])
    if len(pl):
        pl["cell_id"] = cell_ids_for(pl["lon"].values, pl["lat"].values)
        g = g.join(pd.crosstab(pl["cell_id"], pl["kind"]).add_prefix("place_"), how="outer")
    out = pd.DataFrame(index=pd.Index(list(cell_pos), name="cell_id")).join(g)
    for k in PLACE_KINDS:
        if f"place_{k}" not in out:
            out[f"place_{k}"] = 0.0
    out[["parcels", "units"] + [f"place_{k}" for k in PLACE_KINDS]] = (
        out[["parcels", "units"] + [f"place_{k}" for k in PLACE_KINDS]].fillna(0)
    )
    out["yr_built_med"] = out["yr_built_med"].fillna(out["yr_built_med"].median())
    return out


def _weather(conn: psycopg.Connection, weeks: pd.DatetimeIndex) -> pd.DataFrame:
    rows = conn.execute("select day, precip_in, snow_in, tmax_f, tmin_f from weather_daily").fetchall()
    w = pd.DataFrame(rows, columns=["day", "precip_in", "snow_in", "tmax_f", "tmin_f"])
    w["day"] = pd.to_datetime(w["day"])
    w["week"] = w["day"] - pd.to_timedelta(w["day"].dt.weekday, unit="D")
    w["heavy"] = (w["precip_in"] >= 0.5).astype(float)
    w["hot"] = (w["tmax_f"] >= 85).astype(float)
    w["freeze"] = (w["tmin_f"] <= 20).astype(float)
    wk = w.groupby("week").agg(precip=("precip_in", "sum"), snow=("snow_in", "sum"), tmax=("tmax_f", "mean"),
                               heavy=("heavy", "sum"), hot=("hot", "sum"), freeze=("freeze", "sum"))
    wk = wk.reindex(weeks)
    wk["tmax"] = wk["tmax"].interpolate(limit_direction="both")
    return wk.fillna({"precip": 0.0, "snow": 0.0, "heavy": 0.0, "hot": 0.0, "freeze": 0.0})


def _future_tmax_m4(tmax: pd.Series, last_obs: pd.Timestamp, week: pd.Timestamp) -> float:
    """tmax_m4 for a forecast week: observed weekly highs up to `last_obs`, and for weeks not yet
    observed the same-ISO-week average over earlier years (climatology), never later data.

    Backtest over 2025-26 origins, horizons 2-5: mean error 2.2 °F vs 4.9 °F for copying the
    last observed 4 weeks.
    """
    obs = tmax[tmax.index <= last_obs].dropna()
    woy = obs.index.isocalendar().week
    vals = []
    for k in range(4, 0, -1):
        w = week - pd.Timedelta(weeks=k)
        if w <= last_obs and w in obs.index:
            vals.append(obs[w])
        else:
            same = obs[woy.values == w.isocalendar().week]
            vals.append(same.mean() if len(same) else obs.tail(4).mean())
    return float(np.mean(vals))


def _events(conn: psycopg.Connection, cell_pos: dict, weeks: pd.DatetimeIndex) -> np.ndarray:
    rows = conn.execute(
        "select starts_at, lon, lat from events where city = 'boston' and lon is not null and starts_at is not null"
    ).fetchall()
    e = pd.DataFrame(rows, columns=["starts_at", "lon", "lat"])
    if e.empty:
        return np.zeros((len(cell_pos), len(weeks)), dtype=np.float32)
    t = pd.to_datetime(e["starts_at"], utc=True).dt.tz_convert("America/New_York").dt.tz_localize(None).dt.normalize()
    e["week"] = t - pd.to_timedelta(t.dt.weekday, unit="D")
    e["cell_id"] = cell_ids_for(e["lon"].values, e["lat"].values)
    return _counts(e, cell_pos, weeks)


def _week_of(ts: pd.Series) -> pd.Series:
    t = pd.to_datetime(ts, utc=True).dt.tz_convert("America/New_York").dt.tz_localize(None).dt.normalize()
    return t - pd.to_timedelta(t.dt.weekday, unit="D")


def _food(conn: psycopg.Connection, cell_pos: dict, weeks: pd.DatetimeIndex) -> np.ndarray:
    """Failed food inspections citing rodent/pest violations: one count per (license, inspection date)."""
    rows = conn.execute(
        """
        select distinct p.id, v->>'date', p.lon, p.lat
        from places p, jsonb_array_elements(coalesce(p.attrs->'rodent_violations', '[]'::jsonb)) v
        where p.city = 'boston' and p.kind = 'restaurant' and p.lon is not null and v->>'status' = 'Fail'
        """
    ).fetchall()
    f = pd.DataFrame(rows, columns=["id", "day", "lon", "lat"])
    if f.empty:
        return np.zeros((len(cell_pos), len(weeks)), dtype=np.float32)
    d = pd.to_datetime(f["day"], errors="coerce")
    f["week"] = d - pd.to_timedelta(d.dt.weekday, unit="D")
    f["cell_id"] = cell_ids_for(f["lon"].values, f["lat"].values)
    return _counts(f, cell_pos, weeks)


def _permits(conn: psycopg.Connection, cell_pos: dict, weeks: pd.DatetimeIndex) -> tuple[np.ndarray, np.ndarray]:
    """(new, active) demolition/excavation permit counts per cell-week. Active = issued ≤ week ≤ expiry."""
    rows = conn.execute(
        """
        select starts_at, ends_at, lon, lat from places
        where city = 'boston' and kind in ('demolition', 'excavation') and lon is not null and starts_at is not null
        """
    ).fetchall()
    p = pd.DataFrame(rows, columns=["starts_at", "ends_at", "lon", "lat"])
    shape = (len(cell_pos), len(weeks))
    if p.empty:
        return np.zeros(shape, np.float32), np.zeros(shape, np.float32)
    p["week"] = _week_of(p["starts_at"])
    p["cell_id"] = cell_ids_for(p["lon"].values, p["lat"].values)
    new = _counts(p, cell_pos, weeks)
    end = _week_of(p["ends_at"]).fillna(p["week"] + pd.Timedelta(weeks=26))  # no expiry: assume 6 months
    first = weeks[0]
    s = ((p["week"] - first).dt.days // 7).clip(0, len(weeks)).astype(int).values
    e = ((end - first).dt.days // 7 + 1).clip(0, len(weeks)).astype(int).values
    ci = p["cell_id"].map(cell_pos)
    ok = ci.notna().values & (e > s)
    diff = np.zeros((shape[0], shape[1] + 1), np.float32)
    np.add.at(diff, (ci[ok].astype(int).values, s[ok]), 1)
    np.add.at(diff, (ci[ok].astype(int).values, e[ok]), -1)
    return new, np.cumsum(diff, axis=1)[:, :-1]


def _acs(conn: psycopg.Connection, cells: list[dict]) -> pd.DataFrame:
    """ACS tract values at each cell centroid (ST_Contains); cells outside any tract get the median."""
    rows = conn.execute(
        """
        select u.i, t.attrs->'acs', st_area(t.geom::geography) / 1e6
        from unnest(%s::float8[], %s::float8[]) with ordinality u(lon, lat, i)
        left join tracts t on st_contains(t.geom::geometry, st_setsrid(st_point(u.lon, u.lat), 4326))
        """,
        ([c["lon"] for c in cells], [c["lat"] for c in cells]),
    ).fetchall()
    out = pd.DataFrame(index=pd.Index([c["id"] for c in cells], name="cell_id"), columns=list(ACS), dtype=float)
    for i, acs, km2 in rows:
        if not acs:
            continue
        cid = cells[i - 1]["id"]
        for k, (src, _) in ACS.items():
            v = (acs.get("pop") / km2 if km2 and acs.get("pop") is not None else None) if src is None else acs.get(src)
            out.loc[cid, k] = v
    return out.astype(float).fillna(out.astype(float).median())


def build_panel(
    conn: psycopg.Connection,
    *,
    through: date | None = None,
    future_start: date | None = None,
    future_weeks: int = 4,
) -> pd.DataFrame:
    """Return the long panel: one row per (cell_id, week_start).

    Training rows: weeks START..`through` (default: last complete week), with `y`.
    Future rows: `future_weeks` weeks from `future_start` (default: the Monday after
    `through` + 1 week), `y` = NaN; their features are the ones known right after
    `through` (lags look back from the first unobserved week), so they never peek ahead.
    Columns: cell_id, week_start, y, is_future, lon, lat, + CORE + CANDIDATE.
    """
    cells = load_or_build_cells(conn)
    cell_ids = [c["id"] for c in cells]
    cell_pos = {cid: i for i, cid in enumerate(cell_ids)}
    cols = np.array([int(cid.split("_")[1]) if c["col"] is None else c["col"] for cid, c in zip(cell_ids, cells)])
    rows = np.array([int(cid.split("_")[2]) if c["row"] is None else c["row"] for cid, c in zip(cell_ids, cells)])

    if through is None:
        last = conn.execute(
            "select max(opened_at) from incidents where city = 'boston' and category = 'rodent'"
        ).fetchone()[0]
        through = monday(last) - timedelta(days=7)  # the last complete week
    through = monday(through)
    weeks = pd.date_range(pd.Timestamp(START), pd.Timestamp(through), freq="7D")
    n_w = len(weeks)
    # One extra column = the first unobserved week; future rows reuse its features.
    all_weeks = weeks.append(pd.DatetimeIndex([weeks[-1] + pd.Timedelta(days=7)]))

    inc = _load_incidents(conn, START, through + timedelta(days=7))
    by_cat = {cat: g for cat, g in inc.groupby("category")}
    empty = inc.iloc[0:0]

    def mat(cat):
        m = _counts(by_cat.get(cat, empty), cell_pos, weeks)
        return np.concatenate([m, np.zeros((m.shape[0], 1), np.float32)], axis=1)  # pad the extra week

    feats: dict[str, np.ndarray] = {}
    rod = mat("rodent")
    c = _cum(rod)
    feats["rodent_l1"] = _window_sum(c, 1, 1)
    feats["rodent_m4"] = _window_sum(c, 1, 4) / 4
    feats["rodent_m12"] = _window_sum(c, 1, 12) / 12
    feats["rodent_ly"] = _window_sum(c, 52, 52)
    ring_rod = _cum(_ring(rod, cols, rows))
    feats["ring_rodent_m4"] = _window_sum(ring_rod, 1, 4) / 4
    feats["ring_rodent_m12"] = _window_sum(ring_rod, 1, 12) / 12
    for k in SIGNALS:
        m = mat(k)
        cm = _cum(m)
        feats[f"{k}_s4"] = np.log1p(_window_sum(cm, 1, 4))
        feats[f"{k}_s12"] = np.log1p(_window_sum(cm, 1, 12))
        if k in RING_SIGNALS:
            feats[f"ring_{k}_s4"] = np.log1p(_window_sum(_cum(_ring(m, cols, rows)), 1, 4))
    other = _counts(inc[inc["category"] != "rodent"], cell_pos, weeks)
    other = np.concatenate([other, np.zeros((other.shape[0], 1), np.float32)], axis=1)
    feats["vol_311_52"] = np.log1p(_window_sum(_cum(other), 1, 52))
    ev = _events(conn, cell_pos, weeks)
    ev = np.concatenate([ev, np.zeros((ev.shape[0], 1), np.float32)], axis=1)
    feats["events_s4"] = _window_sum(_cum(ev), 1, 4)

    def pad(m):
        return np.concatenate([m, np.zeros((m.shape[0], 1), np.float32)], axis=1)

    for k in RING_CANDIDATE:
        feats[f"ring_{k}_s4"] = np.log1p(_window_sum(_cum(_ring(mat(k), cols, rows)), 1, 4))
    food = _cum(pad(_food(conn, cell_pos, weeks)))
    feats["food_rodent_s12"] = np.log1p(_window_sum(food, 1, 12))
    feats["food_rodent_s52"] = np.log1p(_window_sum(food, 1, 52))
    new, active = _permits(conn, cell_pos, weeks)
    new, active = _cum(pad(new)), _cum(pad(active))
    feats["permit_new_s4"] = np.log1p(_window_sum(new, 1, 4))
    feats["permit_new_s12"] = np.log1p(_window_sum(new, 1, 12))
    feats["permit_active_m4"] = np.log1p(_window_sum(active, 1, 4) / 4)
    feats["permit_active_m12"] = np.log1p(_window_sum(active, 1, 12) / 12)
    feats["inat_rat_s52"] = np.log1p(_window_sum(_cum(mat("inat_rat")), 1, 52))
    for k in ("missed_trash", "sanitation", "dumpster", "construction_debris", "abandoned_building", "vacant_lot"):
        cm = _cum(mat(k))
        feats[f"{k}_s4"], feats[f"{k}_s12"] = np.log1p(_window_sum(cm, 1, 4)), np.log1p(_window_sum(cm, 1, 12))

    # Week-level (same for every cell) features.
    wx = _weather(conn, all_weeks)
    pre = np.concatenate([[0.0], np.cumsum(wx["precip"].values)])
    sno = np.concatenate([[0.0], np.cumsum(wx["snow"].values)])
    tmx = np.concatenate([[0.0], np.cumsum(wx["tmax"].values)])
    n_all = len(all_weeks)
    t = np.arange(n_all)
    hi, lo = np.clip(t, 0, n_all), np.clip(t - 4, 0, n_all)

    def wsum(col, b):  # sum of weekly `col` over weeks t-b..t-1
        cum = np.concatenate([[0.0], np.cumsum(wx[col].values)])
        return cum[t] - cum[np.clip(t - b, 0, n_all)]

    week_feats = pd.DataFrame(
        {
            "week_start": all_weeks,
            "precip_s4": pre[hi] - pre[lo],
            "snow_s4": sno[hi] - sno[lo],
            "tmax_m4": (tmx[hi] - tmx[lo]) / np.maximum(hi - lo, 1),
            "precip_l1": wsum("precip", 1),
            "precip_s12": wsum("precip", 12),
            "heavy_rain_s4": wsum("heavy", 4),
            "hot_days_s4": wsum("hot", 4),
            "freeze_days_s12": wsum("freeze", 12),
        }
    )

    n_c = len(cell_ids)
    panel = pd.DataFrame(
        {
            "cell_id": np.repeat(cell_ids, n_all),
            "week_start": np.tile(all_weeks.values, n_c),
            "y": np.concatenate([rod[:, :n_w], np.full((n_c, 1), np.nan)], axis=1).ravel(),
        }
    )
    for k, v in feats.items():
        panel[k] = v.ravel().astype(np.float32)
    panel = panel.merge(week_feats, on="week_start", how="left")
    st = _static(conn, cell_pos).join(_acs(conn, cells))
    panel = panel.merge(st, left_on="cell_id", right_index=True, how="left")
    lonlat = pd.DataFrame({"cell_id": cell_ids, "lon": [c["lon"] for c in cells], "lat": [c["lat"] for c in cells]})
    panel = panel.merge(lonlat, on="cell_id", how="left")

    woy = panel["week_start"].dt.isocalendar().week.astype(float)
    panel["woy_sin"] = np.sin(2 * np.pi * woy / 52.18)
    panel["woy_cos"] = np.cos(2 * np.pi * woy / 52.18)
    ws = panel["week_start"]
    panel["move_out"] = ((ws.dt.month == 8) & (ws.dt.day >= 26) | (ws.dt.month == 9) & (ws.dt.day <= 7)).astype(float)
    panel["is_future"] = False
    drop = ws < pd.Timestamp(TRAIN_FROM)
    for a, b in SKIP_WEEKS:
        drop |= (ws >= pd.Timestamp(a)) & (ws < pd.Timestamp(b))
    panel.loc[drop, "y"] = np.nan

    # Future rows: copy the first-unobserved-week features to each forecast week.
    nxt = panel[panel["week_start"] == all_weeks[-1]]
    panel = panel[panel["week_start"] <= weeks[-1]]
    if future_start is None:
        future_start = (all_weeks[-1] + pd.Timedelta(days=7)).date()
    fut = []
    for h in range(future_weeks):
        ws_h = pd.Timestamp(monday(future_start)) + pd.Timedelta(weeks=h)
        f = nxt.copy()
        f["week_start"] = ws_h
        woy_h = float(ws_h.isocalendar().week)
        f["woy_sin"], f["woy_cos"] = np.sin(2 * np.pi * woy_h / 52.18), np.cos(2 * np.pi * woy_h / 52.18)
        f["move_out"] = float((ws_h.month == 8 and ws_h.day >= 26) or (ws_h.month == 9 and ws_h.day <= 7))
        f["tmax_m4"] = _future_tmax_m4(wx["tmax"].iloc[:-1], weeks[-1], ws_h)
        f["is_future"] = True
        fut.append(f)
    panel = pd.concat([panel, *fut], ignore_index=True)
    panel["week_start"] = pd.to_datetime(panel["week_start"]).dt.date
    return panel[["cell_id", "week_start", "y", "is_future", "lon", "lat"] + CORE + CANDIDATE]


__all__ = ["CORE", "CANDIDATE", "CANDIDATE_GROUPS", "LABELS", "SIGNALS", "label", "monday", "cell_ids_for", "build_panel"]
