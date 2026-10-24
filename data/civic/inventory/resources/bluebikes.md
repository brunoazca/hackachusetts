# Bluebikes trips, November 2024

Station-to-station counts for one month. The URL is every trip.

Use: Where shared bikes actually move around campus.

- [Source](<https://s3.amazonaws.com/hubway-data/202411-bluebikes-tripdata.zip>)
- Kind: dataset
- Portal challenge tags: V3
- Source request: HTTP 200; large_remote_file; 2026-10-24T15:05:44.798409+00:00
- Retention: preview_or_metadata

## Local starter snapshot

63,063 rows; 5 columns; 4,187,621 bytes. Complete organizer file, not a claim of a complete upstream database.

- [Full starter CSV](<../../datasets/bluebikes/data.csv>)
- [100-row preview](<../previews/bluebikes.json>)
- [Organizer README and query](<../../datasets/bluebikes/README.md>)
- Kit membership: V3
- SHA-256: `064f6aec47d0871a19061888a8ab78f90c26a53f9289665c88528943a3cda122`

### Columns

| Column | Blank cells in snapshot |
|---|---:|
| `start_station` | 0 |
| `end_station` | 0 |
| `trips` | 0 |
| `member_trips` | 0 |
| `casual_trips` | 0 |

## Source response

curl: (63) Maximum file size exceeded

## Limits

A successful GET verifies a response, not a working application integration. First-page previews are not representative samples. Counts, units, dates, license terms and missing values need to be interpreted for the chosen product.

All discovered page links, including navigation, are preserved in `requests` inside [manifest.json](../manifest.json). They are not all recursively downloaded.
