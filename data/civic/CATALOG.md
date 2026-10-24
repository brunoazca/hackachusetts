# Hackachusetts — Civic Action data catalog

Mirror of the **Civic Action** track from the official Hackachusetts data portal
(`https://hackachusetts2026.vercel.app/#/civic`), downloaded into this repo on
**2026-10-24**. Dataset snapshots themselves were saved by the portal on **2026-10-18**.

> These files are an UNTRUSTED mirror of third-party open data. Each dataset ships
> with its own source URL and license note. **Check the source license before
> republishing** any slice in a submitted project (every dataset README repeats this).

## What's here

```
data/civic/
├── CATALOG.md              # this file
├── kits/                   # original downloaded .zip starter kits (as served)
│   ├── tracks-civic.zip    # full civic track: all 22 inspected datasets (superset)
│   ├── challenges-v1.zip   # V1 "Simplified public services" subset
│   ├── challenges-v2.zip   # V2 "Responsive and resilient communities" subset
│   ├── challenges-v3.zip   # V3 "Safer and connected places" subset
│   ├── challenges-v4.zip   # V4 "Better college experiences" subset
│   └── challenges-v5.zip   # V5 "Pathways to education and opportunity" subset
└── datasets/               # extracted from tracks-civic.zip (the complete set)
    └── <dataset>/
        ├── data.csv        # committed snapshot (the demo-safe static data)
        ├── README.md       # description, columns, row count, direct source URL
        ├── fetch.py        # re-pull a fresh copy from the source
        └── fetch.js        # same, in Node
```

The civic track kit is the superset, so `datasets/` is extracted from it. The
`challenges-v*.zip` kits contain the same per-dataset folders, scoped to each
challenge; they are kept zipped to avoid duplicating files.

## The Civic Action track (from the portal)

**Blurb:** Strengthen the places, communities, and opportunities that shape daily life.

**Opportunity areas**
- **Better Together: Improving Where We Live, Work, Study & Play** — everyday
  challenges in housing, transportation, public spaces, community connections,
  and access to opportunity.
- **Citizen-Friendly Digital Government** — services are hard to navigate: complex
  sites, long PDFs, language barriers, multi-agency application flows.
- **More Responsive Neighborhood Services** — 311-style reporting where volume
  hides patterns and makes it hard to prioritize and show progress.

**Challenges**
| Code | Title | Framing | Direction |
|------|-------|---------|-----------|
| V1 | Simplified public services | One task. Too many sites and agencies. | Plain language. Show the next step. |
| V2 | Responsive and resilient communities | Volume hides who is waiting, and who an alert misses. | Triage the pattern. Prep is not a siren. |
| V3 | Safer and connected places | The last mile is a street, a bike, or a crash. | Show what changed, and where it is unsafe. |
| V4 | Better college experiences | Create more supportive college experiences. | Show the campus, the engagement, and the research. |
| V5 | Pathways to education and opportunity | Expand access to life-changing opportunities. | Cost, wages, and the next step. |

## Datasets (22 verified CSVs)

The earlier count of 23 was a catalog discrepancy. The table and inspected full
track ZIP contain 22 CSV datasets; see [the verification](../../knowledge/07_civic_dataset_verification.md).

Row counts are rows in the saved `data.csv` (the live API call usually returns only ~100 rows).

| Dataset | Title | Rows | Source |
|---------|-------|-----:|--------|
| boston-311 | Boston 311 service requests | 5,000 | data.boston.gov |
| permits | Boston approved building permits | 8,240 | data.boston.gov |
| violations | Boston building and property violations | 2,018 | data.boston.gov |
| neighborhoods | Boston neighborhood estimates, 2025 | 24 | data.boston.gov |
| numina | Boston Numina street sensors | 245,555 | data.boston.gov |
| vision-zero | Boston Vision Zero crash records | 44,986 | data.boston.gov |
| mbta-alerts | MBTA service alerts | 130 | api-v3.mbta.com |
| mbta-routes | MBTA subway routes | 8 | api-v3.mbta.com |
| mbta-stations | MBTA rapid transit stations | 170 | arcgisserver.digital.mass.gov |
| ej | MassGIS environmental justice block groups | 2,604 | arcgisserver.digital.mass.gov |
| colleges | MassGIS colleges and universities | 206 | arcgisserver.digital.mass.gov |
| fema | OpenFEMA disaster declarations, MA | 415 | fema.gov |
| scorecard | College Scorecard, Massachusetts | 140 | ed-public-download.scorecard.network |
| ipeds | IPEDS institutional directory, MA | 144 | nces.ed.gov |
| onet | O*NET occupations | 1,016 | onetcenter.org |
| openalex-works | OpenAlex works at the nine campuses, 2024 | 500 | api.openalex.org |
| bluebikes | Bluebikes station-to-station counts, Nov 2024 | 63,063 | s3.amazonaws.com/hubway-data |
| cambridge-crashes | Cambridge police crash records | 17,230 | data.cambridgema.gov |
| cambridge-bikes | Cambridge citywide bicycle counts | 92,268 | data.cambridgema.gov |
| eco-totem | Cambridge Broadway bicycle counter | 17,123 | data.cambridgema.gov |
| fresh-pond | Cambridge Fresh Pond usership | 8,784 | data.cambridgema.gov |
| somerville-counts | Somerville bicycle and pedestrian counts | 2,532 | data.somervillema.gov |

Full column lists and the exact direct-request URL for each dataset are in that
dataset's `README.md`.

## Most relevant datasets (wire into the chosen `civic-service` spec)

- **permits** — Boston approved building permits (worktype, valuation, dates,
  status, zip, ward). The closest structured analogue to a permit workflow.
- **boston-311** — service requests by topic, department, status, neighborhood.
- **neighborhoods** — per-neighborhood population/education/income context.
- **violations** — building/property code violations by ward/zip.

These align with our steering rule to prefer a committed static snapshot over a
live API for the demo.

## Refreshing a dataset

From inside a dataset folder:

```bash
python fetch.py   # or: node fetch.js
```

Both call the direct URL printed in that folder's README and overwrite `data.csv`.
