# Boston Vision Zero crash records

Mode, street, and cross street. The city's crash point, not a home.

Use: Finding injury patterns near a campus or a bike route.

- [Source](<https://data.boston.gov/api/3/action/datastore_search?resource_id=e4bfe397-6bfc-49c5-9367-c879fac7401d&fields=dispatch_ts,mode_type,location_type,street,xstreet1,xstreet2,lat,long&sort=dispatch_ts%20desc&limit=100>)
- Kind: dataset
- Portal challenge tags: V3
- Source request: HTTP 200; fetched; 2026-10-24T15:05:44.955083+00:00
- Retention: complete_response_not_necessarily_complete_dataset

## Local starter snapshot

44,986 rows; 8 columns; 3,696,343 bytes. Complete organizer file, not a claim of a complete upstream database.

- [Full starter CSV](<../../datasets/vision-zero/data.csv>)
- [100-row preview](<../previews/vision-zero.json>)
- [Organizer README and query](<../../datasets/vision-zero/README.md>)
- Kit membership: V3
- SHA-256: `d0fd9bd9c8580496c7ac142e84e50a2549b50491cccb1fa6b4cdd971ecfa47ee`

### Columns

| Column | Blank cells in snapshot |
|---|---:|
| `when` | 0 |
| `mode` | 0 |
| `where` | 0 |
| `street` | 23,461 |
| `cross_street` | 3,428 |
| `cross_street_2` | 3,428 |
| `latitude` | 0 |
| `longitude` | 0 |

## Source response

[Read captured source response](<../responses/vision-zero.json>)
Returned rows: 100. API limits and filters are recorded in the exact source URL.
API-reported total: 44,986 (at fetch time).

## Inspected subsets and related requests

| Resource | Result | Local evidence |
|---|---|---|
| [Boston Vision Zero crash records resource metadata](<https://data.boston.gov/api/3/action/resource_show?id=e4bfe397-6bfc-49c5-9367-c879fac7401d>) | fetched | [File](<../responses/vision-zero-resource-metadata.json>) |
| [vision-zero complete resource family](<https://data.boston.gov/api/3/action/package_show?id=7b29c1b2-7ec2-4023-8292-c24f5d8f0905>) | fetched | [File](<../responses/nested-7119f3ae8a1e.json>) |
| [Vision Zero Crash Records](<https://data.boston.gov/dataset/7b29c1b2-7ec2-4023-8292-c24f5d8f0905/resource/e4bfe397-6bfc-49c5-9367-c879fac7401d/download/tmpgxjopxm7.csv>) | large_remote_file | Preview / status in manifest |
| [Vision Zero Crash Records first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=e4bfe397-6bfc-49c5-9367-c879fac7401d&limit=100>) | fetched | [File](<../responses/ckan-preview-e4bfe397-6bfc-49c5-9367-c879fac7401d.json>) |

## Limits

A successful GET verifies a response, not a working application integration. First-page previews are not representative samples. Counts, units, dates, license terms and missing values need to be interpreted for the chosen product.

All discovered page links, including navigation, are preserved in `requests` inside [manifest.json](../manifest.json). They are not all recursively downloaded.
