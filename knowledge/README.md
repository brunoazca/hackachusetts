# Hackachusetts Civic Action knowledge base

Research cutoff: **October 24, 2026**. This folder is the team's sourced preparation pack. Institutional priorities and our recommendations are separated from official competition requirements. No private judging preferences, partnership, or guaranteed adoption are established.

## Read in this order

| Document | Use it for |
|---|---|
| [09 — Creative opportunity atlas](09_creative_civic_opportunity_atlas.md) | 15 ambitious concepts, small day-of demos, differentiation, users and measurable checks |
| [10 — Public data and repositories](10_public_data_and_repositories.md) | Verified APIs/CSVs, 21 existing public repos, licenses, join recipes and a use for every starter dataset |
| [11 — Public voices and competitive gaps](11_public_voices_and_competitive_gaps.md) | Resident criticism and positive accounts, current institutional signals, existing products and social/video access limits |
| [08 — Build decision guide](08_idea_shortlist_and_build_recommendation.md) | Updated creative choices and three conservative fallback scopes |
| [01 — Rules, judging and submission playbook](01_rules_judging_and_event_playbook.md) | Required deliverables, judging, conflicts to resolve, and the under-three-minute demo |
| [00 — Full official rules reference](00_official_rules_full.md) | Detailed rule text retained in the repository |
| [05 — Event logistics](05_event_info_and_logistics.md) | Setup, schedule, campus and event details |
| [02 — Stakeholders, strategy and ideas](02_civic_strategy_stakeholders_and_ideas.md) | Sponsor roles, Civic directions, dataset catalog and idea tradeoffs |
| [04 — Recent Boston priorities](04_recent_boston_priorities_and_data_opportunities.md) | Mayor/agency statements connected to potential data workflows |
| [06 — Deeper evidence and transcripts](06_deep_evidence_transcripts_and_city_priorities.md) | October 23 updates, timestamped recordings, municipal awards and existing products |
| [07 — Actual dataset verification](07_civic_dataset_verification.md) | All 22 starter CSVs, missing fields, date ranges and tested join limitations |
| [03 — Previous winners and patterns](03_past_winners_and_patterns.md) | Comparable Kiro competition winners and carefully bounded lessons |

## Most consequential findings

- The strongest new directions are **Last 100 Feet** (journey barriers and repair scenarios), **ShiftFits** (opportunities that fit real schedules), and **OpenDoor** (conflicting service instructions resolved before a trip). These are proposals, not a team selection.
- Public data goes beyond the kit: Cambridge ramp GeoJSON, Bluebikes GBFS/CSV, MBTA facility/alert relationships, MassGIS polygons, O*NET skills and OpenAlex identifiers were inspected directly. Integration pitfalls and failed probes are preserved in document 10.
- The City has public curb-map, parking-sign and Bluebikes display code. Findhelp already tracks referral outcomes. Our ideas need a specific improvement over those existing capabilities.
- Boston already has AI search, youth resource navigation, permitting work and curb-data projects. Identify a specific completion gap before claiming novelty.
- The starter 311 file is 5,000 records from October 8–18, 2026. It cannot establish citywide resolution times or all unmet need.
- Boston's own Expo rewarded service knowledge, accessibility, procurement and collection improvements. These are municipal awards, not Hackachusetts judging results.
- Include a short segment of actual Kiro build evidence in the demo; the required written account and `/.kiro` artifacts still matter. Footage is our recommendation, not a separately stated rule.

## Evidence and link checks

- [Dataset audit JSON](sources/civic_dataset_audit.json): row counts, columns, missingness, original request URLs, hashes and join results.
- [Dataset audit script](sources/audit_civic_kit.py): repeatable inspection of the downloaded starter ZIP.
- [Public-resource audit](sources/public_resource_audit.json) and [probe script](sources/audit_public_resources.py): inspected response fields, CSV headers, repository metadata/licenses and unsuccessful requests.
- [Public-resource inventory CSV](sources/public_resource_inventory.csv): a flat catalog of the checked data/code URLs, not a mirror of their underlying records.
- [Link audit JSON](sources/link_audit.json): bounded HTTP HEAD checks of URLs in this folder, with redirects and failures retained.
- [Link-check script](sources/check_research_links.py): reproduces reachability checks. A successful HTTP response is not content verification; a blocked request is not proof a page is gone.

Sources are linked beside claims and in each document's source register. Full third-party media/transcripts remain linked at their sources. The repository also contains a [Civic data mirror](../data/civic/CATALOG.md), alongside our notes and verification artifacts. Consult [verification notes](sources/README.md) for access limits.

The public-voices expansion includes self-selected resident accounts and counterexamples, not a representative sentiment study. TikTok was blocked and no X post was accepted as verified evidence; document 11 makes those gaps explicit.
