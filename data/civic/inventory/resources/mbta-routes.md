# MBTA subway routes

Subway and light rail.

Use: Transit navigation and routing context.

- [Source](<https://api-v3.mbta.com/routes?filter%5Btype%5D=0,1>)
- Kind: api
- Portal challenge tags: V3
- Source request: HTTP 200; fetched; 2026-10-24T15:05:44.305079+00:00
- Retention: complete_response_not_necessarily_complete_dataset

## Local starter snapshot

8 rows; 4 columns; 378 bytes. Complete organizer file, not a claim of a complete upstream database.

- [Full starter CSV](<../../datasets/mbta-routes/data.csv>)
- [100-row preview](<../previews/mbta-routes.json>)
- [Organizer README and query](<../../datasets/mbta-routes/README.md>)
- Kit membership: V3
- SHA-256: `e7e460891025cf5e584c1921e367333a19a9d6ea74372f14c9b5d4025dc98d5b`

### Columns

| Column | Blank cells in snapshot |
|---|---:|
| `id` | 0 |
| `name` | 0 |
| `mode` | 0 |
| `fare_class` | 0 |

## Source response

[Read captured source response](<../responses/mbta-routes.json>)
Returned rows: 8. API limits and filters are recorded in the exact source URL.

## Limits

A successful GET verifies a response, not a working application integration. First-page previews are not representative samples. Counts, units, dates, license terms and missing values need to be interpreted for the chosen product.

All discovered page links, including navigation, are preserved in `requests` inside [manifest.json](../manifest.json). They are not all recursively downloaded.
