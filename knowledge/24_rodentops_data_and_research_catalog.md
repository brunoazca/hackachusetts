# RodentOps: usable data, public code and research

Checked **October 24, 2026**. Companion to [government and public voices](25_rodentops_government_and_public_voices.md). This catalog expands the [earlier resource audit](sources/artifacts/rodent_resource_audit.json) and [public-code inventory](22_public_data_and_repositories.md); it does not imply every source is production-ready or appropriate to combine.

## 1. What to use first

**Minimum useful tool:** Boston yearly 311 records, documented closure notes, carefully reviewed links to nearby sanitation/building records, and collection schedules. Everything else should earn its place by helping answer a specific inspection question.

The new [machine-readable audit](sources/artifacts/rodentops_expansion_audit.json) covers **10 Boston catalog packages containing 35 resource entries**, including historical files and dictionaries. It records schemas and bounded samples for active DataStore resources, plus NYC inspection metadata/counts and a three-day NOAA CSV probe. The [inventory CSV](sources/artifacts/rodentops_expansion_inventory.csv) contains **resource metadata**, not 35 cleaned datasets or a mirror of individual records. No complaint text, addresses or owner values were retained in these new audit artifacts.

Verification levels used below:

- **Direct probe:** endpoint response, fields and stated count inspected; typically only three individual rows inspected, then discarded.
- **Prior audit:** repeatable evidence already saved in this repo; not all probes repeated today.
- **Source read:** documentation, paper or presentation read; no usable dataset established.
- **Lead:** useful source identified but a required access, schema, license or interpretation check remains.

## 2. Boston sources: identifiers, grain and practical use

### A. Reports and documented actions

| Source | Data and verification | Proposed use | Essential limitation |
|---|---|---|---|
| [311 yearly tables](https://data.boston.gov/dataset/311-service-requests) | 2026 resource `1a0b420d-99f1-4887-9851-990b2a5a6e17`; 2025 `9d7c2214-4709-478a-a2e8-fb2020a5bb94`. Prior audit found **5,321** exact `Rodent Activity` rows in 2026 through Oct 23. Fields include case ID, open/close dates, category, status, closure note and location | Evidence timeline; possible repeat-report groups; extract documented actions | A report is not a rat count or independently verified condition; a closure is not proof of resolution |
| Newer 311 table | Resource `254adca6-64ab-4c5c-9fc0-a6da622be185`; exact `service_name='Rodent Activity'` query returned zero in the prior audit; broader search found differently categorized records | Supplementary trash signals after taxonomy review | Zero for one label does **not** prove no rodent-related content. Cross-system duplicate/ID relationships not validated |
| [RentSmart](https://data.boston.gov/dataset/rentsmart) | Current resource `dc615ff7-2ff3-416a-922b-f0f334f085d0`; **377,910 rows**, Oct 24 update. `date`, `violation_type`, `description`, `parcel`, location and property attributes | Housing context and property-linked history | Combines underlying sources including 311/ISD. A repeated event here is not independent corroboration. Historical companion files are older snapshots |
| [Public Works violations](https://data.boston.gov/dataset/public-works-violations) | `90ed3816-5e70-443c-803d-9a71f44470be`; **927,932 rows**, Oct 24. `case_no`, `ticket_no`, `status_dttm`, `status`, `code`, `value`, `description`, `sam_id`, coordinates | Show documented sanitation enforcement next to a complaint | Citation, amount, disposition, payment and remediated condition are different facts. A ticket is not a verified collection failure |
| [Building/code violations: checked resource](https://data.boston.gov/api/3/action/datastore_search?resource_id=800a2663-1d6a-46e7-9356-bedb70f5332c&limit=0) | Resource `800a2663-1d6a-46e7-9356-bedb70f5332c`; schema inspected in prior audit | Relevant repair or building-condition questions | Not a complete private pest-treatment record; identifiers need reconciliation |

Use dataset plus case ID as the source key. Keep `observed_at`, `reported_at`, `action_recorded_at`, `closed_at` and `retrieved_at` distinct where available. Do not fabricate observation dates from report dates.

### B. Waste, food and service logistics

| Source | Directly checked data | Proposed use | Essential limitation |
|---|---|---|---|
| [Food establishment inspections](https://data.boston.gov/dataset/food-establishment-inspections) | `4582bec6-2b4f-4f9e-bc55-cbaa73117f4c`; **906,503 rows** at this probe, Oct 24 metadata update. `licenseno`, `result`, `resultdttm`, `violation`, `violdesc`, `viol_status`, `comments`, `property_id`, `location` | Show an actual cited condition, date and status when relevant | Rows include violation-level detail; 906,503 is **not** the number of unique inspections or restaurants. Rodent/mouse keywords do not establish closure, infestation or lost revenue |
| [Active food licenses](https://data.boston.gov/dataset/active-food-establishment-licenses) | `f1e13724-284d-478c-b8bc-ef042aa5b70b`; **3,357 rows**, Oct 24. `property_id`, business/address fields, license category/status, coordinates | Place/context lookup; review a candidate property match | This resource's checked schema lacks `licenseno`; do not assume a direct license-number join. A licensed kitchen is not evidence of poor sanitation |
| [Trash schedules by address](https://data.boston.gov/dataset/trash-schedules-by-address) | `fee8ee07-b8b5-4ee5-b540-5162590ba5c1`; **399,176 rows**, Oct 18. `sam_address_id`, `full_address`, `trashday`, `recollect`, `pwd_district`, `x_coord`, `y_coord` | Show relevant service day and source beside a reported timing concern | Schedule is not actual pickup time; holidays, eligibility and exceptions need the current service lookup. Coordinate CRS must be confirmed before mapping |
| [Street sweeping schedules](https://data.boston.gov/dataset/street-sweeping-schedules) | `9fdbdcad-67c8-4b23-b6ec-861e77d56227`; **3,758 rows**, Oct 24. Street segment, side, time, weekday/week flags and seasonal indicators | Help a staff member coordinate a possible cleanup with existing service windows | Scheduled service does not prove it happened. Address-to-segment matching and season rules require validation |
| [Big Belly locations](https://data.boston.gov/dataset/big-belly-locations) | `15e7fa44-b9a8-42da-82e1-304e43460095`; **543 rows**; resource last-modified **December 11, 2016** | Historical context or a lead for a current inventory request | **Do not use as current bin coverage or a proven protective factor.** Public page availability does not make the inventory current |

Food-inspection totals changed from the earlier audit's 906,288 to 906,503. Preserve the retrieval time; do not silently replace an older query's denominator or describe the discrepancy as an error without checking updates.

### C. Buildings, land and environmental context

| Source | Access/verification | Proposed use | Essential limitation |
|---|---|---|---|
| [Property assessment](https://data.boston.gov/dataset/property-assessment) | FY2026 `ee73430d-96c0-423e-ad21-c4cfb54c8961`; earlier work inspected parcel/property attributes | Building type, age, units and a candidate parcel relationship | Preserve parcel IDs as text and leading zeros. Assessment year matters. A common mailing address is not proof of common beneficial ownership |
| [Building permits](https://data.boston.gov/dataset/approved-building-permits) | `6ddcd912-32a0-43df-9908-63574f8c7e77`; schema previously inspected, more fields than starter sample | Nearby permitted work as a question for review | Approval is not actual start/completion, and proximity does not prove construction displaced rats |
| [DND-managed property inventory](https://data.boston.gov/dataset/dnd-managed-city-property-inventory-all) | `93481af5-81ed-4850-a637-baf6e83eed43`; **1,340 rows**, `PARCELID`, geometry and property fields; resource dated **December 11, 2016** | Historical parcel context only | Not current ownership, vacancy or responsibility. Do not route work automatically from this inventory |
| [Park features](https://data.boston.gov/dataset/park-features) | `4d28fc98-c503-4065-987f-9fbc41947fc4`; **1,788 rows**, Oct 18. `Park_Name`, `OS_ID`, `Asset`, `asset_deta`, use fields, WKT and coordinates; GeoJSON also cataloged | Name a nearby public-space asset and ask an appropriate inspection question | Not a current bin-condition inventory, rat survey or complete maintenance log. Confirm geometry and asset meaning |
| [Boston rainfall catalog](https://data.boston.gov/dataset/rainfall-data) | Catalog points to [BWSC rainfall interface](https://www.bwsc.org/environment-education/rainfall-garden), **not a checked CSV/API** | Potential local-gauge context | Download/schema/license unresolved; do not claim integration readiness |
| [NOAA Logan daily summaries](https://www.ncei.noaa.gov/cdo-web/datasets/GHCND/stations/GHCND%3AUSW00014739/detail) | Station `USW00014739`; direct CSV query for Oct 1–3, 2026 returned three dates with precipitation, max/min temperature and wind values | Optional daily context; later season/weather adjustment | Airport conditions are not block conditions; date alignment, quality flags and reporting lag matter. Weather does not establish the cause of a complaint |
| [Climate Ready Boston social vulnerability](https://data.boston.gov/dataset/climate-ready-boston-social-vulnerability) and MassGIS EJ polygons | Prior public-resource audit inspected geography absent from the starter CSV | Audit whose neighborhoods are represented; plan accessible outreach | Area-level characteristics are not personal attributes or infestation labels. Reporting access can bias apparent demand |
| [Census ACS](https://api.census.gov/data.html) | Earlier Suffolk query did not establish usable access in this environment | Population/household denominators if verified later | Do not substitute a failed query with invented population values; parcel records are not households |
| [CDC PLACES](https://data.cdc.gov/resource/cwsq-ngmh.json?stateabbr=MA) | Earlier team work reports a successful API read | Broad contextual research only | Modeled tract-level health estimates cannot attribute illness to rats or justify an individual/address risk score |

The nine non-rainfall Boston packages in this new audit advertise **ODC-PDDL** in catalog metadata; the rainfall package's license field was blank. Catalog licensing does not automatically settle reuse of attached photographs, embedded personal narratives or third-party media. NYC/Cambridge terms should be checked separately; our repository's MIT license does not relicense external material.

## 3. Other-city and research datasets

### Cambridge: real device observations, separate jurisdiction

The prior [rodent-resource audit](sources/artifacts/rodent_resource_audit.json) checked:

- [Smart Rat Boxes](https://data.cambridgema.gov/Inspectional-Services/Smart-Rat-Boxes/78bs-b5ig): **528 records** at the live probe. Device/deployment rows include monthly observations and location fields; they are not necessarily 528 unique devices.
- [Rodent sightings](https://data.cambridgema.gov/Inspectional-Services/Rodent-Sightings/uz4w-baz5): **5,188 all-time records** at the probe, not 2026-only incidence.
- [Harvard workshop repository](https://github.com/harvardinformatics/llm-workshop-smart-rat): July snapshots contained 512 device/deployment rows, 428 serial values and two missing latitudes; the complaint snapshot had 4,973 rows. It does not supply the installation dates/uptime required for a valid exposure-adjusted comparison.

The workshop is a useful schema and exercise reference. Its license file contains conflicting Creative Commons variants; **do not call it MIT or copy it as unrestricted software**. The prior audit retains the discrepancy. A zero monthly count can mean no catches, no observation, downtime or a not-yet-observed month. Box/Pipe methods are different. Do not rank a location as “safe” from zeros, compare devices with unknown operating days, or relabel Cambridge records as Boston data.

### New York City: an actual inspection-outcome schema

[NYC Rodent Inspection](https://data.cityofnewyork.us/Health/Rodent-Inspection/p937-wjvj/about_data), dataset `p937-wjvj`, responded successfully to metadata, three-row and count queries. The count was **3,143,438 rows**. Returned fields included `job_id`, `inspection_type`, `inspection_date`, `result`, borough, block, lot and address components. Available fields and missingness vary by record; see the saved metadata rather than assuming every location is geocoded.

Use it to study how a real workflow distinguishes inspection type and result. Keep repeat visits linked to a job/property instead of treating each row as an independent infestation. The [official mitigation-zone report](https://a816-dohbesp.nyc.gov/IndicatorPublic/data-features/rat-report/) distinguishes proactive and complaint-based inspection and describes cross-agency work. This is a useful evaluation template. Different inspection mixes, jurisdictions and sampling prevent a simple Boston-versus-NYC success comparison.

**MVP choice:** keep NYC in the research appendix or an explicitly separate sandbox. It is not Boston ground truth and should not train a Boston “risk” score without a separate validation project.

### Scientific data with genuine reuse paths

- [Dryad: Richardson et al. rat trends](https://datadryad.org/dataset/doi:10.5061/dryad.3xsj3txrq): deposited December 24, 2024, accompanying the 2025 Science Advances paper. The landing page exposes a 716-byte README and a 13.68-KB XLSX with data and metadata sheets. This is a small published analysis dataset, **not an established stream of raw municipal daily records**; workbook contents were not inspected after the download link failed in the web tool. [Dryad terms](https://datadryad.org/terms) describe published datasets under CC0; cite the DOI and verify file-specific metadata when importing.
- [Santa Cruz research data/code](https://github.com/ishana-s/Invasive_Rats_Refuse): public repository accompanying the refuse study below. Prior inspection found CSV/R analysis material but no resolved repository license. Useful methodological reference; unresolved reuse permission should be resolved before incorporating code.
- [Boston Leptospira paper](https://journals.plos.org/plosntds/article?id=10.1371/journal.pntd.0012966): supplementary genotype data and [NCBI BioProject PRJNA1080226](https://www.ncbi.nlm.nih.gov/bioproject/PRJNA1080226) are genuine research resources. **Do not add genomics to the MVP**: it cannot establish today's exposure or health risk at a reported address.
- Vancouver complaint narratives and the Japan waste-container study's raw field data are **not openly downloadable datasets**. Their papers explain access restrictions/request procedures. Public articles do not imply public underlying records.

## 4. Research that changes our design

These are primary research/public-health sources. The “use” column is our inference, not an author endorsement of RodentOps.

| Research | What was studied / available | Use for this tool | What it cannot establish |
|---|---|---|---|
| [Richardson et al., Science Advances, 2025](https://doi.org/10.1126/sciadv.ads6782) | Long-term complaint/inspection trends across 16 cities; accompanying Dryad data above | Preserve time coverage, reporting-system changes, weather/season and density as interpretation concerns | A validated block forecast, current rat population or causal weather effect on a single report |
| [Lee et al., PLOS ONE, 2024: resident motivations](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0296920) | Vancouver complaint narratives, 2014–2020; study authors cannot redistribute underlying municipal records | Extract the requested remedy and process barrier as well as the sighting; a complaint can express a wider neighborhood concern | Representative Boston preferences, a public narrative training corpus, or a universal relationship between income and reporting |
| [“Risk metrics, not rat metrics,” 2025](https://wildlife.onlinelibrary.wiley.com/doi/10.1002/jwmg.70052) | Conceptual argument for measuring consequences and management goals | Define success with users: usable space, verified repair, response clarity, effort and follow-up | A ready-made validated harm score or calibrated weights for Boston |
| [Municipal rat-management policy study, 2022](https://www.tandfonline.com/doi/abs/10.1080/07352166.2022.2091995) | Comparative municipal-policy research; interview transcripts not publicly released | Include organizational responsibilities and sustained management in the design | A downloadable interview corpus or proof of Boston's present internal process |
| [Santa Cruz refuse study, PLOS ONE, 2024](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0308917) | Camera observations around a campus setting before/during a major change in human activity; public companion repo | Capture waste conditions and observation effort; distinguish observation from explanation | A treatment effect transferable to Boston alleys or a calibrated waste-to-rat equation |
| [Urban rat movement review, 2019](https://www.frontiersin.org/journals/ecology-and-evolution/articles/10.3389/fevo.2019.00013/full) | Review of movement and ecological context | Treat distance, barriers and shared spaces as review aids; permit a human to split a suggested group | A universal 100-metre colony boundary or proof two nearby reports concern the same animals |
| [Boston Leptospira study, PLOS NTD, 2025](https://journals.plos.org/plosntds/article?id=10.1371/journal.pntd.0012966) | Selected rats from 17 sites, 2016–2022, with genetic/pathogen analysis | Explain why prevention and professional public-health coordination matter | Citywide prevalence, a resident diagnosis, current site risk or disease attribution from 311 |
| [Shimamura and Takeshita, Journal of Urban Ecology, 2026](https://academic.oup.com/jue/article/12/1/juag001/8467206) | 774 short count sessions at waste sites in a Japanese district; associations with collection method, damage and gutters; raw data available only by request | Ask about container condition and physical setting; record how and when observations were made | A Boston bin-design ranking or proof one material causes rats. Different visibility methods can affect detection |
| [CDC: neighborhood rat-control program, 2012](https://www.cdc.gov/mmwr/preview/mmwrhtml/mm6137a1.htm) | Repeated property inspections in a 2007–2009 NYC program; observable signs and conditions recorded | Use a structured professional observation form and repeatable follow-up method | The program's reported reduction as our projected impact; the report lacks a comparable concurrent neighborhood control |

The CDC inspection approach suggests fields for **observed / not observed / not assessed** signs such as tracks, droppings, burrows, runways/rub marks, gnawing and live animals. “Not observed during this visit” is narrower than “absent.” Professional review is necessary; the tool should not diagnose signs from an unvalidated photo model or recommend pesticide choices/doses.

## 5. Public code worth studying

The broader [repository inventory](22_public_data_and_repositories.md) already checks 22 GitHub paths and actual license files for selected projects. Favor components that support a clear feature instead of importing a large unrelated application.

| Repository | Useful pattern | Reuse boundary |
|---|---|---|
| [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js) | Optional evidence map with selectable records | Inspected license has BSD-style three-clause terms; API metadata said `NOASSERTION`. Map-data/style/tile terms are separate |
| [FixMyStreet](https://github.com/mysociety/fixmystreet) | Public issue lifecycle, location, categories and authority routing | AGPL obligations require attention if code is incorporated; study the workflow without transplanting the full system |
| [Cambridge GIS data](https://github.com/cambridgegis/cambridgegis_data) | Open spatial-file organization and download patterns | Confirm licensing per dataset; data is Cambridge-specific |
| [Harvard smart-rat workshop](https://github.com/harvardinformatics/llm-workshop-smart-rat) | Small device/complaint examples and analytical questions | Conflicting license text and missing exposure dates; reference only until resolved |
| [Invasive Rats / Refuse](https://github.com/ishana-s/Invasive_Rats_Refuse) | Reproducible ecological-analysis structure | License unresolved; external study assumptions do not become Boston model parameters |
| [City of Boston OpenContext](https://github.com/CityOfBoston/OpenContext) | Existing municipal context/knowledge work | Inspect actual capabilities before claiming a new institutional knowledge layer; metadata is not a quality/security audit |

No downloaded repository code was executed. A public GitHub repository without a clear license is not automatically free to incorporate. Our MIT project license applies to our own work, not every linked dataset or source.

## 6. Join design: the hard part is identity and provenance

Suggested internal model, **not yet an implemented database**:

| Entity | Minimum fields | Why |
|---|---|---|
| `source_record` | source dataset/version, source ID, URL, retrieval time, original category, original event/status timestamps | Traceability and a reproducible snapshot |
| `location_match` | candidate address/parcel/segment, method, confidence, reviewer, accepted/rejected status | Prevent a fuzzy match from becoming an asserted property relationship |
| `evidence_group` | member records, grouping reason, time/distance parameters, reviewer edits | A suggested group of reports is not a biological colony |
| `observation` | report versus inspection versus sensor, condition, observed/reported time, uncertainty, source references | Keep distinct measurement methods visible |
| `documented_action` | action text, actor role if stated, action date if stated, evidence reference, unknown fields | Closure date alone does not establish treatment date or completion |
| `proposed_task` | question/action, proposed responsible role, human approval, due date, status | Make review and handoffs explicit |
| `follow_up` | visit/response time, method, condition observed, unresolved issue, evidence | Separate checking a condition from closing a ticket |
| `coverage` | dataset freshness, missing location, missing time, duplicates, sensor uptime if known | Expose when a chart cannot support a conclusion |

Join rules:

1. **Do not equate identifier names.** `sam_id`, `sam_address_id`, `property_id`, `parcel`, `PID` and `PARCELID` may refer to different entities. Validate dictionaries and a small set of manual matches before implementing a crosswalk.
2. **A property is not necessarily a building, dwelling unit, business or service address.** Preserve one-to-many relationships; food records may contain several violations per visit and several establishments per property.
3. **Coordinates need a known CRS.** Longitude/latitude and projected `x_coord`/`y_coord` cannot be plotted interchangeably. Reject implausible Boston bounds rather than silently moving points.
4. **Use exact IDs before text.** Preserve source namespaces. Address normalization can propose a match; it should not remove unit/building ambiguity. “Nearby” must show its distance rule.
5. **Deduplicate derived sources.** A 311 event appearing in RentSmart is one event with two representations. When lineage is unavailable, show possible overlap and avoid summed corroboration counts.
6. **Keep time windows explicit.** Do not compare a full year with a partial year as an annual rate. Show right-censoring when a recent action has fewer than the proposed 30/60 follow-up days.
7. **Absence is not zero.** No public record, no sighting during a visit, no sensor signal and an offline sensor are different states.

For a public snapshot or demo, remove contact emails, phone numbers and unnecessary names from free-text notes; keep source IDs and links for provenance. Public closure notes can contain staff contact details. Do not send entire unfiltered narratives to an external model merely because the data is public.

## 7. Features that go beyond a map, ranked for this hackathon

| Priority | Feature | Inputs available now | What must be shown honestly |
|---|---|---|---|
| 1 | **Case reconstruction:** reconstruct the sequence across a recurring location | 311, closure notes, carefully matched enforcement/history | Every sentence cites an event; original notes remain accessible; group can be split |
| 2 | **Next best question:** suggest the most useful missing observation | Gaps in that sequence plus a professional checklist | A question for the inspector, not a diagnosed root cause |
| 3 | **Follow-up brief:** assemble observations, proposed tasks and responsibilities | Reviewed records and manual staff inputs | Draft/approved states; no automatically issued notice or external message |
| 4 | **Collection context:** show relevant waste-service schedule | Current trash/sweeping tables | Schedule versus actual collection, location-match confidence, exception warning |
| 5 | **Shared-space coordination:** one reviewed alley/block example | Nearby reports, building/public-space context | Proposed reviewing roles; no automatic attribution of fault |
| 6 | **Coverage-aware pilot notebook** | Schema can be built; Boston raw telemetry and intervention dates missing | Demo entries explicitly synthetic if used; no estimated treatment effect |
| 7 | **Bin feasibility assistant** | Service information plus human-entered physical observations | Candidate checklist, not authoritative siting or an unsupported engineering simulation |
| 8 | **Equity/coverage audit** | Reporting distribution and verified geographic denominators | Identify evidence gaps, never label low-reporting areas rat-free |

**Creative centerpiece:** display two columns, “What the records establish” and “What the next visit should resolve.” After a human edits the second column, produce a one-page brief with sources, the proposed reviewing role and a follow-up date. This is useful even when the model cannot determine the cause.

For the three-minute demo, choose **three evidence groups in one neighborhood** with manual checks, not a statewide predictive system. An explicitly empty/missing-data example demonstrates restraint and is more persuasive than an invented answer.

## 8. Measurement: prove a useful tool before claiming ecological impact

### Feasible today

- Manually review a small, documented set of source records. Measure whether the draft preserves dates, actions, uncertainty and source links accurately; report the sample size and all failures.
- Time the same briefing task with and without the tool, if team members can do a balanced comparison. Label it an internal usability exercise, not measured municipal savings.
- Count unsupported claims, mistaken joins, duplicate events and edits needed. A polished narrative with incorrect attribution fails.
- Verify the human approval step, source-opening links, missing-data behavior and snapshot/offline fallback.

### Requires a real pilot

- Field-confirmed condition change, sustained repair, response clarity, staff workload and resident experience.
- An intervention evaluation needs actual treatment/start dates, comparison sites or a credible alternative design, observation effort, maintenance/downtime, season/weather, reporting changes and adequate follow-up.
- A raw 60-day pre/post report difference is descriptive. Regression to the mean, changing reporting, seasonality, targeted treatment and incomplete follow-up can explain it. It is not an estimate of rats removed or action effectiveness.
- Keep complaint-based and proactive inspections separate. More inspections can produce more findings even when management improves.

## 9. Missing data that would materially improve the tool

This is a prioritized future access list, not requests that have been sent.

| Missing source | Why it matters | Safe fallback now |
|---|---|---|
| Boston sensor observations, uptime, moves and calibration | Distinguish activity from device/coverage changes | Mark unavailable; use Cambridge only in a separate sandbox |
| Intervention start/end, method, service and maintenance logs | Establish exposure and a meaningful follow-up window | Extract only what a public note actually states |
| Field inspection IDs, observations and linked repeat visits | Separate investigation, action and verified condition | Preserve 311 notes as administrative evidence |
| Current container inventory, condition and service responsibility | Feasibility and task routing | Manual checked site example; exclude stale 2016 inventory from current ranking |
| Actual collection completion and exception logs | Test reported schedule/collection mismatch | Show schedules only |
| Current sewer/catch-basin condition and maintenance | Useful infrastructure referral context | Ask a reviewing agency; do not invent public underground-network data |
| Agreed agency/contractor ownership crosswalk | Confirm who can act on shared spaces | Human-selected proposed role |
| Representative community feedback and completed follow-up | Understand accessibility, burden and outcome | Clearly labeled qualitative themes |
| Costs and work orders | Estimate actual resource use | Report measured demo task time, not hypothetical dollars saved |
| Current app/workflow interview with an inspector | Validate product fit and avoid duplicating internal software | Present differentiation as a hypothesis |

## 10. Corrections this expansion requires in earlier notes

- “All public signals explain rats” is too strong. They supply observations and context for inspection.
- A lower correlation for missed pickups does not place responsibility on residents or owners. ZIP-level associations cannot establish causes or assign blame.
- An address recurring after closure does not prove an ineffective visit, the same infestation or a negligent actor.
- Common owner mailing addresses can reflect agents and administrative arrangements. They are not proof of a hidden ownership portfolio; do not label “bad landlords” from these counts.
- Food keyword matches do not count unique inspection failures, business closures or economic losses.
- Maps, analytics and planned public dashboards already exist in this policy area. Do not claim our tool is the first shared layer the City has ever had.
- Big Belly and DND inventory resource dates are 2016. A live catalog page is not current ground truth.
- A research paper being open access does not make its underlying data open; a repository's presence does not establish a software license.

## 11. Reproduction and sources

Run from the repository root:

```bash
python3 -B knowledge/sources/scripts/audit_rodentops_expansion.py
```

The [script](sources/scripts/audit_rodentops_expansion.py) uses bounded public GET requests and the existing local audit helper. It saves response status, URL, hash, catalog metadata, field lists, counts and aggregate missingness for tiny samples. It does not perform a full-data quality audit, establish joins, authenticate to private systems or execute downloaded code.

- [Expansion audit JSON](sources/artifacts/rodentops_expansion_audit.json)
- [Resource inventory CSV](sources/artifacts/rodentops_expansion_inventory.csv)
- [Media review audit](sources/artifacts/rodentops_media_audit.json)
- [Earlier Boston/Cambridge rodent audit](sources/artifacts/rodent_resource_audit.json)
- [Earlier public-resource and repository audit](sources/artifacts/public_resource_audit.json)

All substantive public sources are linked beside the relevant claim. Counts are dated observations. Raw municipal records, full third-party PDFs and complete transcripts are not redistributed by this expansion. The remaining verification gaps are part of the research result, not completed integrations.
