# Public data, code and integration paths

Checked **October 24, 2026**. This expands the organizer's [22 inspected starter CSVs](07_civic_dataset_verification.md). “Verified” below means a bounded public request returned inspectable data or metadata. It does not mean an app was connected, the full dataset was ingested, code was executed, or operational accuracy was established.

Machine-readable evidence: [public-resource audit](sources/public_resource_audit.json), [reproducible probe script](sources/audit_public_resources.py), and [flat resource inventory](sources/public_resource_inventory.csv). Requests used no credentials, normal TLS and limited response sizes. Failed attempts remain in the audit so the next builder does not repeat them.

## 1. Useful data beyond the starter kit

| Resource | What was actually checked | What it unlocks | Important integration detail |
|---|---|---|---|
| **Cambridge pedestrian ramps** — [dictionary](https://www.cambridgema.gov/gis/gisdatadictionary/dpw/dpw_pedestrianramps), [GeoJSON](https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/main/DPW/Pedestrian_Ramps/DPW_PedestrianRamps.geojson) | Downloaded/parsed **4,605 point features**; condition, slope-related attributes, width, puddling and GlobalID fields | Last 100 Feet; repair/verification counterfactual | GitHub GeoJSON coordinates are longitude/latitude around Cambridge. Native GIS dictionary specifies State Plane feet; inspect the selected format before transforming. Inventory is not a current passability survey. Dictionary states PDDL 1.0 |
| **Bluebikes GBFS** — [official data page](https://bluebikes.com/system-data), [discovery feed](https://gbfs.bluebikes.com/gbfs/gbfs.json) | Followed discovery links; **628 stations** in each information/status response, with update time and TTL | DockFallback; campus transport displays | Join by current `station_id`; inspect `is_returning`, disabled docks and `last_reported`. Do not hard-code the discovered version/path forever. Availability is an observation, not a reservation |
| **Bluebikes station CSV and trip archive** — [station CSV](https://assets.ctfassets.net/p6ae3zqfb1e3/3BswRZgQMp0f8XWBLY6T19/60da57a4630102788a127902bfda9888/-External-_Bluebikes_Station_List__updated_08.21.26_.csv), [trip archive](https://s3.amazonaws.com/hubway-data/index.html) | **613 data rows**, after skipping a date preamble and header. Trip archive is publisher-linked; full archive not downloaded | Station-name/ID crosswalk; time-of-day analysis unavailable in starter aggregates | Actual CSV has `Name`, `Lat`, `Long`, seasonal status, municipality, docks and a historic-ID column; some IDs say “No ID post-March 2023.” Verify mappings to GBFS rather than assuming equality. Follow the [data license](https://bluebikes.com/data-license-agreement) |
| **MBTA V3 facilities, stops and alerts** — [official Swagger](https://api-v3.mbta.com/docs/swagger/index.html) | Bounded GETs returned facility/station relationships, stop coordinates, and alerts with `active_period`, `informed_entity`, ID and full description | Last 100 Feet; CityHandshake; travel constraint context | Some facility coordinates are null. Resolve relationships to stops/entrances rather than dropping them silently. The rail-only starter is not a complete transit network |
| **MassGIS EJ polygons and GEOID** — [layer](https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/EJ2020/MapServer/0) | Corrected Boston query returned three polygon features and `GEOID`, population, household and EJ fields | Spatial resource-coverage context missing from starter | `MUNICIPALITY='Boston'` worked; uppercase `BOSTON` returned zero. This is a sample, not all Boston polygons. Handle pagination/transfer limits, geographic splits and underlying vintage; do not infer personal need from area attributes |
| **Boston cooling centers** — [GIS layer](https://gisportal.boston.gov/arcgis/rest/services/StoryMaps/CoolingCenters/FeatureServer/0), [City guidance](https://www.boston.gov/departments/emergency-management/keeping-cool-heat) | Bounded GeoJSON query returned three facilities | HeatHours; preparation resource cards | A point on a map does not establish current opening hours, accessibility, capacity, or activation as a cooling site. Verify these from current facility/City instructions |
| **National Weather Service** — [API documentation](https://www.weather.gov/documentation/services-web-api), [Boston point](https://api.weather.gov/points/42.3601,-71.0589) | Point metadata returned forecast links; MA active-alert query returned an empty feature list in the checked response | Official weather context; scenario/time separation | Zero returned alerts is a dated response, not a declaration that all hazards are absent. Follow forecast URLs from the point response; retain issue/effective/expiry times |
| **NOAA Boston tide predictions** — [API documentation](https://api.tidesandcurrents.noaa.gov/api/prod/) | Station **8443970**, October 24, 2026, hourly predictions: **24 values** returned; requested metric units, GMT, MLLW datum | Storm Rehearsal; educational tide timeline | MLLW-relative tide predictions cannot be overlaid directly on an elevation model with another datum. These are not surge or flood-depth predictions |
| **O*NET 31.0 Essential Skills CSV** — [download](https://www.onetcenter.org/dl_files/database/db_31_0_csv/essential_skills.csv), [database documentation](https://www.onetcenter.org/database.html) | **18,200 rows** parsed, including occupation code, element/scale IDs, value and uncertainty fields | ShiftFits skill context; transparent skill-gap comparisons | Starter occupation descriptions are version 30.0; the current database is 31.0. Record version and code mappings. Respect scale IDs, suppression flags and CC BY 4.0 attribution. Skills are not vacancies or applicant evaluations |
| **OpenAlex works API** — [documentation](https://help.openalex.org/api/), [authentication](https://help.openalex.org/api/authentication/) | Keyless three-result search returned work IDs, DOIs, dates, authorships and open-access metadata | Lab2Block; recent work beyond the starter's most-cited 2024 sample | Our search included “Boston urban heat”; it was not a validated nine-campus filter. Resolve institution IDs before filtering affiliations. Current docs permit basic keyless requests, but require a free key for deeper cursor paging and higher scale |
| **Boston full permit schema** — [CKAN resource](https://data.boston.gov/api/3/action/datastore_search?resource_id=6ddcd912-32a0-43df-9908-63574f8c7e77&limit=0) | Schema-only `limit=0` request confirmed address, `property_id`, `parcel_id`, and coordinate fields omitted from starter | Potential property context for PermitDiff/RepairLedger | Schema existence is not completeness or a tested join. No application-received timestamp was found here; issuance dates still cannot measure processing duration. Do not ingest applicant details for a demo that does not need them |
| **Boston full violation schema** — [CKAN resource](https://data.boston.gov/api/3/action/datastore_search?resource_id=800a2663-1d6a-46e7-9356-bedb70f5332c&limit=0) | Confirmed component address fields, `sam_id`, latitude/longitude and case fields | Potential scoped repair timeline after identity validation | `sam_id`, permit `property_id`, and `parcel_id` are not proven interchangeable. Avoid contact-address fields; inspection of the schema does not establish a reliable property match |
| **Census ACS** — [API dataset](https://api.census.gov/data/2024/acs/acs5.html) | Keyless Suffolk tract request redirected to `missing_key.html` and timed out | Possible denominators for a later spatial pilot | **Not ready in this environment.** No key/account was created. Use existing audited context or obtain the required access before promising a live Census join |

### MBTA details that save implementation time

The official [machine-readable specification](https://api-v3.mbta.com/docs/swagger/swagger.json) was inspected after query failures. `live_facilities` requires an ID filter and its documentation describes parking facilities; it should not be presented as an elevator uptime endpoint. `filter[stop]` on that endpoint failed. `filter[effect]` on `/alerts` also failed.

Use `/facilities?filter[type]=ELEVATOR` to discover facility IDs, then the documented `/alerts?filter[facility]=…` and relevant time/stop filters. The corrected facility-922 alert request returned HTTP 200 with **zero alerts**. That validates the query syntax, not the elevator's condition. Inspect returned alert effect and active periods in code; retain unknown states. Query URLs and unsuccessful attempts are in the audit.

### Additional useful sources: leads, not ready-made integrations

| Source | Useful material | Remaining work |
|---|---|---|
| [MassHire training-provider information](https://www.mass.gov/information-for-workforce-training-providers) | Official route to eligible training-provider information and JobQuest | Choose three actual programs and verify current schedule, location, intake and availability. No complete public CSV was validated here |
| [Federal Training Provider Results announcement](https://www.dol.gov/newsroom/releases/eta/eta20201216) and [data dictionary](https://www.trainingproviderresults.gov/assets/ETP_Data_Dictionary.pdf) | Program-level training outcomes and reporting definitions | The announcement is from 2020. Current bulk-download endpoint and coverage remain unverified; a commercially repackaged CSV is not the official source |
| [UMass Boston pantry](https://www.umb.edu/campus-life/current-students/u-access/food-pantry/) and [BHCC DISH reports](https://www.bhcc.edu/dishfoodpantry/reports/) | Provider-owned service information, schedules, reports | UMass page directly read; BHCC indexed content available but direct web reads returned 502. Do not infer inventory, appointment availability or database access |
| [Boston Urban Forest Plan](https://www.boston.gov/departments/parks-and-recreation/urban-forest-plan) | Canopy assessment and planning context | Identify the actual raster/vector layer and vintage before using spatial cooling claims. A modeled benefit is not a measured street temperature |
| [MBTA GTFS documentation](https://github.com/mbta/gtfs-documentation) | Schedule, stop and station-pathway concepts | Obtain and inspect a current feed for the selected date. No full routing graph was built in this research |
| [Cambridge GIS repository](https://github.com/cambridgegis/cambridgegis_data) | Additional asset/boundary layers; ramps already verified | Inspect each layer's license, field meanings, coverage and coordinate system. No assumed Boston coverage |

## 2. Public repositories worth knowing

GitHub metadata was checked for **21 existing repositories**, plus one incorrect InVEST path retained as a failed probe. Last-push timestamps and archive flags are in the audit. A push timestamp does not prove quality, release status or maintenance commitment. No repository was cloned, installed or executed.

“License file read” means the actual root license was inspected after GitHub returned `NOASSERTION`. Component/data licenses may differ. Retain required notices; inspect the specific files before copying. “Unresolved” means public visibility alone does not establish reuse permission.

| Repository | Useful role / originality check | License/status observed | Day-of recommendation |
|---|---|---|---|
| [CityOfBoston/OpenContext](https://github.com/CityOfBoston/OpenContext) | Civic-data/AI integration reference | MIT; not archived | Read connector patterns; integrate only a needed source |
| [OETBoston/curb-atlas](https://github.com/OETBoston/curb-atlas) | City's curb mapping application | MIT; not archived | Existing-product baseline; do not claim curb discovery is new |
| [OETBoston/boston-parking-pwa](https://github.com/OETBoston/boston-parking-pwa) | Parking-sign interpretation | MIT; not archived | Compare against MoveReady/PermitDiff before choosing them |
| [OETBoston/cds_translator](https://github.com/OETBoston/cds_translator) | Parking-sign images to Curb Data Specification policy objects | MIT; not archived | Structured extraction precedent; outputs need validation |
| [OETBoston/blue](https://github.com/OETBoston/blue) | Bluebikes display for office-building screens | MIT; not archived | Lightweight reference; availability display is already covered |
| [OETBoston/BidBot](https://github.com/OETBoston/BidBot) | Procurement retrieval assistant | No license detected by metadata; unresolved | Inspect as prior art; do not copy on an assumed license |
| [OETBoston/Coastmix](https://github.com/OETBoston/Coastmix) | Coastal design/participation tool | AGPL v3-or-later stated in license file | Existing product; full fork is a large day-of dependency |
| [TransitMatters T dashboard](https://github.com/transitmatters/t-performance-dash) | Local reliability/performance analysis | MIT; active-looking push date, not archived | Study metrics; do not build another generic reliability chart |
| [AccessMap/accessmap](https://github.com/AccessMap/accessmap) | Accessible pedestrian-routing reference | No license detected; last push 2023 in metadata | Prior art; verify license and local network coverage before reuse |
| [AccessMap Beyond the Curb](https://github.com/TaskarCenterAtUW/AccessMapBeyondTheCurb) | Entry/approach accessibility prototype | Apache-2.0; not archived | Strong conceptual reference for A1; Boston coverage unproven |
| [Project Sidewalk](https://github.com/ProjectSidewalk/SidewalkWebpage) | Crowdsourced sidewalk-accessibility platform | MIT; not archived | Study observation taxonomy; full deployment is substantial |
| [FixMyStreet](https://github.com/mysociety/fixmystreet) | Mature civic reporting/routing platform | AGPL v3-or-later, subject to per-file exceptions, license read | Workflow precedent; do not attempt a full migration today |
| [Ohana API](https://github.com/codeforamerica/ohana-api) | Human-services directory API/admin | BSD-3-Clause; not archived; last push January 2025 | Historical implementation reference; no modern-runtime assurance |
| [Open Referral specification](https://github.com/openreferral/specification) | Service/location/organization exchange schema | CC BY-SA 4.0, license read; default ref 3.3.1 at check | Good schema starting point; schema permission does not license directory data |
| [Older Open Referral API specification](https://github.com/openreferral/api-specification) | Earlier API work | **Archived** | Prefer current specification; record migration instead of building on an assumed active project |
| [OpenTripPlanner](https://github.com/opentripplanner/OpenTripPlanner) | Multimodal routing engine | LGPL v3-or-later, license read | Later pilot unless team already operates it; graph build/data are real work |
| [docassemble](https://github.com/jhpyle/docassemble) | Guided interviews and document assembly | MIT; not archived | Use narrow patterns or familiar components; substantive rules require review |
| [Streetmix](https://github.com/streetmix/streetmix) | Street cross-section design | AGPL v3-or-later, license read | Useful precedent for StreetTradeoffs; credit it |
| [InVEST](https://github.com/natcap/invest) | Environmental benefit modeling | Apache-2.0; correct organization is `natcap` | Later calibrated analysis; not a quick live heat forecast |
| [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js) | Interactive map rendering | BSD-style three-clause terms in inspected license | Small map component; basemap/tile terms are separate |
| [Cambridge GIS data](https://github.com/cambridgegis/cambridgegis_data) | Actual downloadable municipal layers | Ramps dictionary states PDDL 1.0; verify other layers individually | Use selected layers, not the entire repository |

## 3. All 22 starter datasets: a deeper use and the missing connection

Idea IDs refer to the [creative atlas](09_creative_civic_opportunity_atlas.md). This matrix covers all files actually audited. The mirror's earlier “23 datasets” label was a counting discrepancy, not evidence of a missing 23rd file.

| Starter dataset | Beyond the obvious chart | Additional data/code | Join/interpretation limit |
|---|---|---|---|
| `boston-311` | A3 responsibility vocabulary; A9 outcome lanes; A10 move-out context | Official responsibility pages; stable case API if later validated | Snapshot has no stable case IDs, coordinates, narratives or closure dates |
| `permits` | A8 scenario categories; A9 property context | Full schema, verified service requirements, docassemble | No application date; no demonstrated match to violations |
| `violations` | A9 distinguish enforcement event from repair evidence | Validated address identity and consented observations | Status date is not repair completion; avoid personal rankings |
| `neighborhoods` | A6/A7 contextual resource coverage; A15 denominator audit | Compatible boundaries and definitions | 24 rows; Harbor Islands numeric blanks; neighborhoods are not census block groups |
| `numina` | A11 test street-use assumptions against a historical observation window | Streetmix; verified street geometry | Nine zones, 2020–21; no current street occupancy or person tracking |
| `vision-zero` | A11 contextual incident timeline and missingness display | Street design context; exposure data if matched | Boston EMS records differ from police crash sources; counts alone are not risk |
| `mbta-alerts` | A1/A3 disruption interpretation and ownership | Full V3 alert IDs, active periods, facilities | Starter update time is not active period; absence of alert is not accessibility |
| `mbta-routes` | A2 actual reachable opportunities | Current bus routes, schedules and service calendars | Starter has only eight rail/light-rail routes |
| `mbta-stations` | A1 station-to-campus evidence chain | V3 stop IDs, entrances and pathways | Starter station names are not a validated crosswalk; no coordinates in its selected columns |
| `ej` | A6 identify contextual coverage gaps; A7 preparedness participation | Full MassGIS geometry/GEOID; current facility information | All starter rows are EJ Yes; no non-EJ comparison group or individual inference |
| `colleges` | A4 resource location; A10 reuse cluster; A13 research geography | Provider pages; institution identity crosswalk | Campus points do not have UNITID; multiple campuses may share an institution |
| `fema` | A7 choose historical tabletop context | NWS/NOAA and official local preparation sources | Multiple declaration rows can refer to the same event; no future hazard probability |
| `scorecard` | A2 contextual comparison of educational pathways | Actual program/cohort pages, not just institution averages | Cohorts/years differ; earnings do not predict a person's outcome |
| `ipeds` | A2 institution identity; A13 campus/research crosswalk | Program data and manually verified institution mapping | Exact UNITID works with most Scorecard rows, not automatically with campus points |
| `onet` | A2 explain relevant skills and transferable tasks | Current Essential/Transferable Skills files and code-version mapping | Occupational taxonomy is not a jobs feed or candidate assessment |
| `openalex-works` | A13 research-to-pilot brief | Current OpenAlex IDs/DOIs, paper-linked code/data | Starter's top-cited 2024 selection is not current research capacity or local applicability |
| `bluebikes` | A5 return-fallback and demand-context experiment | GBFS station status/information; monthly trip records | November 2024 pair aggregates omit departure times; station naming/version mismatches |
| `cambridge-crashes` | A11 contrasting street-design questions | Location-quality checks and appropriate exposure data | 48.5% of audited rows lack coordinates; do not silently map only the complete cases |
| `cambridge-bikes` | A11 exposure-context audit; A12 historical event planning | Sampling calendar and location crosswalk | Selected observation days; missing values are not zeros |
| `eco-totem` | A12 hourly historical-pattern comparison | Same-location/date event or weather context | Starter covers Jan–Jun 2024; not current cycling demand |
| `fresh-pond` | A12 compare historical visit windows | Current opening/event information and user feedback | 2024 hourly usership is not today's crowd, noise or accessibility |
| `somerville-counts` | A11/A12 cross-city method comparison | Standardized location/mode/time definitions | Years and counting protocols differ; do not pool raw totals across cities |

## 4. Connection recipes to prove before building

**Accessibility:** ramp `GlobalID` + GeoJSON point → manually verified pedestrian segment → MBTA entrance/stop ID → facility ID → active alert. A nearest-point spatial join is only a candidate connection. Verify crossings, direction, entrance and dates. Start with a schematic, then add geography.

**Bike return:** GBFS discovery → station information/status on `station_id` → status freshness/returning flags → candidate fallbacks → explicitly chosen walking constraint. Historical CSV station-number mappings need a tested crosswalk and an unmatched bucket.

**Opportunity:** institution `UNITID` → human-reviewed program/cohort record → actual calendar/timezone → user constraints → travel schedule. O*NET-SOC can describe occupation skills, but no automatic one-to-one institution-to-job relationship exists. The earlier audit found **135 exact UNITID matches** between the selected Scorecard/IPEDS files.

**Research:** institution identity → OpenAlex institution ID → work ID/DOI → method and study setting → independently reviewed civic application. Do not match only by fuzzy campus names or rank suitability by citations.

**Coverage:** facility coordinates and verified operating conditions → correctly projected geographic boundaries → coverage assumptions → aggregate context. Retain uncertainty, population/household denominators and geographic vintage. A straight-line buffer is not a walking route.

**Housing:** public schema → minimal necessary fields → normalized, manually checked property identity → separately attributed events. The existence of address fields is a useful new opening; it is not proof that an automated permit–violation join works.

## 5. A small evidence record that keeps the demo credible

For each fact used by the app, retain `source_url`, `retrieved_at`, `effective_start/end` when known, `geography`, `source_record_id`, `field_or_passage`, `verification_state`, and whether the value is **observed, calculated, user-supplied, or simulated**. Keep raw snapshot identity/hash separate from a narrative summary.

Use public institutional information and synthetic personas. Do not build profiles of residents from complaint posts or import personal contact fields simply because a public API exposes them. For the chosen MVP, cache a small reviewed snapshot, show its age, and handle a failed live request. No production database or secret keys were created by this research.
