# Cambridge police crash records

Street and crash type. No house number, plate, age, or sex.

Use: Intersections where people walking or biking get hit.

- [Source](<https://data.cambridgema.gov/resource/gb5w-yva3.json?$select=date_time,day_of_week,street_name,cross_street,near_street,location,may_involve_cyclist,may_involve_pedestrian,manner_of_collision,first_harmful_event,ambient_light,weather_condition_1,road_surface_condition,speed_limit,street_or_intersection&$order=date_time%20DESC&$limit=100>)
- Kind: dataset
- Portal challenge tags: V3
- Source request: HTTP 200; fetched; 2026-10-24T15:05:46.060330+00:00
- Retention: complete_response_not_necessarily_complete_dataset

## Local starter snapshot

17,230 rows; 16 columns; 2,693,846 bytes. Complete organizer file, not a claim of a complete upstream database.

- [Full starter CSV](<../../datasets/cambridge-crashes/data.csv>)
- [100-row preview](<../previews/cambridge-crashes.json>)
- [Organizer README and query](<../../datasets/cambridge-crashes/README.md>)
- Kit membership: V3
- SHA-256: `950aaac2c061bb36f708dd4a4324fbfe4d2847aa2bcd5ba2c73afb9c1ebca23f`

### Columns

| Column | Blank cells in snapshot |
|---|---:|
| `when` | 0 |
| `day` | 0 |
| `street` | 44 |
| `cross_street` | 10,853 |
| `near_street` | 12,719 |
| `cyclist` | 15,291 |
| `pedestrian` | 16,061 |
| `manner` | 212 |
| `first_event` | 951 |
| `light` | 74 |
| `weather` | 115 |
| `road` | 259 |
| `speed_limit` | 2,676 |
| `at` | 20 |
| `latitude` | 8,352 |
| `longitude` | 8,352 |

## Source response

[Read captured source response](<../responses/cambridge-crashes.json>)
Returned rows: 100. API limits and filters are recorded in the exact source URL.

## Inspected subsets and related requests

| Resource | Result | Local evidence |
|---|---|---|
| [Cambridge police crash records schema](<https://data.cambridgema.gov/api/views/gb5w-yva3.json>) | fetched | [File](<../responses/cambridge-crashes-view-metadata.json>) |
| [Cambridge police crash records total source rows](<https://data.cambridgema.gov/resource/gb5w-yva3.json?$select=count(*)>) | fetched | [File](<../responses/cambridge-crashes-count.json>) |

## Limits

A successful GET verifies a response, not a working application integration. First-page previews are not representative samples. Counts, units, dates, license terms and missing values need to be interpreted for the chosen product.

All discovered page links, including navigation, are preserved in `requests` inside [manifest.json](../manifest.json). They are not all recursively downloaded.
