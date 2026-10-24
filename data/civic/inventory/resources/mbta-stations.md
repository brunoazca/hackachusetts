# MBTA rapid transit stations

Station and line. No geometry.

Use: Station-level transit context on a map.

- [Source](<https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/MBTA_Rapid_Transit/MapServer/0/query?where=1%3D1&outFields=STATION,LINE,ROUTE&returnGeometry=false&f=json>)
- Kind: dataset
- Portal challenge tags: V3
- Source request: HTTP 200; fetched; 2026-10-24T15:05:44.313010+00:00
- Retention: complete_response_not_necessarily_complete_dataset

## Local starter snapshot

170 rows; 3 columns; 6,579 bytes. Complete organizer file, not a claim of a complete upstream database.

- [Full starter CSV](<../../datasets/mbta-stations/data.csv>)
- [100-row preview](<../previews/mbta-stations.json>)
- [Organizer README and query](<../../datasets/mbta-stations/README.md>)
- Kit membership: V3
- SHA-256: `aba32080532d4f2397f30040d4e03d11a0fa70ace8c5b20df64c4a8b191672d0`

### Columns

| Column | Blank cells in snapshot |
|---|---:|
| `station` | 0 |
| `line` | 0 |
| `route` | 0 |

## Source response

[Read captured source response](<../responses/mbta-stations.json>)
Returned rows: 170. API limits and filters are recorded in the exact source URL.

## Inspected subsets and related requests

| Resource | Result | Local evidence |
|---|---|---|
| [MBTA rapid transit stations layer schema](<https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/MBTA_Rapid_Transit/MapServer/0?f=pjson>) | fetched | [File](<../responses/mbta-stations-layer.json>) |
| [MBTA rapid transit stations total matching rows](<https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/MBTA_Rapid_Transit/MapServer/0/query?where=1%3D1&returnCountOnly=true&f=json>) | fetched | [File](<../responses/mbta-stations-count.json>) |

## Limits

A successful GET verifies a response, not a working application integration. First-page previews are not representative samples. Counts, units, dates, license terms and missing values need to be interpreted for the chosen product.

All discovered page links, including navigation, are preserved in `requests` inside [manifest.json](../manifest.json). They are not all recursively downloaded.
