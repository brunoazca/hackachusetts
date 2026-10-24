# Hackachusetts Civic Action knowledge base

Research cutoff: **October 24, 2026**. This folder is the team's sourced preparation pack. Institutional priorities and our recommendations are separated from official competition requirements. No private judging preferences, partnership, or guaranteed adoption are established.

## Read in this order

Docs are grouped: **00–03 competition & event**, **10–19 strategy, evidence & ideas**, **20–24 data & verification**.

### Competition & event

| Document | Use it for |
|---|---|
| [00 — Full official rules reference](00_official_rules_full.md) | Detailed rule text retained in the repository |
| [01 — Rules, judging and submission playbook](01_rules_judging_and_event_playbook.md) | Required deliverables, judging, conflicts to resolve, and the under-three-minute demo |
| [02 — Event logistics](02_event_info_and_logistics.md) | Setup, schedule, campus and event details |
| [03 — Previous winners and patterns](03_past_winners_and_patterns.md) | Comparable Kiro competition winners and carefully bounded lessons |

### Strategy, evidence & ideas

| Document | Use it for |
|---|---|
| [10 — Recent Boston priorities](10_boston_priorities_and_opportunities.md) | Mayor/agency statements connected to potential data workflows |
| [11 — Deeper evidence and transcripts](11_deep_evidence_and_city_priorities.md) | October 23 updates, timestamped recordings, municipal awards and existing products |
| [12 — Stakeholders, strategy and ideas](12_civic_strategy_stakeholders_and_ideas.md) | Sponsor roles, Civic directions, dataset catalog and idea tradeoffs |
| [13 — Public voices and competitive gaps](13_public_voices_and_competitive_gaps.md) | Resident criticism and positive accounts, current institutional signals, existing products and social/video access limits |
| [14 — Creative opportunity atlas](14_creative_civic_opportunity_atlas.md) | 15 ambitious concepts, small day-of demos, differentiation, users and measurable checks |
| [15 — Boston Rat Audit](15_boston_rat_audit.md) | Earlier team findings, public signals, descriptive associations and corrected inference limits |
| [16 — Creative rodent-control playbook](16_rodent_control_creative_playbook.md) | RodentOps plus seven alternatives, actual Boston/Cambridge rodent data, hearing captions and a small demo scope |
| [17 — Hidden ledgers: five new concepts](17_hidden_ledgers_deep_concepts.md) | CurbCheck, Three Hours, 311 outcome layer, hearing ledger, town-meeting decoder; live-verified Boston sources and numbers from Oct 24 noon |
| [18 — Build decision guide](18_idea_shortlist_and_build_recommendation.md) | Updated creative choices and three conservative fallback scopes |
| [19 — RodentOps: government and public voices](19_rodentops_government_and_public_voices.md) | What the City actually says (Wu, ISD, BHA, summit captions), resident complaints with verification levels, existing-tool overlap and pitch/judging implications |

### Data & verification

| Document | Use it for |
|---|---|
| [20 — Complete Civic source inventory](20_civic_source_inventory.md) | All 74 portal resources, full small datasets, large-source previews, five challenge kits, nested subsets and access gaps |
| [21 — Dataset verification](21_civic_dataset_verification.md) | All 22 starter CSVs, missing fields, date ranges and tested join limitations |
| [22 — Public data and repositories](22_public_data_and_repositories.md) | Verified APIs/CSVs, 21 existing public repos, licenses, join recipes and a use for every starter dataset |
| [23 — Live data sources](23_live_data_sources.md) | The live Socrata/API sources and how Kiro reaches them (MCP setup) |
| [24 — RodentOps: data and research catalog](24_rodentops_data_and_research_catalog.md) | The RodentOps-scoped dataset subset with resource IDs, academic/public-health research (OpenAlex, CDC PLACES, Vancouver complaint study), prioritized data gaps and next steps; pairs with document 19 |

## Most consequential findings

- The team has selected **RodentOps**. Earlier alternatives such as Last 100 Feet, ShiftFits and OpenDoor remain in the atlas as research context.
- For rodent control, **RodentOps** is the recommended tool: turn recurring complaints into a reviewed inspection and follow-up brief. Exact-category checks found 5,321 Boston Rodent Activity records in the larger 2026 source; Cambridge separately publishes smart-device and sighting records. These are reports/catches, not population estimates. See document 16 for provenance and limits.
- Start the RodentOps build with **documents 19 and 24**: case reconstruction, explicit unknowns and a reviewed follow-up brief. Boston already has analytics and pilots; a new workflow gap needs validation. Big Belly and DND inventory resources checked here date to 2016 and should not drive current recommendations.
- Public data goes beyond the kit: Cambridge ramp GeoJSON, Bluebikes GBFS/CSV, MBTA facility/alert relationships, MassGIS polygons, O*NET skills and OpenAlex identifiers were inspected directly. Integration pitfalls and failed probes are preserved in document 22.
- The City has public curb-map, parking-sign and Bluebikes display code. Findhelp already tracks referral outcomes. Our ideas need a specific improvement over those existing capabilities.
- Boston already has AI search, youth resource navigation, permitting work and curb-data projects. Identify a specific completion gap before claiming novelty.
- The starter 311 file is 5,000 records from October 8–18, 2026. It cannot establish citywide resolution times or all unmet need.
- Boston's own Expo rewarded service knowledge, accessibility, procurement and collection improvements. These are municipal awards, not Hackachusetts judging results.
- Include a short segment of actual Kiro build evidence in the demo; the required written account and `/.kiro` artifacts still matter. Footage is our recommendation, not a separately stated rule.

## Evidence and link checks

- [Dataset audit JSON](sources/artifacts/civic_dataset_audit.json): row counts, columns, missingness, original request URLs, hashes and join results.
- [Dataset audit script](sources/scripts/audit_civic_kit.py): repeatable inspection of the downloaded starter ZIP.
- [Public-resource audit](sources/artifacts/public_resource_audit.json) and [probe script](sources/scripts/audit_public_resources.py): inspected response fields, CSV headers, repository metadata/licenses and unsuccessful requests.
- [Public-resource inventory CSV](sources/artifacts/public_resource_inventory.csv): a flat catalog of the checked data/code URLs, not a mirror of their underlying records.
- [Rodent-resource audit](sources/artifacts/rodent_resource_audit.json) and [hearing-caption audit](sources/artifacts/rodent_hearing_caption_audit.json): exact category queries, Cambridge counts/schemas, repository reuse issues and selected timestamped hearing passages.
- [RodentOps expansion audit](sources/artifacts/rodentops_expansion_audit.json), [inventory CSV](sources/artifacts/rodentops_expansion_inventory.csv) and [media audit](sources/artifacts/rodentops_media_audit.json): ten Boston catalog packages, resource freshness/schemas, NYC inspections, NOAA weather and selected official-video windows. These are research artifacts, not implemented connectors.
- [Link audit JSON](sources/artifacts/link_audit.json): bounded HTTP HEAD checks of URLs in this folder, with redirects and failures retained.
- [Link-check script](sources/scripts/check_research_links.py): reproduces reachability checks. A successful HTTP response is not content verification; a blocked request is not proof a page is gone.

Sources are linked beside claims and in each document's source register. Full third-party media/transcripts remain linked at their sources. The repository also contains a [Civic data mirror](../data/civic/CATALOG.md), alongside our notes and verification artifacts. Consult [verification notes](sources/README.md) for access limits.

The public-voices expansion includes self-selected resident accounts and counterexamples, not a representative sentiment study. TikTok was blocked and no X post was accepted as verified evidence; document 13 makes those gaps explicit.
