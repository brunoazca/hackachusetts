# OpenAlex works at the nine campuses, 2024

Most-cited 2024 works with an author at a Hackachusetts campus.

Use: Finding research already happening where students are.

- [Source](<https://api.openalex.org/works?filter=authorships.institutions.id:I63966007%7CI136199984%7CI103531236%7CI111088046%7CI12912129%7CI24603500%7CI133738476%7CI33434090%7CI96062909,publication_year:2024&sort=cited_by_count:desc&per_page=25&select=display_name,publication_year,cited_by_count,type,primary_location>)
- Kind: api
- Portal challenge tags: V2, V4
- Source request: HTTP 200; fetched; 2026-10-24T15:05:44.806116+00:00
- Retention: complete_response_not_necessarily_complete_dataset

## Local starter snapshot

500 rows; 5 columns; 62,863 bytes. Complete organizer file, not a claim of a complete upstream database.

- [Full starter CSV](<../../datasets/openalex-works/data.csv>)
- [100-row preview](<../previews/openalex-works.json>)
- [Organizer README and query](<../../datasets/openalex-works/README.md>)
- Kit membership: V2, V4
- SHA-256: `00175039f46f6261fc09b5ba48942d4087476eeaed3253f2cc71e0a5f6825065`

### Columns

| Column | Blank cells in snapshot |
|---|---:|
| `title` | 0 |
| `year` | 0 |
| `type` | 0 |
| `cited_by` | 0 |
| `source` | 2 |

## Source response

[Read captured source response](<../responses/openalex-works.json>)
Returned rows: 25. API limits and filters are recorded in the exact source URL.

## Limits

A successful GET verifies a response, not a working application integration. First-page previews are not representative samples. Counts, units, dates, license terms and missing values need to be interpreted for the chosen product.

All discovered page links, including navigation, are preserved in `requests` inside [manifest.json](../manifest.json). They are not all recursively downloaded.
