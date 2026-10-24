# MBTA service alerts

Effect, severity, routes, rider text.

Use: Disruption communication and trip decisions.

- [Source](<https://api-v3.mbta.com/alerts?page%5Blimit%5D=50>)
- Kind: api
- Portal challenge tags: V3
- Source request: HTTP 200; fetched; 2026-10-24T15:05:44.366785+00:00
- Retention: complete_response_not_necessarily_complete_dataset

## Local starter snapshot

130 rows; 5 columns; 26,265 bytes. Complete organizer file, not a claim of a complete upstream database.

- [Full starter CSV](<../../datasets/mbta-alerts/data.csv>)
- [100-row preview](<../previews/mbta-alerts.json>)
- [Organizer README and query](<../../datasets/mbta-alerts/README.md>)
- Kit membership: V3
- SHA-256: `f7c5b3bd957c7781632f9755c8de98814238119df5c5994559479daeea5f88d5`

### Columns

| Column | Blank cells in snapshot |
|---|---:|
| `updated` | 0 |
| `effect` | 0 |
| `severity` | 0 |
| `routes` | 0 |
| `header` | 0 |

## Source response

[Read captured source response](<../responses/mbta-alerts.json>)
Returned rows: 50. API limits and filters are recorded in the exact source URL.

## Limits

A successful GET verifies a response, not a working application integration. First-page previews are not representative samples. Counts, units, dates, license terms and missing values need to be interpreted for the chosen product.

All discovered page links, including navigation, are preserved in `requests` inside [manifest.json](../manifest.json). They are not all recursively downloaded.
