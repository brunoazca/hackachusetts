# Boston Numina street sensors

Pedestrian and other street counts from the published sensors.

Use: Who is using a shared street, hour by hour.

- [Source](<https://data.boston.gov/api/3/action/datastore_search?resource_id=d6c06150-418d-4705-b0c9-e92afd23ede7&fields=zone_id,metric,objClass,result,time&limit=100>)
- Kind: dataset
- Portal challenge tags: V3
- Source request: HTTP 200; fetched; 2026-10-24T15:05:45.763079+00:00
- Retention: complete_response_not_necessarily_complete_dataset

## Local starter snapshot

245,555 rows; 5 columns; 11,559,290 bytes. Complete organizer file, not a claim of a complete upstream database.

- [Full starter CSV](<../../datasets/numina/data.csv>)
- [100-row preview](<../previews/numina.json>)
- [Organizer README and query](<../../datasets/numina/README.md>)
- Kit membership: V3
- SHA-256: `42446ef8bed171dee50b5db94dcbbb72b28b7a3cfe4ac4dd8231f5cf022c38e8`

### Columns

| Column | Blank cells in snapshot |
|---|---:|
| `zone` | 0 |
| `metric` | 0 |
| `object` | 0 |
| `count` | 0 |
| `time` | 0 |

## Source response

[Read captured source response](<../responses/numina.json>)
Returned rows: 100. API limits and filters are recorded in the exact source URL.
API-reported total: 35,400 (at fetch time).

## Inspected subsets and related requests

| Resource | Result | Local evidence |
|---|---|---|
| [Boston Numina street sensors resource metadata](<https://data.boston.gov/api/3/action/resource_show?id=d6c06150-418d-4705-b0c9-e92afd23ede7>) | fetched | [File](<../responses/numina-resource-metadata.json>) |
| [numina complete resource family](<https://data.boston.gov/api/3/action/package_show?id=3b2ce71d-d7ca-4027-b971-7180c263d730>) | fetched | [File](<../responses/nested-0a5d46d64b8c.json>) |
| [projectoverview_numinasensormeasurementofmultimodalactivityandsharedstreets.pdf](<https://data.boston.gov/dataset/3b2ce71d-d7ca-4027-b971-7180c263d730/resource/05d1634c-8642-419e-baf3-988d1513597f/download/projectoverview_numinasensormeasurementofmultimodalactivityandsharedstreets.pdf>) | fetched | [File](<../downloads/ckan-05d1634c-8642-419e-baf3-988d1513597f.pdf>) |
| [jackson-square-eastbound-lanes.csv](<https://data.boston.gov/dataset/3b2ce71d-d7ca-4027-b971-7180c263d730/resource/546c819e-97fd-4d27-9757-5bba41f9fcb1/download/jackson-square-eastbound-lanes.csv>) | fetched | [File](<../downloads/ckan-546c819e-97fd-4d27-9757-5bba41f9fcb1.csv>) |
| [jackson-square-eastbound-lanes.csv first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=546c819e-97fd-4d27-9757-5bba41f9fcb1&limit=100>) | fetched | [File](<../responses/ckan-preview-546c819e-97fd-4d27-9757-5bba41f9fcb1.json>) |
| [jackson-square-eastside-crosswalk.csv](<https://data.boston.gov/dataset/3b2ce71d-d7ca-4027-b971-7180c263d730/resource/c8e8bce9-382c-4798-bade-9233df8dde60/download/jackson-square-eastside-crosswalk.csv>) | fetched | [File](<../downloads/ckan-c8e8bce9-382c-4798-bade-9233df8dde60.csv>) |
| [jackson-square-eastside-crosswalk.csv first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=c8e8bce9-382c-4798-bade-9233df8dde60&limit=100>) | fetched | [File](<../responses/ckan-preview-c8e8bce9-382c-4798-bade-9233df8dde60.json>) |
| [jackson-square-northside-sidewalk.csv](<https://data.boston.gov/dataset/3b2ce71d-d7ca-4027-b971-7180c263d730/resource/784da106-da55-45a6-a0dd-554f81d1f602/download/jackson-square-northside-sidewalk.csv>) | fetched | [File](<../downloads/ckan-784da106-da55-45a6-a0dd-554f81d1f602.csv>) |
| [jackson-square-northside-sidewalk.csv first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=784da106-da55-45a6-a0dd-554f81d1f602&limit=100>) | fetched | [File](<../responses/ckan-preview-784da106-da55-45a6-a0dd-554f81d1f602.json>) |
| [jackson-square-westbound-lanes.csv](<https://data.boston.gov/dataset/3b2ce71d-d7ca-4027-b971-7180c263d730/resource/b0b51080-55ef-46bd-84a2-f64e1ae9701e/download/jackson-square-westbound-lanes.csv>) | fetched | [File](<../downloads/ckan-b0b51080-55ef-46bd-84a2-f64e1ae9701e.csv>) |
| [jackson-square-westbound-lanes.csv first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=b0b51080-55ef-46bd-84a2-f64e1ae9701e&limit=100>) | fetched | [File](<../responses/ckan-preview-b0b51080-55ef-46bd-84a2-f64e1ae9701e.json>) |
| [sensor-1-data-detail-jackson-square.pdf](<https://data.boston.gov/dataset/3b2ce71d-d7ca-4027-b971-7180c263d730/resource/77de3ef0-cad2-44c3-b3fc-c9130c8829e4/download/sensor-1-data-detail-jackson-square.pdf>) | fetched | [File](<../downloads/ckan-77de3ef0-cad2-44c3-b3fc-c9130c8829e4.pdf>) |
| [northern-ave-northside-sidewalk.csv](<https://data.boston.gov/dataset/3b2ce71d-d7ca-4027-b971-7180c263d730/resource/d47f85e5-07f9-4c77-8471-5283d61c4645/download/northern-ave-northside-sidewalk.csv>) | fetched | [File](<../downloads/ckan-d47f85e5-07f9-4c77-8471-5283d61c4645.csv>) |
| [northern-ave-northside-sidewalk.csv first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=d47f85e5-07f9-4c77-8471-5283d61c4645&limit=100>) | fetched | [File](<../responses/ckan-preview-d47f85e5-07f9-4c77-8471-5283d61c4645.json>) |
| [northern-ave-roadway.csv](<https://data.boston.gov/dataset/3b2ce71d-d7ca-4027-b971-7180c263d730/resource/d6c06150-418d-4705-b0c9-e92afd23ede7/download/northern-ave-roadway.csv>) | fetched | [File](<../downloads/ckan-d6c06150-418d-4705-b0c9-e92afd23ede7.csv>) |
| [northern-ave-roadway.csv first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=d6c06150-418d-4705-b0c9-e92afd23ede7&limit=100>) | fetched | [File](<../responses/ckan-preview-d6c06150-418d-4705-b0c9-e92afd23ede7.json>) |
| [sensor-2-data-detail-northern-ave.pdf](<https://data.boston.gov/dataset/3b2ce71d-d7ca-4027-b971-7180c263d730/resource/ef05b61e-8e83-4e04-a20e-9f941ea66e3f/download/sensor-2-data-detail-northern-ave.pdf>) | fetched | [File](<../downloads/ckan-ef05b61e-8e83-4e04-a20e-9f941ea66e3f.pdf>) |
| [tremont-diagonal-crossing.csv](<https://data.boston.gov/dataset/3b2ce71d-d7ca-4027-b971-7180c263d730/resource/371fe13a-258a-44fd-8455-6766be95cdbc/download/tremont-diagonal-crossing.csv>) | fetched | [File](<../downloads/ckan-371fe13a-258a-44fd-8455-6766be95cdbc.csv>) |
| [tremont-diagonal-crossing.csv first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=371fe13a-258a-44fd-8455-6766be95cdbc&limit=100>) | fetched | [File](<../responses/ckan-preview-371fe13a-258a-44fd-8455-6766be95cdbc.json>) |
| [tremont-northside-crosswalk.csv](<https://data.boston.gov/dataset/3b2ce71d-d7ca-4027-b971-7180c263d730/resource/77914b24-91bd-437f-9efa-8c8463c21a0b/download/tremont-northside-crosswalk.csv>) | fetched | [File](<../downloads/ckan-77914b24-91bd-437f-9efa-8c8463c21a0b.csv>) |
| [tremont-northside-crosswalk.csv first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=77914b24-91bd-437f-9efa-8c8463c21a0b&limit=100>) | fetched | [File](<../responses/ckan-preview-77914b24-91bd-437f-9efa-8c8463c21a0b.json>) |
| [tremont-northwest-side-bicycles.csv](<https://data.boston.gov/dataset/3b2ce71d-d7ca-4027-b971-7180c263d730/resource/f58dac33-8255-4274-862d-71f5a22b6f14/download/tremont-northwest-side-bicycles.csv>) | fetched | [File](<../downloads/ckan-f58dac33-8255-4274-862d-71f5a22b6f14.csv>) |
| [tremont-northwest-side-bicycles.csv first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=f58dac33-8255-4274-862d-71f5a22b6f14&limit=100>) | fetched | [File](<../responses/ckan-preview-f58dac33-8255-4274-862d-71f5a22b6f14.json>) |
| [sensor-3-data-detail-tremont.pdf](<https://data.boston.gov/dataset/3b2ce71d-d7ca-4027-b971-7180c263d730/resource/ff1f17e3-cb21-48f1-be7a-52996a020b42/download/sensor-3-data-detail-tremont.pdf>) | fetched | [File](<../downloads/ckan-ff1f17e3-cb21-48f1-be7a-52996a020b42.pdf>) |
| [numina-data-dictionary-.pdf](<https://data.boston.gov/dataset/3b2ce71d-d7ca-4027-b971-7180c263d730/resource/383263c2-068b-4685-b59d-4302c3169f2c/download/numina-data-dictionary-.pdf>) | fetched | [File](<../downloads/ckan-383263c2-068b-4685-b59d-4302c3169f2c.pdf>) |

## Limits

A successful GET verifies a response, not a working application integration. First-page previews are not representative samples. Counts, units, dates, license terms and missing values need to be interpreted for the chosen product.

All discovered page links, including navigation, are preserved in `requests` inside [manifest.json](../manifest.json). They are not all recursively downloaded.
