# Boston neighborhood estimates, 2025

Population, education, poverty. City estimates.

Use: Who lives where, before a service is designed.

- [Source](<https://data.boston.gov/api/3/action/datastore_search_sql?sql=SELECT%20name%2Cyear%2Carealand_sqmi%2Cpopulation_b01001_001e%2Ceducation_b15003_hsgrad_and_ged%2Ceducation_b15003_022e%2Ceducation_b15003_gradprofdegree%2Cincome_b17001_001e%2Cincome_b17001_002e%20FROM%20%22b0543358-d03f-4682-bf0c-658ea4573d6f%22>)
- Kind: dataset
- Portal challenge tags: V1
- Source request: HTTP 200; fetched; 2026-10-24T15:05:44.492752+00:00
- Retention: complete_response_not_necessarily_complete_dataset

## Local starter snapshot

24 rows; 9 columns; 1,827 bytes. Complete organizer file, not a claim of a complete upstream database.

- [Full starter CSV](<../../datasets/neighborhoods/data.csv>)
- [100-row preview](<../previews/neighborhoods.json>)
- [Organizer README and query](<../../datasets/neighborhoods/README.md>)
- Kit membership: V1
- SHA-256: `335577ffd48a1d3a0388091a90520c4654a40653a4370f426b70094dab4fe31f`

### Columns

| Column | Blank cells in snapshot |
|---|---:|
| `neighborhood` | 0 |
| `year` | 1 |
| `land_sqmi` | 1 |
| `population` | 1 |
| `hs_or_ged` | 1 |
| `bachelors` | 1 |
| `graduate_degree` | 1 |
| `poverty_universe` | 1 |
| `poverty_count` | 1 |

## Source response

[Read captured source response](<../responses/neighborhoods.json>)
Returned rows: 24. API limits and filters are recorded in the exact source URL.

## Inspected subsets and related requests

| Resource | Result | Local evidence |
|---|---|---|
| [Boston neighborhood estimates, 2025 resource metadata](<https://data.boston.gov/api/3/action/resource_show?id=b0543358-d03f-4682-bf0c-658ea4573d6f>) | fetched | [File](<../responses/neighborhoods-resource-metadata.json>) |
| [neighborhoods complete resource family](<https://data.boston.gov/api/3/action/package_show?id=d2ece0af-e0ad-42e4-b280-bd0aa1561ed0>) | fetched | [File](<../responses/nested-4937c01a5122.json>) |
| [CSV](<https://data.boston.gov/dataset/d2ece0af-e0ad-42e4-b280-bd0aa1561ed0/resource/b0543358-d03f-4682-bf0c-658ea4573d6f/download/boston_population_estimates_2025_neighborhood_level.csv>) | fetched | [File](<../downloads/ckan-b0543358-d03f-4682-bf0c-658ea4573d6f.csv>) |
| [CSV first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=b0543358-d03f-4682-bf0c-658ea4573d6f&limit=100>) | fetched | [File](<../responses/ckan-preview-b0543358-d03f-4682-bf0c-658ea4573d6f.json>) |
| [GeoJSON](<https://data.boston.gov/dataset/d2ece0af-e0ad-42e4-b280-bd0aa1561ed0/resource/faf18a44-8ba1-4d2b-b5c1-2ec1ebe0142d/download/boston_population_estimates_2025_neighborhood_level.geojson>) | fetched | [File](<../responses/ckan-faf18a44-8ba1-4d2b-b5c1-2ec1ebe0142d.json>) |
| [ArcGIS GeoServices REST API](<https://gis.bostonplans.org/hosting/rest/services/Hosted/Data_2025_Neighborhood_AnalyzeB/FeatureServer>) | fetched | Preview / status in manifest |
| [city-of-boston-demographic-data-dictionary.xlsx](<https://data.boston.gov/dataset/d2ece0af-e0ad-42e4-b280-bd0aa1561ed0/resource/0c0ff51a-e4a2-4d5d-b165-03f3f5c88d32/download/city-of-boston-demographic-data-dictionary.xlsx>) | fetched | [File](<../downloads/ckan-0c0ff51a-e4a2-4d5d-b165-03f3f5c88d32.xlsx>) |
| [city-of-boston-demographic-data-dictionary.xlsx first 100 source rows](<https://data.boston.gov/api/3/action/datastore_search?resource_id=0c0ff51a-e4a2-4d5d-b165-03f3f5c88d32&limit=100>) | fetched | [File](<../responses/ckan-preview-0c0ff51a-e4a2-4d5d-b165-03f3f5c88d32.json>) |

## Limits

A successful GET verifies a response, not a working application integration. First-page previews are not representative samples. Counts, units, dates, license terms and missing values need to be interpreted for the chosen product.

All discovered page links, including navigation, are preserved in `requests` inside [manifest.json](../manifest.json). They are not all recursively downloaded.
