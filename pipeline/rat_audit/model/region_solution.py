"""region_solution — the AI-written solution for each ranked Insights region (spec §5.2 layer 2).

Pipeline, all from data already in the DB:

1. Regions (spec §5.1 / §5.5). severity(cell) = rodent reports in the last 12 weeks +
   expected reports over the next 4 forecast weeks + expected returns in the next 60 days
   (Σ per-address return chance from `record_solutions`), all in reports. Smoothed with a
   3×3 kernel (ring 0.5), top 5 % cells merged into 8-connected clusters (≤ 9 cells, split
   at local maxima), so a hotspot on a cell corner is one region. Ranked by summed raw severity. When Carol's
   `insights` table exists it should become the source of regions; until then we build them.
2. Evidence per region: the forecast (next 4 weeks + last 8 weeks actual vs expected), the
   forecast drivers, the region's records with what the city did and the per-record model
   (`record_solutions`), each address's action history, and possible causes within 150 m.
3. Solution statistics by case type: closed rodent cases grouped by situation (history at
   the address × trash signals on the block × vacant parcel within 40 m). Per situation and
   action: n, share of cases, 60-day return rate with 95 % interval, and the per-record
   model's adjusted rate. This tells the AI what is usually done in this kind of case
   (monitoring vs interventions) and what followed.
4. AI (Claude Haiku via the Vercel AI Gateway, temperature 0): one solution for the region
   plus one "what to do" line per record. Guards: JSON schema, legal lane, no bait/poison,
   every number must appear in the input. On failure: one retry with the error, then the
   §5.2 rules.

Writes `region_solutions` (one row per region, input evidence included so the tab and the
agent can show it). Never commits.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

import numpy as np
import pandas as pd
import psycopg
from pyproj import Transformer
from sklearn.neighbors import BallTree

from . import solution as sol

LLM_MODEL = "anthropic/claude-haiku-5.5"
GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions"
N_REGIONS = 20
TOP_SHARE = 0.05
RING_WEIGHT = 0.5
MAX_CELLS = 9
CELL_M = 250
OBS_WEEKS = 12
NEAR_M = 150
MAX_RECORDS = 30
LANES = {"sanitation", "exclusion", "enforcement", "referral", "inspect"}
BANNED = re.compile(r"\b(bait\w*|poison\w*|rodenticide\w*|toxicant\w*|treat(?:ment|ments|ed|ing)?|exterminat\w*)\b", re.I)
EARTH_M = 6_371_000.0
CAVEAT = ("Model estimate from past cases and the forecast, not a measured effect. "
          "Expected 311 rodent reports, not a count of rats.")
NEAR_311 = {"trash_storage": "improper trash storage 311", "dumping": "illegal dumping 311",
            "missed_trash": "missed trash pickup 311", "dumpster": "dumpster 311",
            "trash_early": "trash out early 311", "dead_animal": "dead animal 311", "pest": "indoor pest 311"}
NEAR_PLACES = {"vacant_parcel": "vacant parcels", "restaurant": "restaurants / food places",
               "excavation": "excavation permits", "demolition": "demolition permits",
               "city_lot": "city-owned lots", "bigbelly": "public trash bins", "school": "schools"}
LANE_OF = {"inspection": "inspect", "monitoring": "inspect", "warning": "enforcement", "citation": "enforcement",
           "abatement_order": "enforcement", "referral": "referral", "cleanup": "sanitation", "barrels": "exclusion"}

_to_m = Transformer.from_crs(4326, 26986, always_xy=True)


def _shown(action: str) -> str:
    """Action name as the AI sees it; past baiting is shown as treatment so the word is never echoed."""
    return "earlier ISD visit" if action == "baiting" else sol.LABEL.get(action, action.replace("_", " "))


def _pct(x: float) -> str:
    return f"{100 * x:.0f}%"


# ── 1. regions ────────────────────────────────────────────────────────────────

def _forecast_run(conn) -> str:
    return conn.execute(
        """
        select p.model_run_id from predictions p join model_runs r on r.id = p.model_run_id
        where p.actual is null group by p.model_run_id, r.created_at order by r.created_at desc limit 1
        """
    ).fetchone()[0]


def expected_returns(rec: pd.DataFrame, rs: dict, data_end) -> pd.Series:
    """Per cell: Σ over addresses with a report in the last 12 weeks of P(a report returns within
    60 days if handled as now, i.e. monitoring), from the address's latest record in `record_solutions`.
    Unit = reports, so it adds to the other severity terms without weights. Records without an
    address key count as their own address."""
    recent = rec[rec["opened_at"] > data_end - pd.Timedelta(weeks=OBS_WEEKS)].sort_values("opened_at")
    addr = recent["address_key"].fillna(recent["id"])
    latest = recent.groupby(addr).tail(1)
    p = latest["id"].map(lambda i: (rs.get(i) or {}).get("p_return_monitoring")).astype(float)
    return p.groupby(latest["cell_id"]).sum()


def build_regions(conn, rec: pd.DataFrame, run_id: str, rs: dict, n: int = N_REGIONS) -> tuple[list[dict], pd.DataFrame, pd.DataFrame]:
    cells = pd.DataFrame(conn.execute(
        "select id, col, row, lat, lon, neighborhood from grid_cells where city = 'boston'").fetchall(),
        columns=["cell_id", "col", "row", "lat", "lon", "neighborhood"])
    fut = pd.DataFrame(conn.execute(
        "select cell_id, week_start, expected, p_any, risk_band, drivers from predictions "
        "where model_run_id = %s and actual is null order by week_start", (run_id,)).fetchall(),
        columns=["cell_id", "week_start", "expected", "p_any", "risk_band", "drivers"])
    weeks = sorted(fut["week_start"].unique())[:4]
    fut = fut[fut["week_start"].isin(weeks)]
    exp4 = fut.groupby("cell_id")["expected"].sum()

    data_end = rec["opened_at"].max()
    recent = rec[rec["opened_at"] > data_end - pd.Timedelta(weeks=OBS_WEEKS)]
    obs = recent.groupby("cell_id").size()

    cells["observed_12w"] = cells["cell_id"].map(obs).fillna(0).astype(int)
    cells["expected_4w"] = cells["cell_id"].map(exp4).fillna(0.0)
    cells["expected_returns_60d"] = cells["cell_id"].map(expected_returns(rec, rs, data_end)).fillna(0.0)
    cells["severity"] = cells["observed_12w"] + cells["expected_4w"] + cells["expected_returns_60d"]
    pos = {(c, r): s for c, r, s in zip(cells["col"], cells["row"], cells["severity"])}
    ring = [(dc, dr) for dc in (-1, 0, 1) for dr in (-1, 0, 1) if (dc, dr) != (0, 0)]
    cells["smoothed"] = [s + RING_WEIGHT * sum(pos.get((c + dc, r + dr), 0.0) for dc, dr in ring)
                         for c, r, s in zip(cells["col"], cells["row"], cells["severity"])]

    hot = cells[cells["smoothed"] >= cells["smoothed"].quantile(1 - TOP_SHARE)].set_index(["col", "row"])
    smooth = hot["smoothed"].to_dict()
    # Local maxima seed the regions; every other hot cell climbs to its highest neighbour.
    def climb(k):
        seen = set()
        while k not in seen:
            seen.add(k)
            nb = [(k[0] + dc, k[1] + dr) for dc, dr in ring if (k[0] + dc, k[1] + dr) in smooth]
            best = max(nb + [k], key=lambda x: (smooth[x], x))
            if best == k:
                return k
            k = best
        return k
    groups: dict[tuple, list] = {}
    for k in smooth:
        groups.setdefault(climb(k), []).append(k)

    regions = []
    for peak, members in groups.items():
        members = sorted(members, key=lambda x: -smooth[x])[:MAX_CELLS]
        rows = hot.loc[members].reset_index()
        top = hot.loc[peak]
        regions.append({
            "region_id": top["cell_id"], "cell_id": top["cell_id"], "cell_ids": rows["cell_id"].tolist(),
            "neighborhood": top["neighborhood"], "lat": float(top["lat"]), "lon": float(top["lon"]),
            "severity": {"observed_12w": int(rows["observed_12w"].sum()),
                         "expected_4w": round(float(rows["expected_4w"].sum()), 1),
                         "expected_returns_60d": round(float(rows["expected_returns_60d"].sum()), 1),
                         "score": round(float(rows["severity"].sum()), 1)},
        })
    regions.sort(key=lambda r: (-r["severity"]["score"], -r["severity"]["expected_4w"], r["region_id"]))
    regions = regions[:n]
    for i, r in enumerate(regions, 1):
        r["rank"] = i
        r["rank_of"] = len(cells)
    cells["region_id"] = None
    for r in regions:
        cells.loc[cells["cell_id"].isin(r["cell_ids"]), "region_id"] = r["region_id"]
    return regions, fut, cells


def _assign_cells(rec: pd.DataFrame) -> pd.Series:
    x, y = _to_m.transform(rec["lon"].to_numpy(), rec["lat"].to_numpy())
    return pd.Series([f"g250_{int(a // CELL_M)}_{int(b // CELL_M)}" for a, b in zip(x, y)], index=rec.index)


# ── 3. solution statistics by case type ───────────────────────────────────────

def _situation(df: pd.DataFrame) -> pd.Series:
    hist = pd.cut(df["prior_reports"], [-1, 0, 1, 4, 10**9],
                  labels=["first report at the address", "1 earlier report", "2-4 earlier reports", "5+ earlier reports"])
    trash = (df[["cosig_trash_storage", "cosig_dumping", "cosig_missed_trash", "cosig_dumpster"]].sum(axis=1) > 0)
    vac = df["near_vacant_parcel"] > 0
    return (hist.astype(str) + " · " + np.where(trash, "trash 311 on the block", "no trash 311 on the block")
            + " · " + np.where(vac, "vacant parcel within 40 m", "no vacant parcel within 40 m"))


def _wilson(k: int, n: int) -> tuple[float, float]:
    if n == 0:
        return 0.0, 0.0
    z, p = 1.96, k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * np.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return max(0.0, c - h), min(1.0, c + h)


SHOWN_ACTIONS = ["monitoring", "inspection", "abatement_order", "citation", "warning", "referral", "cleanup",
                 "barrels", "baiting", "no_violation"]


def _versus(a, rate, lo, hi, m_rate, m_lo, m_hi, mn) -> str:
    if a == "monitoring":
        return "reference"
    if m_rate is None or mn < 20:
        return "no monitoring reference"
    if rate < m_rate:
        return "lower, clear (intervals do not overlap)" if hi < m_lo else "lower, not clear (intervals overlap)"
    return "same or higher than monitoring: do not propose for this situation"


def solution_stats(rec: pd.DataFrame, res: dict) -> dict[str, dict]:
    obs = rec[rec["observed"] & rec["action"].isin(SHOWN_ACTIONS)].copy()
    obs["situation"] = _situation(obs)
    model = res["model"]
    adjusted = {a: model.predict_proba(sol._matrix(obs, a))[:, 1] for a in SHOWN_ACTIONS if a != "baiting"}

    def table(mask) -> dict:
        sub = obs[mask]
        rows = []
        mm = sub["action"] == "monitoring"
        mk, mn = int(sub.loc[mm, "y"].sum()), int(mm.sum())
        m_rate, (m_lo, m_hi) = (mk / mn if mn else None), _wilson(mk, mn)
        for a in SHOWN_ACTIONS:
            m = sub["action"] == a
            k, n = int(sub.loc[m, "y"].sum()), int(m.sum())
            if n < 20:
                continue
            lo, hi = _wilson(k, n)
            rows.append({"action": _shown(a), "cases": n,
                         "share_of_cases": _pct(n / len(sub)),
                         "returned_within_60d": _pct(k / n), "interval_95": f"{_pct(lo)}-{_pct(hi)}",
                         "model_adjusted_return": _pct(float(adjusted[a][mask.values].mean())) if a in adjusted else None,
                         "proposable": a in sol.ALLOWED,
                         "vs_monitoring": _versus(a, k / n, lo, hi, m_rate, m_lo, m_hi, mn)})
        better = [r["action"] for r in rows if r["proposable"] and r["vs_monitoring"].startswith("lower")]
        return {"cases": int(len(sub)), "returned_within_60d": _pct(float(sub["y"].mean())) if len(sub) else None,
                "by_action": rows,
                "proposable_actions_with_lower_return_than_monitoring": better or ["none"]}

    out = {"all Boston closed rodent cases": table(pd.Series(True, index=obs.index))}
    for s in obs["situation"].unique():
        out[s] = table(obs["situation"] == s)
    return out


# ── 2. evidence per region ────────────────────────────────────────────────────

def _scrub(note) -> str | None:
    if not isinstance(note, str) or not note.strip():
        return None
    note = re.sub(r"\S+@\S+", "[email]", note)
    note = re.sub(r"\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b", "[phone]", note)
    return note.strip()[:220]


def _near_counts(pts: np.ndarray, others: pd.DataFrame, labels: dict, key: str,
                 baseline: dict | None = None) -> list[dict]:
    """Per kind: distinct items within 150 m of any point, mean per point, and the Boston mean
    per recent report (`baseline`) so the AI can tell what is unusual here."""
    out = []
    q = np.radians(pts)
    for kind, label in labels.items():
        o = others[others[key] == kind]
        if o.empty:
            continue
        tree = BallTree(np.radians(o[["lat", "lon"]].to_numpy(float)), metric="haversine")
        ind, dist = tree.query_radius(q, r=NEAR_M / EARTH_M, return_distance=True)
        hit = set(np.concatenate(ind)) if len(ind) else set()
        if not hit:
            continue
        nearest = min((d.min() for d in dist if len(d)), default=None)
        srcs = sorted(o.iloc[sorted(hit)]["source_id"].dropna().unique().tolist())
        per = round(float(np.mean([len(i) for i in ind])), 1)
        row = {"kind": kind, "label": label, "count": len(hit), "per_report_within_150m": per,
               "nearest_m": int(round(nearest * EARTH_M)), "source_ids": srcs[:4]}
        if baseline is not None:
            b = baseline.get(kind, 0.0)
            row["boston_per_report_within_150m"] = b
            row["times_boston"] = round(per / b, 1) if b > 0 else None
        out.append(row)
    return sorted(out, key=lambda d: -(d.get("times_boston") or 0))


def _baseline(pts: np.ndarray, others: pd.DataFrame, labels: dict, key: str) -> dict:
    """Boston mean, per recent rodent report, of each kind within 150 m."""
    return {c["kind"]: c["per_report_within_150m"] for c in _near_counts(pts, others, labels, key)}


def _locations(recent: pd.DataFrame, two_y: pd.DataFrame) -> tuple[list[dict], dict]:
    """Clickable places for the card: one per block in the region's recent reports or 2-year histories.
    The AI links them as [label](L<n>); the front end flies the map to lat/lon."""
    pool = pd.concat([recent, two_y]).drop_duplicates("id")
    pool = pool[pool["address_block"].notna()]
    order = (list(dict.fromkeys(recent["address_block"].dropna()))
             + [b for b in pool["address_block"].value_counts().index if b not in set(recent["address_block"])])
    out, of = [], {}
    for i, blk in enumerate(order[:25], 1):
        g = pool[pool["address_block"] == blk]
        lid = f"L{i}"
        of[blk] = lid
        out.append({"id": lid, "label": str(blk).split(",")[0].strip(), "block": blk,
                    "lat": round(float(g["lat"].mean()), 6), "lon": round(float(g["lon"].mean()), 6),
                    "incident_ids": g.sort_values("opened_at", ascending=False)["id"].head(5).tolist()})
    return out, of


def build_inputs(conn, regions, fut, rec, rs, stats, run_id) -> list[dict]:
    data_end = rec["opened_at"].max()
    places = pd.DataFrame(conn.execute(
        "select kind, lat, lon, source_id from places where lat is not null and kind = any(%s)",
        (list(NEAR_PLACES),)).fetchall(), columns=["kind", "lat", "lon", "source_id"])
    sig = pd.DataFrame(conn.execute(
        "select category, lat, lon, source_id from incidents where lat is not null and category = any(%s) "
        "and opened_at > %s", (list(NEAR_311), (data_end - pd.Timedelta(days=90)).to_pydatetime())).fetchall(),
        columns=["category", "lat", "lon", "source_id"])
    past = pd.DataFrame(conn.execute(
        "select cell_id, week_start, expected, actual from predictions where model_run_id = %s "
        "and actual is not null order by week_start desc", (run_id,)).fetchall(),
        columns=["cell_id", "week_start", "expected", "actual"])
    rec = rec.copy()
    rec["situation"] = _situation(rec)
    city = rec[rec["opened_at"] > data_end - pd.Timedelta(weeks=OBS_WEEKS)][["lat", "lon"]].to_numpy(float)
    sig_k = sig.rename(columns={"category": "kind"})
    base_places, base_311 = _baseline(city, places, NEAR_PLACES, "kind"), _baseline(city, sig_k, NEAR_311, "kind")
    inputs = []
    for r in regions:
        cells = set(r["cell_ids"])
        f = fut[fut["cell_id"].isin(cells)]
        weekly = f.groupby("week_start")["expected"].sum()
        w1 = f[f["week_start"] == f["week_start"].min()]
        drivers: dict[str, float] = {}
        for ds in w1["drivers"]:
            for d in ds or []:
                drivers[d["label"]] = drivers.get(d["label"], 0.0) + float(d["contribution"])
        p = past[past["cell_id"].isin(cells)]
        last8 = p.groupby("week_start")[["expected", "actual"]].sum().sort_index().tail(8)

        mine = rec[rec["cell_id"].isin(cells)]
        recent = mine[mine["opened_at"] > data_end - pd.Timedelta(weeks=OBS_WEEKS)].sort_values("opened_at", ascending=False)
        pts = (recent if len(recent) else mine.tail(20))[["lat", "lon"]].to_numpy(float)
        if len(pts) == 0:
            pts = np.array([[r["lat"], r["lon"]]])
        causes = (_near_counts(pts, places, NEAR_PLACES, "kind", base_places)
                  + [dict(c, label=c["label"] + " (last 90 days)") for c in
                     _near_counts(pts, sig_k, NEAR_311, "kind", base_311)])
        causes.sort(key=lambda d: -(d.get("times_boston") or 0))

        two_y = mine[mine["opened_at"] > data_end - pd.Timedelta(days=730)]
        locations, loc_of = _locations(recent.head(MAX_RECORDS), two_y)
        records = []
        for x in recent.head(MAX_RECORDS).itertuples():
            s = rs.get(x.id)
            records.append({
                "incident_id": x.id, "opened": x.opened_at.date().isoformat(), "block": x.address_block,
                "location_id": loc_of.get(x.address_block), "lat": round(float(x.lat), 6), "lon": round(float(x.lon), 6),
                "status": "closed" if pd.notna(x.closed_at) else "open",
                "city_did": _shown(x.action), "closure_note": _scrub(x.closure_note),
                "earlier_reports_at_address": int(x.prior_reports), "situation": x.situation,
                "model": None if s is None else {
                    "best_action": s["label"], "return_if_best": _pct(s["p_return"]),
                    "return_if_monitoring": _pct(s["p_return_monitoring"]), "confident": s["confident"],
                    "options": [{"action": a["label"], "return": _pct(a["p_return"])} for a in s["alternatives"][:4]],
                    "context": s["because"]},
            })
        # Per-address action ladder in the last 2 years: what was tried, did reports come back.
        hist = []
        for blk, g in two_y.groupby("address_block"):
            if len(g) < 2:
                continue
            g = g.sort_values("opened_at")
            hist.append({"block": blk, "reports_2y": int(len(g)),
                         "returns_within_60d": int(g["y"].sum()),
                         "actions_in_order": [_shown(a) for a in g["action"] if a not in ("duplicate", "open")][-8:]})
        hist = sorted(hist, key=lambda h: -h["reports_2y"])[:8]
        for h in hist:
            h["location_id"] = loc_of.get(h["block"])
        sits = recent["situation"].value_counts().head(3).index.tolist() or mine["situation"].value_counts().head(2).index.tolist()
        sv = r["severity"]
        p1 = _pct(float(1 - np.prod(1 - w1["p_any"].astype(float)))) if len(w1) else None
        headline = [f"{sv['observed_12w']} rodent reports in the last 12 weeks",
                    f"{sv['expected_4w']} expected reports in the next 4 weeks",
                    f"{sv['expected_returns_60d']} expected returns within 60 days at its active addresses"]
        if p1:
            headline.append(f"{p1} chance of at least one report in week 1")
        specific = ([f"{c['label']}: {c['per_report_within_150m']} per report within 150 m, "
                     f"{c['times_boston']} times the Boston level" for c in causes
                     if (c.get("times_boston") or 0) >= 2][:4]
                    + [f"{h['block']}: {h['reports_2y']} reports in 2 years, {h['returns_within_60d']} returns"
                       for h in hist[:2] if h["returns_within_60d"] >= 2])
        notes = " ".join(str(x.closure_note or "") for x in recent.itertuples()).lower()
        if re.search(r"sewer|catch ?basin|bwsc", notes):
            specific.append("sewer or catch basin mentioned in closure notes")
        inputs.append({
            "region": {**{k: r[k] for k in ("rank", "rank_of", "region_id", "cell_ids", "neighborhood")},
                       "severity": r["severity"], "headline_facts": headline,
                       "what_is_specific_here": specific or ["nothing stands out from the Boston level"]},
            "forecast": {
                "model_run_id": run_id,
                "next_4_weeks_expected_reports": {str(k): round(float(v), 2) for k, v in weekly.items()},
                "week_1_chance_of_any_report": _pct(float(1 - np.prod(1 - w1["p_any"].astype(float)))) if len(w1) else None,
                "week_1_risk_bands": w1["risk_band"].value_counts().to_dict(),
                "last_8_weeks_expected_vs_actual": [{"week": str(k), "expected": round(float(v.expected), 2),
                                                     "actual": int(v.actual)} for k, v in last8.iterrows()],
                "drivers": [{"label": k, "contribution": round(v, 2)} for k, v in
                            sorted(drivers.items(), key=lambda kv: -abs(kv[1]))[:5]],
            },
            "locations": locations,
            "records_last_12_weeks": records,
            "address_histories": hist,
            "possible_causes_within_150m": causes[:10],
            "solution_statistics": {s: stats[s] for s in ["all Boston closed rodent cases"] + sits if s in stats},
            "source_ids": sorted(set(mine["source_id"].dropna()) | {s for c in causes for s in c["source_ids"]}),
        })
    return inputs


# ── 4. AI + guards + rules fallback ───────────────────────────────────────────

SYSTEM = """You advise Boston's rodent program (BRAP coordinators and ISD inspectors). You get one 250 m region as JSON: its severity (rodent 311 reports in the last 12 weeks + expected reports in the next 4 weeks + expected returns within 60 days at its active addresses), the forecast and its drivers, the region's recent reports with what the city did and a per-record model, each address's action history, possible causes within 150 m, and statistics of past cases by situation: for each action, how often it is used and how often reports came back within 60 days.

Decide ONE solution for the region and one short line per record.

How to decide:
- Compare monitoring/inspection with interventions (abatement order, citation, warning, cleanup, rat-resistant barrels, referral) in the statistics for the situations that match this region's records. Prefer what is not yet tried at addresses where the same action was repeated and reports came back.
- Places: name streets exactly as their "label" in the "locations" list (e.g. "W Fourth St"), so the card can link them; do not name places that are not in that list.
- Lead with what is specific to THIS region (region.what_is_specific_here: causes well above the Boston level, the named repeat addresses, sewer notes). Avoid generic advice that would fit any region.
- Tie the action to the strongest nearby cause (e.g. trash 311 or restaurants -> containers/compliance; vacant parcel -> notice to owner, joint visit; sewer in notes -> BWSC referral).
- Use the forecast: say whether reports are expected to stay high in the next 4 weeks.
- For severity and forecast numbers, copy the phrases in region.headline_facts word for word (e.g. "3.5 expected reports in the next 4 weeks"); never attach a number to a different meaning.
- For nearby causes cite per_report_within_150m and times_boston, not the raw count, worded as "<n> <cause> per report within 150 m" (e.g. "17.0 vacant parcels per report within 150 m"); these are counts of places or 311 reports, never "expected reports". Call a cause "well above" Boston only when times_boston is 2 or more; below 2 say "near the Boston level".
- When the city's last step was an earlier ISD visit, the todo is the next sanitation, exclusion, enforcement or referral step; do not comment on the visit itself.
- Only propose an intervention that is listed in proposable_actions_with_lower_return_than_monitoring for the matching situation. Never propose an action marked "same or higher than monitoring" for the region's situations; if none is lower, propose inspecting and recording the cause.
- The statistics are observational: inspectors choose actions by situation, so a lower return rate is not proof the action works. Say "in past cases", never "reduces" or "works". The model's action differences are weak; use them as one input.
- Read the rates correctly: a LOWER "returned_within_60d" is better. Never argue against an action whose rate is lower than monitoring's; prefer actions with a lower rate and enough cases (check the 95% interval; overlapping intervals mean "no clear difference" and you should say so).
- If evidence is thin (few records, no notes), recommend inspecting and recording the cause.
- Legal lane only: sanitation, exclusion, enforcement, referral, or inspect. Do not write the words bait, poison, rodenticide, treat, treatment or exterminate at all, not even as history or to say "do not"; refer to past burrow work only as "earlier ISD visits". Never tell anyone to continue or schedule such visits.
- Every number you write must be copied exactly from the input (e.g. "18%", "12 reports"). Do not compute new numbers. Do not mention names or full addresses; blocks are fine.
- Plain English, short. "Expected reports", never "rats" counts.

Style: direct, like an order from a supervisor. Imperative verbs, no hedging filler, no restating the question. The card already shows the severity, forecast and returns, so do NOT repeat them.

Answer by calling submit_solution:
- action: at most 18 words, imperative, starts with a verb, names the place and the step (e.g. "Refer the F St catch basins to BWSC; cite repeat trash violations at W Fourth St.").
- because: at most 2 sentences and 45 words. Sentence 1 = the cause that is specific here, with its number. Sentence 2 = the past-case evidence for the chosen step, with its numbers, ending with "(observational)" if intervals overlap. No severity or forecast numbers.
- cites: incident ids, cause kinds or statistic names used.
- records: one {incident_id, todo} per report in records_last_12_weeks (all of them); todo = at most 14 words, imperative, the next step for that report (e.g. "Cite owner for open trash containers at this address."). Do not invent follow-up dates or intervals.
- unknowns: at most 2 checks, each at most 14 words, phrased as a question."""


TOOL = {"type": "function", "function": {
    "name": "submit_solution", "description": "Submit the region's solution.",
    "parameters": {"type": "object", "required": ["action", "lane", "because", "cites", "records", "unknowns"], "properties": {
        "action": {"type": "string"},
        "lane": {"type": "string", "enum": sorted(LANES)},
        "because": {"type": "string"},
        "cites": {"type": "array", "items": {"type": "string"}},
        "records": {"type": "array", "items": {"type": "object", "required": ["incident_id", "todo"], "properties": {
            "incident_id": {"type": "string"}, "todo": {"type": "string"}}}},
        "unknowns": {"type": "array", "items": {"type": "string"}}}}}}


def _gateway(messages: list[dict]) -> dict:
    """One forced tool call through the AI Gateway; returns the parsed arguments."""
    token = os.environ.get("AI_GATEWAY_API_KEY") or os.environ["VERCEL_OIDC_TOKEN"]
    body = json.dumps({"model": LLM_MODEL, "temperature": 0, "max_tokens": 6000, "messages": messages,
                       "tools": [TOOL], "tool_choice": {"type": "function", "function": {"name": "submit_solution"}}}).encode()
    req = urllib.request.Request(GATEWAY_URL, data=body, headers={
        "Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as resp:
        msg = json.load(resp)["choices"][0]["message"]
    return json.loads(msg["tool_calls"][0]["function"]["arguments"])


FIXED_NUMBERS = {"40", "60", "90", "100", "150", "250"}  # spec constants: radii (m), windows (days)
_NUM = re.compile(r"(?<![\w.])\d+(?:\.\d+)?%?")


def _words(t) -> int:
    return len(str(t).split())


def _too_long(out: dict) -> list[str]:
    errs = []
    if _words(out.get("action", "")) > 22:
        errs.append("action must be at most 18 words")
    because = str(out.get("because", ""))
    if _words(because) > 55 or len(re.findall(r"[.!?](?:\s|$)", because)) > 2:
        errs.append("because must be at most 2 sentences and 45 words, without severity or forecast numbers")
    if len(out.get("unknowns", [])) > 2 or any(_words(u) > 18 for u in out.get("unknowns", [])):
        errs.append("unknowns: at most 2, each at most 14 words")
    long_todo = [r.get("incident_id") for r in out.get("records", []) if _words(r.get("todo", "")) > 18]
    if long_todo:
        errs.append(f"todo must be at most 14 words for: {long_todo[:5]}")
    return errs


ACTION_WORDS = {
    "abatement_order": r"abatement", "citation": r"\bcit(?:e|es|ation|ations)\b", "warning": r"warning|notice",
    "barrels": r"barrels?|rat-resistant|sealed containers?", "cleanup": r"clean ?up", "referral": r"\brefer",
}


def _worse_than_monitoring(action: str, inp: dict) -> list[str]:
    """Reject an action that, in every one of the region's situations where it has data, did no better than monitoring."""
    tables = [t for k, t in inp["solution_statistics"].items() if k != "all Boston closed rodent cases"]
    tables = tables or list(inp["solution_statistics"].values())
    errs = []
    sewer = any("sewer" in f for f in inp["region"].get("what_is_specific_here", []))
    for a, rx in ACTION_WORDS.items():
        if not re.search(rx, action, re.I) or (a == "referral" and sewer):  # sewer cause -> BWSC is the rule (§5.2 #4)
            continue
        verdicts = [r["vs_monitoring"] for t in tables for r in t["by_action"] if r["action"] == _shown(a)]
        if verdicts and all(v.startswith("same or higher") for v in verdicts):
            ok = sorted({x for t in tables for x in t["proposable_actions_with_lower_return_than_monitoring"]} - {"none"})
            errs.append(f"'{_shown(a)}' did no better than monitoring in this region's situations; do not mention it in "
                        f"the action. Choose from: {ok or ['Inspect the property and record the cause']}")
    return errs


def check(out: dict, inp: dict, input_text: str) -> list[str]:
    errs = []
    if out.get("lane") not in LANES:
        errs.append(f"lane must be one of {sorted(LANES)}")
    text = " ".join([str(out.get("action", "")), str(out.get("because", ""))]
                    + [str(r.get("todo", "")) for r in out.get("records", [])] + [str(u) for u in out.get("unknowns", [])])
    if BANNED.search(text):
        errs.append("mentions bait/poison/rodenticide")
    allowed = set(_NUM.findall(input_text)) | FIXED_NUMBERS
    bad = sorted({n for n in _NUM.findall(text) if n not in allowed and not (n.isdigit() and int(n) <= 12)})
    if bad:
        errs.append(f"numbers not in the input: {bad[:8]}")
    errs += _worse_than_monitoring(str(out.get("action", "")), inp)
    errs += _too_long(out)
    ids = {l["id"] for l in inp.get("locations", [])}
    bad_ids = sorted(set(re.findall(r"\]\((L\d+)\)", text)) - ids)
    if bad_ids:
        errs.append(f"unknown location ids {bad_ids}; use only ids from locations")
    want = {r["incident_id"] for r in inp["records_last_12_weeks"]}
    got = {r.get("incident_id") for r in out.get("records", [])}
    if want - got:
        errs.append(f"missing records: {sorted(want - got)[:5]}")
    return errs


def ask(inp: dict) -> tuple[dict | None, list[str]]:
    text = json.dumps(inp, default=str)
    msgs = [{"role": "system", "content": SYSTEM}, {"role": "user", "content": text}]
    errs: list[str] = []
    for _ in range(4):
        try:
            out = _gateway(msgs)
        except Exception as e:  # network, quota, malformed tool call
            errs = [f"call/parse failed: {e}"]
            continue
        out["action"] = re.sub(r"^\s*lane:\s*\w+\.?\s*", "", str(out.get("action", "")), flags=re.I)
        errs = check(out, inp, text)
        if not errs:
            return out, []
        msgs = msgs[:2] + [{"role": "user", "content": "Your previous answer was rejected: " + "; ".join(errs)
                            + ". Call submit_solution again with these problems fixed."}]
    return None, errs


def link_places(out: dict, locations: list[dict]) -> dict:
    """Turn every unlinked mention of a location label into [label](id), longest labels first."""
    labels = {l["label"]: l["id"] for l in locations if l.get("label")}
    if not labels:
        return out
    rx = re.compile(r"(?<!\[)\b(" + "|".join(re.escape(k) for k in sorted(labels, key=len, reverse=True))
                    + r")\b(?!\]\()")
    link = lambda t: rx.sub(lambda m: f"[{m.group(1)}]({labels[m.group(1)]})", str(t))
    return {**out, "action": link(out.get("action", "")), "because": link(out.get("because", "")),
            "unknowns": [link(u) for u in out.get("unknowns", [])],
            "records": [{**r, "todo": link(r.get("todo", ""))} for r in out.get("records", [])]}


def _link(h: dict, inp: dict) -> str:
    loc = next((l for l in inp.get("locations", []) if l["id"] == h.get("location_id")), None)
    return f"[{loc['label']}]({loc['id']})" if loc else str(h["block"])


def rules(inp: dict) -> dict:
    """Spec §5.2 fallback, first match wins."""
    recs = inp["records_last_12_weeks"]
    causes = {c["kind"]: c for c in inp["possible_causes_within_150m"]}
    tried = [h for h in inp["address_histories"]
             if h["returns_within_60d"] >= 2 and sum(a in (_shown("monitoring"), _shown("inspection")) for a in h["actions_in_order"]) >= 2]
    notes = " ".join(r["closure_note"] or "" for r in recs).lower()
    if tried:
        h = tried[0]
        out = ("Escalate at the repeat address: an option not tried there yet (citation or abatement order)", "enforcement", 1,
               f"Monitoring/inspection repeated at {_link(h, inp)} and reports came back {h['returns_within_60d']} times.")
    elif "vacant_parcel" in causes and causes["vacant_parcel"]["nearest_m"] <= 40:
        out = ("Joint block visit; notice to the vacant lot's owner or managing agency", "enforcement", 2,
               "Vacant parcel next to the reports.")
    elif any(k in causes for k in ("trash_storage", "dumping", "missed_trash", "dumpster")):
        out = ("Container compliance visit; sealed containers", "sanitation", 3, "Trash 311 reports near the records.")
    elif "sewer" in notes or "catch basin" in notes:
        out = ("Referral to BWSC for a catch-basin check", "referral", 4, "Sewer mentioned in closure notes.")
    else:
        out = ("Inspect and record the cause", "inspect", 5, "Cause not clear from the data.")
    action, lane, rule_id, because = out
    return {"action": action, "lane": lane, "because": because, "rule_id": rule_id, "cites": [],
            "records": [{"incident_id": r["incident_id"],
                         "todo": (r["model"] or {}).get("best_action") or "Inspect and record the cause"} for r in recs],
            "unknowns": []}


def write_cell_severity(conn, cells: pd.DataFrame, run_id: str, now) -> None:
    """All Boston cells with the three severity terms, the smoothed score and the region they fall in."""
    cells = cells.assign(rank=cells["smoothed"].rank(ascending=False, method="first").astype(int))
    with conn.cursor() as cur:
        cur.execute("delete from cell_severity")
        cur.executemany(
            """
            insert into cell_severity (cell_id, forecast_run_id, observed_12w, expected_4w, expected_returns_60d,
                severity, smoothed, rank, region_id, computed_at)
            values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            [(c.cell_id, run_id, int(c.observed_12w), round(float(c.expected_4w), 4),
              round(float(c.expected_returns_60d), 4), round(float(c.severity), 4), round(float(c.smoothed), 4),
              int(c.rank), c.region_id, now) for c in cells.itertuples()])


def region_solution(conn: psycopg.Connection, n: int = N_REGIONS, use_ai: bool = True) -> dict:
    """Build regions + evidence, ask the AI (or rules), write `region_solutions`. Caller commits."""
    rodent, cosig, places = sol._load(conn)
    rodent = rodent.merge(pd.DataFrame(conn.execute(
        "select id, source_id from incidents where city='boston' and category='rodent'").fetchall(),
        columns=["id", "source_id"]), on="id", how="left")
    rec = sol.build_records(rodent, cosig, places)
    rec["cell_id"] = _assign_cells(rec)
    res = sol.fit(rec)
    stats = solution_stats(rec, res)
    rs = {r[0]: {"label": r[1], "p_return": r[2], "p_return_monitoring": r[3], "confident": r[4],
                 "alternatives": r[5], "because": r[6]}
          for r in conn.execute("select incident_id, label, p_return, p_return_monitoring, confident, "
                                "alternatives, because from record_solutions").fetchall()}
    run_id = _forecast_run(conn)
    regions, fut, cells = build_regions(conn, rec, run_id, rs, n)
    inputs = build_inputs(conn, regions, fut, rec, rs, stats, run_id)

    def solve(inp):
        if use_ai:
            out, errs = ask(inp)
            if out is not None:
                return out, "ai", []
        else:
            errs = ["ai disabled"]
        return rules(inp), "rules", errs

    with ThreadPoolExecutor(max_workers=6) as ex:
        results = list(ex.map(solve, inputs))

    now = datetime.now(timezone.utc)
    rows = []
    for inp, (out, source, errs) in zip(inputs, results):
        out = link_places(out, inp.get("locations", []))
        text = json.dumps(inp, default=str, sort_keys=True)
        rows.append((inp["region"]["region_id"], run_id, inp["region"]["rank"], inp["region"]["cell_ids"],
                     out["action"], out["lane"], out["because"], json.dumps(out.get("cites", [])),
                     json.dumps(out.get("records", [])), json.dumps(out.get("unknowns", [])),
                     out.get("rule_id"), source, LLM_MODEL if source == "ai" else None,
                     hashlib.sha256(text.encode()).hexdigest()[:16], text, json.dumps(errs), CAVEAT, now,
                     json.dumps(inp.get("locations", []))))
    write_cell_severity(conn, cells, run_id, now)
    with conn.cursor() as cur:
        cur.execute("delete from region_solutions")
        cur.executemany(
            """
            insert into region_solutions (region_id, forecast_run_id, rank, cell_ids, action, lane, because, cites,
                records, unknowns, rule_id, source, llm_model, input_hash, input, guard_errors, caveat, computed_at,
                locations)
            values (%s,%s,%s,%s,%s,%s,%s,%s::jsonb,%s::jsonb,%s::jsonb,%s,%s,%s,%s,%s::jsonb,%s::jsonb,%s,%s,%s::jsonb)
            """, rows)
    return {"forecast_run_id": run_id, "regions": len(rows),
            "sources": pd.Series([s for _, s, _ in results]).value_counts().to_dict(),
            "top": [(r[2], r[0], r[5], r[4]) for r in rows[:5]]}


__all__ = ["build_regions", "solution_stats", "build_inputs", "check", "rules", "region_solution"]
