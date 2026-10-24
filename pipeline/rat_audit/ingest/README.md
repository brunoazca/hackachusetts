# Ingest sources

Each module exposes `run(conn, since=None) -> int` (see `rat_audit/jobs.py`). `since=None` is the
backfill; `since="14d"` is the live refresh. Every row cites a `sources` row and each load is
recorded in `ingest_runs`. Full addresses and raw free text go to `private.incident_details`;
public columns keep only the street (`address_block`) and a scrubbed note.

Row counts below are from the Oct 24 2026 load.

Note: `common.upsert_incidents` skips rows whose columns are all unchanged, so a re-run writes
only what changed. That keeps WAL and disk use down on the free-tier DB.

## regional.py (Boston neighbours, `city <> 'boston'`)

### Somerville 311 — `somerville-311`
- Socrata `data.somervillema.gov` dataset `4pyi-uqq6`, `date_created >= 2023-01-01`.
- Types (via `type_map('somerville-311')`): `Rats` → `rodent`; `Rodent Assistance Program request`,
  `Rodent Assistance Program inquiry`, `School Rodent Control ` (trailing space) → `rodent_program`.
- Fields: `id`, `type`, `date_created`, `most_recent_status`, `most_recent_status_date`, `block_code`.
- No coordinates or street. Each request sits at its 2020 census block centroid from TIGERweb
  (`tigerWMS_Census2020/MapServer/10` = Census Blocks, `CENTLAT/CENTLON`), cached in
  `.cache/raw/somerville_block_centroids.json`. `geo_precision='block_centroid'`, `address_block`,
  `address_key` and `zip` are null.
- Status values are `Closed`, `In Progress`, `Open`. Closed → `closed`, and `closed_at` = `most_recent_status_date`.
- 5,832 rows (rodent 2,586; rodent_program 3,246), 2023-01-02 → 2026-10-24. 13 rows have no point (no block code or no TIGERweb match).
- Caveat: a block centroid is not the report location. Many requests share one point. Don't use these for address-level recurrence.

### Cambridge rodent sightings — `cambridge-rodent-sightings`
- Socrata `data.cambridgema.gov` `uz4w-baz5` (Commonwealth Connect / SeeClickFix), created `>= 2023-01-01`.
  Refresh also re-reads tickets with `ticket_last_updated_date_time` in the window, so it catches closures.
- Fields: `ticket_id`, `issue_type`, `ticket_status`, `issue_description`, `ticket_created_date_time`,
  `ticket_closed_date_time`, `ticket_last_updated_date_time`, `address`, `lat`, `lng`. `image` is not loaded.
- Every row → `rodent` (subtype `Rodent Sighting`). `Archived`/`Closed` → closed, `Open`/`Acknowledged` → open.
- The address comes in several geocoder formats (`… Cambridge, Massachusetts, 02139`, `… Cambridge MA 02140, United States`,
  Japanese locale, raw coordinates). Street and ZIP are parsed out; en-dash ranges are normalised before the house number is stripped.
- Public note: `issue_type` (when not the default) + description, with phones, house numbers before street names
  ("at 325 Franklin St" → "at Franklin St") and titled staff names removed. Resident text can still name a business or a landlord.
  Raw text and full address go to private.
- 1,872 rows (1,862 closed), 2023-01-02 → 2026-10-23. All have points. 56 have no ZIP.
- Caveat: these are resident complaints only. The metadata says internal work orders are excluded.

### Cambridge smart rat boxes — `cambridge-smart-rat-boxes` → `places` (`kind='smart_box'`)
- Socrata `data.cambridgema.gov` `78bs-b5ig`, full reload every run (528 rows).
- id `smartbox:<serial>:<sha1(device_name|address)[:8]>`. Serials are reused across deployments (442 distinct serials).
- attrs: `device_type` (Box/Pipe), `active`, `label` (device name, house numbers stripped), `total_since_install`,
  `prior_to_2023`, `annual_catches` {2023..2026}, `monthly_catches` {"2026-01": n, …}, `participatory_budgeting`.
- `monthly_catches` covers 2026 only, up to the current month, and the current month is partial. Future and blank months
  are left out, not stored as 0.
- 528 rows (294 active), 527 with coordinates. 2,954 catches in 2026.
- Caveat: these are deployment records, not a rat census. There's no install date.

## enforcement.py — `boston-code-enforcement`
- Analyze Boston CKAN resource `90ed3816-5e70-443c-803d-9a71f44470be` (Public Works violations).
- Descriptions kept (via `type_map('code-enforcement')`): `Improper storage trash: res|com` → `ce_trash_storage`;
  `Overfilling of barrel/dumpster` → `ce_overfill`; `Overgrown Weeds On Property` → `ce_weeds`;
  `Illegal dumping < 1 cubic yd`, `Illegal dumping 1-5 cubic yd.:`, `Illegal dumping 5+ cubic yd`,
  `Trash illegally dump container` → `ce_dumping`; `Maint a dumpster wopermit` → `ce_dumpster`.
  No description mentions rats or rodents.
- One row per ticket × violation code. id `ce:<ticket_no>:<code>`. The source repeats some ticket × code rows exactly, and those are de-duplicated.
- Date: the dataset has only `status_dttm`, which is used as `opened_at`. There's no separate issue or close date, so
  `closed_at` is null. `Void` tickets are dropped. Closed/Open come from `status`.
- Fields: ticket_no, code, status_dttm, status, description, violation_street/suffix/city/zip, latitude, longitude.
  `violation_city` (Dorchester, Roxbury, …) → `neighborhood`. The owner contact address (`contact_*`) is never read.
  No private details are stored and `address_key` is null; the street block is enough.
- Two outputs, to fit the DB size budget:
  - `signal_volume` (city, category, lat_bin, lon_bin, month, n): every 2023+ ticket, same ~100 m bins as `report_volume`.
    One CKAN GROUP BY per month via `ckan_sql_all`, so the portal's 32k-row cap can't truncate it. No rows are downloaded.
    Expected size is ~110k bin-months (~20 MB) for ~245k tickets.
  - `incidents`: individual tickets for the last `ROW_MONTHS` = 6 months (~38k rows), for the map and inspector card.
    Older rows are deleted on every run.
- Refresh (`since="14d"`) recomputes the previous and current month of `signal_volume` and upserts rows for the window.
- Caveat: tickets measure inspector activity as much as conditions. Their routes and sweeps drive the counts.

## weather.py — `noaa-ghcnd-logan` → `weather_daily`
- NCEI Access Data Service, `daily-summaries`, station `USW00014739` (Boston Logan), PRCP/SNOW (in), TMAX/TMIN (°F).
- 1,389 days, 2023-01-01 → 2026-10-20 (NOAA lags about 4 days). Refresh re-reads the window.
- Validation found only temperature matters. Rain and snow are stored, but no rain/snow events are derived.

## events.py → `events`
- `boston-move-out`: `move_out:<year>` 2023–2026, citywide (geom null), Aug 25 → Sep 7,
  attrs.zips = 02134, 02135, 02215, 02120, 02115.
- `boston-marathon`: `marathon:<year>`, Patriots' Day (third Monday of April) 9:00–18:00, point at the finish line, kind `sports`. 4 rows.
- `mlb-red-sox-schedule`: MLB Stats API `schedule?sportId=1&teamId=111&season=YYYY`. Home games at Fenway Park only.
  Postponed and cancelled games are skipped. `redsox:<gamePk>`, 3 h window, point at Fenway. 323 rows, 2023-03-30 → 2026-09-25.
- Marathon and Red Sox rows have `attrs.note` = display only: validation found no effect.
- The module is small and fully re-read each run; `since` is ignored.

## context.py — context only, not used by the forecast

Raw downloads cache to `<repo>/.cache/raw/` (override with `RAW_CACHE`). Order: tracts → Zillow → Airbnb →
iNaturalist → spending. ≈ 20 s with a warm cache; DB footprint ≈ 3 MB.

### Census tracts — `climate-ready-boston-svi`, `census-tigerweb-2020`, `cdc-places` → `tracts` (238)
- Boston 180: Climate Ready Boston SVI GeoJSON (2010 tracts). `attrs`: `pop`, `housing_units`, `neighborhood`, `tract`,
  `area_acres`, `svi_disability`, `svi_children`, `svi_older_adults`, `svi_low_income`, `svi_limited_english`,
  `svi_people_of_color`, `svi_medical_illness` (counts) and each as `*_pct` of pop.
- Cambridge 33 / Somerville 25: TIGERweb 2020 tracts (Middlesex 3521–3550 + 3594 = Cambridge, 3501–3515 = Somerville);
  `pop`/`housing_units` from 2020 Census (sums match city totals 118,403 / 81,045). No SVI fields.
- `asthma_pct` on all 238: CDC PLACES CASTHMA (adult crude %, data year 2023, 2020 tracts). 208 exact GEOID matches;
  30 redrawn Boston 2010 tracts take the area-weighted value of overlapping 2020 tracts (`asthma_method`). Model-based.
- Geometry simplified with `ST_SimplifyPreserveTopology(…, 0.00005)` (~5 m), then MakeValid/Multi; all valid.

### Zillow — `zillow-zhvi`, `zillow-zori` → `zip_prices` (4,131)
MA ZIPs starting `021`, 2020-01 → 2026-09; 51 ZIPs (49 with ZORI). Month = first of month. Includes inner-ring towns
(Chelsea, Quincy, Medford…) that share the prefix.

### Inside Airbnb — `inside-airbnb-boston` → `listings` (518)
Snapshot 2026-09-19 (267,731 reviews on 3,579 reviewed listings). Slim: all 161 listings with a rat review plus a stable
10% sample (`md5(id) % 10 == 0`) of the rest (357). **Rates over this table must weight non-rat rows ×10** (or use the
totals above). `rat_review_count` = reviews matching `\b(rats?|mice|mouse|rodents?)\b` after removing noise phrases
(computer/laptop mouse, rat race, gym rat, German "Rat" = advice, "really mice" typos, negations like "no mice"):
200 reviews (0.07%). `rat_review_samples`: ≤ 3 newest excerpts, ≤ 200 chars, reviewer and host names → `[name]`
(a co-host name in free text can remain). Spot-check of 20 random matches: 20/20 real.

### iNaturalist — `inaturalist` → `incidents` (`category='inat_rat'`, 535)
Rattus in bbox 42.22–42.42 N, −71.20 to −70.98 W; `inat:<id>`, `closed`, `opened_at` = observed_on (2007-07-27 →
2026-10-16). `subtype` = "taxon (quality_grade)", 380 research grade. `geo_precision='obscured'` for 16 fuzzed points.
`city` from the containing tract: boston 311, cambridge 61, somerville 49, region 114. No observer names or place text.

### City spending — `boston-checkbook` → `spending` (58; migration `20261024100002_data_spending.sql`)
Checkbook Explorer payments to vendors matching `pest|exterminat*|Terminix|Orkin`, by fiscal year × department × vendor.
FY from `Entered` (the FY2023 table labels Jul–Oct 2022 as FY2022). FY2023 $415K, FY2024 $39K, FY2025 $1.60M,
FY2026 $783K; BPS is most of it. Lower bound (vendor-name match). The portal's FY2024 table holds only July 2023, so
FY2024 is incomplete, not a drop.

## parcels.py — `boston-assessment-fy26`
- Assessment FY2026 `ee73430d-96c0-423e-ad21-c4cfb54c8961` (184,552 PIDs, condo units included) + FY2025 `6b7e460e-33f6-4e61-80bc-1bef2e73ac54` (`TOTAL_VALUE` joined on PID → `value_fy25`).
- `parcels`: pid, address_block (street + ZIP, no number), zip, land_use (`LU_DESC`), yr_built, own_occ, units (`RES_UNITS`; null for R1/R2/R3/CD, filled with 1/2/3/1), value_fy25, value_fy26, lat/lon.
- Coordinates (the assessment has none), first hit wins: (1) shoelace centroid of the Parcels25 polygon from the city GIS MapServer `gisportal.boston.gov/arcgis/rest/services/Parcels/Parcels25/MapServer/0` (98.5k polygons, `MAP_PAR_ID` = PID, assessment `GIS_ID` maps condo units to their lot); (2) RentSmart property table `f6b5aee9-…` (`rs_prop_pid`); (3) SAM address points `fee8ee07-…` matched on number + street + ZIP (suffixes normalised, AVE→AV, TER→TE, …); (4) condo main point via `CM_ID`; (5) nearest same-parity number on the street within 20.
- Coverage: 175,975 / 176,007 = 100.0% after dropping CP (before: 184,520 / 184,552; 184,495 polygon, 25 SAM). Polygon centroid vs RentSmart point: median 10 m, p90 28 m.
- Owner and full address → `private.parcel_owners` only. `mail_address` is left null to save space. Condo parking (`LU = CP`, 8,545 rows) is skipped.
- Vacant land → `places` kind `vacant_parcel` (id `vacant:<pid>`), `LU_DESC` in RES LAND (Unusable) / RESIDENTIAL LAND / RES LAND (Secondary) / COMMERCIAL LAND / COM LAND (Unusable|Secondary) / INDUSTRIAL LAND / IND LAND (Secondary|Unusable). Parking lots, ancillary and underwater land excluded. 6,046 rows, 6,038 located.
- Re-runs write only rows that changed (`_changed`), so the 100 MB tables don't double with dead tuples. No dates, so `since` is ignored.
- Caveat: the centroid of an irregular lot can fall outside it. Condo units share their building's point.

## food.py — `boston-food-inspections` → `places` kind `restaurant`
- Food establishment inspections `4582bec6-2b4f-4f9e-bc55-cbaa73117f4c`, `resultdttm >= 2024-01-01`. Filter = validation's (pull_grid.py): violdesc ILIKE rodent/mice, or comments ILIKE rodent/mouse/mice/' rat '.
- One row per license: id `food:<licenseno>`, name = businessname, address_block from `address`, lat/lon from `location` "(lat, lon)", starts_at = first rodent citation.
- attrs: license, business_type, n_rodent_violations, n_explicit, last_result, last_citation, rodent_violations (last 20: date, desc, comment (scrubbed), result, status, explicit). Re-inspection rows are collapsed to one per day × violation code.
- `explicit` = the comment names rodents/mice/rats/droppings. The violdesc filter also catches generic pest codes (fly paper under "Removing Dead or Trapped Birds, Insects, Rodents"), so use `n_explicit` when you need rodent-only.
- `since`: licenses with a citation in the window get their whole 2024→ history re-aggregated (a 30d run touched 64).
- 1,157 businesses, 1,112 located. Licensee person names (`namefirst`, `namelast`, `legalowner`) are never read. Comments mention "the inspector" but no names were found.

## permits.py — `boston-building-permits` → `places` kinds `demolition`, `excavation`
- Approved building permits `6ddcd912-32a0-43df-9908-63574f8c7e77`, `issued_date >= 2023-01-01`, coords `y_latitude`/`x_longitude`.
- demolition: worktype RAZE (291), EXTDEM (158). excavation: SITE ("Excavation Borings Test Pits", 219) and new construction (ERECT with permittypedescr "Erect/New Construction", NEWCON), attrs.subtype `site_work` | `new_construction`. The dataset has no separate excavation worktype.
- id `permit:<permitnumber>`, name = work description (≤80 chars), starts_at = issued, ends_at = expiration. attrs: permit, worktype, subtype, permit_type, status, declared_valuation, `display_only: true`, note.
- Display only: validation found no effect, so the model doesn't use them. Applicant and comments are never stored (comments carry house numbers).
- 1,460 rows (449 demolition, 1,011 excavation), 1,455 located.

## places_misc.py — static layers → `places`
- `boston-bigbelly` (`15e7fa44-…`): kind `bigbelly`, 542 rows, 525 located. Location "(lat, lon)". Description stripped of house numbers and parentheses. id `bigbelly:<lat>,<lon>`.
- `boston-city-lots` (`93481af5-…`): kind `city_lot`, 1,340 rows (unique PARCELID), 1,339 located. Point = centroid of the first ring of `the_geom`. address_block = STREETNAME only.
- `boston-public-schools` (`6ceeff38-…`): kind `school`, 134 buildings (id `school:<SCH_ID>-<BLDG_ID>`), name = SCH_LABEL, attrs school_type/school/building.
- `boston-colleges` (`f59456d7-…`): kind `college` (added to place_kinds in contracts + web categories.json), 60 rows, 57 located. attrs students (2013 count), campus_housing.
- Each load deletes and rewrites its own kind. `since` is ignored.

## cambridge.py — Cambridge equivalents (data.cambridgema.gov)
`run(since)` loads all five; with `since` (daily cron) it skips the static parcels + schools. Addresses are `street, [unit,] city, MA zip`: public `address_block` = street before the first comma with every leading number token stripped (`44.5-46`, `1/2`, `0REAR`, `5-A`), + ZIP; full address → `private.incident_details` / `private.parcel_owners`.
- `cambridge-food-inspections` (daily) — Sanitary Inspections `ryb9-qzmw`, `case_open_date >= 2024-01-01` and (code "Controlling Pests" 6-501.111 or comments naming rodent/mice/mouse/rat/droppings). No license number in the portal: one place per business name + address, id `camfood:<sha1[:12]>`. attrs as food.py (`license` null, `last_result` = case status). Comments: pasted HTML stripped, "with/by First Last" → `[staff]`, house numbers/phones/emails scrubbed. Building-level inspections are named by address, so house numbers are stripped from names. 260 places (259 located), 2024-01-02 → 2026-09-30.
- `cambridge-housing-violations` (daily) — Housing Code Violations `f8su-kv88`, code 410.550 ("Extermination of Insects, Rodents and Skunks" / "Elimination of Pests") or pest-worded descriptions, 2023+. One incident per inspection case, `incidents.category='pest'`, id `camhcv:<case id>`, subtype = violation description(s), closed_at = `issue_date` (all cases are "Complete"). No free-text notes exist. 769 cases (767 located), 2023-01-03 → 2026-10-02. Rodents vs insects can't be separated (one code covers both).
- `cambridge-assessment-fy26` (static) — Property Database `eey2-rv59` FY2026 per PID (multi-building PIDs collapsed: first building's address, units summed, earliest year built; assessed value is per parcel). pid `cam:<PID>`, value_fy25 from FY2025, own_occ = `residentialexemption` (MA residential exemption = owner-occupied), land_use = `propertyclass`. FY2026 rows lack coordinates for half the parcels: point from FY2026 → same PID FY2025 → parcel polygon centroid (`c392-hjk3` by GIS ID). 28,850 parcels, 99.6% located. No ZIP in the dataset (owner ZIP is the owner's mailing ZIP), so `zip` is null. Owner + co-owner → `private.parcel_owners` only. Vacant / undevelopable land classes (Vacant*, *-UDV-*, *-DEV-LAND, RES LND-IMP UNDEV) → `places` kind `vacant_parcel` (id `vacant:cam:<PID>`), 394 rows (384 located); includes city/authority-owned vacant land.
- `cambridge-building-permits` (daily) — Demolition Permits `kcfi-ackv` → kind `demolition` (201), New Construction `9qm7-wbdc` → kind `excavation`, attrs.subtype `new_construction` (177); 2023+, all located. id `campermit:demo|new:<id>`, name = scrubbed work description. Display only, like Boston. Applicant / licensee / architect names never read. Cambridge publishes no excavation/site-work permit type.
- `cambridge-public-schools` (static) — `9xx9-tt7e` → kind `school`, 18 sites, id `camschool:<slug>`.
- Construction complaints: Commonwealth Connect `2z9k-mv9g` issue_type "Construction Complaint" is mapped under `construction_debris` for `cambridge-311` in categories.json, loaded by `regional._cambridge_evidence` (1,602 since 2023).

## somerville.py — Somerville equivalents (data.somervillema.gov + MassGIS)
`run(since)` loads all three; with `since` (daily cron) it reloads permits only. Public `address_block` = street (leading number tokens like `33.5`, `12R-14` stripped) + ZIP; site address + owner → `private.parcel_owners` only.
- `somerville-building-permits` (daily) — Applications for Permits and Licenses `nneb-s3f7`, issue_date 2023+, category Permitting. "Demolition Permit" → kind `demolition` (attrs.subtype `raze` | `accessory_structure`, 132); Building Permit "Residential/Commercial New Construction" → kind `excavation`, attrs.subtype `new_construction` (251). id `sompermit:<application_id>`, name = generic permit subtype; the free-text project description and applicant are never read. Points from the portal's lat/lon; 2 of 385 rows (0.5%) had none and are skipped. Somerville has no excavation / foundation / site-work permit type. Display only, like Boston.
- `somerville-assessment-massgis` (static) — MassGIS Level 3 standardized assessor parcels, `arcgisserver.digital.mass.gov/.../AGOL/L3_Parcels_FeatureService_4326/FeatureServer/1`, `TOWN_ID=274` only (Cambridge is loaded from its own property database, not here). One row per PROP_ID (condo units share the lot polygon; point = polygon centroid via `returnCentroid`). pid `som:<PROP_ID>`, land_use = MA DOR class label (first 3 digits of USE_CODE; `0xxx` = mixed use), yr_built = YEAR_BUILT, units = UNITS or 1/2/3 by class, value_fy26 = TOTAL_VAL — **MassGIS holds FY2025 for Somerville**, so the value is FY2025 (noted on the source); value_fy25 null. own_occ is a proxy: owner mailing address = site address in Somerville (MassGIS has no residential-exemption flag). ZIP is published for under a third of records; missing ZIPs are borrowed from the street when every known parcel on it shares one ZIP (13,081 of 18,997 have a ZIP). 18,997 parcels, all located, 18,502 with year built. Vacant land (DOR 130–132, 390–392, 440–442) → `places` kind `vacant_parcel` (id `vacant:som:<PROP_ID>`), 184 rows.
- `somerville-public-schools` (static) — MassGIS PK-12 schools `AGOL/Schools/FeatureServer/0`, `TOWN='SOMERVILLE'` → kind `school`, 13 rows, id `school:som-<SCHID>`.
- Somerville 311 (`regional._somerville`) also maps, under `somerville-311` in categories.json: `pest` ← "Tenant complaint or inspection request" (471), "Mice" (88), "Bedbugs" (15); `weeds` ← "Overgrowth or encroachment on private property" (4,523); `construction_debris` ← "Construction Noise Report" (878), "Building permit violation/illegal construction" (261); `sanitation` ← "Restaurant violation" (56). Counts since 2023. Somerville 311 has no rat-bite, vacant-lot or abandoned-building type ("Abandoned Property or Illegal Dumping" stays `dumping`).
