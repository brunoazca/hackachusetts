# Cambridge Fresh Pond usership

Hourly use of the reservation from 2024 on.

Use: How a shared outdoor place is actually used.

- [Source](<https://data.cambridgema.gov/resource/6xy8-cstb.json?$select=datetime,season,month,hour,fp_avg_hrly_use,bn,cg,lfp,lus,pro_shop&$where=year%20%3E=%20%272024%27&$order=datetime%20DESC&$limit=100>)
- Kind: dataset
- Portal challenge tags: V3
- Source request: HTTP 200; fetched; 2026-10-24T15:05:45.614912+00:00
- Retention: complete_response_not_necessarily_complete_dataset

## Local starter snapshot

8,784 rows; 10 columns; 470,653 bytes. Complete organizer file, not a claim of a complete upstream database.

- [Full starter CSV](<../../datasets/fresh-pond/data.csv>)
- [100-row preview](<../previews/fresh-pond.json>)
- [Organizer README and query](<../../datasets/fresh-pond/README.md>)
- Kit membership: V3
- SHA-256: `fca141945f15ed6bbc6841b7db5de20922c3f42816cb2ae6bbd1dc6be98a6878`

### Columns

| Column | Blank cells in snapshot |
|---|---:|
| `when` | 0 |
| `season` | 0 |
| `month` | 0 |
| `hour` | 0 |
| `average_users` | 1 |
| `blacks_nook` | 21 |
| `community_garden` | 46 |
| `little_fresh_pond` | 9 |
| `lusitania` | 19 |
| `pro_shop` | 3 |

## Source response

[Read captured source response](<../responses/fresh-pond.json>)
Returned rows: 100. API limits and filters are recorded in the exact source URL.

## Inspected subsets and related requests

| Resource | Result | Local evidence |
|---|---|---|
| [Cambridge Fresh Pond usership schema](<https://data.cambridgema.gov/api/views/6xy8-cstb.json>) | fetched | [File](<../responses/fresh-pond-view-metadata.json>) |
| [Cambridge Fresh Pond usership total source rows](<https://data.cambridgema.gov/resource/6xy8-cstb.json?$select=count(*)>) | fetched | [File](<../responses/fresh-pond-count.json>) |

## Limits

A successful GET verifies a response, not a working application integration. First-page previews are not representative samples. Counts, units, dates, license terms and missing values need to be interpreted for the chosen product.

All discovered page links, including navigation, are preserved in `requests` inside [manifest.json](../manifest.json). They are not all recursively downloaded.
