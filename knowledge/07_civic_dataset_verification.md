# Civic starter datasets: verified contents and integration decisions

Audit date: **October 24, 2026**. Source: [organizer-linked Civic starter ZIP](https://hackachusetts2026.vercel.app/kits/tracks/civic.zip). Its per-dataset READMEs say the extracts were saved **October 18**. A save date is not the observation date of every record.

All 22 CSVs were downloaded and parsed locally. The machine-readable [audit](sources/civic_dataset_audit.json) records columns, row counts, blank cells, date ranges, source URLs from the kit, and SHA-256 hashes. The [audit script](sources/audit_civic_kit.py) can reproduce these checks from the ZIP. Included `fetch.py`/`fetch.js` files were not executed.

**This verifies the delivered files, not their completeness against the original databases or live API access.** No application database or ingestion pipeline has been provisioned. The public source links and the local snapshot should be separate parts of the data contract.

**Later research:** [document 10](10_public_data_and_repositories.md) verifies additional public responses, including MBTA identifiers/relationships, Cambridge ramp geometry, Bluebikes feeds, MassGIS GEOID/polygons and fuller Boston schemas. Those findings expand what a project could obtain; they do not add the omitted columns to these starter CSVs.

## 1. Decisions the audit changes

1. **311 is usable for a small descriptive brief.** It contains exactly 5,000 records spanning October 8–18, not a year of service performance. It omits identifiers and closing dates needed for case-level follow-up and resolution-time calculations.
2. **Neighborhood joins need explicit handling.** Bay Village and Leather District occur in 311 but are absent as separate entries in the population table. Harbor Islands has no numeric estimates. Do not silently discard or redistribute those rows.
3. **A transit product needs additional data.** The route table contains eight rail/light-rail routes; stations have no coordinates or stable MBTA stop IDs. Snapshot alerts lack active-period fields.
4. **Permitting delay is not measurable from these files.** Issued dates and approved records are not application histories. Parking permits are a different subject from the supplied building permits.
5. **Some “current” downloads contain old observations.** Numina ends in April 2021, Bluebikes is November 2024, Broadway counter data ends June 2024, and Fresh Pond is 2024.

## 2. All 22 files, inspected

Date ranges below are the observed values in the CSV, not an assurance that every interval is complete. ISO-style values were compared lexically; they were not normalized across time zones. Exact schemas and missingness are in the JSON.

| Dataset | Actual rows | Observed period / scope | Immediate implication |
|---|---:|---|---|
| Boston 311 | 5,000 | 2026-10-08 07:34 UTC through 2026-10-18 10:15 UTC | Bounded recent slice; neither boundary day is complete |
| MBTA alerts | 130 | Update dates Apr 28–Oct 18, 2026 | Updates do not identify when alerts apply; snapshot is not live service status |
| MBTA routes | 8 | Rail/light rail only | No bus network, schedules, or trips |
| MassGIS MBTA stations | 170 | Station/line/route text | No geometry or stable stop identifiers in the CSV |
| MassGIS environmental justice | 2,604 | Every row has `ej=Yes`; underlying layer EJ2020 | Not all block groups; no GEOID or geometry in the extract |
| FEMA declarations | 415 | Jun 11, 1953–Jun 30, 2026 | Rows include geographic designations; not 415 independent disasters |
| Approved building permits | 8,240 | Jan 1, 2024–Oct 16, 2026 issuance | No application/submission date or rejected applications |
| Boston neighborhood estimates | 24 | 2025 estimates for 23 rows; Harbor Islands blank | Preserve missing estimates; do not substitute zero |
| Property/building violations | 2,018 | Jan 2, 2024–Oct 16, 2026 status date | Status changes do not equal incident dates or a full case history |
| College Scorecard MA | 140 | Kit identifies Oct 15, 2026 release; indicators cover their own cohorts | Publication date does not make all measures current-year outcomes |
| O*NET occupations | 1,016 | Kit identifies database 30.0 | Occupation descriptions, not current jobs or vacancies |
| IPEDS MA | 144 | HD2024 directory | Institution IDs are useful; program availability is absent |
| OpenAlex works | 500 | 2024, selected most-cited works | Selected bibliography, not representative research output or a complete campus inventory |
| MassGIS colleges | 206 | Campus/location records | Campus count differs from institution count; no UNITID field |
| Bluebikes | 63,063 | Station-pair aggregates for Nov 2024 | Rows are pairs, not trips; sum `trips` for trip totals |
| Boston Vision Zero | 44,986 | Jan 1, 2015–Sep 1, 2026 | City crash-response records; not the same dataset as MassDOT police crash reports |
| Cambridge crashes | 17,230 | Jan 1, 2015–Sep 30, 2026 | 8,352 records lack both coordinates; map coverage is incomplete |
| Cambridge bicycle counts | 92,268 | 2018–2024; five distinct years, 15 dates | Count observations at sampled times/places, not continuous citywide traffic |
| Broadway Eco-Totem | 17,123 | Jan 1–Jun 30, 2024 | One counter and a finite period; not current citywide cycling |
| Fresh Pond usership | 8,784 | Jan 1–Dec 31, 2024, hourly labels | Sensor observations at named entrances; verify units before aggregation |
| Somerville counts | 2,532 | 2010–2025, 16 distinct years | Sampling locations and periods matter for comparisons |
| Boston Numina | 245,555 | Jul 10, 2020–Apr 30, 2021 | Historic counts across sensor zones; no citywide or real-time claim |

Each dataset's original request URL is preserved in [the audit JSON](sources/civic_dataset_audit.json) under `source_urls_from_kit_readme`. Fetch requests often return only 25, 50, or 100 records, or a differently shaped original file. **Running a kit fetcher is not guaranteed to reproduce the supplied CSV's size, column names, or transformations.**

## 3. Findings that should become visible product behavior

### A. 311: status, coverage and geography

Observed status values and counts:

| Value | Rows |
|---|---:|
| Closed | 3,421 |
| In progress | 1,574 |
| Needs Reallocation | 2 |
| Create | 2 |
| Error | 1 |

Do not force this into a binary closed/open model without a documented decision. `on_time` has `ONTIME` and `OVERDUE`; it is the source's administrative flag, not a measured resident outcome. No closing timestamp is present. Seven rows have no neighborhood, ten have no ZIP, and three have no assigned department.

An exact neighborhood-name match against the estimates table leaves **38 unmatched rows**: Bay Village 26, Leather District 5, and blank 7. The other 4,962 rows match a name. This does not prove the boundaries are identical. A reviewed crosswalk is needed for any regrouping; a “matched/unmatched” display is sufficient for a first descriptive demo.

For a one-day prototype, use one service category, label the supplied period, and avoid trend or inequity claims. If restricting to interior calendar days, determine the timezone first and label that selection; it still does not prove source completeness. Keep calculations in code/SQL and pass their results to the language model for explanation.

**Unsupported:** repeat-complaint deduplication, address-level hotspots, following an individual ticket, resolution duration, determining whether an infestation exists, or asserting that administrative closure solved the resident's problem. The required fields are absent.

### B. Permits and violations: a context join, not a property linkage

The permits CSV omits street address, coordinates, applicant, and application date. The violations CSV also omits address/coordinates. There is no verified shared property identifier between them. ZIP and ward can support cautiously labeled aggregate context; they cannot prove a particular permit and violation concern the same building.

There are **364 missing permit expiration dates** and three missing descriptions. `sq_feet` and money fields need numeric validation beyond blank-string checks. A zero or malformed value should not become a confident cost-per-square-foot calculation.

Do not use historic issued building permits to infer current resident-parking requirements, code compliance, or approval eligibility. For a preparation navigator, retrieve and cite the exact current official service instructions as a separate evidence source.

### C. Transit: why snapshot alerts are insufficient for a live promise

The alert CSV contains only `updated`, `effect`, `severity`, `routes`, and `header`. It omits alert ID, active periods, full informed entities and stop relationships. Its 130 rows differ from the supplied live request's 50-row limit. The stations table contains text labels only. A route-name match needs a reviewed mapping and can miss alerts unrelated to the eight supplied routes.

**Minimum live validation:** bounded official API request, checked response schema, stable route/stop IDs, active times, coverage notice and retrieval time. An offline demo may instead replay a clearly dated example. Neither the existence of an API URL nor a successful HTTP HEAD check establishes a working transit integration.

### D. Colleges: one verified join and several missing measures

Exact string matching on `unitid` yields **135 shared IDs** between 140 Scorecard and 144 IPEDS records. There are five Scorecard-only IDs and nine IPEDS-only IDs. Both files' IDs are unique within their delivered tables. Retain unmatched records; do not trim long IDs or force a join by similar names. The differing release years and units of reporting require investigation before a full merge.

Missing Scorecard values include **69 admission rates**, **55 costs**, and **47 in-state tuition figures**. Public/private net-price fields have structural applicability differences. Empty values are not free tuition, zero earnings, or zero admissions. The blank-cell audit does not identify every suppression code or invalid numeric value.

For a career pathway, these sources support institution context and occupation descriptions. Add current provider pages to establish a real program and next step. Do not promise job availability, admissions, financial aid, or individual earnings from these aggregates.

### E. Crash and count data: maps need a coverage statement

Cambridge crashes lack coordinates in **8,352/17,230 rows (48.5%)**. A plotted map would represent only the geocoded subset unless additional location work is performed. Boston Vision Zero has nonblank coordinates throughout this extract, but **23,461 street values are blank**; nonblank coordinates still need geographic validation and do not establish positional accuracy.

Cambridge bicycle counts have **3,060 blank counts**. Some crash indicator fields are blank for most records; do not automatically interpret blank as “no cyclist” or “no pedestrian” without a data dictionary. Different crash systems, observation periods, travel volumes and reporting rules make direct raw-count comparisons misleading.

The EJ table contains only flagged areas and lacks geometry/identifiers needed for a spatial join. A municipality-name match cannot establish which crash occurred in which block group. Add authoritative boundaries/GEOIDs and validate the join before making an environmental-justice comparison.

## 4. Suggested data contract for the prototype

Document the following with the committed application snapshot when the product is selected:

```text
source_name and authoritative_url
snapshot_saved_at and observed_min/max
file_hash, row_count and selected_columns
filters, transformations and units
join_key, match_count and unmatched_count
known_missingness and coverage_limit
refresh_method and last_successful_fetch
live_or_snapshot (explicit)
```

Keep news/interview evidence separate from operational records. A speech establishes that a problem matters; it is not a database row proving an individual's eligibility or a street's condition. Store document title, publisher, event/publication date, retrieval date, URL, section/timestamp and evidence status for narrative sources. Source-backed explanations should point to the particular record or passage used.

For a small demo, a versioned CSV/JSON extract plus a manifest is sufficient. Database selection can follow the product choice. We have not created a database connection in this research task.

## 5. Reproduce and extend the audit

Download the [Civic ZIP](https://hackachusetts2026.vercel.app/kits/tracks/civic.zip) to a local path, then run from the repository root:

```bash
python3 knowledge/sources/audit_civic_kit.py /path/to/civic.zip
```

The script parses CSVs in memory and records source links without executing bundled scripts. It checks blank strings and lexical date ranges, not all numeric sentinel values, duplicate semantics, licenses, source completeness, timezone interpretation, or original-system correctness. Those checks should be selected for the actual use case.

The repository stores the audit and reproducible script. A later merged change also added the [Civic data mirror](../data/civic/CATALOG.md), including extracted datasets and starter kits. City posters and third-party transcripts remain linked at their sources. Preserve the exact application subset and its license/attribution when selecting data for the demo.
