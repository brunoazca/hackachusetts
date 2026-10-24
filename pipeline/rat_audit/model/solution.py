"""record_solution — the proposed solution for each rodent report (Insights card, "Solution").

One row per rodent record. For every closed case we know (a) what the city did, read
from the closure note, and (b) whether a rodent report came back to the same address
within 60 days. A gradient-boosted classifier learns P(return | action, context), where
context is only what is known at closure time: earlier reports at the address, 311
co-signals on the block, nearby places (vacant parcels, restaurants, dumpsters…) and
season. For each record we then score every allowed action and propose the one with the
lowest predicted return, next to "monitoring" (the most common closure) as reference.

Honesty rules (requirements R3.9 / R3.10):
* observational, not causal — actions are not randomly assigned; every row carries the
  caveat and the number of training cases with that action;
* legal lane only: sanitation, exclusion, enforcement, referral — never baiting/poison;
* if no action beats monitoring by at least MIN_GAIN, the proposal is "inspect and record
  the cause" (rule 5), not a guess.

The closure-note classifier here is a local rules pass so the model does not depend on
`incidents.action_tag` being filled (analytics owns that column; we never write it).
Writes `record_solutions` and one `model_runs` row. Never commits.
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone

import numpy as np
import pandas as pd
import psycopg
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import roc_auc_score
from sklearn.neighbors import BallTree

MODEL = "record_solution_gbm"
WINDOW_DAYS = 60
COSIGNAL_DAYS = 90
TEST_WEEKS = 26
MIN_GAIN = 0.02  # an action must beat monitoring by 2 points to be proposed
MIN_SUPPORT = 100  # training cases with that action, else it is not proposed
EARTH_M = 6_371_000.0
COSIGNALS = ["trash_storage", "dead_animal", "pest", "missed_trash", "dumping", "trash_early", "dumpster"]
PLACE_RINGS = {  # kind -> radius in meters
    "vacant_parcel": 40, "restaurant": 100, "excavation": 100, "demolition": 100,
    "city_lot": 100, "bigbelly": 100, "smart_box": 100, "school": 100,
}
CAVEAT = ("Model estimate from past cases, not a measured effect: the city's actions were not "
          "randomly assigned. Expected rodent reports, not rats.")

# Closure-note rules, first match wins. Negations ("no violation", "city doesn't bait") come first.
RULES: list[tuple[str, str]] = [
    ("duplicate", r"duplicate|already (?:open|exists)|existing case"),
    ("collections", r"collections?\b"),
    ("abatement_order", r"abatement"),
    ("no_violation", r"no (?:violations?|activity|evidence|signs?|burrows?|rodents?|rats?)\b|not a burrow|"
                     r"nothing (?:was )?found|unable to (?:locate|find)|could not (?:locate|find)"),
    ("citation", r"citation|ticket|fine[sd]?\b|violation (?:was |has been )?(?:issued|written)"),
    ("barrels", r"barrels?|rat[- ]?(?:proof|resistant)|containers? with(?:out)? (?:no )?(?:lids?|covers?)"),
    ("referral", r"referr|bwsc|water and sewer|public works|forwarded|code enforcement|isd will|"
                 r"parks? department|mass ?dot|mbta"),
    ("carcass", r"dead (?:rat|rodent|animal|mouse|mice)|carcass|picked up (?:the )?(?:rat|rodent|animal)"),
    ("monitoring", r"monitor"),
    ("baiting", r"(?<!not )(?<!n't )\bbait|burrows? (?:were |was )?treated|exterminat|traps? (?:set|placed)"),
    ("warning", r"warning|notice|notif|letter|contact(?:ed)? (?:the )?(?:property )?owner|owner (?:was )?(?:told|advised)"),
    ("cleanup", r"clean|removed|picked up|disposed"),
    ("inspection", r"inspect|investigat|activity (?:was )?found|observed|burrow|droppings"),
]
_RULES = [(tag, re.compile(pat, re.I)) for tag, pat in RULES]

# Actions the system may propose (R3.10: never baiting). `monitoring` is the reference.
ALLOWED = ["inspection", "warning", "citation", "abatement_order", "referral", "cleanup", "barrels"]
REFERENCE = "monitoring"
LABEL = {
    "monitoring": "Inspector monitoring",
    "inspection": "Inspect the property and record the cause",
    "warning": "Warning / notice to the owner",
    "citation": "Citation for trash or sanitation violation",
    "abatement_order": "Abatement order to the owner",
    "referral": "Refer to the owning agency (BWSC, Public Works, Code Enforcement)",
    "cleanup": "Cleanup / trash removal",
    "barrels": "Rat-resistant barrels / sealed containers",
    "baiting": "Baiting (not proposed)",
    "carcass": "Dead animal removed (not a fix)",
}
OWNER = {
    "monitoring": "ISD", "inspection": "ISD", "warning": "ISD", "citation": "ISD / Code Enforcement",
    "abatement_order": "ISD", "referral": "varies", "cleanup": "Public Works", "barrels": "ISD / Public Works",
}


def classify_note(note: str | None) -> str:
    if not isinstance(note, str) or not note.strip():
        return "closed_no_action"
    for tag, rx in _RULES:
        if rx.search(note):
            return tag
    return "unknown"


def _load(conn: psycopg.Connection) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    rodent = pd.DataFrame(
        conn.execute(
            """
            select id, address_key, address_block, opened_at, closed_at, status, closure_note, lat, lon
            from incidents
            where city = 'boston' and category = 'rodent' and lat is not null
            """
        ).fetchall(),
        columns=["id", "address_key", "address_block", "opened_at", "closed_at", "status", "closure_note", "lat", "lon"],
    )
    cosig = pd.DataFrame(
        conn.execute(
            """
            select address_block, category, opened_at from incidents
            where city = 'boston' and address_block is not null and category = any(%s)
            """,
            (COSIGNALS,),
        ).fetchall(),
        columns=["address_block", "category", "opened_at"],
    )
    places = pd.DataFrame(
        conn.execute(
            "select kind, lat, lon from places where lat is not null and kind = any(%s)",
            (list(PLACE_RINGS),),
        ).fetchall(),
        columns=["kind", "lat", "lon"],
    )
    for df in (rodent, cosig):
        for col in ("opened_at", "closed_at"):
            if col in df:
                df[col] = pd.to_datetime(df[col], utc=True)
    return rodent, cosig, places


def _count_before(events: pd.DataFrame, keys: pd.Series, t: pd.Series, days: int) -> np.ndarray:
    out = np.zeros(len(keys), dtype=float)
    if events.empty:
        return out
    by_key = {k: np.sort(g["opened_at"].values) for k, g in events.groupby("address_block")}
    lo_t, hi_t = (t - pd.Timedelta(days=days)).values, t.values
    for i, (k, lo, hi) in enumerate(zip(keys.values, lo_t, hi_t)):
        arr = by_key.get(k)
        if arr is not None:
            out[i] = np.searchsorted(arr, hi, "left") - np.searchsorted(arr, lo, "left")
    return out


def _place_counts(records: pd.DataFrame, places: pd.DataFrame) -> pd.DataFrame:
    q = np.radians(records[["lat", "lon"]].to_numpy(float))
    out = {}
    for kind, radius in PLACE_RINGS.items():
        pts = places.loc[places["kind"] == kind, ["lat", "lon"]].to_numpy(float)
        if len(pts) == 0:
            out[f"near_{kind}"] = np.zeros(len(records))
            continue
        tree = BallTree(np.radians(pts), metric="haversine")
        out[f"near_{kind}"] = tree.query_radius(q, r=radius / EARTH_M, count_only=True).astype(float)
    return pd.DataFrame(out, index=records.index)


def build_records(rodent: pd.DataFrame, cosig: pd.DataFrame, places: pd.DataFrame) -> pd.DataFrame:
    """Every rodent record with context features, the action read from its note, y and `observed`."""
    rec = rodent.sort_values("opened_at").reset_index(drop=True).copy()
    data_end = rec["opened_at"].max()
    rec["action"] = rec["closure_note"].map(classify_note)
    rec.loc[rec["closed_at"].isna(), "action"] = "open"
    # Context is measured at closure time for closed cases, now for open ones.
    t_ctx = rec["closed_at"].fillna(data_end)

    y = np.zeros(len(rec), dtype=int)
    prior = np.zeros(len(rec), dtype=int)
    keyed = rec["address_key"].notna()
    by_addr = {k: np.sort(g["opened_at"].values) for k, g in rec[keyed].groupby("address_key")}
    lo = (t_ctx + pd.Timedelta(days=1)).values
    hi = (t_ctx + pd.Timedelta(days=WINDOW_DAYS)).values
    for i, (k, a, b, op) in enumerate(zip(rec["address_key"].values, lo, hi, rec["opened_at"].values)):
        arr = by_addr.get(k)
        if arr is None:
            continue
        y[i] = int(np.searchsorted(arr, b, "right") > np.searchsorted(arr, a, "left"))
        prior[i] = int(np.searchsorted(arr, op, "left"))
    rec["y"] = y
    rec["observed"] = rec["closed_at"].notna() & keyed & (rec["closed_at"] + pd.Timedelta(days=WINDOW_DAYS) <= data_end)

    rec["prior_reports"] = prior.astype(float)
    month = t_ctx.dt.month
    rec["month_sin"] = np.sin(2 * np.pi * month / 12)
    rec["month_cos"] = np.cos(2 * np.pi * month / 12)
    for cat in COSIGNALS:
        ev = cosig.loc[cosig["category"] == cat, ["address_block", "opened_at"]]
        rec[f"cosig_{cat}"] = np.log1p(_count_before(ev, rec["address_block"], t_ctx, COSIGNAL_DAYS))
    rec = pd.concat([rec, _place_counts(rec, places)], axis=1)
    return rec


CONTEXT = (["prior_reports", "month_sin", "month_cos"] + [f"cosig_{c}" for c in COSIGNALS]
           + [f"near_{k}" for k in PLACE_RINGS])
ACTIONS = ["carcass", "monitoring", "inspection", "warning", "citation", "abatement_order", "referral", "cleanup",
           "barrels", "baiting", "no_violation", "duplicate", "collections", "closed_no_action", "unknown"]
CONTEXT_LABEL = {
    "prior_reports": "earlier rodent reports at this address",
    "cosig_trash_storage": "improper trash storage reports on the block (90 d)",
    "cosig_dead_animal": "dead animal reports on the block (90 d)",
    "cosig_pest": "indoor pest reports on the block (90 d)",
    "cosig_missed_trash": "missed trash pickup reports on the block (90 d)",
    "cosig_dumping": "illegal dumping reports on the block (90 d)",
    "cosig_trash_early": "trash out early reports on the block (90 d)",
    "cosig_dumpster": "dumpster reports on the block (90 d)",
    "near_vacant_parcel": "vacant parcels within 40 m",
    "near_restaurant": "restaurants within 100 m",
    "near_excavation": "excavation permits within 100 m",
    "near_demolition": "demolitions within 100 m",
    "near_city_lot": "city-owned lots within 100 m",
    "near_bigbelly": "public trash bins within 100 m",
    "near_smart_box": "smart trash boxes within 100 m",
    "near_school": "schools within 100 m",
}
LOG_FEATS = {f"cosig_{c}" for c in COSIGNALS}


def _matrix(df: pd.DataFrame, action: pd.Series | str) -> pd.DataFrame:
    X = df[CONTEXT].copy()
    act = action if isinstance(action, pd.Series) else pd.Series(action, index=df.index)
    X["action"] = act.map({a: i for i, a in enumerate(ACTIONS)}).fillna(len(ACTIONS) - 1).astype(int).values
    return X


def _model() -> HistGradientBoostingClassifier:
    return HistGradientBoostingClassifier(
        max_iter=300, learning_rate=0.05, max_leaf_nodes=31, min_samples_leaf=40,
        l2_regularization=1.0, categorical_features=[len(CONTEXT)], random_state=0,
    )


def fit(rec: pd.DataFrame) -> dict:
    obs = rec[rec["observed"] & (rec["action"] != "open")].sort_values("closed_at")
    cutoff = obs["closed_at"].max() - pd.Timedelta(weeks=TEST_WEEKS)
    train, test = obs[obs["closed_at"] <= cutoff], obs[obs["closed_at"] > cutoff]
    m = _model().fit(_matrix(train, train["action"]), train["y"])
    p = m.predict_proba(_matrix(test, test["action"]))[:, 1]
    auc = float(roc_auc_score(test["y"], p)) if test["y"].nunique() == 2 else None
    # Context-only reference: how much does knowing the action add?
    ctx_only = HistGradientBoostingClassifier(max_iter=300, learning_rate=0.05, min_samples_leaf=40,
                                              random_state=0).fit(train[CONTEXT], train["y"])
    auc_ctx = float(roc_auc_score(test["y"], ctx_only.predict_proba(test[CONTEXT])[:, 1]))
    final = _model().fit(_matrix(obs, obs["action"]), obs["y"])
    support = obs["action"].value_counts().to_dict()
    raw = obs.groupby("action")["y"].mean().round(4).to_dict()
    return {
        "model": final,
        "trained_through": obs["closed_at"].max().date(),
        "support": support,
        "metrics": {
            "auc": auc, "auc_context_only": auc_ctx, "baseline_auc": 0.5,
            "base_rate": float(obs["y"].mean()), "n_train": int(len(train)), "n_test": int(len(test)),
            "test_from": cutoff.date().isoformat(), "beats_baseline": bool(auc is not None and auc > 0.5),
            "action_support": {k: int(v) for k, v in support.items()},
            "raw_return_rate_by_action": raw,
            "note_coverage": float((rec["action"].isin(["unknown", "closed_no_action"]) == False).mean()),
        },
    }


def _because(row: pd.Series, ref: pd.Series) -> list[str]:
    """Up to three context facts where this record is well above the city median."""
    out = []
    for f in CONTEXT:
        if f.startswith("month"):
            continue
        v = float(row[f])
        raw = np.expm1(v) if f in LOG_FEATS else v
        if raw >= 1 and v > float(ref[f]):
            out.append((v - float(ref[f]), f"{int(round(raw))} {CONTEXT_LABEL[f]}"))
    return [s for _, s in sorted(out, reverse=True)[:3]]


def propose(res: dict, rec: pd.DataFrame) -> pd.DataFrame:
    """Score every allowed action for every record; pick the lowest predicted return."""
    m = res["model"]
    usable = [a for a in ALLOWED if res["support"].get(a, 0) >= MIN_SUPPORT]
    P = pd.DataFrame({a: m.predict_proba(_matrix(rec, a))[:, 1] for a in usable + [REFERENCE]}, index=rec.index)
    best = P[usable].idxmin(axis=1)
    p_best = P[usable].min(axis=1)
    p_ref = P[REFERENCE]
    gain = p_ref - p_best
    ref_med = rec[CONTEXT].median()
    rows = []
    for i in rec.index:
        r = rec.loc[i]
        ok = gain[i] >= MIN_GAIN
        action = best[i] if ok else "inspection"
        alts = sorted(({"action": a, "label": LABEL[a], "p_return": round(float(P.at[i, a]), 4),
                        "n_cases": int(res["support"].get(a, 0))} for a in usable + [REFERENCE]),
                      key=lambda d: d["p_return"])
        rows.append({
            "incident_id": r["id"],
            "done_action": r["action"],
            "action": action,
            "label": LABEL[action] if ok else "Inspect and record the cause (no option clearly beats monitoring here)",
            "owner": OWNER[action],
            "p_return": round(float(P.at[i, action]), 4),
            "p_return_monitoring": round(float(p_ref[i]), 4),
            "gain": round(float(gain[i]), 4) if ok else 0.0,
            "confident": bool(ok),
            "alternatives": alts,
            "because": _because(r, ref_med),
        })
    return pd.DataFrame(rows)


def record_solution(conn: psycopg.Connection, since: str = "2000-01-01") -> dict:
    """Fit, write a `model_runs` row and `record_solutions` for records opened since `since`. Caller commits."""
    rodent, cosig, places = _load(conn)
    rec = build_records(rodent, cosig, places)
    res = fit(rec)
    run_id = f"solution-v1-{datetime.now(timezone.utc):%Y%m%dT%H%M%S}"
    imp = [{"feature": "action", "label": "Action the city took"}] + [
        {"feature": f, "label": CONTEXT_LABEL.get(f, "time of year")} for f in CONTEXT]
    conn.execute(
        """
        insert into model_runs (id, model, trained_through, params, metrics, feature_importance)
        values (%s, %s, %s, %s::jsonb, %s::jsonb, %s::jsonb)
        """,
        (run_id, MODEL, res["trained_through"],
         json.dumps({"window_days": WINDOW_DAYS, "min_gain": MIN_GAIN, "min_support": MIN_SUPPORT,
                     "allowed": ALLOWED, "reference": REFERENCE, "context": CONTEXT}),
         json.dumps(res["metrics"]), json.dumps(imp)),
    )
    target = rec[rec["opened_at"] >= pd.Timestamp(since, tz="UTC")]
    out = propose(res, target)
    with conn.cursor() as cur:
        cur.execute("delete from record_solutions")
        cur.executemany(
            """
            insert into record_solutions (incident_id, model_run_id, done_action, action, label, owner,
                p_return, p_return_monitoring, gain, confident, alternatives, because, caveat)
            values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s::jsonb,%s::jsonb,%s)
            """,
            [(r.incident_id, run_id, r.done_action, r.action, r.label, r.owner, r.p_return,
              r.p_return_monitoring, r.gain, r.confident, json.dumps(r.alternatives), json.dumps(r.because), CAVEAT)
             for r in out.itertuples()],
        )
    return {"model_run_id": run_id, "model": MODEL, "metrics": res["metrics"], "records_scored": len(out),
            "proposed": out["action"].value_counts().to_dict(), "confident_share": float(out["confident"].mean())}


__all__ = ["MODEL", "classify_note", "build_records", "fit", "propose", "record_solution"]
