# Data audit — Rat Audit Boston

Every candidate dataset was tested on live data on **Oct 24, 2026**: Analyze Boston (CKAN), NOAA ACIS (Logan USW00014739), MLB Stats API, CDC PLACES, iNaturalist, Somerville Socrata. This file is the record of what was tested, how, what came out, and what changed in the spec. Scripts and raw outputs: `knowledge/sources/rats/validation/` (`*_results.txt`). Longer write-up: `knowledge/19_rat_data_validation.md`. Research narrative: `docs/rat-audit/data-research.md`.

**Status:** the requirement and task changes in §7 were **applied** to `requirements.md`, `tasks.md` and `design.md` on Oct 24.

## 1. Method

| Test family | Unit | Outcome | Controls | Datasets |
|---|---|---|---|---|
| Grid | 1/400° cell (~280 m × 205 m); 1,319 lived-in cells (≥ 50 non-rodent 311 reports and ≥ 20 addresses in 2024) | 311 Rodent Activity | non-rodent 311 volume, address count | all location datasets |
| Time | day / week / month, Jan 2023 – Oct 22, 2026 (19,466 rodent reports) | daily count / same-weekday-same-month mean | season, trend, weekday | weather, permits, events, games, holidays, move-out |
| Event study | 200 m radius, 90 days before vs after | rodent reports | roof permits as control sites | demolitions |
| Tract | 167 tracts (pop ≥ 500), 2024–26 | rodent reports per 1,000 residents | non-rodent 311 per resident | SVI, displacement risk, CDC asthma, iNaturalist |

Grid statistics are partial Spearman correlations:
- **raw:** feature vs 2024 rodent reports.
- **assoc:** controlling for volume and addresses.
- **predict:** feature vs 2025–26 rodent reports, also controlling for 2024 rodent reports.

With n = 1,319, |ρ| ≥ 0.06 is significant. **Placebo** (abandoned vehicles): assoc +0.07, predict +0.01. Judge mainly on *predict*.

Fire test (earlier, ZIP level, 25 ZIPs, 2023–24): `knowledge/sources/rats/fire_rats.py`.

## 2. Grid results

| Feature | Total | Cells | raw | assoc | predict |
|---|---|---|---|---|---|
| 311 Pest Infestation - Residential | 1,915 | 673 | +0.46 | +0.26 | +0.11 |
| 311 Pick up Dead Animal | 7,827 | 1,203 | +0.49 | +0.26 | +0.14 |
| Code enforcement: improper trash, residential | 39,488 | 1,162 | +0.52 | +0.17 | +0.09 |
| 311 Improper Storage of Trash (2024) | 20,221 | 1,130 | +0.50 | +0.14 | +0.03 |
| 311 new: Improper Trash Storage | 3,444 | 719 | +0.45 | +0.13 | +0.18 |
| 311 Missed Trash | 9,987 | 1,180 | +0.31 | +0.13 | −0.01 |
| RentSmart properties (density) | 100,548 | 1,211 | +0.42 | +0.12 | +0.06 |
| Code enforcement: illegal dumping < 1 yd | 2,011 | 550 | +0.32 | +0.10 | +0.04 |
| Code enforcement: overgrown weeds | 4,984 | 842 | +0.22 | +0.09 | −0.01 |
| 311 new: Overflowing Trash | 1,992 | 529 | +0.37 | +0.09 | +0.09 |
| 311 new: Trash Placed Out Early | 3,034 | 424 | +0.37 | +0.08 | +0.09 |
| Park features | 1,279 | 250 | +0.15 | +0.08 | +0.05 |
| 311 new: Overgrown Weeds | 1,133 | 467 | +0.16 | +0.07 | +0.10 |
| Code enforcement: overfilled barrel/dumpster | 12,689 | 926 | +0.41 | +0.07 | +0.04 |
| **Placebo: abandoned vehicles** | 4,620 | 1,013 | +0.21 | +0.07 | +0.01 |
| Code enforcement: dumpster without permit | 300 | 115 | +0.21 | +0.05 | +0.06 |
| 311 Construction Debris | 188 | 148 | +0.19 | +0.05 | +0.05 |
| Public schools | 117 | 101 | +0.09 | +0.05 | +0.09 |
| 311 new: Student Move-In trash | 270 | 144 | +0.24 | +0.04 | +0.13 |
| 311 Illegal Dumping | 2,920 | 827 | +0.35 | +0.04 | +0.06 |
| 311 Empty Litter Basket | 2,464 | 541 | +0.32 | +0.03 | +0.04 |
| New construction permits 2023–25 | 1,536 | 557 | +0.12 | +0.03 | +0.04 |
| 311 Abandoned Building | 75 | 59 | +0.07 | +0.03 | −0.01 |
| 311 new: Litter & Debris | 10,013 | 1,114 | +0.40 | +0.02 | +0.09 |
| 311 Overflowing Dumpster | 90 | 70 | +0.11 | +0.02 | −0.03 |
| iNaturalist rat observations | 215 | 133 | +0.09 | +0.02 | +0.06 |
| City-owned lots | 1,016 | 308 | +0.05 | +0.01 | −0.03 |
| Demolition permits (RAZE, EXTDEM) 2023–25 | 416 | 319 | +0.09 | +0.01 | −0.02 |
| 311 Trash on Vacant Lot | 66 | 51 | +0.05 | +0.01 | −0.05 |
| Street trees | 48,493 | 1,270 | +0.23 | 0.00 | +0.09 |
| One-day entertainment licenses | 6,971 | 476 | +0.18 | −0.01 | −0.02 |
| Code enforcement: improper trash, commercial | 5,426 | 547 | +0.25 | −0.01 | −0.01 |
| Big Belly bins | 508 | 151 | +0.19 | −0.01 | 0.00 |
| Colleges | 42 | 32 | 0.00 | −0.04 | −0.02 |
| Food trucks | 96 | 15 | −0.02 | −0.04 | −0.01 |
| One-day alcohol licenses | 1,777 | 230 | +0.07 | −0.04 | −0.04 |
| Restaurant rodent citations 2024 | 1,614 | 236 | +0.14 | −0.04 | 0.00 |
| 311 Unsanitary Conditions - Establishment | 516 | 249 | +0.12 | −0.04 | 0.00 |
| Liquor licenses | 1,277 | 405 | +0.17 | −0.09 | +0.03 |
| Entertainment licenses | 1,073 | 314 | +0.15 | −0.09 | +0.01 |
| Active food licenses | 2,772 | 507 | +0.15 | −0.10 | +0.05 |
| Last year's rodent reports (baseline) | 4,842 | — | — | — | **+0.32** |

**Trash day** (mean rodent residual, rank units, se ≈ 20): Mon +7, Tue +12, Wed −32, Thu +2, Fri +39, Mon+Thu +72, Tue+Fri −33, Mon+Fri −145. There's no single-day effect.

## 3. Time results

| Test | Result | Verdict |
|---|---|---|
| Rain ≥ 1 in, days 1–7 (37 events) | 1.008 vs 1.007 random, p = 0.49 | none |
| Rain ≥ 1 in, days 8–14 | 0.988 vs 1.004, p = 0.78 | none |
| Rain 0.5–1 in, days 1–7 (61 events) | 0.999 vs 1.004, p = 0.60 | none |
| Weekly residual vs same / previous week rain | r = −0.03 / −0.02 (197 weeks) | none |
| Monthly reports vs mean high temperature | **r = +0.87** (45 months); previous month +0.82 | strong |
| Reports per day by month | Jan 7.2, Feb 6.3, Mar 9.4, Apr 11.5, May 14.4, Jun 18.2, Jul 20.6, Aug 22.3, Sep 20.0, Oct 14.5, Nov 10.6, Dec 8.3 | strong season |
| Hot-day anomaly → next 3 days | r = +0.08 | weak |
| Mild winter → spring | 4 winters only | not testable |
| Snow ≥ 4 in, days 7–21 (6 events) | 0.95 vs 0.92, p = 0.32 | none |
| Demolitions (396), 200 m, ±90 days | 863 → 875 (×1.01); roof control 4,289 → 5,282 (×1.23); difference-in-differences ×0.82 | no spike |
| Move-out Sep/Jul, student ZIPs vs rest | 2023 1.17 vs 0.80; 2024 1.11 vs 0.87; 2025 0.99 vs 0.95 | weak-moderate |
| Move-out 3 weeks after / before Sept 1 | student 0.84, 1.01, 0.95 vs rest 0.97, 0.96, 0.86 | none in short window |
| Fenway home games (1 km), share of city reports | 4.01% after ≥ 5 games vs 4.12% after ≤ 1 | none |
| Holiday pickup-delay weeks (28) | rodent 0.98, p = 0.93; improper-trash reports +10% | rodent none |
| Electrical fires vs rodent (ZIP, 2023–24) | +0.30 raw, −0.08 controlling fire-call volume; 2026 check +0.17 | none |

## 4. Tract results

| Variable | raw | controlling 311 volume |
|---|---|---|
| Children share | −0.30 | −0.24 |
| People of color share | −0.35 | −0.23 |
| Disability share | −0.25 | −0.18 |
| Displacement risk (147 tracts) | −0.23 | −0.14 |
| Low or no income share | −0.11 | +0.06 |
| Limited English share | −0.12 | +0.02 |
| Older adult share | +0.03 | −0.06 |
| Adult asthma, CDC PLACES (147 tracts) | −0.41 | −0.24 (−0.29 also controlling income) |
| iNaturalist vs 311 rodent rate | +0.12 | — |

311 rodent reports per resident are lower where vulnerable residents live. Either 311 under-counts those areas or they have fewer rats.

## 5. Impact checks

| Check | Result |
|---|---|
| Checkbook pest-control payments | FY2026 ≈ $776K; BPS $611K (lower bound, vendor-name match) |
| Schools near hot spots | 66 of 134 schools (49%) in or next to a top-10% rodent cell (≥ 25 reports 2024–26), vs 35% of lived-in cells |
| Employee earnings | Titles don't identify rodent staff (one ISD "Prin Environment Health Insp", $114,595) |
| Somerville 311 | 8,770 "Rats" requests plus Rodent Assistance Program requests |
| Inside Airbnb | 212 of 267,731 reviews mention rats or mice (0.08%), from doc 15 |
| Zillow | ZIP ρ −0.18 (value), +0.30 (rent), weak and confounded, from doc 15 |

## 6. Verdict per dataset

| Dataset | Verdict | Why |
|---|---|---|
| 311 yearly 2023–26 | **Core** | outcome; last-year lag +0.32; dead animal +0.14, indoor pest +0.11 |
| 311 new system (Aug 2025+) | **Core** | improper storage +0.18, move-in +0.13, weeds +0.10, overflowing / out early / litter +0.09 |
| Code enforcement violations `90ed3816…` | **Core (new)** | residential trash tickets +0.17 / +0.09; inspector-issued |
| NOAA daily (temperature) | **Core** | season r = +0.87; rain and snow dropped |
| Checkbook | **Core (impact)** | $776K / BPS $611K |
| RentSmart | Keep | owner portfolio, indoor pest; year built unreliable (94% listed 1900–1915) |
| Property assessment | Keep | building facts; pre-1920 share +0.46 (ZIP) |
| Public schools | Keep (impact) | 49% vs 35% near hot spots |
| Climate Ready SVI | Keep (equity) | under-reporting signal |
| Somerville / Cambridge 311 | Keep (P1) | data exists |
| Food inspections | Cost only | not a predictor (−0.04 / 0.00) |
| Inside Airbnb, OpenAlex | Context | small impact, citations |
| Trash schedules | Control only | no trash-day effect |
| Trees and land cover | Context | 0.00 / +0.09 |
| Building permits (demolition) | Story only | no spike; pre-demolition baiting rule |
| Public Works work zones | Drop | 460 rows, no history, no coordinates |
| Rainfall data (Analyze Boston) | Drop | link to a BWSC page, not data |
| Big Belly | Drop | −0.01 / 0.00 |
| Food / liquor / entertainment licenses | Drop | −0.10 / −0.09 / −0.09 |
| One-day alcohol and entertainment licenses | Drop | −0.04 / −0.01 |
| Red Sox home games | Drop | 4.01% vs 4.12% |
| Holiday delays | Drop | rodent p = 0.93 |
| Colleges (points) | Drop | −0.04; use 311 move-in instead |
| City-owned lots | Drop | +0.01 / −0.03 |
| Food trucks, park and dog features | Drop | too few / weak |
| iNaturalist | Drop as signal | 544 obs; +0.12 with 311 |
| CDC asthma | Drop as impact | negative (−0.29) |
| Displacement risk | Drop | −0.14 |
| Fire incidents | Drop | −0.08 after controls; no cause or coordinates |
| Employee earnings | Drop | no rodent titles |
| Snow routes, flood layers | Drop | snow and rain null |
| Census ACS | Blocked | API failed 3×; SVI covers it |
| Street sweeping, sidewalks | Not tested | no coordinates in CSV |
| Sewers, gardens/compost, raptor poisoning | Not tested | no public dataset |
| Zillow, Yelp/Google, COVID 2020 | Drop | confounded / no data / not actionable |

## 7. Spec changes applied (Oct 24)

| Where | Change |
|---|---|
| R1.7 / task 1.6 | Public Works work zones → **code enforcement violations** (trash storage, overfilling, dumping, weeds) |
| R1.9 / task 1.7 | Weather = temperature (season); events = Sept 1 move-out only. Dropped one-day licenses, Red Sox games, holiday delays, rain/snow events |
| R1.10 / task 1.8 | Asthma and iNaturalist kept as context only, with caveats |
| R2.3 | Displacement layer group without work zones; Context group without asthma |
| R2.7 | Timeline event marks: move-out and temperature (no rain or games) |
| R3.11 (new) | Equity view: rank within neighborhood + low-reporting tract flag; caveat that 311 counts are not rat counts |
| R5.2 | Adds dead animal and indoor pest as leading signals |
| R5.3 / task 2.9 | Findings use the tested results, including honest nulls; "asthma by tract" replaced by "311 under-reporting by tract" |
| R6.4 / task 2.10 | Live NWS rain removed; future weeks use temperature climatology |
| R7.6 (new) | Schools near hot spots + BPS pest spending |
| design §4–5 | Pre-tested results and the tested feature set |
