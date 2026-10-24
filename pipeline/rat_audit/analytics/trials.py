"""Seeded matched-pair trial design and arm estimates; no intervention is performed."""
from __future__ import annotations

import hashlib
from collections import defaultdict

import numpy as np

from .outcomes import rate

INTERVENTIONS = {"sealed_containers", "joint_block_visit", "exclusion_inspection", "bwsc_referral"}
MEASURE = "returns within 60 days, treatment vs comparison"


def design(candidates, n, intervention, seed):
    if isinstance(n, bool) or not isinstance(n, int) or not 1 <= n <= 100:
        raise ValueError("n must be 1–100 pairs")
    if intervention not in INTERVENTIONS:
        raise ValueError("intervention must be in the sanitation, exclusion or referral lane")
    if isinstance(seed, bool) or not isinstance(seed, int):
        raise ValueError("seed must be an integer")
    eligible = [s for s in candidates if s.get("due") and not s.get("open_trial") and not s.get("retired")]
    if len({s["id"] for s in eligible}) != len(eligible):
        raise ValueError("duplicate candidate site")
    counts = sorted(s["trash_tickets_12mo"] for s in eligible)
    # Discrete percentile thresholds keep equal counts in the same matching stratum.
    cuts = [counts[max(0, int(np.ceil(len(counts)*q))-1)] if counts else 0 for q in (1/3, 2/3)]
    strata = defaultdict(list)
    digest = lambda value: hashlib.md5(f"{seed}:{value}".encode()).hexdigest()
    for s in eligible:
        tercile = 1 + int(s["trash_tickets_12mo"] > cuts[0]) + int(s["trash_tickets_12mo"] > cuts[1])
        key = (s.get("neighborhood") or "Unknown", s["prior_returns_bucket"], tercile)
        strata[key].append(s)
    pairs = []
    for key, sites in sorted(strata.items()):
        sites.sort(key=lambda s: (digest(s["id"]), s["id"]))
        for i in range(0, len(sites)-1, 2):
            a,b = sites[i:i+2]
            pair_key = a["id"] + ":" + b["id"]
            if int(digest("arm:"+pair_key)[0],16) % 2:
                a,b=b,a
            pairs.append({"treatment_site":a["id"],"comparison_site":b["id"],
                          "match_keys":{"neighborhood":key[0],"prior_returns_bucket":key[1],"trash_ticket_tercile":key[2]},
                          "order":digest("pair:"+pair_key)})
    pairs.sort(key=lambda p: (p["order"],p["treatment_site"],p["comparison_site"]))
    if len(pairs) < n:
        raise ValueError(f"only {len(pairs)} matched pairs available; requested {n}")
    return {"n":n,"intervention":intervention,"seed":seed,"measure":MEASURE,"window_days":60,
            "pairs":[{k:v for k,v in p.items() if k!='order'} for p in pairs[:n]]}


def result(treatment, comparison, mature):
    if not mature:
        return {"status":"pending","window_days":60,"measure":MEASURE}
    return {"status":"complete","measure":MEASURE,
            "treatment":rate(sum(treatment),len(treatment)),"comparison":rate(sum(comparison),len(comparison)),
            "caveat":"This trial's observed report returns; field implementation and adherence must be verified."}
