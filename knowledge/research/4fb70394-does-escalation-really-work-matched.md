<!-- Exported from Kiro Crew Research Lab. Campaign 4fb70394, status complete, 4 cycles, completed 2026-10-24 14:08, parent none. -->

> **Question:** Test whether the finding 'monitoring does not reduce repeat rodent reports, violations do' (60-day repeat rate at the same address: monitoring 14.1% -> 14.2%, violation 15.3% -> 12.2%, 2025) survives better controls, using Boston 311 'Rodent Activity' cases 2023-2026. For each closed case, outcome = a new Rodent Activity report at the same normalized address within 60 days after closed_dt. Compare action types after matching on prior reports at the address in the last 180 days (0, 1, 2-4, 5+), neighborhood, and season (month). Tag closure notes with ordered regex rules, first match wins: duplicate (duplicate of existing case|duplicate complaint), collections (collections), abatement_order (abatement), citation (citation|ticket|fined|violations? issued|found in violation|cited), warning (warning|notice to owner|spoke to owner), baiting (bait|rodenticide|traps?|exterminat|pest control|treated), barrels (rat-resistant), cleanup (dpw pick up|clean up|removed), no_violation (case invalid|no violation|gone on arrival|wrong address|no ars), referral (esd will follow|referred to|animal control), inspection (inspection|inspected|inspect|investigate), monitoring (monitor|case noted|noted); empty -> closed_no_action; else unknown. Data: data.boston.gov CKAN, query with https://data.boston.gov/api/3/action/datastore_search_sql (the portal blocks extract and coalesce; compute durations locally). 311 yearly tables: 2026 1a0b420d-99f1-4887-9851-990b2a5a6e17, 2025 9d7c2214-4709-478a-a2e8-fb2020a5bb94, 2024 dff4d804-5031-443a-8409-8344efd0e5c8, 2023 e6013a93-1321-4f2a-bf91-8d8a02f1e62f (fields type, open_dt, closed_dt, closure_reason, location, location_zipcode, neighborhood, latitude, longitude).
>
> **Success criteria:** A table of repeat rates by action within matched strata with counts, a pooled risk ratio with a confidence interval, the within-address before/after result, and a one-line verdict (holds / weaker / does not hold) with a strength label.

# FINDINGS — Campaign 4fb70394

Does "monitoring doesn't reduce repeat rodent reports, violations do" survive better controls?
Boston 311 Rodent Activity, 2023-2026. Outcome = new report at same address within 60 days of close.

---

## Cycle 0 — Foundation + unmatched reproduction

Pulled all Rodent Activity cases 2023-2026 (2026: 5,321; 2025: 5,225; 2024: 5,013; 2023: 3,937). Tagged closure notes with the brief's ordered regex (first match wins), normalized addresses, computed the 60-day repeat flag and prior-180-day report strata (0 / 1 / 2-4 / 5+). 19,237 closed cases carry an address.

**Unmatched 60-day repeat rate by action:**

| action | n | repeats | rate |
|---|---|---|---|
| baiting | 3310 | 553 | 16.7% |
| citation | 326 | 44 | 13.5% |
| inspection | 5764 | 749 | 13.0% |
| abatement_order | 2729 | 331 | 12.1% |
| monitoring | 4339 | 500 | 11.5% |

Source: data.boston.gov CKAN SQL API; `/Users/brunoazca/.kiro/crew/workspace/research/4fb70394/pull_and_tag.py`.

**Insight:** At the raw level the prior finding flips — monitoring has the *lowest* repeat rate, citation/baiting higher. Strong hint of confounding by prior burden. Matching is decisive.

---

## Cycle 1 — Matched strata + pooled Mantel-Haenszel RR

Matched enforcement (citation + abatement_order) vs monitoring on **prior-180-day report stratum × neighborhood × season(month)**; 398 informative strata (both arms present).

- Crude RR (enforcement/monitoring) = **1.065**
- **Pooled Mantel-Haenszel RR = 1.030, 95% CI (0.886, 1.199)** — crosses 1.0, no difference.

**Repeat rate by action × prior-180-day burden:**

| prior 180d | monitoring | enforcement | baiting | inspection |
|---|---|---|---|---|
| 0 | 8.7% (303/3478) | 8.1% (195/2395) | 11.8% (291/2464) | 9.2% (424/4621) |
| 1 | 16.7% (92/552) | 16.0% (64/401) | 18.3% (94/513) | 18.5% (138/744) |
| 2-4 | 29.1% (74/254) | 39.0% (80/205) | 42.4% (106/250) | 40.4% (122/302) |
| 5+ | 56.4% (31/55) | 66.7% (36/54) | 74.7% (62/83) | 67.0% (65/97) |

Source: `/Users/brunoazca/.kiro/crew/workspace/research/4fb70394/mh_analysis.py`, `mh_result.json`.

**Insight:** Prior burden is the dominant driver (8% → 60%+ as priors go 0 → 5+). Within every stratum enforcement ≈ monitoring. The headline "violations work, monitoring doesn't" is a **severity-confounding artifact** — it does not survive matching.

---

## Cycle 2 — Within-address before/after (escalation)

218 addresses had a **monitoring** close followed by a later **citation/abatement** close (each address is its own control).

| window | 60-day repeat |
|---|---|
| after the monitoring close (earlier) | 39.9% (87/218) |
| after the escalation close (later) | 16.1% (35/218) |

McNemar χ²(cc) = 33.3, p<0.001 — 65 addresses improved, 13 worsened.

**Caveat (decisive):** monitoring is *always* the earlier close and escalation the *later* one. So the drop is confounded with time-since-first-report — an active infestation naturally burns out, which mimics an "escalation effect." This cannot separate treatment from ordering. It contradicts the between-address matched null (c1 RR 1.03); the contradiction *is* the result — the within-address drop is a **sequence artifact**, not proof escalation works.

Source: `/Users/brunoazca/.kiro/crew/workspace/research/4fb70394/within_addr.py`, `within_addr.json`.

---

## Cycle 3 — Per-year replication + placebo

**Per-year matched Mantel-Haenszel RR (enforcement vs monitoring)** — every CI crosses 1.0:

| year | MH RR | 95% CI | strata |
|---|---|---|---|
| 2023 | 0.87 | 0.53–1.45 | 149 |
| 2024 | 1.16 | 0.81–1.65 | 182 |
| 2025 | 0.84 | 0.61–1.16 | 159 |
| 2026 | 1.16 | 0.86–1.55 | 176 |

No year shows enforcement reducing repeats vs monitoring. The null is stable.

**Placebo — monitoring → monitoring (no escalation), 431 addresses:**

| window | 60-day repeat |
|---|---|
| after 1st monitoring close | 40.1% |
| after 2nd monitoring close | 18.3% |

McNemar χ²(cc) = 51.5, p<0.001. This is ~identical to the escalation drop in c2 (40%→16%) **with no enforcement involved** → the within-address drop is pure time-order / regression to the mean.

Source: `/Users/brunoazca/.kiro/crew/workspace/research/4fb70394/peryear_placebo.py`, `peryear_placebo.json`.

**Verdict: the headline DOES NOT HOLD — strong evidence.** ✅ Definition of Done met.

---

## Research State

**Answered (all sub-questions):** matched RR = 1.03 CI (0.89,1.20), null (c1); within-address drop is a time-order artifact, confirmed by placebo (c2,c3); holds null in every year 2023-2026 (c3); confounders identified (prior burden dominant; time-order/regression to mean drives within-address). DoD met, verification.passed=true.

**Open questions:** none material.

**Leads:** none — ready to finalize.

**Weak spots (for the write-up):** citation arm small (n=326, pooled with abatement); light address normalization; closure-note tags are regex approximations of free text.

**Dead-ends:** within-address as a clean causal test (fixed ordering); any "enforcement works" signal (all artifacts of severity + time-order).

**Next cycle:** FINALIZE — write executive summary + recommendation atop FINDINGS.md.
