# Rat Audit research campaigns (Kiro Crew Research Lab)

Prompts to run in Kiro Crew → Research Lab → New Campaign. Context for all of them: `knowledge/15_boston_rat_audit.md`.

Settings for all four: **Agent (adaptive)**, max cycles **20**, parallel workers **3**, **Run unattended** on.

Run order: Campaign 4 first (the demo depends on it), then 2 (it is what makes the product different). 1 and 3 can run in parallel.

Status: all four ran in Kiro Crew Research Lab on 2026-10-24 and were exported to the knowledge library: Campaign 4 = `2b8f7f81`, Campaign 2 = `93c1ad29`, Campaign 1 = `e241ffc6`, Campaign 3 = `b6ba6312`. Follow-ups after the spec review: closure-note classifier rules = `d19b46b7`, Sept 1 move-out and events = `ebc7405e`. Third round: matched test of escalation = `4fb70394` (verdict: does not hold), forecast vs baseline = `072d5a66`, competitive gap = `20630275`. Results are in `knowledge/15_boston_rat_audit.md` and `knowledge/sources/rats/demo_site.md`.

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

---

## Campaign 5: Rats and property values in Boston

Registered and started in **Kiro Crew Research Lab** on October 24, 2026, 12:51 PM Eastern.
Native campaign ID: **`c3c9bd8f`**. Status: **complete** (6 cycles).

- Question: do higher rodent-report rates predict lower nearby residential prices, subsequent depreciation, or slower appreciation, and is any relationship causal?
- Compare actual sale prices, rents and assessed values separately; distinguish price levels from changes over time.
- Review primary studies and run reproducible Boston analyses where data permits, with property characteristics, location, market trends and reporting bias considered.
- Recheck the earlier ZIP correlations, including the ranking implementation's treatment of ties. Null or insufficient evidence is a valid result.
- Settings: Agent (adaptive), maximum 20 cycles, 3 parallel workers, unattended.
- Exact brief and settings: [rodents-property-values.json](rodents-property-values.json).
- Launch receipt: [rodents-property-values-run.json](rodents-property-values-run.json).
- Full report, scripts and data stay in the Kiro Crew campaign directory (`~/.kiro/crew/workspace/research/c3c9bd8f/`: `FINDINGS.md`, `reports/`, `scripts/`, `data/`), not in the repo.

**Results**

**Answer: no.** Higher rodent-report activity is not associated with lower residential value or weaker appreciation in Boston, and there is no evidence of causal devaluation.

| Claim | Evidence | Verdict |
|---|---|---|
| Lower price level in rat-heavy areas | ZIP Spearman ρ = −0.047 (p = 0.82, n = 25), residential median FY2026 value | Refuted at ZIP scale |
| Devaluation over time | ZIP FY2025 → FY2026 appreciation ρ = −0.112 (not significant) | Not supported |
| Rodent parcels worth less | Parcels with a rodent/pest record are +39.4% higher overall; +5–14% within land-use type, never negative | Refuted (positive, type-driven) |
| Rodents cause value loss | No primary study found; the confound runs the opposite way | Insufficient |

- The earlier ρ = −0.18 (ZHVI) came from a tie-handling bug in `rats_zip.py` / `rats_econ.py`. Do not cite it.
- Pitch instead what can be counted: closed-but-not-resolved cases, per-block recurrence, tenant and restaurant costs, repeat inspector visits.

---

## Campaign 6: Rats vs residential property value (parcel-matched test)

Native campaign ID: **`0651afa1`** (launched 12:51 PM from a Kiro Crew chat, 14-cycle loop). Status: **complete**. Same question as Campaign 5, run independently with a different method; full findings and scripts in `~/.kiro/crew/workspace/research/0651afa1/`.

**Results** (confidence: high for "no devaluation")

- Method: 1,258 chronic-rodent parcels (≥2 RentSmart "Rodent Activity" rows since 2025) vs controls in the same ZIP, building type and year built ±15 years with zero rodent reports (895 matched). Outcome: % change in assessed value FY2025 → FY2026.
- Citywide, rodent parcels rose +2.39% vs +2.01% for controls (+0.38 points).
- Within the same ZIP and building type the gap is **+0.00 points**, and 51% of rodent parcels beat their controls. No ZIP underperforms meaningfully (−0.09 to +1.02 points across 22 ZIPs).
- Rats are reported most in dense, central, high-demand neighborhoods whose values rise fastest; they co-locate, neither causes the other.
- The "10–20% off" figures are UK insurance and estate-agent marketing, not studies.
- Defensible cost to pitch instead: 3,455 rodent restaurant violations since 2025.

---

## Campaign 7: Three-city rat platform, 13 research tracks (R01–R13)

Native campaign ID: **`947e85a6`**, launched 1:18 PM. Status: **complete** (all 13 tracks answered). One umbrella campaign because Research Lab allows one active campaign at a time: 5 parallel researchers (the app's cap), up to 45 cycles. It replaced the single-track R01 run `11f2fa7f` (stopped after 2 cycles; its findings were reused).

- Config: [rat-platform/umbrella.json](rat-platform/umbrella.json). Launch receipts: [rat-platform/runs.json](rat-platform/runs.json).
- Guidance sent mid-run: [guidance-01](rat-platform/guidance-01.txt) (reuse the team's data research in `docs/rat-audit/` and `.kiro/specs/rat-audit/`; prioritize R09, R10, R12, R13 and Cambridge/Somerville replication) and [guidance-02](rat-platform/guidance-02.txt) (write nothing into the repo).
- Reports, scripts and data stay in `~/.kiro/crew/workspace/research/947e85a6/`.

| Track | Question |
|---|---|
| R01 | Every rat signal in Boston, Cambridge and Somerville |
| R02 | One shared record format across the three cities |
| R03 | Common map units and denominators |
| R04 | Where interventions are recorded in each city |
| R05 | What has worked in rat control, locally and elsewhere |
| R06 | What drives rat reports at block level |
| R07 | Reporting bias: complaints are not rats |
| R08 | Can rat hotspots be forecast better than "last month stays hot"? |
| R09 | Who acts on rats in each city, and what they decide |
| R10 | Legal levers: what actions each city can take |
| R11 | The cost of rats we can defend |
| R12 | Privacy, licensing and ethics guardrails |
| R13 | Existing products and our gap |

**Results**

The platform is feasible and the gap is real: all three cities publish usable rat signals, they fit one schema, and no existing product unifies them with rate ranking, forecasting, what-worked evidence and a human-approved action tied to a legal lever. Build Boston first, then Cambridge, and treat Somerville as complaint-only at block-group level. Ship a transparent persistence + season ranker before any ML model.

| Track | Answer |
|---|---|
| R01 Inventory | All three cities have live rat data. Somerville has one source (311 `4pyi-uqq6`, block GEOID). Only Cambridge has physical trap catches (~528 SMART boxes). Only Boston has parcel/owner links and `closure_reason` text. |
| R02 Schema | A 14-field record validated on a 1,459-row live three-city sample; dedupe removed 2.7%. Boston "Pick up Dead Animal" must not count as rats. Reconcile with the team's Supabase schema and `CONTRACT.md`; it does not replace them. |
| R03 Geography | Use 2020 census block groups (Somerville's block code truncates to them). The Census API now requires a key; TIGERweb and MassGIS work without one. Denominator: housing units (B25001) plus total 311 volume. |
| R04 Interventions | Boston: only ~12% of 10,403 closed rodent cases record a concrete action (2026: baiting 396, barrels 104, referred 99, violation 44). Classifier ~76–80% accurate; misses "abatement". Cambridge SMART boxes are the only physical intervention record; Somerville bait-box visits are not public. |
| R05 What worked | Strong proof only for NYC proactive inspection + abatement (active rat signs −54% over 21 months, CDC MMWR). Reactive poison alone works poorly; sanitation is the lever. None of the three cities has evaluated its own actions. |
| R06 Drivers | Trash is the lever in all three cities; restaurants are not. Cambridge replication: dead-animal, missed-trash and construction sit only ~0.10–0.14 above a pothole placebo. Somerville's 2019 trap study agrees. |
| R07 Reporting bias | Complaints are a biased proxy: in Cambridge, trap catches and sightings correlate only ρ ≈ 0.22. Rank by rate, blend in physical signals, flag low-reporting areas. |
| R08 Forecasting | Hotspots persist: Boston ZIP month-to-month rank ρ ≈ 0.77 (0.58 spring, 0.92 summer). Any model must beat that baseline on a time-split backtest. |
| R09 Users | Boston: ISD Environmental Sanitation + the 10-agency BRAP group, which says it wants a proactive, data-driven model. Cambridge: DPW + contractor + SMART boxes. Somerville: 311 Rodent Control Assistance Program (1,936 visits, 538 properties in 2023). |
| R10 Legal levers | State: 105 CMR 410.550 (owner extermination duty) and 410.560 (refuse). Boston: Site Cleanliness Ordinance ($1,000/day after the 3rd offense), rat-resistant containers ordinance, pre-demolition baiting. Cambridge: dumpster licensing ($300/day). Somerville: trash tickets, permit controls. |
| R11 Cost | Pitch-safe: 5,321 Boston rodent reports in 2026; 3,455 rodent/mice restaurant violations at 819 restaurants since Jan 2025; ~$776K FY26 pest spend ($611K in schools); rats are a documented leptospirosis vector in Boston. |
| R12 Privacy and licensing | Boston PDDL (free reuse), Somerville ODbL (attribution + share-alike). Cambridge rodent datasets have no license: display with attribution only; redistribution needs City confirmation. |
| R13 Existing products | Existing tools are single-city complaint maps (NYC is the most advanced, with no forecast or cross-city view) or per-property trap vendors. None does the cross-city, rate-ranked, action-linked workflow. |

**Do not claim:** reports equal rats; rats lower property values; rats cause asthma; a human leptospirosis case count or any tenant/tourism dollar figure; that any local action reduced rats; closed equals solved.

**Open questions:** does any Boston action reduce repeat reports (needs the "abatement" fix first); is low reporting low rats or under-measurement (calibrate against Cambridge catches); can a cell-week model beat ρ ≈ 0.77; will Cambridge grant redistribution rights.
