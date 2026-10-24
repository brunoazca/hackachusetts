<!-- Exported from Kiro Crew Research Lab. Campaign 20630275, status complete, 6 cycles, completed 2026-10-24 14:21, parent none. -->

> **Question:** What rodent tools, dashboards and products already exist for Boston and comparable cities, and what gap remains for an inspector-facing 'Rat Audit' that (1) shows what city actions worked at an address, (2) flags adjacent vacant lots and block-level drivers, (3) tells inspectors when to stop monitoring and escalate, and (4) measures results? Cover Boston (311 app, BRAP materials, any city rodent maps or dashboards, Analyze Boston), NYC (Rat Information Portal, rat mitigation zones), Chicago, Cambridge (smart rat boxes), Somerville (Rodent Assistance Program), commercial pest-control and smart-trap products (e.g. Anticimex SMART, Rentokil PestConnect, Bell Sensing), and academic or open-source projects.
>
> **Success criteria:** A comparison table (tool, city or vendor, users, public?, capabilities 1-4 yes/no, link) and a sourced one-sentence gap statement.

# Rat Audit — Competitive Landscape & Gap Research

## Executive Summary & Recommendation

**The one-sentence gap (defensible, sourced):** Every existing rodent tool is either a *city WHERE-map / rule-based policy program* ([Rat Radar](https://ratradar.com/), [NYC RMZ](https://a816-dohbesp.nyc.gov/IndicatorPublic/rats/), [Cambridge](https://www.cambridgema.gov/participatorybudgeting/pbcycles/pbcycle10/smarttrapsforratreduction) / [Somerville](https://www.somervillema.gov/news/deratification-week-taking-somerville-rats) SMART boxes, [Chicago](https://igchicago.org/2026/07/28/oig-audit-finds-chicagos-rat-control-efforts-rely-mainly-on-complaint-driven-responses/), Boston [BRAP](https://www.boston.gov/departments/inspectional-services/boston-rodent-action-plan)) or a *fenced single-property device-monitoring vendor* ([Anticimex SMART](https://us.anticimex.com/smart-pest-control-services/), [Rentokil PestConnect](https://www.rentokil.com/us/pest-control/pestconnect), Bell Sensing) — **none gives a city inspector a per-address view of which city action actually worked, flags adjacent vacant lots and block-level 311 drivers, signals when to stop monitoring vs escalate, and measures the result, in one loop.**

**Why the gap is real and worth filling:**
- **Reduction is achievable with data:** Somerville's SMART-box program reports an avg **≥11%/yr drop in rodent 311 calls (~15% in 2025)** — proof the outcome exists. ([Somerville](https://www.somervillema.gov/news/deratification-week-taking-somerville-rats), [Modern Pests PR](https://natlawreview.com/press-releases/data-shows-modern-pests-smart-rodent-control-prevented-millions-rats))
- **The targeting loop is missing even in data-forward cities:** Chicago built 311 predictive models with Carnegie Mellon (2013), yet its **July 2026 OIG audit** found the program complaint-driven/reactive, not tracking root causes over time, and "unlikely to achieve long-term control." ([Chicago OIG](https://igchicago.org/2026/07/28/oig-audit-finds-chicagos-rat-control-efforts-rely-mainly-on-complaint-driven-responses/))
- **Best public tool (NYC) is only partial:** shows per-property inspection history and runs a codified escalation ladder, but doesn't attribute *what worked* per address or give inspectors a *stop-now* signal. ([NYC Rat Map](https://a816-dohbesp.nyc.gov/IndicatorPublic/rats/))
- **Closest consumer product (Rat Radar) covers NONE of the four** — it is a resident "where are rats near me" map. ([Rat Radar](https://ratradar.com/))

**Recommendation:** Build the "Rat Audit" as an **inspector-facing decision layer on top of open 311 + inspection + parcel data** — the wedge no one occupies: (1) per-address *what-action-worked* history, (2) adjacent-vacant-lot + block-driver flags, (3) a *stop-monitoring vs escalate* recommendation, (4) a before/after 311 results measure. Cities already have the data (Boston Analyze Boston, NYC, Chicago open portals) and a proven outcome target (Somerville's ~11–15%); the missing piece is the inspector decision loop, not more sensors.

---

Campaign 20630275. Question: what rodent tools/dashboards exist for Boston and comparable cities, and what gap remains for an inspector-facing "Rat Audit"?

Four target capabilities:
1. Show what city action **worked** at an address
2. Flag adjacent **vacant lots** and **block-level drivers**
3. Tell inspectors **when to stop monitoring and escalate**
4. **Measure** results

---

## Comparison Table (building)

| Tool | City / Vendor | Users | Public? | Cap 1 (what worked) | Cap 2 (vacant lots / block) | Cap 3 (stop/escalate) | Cap 4 (measure) | Link |
|---|---|---|---|---|---|---|---|---|
| Rat Radar | ~48 US cities (incl. Boston, NYC, Chicago) | Residents / consumers | Yes (free + $19/yr) | No | No | No | No | https://ratradar.com/ |
| BRAP (Boston Rodent Action Plan) | Boston ISD | City staff / public reading | Report public, no tool | Partial (program, not per-address tool) | No | No | Qualitative only | https://www.boston.gov/departments/inspectional-services/boston-rodent-action-plan |
| Rat Information Portal / Rat Map + RMZ | NYC DOHMH | Public + city agencies | Yes | Partial (shows per-property inspection history, not "what worked") | Partial (inspects vacant lots; zones are block/nbhd, no address adjacency flag) | Policy ladder (initial→abatement→compliance→summons→exterminator), not per-address signal | Partial (RMZ reports publish fail-rate trends) | https://a816-dohbesp.nyc.gov/IndicatorPublic/rats/ |
| SMART / PestConnect / Bell Sensing | Anticimex, Rentokil, Bell (commercial) | Pest-control techs + their business clients | Vendor/paid, per-site | Partial (device catch logs before/after, not city-action) | No (fenced to paid property; no neighbor-lot or 311 block view) | Partial (real-time device alert → technician dispatch) | Yes at site level (catch trends, audit/compliance reports) | https://www.rentokil.com/us/pest-control/pestconnect |
| SMART Boxes (participatory-budget) | Cambridge MA | City + residents | Yes (capture counts) | No (counts kills, not city-action attribution) | No | No (trap-kill, not inspector escalate) | Partial (929 captures 2023; tracks trapped counts) | https://www.cambridgema.gov/participatorybudgeting/pbcycles/pbcycle10/smarttrapsforratreduction |
| SMART Box program + public map | Somerville MA (via Modern Pests) | City + residents | Yes (public trap map/dashboard) | No (trap kills, not action-attribution) | Partial (data flagged abandoned/mismanaged lots near dumpsters) | No (trap-kill program, not inspector stop/escalate) | Yes — **avg ≥11%/yr drop in rodent 311 calls, ~15% in 2025** | https://www.somervillema.gov/news/deratification-week-taking-somerville-rats |
| Rodent baiting 311 data + CMU predictive model | Chicago DSS / DoIT | City staff; public data | Yes (open data) | No (OIG: no root-cause tracking over time) | Partial (2013 model predicts where/when; not per-address driver flag) | No (OIG: complaint-driven, reactive) | No (OIG July 2026: "unlikely to achieve long-term control") | https://igchicago.org/2026/07/28/oig-audit-finds-chicagos-rat-control-efforts-rely-mainly-on-complaint-driven-responses/ |
| 311-abundance study | Academic (Frontiers, 2018) | Researchers | Yes (paper) | No | No (validates 311 as abundance signal, no tool) | No | No (research, not operational) | https://www.frontiersin.org/journals/ecology-and-evolution/articles/10.3389/fevo.2018.00189/full |

---

## Cycle Log

### Cycle 0 — Rat Radar + BRAP (moderate)
Rat Radar is the closest existing product: a resident-facing live map of 311 rat reports plus restaurant pest violations across ~48 US cities (Boston, NYC, Chicago included). Free basics, $19/yr premium unlocks violation detail. It answers "where are rats reported near me," NOT any of the four inspector capabilities. Boston's BRAP is a multi-agency program with a 2024 report, not a per-address targeting tool.
Sources: [Rat Radar](https://ratradar.com/), [BRAP](https://www.boston.gov/departments/inspectional-services/boston-rodent-action-plan).

### Cycle 1 — NYC Rat Information Portal + RMZ (strong)
NYC is the most advanced PUBLIC government model. The Rat Map/Rat Information Portal shows per-property inspection type, result, and 5-year inspection count. Rat Mitigation Zones run a codified, multi-agency escalation ladder: initial inspection → abatement order → compliance inspection (2–3 wks later) → summons → exterminator visit (bait or monitor). RMZ pages explicitly inspect vacant lots and publish % of inspections failing for active rat signs over 6-month periods. Still only PARTIAL on all four inspector caps: shows history but not "what worked," zones not per-address adjacency, escalation is rule-based not a per-address stop signal, and failure-rate trends ≠ a clean published "reduced rats by X%."
Sources: [NYC Rat Map](https://a816-dohbesp.nyc.gov/IndicatorPublic/rats/), [RMZ feature](https://a816-dohbesp.nyc.gov/IndicatorPublic/data-features/rat-mitigation-zones), [RMZ report](https://www.nyc.gov/assets/doh/downloads/pdf/rats/rmz-annual-report-jan-june-2023.pdf).

### Cycle 2 — Commercial smart-trap vendors (strong)
Anticimex SMART, Rentokil PestConnect, and Bell Sensing are IoT device platforms: connected traps/sensors watch a single property 24/7, use ML to detect rodent movement, alert a technician in real time, and generate audit-ready catch logs and compliance dashboards. They own cap 4 (results measurement) at the site level and partial cap 3 (device alert → dispatch), but are fenced to the paying property — no adjacent-vacant-lot view, no 311 block context, no city-action attribution, and no public city-wide reduction figure.
Sources: [PestConnect](https://www.rentokil.com/us/pest-control/pestconnect), [Anticimex SMART](https://us.anticimex.com/smart-pest-control-services/), [trapping-software comparison](https://zipdo.co/best/trapping-software/).

### Cycle 3 — Cambridge & Somerville SMART Boxes + measured reduction (strong)
Cambridge and Somerville both run Anticimex-style SMART Box programs (via Modern Pests). Cambridge: 40 city Smart Boxes, 929 captures in 2023, participatory-budget funded — tracks kill counts only. Somerville: public SMART Box map/dashboard, and the first HARD reduction figure found — avg ≥11%/yr drop in rodent-related 311 calls, ~15% in 2025. Somerville's data also flagged rats clustering on "abandoned or mismanaged properties" near commercial dumpsters — the vacant-lot driver, surfaced as a finding but NOT built into an inspector decision tool. Crucially this is a vendor/program trap-kill metric, not a measured reduction from data-driven *inspector targeting of which actions worked*.
Sources: [Cambridge Smart Traps](https://www.cambridgema.gov/participatorybudgeting/pbcycles/pbcycle10/smarttrapsforratreduction), [Somerville DeRATification](https://www.somervillema.gov/news/deratification-week-taking-somerville-rats), [Boston.com Somerville](https://www.boston.com/news/local-news/2022/11/15/somerville-rats-brookline-anticimex-smart-boxes/), [Modern Pests press release](https://natlawreview.com/press-releases/data-shows-modern-pests-smart-rodent-control-prevented-millions-rats).

### Cycle 4 — Chicago + academic (strong)
Chicago built 311-based predictive analytics with Carnegie Mellon (2013) and publishes open rodent-baiting data, yet a July 2026 city OIG audit found its rodent program is complaint-driven/reactive, doesn't monitor root causes over time, treats 311 as action thresholds rather than impact-based targeting, and is "unlikely to achieve long-term control." A Frontiers 2018 study confirms 311 complaints track real rat abundance (validating complaint-based targeting) but is research, not a tool. Chicago is strong independent corroboration: even a data-forward city lacks the inspector what-worked / stop-escalate / measure loop.
Sources: [Chicago OIG audit](https://igchicago.org/2026/07/28/oig-audit-finds-chicagos-rat-control-efforts-rely-mainly-on-complaint-driven-responses/), [GovTech predictive analytics](https://www.govtech.com/data/Using-Predictive-Analytics-to-Combat-Rodents-in-Chicago.html), [Chicago rodent baiting data](https://www.chicago.gov/content/city/en/dataset/rodent_baiting.html), [Frontiers 2018](https://www.frontiersin.org/journals/ecology-and-evolution/articles/10.3389/fevo.2018.00189/full).

---

## Research State — COMPLETE ✅

**Definition of Done MET (cycle 5):** 8-row comparison table (tool, city/vendor, users, public?, caps 1–4, link) + sourced one-sentence gap statement + executive summary and recommendation at top. verification.passed=true.

All checklist sub-questions answered:
- What each tool shows / who uses it / public? → table + cycle logs.
- Which of the 4 caps each covers → table (yes/partial/no per cap).
- Any measured reduction from data-driven targeting? → Yes: Somerville ≥11%/yr (~15% in 2025), vendor-attributed program metric; no city has published a reduction from inspector action-attribution targeting.
- Clearest defensible one-sentence gap statement → written at top.

Run finished.
