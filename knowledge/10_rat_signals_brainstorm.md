# Rat Audit: causes, impacts, actions, and what to retrieve

Brainstorm date: **October 24, 2026**. Builds on [15 — Boston Rat Audit](15_boston_rat_audit.md). Datasets marked ✅ were confirmed on Analyze Boston (CKAN `package_search`) or by an API call today. Unmarked rows are ideas that still need a source check.

## 1. The model in one line

**Rats need food, shelter and water.** Something has to change for reports to rise: more food (trash, restaurants, events), new shelter (old buildings, vacant lots, overgrown weeds), or **displacement** (construction, rain, sewer work) that pushes rats from where they lived into view. Every predictor below fits one of these, plus a fourth group: **who reports**.

## 2. Causes that may predict reports

### A. Food

| Idea | Hypothesis to test | Data |
|---|---|---|
| **Trash dwell time** | Barrels set out before pickup day feed rats overnight. Blocks with "Trash Placed Out Early" reports and Monday pickups (out all Sunday) do worse | ✅ trash-schedules-by-address, 311 new system |
| **Holiday pickup shifts** | A holiday that delays pickup by a day leads to a spike in reports the next week | trash schedules + city holiday calendar |
| **"Allston Christmas" (Sept 1 move-out)** | A predictable spike every September in student ZIPs (02134, 02135, 02215, 02120) | ✅ 311 "Student Move-In" type, ✅ colleges-and-universities |
| **Restaurant density and late-night food** | Late-night bars produce food waste after the last pickup | ✅ active food licenses, ✅ liquor-licenses, ✅ entertainment licenses |
| **Food trucks** | Trash spikes at truck stops on the days they serve | ✅ food-truck-schedule |
| **Big events** | Fenway games, concerts, the Marathon and parades create a trash surge, then reports 1–2 weeks later | MLB schedule, ✅ one-time-entertainment-licenses, ✅ special-one-day-alcohol-licenses |
| **Haymarket** | Friday and Saturday produce market leaves waste at the same spot every week | fixed location, no dataset needed |
| **Litter basket overflow** | Public bins that fill too fast | ✅ big-belly-alerts-2014 (fill alerts), 311 Empty Litter Basket |
| **Dog waste and bird feeding** | Rats eat both. Dog-park density as a proxy | ✅ park-features (dog parks) |

### B. Shelter (harborage)

| Idea | Hypothesis | Data |
|---|---|---|
| **Old buildings** | Pre-1900 brick foundations and fieldstone basements have more gaps | ✅ property assessment `YR_BUILT` |
| **Absentee owners** | Non-owner-occupied rentals fix less | ✅ `OWN_OCC`, owner mailing address |
| **Vacant and city-owned lots** | Overgrown lots are nesting sites | ✅ dnd-managed-city-property-inventory-all, 311 Trash on Vacant Lot |
| **Overgrown weeds and ground cover** | Ivy and dense shrubs hide burrows | 311 Overgrown Weeds, ✅ bprd-trees, ✅ tree-canopy-change-assessment, ✅ 2016-land-cover |
| **Alleys** | Back alleys hold the dumpsters and get little sweeping | ✅ boston-street-segments-metadata, ✅ street-sweeping-schedules |
| **Sewers** | Norway rats live in old combined sewers. Neighborhoods with combined sewers and CSO outfalls may have more | BWSC sewer maps, MWRA CSO outfall list |
| **Community gardens and compost** | Food and soil, often next to housing | not found on Analyze Boston; try Boston Natural Areas Network or Project Oscar lists |

### C. Displacement (the strongest "something changed" signal)

| Idea | Hypothesis | Data |
|---|---|---|
| **Demolitions** | Rats move to neighboring blocks within 300 m and 90 days. Boston requires rodent control before a demolition permit. Do demolitions show a spike anyway? | ✅ approved-building-permits (full, not just starter) |
| **Street and utility digs** | Excavation breaks burrows and sewer lines | ✅ public-works-active-work-zones |
| **Heavy rain** | Flooded burrows and surcharged sewers push rats up within days | ✅ rainfall-data, NOAA daily weather (Logan station) |
| **Mild winter** | A warm winter means more breeding and a bigger spring | NOAA daily temperatures |
| **Snow** | Snowbanks hide trash for weeks. Reports rise when the snow melts | NOAA snowfall, ✅ snow-emergency-routes |
| **Coastal flooding** | King tides in low-lying areas | ✅ sea-level-rise flood layers |

### D. Who reports (we must control for this)

| Idea | Why it matters | Data |
|---|---|---|
| **Total 311 volume per block** | Some blocks report everything. Use rodent share of all 311 reports, not raw counts | 311 yearly |
| **Renters, language, income** | Some groups underreport, so low counts do not mean few rats | Census ACS, ✅ climate-ready-boston-social-vulnerability, ✅ residential-displacement-risk-map-scores |
| **An independent rat signal** | **467** iNaturalist observations of *Rattus norvegicus* in the Boston area. Comparing them with 311 shows where reporting lags | ✅ iNaturalist API |

## 3. Impacts we can measure

| Area | Impact | Data and status |
|---|---|---|
| **City spending** | In FY2026 the city paid **about $776,000** to vendors with "pest" or "extermin" in their names. **Boston Public Schools paid $611,000** of it (51 payments). This is a lower bound: other vendors and in-house ISD work are not counted | ✅ checkbook-explorer, queried today |
| **Schools** | BPS is the biggest pest-control spender. Which schools have rodent complaints nearby? | ✅ public-schools, ✅ buildbps-facilities |
| **Fires and outages** | Rats chew wires. **Tested Oct 24: no link found** (see section 7) | ✅ fire-incident-reporting |
| **Sidewalks** | Burrows undermine sidewalks and tree pits | ✅ sidewalk-inventory, 311 sidewalk repair |
| **Health** | Asthma (rodent allergen), leptospirosis, rat bites | CDC PLACES, 311 Rat Bite, MDPH reportable diseases |
| **Wildlife** | Rat poison kills hawks and owls that eat poisoned rats. Massachusetts has bills to restrict these poisons | Mass Audubon and Tufts Wildlife Clinic reports |
| **Restaurants** | Failed inspections and closures | ✅ food inspections (3,608 rodent mentions since 2025) |
| **Visitors** | Airbnb guests leaving early | ✅ Inside Airbnb (212 rat reviews) |
| **Tenants** | Repeat infestations | ✅ RentSmart |
| **Staff time** | Inspector salaries times repeat visits gives the cost of "closed but came back" | ✅ employee-earnings-report |

## 4. Actions the tool can recommend

Each action has an owner, and the app shows what happened the last time it was tried.

| Driver found | Action | Owner |
|---|---|---|
| Barrels out early, no lids | Warning, then fine; deliver rat-resistant barrels | Public Works, ISD |
| Overflowing dumpster | Order a compactor or more pickups | ISD, private hauler |
| Restaurant cited | Re-inspect and ask for its waste contract | ISD Health |
| Demolition planned | Bait the surrounding blocks **before** work starts; notify neighbors | ISD with the permit holder |
| Street dig | Bait during the dig; check sewer lines | Public Works, BWSC |
| Vacant city lot | Mow, clean, fence | Neighborhood Development |
| Public bin overflowing | Swap for a Big Belly or empty it more often | Public Works |
| Repeat landlord | Escalate across the owner's whole portfolio | ISD Housing |
| Move-out week, Fenway game, heavy rain | Extra pickups and baiting scheduled ahead | BRAP coordinator |
| School nearby | Joint plan with BPS facilities | BPS, ISD |

**Ideas that go beyond enforcement:**

- **Predictive calendar:** a "rat weather" forecast for next week (rain, events, move-out, holidays, demolitions) so crews act before reports come in.
- **Auto follow-up:** reopen a "closed" case automatically if a new report arrives within 60 days.
- **Matched-block test:** give barrels to half of similar blocks and compare. This turns the city's pilot into evidence.
- **Fertility control:** Somerville piloted rat birth control in 2021. Worth checking its published results.

## 5. What we should actually retrieve

Ranked by value for the demo and for prediction, cheapest first.

### Tier 1: retrieve now (needed for the demo and the core model)

1. **311 yearly tables 2023–2026**, rodent and trash types, with lat/long. Gives seasonality, Sept 1 spikes and recurrence. Recent years only, so every finding applies to how the city works today.
2. **Approved building permits (full)**, demolitions and excavations with dates and locations.
3. **Public Works active work zones.**
4. **Trash schedules by address** + 311 "Trash Placed Out Early".
5. **Daily weather:** rainfall-data + NOAA Logan (rain, temperature, snow).
6. **Property assessment, RentSmart and food inspections** (already queried).
7. **Big Belly locations and fill alerts.**

### Tier 2: retrieve if time allows (strong story, light effort)

8. **Checkbook explorer** for pest spending by department and year (the cost slide).
9. **Fire incidents** with electrical causes.
10. **Public schools** + BPS facilities.
11. **Liquor and entertainment licenses** (late-night food).
12. **City-owned lots, trees and land cover** (shelter).
13. **iNaturalist rat observations** (independent signal).

### Tier 3: nice to have

14. MLB and event calendars. 15. Census ACS renter share. 16. Somerville and Cambridge 311 rodent data, to compare cities. 17. Wildlife poisoning reports.

### Skip

- Zillow property values: weak and confounded (see doc 09, section 6).
- Yelp and Google reviews: no open Boston dataset, and scraping is risky.

## 6. Three tests worth running first

1. **Demolition spike:** rodent reports within 300 m, in the 90 days before and after each demolition, compared with random control points. If it holds, it supports the "bait before demolition" action.
2. **Trash-day effect:** rodent rate by pickup day, controlling for density. If Monday-pickup blocks are worse, it is a cheap fix.
3. **Rain lag:** daily reports against rainfall over the previous 0–7 days. If it holds, it powers the forecast.

## 7. Results

### Electrical fires vs rodent reports: no link (tested Oct 24)

[fire_pull.py](sources/rats/fire_pull.py), [fire_rats.py](sources/rats/fire_rats.py). 25 Boston ZIPs, 2023–2024: 1,121 electrical incidents (wiring problems, arcing, short circuits, overheated motors, ballasts) and 7,924 rodent reports, each per 1,000 property records.

| Test | Spearman ρ |
|---|---|
| Electrical incidents vs rodent reports | +0.30 |
| Same, controlling for all fire-department calls per 1,000 | **−0.08** |
| Electrical share of fire calls vs rodent share of 311 | −0.03 |
| 2026 check (new coding, 542 electrical hazard calls), controlling for all calls | +0.17 |

The raw +0.30 is density: busy ZIPs have more of every call type (all fire calls vs rodents is +0.55). Once that is removed the link is gone. The fire data also has **no cause field and no lat/long**, so a fire can never be attributed to rats. 2025 is mostly missing from the table (Jan to early Mar, then late Dec). **Do not use fires in the pitch.**

## Sources

- Analyze Boston CKAN search (`https://data.boston.gov/api/3/action/package_search`), queried 2026-10-24.
- Checkbook Explorer resource `7afd05bc-34ec-4a1c-b470-bf43ea584f81`, query: vendor name or account description contains "pest" or "extermin", grouped by fiscal year and department.
- iNaturalist (`api.inaturalist.org/v1/observations?taxon_name=Rattus norvegicus`, Boston bounding box 42.22–42.40 N, 70.98–71.19 W): 467 observations.
