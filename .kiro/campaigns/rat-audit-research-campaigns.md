# Rat Audit research campaigns (Kiro Crew Research Lab)

Prompts to run in Kiro Crew → Research Lab → New Campaign. Context for all of them: `knowledge/15_boston_rat_audit.md`.

Settings for all four: **Agent (adaptive)**, max cycles **20**, parallel workers **3**, **Run unattended** on.

Run order: Campaign 4 first (the demo depends on it), then 2 (it is what makes the product different). 1 and 3 can run in parallel.

Status: written 2026-10-24, not run yet. When a campaign finishes, export its report to the knowledge library and note the result here.

---

## Campaign 1: Do rats really follow trash? (block level)

**Research question**

Using Boston open data, test at the block level (about a 100 m grid) which factors are most associated with 311 "Rodent Activity" reports in 2025–2026. Start from `knowledge/15_boston_rat_audit.md`, where the ZIP-level result is improper trash storage +0.78 and restaurants +0.41. Query data.boston.gov with `datastore_search_sql`; the portal blocks `extract` and `coalesce`, so compute those locally. Save results and code under `knowledge/sources/scripts/`.

**Sub-questions**

- Is the ZIP-level ranking of factors still true at block level? Controls: housing density (property assessment rows) and overall 311 reporting volume on that block.
- Do rodent reports rise within 300 m and 90 days after a demolition permit or construction debris report?
- Does a block's trash pickup day predict "Trash Placed Out Early" reports, and do those predict rodent reports?
- Do blocks with Big Belly bins have fewer rodent reports than similar blocks without them?
- Do rodent reports go up in the week after heavy rain (rainfall data)?

**Definition of Done**

A table of each factor's block-level association with rodent reports, with sample sizes and the controls used. A short paragraph per factor saying whether it holds. Code that reproduces it. Results added to section 4 of `knowledge/15_boston_rat_audit.md`.

---

## Campaign 2: What actually worked? (closure notes)

**Research question**

Classify the free-text `closure_reason` of every 2025 Boston 311 "Rodent Activity" case (yearly table `9d7c2214-4709-478a-a2e8-fb2020a5bb94`) into an action type: violation issued, baiting, rat-resistant barrels, monitoring only, referred, no action. Then measure whether new rodent reports at the same address dropped in the 60 days after each action type.

**Sub-questions**

- What are the 8–10 most common action types, and how many cases fall in each?
- Do fewer reports come back after a "violation issued" than after "monitoring"?
- What happened at the 46 addresses with 5+ reports? Which actions were tried?
- Do the closure notes mention a cause (dumpster, overgrown weeds, construction, a restaurant)?

**Definition of Done**

A CSV of case ID, action type and cause; a table of recurrence rate by action type, with counts; 3 real example addresses with timelines (no owner names). Added to `knowledge/15_boston_rat_audit.md`.

---

## Campaign 3: The cost of rats in Boston (evidence we can defend)

**Research question**

Find defensible, sourced evidence of what rats cost in Boston and similar US cities: health (asthma, leptospirosis, bites), restaurants (inspection failures, closures), city spending (ISD, Boston Rodent Action Plan), tenants, and tourism. Separate peer-reviewed or government sources from marketing claims.

**Sub-questions**

- What budget, staff and results has Boston's Rodent Action Plan (BRAP, launched July 2024) published since launch?
- What have NYC's rat mitigation zones and Chicago's rodent program published on cost and measured results?
- Is there any peer-reviewed study linking rodents to housing prices or rents (hedonic or disclosure studies)?
- What did Boston University researchers find about pathogens in Boston rats?
- How many Boston restaurants were closed or failed inspection because of rodents in 2025 (food inspections table `4582bec6-2b4f-4f9e-bc55-cbaa73117f4c`)?

**Definition of Done**

A sourced list of findings, each labeled peer-reviewed, government or industry, with a link. 3–5 numbers we can safely say in a 3-minute pitch. Added as a new section in `knowledge/15_boston_rat_audit.md`.

---

## Campaign 4: Pick the demo address

**Research question**

Find the single best real Boston address for a 3-minute Rat Audit demo. It should have repeated 311 rodent reports in 2025–2026, cases closed that came back, at least 3 nearby drivers (improper trash, a restaurant cited for rodents, a dumpster or demolition, a vacant lot), and closure notes saying what was tried. Use the 2025 and 2026 yearly 311 tables, RentSmart (`dc615ff7-2ff3-416a-922b-f0f334f085d0`), food inspections and property assessment (`ee73430d-96c0-423e-ad21-c4cfb54c8961`).

**Sub-questions**

- Which 10 addresses best meet all the criteria? Rank them.
- For the top 3, what is the full timeline of reports, closures and actions?
- What nearby evidence exists within 100 m, with counts and dates?
- Is any of it sensitive (a private individual's name, a homeless site)? If so, drop that address.

**Definition of Done**

One recommended address, with a timeline, an evidence list and a suggested next action, ready to put on the demo screen. No owner or person names. Saved to `knowledge/sources/scripts/demo_site.md`.
