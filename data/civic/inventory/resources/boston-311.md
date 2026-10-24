# Boston 311 service requests

Topic, department, status, neighborhood. No street address.

Use: Neighborhood service patterns and triage.

- [Source](<https://data.boston.gov/api/3/action/datastore_search?resource_id=254adca6-64ab-4c5c-9fc0-a6da622be185&fields=open_date,case_topic,service_name,assigned_department,case_status,neighborhood,zip_code,on_time,city_council_district,ward&sort=open_date%20desc&limit=100>)
- Kind: dataset
- Portal challenge tags: V2
- Source request: HTTP 200; fetched; 2026-10-24T15:05:44.364222+00:00
- Retention: complete_response_not_necessarily_complete_dataset

## Local starter snapshot

5,000 rows; 10 columns; 676,710 bytes. Complete organizer file, not a claim of a complete upstream database.

- [Full starter CSV](<../../datasets/boston-311/data.csv>)
- [100-row preview](<../previews/boston-311.json>)
- [Organizer README and query](<../../datasets/boston-311/README.md>)
- Kit membership: V2
- SHA-256: `baf1a7f0f19e168db2d8d1f3c903998a26304252dfd705356113a7fc735b20c4`

### Columns

| Column | Blank cells in snapshot |
|---|---:|
| `open_date` | 0 |
| `case_topic` | 0 |
| `service_name` | 0 |
| `assigned_department` | 3 |
| `case_status` | 0 |
| `neighborhood` | 7 |
| `zip_code` | 10 |
| `on_time` | 0 |
| `city_council_district` | 10 |
| `ward` | 10 |

## Source response

[Read captured source response](<../responses/boston-311.json>)
Returned rows: 100. API limits and filters are recorded in the exact source URL.
API-reported total: 75,498 (at fetch time).

## Inspected subsets and related requests

| Resource | Result | Local evidence |
|---|---|---|
| [Boston 311 service requests resource metadata](<https://data.boston.gov/api/3/action/resource_show?id=254adca6-64ab-4c5c-9fc0-a6da622be185>) | fetched | [File](<../responses/boston-311-resource-metadata.json>) |
| [boston-311 complete resource family](<https://data.boston.gov/api/3/action/package_show?id=8048697b-ad64-4bfc-b090-ee00169f2323>) | fetched | [File](<../responses/nested-a5b3eb8a3e81.json>) |
| [311 Service Requests - NEW SYSTEM](<https://data.boston.gov/dataset/8048697b-ad64-4bfc-b090-ee00169f2323/resource/254adca6-64ab-4c5c-9fc0-a6da622be185/download/tmp7o3lwr4m.csv>) | large_remote_file | Preview / status in manifest |
| [311 Service Requests - NEW SYSTEM first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=254adca6-64ab-4c5c-9fc0-a6da622be185&limit=100>) | fetched | [File](<../responses/ckan-preview-254adca6-64ab-4c5c-9fc0-a6da622be185.json>) |
| [311-service-requests-data-dictionary-new-system.pdf](<https://data.boston.gov/dataset/8048697b-ad64-4bfc-b090-ee00169f2323/resource/6e443a5d-8027-41d5-9574-35e8f84b8284/download/311-service-requests-data-dictionary-new-system.pdf>) | fetched | [File](<../downloads/ckan-6e443a5d-8027-41d5-9574-35e8f84b8284.pdf>) |
| [datadictionary-crmvaluecodeindex.pdf](<https://data.boston.gov/dataset/8048697b-ad64-4bfc-b090-ee00169f2323/resource/b237f352-49d1-4423-804f-b478e4f24e61/download/datadictionary-crmvaluecodeindex.pdf>) | fetched | [File](<../downloads/ckan-b237f352-49d1-4423-804f-b478e4f24e61.pdf>) |
| [pub](<https://docs.google.com/document/d/e/2PACX-1vRwAs48Ou0txiw1NPudex752jfa34MvoBwlT2WlTf_aTVLcIsXsV4Pzdm4xBrEeYMszrUZyN-IRZG2_/pub>) | fetched | Preview / status in manifest |
| [pub](<https://docs.google.com/document/d/e/2PACX-1vQ9ExKIGyrLJeyVUO92qNw0Cbj5m6Sz2IAATdBgYiAGW69Wuv7dk10PHUPR7UdawGt_e89q9VhxH-I0/pub>) | fetched | Preview / status in manifest |
| [311 Service Requests - 2026](<https://data.boston.gov/dataset/8048697b-ad64-4bfc-b090-ee00169f2323/resource/1a0b420d-99f1-4887-9851-990b2a5a6e17/download/tmpch36ak7j.csv>) | large_remote_file | Preview / status in manifest |
| [311 Service Requests - 2026 first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=1a0b420d-99f1-4887-9851-990b2a5a6e17&limit=100>) | fetched | [File](<../responses/ckan-preview-1a0b420d-99f1-4887-9851-990b2a5a6e17.json>) |
| [311 Service Requests - 2025](<https://data.boston.gov/dataset/8048697b-ad64-4bfc-b090-ee00169f2323/resource/9d7c2214-4709-478a-a2e8-fb2020a5bb94/download/lagan_311_open_data_2025_rvsd3.csv>) | large_remote_file | Preview / status in manifest |
| [311 Service Requests - 2025 first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=9d7c2214-4709-478a-a2e8-fb2020a5bb94&limit=100>) | fetched | [File](<../responses/ckan-preview-9d7c2214-4709-478a-a2e8-fb2020a5bb94.json>) |
| [311 Service Requests - 2024](<https://data.boston.gov/dataset/8048697b-ad64-4bfc-b090-ee00169f2323/resource/dff4d804-5031-443a-8409-8344efd0e5c8/download/lagan_311_open_data_2024_rvsd3.csv>) | large_remote_file | Preview / status in manifest |
| [311 Service Requests - 2024 first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=dff4d804-5031-443a-8409-8344efd0e5c8&limit=100>) | fetched | [File](<../responses/ckan-preview-dff4d804-5031-443a-8409-8344efd0e5c8.json>) |
| [311 Service Requests - 2023](<https://data.boston.gov/dataset/8048697b-ad64-4bfc-b090-ee00169f2323/resource/e6013a93-1321-4f2a-bf91-8d8a02f1e62f/download/lagan_311_open_data_2023_rvsd3.csv>) | large_remote_file | Preview / status in manifest |
| [311 Service Requests - 2023 first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=e6013a93-1321-4f2a-bf91-8d8a02f1e62f&limit=100>) | fetched | [File](<../responses/ckan-preview-e6013a93-1321-4f2a-bf91-8d8a02f1e62f.json>) |
| [311 SERVICE REQUESTS - 2022](<https://data.boston.gov/dataset/8048697b-ad64-4bfc-b090-ee00169f2323/resource/81a7b022-f8fc-4da5-80e4-b160058ca207/download/lagan_311_open_data_2022_rvsd3.csv>) | large_remote_file | Preview / status in manifest |
| [311 SERVICE REQUESTS - 2022 first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=81a7b022-f8fc-4da5-80e4-b160058ca207&limit=100>) | fetched | [File](<../responses/ckan-preview-81a7b022-f8fc-4da5-80e4-b160058ca207.json>) |
| [311 SERVICE REQUESTS - 2021](<https://data.boston.gov/dataset/8048697b-ad64-4bfc-b090-ee00169f2323/resource/f53ebccd-bc61-49f9-83db-625f209c95f5/download/lagan_311_open_data_2021_rvsd3.csv>) | large_remote_file | Preview / status in manifest |
| [311 SERVICE REQUESTS - 2021 first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=f53ebccd-bc61-49f9-83db-625f209c95f5&limit=100>) | fetched | [File](<../responses/ckan-preview-f53ebccd-bc61-49f9-83db-625f209c95f5.json>) |
| [311 SERVICE REQUESTS - 2020](<https://data.boston.gov/dataset/8048697b-ad64-4bfc-b090-ee00169f2323/resource/6ff6a6fd-3141-4440-a880-6f60a37fe789/download/lagan_311_open_data_2020_rvsd3.csv>) | large_remote_file | Preview / status in manifest |
| [311 SERVICE REQUESTS - 2020 first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=6ff6a6fd-3141-4440-a880-6f60a37fe789&limit=100>) | fetched | [File](<../responses/ckan-preview-6ff6a6fd-3141-4440-a880-6f60a37fe789.json>) |
| [311 SERVICE REQUESTS - 2019](<https://data.boston.gov/dataset/8048697b-ad64-4bfc-b090-ee00169f2323/resource/ea2e4696-4a2d-429c-9807-d02eb92e0222/download/lagan_311_open_data_2019_rvsd3.csv>) | large_remote_file | Preview / status in manifest |
| [311 SERVICE REQUESTS - 2019 first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=ea2e4696-4a2d-429c-9807-d02eb92e0222&limit=100>) | fetched | [File](<../responses/ckan-preview-ea2e4696-4a2d-429c-9807-d02eb92e0222.json>) |
| [311 SERVICE REQUESTS - 2018](<https://data.boston.gov/dataset/8048697b-ad64-4bfc-b090-ee00169f2323/resource/2be28d90-3a90-4af1-a3f6-f28c1e25880a/download/lagan_311_open_data_2018_rvsd3.csv>) | large_remote_file | Preview / status in manifest |
| [311 SERVICE REQUESTS - 2018 first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=2be28d90-3a90-4af1-a3f6-f28c1e25880a&limit=100>) | fetched | [File](<../responses/ckan-preview-2be28d90-3a90-4af1-a3f6-f28c1e25880a.json>) |
| [311 SERVICE REQUESTS - 2017](<https://data.boston.gov/dataset/8048697b-ad64-4bfc-b090-ee00169f2323/resource/30022137-709d-465e-baae-ca155b51927d/download/lagan_311_open_data_2017_rvsd3.csv>) | large_remote_file | Preview / status in manifest |
| [311 SERVICE REQUESTS - 2017 first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=30022137-709d-465e-baae-ca155b51927d&limit=100>) | fetched | [File](<../responses/ckan-preview-30022137-709d-465e-baae-ca155b51927d.json>) |
| [311 SERVICE REQUESTS - 2016](<https://data.boston.gov/dataset/8048697b-ad64-4bfc-b090-ee00169f2323/resource/b7ea6b1b-3ca4-4c5b-9713-6dc1db52379a/download/lagan_311_open_data_2016_rvsd3.csv>) | large_remote_file | Preview / status in manifest |
| [311 SERVICE REQUESTS - 2016 first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=b7ea6b1b-3ca4-4c5b-9713-6dc1db52379a&limit=100>) | fetched | [File](<../responses/ckan-preview-b7ea6b1b-3ca4-4c5b-9713-6dc1db52379a.json>) |
| [311 SERVICE REQUESTS - 2015](<https://data.boston.gov/dataset/8048697b-ad64-4bfc-b090-ee00169f2323/resource/c9509ab4-6f6d-4b97-979a-0cf2a10c922b/download/lagan_311_open_data_2015_rvsd3.csv>) | large_remote_file | Preview / status in manifest |
| [311 SERVICE REQUESTS - 2015 first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=c9509ab4-6f6d-4b97-979a-0cf2a10c922b&limit=100>) | fetched | [File](<../responses/ckan-preview-c9509ab4-6f6d-4b97-979a-0cf2a10c922b.json>) |
| [311 SERVICE REQUESTS - 2014](<https://data.boston.gov/dataset/8048697b-ad64-4bfc-b090-ee00169f2323/resource/bdae89c8-d4ce-40e9-a6e1-a5203953a2e0/download/lagan_311_open_data_2014_rvsd3.csv>) | large_remote_file | Preview / status in manifest |
| [311 SERVICE REQUESTS - 2014 first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=bdae89c8-d4ce-40e9-a6e1-a5203953a2e0&limit=100>) | fetched | [File](<../responses/ckan-preview-bdae89c8-d4ce-40e9-a6e1-a5203953a2e0.json>) |
| [311 SERVICE REQUESTS - 2013](<https://data.boston.gov/dataset/8048697b-ad64-4bfc-b090-ee00169f2323/resource/407c5cd0-f764-4a41-adf8-054ff535049e/download/lagan_311_open_data_2013_rvsd3.csv>) | large_remote_file | Preview / status in manifest |
| [311 SERVICE REQUESTS - 2013 first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=407c5cd0-f764-4a41-adf8-054ff535049e&limit=100>) | fetched | [File](<../responses/ckan-preview-407c5cd0-f764-4a41-adf8-054ff535049e.json>) |
| [311 SERVICE REQUESTS - 2012](<https://data.boston.gov/dataset/8048697b-ad64-4bfc-b090-ee00169f2323/resource/382e10d9-1864-40ba-bef6-4eea3c75463c/download/lagan_311_open_data_2012_rvsd3.csv>) | large_remote_file | Preview / status in manifest |
| [311 SERVICE REQUESTS - 2012 first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=382e10d9-1864-40ba-bef6-4eea3c75463c&limit=100>) | fetched | [File](<../responses/ckan-preview-382e10d9-1864-40ba-bef6-4eea3c75463c.json>) |
| [311 SERVICE REQUESTS - 2011](<https://data.boston.gov/dataset/8048697b-ad64-4bfc-b090-ee00169f2323/resource/94b499d9-712a-4d2a-b790-7ceec5c9c4b1/download/lagan_311_open_data_2011_rvsd3.csv>) | large_remote_file | Preview / status in manifest |
| [311 SERVICE REQUESTS - 2011 first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=94b499d9-712a-4d2a-b790-7ceec5c9c4b1&limit=100>) | fetched | [File](<../responses/ckan-preview-94b499d9-712a-4d2a-b790-7ceec5c9c4b1.json>) |
| [Historical 311 empty datastore check](<https://data.boston.gov/api/3/action/datastore_search?resource_id=bdae89c8-d4ce-40e9-a6e1-a5203953a2e0&limit=0>) | fetched | [File](<../responses/ckan-bdae89c8-d4ce-40e9-a6e1-a5203953a2e0-schema.json>) |
| [Historical 311 empty datastore check](<https://data.boston.gov/api/3/action/datastore_search?resource_id=94b499d9-712a-4d2a-b790-7ceec5c9c4b1&limit=0>) | fetched | [File](<../responses/ckan-94b499d9-712a-4d2a-b790-7ceec5c9c4b1-schema.json>) |

## Limits

A successful GET verifies a response, not a working application integration. First-page previews are not representative samples. Counts, units, dates, license terms and missing values need to be interpreted for the chosen product.

All discovered page links, including navigation, are preserved in `requests` inside [manifest.json](../manifest.json). They are not all recursively downloaded.
