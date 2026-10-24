"""Explanations for the cell-week forecast (design §5, R6.7).

* `p_any = 1 - exp(-expected)` — chance of at least one report (Poisson).
* `risk_band` by quantile of `expected` within each week: ≤60% low, ≤85% elevated,
  ≤95% high, else very_high (monotonic in expected).
* per-row `drivers` — how much the forecast drops when one feature group is set to the
  city median; top 5 groups that push it up, as `{feature, label, contribution, value}`.
* emerging hotspots — high/very_high cells with ≤ 1 rodent report in the previous 12
  weeks, plus early-warning cells where dead-animal + indoor-pest reports are rising
  while rodent reports stay ≤ 1.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from .features import RING_SIGNALS, SIGNALS

BANDS = [(0.60, "low"), (0.85, "elevated"), (0.95, "high"), (1.01, "very_high")]

# Feature groups explained together, with the plain-language label and the raw value shown.
GROUPS: dict[str, dict] = {
    "rodent_history": {"label": "Recent rodent reports here", "features": ["rodent_l1", "rodent_m4", "rodent_m12"],
                       "value": "rodent_m12", "value_fmt": lambda v: round(float(v) * 12, 1)},
    "rodent_last_year": {"label": "Rodent reports this week last year", "features": ["rodent_ly"], "value": "rodent_ly"},
    "neighbours": {"label": "Rodent reports in neighbouring blocks", "features": ["ring_rodent_m4", "ring_rodent_m12"],
                   "value": "ring_rodent_m12", "value_fmt": lambda v: round(float(v) * 12, 1)},
    "reporting_volume": {"label": "Overall 311 reporting here", "features": ["vol_311_52"], "value": "vol_311_52",
                         "value_fmt": lambda v: int(round(np.expm1(float(v))))},
    "buildings": {"label": "Buildings (count, age, units)", "features": ["parcels", "yr_built_med", "units"],
                  "value": "parcels"},
    "season": {"label": "Time of year", "features": ["woy_sin", "woy_cos", "move_out"], "value": None},
    "temperature": {"label": "Recent temperatures", "features": ["tmax_m4"], "value": "tmax_m4",
                    "value_fmt": lambda v: round(float(v), 1)},
}
for _k, _lab in SIGNALS.items():
    feats = [f"{_k}_s4", f"{_k}_s12"] + ([f"ring_{_k}_s4"] if _k in RING_SIGNALS else [])
    GROUPS[_k] = {"label": _lab + " (here and nearby)", "features": feats, "value": f"{_k}_s12",
                  "value_fmt": lambda v: int(round(np.expm1(float(v))))}


def p_any(expected) -> np.ndarray:
    return 1.0 - np.exp(-np.clip(np.asarray(expected, float), 0.0, None))


def risk_bands(expected: pd.Series, week: pd.Series) -> pd.Series:
    """Quantile bands of `expected` within each week (ties share the lower band)."""
    pct = expected.groupby(week).rank(method="max", pct=True)
    out = pd.Series("very_high", index=expected.index)
    for hi, name in reversed(BANDS[:-1]):
        out[pct <= hi] = name
    return out


def drivers(model, rows: pd.DataFrame, reference: pd.DataFrame, top: int = 5) -> list[list[dict]]:
    """Per-row top drivers: forecast minus forecast with the group set to the reference median."""
    feats = model.features
    med = reference[feats].median()
    base = model.predict(rows)
    contrib = {}
    for g, spec in GROUPS.items():
        cols = [f for f in spec["features"] if f in feats]
        if not cols:
            continue
        alt = rows.copy()
        alt[cols] = med[cols].to_numpy()
        contrib[g] = base - model.predict(alt)
    names = list(contrib)
    mat = np.vstack([contrib[g] for g in names]).T if names else np.zeros((len(rows), 0))
    out = []
    for i in range(len(rows)):
        order = np.argsort(-mat[i])
        row = rows.iloc[i]
        items = []
        for j in order[:top]:
            if mat[i, j] <= 0:
                break
            spec = GROUPS[names[j]]
            v = None
            if spec.get("value"):
                raw = row[spec["value"]]
                v = spec.get("value_fmt", lambda x: round(float(x), 2))(raw)
            items.append({"feature": names[j], "label": spec["label"],
                          "contribution": round(float(mat[i, j]), 4), "value": v})
        out.append(items)
    return out


def emerging(rows: pd.DataFrame, bands: pd.Series) -> pd.DataFrame:
    """Flag emerging hotspots and early-warning cells. Returns rows with `kind` and `signals`."""
    quiet = rows["rodent_m12"] * 12 <= 1
    hot = bands.isin(["high", "very_high"]) & quiet
    rising = (
        (np.expm1(rows["dead_animal_s4"]) + np.expm1(rows["pest_s4"]))
        > (np.expm1(rows["dead_animal_s12"]) + np.expm1(rows["pest_s12"])) / 3 + 0.5
    ) & quiet
    flag = hot | rising
    sig_cols = ["trash_storage_s12", "dead_animal_s12", "pest_s12", "move_in_trash_s12", "ce_trash_storage_s12"]
    sub = rows.loc[flag, ["cell_id", "week_start"] + sig_cols].copy()
    sub["kind"] = np.where(hot[flag], "emerging_hotspot", "early_warning")
    sub["signals"] = [
        [{"feature": c.removesuffix("_s12"), "label": SIGNALS[c.removesuffix("_s12")], "last_12_weeks": int(round(np.expm1(r[c])))}
         for c in sig_cols if r[c] > 0]
        for _, r in sub.iterrows()
    ]
    return sub[["cell_id", "week_start", "kind", "signals"]]


__all__ = ["BANDS", "GROUPS", "p_any", "risk_bands", "drivers", "emerging"]
