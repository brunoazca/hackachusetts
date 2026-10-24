# Civic knowledge base: complete source inventory

Captured **October 24, 2026**. Start with the [inventory guide](../data/civic/inventory/README.md) or [searchable offline catalog](../data/civic/inventory/index.html).

- **74 Civic resources** cataloged with an access attempt for each, including all **22 full starter CSVs** (512,156 rows).
- **Five challenge kits** and **22 individual dataset kits**, with membership and CSV hashes checked against the full track kit.
- **43 source resources** across six Boston database families, including annual 311 files, Numina sensor subsets, documentation, and neighborhood geometry.
- **133 E2C assets:** 53 full tables, 43 data previews, and 37 dashboard/reference entries.
- **Four dashboard data layers**, with schemas and previews; all **2,934 Boston daily bicycle-count records** are also saved.
- Both supplementary Google Docs were read, their **40 distinct document links** enumerated (12 accessibility + 28 crash-background), and **11 tabs** across the linked crash-analysis spreadsheets captured fully or as previews.

Every entry identifies its source, local path, access outcome, retrieval time, and whether the local content is full or sampled. The [manifest](../data/civic/inventory/manifest.json) and [file inventory](../data/civic/inventory/file_inventory.json) expose exact schemas, counts, hashes, PDF pages, and workbook tabs.

**Limits:** “Full” refers to the named file or table, not an entire government website. New raw downloads are capped at 5 MiB. Large sources use bounded previews. Licensed, blocked, private, or non-exported sources are explicitly marked; their contents are not invented. General site navigation is indexed but not recursively mirrored. See the inventory guide for the access gaps and precise crawl boundary.

Use [dataset verification](07_civic_dataset_verification.md) alongside this inventory before selecting joins, date ranges, or product claims. The source archive expands what we can inspect; it does not establish causal conclusions or production integrations.
