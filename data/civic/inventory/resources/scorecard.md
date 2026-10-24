# College Scorecard, Massachusetts

Cost, debt, earnings, and completion. Suppressed cells stay suppressed.

Use: Comparing what a college costs and what students earn later.

- [Source](<https://ed-public-download.scorecard.network/downloads/Most-Recent-Cohorts-Institution_10152026.zip>)
- Kind: dataset
- Portal challenge tags: V1, V5
- Source request: HTTP 200; large_remote_file; 2026-10-24T15:05:44.481025+00:00
- Retention: preview_or_metadata

## Local starter snapshot

140 rows; 15 columns; 15,636 bytes. Complete organizer file, not a claim of a complete upstream database.

- [Full starter CSV](<../../datasets/scorecard/data.csv>)
- [100-row preview](<../previews/scorecard.json>)
- [Organizer README and query](<../../datasets/scorecard/README.md>)
- Kit membership: V1, V5
- SHA-256: `da6891a582bf007736e145a35f6ff66735c25dab2e37d4b9f48757f49a8f34f3`

### Columns

| Column | Blank cells in snapshot |
|---|---:|
| `unitid` | 0 |
| `name` | 0 |
| `city` | 0 |
| `control` | 0 |
| `highest_degree` | 0 |
| `admission_rate` | 69 |
| `undergraduates` | 12 |
| `net_price_public` | 103 |
| `net_price_private` | 63 |
| `cost` | 55 |
| `in_state_tuition` | 47 |
| `median_debt` | 10 |
| `earnings_10yr` | 3 |
| `completion_4yr` | 70 |
| `completion_under_4yr` | 93 |

## Source response

curl: (56) Maximum file size exceeded

## Limits

A successful GET verifies a response, not a working application integration. First-page previews are not representative samples. Counts, units, dates, license terms and missing values need to be interpreted for the chosen product.

All discovered page links, including navigation, are preserved in `requests` inside [manifest.json](../manifest.json). They are not all recursively downloaded.
