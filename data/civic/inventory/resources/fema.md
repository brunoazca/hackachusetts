# OpenFEMA disaster declarations

Massachusetts declarations.

Use: Emergency readiness and disaster history.

- [Source](<https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$filter=state%20eq%20%27MA%27&$top=100&$select=disasterNumber,declarationTitle,declarationDate,incidentType,designatedArea,declarationType&$orderby=declarationDate%20desc>)
- Kind: api
- Portal challenge tags: V2
- Source request: HTTP 200; fetched; 2026-10-24T15:05:44.586912+00:00
- Retention: complete_response_not_necessarily_complete_dataset

## Local starter snapshot

415 rows; 6 columns; 41,038 bytes. Complete organizer file, not a claim of a complete upstream database.

- [Full starter CSV](<../../datasets/fema/data.csv>)
- [100-row preview](<../previews/fema.json>)
- [Organizer README and query](<../../datasets/fema/README.md>)
- Kit membership: V2
- SHA-256: `3314b4071a1f4d22c43025f947f16d4207320f1c6deb0256aa79a04c407cab8b`

### Columns

| Column | Blank cells in snapshot |
|---|---:|
| `declarationDate` | 0 |
| `disasterNumber` | 0 |
| `incidentType` | 0 |
| `declarationTitle` | 0 |
| `designatedArea` | 0 |
| `declarationType` | 0 |

## Source response

[Read captured source response](<../responses/fema.json>)
Returned rows: 100. API limits and filters are recorded in the exact source URL.

## Limits

A successful GET verifies a response, not a working application integration. First-page previews are not representative samples. Counts, units, dates, license terms and missing values need to be interpreted for the chosen product.

All discovered page links, including navigation, are preserved in `requests` inside [manifest.json](../manifest.json). They are not all recursively downloaded.
