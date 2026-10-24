"""Which sources get live updates. Single source of truth; db.upsert_source writes it to `sources`.

live   = Refresh button (Modal `refresh`, jobs.REFRESH_SOURCES) + daily cron
daily  = daily cron only (jobs.DAILY_SOURCES, Modal `daily`, 10:00 UTC)
static = loaded once: a snapshot, or a closed historical year. Re-run with a backfill.
"""

UPDATE_MODES: dict[str, tuple[str, str]] = {
    # ---- live (Refresh button + daily) ----
    "boston-311-2026": ("live", "Analyze Boston updates daily; refresh re-reads the last 14 days to catch closures"),
    "boston-311-new": ("live", "new 311 system (Aug 2025–); same 14-day window"),
    "boston-311-volume": ("live", "all-type 311 volume; current year recomputed on every refresh"),
    "boston-code-enforcement": ("live", "tickets: last 6 months as points, 2023+ as monthly counts; no close dates published"),
    "somerville-311": ("live", "Somerville publishes daily; rodent + trash evidence; points are census-block centroids"),
    "cambridge-rodent-sightings": ("live", "Cambridge publishes daily"),
    "cambridge-311": ("live", "Cambridge service requests: trash, dumping, dead animals; published daily"),
    "cambridge-smart-rat-boxes": ("live", "full reload each refresh; monthly catches for 2026"),
    # ---- daily (cron only) ----
    "noaa-ghcnd-logan": ("daily", "NOAA posts with a ~4-day lag"),
    "boston-food-inspections": ("daily", "rodent-related violations; businesses with a new citation are rebuilt"),
    "boston-building-permits": ("daily", "demolition / excavation / new construction; display only"),
    # ---- static (loaded once) ----
    "boston-311-2023": ("static", "closed year"),
    "boston-311-2024": ("static", "closed year"),
    "boston-311-2025": ("static", "closed year; late closures picked up only by a backfill"),
    "boston-assessment-fy26": ("static", "annual assessment (FY2026, FY2025 values joined)"),
    "boston-sam-addresses": ("static", "address points used to place parcels"),
    "boston-bigbelly": ("static", "bin locations"),
    "boston-city-lots": ("static", "city-owned property inventory"),
    "boston-public-schools": ("static", "school locations"),
    "boston-colleges": ("static", "college locations"),
    "boston-checkbook": ("static", "city spending FY2023–26; FY2024 table incomplete"),
    "climate-ready-boston-svi": ("static", "2010 tracts"),
    "census-tigerweb-2020": ("static", "2020 tracts and population"),
    "cdc-places": ("static", "2023 release"),
    "census-reporter-acs": ("static", "ACS 5-year by tract, all three cities (income, renters, poverty, race, language, housing age)"),
    "zillow-zhvi": ("static", "monthly series; snapshot of Oct 24"),
    "zillow-zori": ("static", "monthly series; snapshot of Oct 24"),
    "inside-airbnb-boston": ("static", "snapshot 2026-09-19"),
    "inaturalist": ("static", "snapshot of Oct 24"),
    "boston-marathon": ("static", "calendar"),
    "boston-move-out": ("static", "calendar"),
    "mlb-red-sox-schedule": ("static", "season schedules 2023–2026"),
}


def mode_for(source_id: str) -> tuple[str, str]:
    if source_id not in UPDATE_MODES:
        raise KeyError(f"source {source_id!r} has no update mode; add it to rat_audit/ingest/update_modes.py")
    return UPDATE_MODES[source_id]
