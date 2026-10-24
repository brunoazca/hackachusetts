# Data report — Rat Audit Boston (for the video)

One page of the real numbers, how the datasets link, and what overlaps mean.
Every row below is checked against the committed snapshot in `data/civic/datasets/`
(saved 2026-10-18) and the validation in `.kiro/specs/rat-audit/data-audit.md`
(tested live 2026-10-24).

---

## 1. The data we use (demo-safe snapshot)

22 datasets, all committed as static CSV. The 4 Boston city tables below are the
demo path; the rest are context and campus/region layers.

| Dataset | What it is | Rows | Source |
|---|---|---:|---|
| boston-311 | 311 service requests | 5,000 | data.boston.gov |
| permits | Approved building permits | 8,240 | data.boston.gov |
| violations | Code / property violations | 2,018 | data.boston.gov |
| neighborhoods | Per-neighborhood population + income | 24 | data.boston.gov |
| numina | Street sensor counts | 245,555 | data.boston.gov |
| vision-zero | Crash records | 44,986 | data.boston.gov |
| bluebikes | Station-to-station rides | 63,063 | hubway-data |
| cambridge-bikes | Citywide bike counts | 92,268 | data.cambridgema.gov |
| cambridge-crashes | Police crash records | 17,230 | data.cambridgema.gov |
| eco-totem | Broadway bike counter | 17,123 | data.cambridgema.gov |
| fresh-pond | Fresh Pond usership | 8,784 | data.cambridgema.gov |
| somerville-counts | Bike + pedestrian counts | 2,532 | data.somervillema.gov |
| ej | Environmental justice block groups | 2,604 | mass.gov GIS |
| colleges | Colleges + universities | 206 | mass.gov GIS |
| mbta-stations | Rapid transit stations | 170 | mass.gov GIS |
| mbta-alerts | Service alerts | 130 | mbta.com |
| mbta-routes | Subway routes | 8 | mbta.com |
| fema | MA disaster declarations | 415 | fema.gov |
| scorecard | College Scorecard | 140 | scorecard.network |
| ipeds | IPEDS institution directory | 144 | nces.ed.gov |
| onet | O*NET occupations | 1,016 | onetcenter.org |
| openalex-works | Campus research works, 2024 | 500 | openalex.org |

**The 4 that drive the demo:** `boston-311`, `permits`, `violations`, `neighborhoods`.

---

## 2. How they link (the join keys)

The datasets connect on place. Three keys do all the work.

```
            ward  ──────────────┐
 boston-311 ───────────────► permits
   │  zip_code                 │ zip / ward
   │  ward                     │
   │  neighborhood ─────► neighborhoods (24 rows: population, income, education)
   │                            ▲
 violations ──── zip / ward ────┘
```

| Key | In which tables | What it joins |
|---|---|---|
| ward | 311, permits, violations | city voting ward |
| zip / zip_code | 311, permits, violations | ZIP area |
| neighborhood | 311, neighborhoods | the 24 named neighborhoods |

So one ward or ZIP ties a 311 complaint, a building permit, a code violation, and
the neighborhood's people-and-income context into one place. That is the overlap
the map shows.

---

## 3. The main finding: what the data says about rats

We tested dozens of possible rat drivers on live Boston data (19,466 rodent
reports, grid of 1,319 lived-in cells). Two numbers carry the story.

| Signal | How strong | Read |
|---|---:|---|
| Warm months → more rats | **+0.87** | Strongest effect. Summer is rat season. |
| Last year's reports here | **+0.32** | Rats come back to the same blocks. |
| Trash storage problems (311 + code) | +0.17 | Real but smaller. |
| Dead-animal + indoor-pest reports | +0.11 to +0.14 | Early warning before a hot spot. |
| Rain, snow, demolitions, restaurants | ~0 | Honest nulls. We show these as "not a cause". |

One sentence for the video: **rats follow heat and trash, and they come back to
the same place — so we forecast where, and a human picks the next action.**

---

## 4. The overlaps that make a hot spot

A block lights up when the layers stack. The map lets an inspector click one
place and see all of it.

```
   trash 311  +  code violation  +  warm month  +  last-year rat report
        └──────────────┴───────────────┴──────────────┘
                        = a Due rat site
```

| Overlap | Why it matters |
|---|---|
| 311 trash reports **and** code violations in the same ward | the place is both reported and cited |
| Rat reports **and** low-income neighborhood | 311 counts are lower where vulnerable people live — we flag under-reporting, not fewer rats |
| Forecast high **but** ≤ 1 report in 12 weeks | an *emerging* hot spot — act before it blows up |

Caveat we keep on screen: **a 311 count is a report, not a rat.** More reports can
mean more people calling, not more rats.

---

## 5. What's real vs. what's live

- **Demo path:** the committed CSVs above. Nothing breaks on stage.
- **Live path:** the same tables refresh from data.boston.gov through read-only
  calls; every number on screen cites its `sources` row (name, URL, time).
- **Human in the loop:** the tool forecasts and recommends; a person approves the
  next action. No civic action is automatic.

Sources: `data/civic/CATALOG.md`, each `data/civic/datasets/<name>/README.md`,
and `.kiro/specs/rat-audit/data-audit.md`.
