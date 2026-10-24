"""site_recurrence_logit — P(a rodent report returns to the same address within 60 days of a closure).

Design §5 / R6: one row per closed Boston rodent case; y = another rodent report at
the same `address_key` opened ≥ 1 day after the closure and ≤ 60 days after it
(the same rule as `sites.recurrence_count`). Logistic regression, judged by AUC on a
time split against the base-rate baseline (AUC 0.5). Features use only information
known at closure time (no leakage): action tag, prior-returns bucket, how fast the
case was closed, closure month, and co-signal 311 reports on the same block in the
90 days before closure.

Writes one `model_runs` row and sets only `sites.summary -> recur_p` via `jsonb_set`
(Carol owns the rest of `sites`). Never commits — the caller owns the transaction.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone

import numpy as np
import pandas as pd
import psycopg
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score

MODEL = "site_recurrence_logit"
WINDOW_DAYS = 60
COSIGNAL_DAYS = 90
TEST_WEEKS = 26
COSIGNALS = ["trash_storage", "dead_animal", "pest", "missed_trash", "dumping", "trash_early"]
PRIOR_BUCKETS = [(0, 0, "0"), (1, 1, "1"), (2, 4, "2-4"), (5, 10**9, "5+")]

LABELS = {
    "same_day_close": "Case closed the same day it was opened",
    "log_close_days": "Days taken to close the case",
    "month_sin": "Time of year",
    "month_cos": "Time of year",
}


def _label(feature: str) -> str:
    if feature in LABELS:
        return LABELS[feature]
    if feature.startswith("prior_"):
        return f"Earlier rodent reports at this address: {feature.removeprefix('prior_')}"
    if feature.startswith("cosig_"):
        return f"Nearby {feature.removeprefix('cosig_').replace('_', ' ')} reports, 90 days before closure"
    if feature.startswith("tag_"):
        return f"Closure action: {feature.removeprefix('tag_').replace('_', ' ')}"
    return feature


def _load(conn: psycopg.Connection) -> tuple[pd.DataFrame, pd.DataFrame]:
    rodent = pd.DataFrame(
        conn.execute(
            """
            select id, address_key, address_block, opened_at, closed_at,
                   coalesce(action_tag, 'unknown') as action_tag
            from incidents
            where city = 'boston' and category = 'rodent' and address_key is not null
            """
        ).fetchall(),
        columns=["id", "address_key", "address_block", "opened_at", "closed_at", "action_tag"],
    )
    cosig = pd.DataFrame(
        conn.execute(
            """
            select address_block, category, opened_at
            from incidents
            where city = 'boston' and address_block is not null and category = any(%s)
            """,
            (COSIGNALS,),
        ).fetchall(),
        columns=["address_block", "category", "opened_at"],
    )
    for df in (rodent, cosig):
        for col in ("opened_at", "closed_at"):
            if col in df:
                df[col] = pd.to_datetime(df[col], utc=True)
    return rodent, cosig


def _count_before(events: pd.DataFrame, keys: pd.Series, t: pd.Series, days: int) -> np.ndarray:
    """For each (key, t): number of events with the same key in [t - days, t)."""
    out = np.zeros(len(keys), dtype=float)
    if events.empty:
        return out
    by_key = {k: np.sort(g["opened_at"].values) for k, g in events.groupby(events.columns[0])}
    lo_t = (t - pd.Timedelta(days=days)).values
    hi_t = t.values
    for i, (k, lo, hi) in enumerate(zip(keys.values, lo_t, hi_t)):
        arr = by_key.get(k)
        if arr is not None:
            out[i] = np.searchsorted(arr, hi, "left") - np.searchsorted(arr, lo, "left")
    return out


def build_cases(rodent: pd.DataFrame, cosig: pd.DataFrame) -> pd.DataFrame:
    """One row per closed rodent case with features, `y`, and `observed` (full 60-day window seen)."""
    rodent = rodent.sort_values("opened_at").reset_index(drop=True)
    data_end = rodent["opened_at"].max()
    cases = rodent[rodent["closed_at"].notna()].copy()

    # y: next report at the same address opened in [closed + 1 day, closed + 60 days].
    opened_by_addr = {k: np.sort(g["opened_at"].values) for k, g in rodent.groupby("address_key")}
    lo = (cases["closed_at"] + pd.Timedelta(days=1)).values
    hi = (cases["closed_at"] + pd.Timedelta(days=WINDOW_DAYS)).values
    y = np.zeros(len(cases), dtype=int)
    prior = np.zeros(len(cases), dtype=int)
    for i, (k, a, b, op) in enumerate(zip(cases["address_key"].values, lo, hi, cases["opened_at"].values)):
        arr = opened_by_addr[k]
        y[i] = int(np.searchsorted(arr, b, "right") > np.searchsorted(arr, a, "left"))
        prior[i] = int(np.searchsorted(arr, op, "left"))
    cases["y"] = y
    cases["observed"] = cases["closed_at"] + pd.Timedelta(days=WINDOW_DAYS) <= data_end

    for lo_b, hi_b, name in PRIOR_BUCKETS:
        cases[f"prior_{name}"] = ((prior >= lo_b) & (prior <= hi_b)).astype(float)
    close_days = (cases["closed_at"] - cases["opened_at"]).dt.total_seconds().clip(lower=0) / 86400
    cases["same_day_close"] = (close_days < 1).astype(float)
    cases["log_close_days"] = np.log1p(close_days)
    month = cases["closed_at"].dt.month
    cases["month_sin"] = np.sin(2 * np.pi * month / 12)
    cases["month_cos"] = np.cos(2 * np.pi * month / 12)
    for cat in COSIGNALS:
        ev = cosig.loc[cosig["category"] == cat, ["address_block", "opened_at"]]
        cases[f"cosig_{cat}"] = np.log1p(
            _count_before(ev, cases["address_block"], cases["closed_at"], COSIGNAL_DAYS)
        )
    for tag in sorted(cases["action_tag"].unique()):
        cases[f"tag_{tag}"] = (cases["action_tag"] == tag).astype(float)
    return cases


def feature_columns(cases: pd.DataFrame) -> list[str]:
    prefixes = ("prior_", "cosig_", "tag_")
    return [c for c in cases.columns if c.startswith(prefixes)] + list(LABELS)


def fit(cases: pd.DataFrame) -> dict:
    """Time-split AUC vs base rate, then refit on all observed cases. Pure."""
    obs = cases[cases["observed"]].sort_values("closed_at")
    # Drop constant columns (e.g. tag_unknown while action tags are not yet classified).
    feats = [f for f in feature_columns(cases) if obs[f].nunique() > 1]
    cutoff = obs["closed_at"].max() - pd.Timedelta(weeks=TEST_WEEKS)
    train, test = obs[obs["closed_at"] <= cutoff], obs[obs["closed_at"] > cutoff]

    def _model():
        return LogisticRegression(max_iter=2000, C=1.0)

    m = _model().fit(train[feats], train["y"])
    p_test = m.predict_proba(test[feats])[:, 1]
    auc = float(roc_auc_score(test["y"], p_test)) if test["y"].nunique() == 2 else None
    final = _model().fit(obs[feats], obs["y"])
    coefs = sorted(zip(feats, final.coef_[0]), key=lambda kv: -abs(kv[1]))
    return {
        "model": final,
        "features": feats,
        "trained_through": obs["closed_at"].max().date(),
        "metrics": {
            "auc": auc,
            "baseline_auc": 0.5,
            "base_rate": float(obs["y"].mean()),
            "test_base_rate": float(test["y"].mean()) if len(test) else None,
            "n_train": int(len(train)),
            "n_test": int(len(test)),
            "test_from": cutoff.date().isoformat(),
            "beats_baseline": bool(auc is not None and auc > 0.5),
        },
        "feature_importance": [
            {"feature": f, "label": _label(f), "importance": round(float(abs(c)), 4), "direction": "up" if c > 0 else "down"}
            for f, c in coefs
        ],
    }


def site_recurrence_logit(conn: psycopg.Connection) -> dict:
    """Fit, write a `model_runs` row, set `sites.summary.recur_p`. Caller commits."""
    rodent, cosig = _load(conn)
    cases = build_cases(rodent, cosig)
    res = fit(cases)

    run_id = f"recur-v1-{datetime.now(timezone.utc):%Y%m%dT%H%M%S}"
    conn.execute(
        """
        insert into model_runs (id, model, trained_through, params, metrics, feature_importance)
        values (%s, %s, %s, %s::jsonb, %s::jsonb, %s::jsonb)
        """,
        (
            run_id,
            MODEL,
            res["trained_through"],
            json.dumps({"window_days": WINDOW_DAYS, "cosignal_days": COSIGNAL_DAYS,
                        "test_weeks": TEST_WEEKS, "C": 1.0, "features": res["features"]}),
            json.dumps(res["metrics"]),
            json.dumps(res["feature_importance"]),
        ),
    )

    # Score each block's most recent closed case; a site takes its block's probability.
    latest = cases.sort_values("closed_at").groupby("address_block").tail(1)
    latest = latest.assign(p=res["model"].predict_proba(latest[res["features"]])[:, 1])
    rows = [(round(float(p), 4), blk) for blk, p in zip(latest["address_block"], latest["p"])]
    updated = 0
    if rows and res["metrics"]["beats_baseline"]:
        with conn.cursor() as cur:
            cur.executemany(
                """
                update sites
                set summary = jsonb_set(coalesce(summary, '{}'::jsonb), '{recur_p}', to_jsonb(%s::real))
                where city = 'boston' and address_block = %s
                """,
                rows,
            )
            updated = cur.rowcount if cur.rowcount and cur.rowcount > 0 else 0
    return {
        "model_run_id": run_id,
        "model": MODEL,
        "metrics": res["metrics"],
        "top_features": res["feature_importance"][:5],
        "blocks_scored": len(rows),
        "sites_updated": updated,
        "_fitted": res,
    }


__all__ = ["MODEL", "build_cases", "fit", "feature_columns", "site_recurrence_logit"]
