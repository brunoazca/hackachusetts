# Boston Rat Audit: datasets, findings, impact and economics

Research date: **October 24, 2026**. Status: the team's leading idea after voting on the [Data Atlas](https://claude.ai/artifact/Ccw6n593reUG1MQjAawa2W). The original research pass reported live queries for the counts below; its raw analysis inputs were not committed. Analysis scripts are in [sources/scripts/](sources/scripts/). The later [data expansion](24_rodentops_data_and_research_catalog.md) independently checks selected schemas/counts and corrects freshness and inference limits; [government and public voices](19_rodentops_government_and_public_voices.md) adds current institutional context. Counts not repeated in a saved audit remain earlier team findings, not independently reproduced results of the expansion.

## 1. The idea in one paragraph

A sourced review of public rodent reports and relevant municipal context in Boston. For a location with recurring reports, it shows documented conditions and actions, nearby records worth checking, and what remains unknown. An ISD inspector or BRAP coordinator reviews the evidence card and proposes follow-up. Public records alone do not establish the cause, complete treatment history or effectiveness of an intervention. This is a tool for an existing program.

## 2. Why this problem

- **Reports are rising.** 311 logged **5,321 Rodent Activity reports in 2026 through Oct 23**, already more than all of 2025 (**5,225**). That could be more rats or more reporting. Say "reports are up", not "rats are up".
- **Closed does not mean solved.** 99% of 2025 rodent cases are closed (5,167 closed, 58 open). Yet **407 addresses got a new report 30+ days after an earlier one**.
- **A few sites drive the load.** In 2025, 690 addresses with repeat reports produced 1,822 of 5,222 located reports (35%). **46 addresses had 5+ reports.**
- **The city already treats it as a priority.** Mayor Wu launched the **Boston Rodent Action Plan (BRAP)** in July 2024: ISD-led, 10 agencies (ISD, Public Works, Public Health Commission, Parks, 311 and others), prevention-first, with "Priority Action Neighborhoods". Report written by urban rodentologist Dr. Bobby Corrigan. Named hot spots include downtown, Chinatown, the North End, Allston/Brighton, Back Bay, South Dorchester and Roxbury. Sources: [WGBH](https://wgbh.org/news/local/2024-07-18/boston-launches-plan-to-address-rat-problem), [City of Boston](https://www.boston.gov/node/16177731), [BRAP final report (PDF)](https://boston.gov/sites/default/files/file/2024/07/Final%20Full%20BRAP%20Report.pdf), [Boston 25](https://boston25news.com/news/local/boston-doesnt-like-rats-city-establishes-rodent-action-plan/3B4F6QNJNBF6RBIJ7CXQL2WERU/), [2025 rodent control trifold](https://www.boston.gov/sites/default/files/file/2025/12/Rodent%20Control%20Trifold%20Eng.pdf).

**Positioning:** BRAP asks for coordination and prevention. Our proposed contribution is a reviewable inspection brief assembled from public records. The City already has analytics, pilots and interdepartmental work; whether an additional brief fills a gap needs practitioner validation. The [2026 account](19_rodentops_government_and_public_voices.md) describes more than 20 participating departments, agencies and external partners, a broader scope than the original department count.

## 3. Datasets

All Boston datasets are on [Analyze Boston](https://data.boston.gov/) (CKAN). Tables with a resource ID can be queried with `datastore_search_sql`. The portal blocks some SQL functions (`extract`, `coalesce`), so compute durations locally.

### Rat signals

| Dataset | Access | What it adds | Checked |
|---|---|---|---|
| [311 yearly tables, 2011–2026](https://data.boston.gov/dataset/311-service-requests) | 2026 `1a0b420d-99f1-4887-9851-990b2a5a6e17`, 2025 `9d7c2214-4709-478a-a2e8-fb2020a5bb94` (older years listed on the page) | `type` = Rodent Activity, Pest Infestation - Residential, Rat Bite, Pick up Dead Animal; `closure_reason` free text; lat/long, address | 2026: 5,321 rodent, 2,211 pest. 2025: 5,225 rodent, 1,900 pest, 3 rat bites |
| [311 new system (Aug 2025–now)](https://data.boston.gov/dataset/311-service-requests) | `254adca6-64ab-4c5c-9fc0-a6da622be185` | Earlier count: 75,498 cases. Exact `Rodent Activity` category query returned zero; broader rodent search found other categories | Taxonomy and overlap with yearly tables require review; zero exact-label matches do not mean no rodent-related content |
| [RentSmart](https://data.boston.gov/dataset/rentsmart) | `dc615ff7-2ff3-416a-922b-f0f334f085d0` | 311 + ISD history per property with `parcel`, `owner`, `year_built`, lat/long | 377,910 rows; 17,594 "Rodent Activity", 6,788 "Pest Infestation" |

### Food

| Dataset | Access | What it adds | Checked |
|---|---|---|---|
| [Food establishment inspections](https://data.boston.gov/dataset/food-establishment-inspections) | `4582bec6-2b4f-4f9e-bc55-cbaa73117f4c` | Violations with `violdesc`, `comments`, address, `property_id` | 906,288 rows; 3,608 rodent/mice mentions at 833 businesses since Jan 2025 |
| [Active food establishment licenses](https://data.boston.gov/dataset/active-food-establishment-licenses) | portal page | Licensed-establishment context; presence alone says nothing about sanitation | Later schema/count probe in document 24 |

### Trash

| Dataset | Access | What it adds | Checked |
|---|---|---|---|
| 311 yearly: trash types | same 311 tables | 2025: Improper Storage of Trash (Barrels) 20,083; Missed Trash 9,972; Pick up Dead Animal 8,699; Illegal Dumping 3,567; Empty Litter Basket 2,340; Overflowing Dumpster 125; Trash on Vacant Lot 55 | queried |
| 311 new system: trash types | `254adca6-…` | Since Aug 2025: Litter 10,359; Improper Trash Storage 3,505; Illegal Dumping 3,105; Trash Placed Out Early 3,049; Overflowing Trash 2,053; Student Move-In 280 | queried |
| [Trash schedules by address](https://data.boston.gov/dataset/trash-schedules-by-address) | portal page | Scheduled pickup day; actual completion and exceptions need separate evidence | Current metadata/schema checked in document 24 |
| [Big Belly locations](https://data.boston.gov/dataset/big-belly-locations) | portal page | Historical inventory; not evidence of current protection or condition | Resource last modified Dec 11, 2016; exclude from current rankings |
| [Public Works violations](https://data.boston.gov/dataset/public-works-violations) | portal page | Trash and sanitation fines already issued | link checked |

### Buildings, owners and construction

| Dataset | Access | What it adds | Checked |
|---|---|---|---|
| [Property assessment FY2026](https://data.boston.gov/dataset/property-assessment) | `ee73430d-96c0-423e-ad21-c4cfb54c8961` | `PID` (candidate match to RentSmart `parcel`, validate before joining), `OWNER`, `OWN_OCC`, `MAIL_STREET_ADDRESS`, `YR_BUILT`, `RES_UNITS`, values | 184,552 rows |
| Starter [building permits](../data/civic/datasets/permits/README.md) and [violations](../data/civic/datasets/violations/README.md) | repo CSVs | Nearby work and recorded building conditions; demolition displacement is a hypothesis requiring evidence | in repo |
| 311: Abandoned Building, Trash on Vacant Lot, Construction Debris | 311 tables | Harborage sites | 2025: 102 abandoned buildings |
| [City-owned property](https://data.boston.gov/dataset/dnd-managed-city-property-inventory-all) | portal page | Historical DND inventory, not current vacancy or responsibility | Resource last modified Dec 11, 2016 |

### Environment, people, expertise

| Dataset | Access | What it adds | Checked |
|---|---|---|---|
| [Rainfall data](https://data.boston.gov/dataset/rainfall-data) | portal points to BWSC interface; no checked CSV/API | Environmental context; cannot establish why a particular complaint occurred | NOAA alternative directly probed in document 24 |
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

### Descriptive associations (2025, 25 Boston ZIPs, per 1,000 property records)

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

**Interpretation:** in this earlier ZIP-level analysis, reported improper trash storage had a stronger association with rodent reports than restaurant citations or missed-pickup reports did. These ecological correlations do not establish causes, quantify rat populations or assign responsibility to residents, owners or City services. Density, reporting behavior, source overlap and the property-record denominator can influence all of them. The raw inputs need re-fetching to reproduce the figures.

ZIPs with the most rodent reports per 1,000 property records: **02134 Allston (66.8), 02120 Mission Hill (63.7), 02113 North End (49.1), 02121 Dorchester/Roxbury (39.3), 02119 Roxbury (35.8), 02118 South End (33.6)**. The North End has the highest improper-trash rate (420 per 1,000).

### Documented actions and later reports

The 311 `closure_reason` field may describe an inspection, citation, referral or monitoring. An LLM can propose an action classification with a source reference and unknown fields; it cannot infer the root cause or treatment date when unstated. Later report counts can be displayed descriptively. A 60-day before/after difference cannot establish effectiveness without accounting for seasonality, reporting, intervention selection, regression to the mean and incomplete follow-up.

### Owners

The earlier analysis grouped records by owner mailing address. Shared addresses can reflect management agents and administrative arrangements, so they do not prove common beneficial ownership. Complaint counts per unit do not establish landlord misconduct. Keep any grouping as an unverified relationship hypothesis and omit owner rankings from the public demo.

## 5. Impact possibilities

| Area | What rats cost | Evidence we have | Strength |
|---|---|---|---|
| **Health** | Rodent allergens trigger asthma. Rats carry leptospirosis and other pathogens; BU researchers found influenza A and *S. aureus* in Boston rats | 3 rat bites in 311 (2025); CDC PLACES asthma by tract; OpenAlex studies | Medium: link by tract, not causal |
| **Tenants** | Infestations in homes, repeat complaints, health and stress | 6,788 RentSmart pest-infestation rows; 407 addresses with recurrence | Strong |
| **Restaurants** | Possible inspection and business burdens | Earlier count: 3,608 rodent/mice keyword matches at 833 businesses; rows can repeat within inspections | Does not establish unique failures, closures or financial losses |
| **Tourism and short stays** | Guests leaving early, bad reviews | Inside Airbnb: 212 of 267,731 reviews mention rats/mice/rodents (0.08%). Highest in Bay Village 0.39%, Chinatown 0.24%, Back Bay and Mission Hill 0.15%. Example (Back Bay, Feb 2024): a guest "had to end my stay 5 nights early because a mouse walked…" | Real but small |
| **City operations** | Potential briefing and follow-up workload | Administrative closure and recurring reports | Does not prove failed treatment, actual repeat visits or lack of agency coordination |
| **Property values** | Stigma at sale, disclosure | See section 6. No reliable price signal in public data | Weak |

## 6. Do rats lower property values?

**Short answer: we cannot show it with public data, and we should not claim it in the pitch.**

- **ZIP-level check** ([rats_econ.py](sources/scripts/rats_econ.py)): Spearman between 2025 rodent reports per 1,000 property records and Zillow values is **−0.18 for home value (ZHVI, 25 ZIPs)** and **+0.30 for rent (ZORI, 23 ZIPs)**. Both are weak and confounded: rat-heavy ZIPs are dense, old, student-heavy and expensive to rent. Example: Mission Hill 02120 has 63.7 rodent reports per 1,000 and a typical rent of $4,206.
- **Literature:** I found no peer-reviewed study that measures how rodent sightings affect home prices. Figures of "up to 10–20%" come from UK property and insurance marketing ([Property Reporter](https://www.propertyreporter.co.uk/rat-infestations-can-knock-up-to-20-off-a-propertys-value.html), [Property Reporter, UK values](https://www.propertyreporter.co.uk/uk-properties-face-falling-values-as-rat-infestations-rise.html), [Quotezone](https://www.quotezone.co.uk/home-insurance/guides/rat-threat-to-uk-properties-this-winter)) and a US buyer's-agent analysis ([Daily Tidings](https://www.dailytidings.com/more-than-1-in-10-oregon-homes-are-infested-with-rodents-new-study-finds/)). Treat them as anecdotes.
- **A better test if there is time:** compare assessed-value change (FY2025 → FY2026 property assessment) at chronic rodent parcels against similar nearby parcels (same ZIP, building type, year built). Present that as exploratory, not as proof.
- **Economic framing for the pitch:** public records indicate possible burdens, not verified dollar losses or costs we can simply sum. Start by measuring briefing task time in a labeled internal exercise; financial or municipal productivity claims need operational evidence.

## 7. Product shape

- **User:** ISD rodent inspector; BRAP coordinator.
- **Review list:** locations with recurring reports, using explicit time windows, source coverage and human-reviewed grouping.
- **Audit card per site:** observations and contextual records, source dates, matching uncertainty, collection schedule and questions for an inspector. A distance radius is a configurable review aid, not a colony boundary. Exclude stale inventories and unverified ownership networks.
- **Documented history:** classified closure notes and later reports, with unknown action dates and follow-up limitations visible.
- **Human decision:** the inspector approves the next action. The app pre-fills the notice; nothing is sent automatically.
- **Measure:** brief accuracy, source fidelity and task time first. A real pilot would add field-confirmed conditions, resident follow-up and an appropriate evaluation design.

**Demo (under 3 minutes):** open a manually checked recurring-report group. Show the sourced timeline, documented actions, unresolved questions, and a human approving a follow-up brief. Do not present later reports as proof the earlier action failed.

## 8. Limits

- Every rat measure is a report. Areas that report more look worse, and 511 rodent reports in 2025 have no ZIP.
- The ZIP correlations are ecological (25 ZIPs). They suggest where to look, not cause. Block-level analysis is the next step.
- The denominator is property records per ZIP, because the Census ACS API did not respond during this session.
- Airbnb review matching uses keywords ("rat", "mice", "mouse", "rodent") with a small noise filter. Spot-check before quoting numbers.
- Use the yearly table for the exact `Rodent Activity` category. The newer system's taxonomy and cross-system overlap remain unresolved; broader search did find rodent-related content.
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
