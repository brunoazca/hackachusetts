# Cambridge citywide bicycle counts

Counts since 2018 at named locations.

Use: Which streets already carry bike traffic.

- [Source](<https://data.cambridgema.gov/resource/ijm6-q7em.json?$select=countlocation,year,date,timeperiod,street,trafficdirection,cyclistlocation,movementtype,count,weather,latitude,longitude&$where=year%20%3E=%20%272018%27&$order=date%20DESC&$limit=100>)
- Kind: dataset
- Portal challenge tags: V3
- Source request: HTTP 200; fetched; 2026-10-24T15:05:45.322000+00:00
- Retention: complete_response_not_necessarily_complete_dataset

## Local starter snapshot

92,268 rows; 12 columns; 12,542,625 bytes. Complete organizer file, not a claim of a complete upstream database.

- [Full starter CSV](<../../datasets/cambridge-bikes/data.csv>)
- [100-row preview](<../previews/cambridge-bikes.json>)
- [Organizer README and query](<../../datasets/cambridge-bikes/README.md>)
- Kit membership: V3
- SHA-256: `408e3638b0fa0a3580eb2653b545eeb4cddf4dc8c815ed535d0e753fe04a0477`

### Columns

| Column | Blank cells in snapshot |
|---|---:|
| `location` | 0 |
| `year` | 0 |
| `date` | 0 |
| `period` | 0 |
| `street` | 0 |
| `direction` | 0 |
| `where` | 0 |
| `movement` | 0 |
| `count` | 3,060 |
| `weather` | 0 |
| `latitude` | 0 |
| `longitude` | 0 |

## Source response

[Read captured source response](<../responses/cambridge-bikes.json>)
Returned rows: 100. API limits and filters are recorded in the exact source URL.

## Inspected subsets and related requests

| Resource | Result | Local evidence |
|---|---|---|
| [Cambridge citywide bicycle counts schema](<https://data.cambridgema.gov/api/views/ijm6-q7em.json>) | fetched | [File](<../responses/cambridge-bikes-view-metadata.json>) |
| [Cambridge citywide bicycle counts total source rows](<https://data.cambridgema.gov/resource/ijm6-q7em.json?$select=count(*)>) | fetched | [File](<../responses/cambridge-bikes-count.json>) |

## Limits

A successful GET verifies a response, not a working application integration. First-page previews are not representative samples. Counts, units, dates, license terms and missing values need to be interpreted for the chosen product.

All discovered page links, including navigation, are preserved in `requests` inside [manifest.json](../manifest.json). They are not all recursively downloaded.
