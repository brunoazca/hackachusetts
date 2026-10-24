# MassGIS environmental justice block groups

Block groups flagged for income, race, or language.

Use: Equity context for services, neighborhoods, and alerts.

- [Source](<https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/EJ2020/MapServer/0/query?where=EJ%3D%27Yes%27&outFields=MUNICIPALITY,TOTAL_POP,PCT_MINORITY,LIMENGHHPCT,BG_MHHI,EJ,EJ_CRIT_DESC&returnGeometry=false&resultRecordCount=100&f=json>)
- Kind: dataset
- Portal challenge tags: V1, V2
- Source request: HTTP 200; fetched; 2026-10-24T15:05:44.323898+00:00
- Retention: complete_response_not_necessarily_complete_dataset

## Local starter snapshot

2,604 rows; 7 columns; 136,357 bytes. Complete organizer file, not a claim of a complete upstream database.

- [Full starter CSV](<../../datasets/ej/data.csv>)
- [100-row preview](<../previews/ej.json>)
- [Organizer README and query](<../../datasets/ej/README.md>)
- Kit membership: V1, V2
- SHA-256: `3616a34c7336da3bd7b4e7960e0dd8f9722f42305108bb7493ae113770daa557`

### Columns

| Column | Blank cells in snapshot |
|---|---:|
| `municipality` | 0 |
| `population` | 0 |
| `minority_pct` | 0 |
| `limited_english_hh_pct` | 0 |
| `block_group_income` | 19 |
| `ej` | 0 |
| `criteria` | 0 |

## Source response

[Read captured source response](<../responses/civic-ej.json>)
Returned rows: 100. API limits and filters are recorded in the exact source URL.

## Inspected subsets and related requests

| Resource | Result | Local evidence |
|---|---|---|
| [MassGIS environmental justice block groups layer schema](<https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/EJ2020/MapServer/0?f=pjson>) | fetched | [File](<../responses/civic-ej-layer.json>) |
| [MassGIS environmental justice block groups total matching rows](<https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/EJ2020/MapServer/0/query?where=EJ%3D%27Yes%27&returnCountOnly=true&f=json>) | fetched | [File](<../responses/civic-ej-count.json>) |

## Limits

A successful GET verifies a response, not a working application integration. First-page previews are not representative samples. Counts, units, dates, license terms and missing values need to be interpreted for the chosen product.

All discovered page links, including navigation, are preserved in `requests` inside [manifest.json](../manifest.json). They are not all recursively downloaded.
