# Boston approved building permits

Issued since 2024. No street address.

Use: Permitting volume, type, and ward.

- [Source](<https://data.boston.gov/api/3/action/datastore_search_sql?sql=SELECT%20permitnumber%2Cworktype%2Cpermittypedescr%2Cdescription%2Cdeclared_valuation%2Ctotal_fees%2Cissued_date%2Cexpiration_date%2Cstatus%2Coccupancytype%2Csq_feet%2Czip%2Cward%20FROM%20%226ddcd912-32a0-43df-9908-63574f8c7e77%22%20WHERE%20issued_date%20%3E%3D%20%272024-01-01%27%20ORDER%20BY%20issued_date%20DESC%20LIMIT%20100>)
- Kind: dataset
- Portal challenge tags: V1
- Source request: HTTP 200; fetched; 2026-10-24T15:05:44.559160+00:00
- Retention: complete_response_not_necessarily_complete_dataset

## Local starter snapshot

8,240 rows; 13 columns; 956,926 bytes. Complete organizer file, not a claim of a complete upstream database.

- [Full starter CSV](<../../datasets/permits/data.csv>)
- [100-row preview](<../previews/permits.json>)
- [Organizer README and query](<../../datasets/permits/README.md>)
- Kit membership: V1
- SHA-256: `4a7edbe786b4e9defdd1d0aef6c2560cb9a9be71868e531465556a43e4214414`

### Columns

| Column | Blank cells in snapshot |
|---|---:|
| `permitnumber` | 0 |
| `worktype` | 3 |
| `permittypedescr` | 0 |
| `description` | 3 |
| `declared_valuation` | 0 |
| `total_fees` | 0 |
| `issued_date` | 0 |
| `expiration_date` | 364 |
| `status` | 0 |
| `occupancytype` | 0 |
| `sq_feet` | 0 |
| `zip` | 0 |
| `ward` | 1 |

## Source response

[Read captured source response](<../responses/permits.json>)
Returned rows: 100. API limits and filters are recorded in the exact source URL.

## Inspected subsets and related requests

| Resource | Result | Local evidence |
|---|---|---|
| [Boston approved building permits resource metadata](<https://data.boston.gov/api/3/action/resource_show?id=6ddcd912-32a0-43df-9908-63574f8c7e77>) | fetched | [File](<../responses/permits-resource-metadata.json>) |
| [permits complete resource family](<https://data.boston.gov/api/3/action/package_show?id=cd1ec3ff-6ebf-4a65-af68-8329eceab740>) | fetched | [File](<../responses/nested-219cf76fccbc.json>) |
| [Approved Building Permits](<https://data.boston.gov/dataset/cd1ec3ff-6ebf-4a65-af68-8329eceab740/resource/6ddcd912-32a0-43df-9908-63574f8c7e77/download/tmphialxc7g.csv>) | large_remote_file | Preview / status in manifest |
| [Approved Building Permits first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=6ddcd912-32a0-43df-9908-63574f8c7e77&limit=100>) | fetched | [File](<../responses/ckan-preview-6ddcd912-32a0-43df-9908-63574f8c7e77.json>) |
| [isd_approved_building_permits_data_dictionary.pdf](<https://data.boston.gov/dataset/cd1ec3ff-6ebf-4a65-af68-8329eceab740/resource/65032067-580e-4167-9a5c-94fa8ac2d9a7/download/isd_approved_building_permits_data_dictionary.pdf>) | fetched | [File](<../downloads/ckan-65032067-580e-4167-9a5c-94fa8ac2d9a7.pdf>) |

## Limits

A successful GET verifies a response, not a working application integration. First-page previews are not representative samples. Counts, units, dates, license terms and missing values need to be interpreted for the chosen product.

All discovered page links, including navigation, are preserved in `requests` inside [manifest.json](../manifest.json). They are not all recursively downloaded.
