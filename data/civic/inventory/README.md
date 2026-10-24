# Civic data and source inventory

Captured October 24, 2026 from the [Civic portal](https://hackachusetts2026.vercel.app/#/civic). This inventory identifies exactly what is saved locally, what is a preview, and what could not be retrieved.

**74 portal resources · 22 full starter datasets · 512,156 starter rows · 5 challenge kits.**

- [Searchable offline inventory](index.html)
- [All E2C datasets and dashboards](E2C.md)
- [Boston database families and every listed subset](BOSTON_FAMILIES.md)
- [Reports, supplementary links, and spreadsheet tabs](SUPPLEMENTARY.md)
- [Machine-readable manifest](manifest.json)
- [Downloaded file contents, pages, tabs and schemas](file_inventory.json)

## What “full” means

All 22 organizer CSVs were already in the repository and remain intact, including larger files. Every individual dataset kit was fetched and its CSV hash checked against the track kit and local CSV. Every challenge ZIP was checked for exact membership and matching CSV contents. A full starter snapshot is still only the organizer’s slice of the original database.

Additional E2C data: **53 complete tables**, **43 table previews**, and **37 dashboard/reference entries**. The directory has 133 unique IDs. One story’s schema request returned 403; its public landing page is recorded separately. Full CSV counts were matched against source count queries. All 43 Boston-family resources have download attempts and/or source previews. The daily Boston bicycle layer is complete at 2,934 unique records.

New small files are retained up to 5 MiB each. Tabular E2C resources with at most 50,000 rows are attempted in full; large tables receive first-page samples. Previews are not random or representative. Native dashboards and licensed rankings retain source descriptions and access evidence instead of invented bulk extracts. See the manifest for exact retrieval times and filters.

## Challenge subsets

| Challenge | Complete kit | Datasets in ZIP |
|---|---|---|
| V1 — Simplified public services | [ZIP](<downloads/challenge-v1.zip>) | neighborhoods, ej, permits, violations, scorecard, onet |
| V2 — Responsive and resilient communities | [ZIP](<downloads/challenge-v2.zip>) | boston-311, ej, fema, ipeds, openalex-works |
| V3 — Safer and connected places | [ZIP](<downloads/challenge-v3.zip>) | mbta-alerts, mbta-routes, mbta-stations, colleges, bluebikes, vision-zero, cambridge-crashes, cambridge-bikes, eco-totem, fresh-pond, somerville-counts, numina |
| V4 — Better college experiences | [ZIP](<downloads/challenge-v4.zip>) | ipeds, openalex-works |
| V5 — Pathways to education and opportunity | [ZIP](<downloads/challenge-v5.zip>) | scorecard, ipeds, onet |

The website’s per-card challenge tags and the ZIP membership are recorded separately; they are not assumed to be identical.

## Every Civic resource

| Resource | Kind | Challenge tags | Saved data / access |
|---|---|---|
| [Boston 311 service requests](resources/boston-311.md) | dataset | V2 | Full starter: 5,000 rows |
| [MBTA service alerts](resources/mbta-alerts.md) | api | V3 | Full starter: 130 rows |
| [MBTA subway routes](resources/mbta-routes.md) | api | V3 | Full starter: 8 rows |
| [MBTA rapid transit stations](resources/mbta-stations.md) | dataset | V3 | Full starter: 170 rows |
| [MassGIS environmental justice block groups](resources/civic-ej.md) | dataset | V1, V2 | Full starter: 2,604 rows |
| [OpenFEMA disaster declarations](resources/fema.md) | api | V2 | Full starter: 415 rows |
| [Boston approved building permits](resources/permits.md) | dataset | V1 | Full starter: 8,240 rows |
| [Boston neighborhood estimates, 2025](resources/neighborhoods.md) | dataset | V1 | Full starter: 24 rows |
| [Boston building and property violations](resources/violations.md) | dataset | V1 | Full starter: 2,018 rows |
| [College Scorecard, Massachusetts](resources/scorecard.md) | dataset | V1, V5 | Full starter: 140 rows |
| [O*NET occupations](resources/onet.md) | dataset | V1, V5 | Full starter: 1,016 rows |
| [IPEDS institutional directory, Massachusetts](resources/ipeds.md) | dataset | V2, V4, V5 | Full starter: 144 rows |
| [OpenAlex works at the nine campuses, 2024](resources/openalex-works.md) | api | V2, V4 | Full starter: 500 rows |
| [MassGIS colleges and universities](resources/colleges.md) | dataset | V3 | Full starter: 206 rows |
| [Bluebikes trips, November 2024](resources/bluebikes.md) | dataset | V3 | Full starter: 63,063 rows |
| [Boston Vision Zero crash records](resources/vision-zero.md) | dataset | V3 | Full starter: 44,986 rows |
| [Cambridge police crash records](resources/cambridge-crashes.md) | dataset | V3 | Full starter: 17,230 rows |
| [Cambridge citywide bicycle counts](resources/cambridge-bikes.md) | dataset | V3 | Full starter: 92,268 rows |
| [Cambridge Broadway bicycle counter](resources/eco-totem.md) | dataset | V3 | Full starter: 17,123 rows |
| [Cambridge Fresh Pond usership](resources/fresh-pond.md) | dataset | V3 | Full starter: 8,784 rows |
| [Somerville bicycle and pedestrian counts](resources/somerville-counts.md) | dataset | V3 | Full starter: 2,532 rows |
| [Boston Numina street sensors](resources/numina.md) | dataset | V3 | Full starter: 245,555 rows |
| [Boston Open Context](resources/open-context.md) | tool | V1, V2 | fetched; reference preview |
| [Boston.gov](resources/boston-gov.md) | guidance | V1 | fetched; reference preview |
| [Mass.gov](resources/mass-gov.md) | guidance | V1 | unavailable; reference preview |
| [Massachusetts 211](resources/mass-211.md) | guidance | V1, V2 | fetched; reference preview |
| [Civic AI agents for Boston](resources/civic-agents.md) | guidance | V1 | fetched; reference preview |
| [BLS occupational wages, Massachusetts](resources/bls-oews.md) | guidance | V1, V5 | unavailable; reference preview |
| [Massachusetts E2C Hub](resources/e2c.md) | guidance | V1, V5 | Browser verified; 133 assets inventoried |
| [Massachusetts college and career outcomes](resources/ma-outcomes.md) | guidance | V1, V5 | unavailable; reference preview |
| [American Community Survey](resources/acs.md) | guidance | V1, V5 | fetched; reference preview |
| [College Navigator](resources/college-navigator.md) | guidance | V1, V5 | fetched; reference preview |
| [U.S. News college rankings](resources/us-news.md) | guidance | V1, V5 | unavailable; reference preview |
| [Times Higher Education rankings](resources/times-higher.md) | guidance | V1, V5 | fetched; reference preview |
| [QS subject rankings](resources/qs.md) | guidance | V1, V5 | unavailable; reference preview |
| [ShanghaiRanking ARWU](resources/arwu.md) | guidance | V1, V5 | fetched; reference preview |
| [NSSE public displays](resources/nsse.md) | guidance | V2, V4 | fetched; reference preview |
| [Massachusetts public higher education performance](resources/ma-higher-ed.md) | guidance | V2, V4 | fetched; reference preview |
| [Public college enrollment, fall 2021](resources/dhe-enrollment.md) | guidance | V1 | fetched; reference preview |
| [Access and affordability at public colleges](resources/dhe-access.md) | guidance | V1 | unavailable; reference preview |
| [Tuition and fees at Massachusetts public colleges](resources/dhe-tuition.md) | guidance | V1 | fetched; reference preview |
| [Student success at public colleges](resources/dhe-success.md) | guidance | V1 | fetched; reference preview |
| [Adult learners at public colleges](resources/dhe-adults.md) | guidance | V1 | fetched; reference preview |
| [Massachusetts school and district profiles](resources/dese-profiles.md) | guidance | V1 | fetched; reference preview |
| [Elementary and secondary statistical reports](resources/dese-reports.md) | guidance | V1 | fetched; reference preview |
| [MCAS results](resources/dese-mcas.md) | guidance | V1 | fetched; reference preview |
| [Career and vocational technical education data](resources/dese-cvte.md) | guidance | V1 | fetched; reference preview |
| [Charter school finance and enrollment](resources/dese-charter.md) | guidance | V1 | fetched; reference preview |
| [Special education tuition rates](resources/sped-tuition.md) | guidance | V1 | unavailable; reference preview |
| [Massachusetts STEM dashboard](resources/stem-dashboard.md) | guidance | V1 | unavailable; reference preview |
| [DESE research and evaluations](resources/dese-research.md) | guidance | V1 | fetched; reference preview |
| [College equity by place and income](resources/dhe-equity-place.md) | guidance | V2 | fetched; reference preview |
| [College equity by race and gender](resources/dhe-equity-race.md) | guidance | V2 | fetched; reference preview |
| [Pandemic enrollment changes by population](resources/dhe-equity-pandemic.md) | guidance | V2 | fetched; reference preview |
| [PMRS spotlight on success and completion](resources/pmrs-completion.md) | guidance | V2 | fetched; reference preview |
| [Special education disputes and rejected IEPs](resources/sped-disputes.md) | guidance | V2 | unavailable; reference preview |
| [Massachusetts youth risk behavior survey](resources/myrbs.md) | guidance | V2 | fetched; reference preview |
| [Web of Science API](resources/web-of-science.md) | guidance | V2, V4 | fetched; reference preview |
| [Google Scholar](resources/google-scholar.md) | guidance | V2, V4 | fetched; reference preview |
| [Boston bicycle count dashboard](resources/boston-bike-dashboard.md) | guidance | V3 | fetched; reference preview |
| [MassDOT traffic count dashboard](resources/massdot-counts.md) | guidance | V3 | unavailable; reference preview |
| [Boston region bike and pedestrian counts](resources/mpo-counts.md) | guidance | V3 | fetched; reference preview |
| [MassDOT crash portal](resources/massdot-crashes.md) | guidance | V3 | fetched; reference preview |
| [OpenStreetMap](resources/osm.md) | tool | V3 | fetched; reference preview |
| [How Boston counts people biking](resources/bike-counts-explainer.md) | guidance | V3 | fetched; reference preview |
| [Massachusetts crash data background](resources/crash-background.md) | guidance | V3 | Drive verified; all document links inventoried |
| [Boston Open Data](resources/boston-open-data.md) | guidance | Shared | fetched; reference preview |
| [MassGIS](resources/massgis.md) | guidance | Shared | unavailable; reference preview |
| [Cambridge Open Data](resources/cambridge-open-data.md) | guidance | Shared | fetched; reference preview |
| [MBTA V3 API](resources/mbta-v3.md) | api | Shared | fetched; reference preview |
| [Google Data Commons MCP](resources/data-commons-mcp.md) | tool | Shared | fetched; reference preview |
| [NANDA Town](resources/nanda-town.md) | tool | Shared | fetched; reference preview |
| [FEMA OpenFEMA](resources/openfema-docs.md) | guidance | Shared | unavailable; reference preview |
| [Additional Civic Action Resources](resources/civic-extra.md) | guidance | Shared | Drive verified; all document links inventoried |

## Coverage boundaries and unresolved access

This is a complete inventory of the Civic portal’s 74 cards and five challenge bundles, plus the explicitly enumerated nested sources above. It is not a copy of every dataset or service linked somewhere inside Boston.gov, Mass.gov, Census, OpenStreetMap, Google Scholar, or every institution’s website. Discovered navigation links remain in the manifest. Private data, paid rankings, login-only analytics, and non-exported dashboards remain references.

Some Mass.gov, BLS, QS and other requests returned 403 or network errors. E2C and the two Google Docs were recovered through alternate read methods. Access results are observations from this environment, not proof that a source is gone. Historical 311 resources for 2011 and 2014 returned empty datastore responses despite large raw CSVs. Their raw URLs remain available. The linked DHE access/affordability URL returned 404; the E2C directory supplies current public-postsecondary alternatives.

The legacy BLS Massachusetts URL redirected to the broader OEWS tables page in the web research tool. Treat it as a navigation reference, not an archived Massachusetts wage table. Large Scorecard and Bluebikes originals are represented by their full organizer slices and 100-row local previews.

## Reproduce

From the repository root, use Python 3 and curl. Download the current page and its referenced JavaScript bundle, then parse the literal catalog without executing it:

```sh
python3 knowledge/sources/scripts/inventory_civic_portal.py --bundle /path/to/portal.js --initial
python3 knowledge/sources/scripts/inventory_civic_portal.py --socrata data/civic/inventory/socrata_entries.json
python3 knowledge/sources/scripts/inventory_civic_portal.py --entries data/civic/inventory/ckan_entries.json --output-name ckan_requests
python3 knowledge/sources/scripts/build_civic_inventory.py
```

Other reviewed request lists end in `_entries.json`; pass the matching `--output-name` used by the builder. Requests use a temporary URL-keyed cache; delete only that task cache or call the helper with `refresh=True` for a new observation. Optional bundled `pypdf` and `openpyxl` add PDF page counts and worksheet previews. Browser and connected-Drive observations are separately dated evidence and are not silently regenerated. No downloaded code, macros, form submissions, or live database writes are executed.
