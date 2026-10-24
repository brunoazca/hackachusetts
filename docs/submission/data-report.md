# Final data report — Rat Audit Boston

**Cutoff:** October 24, 2026  
**Purpose:** historical team research, data links, overlaps, and supported video claims. These are recorded research outputs, not a fresh rerun of every analysis. Current implementation is described in [description.md](description.md).

## 1. The story in five numbers

| Number | Meaning | Video use |
|---:|---|---|
| **5,321** | Boston rodent reports during 2026, through October 23 | Already above all of 2025: **5,225** |
| **99%** | Share of cases marked closed | Closing a case does not prove the place stayed fixed |
| **407** | Addresses reported again 30+ days later | Repeat places are the core problem |
| **46** | Addresses with at least five 2025 reports | A small set keeps returning |
| **$776K** | FY2026 pest-control payments found by vendor-name matching | A lower-bound cost; **$611K** came from Boston Public Schools |

**Opening line:** Boston closes almost every rat report. Yet the same places keep coming back.

## 2. What data the product actually uses

The live product reads Supabase. The pipeline refreshes public sources.
The 22 committed civic CSVs support development and fallback seeding.
They are not all rat signals.

| Product data | Source | Job |
|---|---|---|
| Rodent reports, trash reports, closure notes | Boston 311, 2023–2026 and new system | Find repeated reports, recorded responses, and nearby context |
| Trash and property tickets | Boston code enforcement | Show recorded trash violations; missing links do not prove an enforcement gap |
| Building facts and ownership groups | Property Assessment and RentSmart | Explain building context and repeated properties |
| Demolition and excavation permits | Boston building permits | Show nearby work as context; tests found no rat spike |
| Temperature | NOAA Logan station | Model strong seasonal change |
| Public schools | City school locations | Measure school exposure near hot spots |
| Neighborhood and tract context | Boston estimates and Climate Ready SVI | Compare places and flag possible under-reporting |
| Pest-control payments | Boston Checkbook | Show public cost |
| Food inspections | Boston inspections | Count citations; not used as a rat predictor |
| Somerville rat requests | Somerville 311 | Compare regional reporting |
| Cambridge sightings and smart boxes | Cambridge Open Data | Compare sightings near rat boxes |
| Source records | Each agency URL and fetch time | Individual report views link to sources; aggregate cards have less granular provenance |

### Committed civic snapshot

The repository also contains 22 verified CSVs saved October 18, 2026.
The rat-relevant starter tables are:

| Dataset | Rows | Useful fields | Role |
|---|---:|---|---|
| Boston 311 | 5,000 | date, topic, status, neighborhood, ZIP, ward | Demo fallback and trash-signal preview |
| Permits | 8,240 | work type, dates, value, ZIP, ward | Construction context |
| Violations | 2,018 | status, code, description, ZIP, ward | Enforcement context |
| Neighborhoods | 24 | population, education, poverty | Area context |

The full live analysis uses larger source pulls than these snapshots.
For example, its time study uses **19,466 rodent reports**.

## 3. How the data connects

### Place links

| Scale | Rule | What it connects |
|---|---|---|
| Address | Private normalized address key | Repeat reports at one property |
| Current queue place | One normalized address with repeated reports | Reports and closures at that address; 50-meter clustering remains a planned analytics model |
| Context ring | **100 meters** around each place | Nearby report categories; spatial proximity does not establish causation |
| Vacant parcel | Within **40 meters** | Adjacent parcel context for field review |
| Forecast cell | **250-meter** square | Weekly signals and four-week forecasts |
| Area | Ward, ZIP, neighborhood, tract | Public context and comparisons |

### Time links

| Window | Meaning |
|---|---|
| **1–60 days** | A report after closure counts as a return |
| Previous **12 weeks** | Recent trash, pest, and dead-animal records |
| Previous year | Strong baseline for the same place |
| Next **4 weeks** | Forecast shown by the product |

### Evidence links

Source records carry attribution and ingestion metadata, and individual report views link to the source. Do not treat planned coordinate jitter or logged private-field reveal as verified protections across every current screen.

## 4. Main tested findings

Tests used 1,319 lived-in grid cells and controlled for report volume and address count.
The values below are associations, not proof of cause.

| Finding | Result | Meaning |
|---|---:|---|
| Monthly temperature and reports | **r = +0.87**, 45 months | Warm months dominate the yearly pattern |
| Last year's reports | **+0.32** predictive link | Place history is the strongest local baseline |
| New-system improper trash storage | **+0.18** association | New-system periods overlap the outcome window; not proof of advance prediction |
| Dead-animal reports | **+0.14** association | Weak historical association requiring out-of-time validation |
| Student move-in trash | **+0.13** association | Exploratory seasonal context; overlapping periods |
| Indoor pest reports | **+0.11** association | Weak relationship between report categories |
| Overgrown weeds | **+0.10** association | Weak place-level association; overlapping periods |
| Overflowing trash, trash out early, litter | **+0.09** each | Several weak signals can overlap |
| Code-enforcement residential trash | **+0.17** adjusted current link; **+0.09** predictive | Inspector evidence supports the trash link |

Monthly reports per day rise from **6.3 in February** to **22.3 in August**.

**Video line:** Heat sets the season. Place history and trash show where to look.

## 5. The key result: these records do not establish which response lasts

Monitoring made up **49% of 2025 rodent closures**.
A naive before-and-after view made stronger action look better.
That view was confounded because repeat rates fall over time anyway.

A matched study used **19,496 cases from 2023–2026**.
It matched prior reports, neighborhood, and month.

| Comparison | Result |
|---|---:|
| Citation or abatement versus monitoring | **Risk ratio 1.03** |
| 95% confidence interval | **0.89–1.20** |
| Verdict | No clear difference detected, including within each year; not proof of equivalence |

Site history gave a much clearer split:

| Prior site history | Return within 60 days |
|---|---:|
| No prior reports | **8–12%** |
| Five or more prior reports | **56–75%** |

This changes the product's job.
It does not claim one action works.
It helps a person review repeated reports and recorded responses. A matched field trial is a proposed next step, not a working feature.

**Video line:** The biggest predictor is not the last response. It is the site's history.

## 6. Important overlaps

| Overlap | Finding | Product response |
|---|---|---|
| Repeat reports + little enforcement | 46 chronic addresses had only 14 linked violations | Review linked records; missing links are not proof of inaction |
| High forecast + at most one recent report | New risk appears before many direct reports | Mark an emerging hot spot |
| Trash signals + warm season + past reports | Weak signals stack at one place and time | Provide context for review, not an inspection deadline |
| Schools + top hot spots | **66 of 134 schools (49%)** are in or beside top-10% cells; baseline is **35%** | Show school exposure, without claiming health harm |
| Vulnerability + low 311 reporting | Report rates are lower in several vulnerable groups | Flag possible under-reporting, not fewer rats |
| Somerville + Cambridge + Boston | Rats cross borders, but reporting systems differ | Compare trends with a clear caveat |

## 7. Findings we should not overstate

| Tested idea | Result | Video rule |
|---|---|---|
| Heavy rain | No association detected in tested windows | Do not call rain a driver |
| Snow | No association detected in tested windows | Do not call snow a driver |
| Demolition permits | No post-work spike | Show only as case context |
| Red Sox home games | No association detected in tested windows | Leave out |
| Holiday trash delays | No rodent-report association detected | Leave out |
| Restaurants and food licenses | No predictive link | Use only for citations and context |
| Big Belly bins | No association detected in tested analysis | Leave out |
| Asthma | Negative adjusted link | Do not claim a health effect |
| Fire incidents | No adjusted link | Leave out |
| iNaturalist sightings | Weak agreement with 311 | Do not use as a core signal |

## 8. Limits the video must state

- Count **reports**, never rats.
- A closed case is not a lasting fix.
- More reports can mean easier reporting.
- Correlation does not prove a cause.
- Three cities use different reporting systems.
- The **$776K** spend is a lower bound from vendor-name matching.
- Recommendations and an approval/work-order flow remain unfinished.
- The current interface supports review; it does not dispatch a civic action.

## 9. Best video sequence

1. Show **5,321 reports** and **99% closed**.
2. Click one site that returned many times.
3. Reveal its trash, ticket, season, and history overlap.
4. Show **8–12% versus 56–75%** return risk.
5. Show the **1.03** matched-study result.
6. End on a reviewed place and its supporting records.
7. Describe field follow-up and a matched trial as future work; do not stage them as shipped screens.

## 10. Source map

| Claim group | Main record |
|---|---|
| Product counts and pitch | `knowledge/15_boston_rat_audit.md` |
| Tested signals and nulls | `.kiro/specs/rat-audit/data-audit.md` |
| Product data flow | `.kiro/specs/rat-audit/design.md` |
| Product rules | `.kiro/specs/rat-audit/requirements.md` |
| Civic CSV list and row counts | `data/civic/CATALOG.md` |
| Exact snapshot fields and URLs | `data/civic/datasets/<name>/README.md` |
| Spend cross-check | `knowledge/19_rat_data_validation.md` |

**Final closing line:** Piper brings scattered reports together for an inspector to review.
