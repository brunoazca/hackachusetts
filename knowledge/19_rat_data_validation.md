# Rat Audit: which datasets are really useful

Tested **October 24, 2026** against live Analyze Boston, NOAA, MLB, CDC and iNaturalist data. Every dataset on the [Rat Audit Data Plan board](https://claude.ai/artifact/6bCS5853Lo3fcDvkGqqXid) got a verdict. Scripts and raw outputs: [sources/rats/validation/](sources/rats/validation/). Builds on [27 — Rat signals brainstorm](27_rat_signals_brainstorm.md) and [15 — Boston Rat Audit](15_boston_rat_audit.md).

## 1. Headline

1. **Trash and housing signals are associated with recorded rodent reports in these tests.** Restaurants, bars, food licenses and restaurant rodent citations turn *negative* after the stated controls; this does not establish protective effects or the absence of a real-world relationship.
2. **Candidate report-prediction features:** improper trash storage (new 311 system, +0.18), dead-animal pickups (+0.14), student move-in trash (+0.13), indoor pest reports (+0.11), and residential-trash enforcement (+0.09). Prior rodent reports have +0.32. These are partial correlations, not validated forecast accuracy. New-system features beginning August 2025 overlap the 2025–2026 outcome and need prediction-time separation.
3. **No clear association was detected for rain, snow, demolitions, Fenway games or holiday weeks under these tests.** Monthly reports track temperature at r = +0.87 (August is 3.5× February), motivating a seasonal baseline to test; correlation alone does not establish a forecast or causal effect.
4. **Reporting patterns differ across tracts.** Several vulnerability indicators correlate with fewer rodent reports per resident after controls (−0.18 to −0.29). This raises a reporting-access concern, but under-reporting cannot be quantified without independent condition measurements. Raw complaint ranking may miss unmet need.

Interpretation update from the [source expansion](24_rodentops_data_and_research_catalog.md): preserve these team experiment results, but distinguish association, prospective prediction and causation. Big Belly and DND inventory metadata dates to 2016; their null or positive coefficients do not validate current inventories. This expansion did not independently rerun the experiments.

## 2. Method

**Grid tests (location datasets).** Boston split into 1/400° cells (about 280 m × 205 m). Kept 1,319 lived-in cells (≥ 50 non-rodent 311 reports and ≥ 20 trash-schedule addresses in 2024). Rank (Spearman) correlations:

- **raw:** feature vs 2024 rodent reports.
- **assoc:** same, controlling for the cell's non-rodent 311 volume and address count. This adjusts for two observed proxies; it does not remove every reporting or density-related bias.
- **predict:** feature vs 2025–26 rodent reports, also controlling for 2024 rodent reports. This asks "does the dataset add anything beyond last year's reports?"

The original analysis used |ρ| ≥ 0.06 as a significance guide for 1,319 cells. Spatial dependence and many comparisons can invalidate a simple independent-sample threshold. A **placebo** (abandoned-vehicle reports) scores +0.07 assoc and +0.01 predict; that is a useful diagnostic, not a universal noise cutoff. Validate selected features on held-out times and locations before reporting prediction skill.

**Time tests.** 19,466 rodent reports, Jan 2023 to Oct 22, 2026. Each day's count is compared with the mean for the same weekday in the same month, which removes season, trend and weekday. Event windows are compared with 500 random same-month days.

**Tract tests.** 167 tracts (population ≥ 500), rodent reports 2024–26 per 1,000 residents, controlling for 311 volume per resident.

## 3. Grid results

| Dataset · feature | Total | Cells | raw | assoc | predict |
|---|---|---|---|---|---|
| 311 Pest Infestation - Residential | 1,915 | 673 | +0.46 | **+0.26** | **+0.11** |
| 311 Pick up Dead Animal | 7,827 | 1,203 | +0.49 | **+0.26** | **+0.14** |
| Code enforcement: improper trash, residential | 39,488 | 1,162 | +0.52 | **+0.17** | **+0.09** |
| 311 Improper Storage of Trash (2024) | 20,221 | 1,130 | +0.50 | +0.14 | +0.03 |
| 311 new: Improper Trash Storage (Aug 2025+) | 3,444 | 719 | +0.45 | +0.13 | **+0.18** |
| 311 Missed Trash | 9,987 | 1,180 | +0.31 | +0.13 | −0.01 |
| Code enforcement: illegal dumping | 2,011 | 550 | +0.32 | +0.10 | +0.04 |
| Code enforcement: overgrown weeds | 4,984 | 842 | +0.22 | +0.09 | −0.01 |
| 311 new: Overflowing Trash | 1,992 | 529 | +0.37 | +0.09 | +0.09 |
| 311 new: Trash Placed Out Early | 3,034 | 424 | +0.37 | +0.08 | +0.09 |
| 311 new: Overgrown Weeds | 1,133 | 467 | +0.16 | +0.07 | +0.10 |
| Code enforcement: overfilled barrel/dumpster | 12,689 | 926 | +0.41 | +0.07 | +0.04 |
| **Placebo: abandoned vehicles** | 4,620 | 1,013 | +0.21 | +0.07 | +0.01 |
| 311 new: Student Move-In trash | 270 | 144 | +0.24 | +0.04 | **+0.13** |
| 311 Illegal Dumping | 2,920 | 827 | +0.35 | +0.04 | +0.06 |
| 311 new: Litter & Debris | 10,013 | 1,114 | +0.40 | +0.02 | +0.09 |
| Street trees | 48,493 | 1,270 | +0.23 | 0.00 | +0.09 |
| Park features | 1,279 | 250 | +0.15 | +0.08 | +0.05 |
| Schools | 117 | 101 | +0.09 | +0.05 | +0.09 |
| 311 Empty Litter Basket | 2,464 | 541 | +0.32 | +0.03 | +0.04 |
| New construction permits 2023–25 | 1,536 | 557 | +0.12 | +0.03 | +0.04 |
| iNaturalist rat observations | 215 | 133 | +0.09 | +0.02 | +0.06 |
| City-owned lots | 1,016 | 308 | +0.05 | +0.01 | −0.03 |
| Demolition permits 2023–25 | 416 | 319 | +0.09 | +0.01 | −0.02 |
| Big Belly bins | 508 | 151 | +0.19 | −0.01 | 0.00 |
| One-day entertainment / alcohol events | 6,971 / 1,777 | 476 / 230 | +0.18 / +0.07 | −0.01 / −0.04 | −0.02 / −0.04 |
| Code enforcement: improper trash, commercial | 5,426 | 547 | +0.25 | −0.01 | −0.01 |
| Restaurant rodent citations (2024) | 1,614 | 236 | +0.14 | −0.04 | 0.00 |
| 311 Unsanitary Conditions - Establishment | 516 | 249 | +0.12 | −0.04 | 0.00 |
| Colleges | 42 | 32 | 0.00 | −0.04 | −0.02 |
| Food trucks | 96 | 15 | −0.02 | −0.04 | −0.01 |
| Liquor / entertainment licenses | 1,277 / 1,073 | 405 / 314 | +0.17 / +0.15 | −0.09 / −0.09 | +0.03 / +0.01 |
| Active food licenses | 2,772 | 507 | +0.15 | **−0.10** | +0.05 |

**Trash day.** Mean rodent residual by main pickup day (rank units, standard error ≈ 20): Monday +7, Tuesday +12, Wednesday −32, Thursday +2, Friday +39. **Monday is not worse.** Twice-weekly zones are mixed (Mon+Thu +72, Mon+Fri −145, Tue+Fri −33). There's no usable single-day effect.

## 4. Time results

| Test | Result | Verdict |
|---|---|---|
| Heavy rain ≥ 1 in (37 days), next 1–7 days | observed/expected 1.008 vs 1.007 for random days, p = 0.49 | **none** |
| Moderate rain 0.5–1 in (61 days) | 0.999 vs 1.004 | none |
| Weekly reports vs previous week's rain | r = −0.02 (197 weeks) | none |
| Monthly reports vs mean daily high | **r = +0.87** (45 months); previous month +0.82 | **strong (seasonal)** |
| Hot-day anomaly vs next 3 days | r = +0.08 | weak |
| Mild winter → spring reports | 4 winters only; colder winters were followed by *more* reports (rising trend) | not testable |
| Snowfall ≥ 4 in (6 events), days 7–21 | 0.95 vs 0.92 random, p = 0.32 | none |
| Demolitions (396 sites), reports within 200 m, 90 days before → after | 863 → 875 (×1.01); roof-permit control 4,289 → 5,282 (×1.23) | **no spike**; difference-in-differences ×0.82 |
| Sept 1 move-out, Sep/Jul ratio, student ZIPs vs rest | 2023 1.17 vs 0.80 · 2024 1.11 vs 0.87 · 2025 0.99 vs 0.95 | **weak-moderate**, consistent direction |
| Fenway home games (1 km), share of city reports | 4.01% after busy home weeks vs 4.12% after quiet weeks | none |
| Holiday pickup-delay weeks | rodent 0.98 (p = 0.93); improper-trash reports **+10%** | trash yes, rodents no |

**About demolitions:** the roof-permit control rises because roof work is seasonal. Even so, demolitions show no rise at all. Boston already requires rodent baiting before a demolition permit, so this is consistent with that rule working. That's a positive story for the pitch, not a driver.

## 5. Tract results (167 tracts)

| Variable | raw | controlling 311 volume |
|---|---|---|
| Children share | −0.30 | −0.24 |
| People of color share | −0.35 | −0.23 |
| Disability share | −0.25 | −0.18 |
| Displacement risk score (147 tracts) | −0.23 | −0.14 |
| Low or no income share | −0.11 | +0.06 |
| Limited English share | −0.12 | +0.02 |
| Older adult share | +0.03 | −0.06 |
| Adult asthma, CDC PLACES (147 tracts) | −0.41 | −0.24 (−0.29 also controlling income) |
| iNaturalist sightings vs 311 rodent rate | +0.12 | — |

The negative signs say 311 rodent reports are concentrated in dense student and older-housing areas (Allston, Mission Hill, North End), not in the tracts with the most vulnerable residents. Either those tracts have fewer rats or they report less. iNaturalist is too sparse (544 observations) to tell which. **Product implication:** the site ranking needs an equity view, for example rank within each neighborhood, or flag low-reporting tracts. Never present 311 counts as "where rats are".

## 6. Impact checks

| Check | Result | Verdict |
|---|---|---|
| City pest-control spending (Checkbook) | FY2026 ≈ $776K to pest/extermination vendors; BPS $611K | **keep** |
| Schools near hot spots | 66 of 134 schools (49%) are in or next to a top-10% rodent cell, vs 35% of lived-in cells | **keep** (1.4×, pairs with BPS spending) |
| Electrical fires | No link after controls (−0.08); no cause field or coordinates | drop |
| Asthma | Negative association (above) | drop as an impact claim |
| Inspector pay (employee earnings) | Titles don't identify rodent staff (one ISD "Prin Environment Health Insp", $114,595) | drop |
| Somerville 311 | 8,770 "Rats" requests plus "Rodent Assistance Program" requests | keep (three-city comparison) |

## 7. Verdict per dataset

**Core (P0 — model and site card):**
- 311 yearly 2023–26: rodent (outcome and strongest lag), dead animal, indoor pest, improper trash storage, missed trash.
- 311 new system: improper trash storage, overflowing, out early, weeds, litter, student move-in.
- **Code enforcement violations** (`90ed3816-5e70-443c-803d-9a71f44470be`): 928K inspector-issued tickets with coordinates; residential trash storage. *New: it was not on the board and is better than resident reports because it isn't driven by who calls 311.*
- NOAA temperature (season only).

**Keep (supporting):**
- RentSmart, for owner portfolios. Its year built is unreliable: 94% of rental properties are listed as 1900–1915.
- Property assessment, for building facts (ZIP-level pre-1920 share +0.46).
- Checkbook and schools (impact).
- Social vulnerability (equity lens).
- Somerville 311.
- Inside Airbnb and OpenAlex (small impact and citations).
- Food inspections, as a counted cost only, not a predictor.

**Drop:**
- Rain, snow and snow routes, flood layers.
- Demolitions as a driver (keep as the positive "baiting rule" story).
- Public Works work zones: 460 current rows, no history, no coordinates.
- "Rainfall data" on Analyze Boston: only a link to a BWSC web page.
- Big Belly, city lots, food and liquor/entertainment licenses, food trucks, one-day events, Fenway calendar, colleges as points, park and dog features, trees, iNaturalist as a signal.
- Fire incidents, asthma as impact, employee earnings, displacement risk, Zillow, Yelp/Google, COVID.

**Not tested (no usable data):** sewers and CSO outfalls, community gardens and compost, street sweeping (segments have no coordinates in the CSV), sidewalk inventory (same), raptor poisoning, Census ACS (API failed three times; SVI covers the same ground).

## 8. What this changes in the spec

See `.kiro/specs/rat-audit/data-audit.md` for the full audit and the requirement and task edits (applied Oct 24). In short:
- Forecast: drop rain, snow, demolition, event and Big Belly features. Add season/temperature, code-enforcement trash, dead animal, indoor pest, new-system trash types and the move-out flag.
- Findings panel: keep the honest nulls (rain, demolitions, restaurants), because the spec already requires reporting null results.
- Drop live NWS rain (R6.4).
- Add an under-reporting caveat and an equity view to the site ranking.
- Remove the timeline's rain and games event marks. Keep move-out.

## 9. Reproduce

```bash
cd knowledge/sources/rats/validation
python3 pull_grid.py && python3 analyze_grid.py      # grid tests
python3 pull_time.py && python3 analyze_time.py      # time tests
python3 analyze_tract.py                             # tract tests (needs dl/svi.geojson, URL in script notes)
python3 analyze_impact.py                            # impact checks
```

Queries cache to `cache/` (git-ignored). Saved outputs: `grid_results.txt`, `time_results.txt`, `tract_results.txt`, `impact_results.txt`. The tract boundaries come from `https://bostonopendata-boston.opendata.arcgis.com/api/download/v1/items/34f2c48b670d4b43a617b1540f20efe3/geojson?layers=0` and are saved as `dl/svi.geojson`.

**Limits:**
- All rat measures are reports.
- Grid correlations are associations, not causes.
- The 2024 trash types and the 2025–26 new-system types come from different 311 systems.
- CDC tract IDs (2020) and SVI tracts (2010) only partly match (147 of 167).
- Demolition dates are permit issue dates, not work dates.
