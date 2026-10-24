# Hackachusetts Civic Action knowledge base

Research cutoff: **October 24, 2026**. This folder is the team's sourced preparation pack. Institutional priorities and our recommendations are separated from official competition requirements. No private judging preferences, partnership, or guaranteed adoption are established.

## Read in this order

| Document | Use it for |
|---|---|
| [08 — What we should build](08_idea_shortlist_and_build_recommendation.md) | Three scoped ideas, recommended choice, demo moments and build priorities |
| [01 — Rules, judging and submission playbook](01_rules_judging_and_event_playbook.md) | Required deliverables, judging, conflicts to resolve, and the under-three-minute demo |
| [00 — Full official rules reference](00_official_rules_full.md) | Detailed rule text retained in the repository |
| [05 — Event logistics](05_event_info_and_logistics.md) | Setup, schedule, campus and event details |
| [02 — Stakeholders, strategy and ideas](02_civic_strategy_stakeholders_and_ideas.md) | Sponsor roles, Civic directions, dataset catalog and idea tradeoffs |
| [04 — Recent Boston priorities](04_recent_boston_priorities_and_data_opportunities.md) | Mayor/agency statements connected to potential data workflows |
| [06 — Deeper evidence and transcripts](06_deep_evidence_transcripts_and_city_priorities.md) | October 23 updates, timestamped recordings, municipal awards and existing products |
| [07 — Actual dataset verification](07_civic_dataset_verification.md) | All 22 starter CSVs, missing fields, date ranges and tested join limitations |
| [03 — Previous winners and patterns](03_past_winners_and_patterns.md) | Comparable Kiro competition winners and carefully bounded lessons |

## Most consequential findings

- Boston already has AI search, youth resource navigation, permitting work and curb-data projects. Identify a specific completion gap before claiming novelty.
- The starter 311 file is 5,000 records from October 8–18, 2026. It cannot establish citywide resolution times or all unmet need.
- Boston's own Expo rewarded service knowledge, accessibility, procurement and collection improvements. These are municipal awards, not Hackachusetts judging results.
- Include a short segment of actual Kiro build evidence in the demo; the required written account and `/.kiro` artifacts still matter. Footage is our recommendation, not a separately stated rule.

## Evidence and link checks

- [Dataset audit JSON](sources/civic_dataset_audit.json): row counts, columns, missingness, original request URLs, hashes and join results.
- [Dataset audit script](sources/audit_civic_kit.py): repeatable inspection of the downloaded starter ZIP.
- [Link audit JSON](sources/link_audit.json): bounded HTTP HEAD checks of URLs in this folder, with redirects and failures retained.
- [Link-check script](sources/check_research_links.py): reproduces reachability checks. A successful HTTP response is not content verification; a blocked request is not proof a page is gone.

Sources are linked beside claims and in each document's source register. Full third-party media/transcripts remain linked at their sources. The repository also contains a [Civic data mirror](../data/civic/CATALOG.md), alongside our notes and verification artifacts. Consult [verification notes](sources/README.md) for access limits.
