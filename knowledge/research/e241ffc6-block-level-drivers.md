<!-- Exported from Kiro Crew Research Lab. Campaign e241ffc6, status complete, 6 cycles, completed 2026-10-24 12:36, parent none. -->

> **Question:** Test at block level (about a 100 m grid) which factors are most associated with Boston 311 'Rodent Activity' reports in 2025. At ZIP level we found improper trash storage reports correlate +0.78 with rodent reports, illegal dumping +0.63, restaurant rodent citations +0.41, missed pickups +0.14 (Spearman over 25 ZIPs, per 1,000 property records). Check whether this holds per block, controlling for housing density (property assessment FY2026 rows, resource ee73430d-96c0-423e-ad21-c4cfb54c8961) and total 311 reporting volume on the block. Data is on data.boston.gov CKAN; query with https://data.boston.gov/api/3/action/datastore_search_sql (the portal blocks the SQL functions extract and coalesce, so compute durations locally). 311 yearly tables: 2026 resource 1a0b420d-99f1-4887-9851-990b2a5a6e17, 2025 resource 9d7c2214-4709-478a-a2e8-fb2020a5bb94 (fields type, open_dt, closed_dt, closure_reason, location, location_zipcode, latitude, longitude). Food inspections: resource 4582bec6-2b4f-4f9e-bc55-cbaa73117f4c (violdesc, comments, address).
>
> **Success criteria:** A table of each factor's block-level association with rodent reports, with sample sizes and the controls used, plus one short paragraph per factor saying whether the ZIP-level result holds.

# FINDINGS — Campaign e241ffc6

Block-level (~100m) drivers of Boston 311 Rodent Activity, 2025.

---

## Executive summary & recommendation

**Question:** at ~100 m block scale, which factors are most associated with 2025 Boston 311 rodent reports, controlling for housing density and total reporting volume — and does the ZIP-level ranking survive?

**Answer in one line:** the ZIP-level correlations mostly *shrink to near-zero at block level because they were driven by reporting intensity, not geography* — improper trash storage is the only factor with a real (if modest) block-level link to rats.

**Definition-of-Done table** — 8,913 blocks, 2,337 with a rodent report; controls = total 311 volume per block and housing density (RES_UNITS/ZIP).

| Factor | Sample | ZIP ρ | Block ρ (raw) | Block ρ (net of volume) | Does ZIP result hold? |
|---|---|---|---|---|---|
| Improper trash storage | 3,474 blocks | 0.78 | 0.361 | **0.127** | **Yes** — top rank, only real driver |
| Illegal dumping | 1,847 blocks | 0.63 | 0.262 | 0.101 | Yes — 2nd rank, weaker |
| Missed pickup | 3,954 blocks | 0.14 | 0.188 | 0.049 | Partly — low rank holds, near noise |
| Restaurant citation | 477 blocks | 0.41 | 0.117 | 0.034 | **No** — was commercial clustering |
| Demolition / new construction | 561 permits | — | after/before **1.02** (247↑ vs 196↓) | — | Weak positive (local displacement) |
| Big Belly sealed bins | 1,060 near / 5,621 matched | — | 1.81 vs 1.97 rodent/100 reports | — | Weak **protective** (~8% lower) |
| Heavy rain (week after) | 12 heavy / 250 dry days | — | ratio 1.03; lag ρ ≈ 0 | — | **No effect** |

**Per-factor read.** *Improper trash storage* — holds best; rank, sign, and a non-trivial residual (0.13) all survive the controls. The one lever worth acting on. *Illegal dumping* — holds, second, weaker. *Missed pickup* — low rank holds but collapses to noise net of volume. *Restaurant citations* — do **not** hold; the strong ZIP tie was restaurants clustering in commercial ZIPs, not a block driver. *Demolition* — a small, real local bump (digging displaces rats ~2%), not a top driver. *Big Belly bins* — look bad raw (they sit in busy blocks) but are weakly protective once volume is normalized. *Rain* — no effect at any 0–7 day lag.

**The headline caveat:** total reporting volume is the dominant confound in every spatial comparison here. Housing density is *not* a confound. Any future block-level rat model must divide out reporting intensity first, or it will rediscover these inflated ZIP correlations.

**Recommendation:** target **improper trash-storage** enforcement at the block level — it is the only factor with a genuine block-scale link to rodents. Sealed bins (Big Belly) are a plausible, if small, mitigation. De-prioritize weather and construction timing as predictors; they add little. Build any predictive index on *volume-normalized* rates, not raw counts.

_Status: all 4 sub-questions answered; Definition of Done met (cycle 5 of 10). Research complete._

---

## Cycle 0 — Does the ZIP ranking hold per block? (sub-question 1)

**Method.** Pulled all 2025 reports with coordinates for the four 311 types from resource `9d7c2214-4709-478a-a2e8-fb2020a5bb94` and binned them to a ~100 m grid (0.0009° lat × 0.0012° lon). Universe = 8,913 blocks with any 311 activity; 2,337 have ≥1 rodent report. Spearman over block counts, then partial Spearman controlling for **total 311 volume** on the block.

| Factor | ZIP-level ρ | Block ρ (raw) | Block ρ (net of total volume) |
|---|---|---|---|
| Improper trash storage | 0.78 | **0.361** | **0.128** |
| Illegal dumping | 0.63 | 0.262 | 0.099 |
| Missed pickup | 0.14 | 0.188 | 0.047 |
**Read.** The *order* survives (trash > dumping > missed). The *strength* does not: block ρ is roughly half the ZIP ρ, and once you control for how much a block reports overall, almost all of it disappears.

---

## Cycle 1 — Sub-question 1 CLOSED: restaurant citations + housing-density control

Added the 4th factor (restaurant rodent/pest citations, 2,405 rows from food-inspections `4582bec6-...`, binned by its `location` point) and a **housing-density control** (`RES_UNITS` summed per ZIP from property `ee73430d-...`, attached to each block via its modal 311 ZIP — the property table has no coordinates, ZIP is the only shared key). Partial Spearman now runs against total volume, against density, and against both.

**Block-level association table (n = 8,913 blocks; 2,337 with a rodent report)**

| Factor | blocks w/ factor | ZIP ρ | Block ρ (raw) | ρ \| volume | ρ \| density | ρ \| both |
|---|---|---|---|---|---|---|
| Improper trash storage | 3,474 | 0.78 | **0.361** | 0.128 | 0.338 | **0.127** |
| Illegal dumping | 1,847 | 0.63 | 0.262 | 0.099 | 0.251 | 0.101 |
| Missed pickup | 3,954 | 0.14 | 0.188 | 0.047 | 0.182 | 0.049 |
| Restaurant citation | 477 | 0.41 | 0.117 | 0.033 | 0.110 | 0.034 |

Controls: total 311 volume per block; housing density = RES_UNITS per ZIP (block's modal ZIP).

**Read, per factor.**
- **Improper trash storage** — holds best. Order and sign match ZIP, raw block ρ 0.36. Density is not a confound (ρ|density 0.34 ≈ raw). Net of volume it is still the strongest residual factor (0.13), so it is the one real block-level signal.
- **Illegal dumping** — holds, weaker. Raw 0.26, keeps 0.10 net of volume+density. Second-strongest, matching ZIP rank.
- **Missed pickup** — holds its low rank. Raw 0.19, collapses to ~0.05 net of volume. At ZIP it was already the weakest (0.14); at block it is near noise once volume is controlled.
- **Restaurant citation** — does **not** hold. ZIP ρ 0.41 drops to block raw 0.12 and ~0.03 net of volume. Citations sit in ~477 commercial blocks; the ZIP signal was commercial-district clustering, not a block-level rat driver.

**Bottom line for sub-q 1:** the ZIP *ranking* survives for the three sanitation factors (trash > dumping > missed) but restaurant citations fall out of rank. All magnitudes shrink at block scale, and net of total reporting volume every factor is weak (≤0.13). Housing density is not the confound — reporting intensity is.

Sources: 311 2025 `9d7c2214-4709-478a-a2e8-fb2020a5bb94`; food inspections `4582bec6-2b4f-4f9e-bc55-cbaa73117f4c`; property FY2026 `ee73430d-96c0-423e-ad21-c4cfb54c8961`.

---

## Cycle 2 — Demolition / new construction → rodents (sub-question 2)

**Design.** Before/after around each permit. Took all 2025 permits with `worktype` = EXTDEM/INTDEM or `permittypedescr` = Erect/New Construction / Foundation (561 permits with coordinates + issue date, from Approved Building Permits `6ddcd912-...`). For each, counted Rodent Activity reports within **300 m** (haversine) in the **90 days before** vs the **90 days after** the issue date.

| Measure | Before | After |
|---|---|---|
| Rodent reports within 300 m / 90 d (total over 561 permits) | 3,073 | 3,130 |
| After ÷ before ratio | — | **1.02** |
| Permits where after > before | — | 247 |
| Permits where after < before | — | 196 |
| Permits no change | — | 118 |

**Read.** A small, directionally-consistent rise. Reports go up 1.9% after a dig, and among permits that moved, more rose (247) than fell (196) — a 56/44 split. So the "digging displaces rats" effect is real but **weak at city scale**: nothing like a doubling, just a nudge. It would matter for an individual site, not as a top-line driver of block rodent counts.

Sources: Approved Building Permits `6ddcd912-32a0-43df-9908-63574f8c7e77`; 311 2025 `9d7c2214-4709-478a-a2e8-fb2020a5bb94`.

---

## Cycle 3 — Big Belly sealed bins (sub-question 3)

**Design.** Blocks within a Big Belly bin's cell or its 8 neighbors = "near" (526 bins, `Location` point from Big Belly Locations `15e7fa44-...`); all other 311-active blocks = "far". The trap: bins go in busy places, so raw counts mislead. The honest metric is **rodent reports per 100 total 311 reports** (removes the busy-block confound), plus a volume-matched far group.

| Group | blocks | mean rodent / block | mean total volume | rodent per 100 reports |
|---|---|---|---|---|
| Near a bin | 1,060 | 1.46 | 80.6 | **1.81** |
| Far — all | 7,853 | 0.47 | 24.1 | 1.94 |
| Far — volume-matched | 5,621 | 0.60 | 30.2 | 1.97 |

**Read.** Naively, bins look *bad* — 3× more rodent reports per block. That is backwards: bins sit in high-traffic, high-reporting blocks (volume 80.6 vs 24.1). Once you divide out reporting volume, near-bin blocks have **fewer** rodent reports per unit of activity: 1.81 vs 1.94–1.97, roughly **7–8% lower**. So Big Belly blocks show a weak **protective** association — consistent with the sealed-bin idea, but small and observational (placement is non-random, so this is not proof the bins cause the drop).

Sources: Big Belly Locations `15e7fa44-b9a8-42da-82e1-304e43460095`; 311 2025 `9d7c2214-4709-478a-a2e8-fb2020a5bb94`.

---

## Cycle 4 — Heavy rain → rodents a week later (sub-question 4)

**Design.** Daily precipitation for Boston Logan (NOAA GHCN-Daily station `USW00014739`) vs daily 311 rodent-report counts, 2025. Heavy-rain day = top decile of rainy days (≥19 mm; 12 days). Compared mean daily rodent reports over the 7 days *after* heavy-rain days vs after dry days, and Pearson lag correlation of rain vs rodent reports 0–7 days later.

| Measure | Value |
|---|---|
| Rodent reports/day, week after heavy rain | 15.21 |
| Rodent reports/day, week after dry day | 14.78 |
| Overall daily mean | 14.32 |
| Heavy ÷ dry ratio | 1.03 |
| Lag correlations (rain → rodents, lags 0–7 d) | all ≈ 0 (−0.06 … +0.02) |

**Read.** No effect. The week-after-rain bump is 2.9% and sits inside normal day-to-day noise; every lag correlation is essentially zero. Rainfall does **not** drive 311 rodent reports in Boston 2025. Clean negative — the last sub-question closes.

Sources: NOAA GHCN-Daily `USW00014739`; 311 2025 `9d7c2214-4709-478a-a2e8-fb2020a5bb94`.

---

## Research State

**Answered:** ALL FOUR sub-questions.
- Sub-q 1 — CLOSED, full block table (trash/dumping/missed hold rank; restaurant falls out; volume is the confound, not density).
- Sub-q 2 — demolition/new-construction: weak positive, 1.02× within 300 m / 90 d.
- Sub-q 3 — Big Belly bins: weak protective (~8% lower per-volume) after removing the busy-block confound.
- Sub-q 4 — heavy rain: no effect (ratio 1.03, all lag corrs ≈ 0).

**Open:** None. Research complete; all evidence on disk.

**Next:** Cycle 5 — assemble the single consolidated **Definition-of-Done table** (every factor × association × sample size × controls) + one short paragraph per factor, and set `verification.passed = true`. Then the final cycle writes the executive summary at the top of FINDINGS.md. After the DoD passes I will write `worker_done.json` and stop early (budget is 10; work is done at 5–6).

**Dead-ends:** Property table has no coords. Restaurant citations are a ZIP artifact. Always normalize by reporting volume (it is the dominant confound in every spatial comparison here).
