# MassGIS colleges and universities

Campus points statewide. Street address and phone are left out.

Use: Seeing which campuses a bus, a bike, or a service can reach.

- [Source](<https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/HigherEd/MapServer/0/query?where=1%3D1&outFields=COLLEGE,CAMPUS,CITY,ZIPCODE,GEOG_TOWN,TYPE,NCES_TYPE,CATEGORY,CAMPUSHOUS&returnGeometry=true&outSR=4326&f=json>)
- Kind: dataset
- Portal challenge tags: V3
- Source request: HTTP 200; fetched; 2026-10-24T15:05:46.533918+00:00
- Retention: complete_response_not_necessarily_complete_dataset

## Local starter snapshot

206 rows; 11 columns; 28,555 bytes. Complete organizer file, not a claim of a complete upstream database.

- [Full starter CSV](<../../datasets/colleges/data.csv>)
- [100-row preview](<../previews/colleges.json>)
- [Organizer README and query](<../../datasets/colleges/README.md>)
- Kit membership: V3
- SHA-256: `81d0524825cb94070f77517617ad251c2d8d46accc2c371e921fb99590f33dbc`

### Columns

| Column | Blank cells in snapshot |
|---|---:|
| `college` | 0 |
| `campus` | 114 |
| `city` | 0 |
| `zip` | 0 |
| `town` | 0 |
| `type` | 0 |
| `level` | 0 |
| `category` | 0 |
| `housing` | 0 |
| `latitude` | 0 |
| `longitude` | 0 |

## Source response

[Read captured source response](<../responses/colleges.json>)
Returned rows: 204. API limits and filters are recorded in the exact source URL.

## Inspected subsets and related requests

| Resource | Result | Local evidence |
|---|---|---|
| [MassGIS colleges and universities layer schema](<https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/HigherEd/MapServer/0?f=pjson>) | fetched | [File](<../responses/colleges-layer.json>) |
| [MassGIS colleges and universities total matching rows](<https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/HigherEd/MapServer/0/query?where=1%3D1&returnCountOnly=true&f=json>) | fetched | [File](<../responses/colleges-count.json>) |

## Limits

A successful GET verifies a response, not a working application integration. First-page previews are not representative samples. Counts, units, dates, license terms and missing values need to be interpreted for the chosen product.

All discovered page links, including navigation, are preserved in `requests` inside [manifest.json](../manifest.json). They are not all recursively downloaded.
