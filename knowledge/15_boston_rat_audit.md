# Boston Rat Audit: datasets, findings, impact and economics

Research date: **October 24, 2026**. Status: the team's leading idea after voting on the [Data Atlas](https://claude.ai/artifact/Ccw6n593reUG1MQjAawa2W). Every count below was queried live from the named source on this date unless marked otherwise. Analysis scripts are in [sources/scripts/](sources/scripts/).

## 1. The idea in one paragraph

A single audit of every public signal that explains rats in Boston. For each chronic address or block it shows the likely drivers (trash, food, buildings, owners, construction, weather), what the city already tried there, and whether reports dropped afterward. An ISD rodent inspector or the Boston Rodent Action Plan team opens this week's 10 chronic sites, reads the evidence card, and approves the next action. It is a tool for an existing program, not a new program.

## 2. Why this problem

- **Reports are rising.** 311 logged **5,321 Rodent Activity reports in 2026 through Oct 23**, already more than all of 2025 (**5,225**). That could be more rats or more reporting. Say "reports are up", not "rats are up".
- **Closed does not mean solved.** 99% of 2025 rodent cases are closed (5,167 closed, 58 open). Yet **407 addresses got a new report 30+ days after an earlier one**.
- **A few sites drive the load.** In 2025, 690 addresses with repeat reports produced 1,822 of 5,222 located reports (35%). **46 addresses had 5+ reports.**
- **The city already treats it as a priority.** Mayor Wu launched the **Boston Rodent Action Plan (BRAP)** in July 2024: ISD-led, 10 agencies (ISD, Public Works, Public Health Commission, Parks, 311 and others), prevention-first, with "Priority Action Neighborhoods". Report written by urban rodentologist Dr. Bobby Corrigan. Named hot spots include downtown, Chinatown, the North End, Allston/Brighton, Back Bay, South Dorchester and Roxbury. Sources: [WGBH](https://wgbh.org/news/local/2024-07-18/boston-launches-plan-to-address-rat-problem), [City of Boston](https://www.boston.gov/node/16177731), [BRAP final report (PDF)](https://boston.gov/sites/default/files/file/2024/07/Final%20Full%20BRAP%20Report.pdf), [Boston 25](https://boston25news.com/news/local/boston-doesnt-like-rats-city-establishes-rodent-action-plan/3B4F6QNJNBF6RBIJ7CXQL2WERU/), [2025 rodent control trifold](https://www.boston.gov/sites/default/files/file/2025/12/Rodent%20Control%20Trifold%20Eng.pdf).

**Positioning:** BRAP asks for coordination across agencies and prevention. Our audit is the shared evidence layer those 10 agencies do not have today.

## 3. Datasets

All Boston datasets are on [Analyze Boston](https://data.boston.gov/) (CKAN). Tables with a resource ID can be queried with `datastore_search_sql`. The portal blocks some SQL functions (`extract`, `coalesce`), so compute durations locally.

### Rat signals

| Dataset | Access | What it adds | Checked |
|---|---|---|---|
| [311 yearly tables, 2011–2026](https://data.boston.gov/dataset/311-service-requests) | 2026 `1a0b420d-99f1-4887-9851-990b2a5a6e17`, 2025 `9d7c2214-4709-478a-a2e8-fb2020a5bb94` (older years listed on the page) | `type` = Rodent Activity, Pest Infestation - Residential, Rat Bite, Pick up Dead Animal; `closure_reason` free text; lat/long, address | 2026: 5,321 rodent, 2,211 pest. 2025: 5,225 rodent, 1,900 pest, 3 rat bites |
| [311 new system (Aug 2025–now)](https://data.boston.gov/dataset/311-service-requests) | `254adca6-64ab-4c5c-9fc0-a6da622be185` | 75,498 cases with case ID, close date, address, lat/long. **No rodent category**: rodent reports are in the yearly tables | trash and dumping types only |
| [RentSmart](https://data.boston.gov/dataset/rentsmart) | `dc615ff7-2ff3-416a-922b-f0f334f085d0` | 311 + ISD history per property with `parcel`, `owner`, `year_built`, lat/long | 377,910 rows; 17,594 "Rodent Activity", 6,788 "Pest Infestation" |

### Food

| Dataset | Access | What it adds | Checked |
|---|---|---|---|
| [Food establishment inspections](https://data.boston.gov/dataset/food-establishment-inspections) | `4582bec6-2b4f-4f9e-bc55-cbaa73117f4c` | Violations with `violdesc`, `comments`, address, `property_id` | 906,288 rows; 3,608 rodent/mice mentions at 833 businesses since Jan 2025 |
| [Active food establishment licenses](https://data.boston.gov/dataset/active-food-establishment-licenses) | portal page | Every licensed kitchen, a food-waste source | link checked |

### Trash

| Dataset | Access | What it adds | Checked |
|---|---|---|---|
| 311 yearly: trash types | same 311 tables | 2025: Improper Storage of Trash (Barrels) 20,083; Missed Trash 9,972; Pick up Dead Animal 8,699; Illegal Dumping 3,567; Empty Litter Basket 2,340; Overflowing Dumpster 125; Trash on Vacant Lot 55 | queried |
| 311 new system: trash types | `254adca6-…` | Since Aug 2025: Litter 10,359; Improper Trash Storage 3,505; Illegal Dumping 3,105; Trash Placed Out Early 3,049; Overflowing Trash 2,053; Student Move-In 280 | queried |
| [Trash schedules by address](https://data.boston.gov/dataset/trash-schedules-by-address) | portal page | Pickup day per address, to test "trash out on the wrong day" | link checked |
| [Big Belly locations](https://data.boston.gov/dataset/big-belly-locations) | portal page | Sealed compacting bins, a protective factor | link checked |
| [Public Works violations](https://data.boston.gov/dataset/public-works-violations) | portal page | Trash and sanitation fines already issued | link checked |

### Buildings, owners and construction

| Dataset | Access | What it adds | Checked |
|---|---|---|---|
| [Property assessment FY2026](https://data.boston.gov/dataset/property-assessment) | `ee73430d-96c0-423e-ad21-c4cfb54c8961` | `PID` (= RentSmart `parcel`), `OWNER`, `OWN_OCC`, `MAIL_STREET_ADDRESS`, `YR_BUILT`, `RES_UNITS`, values | 184,552 rows |
| Starter [building permits](../data/civic/datasets/permits/README.md) and [violations](../data/civic/datasets/violations/README.md) | repo CSVs | Demolitions (98 in starter) push rats out; unsafe structures | in repo |
| 311: Abandoned Building, Trash on Vacant Lot, Construction Debris | 311 tables | Harborage sites | 2025: 102 abandoned buildings |
| [City-owned property](https://data.boston.gov/dataset/dnd-managed-city-property-inventory-all) | portal page | Vacant city lots | link checked |

### Environment, people, expertise

| Dataset | Access | What it adds | Checked |
|---|---|---|---|
| [Rainfall data](https://data.boston.gov/dataset/rainfall-data) | portal page | Heavy rain floods burrows and pushes rats out | link checked |
| [Park features](https://data.boston.gov/dataset/park-features) | portal page | Playgrounds, park trash | link checked |
| [Climate Ready social vulnerability](https://data.boston.gov/dataset/climate-ready-boston-social-vulnerability) | GeoJSON, 180 tracts | Older adults, children, disability, low income per tract | downloaded |
| [CDC PLACES](https://data.cdc.gov/resource/cwsq-ngmh.json?stateabbr=MA) | Socrata API | Asthma by tract (rodent allergen is an asthma trigger) | API returned data |
| [OpenAlex](https://api.openalex.org/works?search=rats%20Boston) | API, no key | BU studies of Boston rats (influenza A, *S. aureus*, leptospirosis) | search returned results |

### Economic signals (new)

| Dataset | Access | What it adds | Checked |
|---|---|---|---|
| [Inside Airbnb Boston](https://insideairbnb.com/get-the-data/) | `data.insideairbnb.com/united-states/ma/boston/2026-09-19/data/{listings,reviews}.csv.gz` | 267,731 guest reviews with listing neighbourhood | downloaded |
| [Zillow ZHVI by ZIP](https://www.zillow.com/research/data/) | `files.zillowstatic.com/research/public_csvs/zhvi/Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv` | Typical home value per ZIP, monthly | downloaded |
| [Zillow ZORI by ZIP](https://www.zillow.com/research/data/) | `files.zillowstatic.com/research/public_csvs/zori/Zip_zori_uc_sfrcondomfr_sm_month.csv` | Typical rent per ZIP, monthly | downloaded |
| Property assessment values | `ee73430d-…` | Assessed value per parcel, which can be compared year over year at chronic addresses | fields checked |

## 4. Findings so far

### Drivers (2025, 25 Boston ZIPs, per 1,000 property records)

Spearman correlation between rodent reports and each factor ([rats_zip.py](sources/scripts/rats_zip.py)):

| Factor | ρ |
|---|---|
| Pest Infestation - Residential (311) | +0.80 |
| Improper Storage of Trash (Barrels) | **+0.78** |
| Housing rodent/pest violations (RentSmart) | +0.68 |
| Empty Litter Basket | +0.64 |
| Illegal Dumping | +0.63 |
| Pick up Dead Animal | +0.53 |
| Restaurant rodent citations | +0.41 |
| Trash on Vacant Lot | +0.41 |
| Overflowing Dumpster | +0.33 |
| Construction Debris | +0.16 |
| Missed Trash pickup | +0.14 |

ZIPs with the most rodent reports per 1,000 property records: **02134 Allston (66.8), 02120 Mission Hill (63.7), 02113 North End (49.1), 02121 Dorchester/Roxbury (39.3), 02119 Roxbury (35.8), 02118 South End (33.6)**. The North End has the highest improper-trash rate (420 per 1,000).

> **Correction from the block-level test below:** most of these ZIP correlations come from reporting volume. Blocks that report a lot report everything. Do not use "+0.78" in the pitch.

### Drivers at block level (Kiro Crew campaign `e241ffc6`, 2025)

Grid of about 100 m: 8,913 blocks, 2,337 with a rodent report. "Net" is the partial Spearman after controlling for total 311 volume on the block. Housing density was tested and is not a confound.

| Factor | Blocks | ZIP ρ | Block ρ (raw) | Block ρ (net of volume) | Verdict |
|---|---|---|---|---|---|
| Improper trash storage | 3,474 | +0.78 | +0.36 | **+0.13** | Holds; strongest remaining driver |
| Illegal dumping | 1,847 | +0.63 | +0.26 | +0.10 | Holds, weaker |
| Missed pickup | 3,954 | +0.14 | +0.19 | +0.05 | Near noise |
| Restaurant rodent citations | 477 | +0.41 | +0.12 | +0.03 | **No**: the ZIP signal was commercial clustering |
| Demolition / new construction (300 m, ±90 days, 561 permits) | — | — | after/before ratio 1.02 (247 up, 196 down) | — | Small local bump |
| Big Belly sealed bins (1,060 near vs 5,621 volume-matched blocks) | — | — | 1.81 vs 1.97 rodent reports per 100 reports | — | About 8% lower; weak, observational |
| Heavy rain, week after (12 heavy vs 250 dry days) | — | — | ratio 1.03; lag correlation ≈ 0 for 0–7 days | — | No effect |

**Revised headline:** no single factor explains rats at block level. Improper trash storage and dumping are the only levers that survive the controls. That makes the case for an audit per site instead of one citywide rule.

### What the city did ("what worked") (Kiro Crew campaign `93c1ad29`, 2025)

Closure notes classified into action types:

| Action in closure note | Cases |
|---|---|
| Generic "case noted", no action named | 2,048 |
| Monitoring | 1,750 |
| Violation issued | 352 |
| Baiting | 272 |
| Rat-resistant barrels | 29 |

Causes named in the notes: trash 216, sewer 88, dumpster 52, debris 41, overgrown vegetation 40, construction 26.

Share of addresses with a new report within 60 days, before vs after the action:

| Action | Before | After |
|---|---|---|
| Violation issued | 15.3% | **12.2%** |
| Monitoring | 14.1% | 14.2% (no change) |
| Baiting | — | about 2 points lower |
| Rat-resistant barrels | — | rose, but only 29 cases |

**At the 46 chronic addresses (5+ reports), 237 of about 280 recorded actions were monitoring or "noted". Only 14 violations were issued across all 46.** Examples: one Back Bay address had 13 reports and monitoring all year, never escalated. The demo site in Dorchester escalated to violations but recurred because of the vacant lot next door ([demo_site.md](sources/rats/demo_site.md)).

**Pitch line:** monitoring is the city's most common response and it does not reduce recurrence. Violations do. The audit tells the inspector when to stop monitoring and escalate, and when the cause is next door.

Observational: the before/after comparison does not control for why inspectors chose each action.

### Owners

Grouping property assessment by owner mailing address shows hidden portfolios. One address sits behind 125 owner names, 128 rental parcels and 1,053 units. Problems per unit separate big landlords from bad ones: the city average is 0.12 tenant-facing problems per unit since 2024, that group is at 0.13, and another group of 17 names is at 1.43. See the Problem Landlord Radar notes in the Data Atlas.

### Closure notes classifier (Kiro Crew campaign `d19b46b7`, rules aligned in `sources/scripts/closure_classifier_rules.py`)

| Tag | 2025 | 2026 |
|---|---|---|
| monitoring (incl. generic "noted") | 49.1% | 27.4% |
| abatement_order | 12.4% | 17.9% |
| baiting | 11.6% | 17.0% |
| inspection | 9.5% | 11.1% |
| no_violation | 3.2% | 5.3% |
| citation | 2.4% | 1.3% |
| closed_no_action (empty note) | 1.1% | 1.6% |
| unknown | 4.5% | 7.3% |

Non-unknown coverage: 95.5% (2025), 92.7% (2026). In 2026 the city's notes shift from monitoring toward abatement and baiting. That is worth showing, but it is observational.

### Sept 1 move-out and events (Kiro Crew campaign `ebc7405e`)

- **Trash spike: strong.** Trash reports peak the week containing Sept 1 every year: about 2.0× the prior 8-week median citywide (2023 1,745 vs 888; 2024 1,573 vs 805; 2025 1,523 vs 838) and 4–5× in Allston 02134, Mission Hill 02120 and Fenway 02215 (4.4×, 4.9×, 3.9×).
- **Rodent lag: none.** Rodent reports do not rise 1–4 weeks after Sept 1 in any year; they decline through the fall.
- **Red Sox home games: weak.** Trash reports within 500 m of Fenway the day after a home game: 1.28× (0.65 vs 0.51 per day, 79 games, permutation p = 0.18). Not a finding to show.

## 5. Impact possibilities

| Area | What rats cost | Evidence we have | Strength |
|---|---|---|---|
| **Health** | Leptospirosis, rodent allergens (asthma), bites | **18% of Boston brown rats (59 of 328, 17 areas) carried *Leptospira***, and a Boston-area human case was genetically near-identical to a local rat strain (Tufts, PLOS NTD, 2025, peer-reviewed). BU studies found influenza A and *S. aureus* in Boston rats. 3 rat bites in 311 (2025) | Strong (peer-reviewed) |
| **Tenants** | Infestations in homes, repeat complaints, health and stress | 6,788 RentSmart pest-infestation rows; 407 addresses with recurrence | Strong |
| **Restaurants** | Failed inspections, lost business | **127 food businesses got 301 rodent/vermin violations in 2025, 37 at the most severe level** (food inspections, violation codes). The broader text search (3,608 mentions at 833 businesses since 2025) also matches comments like "no mice observed", so use 127 in the pitch | Strong (government data) |
| **Tourism and short stays** | Guests leaving early, bad reviews | Inside Airbnb: 212 of 267,731 reviews mention rats/mice/rodents (0.08%). Highest in Bay Village 0.39%, Chinatown 0.24%, Back Bay and Mission Hill 0.15%. Example (Back Bay, Feb 2024): a guest "had to end my stay 5 nights early because a mouse walked…" | Real but small |
| **City operations** | Inspector visits that do not stop recurrence; 10 agencies acting separately | 99% closed vs 407 recurring addresses | Strong |
| **Property values** | Stigma at sale, disclosure | See section 6. No reliable price signal in public data | Weak |

### Cost of rats: what we can say (Kiro Crew campaign `b6ba6312`)

| Claim | Label | Source |
|---|---|---|
| 18% of Boston brown rats carry *Leptospira*; a local human case matched a rat strain | peer-reviewed | [Boston Globe on the Tufts study](https://www.bostonglobe.com/2025/06/20/metro/rats-boston-disease-leptospirosis-tufts/), [PubMed 40233129](https://pubmed.ncbi.nlm.nih.gov/40233129/) |
| The same authors warn extermination can spread strains as rats relocate; they recommend sanitation over eradication | peer-reviewed | [AAU summary](https://www.aau.edu/newsroom/urban-rats-spread-deadly-bacteria-they-migrate-study) |
| 127 Boston food businesses, 301 rodent/vermin violations in 2025 (37 most severe) | government data | food inspections `4582bec6-2b4f-4f9e-bc55-cbaa73117f4c` |
| BRAP spans 20+ city departments; the one published dollar figure is a $500,000 participatory-budgeting rat-prevention project (rodent-proof containers and sensors for 665 Boston Housing Authority units in Brighton) | government | [Rat summit news](https://www.boston.gov/news/city-boston-host-second-ever-national-urban-rat-summit), [Participatory budgeting page](https://www.boston.gov/departments/participatory-budgeting/rat-prevention-initiatives-dense-residential-areas) |
| Boston hosted the 2nd National Urban Rat Summit, Sept 23–24, 2026 | government | [City of Boston](https://www.boston.gov/news/city-boston-host-second-ever-national-urban-rat-summit) |
| **Boston has published no measured reduction** in rodent complaints or population since BRAP launched | government (absence) | [BRAP page](https://www.boston.gov/departments/inspectional-services/boston-rodent-action-plan) |
| NYC: 311 rat sightings fell 12 straight months, >20% year over year, credited to trash containerization; 55% drop in the Hamilton Heights pilot zone; $877,000 to rat-proof ~600,000 tree beds | government | [DSNY](https://www.nyc.gov/site/dsny/news/25-039/nyc-rats-fleeing-an-incredible-12-straight-months-), [pilot report](https://a860-gpp.nyc.gov/downloads/t435gh62m?locale=en), [Mayor's office](https://www.nyc.gov/mayors-office/news/2025/06/mayor-adams-launches-new-teams-fight-rats-city-s-new-phase-war-rats) |
| Chicago: a 2026 Inspector General audit found the reactive, complaint-driven program "unlikely to achieve long-term control" | government | [AP](https://apnews.com/article/chicago-rat-control-audit-complaints-root-causes-c2e1e14891b705480deb38e561d18ca0) |
| "Rats cut home value 5–20%" | **industry/marketing only**; no peer-reviewed rodent hedonic study exists. Nearest peer-reviewed work is on tree pests (2–5% discounts), not transferable | [Thrasher (industry)](https://thrasherpestcontrol.com/how-pest-issues-affect-real-estate/), [USFS tree-pest study](https://www.fs.usda.gov/psw/publications/documents/psw_gtr229/psw_gtr229_154.pdf) |

**Pitch order:** health (18% leptospirosis), food safety (127 businesses), our finding (monitoring doesn't cut recurrence, violations do), proof a fix exists (NYC −20%, −55% in a pilot), and the gap: Boston has no published measure of results. The audit gives BRAP that measure. Say plainly that the home-value claim is not supported.

## 6. Do rats lower property values?

**Short answer: we cannot show it with public data, and we should not claim it in the pitch.**

- **ZIP-level check** ([rats_econ.py](sources/scripts/rats_econ.py)): Spearman between 2025 rodent reports per 1,000 property records and Zillow values is **−0.18 for home value (ZHVI, 25 ZIPs)** and **+0.30 for rent (ZORI, 23 ZIPs)**. Both are weak and confounded: rat-heavy ZIPs are dense, old, student-heavy and expensive to rent. Example: Mission Hill 02120 has 63.7 rodent reports per 1,000 and a typical rent of $4,206.
- **Literature:** I found no peer-reviewed study that measures how rodent sightings affect home prices. Figures of "up to 10–20%" come from UK property and insurance marketing ([Property Reporter](https://www.propertyreporter.co.uk/rat-infestations-can-knock-up-to-20-off-a-propertys-value.html), [Property Reporter, UK values](https://www.propertyreporter.co.uk/uk-properties-face-falling-values-as-rat-infestations-rise.html), [Quotezone](https://www.quotezone.co.uk/home-insurance/guides/rat-threat-to-uk-properties-this-winter)) and a US buyer's-agent analysis ([Daily Tidings](https://www.dailytidings.com/more-than-1-in-10-oregon-homes-are-infested-with-rodents-new-study-finds/)). Treat them as anecdotes.
- **A better test if there is time:** compare assessed-value change (FY2025 → FY2026 property assessment) at chronic rodent parcels against similar nearby parcels (same ZIP, building type, year built). Present that as exploratory, not as proof.
- **Safer economic framing for the pitch:** guests leaving early, restaurant inspection failures, and repeat inspector visits are costs we can count.

## 7. Product shape

- **User:** ISD rodent inspector; BRAP coordinator.
- **Weekly list:** the 10 chronic addresses, ranked by repeat reports and "closed but came back".
- **Audit card per site:** drivers found within ~100 m (improper trash reports, cited restaurants, dumpsters, demolitions, vacant lots, Big Belly presence), the owner's history in RentSmart (including the same owner's other parcels), the trash day, and rain in the last week.
- **What worked:** classified past closure notes nearby and the report trend after each action type.
- **Human decision:** the inspector approves the next action. The app pre-fills the notice; nothing is sent automatically.
- **Measure:** reports at that address over the following 60 days.

**Demo (under 3 minutes):** open one real chronic address. Show its timeline with the "closed" cases that came back, the drivers around it, what worked nearby, and the inspector approving the action.

## 8. Limits

- Every rat measure is a report. Areas that report more look worse, and 511 rodent reports in 2025 have no ZIP.
- The ZIP correlations are ecological (25 ZIPs). They suggest where to look, not cause. Block-level analysis is the next step.
- The denominator is property records per ZIP, because the Census ACS API did not respond during this session.
- Airbnb review matching uses keywords ("rat", "mice", "mouse", "rodent") with a small noise filter. Spot-check before quoting numbers.
- Since Aug 2025, rodent reports are not in the new 311 table. Use the yearly 2026 table, which is updated daily.
- Owner names are public records, but keep them off screen in a public demo.

## 9. Reproduce

```bash
# Example: rodent reports by ZIP in 2025
curl -s "https://data.boston.gov/api/3/action/datastore_search_sql" --get \
  --data-urlencode "sql=SELECT location_zipcode, count(*) FROM \"9d7c2214-4709-478a-a2e8-fb2020a5bb94\" WHERE type='Rodent Activity' GROUP BY 1 ORDER BY 2 DESC"
```

- [sources/scripts/rats_zip.py](sources/scripts/rats_zip.py): ZIP-level driver correlations. Inputs: `t311.json`, `food.json`, `rs.json`, `pa.json` (the SQL that produces each is at the top of the script).
- [sources/scripts/rats_econ.py](sources/scripts/rats_econ.py): Airbnb reviews and Zillow comparison. Inputs: Inside Airbnb `listings.csv.gz`, `reviews.csv.gz`; Zillow `zhvi.csv`, `zori.csv`.
- [sources/scripts/storm_analysis.py](sources/scripts/storm_analysis.py): the Jan 2022 blizzard test from the storm idea, same join method (311 lat/long → Climate Ready tracts).

Downloaded data is not committed. Re-fetch with the URLs above.
