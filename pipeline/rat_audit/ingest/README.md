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
- 5,832 rows (rodent 2,586; rodent_program 3,246), 2023-01-02 → 2026-10-24. 13 rows have no centroid (blank block code).
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
- Fields: ticket_no, code, status_dttm, status, description, violation_stno/sthigh/street/suffix/city/zip, latitude, longitude.
  `violation_city` (Dorchester, Roxbury, …) → `neighborhood`. The owner contact address (`contact_*`) is never read.
- **Window is 2025-01-01 on** (`START`): 116,386 rows, 2025-01-02 → 2026-10-23. 2023+ would be ~245k rows, which
  would push the free-tier DB past 500 MB (read-only). Widen `START` only after a disk upgrade.
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
