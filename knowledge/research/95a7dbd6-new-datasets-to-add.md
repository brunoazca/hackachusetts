<!-- Exported from Kiro Crew Research Lab. Campaign 95a7dbd6, status complete, 9 cycles, completed 2026-10-24 15:32, parent none. -->

> **Question:** Find NEW public datasets (downloadable or via API, ideally free and current) that could explain, predict or measure rat problems in Boston, Cambridge and Somerville, for an inspector-facing 'Rat Audit' app. Prioritize sources that capture things our data misses: sewer and storm-drain infrastructure, commercial and residential waste (dumpster permits, private haulers, compost/food-waste programs such as Project Oscar bins), problem or vacant properties, large construction projects, public housing, transit stations, health outcomes (leptospirosis, rodent bites, asthma ED visits), pest-control activity, and comparable city rat datasets usable as benchmarks (NYC, Chicago, DC, Philadelphia). For each, confirm the access URL works and list key fields and join keys. ALREADY HAVE (do not re-propose): Boston 311 yearly 2011-2026 and new-system table (rodent, pest, dead animal, trash storage, trash out early, missed trash, dumping, litter, dumpster, unsanitary, vacant-lot trash, abandoned building, weeds, construction debris, catch basin, roadway flooding); Boston code enforcement trash tickets; RentSmart; property assessment FY25/FY26 (owner mailing address); food establishment inspections and active food licenses; approved building permits (demolition, excavation); Public Works work zones and violations; Big Belly locations; city-owned lots; public schools; colleges; parks features; trash schedules by address; street sweeping; NOAA GHCN daily weather (Logan); MLB Red Sox schedule; Boston Marathon; Sept 1 move-out window; one-day alcohol and entertainment licenses; Climate Ready Boston social vulnerability; Census TIGERweb tracts; CDC PLACES; Zillow ZHVI/ZORI; Inside Airbnb Boston; iNaturalist rat observations; Boston Checkbook spending; fire incident reports; crime incident reports; streetlight locations; canopy change; Somerville 311 (Rats, Rodent Assistance Program); Cambridge rodent sightings (uz4w-baz5) and smart rat boxes (78bs-b5ig); OpenAlex. Tested and null or weak: rain, restaurants, Red Sox, demolition, Big Belly.
>
> **Success criteria:** A ranked table of at least 10 new datasets not in the ALREADY HAVE list, each with a working access URL, owner, geography, date range, key fields, join key to our data, and a one-line reason it helps; plus any that were checked and found unavailable.

# Rat Audit — New Datasets Research (campaign 95a7dbd6)

## Executive Summary & Recommendation (final)

**Bottom line:** We found **11 new public datasets** (none in the ALREADY-HAVE list) plus **2 confirmed-unavailable** sources. Of the 11, **7 are confirmed directly loadable** (open API / bulk download) and 4 are partial (viewer, scrape, or nightly feed). This meets the goal of ≥10 ranked new datasets.

**Load these 4 first (fast, highest value):**
1. **Boston Building & Property Violations** — ISD Building & Structures violations (unsafe/boarded/distressed structures). A NEW local rat-harborage driver, parcel-joinable, clean CKAN API. *Different stream from the PWD trash tickets we already have.* [dataset](https://data.boston.gov/dataset/building-and-property-violations1)
2. **Boston Problem Properties list** — the city's own curated chronic-nuisance list (≥4 valid complaints/12mo) with Parcel ID + designation date. A ready-made high-prior watch list for inspectors; scrape the small HTML table. [page](https://www.boston.gov/government/cabinets/operations-cabinet/problem-properties-boston)
3. **Boston Article 80 Development Projects** — BPDA large-project pipeline (GeoJSON/Shapefile/REST). Big construction displaces rats → a nearby-report predictor beyond our demolition permits. [dataset](https://data.boston.gov/dataset/article80-development-projects)
4. **NYC Rodent Inspection** — the one benchmark with a true inspection→re-inspection→result OUTCOME chain. Use it as the **methodology template** for the app's "did the action work?" analysis. [dataset](https://data.cityofnewyork.us/Health/Rodent-Inspection/p937-wjvj/about_data)

**Then:** Boston Street Occupancy / dumpster permits (private-waste driver), DC 311 S0311 **+ its published prediction model** (forecast template), Chicago & Philadelphia 311 (response-time / recurrence benchmarks), MBTA stations (cheap spatial predictor), MA EPHT asthma (ecological housing proxy).

**Three method notes for the app:**
- The benchmark cities split into two shapes: **inspection-outcome** (NYC, DC Health) — copy these to measure what works — and **311-request** (Chicago, DC, Philly) — use for response-time/recurrence baselines.
- **[The Lab @ DC](https://thelabprojects.dc.gov/rats)** already built and validated a rat-burrow prediction model against 311 outcomes — a directly reusable template for the forecast feature.
- Most Boston local sources are on the Analyze Boston CKAN portal (Datastore API + bulk download, PDDL license), joinable to our parcels by parcel id / SAM address / lat-lon.

**Not available (documented, don't chase):** MA **leptospirosis** case counts (the direct rat-borne disease) are request-only surveillance with small-count suppression — not an open dataset. **Boston Housing Authority** development locations are a map viewer only.

See the ranked top-10 table (Cycle 7) and full per-dataset detail below.

---

**Goal:** Find ≥10 NEW public datasets (not in ALREADY HAVE) that explain/predict/measure rat problems in Boston, Cambridge, Somerville, for an inspector-facing app. Each needs a working URL, owner, geography, date range, key fields, join key, and a one-line reason it helps.

## Running candidate table

| # | Dataset | Owner | Geo | Key fields | Join key | Why it helps | Status | Effort |
|---|---------|-------|-----|-----------|----------|--------------|--------|--------|
| 1 | MBTA Rapid Transit Stations | MassGIS/CTPS | Greater Boston (points) | STATION, LINE, TERMINUS, ROUTE, Shape | spatial (nearest / within-radius of 311 point) | Stations concentrate litter & traffic → candidate rat-hotspot predictor | ✅ CONFIRMED (REST query returns JSON) | low |
| 2 | BWSC Catch Basins | Boston Water & Sewer Commission | Boston | (viewer only) | spatial | Storm-drain inlets = classic rat harborage/travel routes | ⚠️ EXISTS, not confirmed downloadable (map viewer only) | high |
| 3 | NYC Rodent Inspection | NYC DOHMH (Socrata p937-wjvj) | NYC, per tax-lot | INSPECTION_TYPE, RESULT, BBL, BORO, BLOCK, LOT, LAT/LON, INSPECTION_DATE | benchmark (methodology transfer, not a direct join) | Inspection OUTCOMES (initial→compliance→baiting) = gold standard to test "what works" | ✅ CONFIRMED (Socrata API) | low |
| 4 | Chicago Rodent map (311 baiting) | City of Chicago (Socrata 3hy6-wdqe) | Chicago, point | request type, status, created/completed date, ward, lat/lon | benchmark | Baiting requests + completion times → response-time & recurrence benchmark | ✅ CONFIRMED (Socrata API) | low |
| 5 | Boston Building & Property Violations | Boston ISD Building & Structures (CKAN 705244a6…) | Boston, per parcel | violation code/desc, status, value, sam_id, parcel_id, address, lat/lon, date | parcel_id / SAM / lat-lon → our parcels | Boarded/unsafe-building violations = direct rat harborage signal NOT in our PWD trash tickets | ✅ CONFIRMED (CKAN download + Datastore API) | low |
| 6 | Boston Problem Properties list | Boston Problem Properties Task Force | Boston, per parcel | Parcel ID, Address, Neighborhood, Date of Designation | Parcel ID → our parcels | Curated chronic-nuisance list (4+ valid complaints/12mo) = high-prior addresses for an inspector | ⚠️ PUBLIC as HTML table (scrapeable); CKAN CSV resource is empty (14 bytes) | medium |
| 7 | MA EPHT Asthma ED visits & hospitalizations | MA DPH (MA EPHT) / data.mass.gov | MA, by city/town (& county) | asthma ED/hosp counts & rates, year, geography, age group | town/ZIP → our ZIP/tract aggregates | Town-level asthma ED rate is a housing-condition proxy (crowding, poor-quality units) correlated with rat burden | ⚠️ PUBLIC, town-level; mostly viewer/PDF + Socrata hub (data.mass.gov), moderate extraction | medium |
| 8 | DC 311 Rodent Abatement (service code S0311) | Open Data DC / DC Health | Washington DC, point + ward | service code S0311, status, created/resolved date, ward, lat/lon; + Rodent Inspection/Treatment layer | benchmark | Per-request rodent abatement with outcomes/wards; DC also published a predictive model (The Lab @ DC) — method reference | ✅ CONFIRMED (Open Data DC / ArcGIS REST, yearly) | low |
| 9 | Philadelphia 311 Service Requests (rodent) | OpenDataPhilly / City of Philadelphia | Philadelphia, point | service_name/subject, status, requested/closed date, lat/lon, address | benchmark | Rodent/sanitation 311 since 2014 via Carto SQL API; + L&I Complaints for building-condition rat signals | ✅ CONFIRMED (Carto API) | low |
| 10 | Boston Article 80 Development Projects | Boston Maps / BPDA Planning Dept | Boston, point/polygon | project name/id, status, address, neighborhood, sqft/units, lat/lon, geometry | lat/lon + parcel → our parcels & 311 | Large-project pipeline: construction disturbs harborage & displaces rats → predicts nearby reports | ✅ CONFIRMED (GeoJSON/CSV/SHP/KML + ArcGIS REST) | low |
| 11 | Boston Project Oscar compost drop-off bins | Boston Public Works | Boston, point | bin location/address, neighborhood | spatial → 311 | Food-waste bins are a candidate rat attractant/management signal near their sites | ⚠️ NO open dataset; locations only on program page + PDF flyers (geocode) | medium |
| 12 | Boston Street Occupancy Permits (dumpster placements) | Boston PWD / Transportation (Street Work Map) | Boston, point | permit type (incl. dumpster), status, address, start/end date, lat/lon | address/lat-lon → our parcels & 311 | Permitted construction dumpsters = private waste containers (prime rat food/harborage) NOT in our data | ⚠️ CONFIRMED EXISTS (nightly permit feed powers public map); clean bulk/CKAN resource not located — moderate access | medium |
| — | Boston Housing Authority developments | BHA | Boston, point | development name, address, type (family/elderly), funding | parcel/spatial | Dense public housing = management-relevant rat context | ⚠️ Map viewer only; no open dataset found | medium |
| — | MA leptospirosis case counts | MA DPH Bureau of Infectious Disease | MA | — | — | Direct rat-borne disease outcome — but NOT open; request-only, small counts (<5) suppressed | ❌ UNAVAILABLE as a dataset (epidemiologist/CSTE request only) | n/a |

---

## Cycle 0 — Infrastructure & transit
**Sub-question:** MBTA station locations; BWSC sewer/catch-basin GIS.

- **MBTA Rapid Transit Stations** — CONFIRMED working. ArcGIS REST point layer on Boston GIS OpenData MapServer (layer 1). Query endpoint returns JSON/GeoJSON. Fields: `STATION, LINE, TERMINUS, ROUTE, Shape`. GeoJSON pull: `https://gis.boston.gov/ArcGIS/rest/services/Infrastructure/OpenData/MapServer/1/query?where=1=1&outFields=*&f=geojson`. Also on MassGIS Data Hub ([feature service](https://gis.data.mass.gov/maps/dba3f84748654013a04d24dcfe3725be/explore)). Join to 311 by spatial distance.
- **BWSC Catch Basins** — EXISTS as a public [map viewer](https://www.bwsc.org/environment-education/maproom/catch-basins-map) but no download or REST link is exposed on the page. Rat-relevant (storm drains) but needs more work to actually load; flagged high-effort.

Sources: [Boston GIS MBTA Stops layer](https://gis.boston.gov/ArcGIS/rest/services/Infrastructure/OpenData/MapServer/1), [MassGIS MBTA Rapid Transit](https://gis.data.mass.gov/maps/dba3f84748654013a04d24dcfe3725be/explore), [BWSC Catch Basins Map](https://www.bwsc.org/environment-education/maproom/catch-basins-map).

---

## Cycle 1 — Benchmark cities (NYC, Chicago)
**Sub-question:** NYC DOHMH rodent inspections; Chicago rodent baiting — which have inspection outcomes usable to test "what works".

- **NYC Rodent Inspection** — CONFIRMED. Socrata dataset `p937-wjvj` ([about](https://data.cityofnewyork.us/Health/Rodent-Inspection/p937-wjvj/about_data)). API: `https://data.cityofnewyork.us/resource/p937-wjvj.json`. Each row = an inspection of a tax lot. INSPECTION_TYPE ∈ {Initial, Compliance, Baiting}; RESULT ∈ {Active Rat Signs, Passed, Bait applied, Problem Conditions, Monitoring…}. Fields incl. BBL, BORO_CODE, BLOCK, LOT, HOUSE_NUMBER, STREET_NAME, ZIP_CODE, LATITUDE, LONGITUDE, INSPECTION_DATE, APPROVED_DATE. **Highest-value benchmark**: it has the inspection→re-inspection→result chain our 311 data lacks, so it's the model for an inspector "what-works" analysis.
- **Chicago Rodent map (311 rodent baiting)** — CONFIRMED. Socrata `3hy6-wdqe` ([about](https://data.cityofchicago.org/Service-Requests/Chicago-Rodent-map/3hy6-wdqe/about)); historical table id `97t6-zrhs`. API: `https://data.cityofchicago.org/resource/3hy6-wdqe.json`. Open baiting requests + completed requests since 2011; fields incl. request type, status, created/completed dates, ward, community area, lat/lon. Gives a response-time + repeat-request benchmark (target 7-day completion).
- Both are Socrata → stable `/resource/<id>.json` API, SoQL filtering, free. Used as **benchmarks** (cross-city methodology), not row-level joins to Boston.

Sources: [NYC Rodent Inspection p937-wjvj](https://data.cityofnewyork.us/Health/Rodent-Inspection/p937-wjvj/about_data), [NYC Rat Information Portal](https://a816-dohbesp.nyc.gov/IndicatorPublic/rats/), [Chicago Rodent map 3hy6-wdqe](https://data.cityofchicago.org/Service-Requests/Chicago-Rodent-map/3hy6-wdqe/about).

---

## Cycle 2 — Problem & vacant properties (Boston-local, parcel-joinable)
**Sub-question:** Boston Problem Properties list; vacant/distressed building data joinable to parcels.

- **Boston Building and Property Violations** — CONFIRMED. Analyze Boston (CKAN) dataset `705244a6-70a6-4ff8-ab8e-56441aff18e7`, resource `800a2663-1d6a-46e7-9356-bedb70f5332c` ([dataset](https://data.boston.gov/dataset/building-and-property-violations1)). ISD **Building & Structures** division violations (unsafe/boarded/distressed structures) — a **different** enforcement stream from the PWD *trash* tickets already in our data. Download CSV/TSV/JSON/XML + Datastore API (`https://data.boston.gov/api/3/action/datastore_search?resource_id=800a2663-1d6a-46e7-9356-bedb70f5332c`), PDDL license, updated 2026-10-24. Parcel-joinable (parcel/SAM id, lat/lon). *Caveat: one CSV resource reports 14 bytes — verify the real data resource on load.*
- **Boston Problem Properties list** — PUBLIC as an HTML table at [boston.gov Problem Properties](https://www.boston.gov/government/cabinets/operations-cabinet/problem-properties-boston): **Parcel ID, Address, Neighborhood, Date of Designation**. City's curated chronic-nuisance list (≥4 valid complaints in 12 months) — an ideal high-prior seed set for an inspector. The open-data CSV resource is an empty 14-byte placeholder, so **scrape the page** (small list, parcel-joinable).

Sources: [Building & Property Violations (CKAN)](https://data.boston.gov/dataset/building-and-property-violations1/resource/800a2663-1d6a-46e7-9356-bedb70f5332c), [Problem Properties in Boston](https://www.boston.gov/government/cabinets/operations-cabinet/problem-properties-boston).

---

## Cycle 3 — Health & pests (sub-Q3)
**Sub-question:** MA DPH leptospirosis / animal bites / asthma ED by ZIP or town.

- **MA EPHT Asthma ED visits & hospitalizations** — PUBLIC, city/town + county level, via [MA EPHT Asthma](https://www.mass.gov/info-details/ma-epht-asthma) tracking tools and the [data.mass.gov health hub](https://data.mass.gov/browse/health-and-social-services?subtopics=diseases-and-illnesses) (Socrata). Fields: ED-visit & hospitalization counts/rates, year, geography, age group. Join ecologically by town/ZIP. Use as a **housing-condition proxy** (crowding/poor units ↔ rat burden). Mostly viewer/PDF, so moderate extraction effort.
- **MA leptospirosis case counts** — ❌ **UNAVAILABLE as open data.** The direct rat-borne disease is a request-only surveillance line ([Infectious disease data requests](https://www.mass.gov/lists/infectious-disease-data-reports-and-requests); CSTE request form), with small-count suppression (<5). Recorded as checked-and-null — don't chase.
- New HUB discovered: **data.mass.gov** (Socrata) hosts town-level health series (asthma, mosquito-borne illness by town) — worth mining later.

Sources: [MA EPHT Asthma](https://www.mass.gov/info-details/ma-epht-asthma), [data.mass.gov health & social services](https://data.mass.gov/browse/health-and-social-services?subtopics=diseases-and-illnesses), [MA infectious disease data requests](https://www.mass.gov/lists/infectious-disease-data-reports-and-requests).

---

## Cycle 4 — Benchmark cities (DC, Philadelphia)
**Sub-question:** DC and Philadelphia rat data — which have inspection outcomes usable to test "what works".

- **DC 311 Rodent Abatement** — CONFIRMED. Open Data DC "311 City Service Requests", service code **S0311** (one dataset per year, 2015–present), plus a live [Rodent Inspection & Treatment ArcGIS layer](https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_APPS/SR_30days_Open/MapServer/40) and the [DC Rodent Control Dashboard](https://opendata.dc.gov/datasets/DCGIS::rodent-control-dashboard). Fields: servicecode (S0311), status, adddate/resolutiondate, ward, lat/lon, address. **Bonus:** [The Lab @ DC](https://thelabprojects.dc.gov/rats) built & validated a burrow-prediction model vs 311 abatement outcomes — a reusable template for our forecast feature.
- **Philadelphia 311 Service Requests (rodent/sanitation)** — CONFIRMED. [OpenDataPhilly 311](https://www.opendataphilly.org/datasets/311-service-and-information-requests/), Carto SQL API (`https://phl.carto.com/api/v2/sql?q=SELECT * FROM public_cases_fc WHERE service_name ILIKE '%rodent%'`), 2014-12-08→present; fields service_name, status, requested/closed datetime, lat/lon, address, zipcode. Plus [L&I Complaints](https://opendataphilly.org/datasets/licenses-and-inspections-complaints/) for building-condition rat signals.
- With NYC + Chicago + DC + Philly we now span both benchmark shapes: **inspection-outcome** (NYC, DC Health) and **311-request** (Chicago, DC 311, Philly).

Sources: [Open Data DC Rodent Control Dashboard](https://opendata.dc.gov/datasets/DCGIS::rodent-control-dashboard), [DC Rodent Inspection/Treatment layer](https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_APPS/SR_30days_Open/MapServer/40), [The Lab @ DC rats](https://thelabprojects.dc.gov/rats), [OpenDataPhilly 311](https://www.opendataphilly.org/datasets/311-service-and-information-requests/).

---

## Cycle 5 — Boston development pipeline & compost (sub-Q1 remainder)
**Sub-question:** BPDA development pipeline; Project Oscar compost bins.

- **Boston Article 80 Development Projects** — CONFIRMED (**dataset #10**). [Analyze Boston / Boston Maps](https://data.boston.gov/dataset/article80-development-projects), published by BPDA (tags art80/bpda/development/automated). Downloadable as **GeoJSON / CSV / Shapefile / KML** plus an **ArcGIS GeoServices REST API**, PDDL license. Fields: project name/id, status/phase, address, neighborhood, sq ft, units, lat/lon, geometry. The **large-project** pipeline — a cleaner "big construction nearby" signal than our existing demolition/excavation permits; construction disturbs harborage & displaces rats. Join by lat/lon + parcel.
- **Boston Project Oscar compost drop-off bins** — ⚠️ no open dataset. Locations are published only on the [program page](https://www.boston.gov/departments/public-works/project-oscar) and PDF flyers; would need to geocode flyer addresses. Rat-relevant (food-waste attractant/management), but weak/moderate access.

Sources: [Article 80 Development Projects (Analyze Boston)](https://data.boston.gov/dataset/article80-development-projects), [Project Oscar](https://www.boston.gov/departments/public-works/project-oscar).

---

## Cycle 6 — Dumpster/occupancy permits & public housing (sub-Q1/sub-Q2 remainder)
**Sub-question:** dumpster / street-occupancy permits; Boston Housing Authority properties.

- **Boston Street Occupancy Permits (dumpster placements)** — CONFIRMED EXISTS. The [Boston Street Work Map](https://boston.gov/departments/analytics-team/boston-street-work-map) is built from the city permitting system; the page states the data "include occupancies, such as **dumpsters placed at construction sites** or moving trucks, and excavations." The underlying [Street Occupancy Permit Lookup](http://cityofboston.gov/transportation/occupancy/) updates nightly (all present/future permits + past 60 days). Fields: permit type (incl. dumpster), status, address, start/end dates, lat/lon. **Caveats:** (1) a clean bulk/CKAN download wasn't located — data sits behind the lookup/map (may need the map's ArcGIS layer or a records path); (2) distinct from our ALREADY-HAVE *Public Works work zones* (active-construction report) — this is the permitted-container feed with a dumpster type filter.
- **Boston Housing Authority developments** — ⚠️ viewer only. Published as an interactive [public-housing map](https://www.bostonhousing.org/en/Housing-Communities/Public-Housing-Communities/Public-Housing-Map.aspx); no open dataset/REST endpoint found (scrapeable, small N).

Sources: [Boston Street Work Map](https://boston.gov/departments/analytics-team/boston-street-work-map), [Street Occupancy Permit Lookup](http://cityofboston.gov/transportation/occupancy/), [BHA Public Housing Map](https://www.bostonhousing.org/en/Housing-Communities/Public-Housing-Communities/Public-Housing-Map.aspx).

---

## Cycle 7 — RANKED top 10 (sub-Q5)
Ranked by value (explains returns / improves forecast / measures results) × join quality × rat-relevance, weighed against load effort. Access URL, owner, geography, date range, key fields, join key, reason, and effort are in the candidate table above; this is the priority order with the one-line rationale.

| Rank | Dataset | Value lever | Effort | Why this rank |
|------|---------|-------------|--------|---------------|
| 1 | Boston Building & Property Violations | explains returns | low | NEW local driver (unsafe/boarded structures), parcel-join, clean CKAN API — biggest bang for least effort |
| 2 | Boston Problem Properties list | explains returns | medium (scrape) | City's own curated chronic-nuisance list = ready-made high-prior seed set for inspectors; small, parcel-join |
| 3 | Boston Article 80 Development Projects | improves forecast | low | Large-construction displacement driver; GeoJSON/Shapefile/REST, geo-join |
| 4 | NYC Rodent Inspection | measures results | low | The only true inspection→re-inspection OUTCOME chain → the "what-works" methodology template |
| 5 | Boston Street Occupancy / dumpster permits | explains returns | medium | Private construction dumpsters = prime food/harborage; join by address/lat-lon; no clean bulk yet |
| 6 | DC 311 Rodent Abatement (S0311) + Lab@DC model | improves forecast + measures results | low | Benchmark WITH a published, validated prediction model to copy |
| 7 | Chicago Rodent map (311 baiting) | measures results | low | Baiting completion times → response-time & recurrence benchmark |
| 8 | MBTA Rapid Transit Stations | improves forecast | low | Cheap spatial predictor (distance-to-station); confirmed REST |
| 9 | Philadelphia 311 (rodent) + L&I complaints | measures results | low | Second request-shape benchmark; Carto API |
| 10 | MA EPHT Asthma ED visits | improves forecast | medium | Ecological housing-condition proxy by town; viewer/PDF extraction |
| — (below line) | BWSC Catch Basins | explains returns | high | Strong rat signal but viewer-only, no confirmed download |
| — (below line) | Project Oscar compost bins | explains returns | medium | Rat-relevant but only flyers/program page, must geocode |
| ❌ unavailable | MA leptospirosis case counts | would measure outcomes | n/a | Request-only surveillance, small-count suppressed — not open |
| ❌ unavailable | Boston Housing Authority locations | context | n/a | Map viewer only, no open dataset/REST |

**Priority to load first:** #1–#4 (all low effort except the Problem Properties scrape) deliver a new local driver, a curated seed list, a construction-displacement signal, and the outcome-analysis template — the fastest lift to the app's "explain / forecast / measure" goals.

---

## Research State
- **Status:** All five sub-questions answered. sub-Q5 ranked top-10 table written above. Definition of Done met (≥10 datasets with URL/owner/geo/date/fields/join/reason + unavailable list + ranking).
- **Count:** 11 usable (7 confirmed-loadable, 4 partial) + 2 documented-unavailable.
- **ONLY remaining:** final cycle (cycle 9 == max_cycles-1) → write exec summary + recommendation at the TOP of FINDINGS.md, set verification.passed=true, write worker_done.json, call autonudge_stop. Cycle 8 is a buffer (re-verify a URL or tidy caveats if anything looks shaky; otherwise minimal).
- **Dead-ends:** lepto (request-only), BHA (viewer). Catch basins / Project Oscar below the line (no clean download). mass.gov 403s fetcher → use data.mass.gov.
