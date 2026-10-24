# Cambridge Broadway bicycle counter

Automated Broadway counts from 2024 on.

Use: Season and time of day on one real bike street.

- [Source](<https://data.cambridgema.gov/resource/q8v9-mcfg.json?$select=datetime,day,total,entries,exits&$where=datetime%20%3E=%20%272024-01-01T00:00:00%27&$order=datetime%20DESC&$limit=100>)
- Kind: dataset
- Portal challenge tags: V3
- Source request: HTTP 200; fetched; 2026-10-24T15:05:45.322201+00:00
- Retention: complete_response_not_necessarily_complete_dataset

## Local starter snapshot

17,123 rows; 5 columns; 664,532 bytes. Complete organizer file, not a claim of a complete upstream database.

- [Full starter CSV](<../../datasets/eco-totem/data.csv>)
- [100-row preview](<../previews/eco-totem.json>)
- [Organizer README and query](<../../datasets/eco-totem/README.md>)
- Kit membership: V3
- SHA-256: `82d1441742a58b84afbb7c89753c1a5de790a17c0d86ab0af5f31cd221f2dda9`

### Columns

| Column | Blank cells in snapshot |
|---|---:|
| `when` | 0 |
| `day` | 0 |
| `total` | 0 |
| `entries` | 0 |
| `exits` | 0 |

## Source response

[Read captured source response](<../responses/eco-totem.json>)
Returned rows: 100. API limits and filters are recorded in the exact source URL.

## Inspected subsets and related requests

| Resource | Result | Local evidence |
|---|---|---|
| [Cambridge Broadway bicycle counter schema](<https://data.cambridgema.gov/api/views/q8v9-mcfg.json>) | fetched | [File](<../responses/eco-totem-view-metadata.json>) |
| [Cambridge Broadway bicycle counter total source rows](<https://data.cambridgema.gov/resource/q8v9-mcfg.json?$select=count(*)>) | fetched | [File](<../responses/eco-totem-count.json>) |

## Limits

A successful GET verifies a response, not a working application integration. First-page previews are not representative samples. Counts, units, dates, license terms and missing values need to be interpreted for the chosen product.

All discovered page links, including navigation, are preserved in `requests` inside [manifest.json](../manifest.json). They are not all recursively downloaded.
