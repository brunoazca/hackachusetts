# Somerville bicycle and pedestrian counts

Bike and walk counts at named intersections.

Use: A campus-to-neighborhood walking or biking route.

- [Source](<https://data.somervillema.gov/resource/qu9x-4xq5.json?$select=year,location_name,latitude,longitude,am_pm,mode,count&$order=year%20DESC&$limit=100>)
- Kind: dataset
- Portal challenge tags: V3
- Source request: HTTP 200; fetched; 2026-10-24T15:05:45.665298+00:00
- Retention: complete_response_not_necessarily_complete_dataset

## Local starter snapshot

2,532 rows; 7 columns; 148,622 bytes. Complete organizer file, not a claim of a complete upstream database.

- [Full starter CSV](<../../datasets/somerville-counts/data.csv>)
- [100-row preview](<../previews/somerville-counts.json>)
- [Organizer README and query](<../../datasets/somerville-counts/README.md>)
- Kit membership: V3
- SHA-256: `41207079e683e01ba088a3fd491a81905b4268c845bd7a850d1d2761d43921f7`

### Columns

| Column | Blank cells in snapshot |
|---|---:|
| `year` | 0 |
| `location` | 0 |
| `latitude` | 0 |
| `longitude` | 0 |
| `period` | 0 |
| `mode` | 0 |
| `count` | 6 |

## Source response

[Read captured source response](<../responses/somerville-counts.json>)
Returned rows: 100. API limits and filters are recorded in the exact source URL.

## Inspected subsets and related requests

| Resource | Result | Local evidence |
|---|---|---|
| [Somerville bicycle and pedestrian counts schema](<https://data.somervillema.gov/api/views/qu9x-4xq5.json>) | fetched | [File](<../responses/somerville-counts-view-metadata.json>) |
| [Somerville bicycle and pedestrian counts total source rows](<https://data.somervillema.gov/resource/qu9x-4xq5.json?$select=count(*)>) | fetched | [File](<../responses/somerville-counts-count.json>) |

## Limits

A successful GET verifies a response, not a working application integration. First-page previews are not representative samples. Counts, units, dates, license terms and missing values need to be interpreted for the chosen product.

All discovered page links, including navigation, are preserved in `requests` inside [manifest.json](../manifest.json). They are not all recursively downloaded.
