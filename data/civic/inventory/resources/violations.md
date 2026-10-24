# Boston building and property violations

Status since 2024. No street address.

Use: Where permits and inspections pile up.

- [Source](<https://data.boston.gov/api/3/action/datastore_search_sql?sql=SELECT%20case_no%2Cstatus_dttm%2Cstatus%2Ccode%2Cvalue%2Cdescription%2Cviolation_city%2Cviolation_zip%2Cward%20FROM%20%22800a2663-1d6a-46e7-9356-bedb70f5332c%22%20WHERE%20status_dttm%20%3E%3D%20%272024-01-01%27%20ORDER%20BY%20status_dttm%20DESC%20LIMIT%20100>)
- Kind: dataset
- Portal challenge tags: V1
- Source request: HTTP 200; fetched; 2026-10-24T15:05:44.498977+00:00
- Retention: complete_response_not_necessarily_complete_dataset

## Local starter snapshot

2,018 rows; 9 columns; 151,856 bytes. Complete organizer file, not a claim of a complete upstream database.

- [Full starter CSV](<../../datasets/violations/data.csv>)
- [100-row preview](<../previews/violations.json>)
- [Organizer README and query](<../../datasets/violations/README.md>)
- Kit membership: V1
- SHA-256: `631096995e8e1e0b5fe7735a0fc562d991a84e2ebcc1b9c988dc96d32d36bb5b`

### Columns

| Column | Blank cells in snapshot |
|---|---:|
| `case_no` | 0 |
| `status_date` | 0 |
| `status` | 0 |
| `code` | 0 |
| `value` | 0 |
| `description` | 7 |
| `city` | 0 |
| `zip` | 1 |
| `ward` | 0 |

## Source response

[Read captured source response](<../responses/violations.json>)
Returned rows: 100. API limits and filters are recorded in the exact source URL.

## Inspected subsets and related requests

| Resource | Result | Local evidence |
|---|---|---|
| [Boston building and property violations resource metadata](<https://data.boston.gov/api/3/action/resource_show?id=800a2663-1d6a-46e7-9356-bedb70f5332c>) | fetched | [File](<../responses/violations-resource-metadata.json>) |
| [violations complete resource family](<https://data.boston.gov/api/3/action/package_show?id=705244a6-70a6-4ff8-ab8e-56441aff18e7>) | fetched | [File](<../responses/nested-0598d3868a68.json>) |
| [Building and Property Violations](<https://data.boston.gov/dataset/705244a6-70a6-4ff8-ab8e-56441aff18e7/resource/800a2663-1d6a-46e7-9356-bedb70f5332c/download/tmpilpychd0.csv>) | fetched | [File](<../downloads/ckan-800a2663-1d6a-46e7-9356-bedb70f5332c.csv>) |
| [Building and Property Violations first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=800a2663-1d6a-46e7-9356-bedb70f5332c&limit=100>) | fetched | [File](<../responses/ckan-preview-800a2663-1d6a-46e7-9356-bedb70f5332c.json>) |

## Limits

A successful GET verifies a response, not a working application integration. First-page previews are not representative samples. Counts, units, dates, license terms and missing values need to be interpreted for the chosen product.

All discovered page links, including navigation, are preserved in `requests` inside [manifest.json](../manifest.json). They are not all recursively downloaded.
