# NIGHTSHIFT and seven other ways to outthink Boston's rat problem

Research and original proposals: **October 24, 2026**. This extends the [creative atlas](09_creative_civic_opportunity_atlas.md). These are proposed products, not a selected project, validated pest-control methods, or promises of municipal adoption.

**Our strongest rodent concept: NIGHTSHIFT. Turn one block into a playable overnight sanitation plan. Show where food remains accessible, let the user coordinate a few fixes, and explain exactly what those changes accomplish.** The memorable pitch: *Boston's rats have a supply chain. Help the block interrupt it.*

The visual can be playful; the output should be useful to a housing manager, sanitation coordinator, or neighborhood group. Show observable conditions and operational tradeoffs. Do not manufacture a rat-population forecast.

## 1. Why this is a timely civic problem

Boston's [FY27 Operations presentation, slides 15–16](https://www.boston.gov/sites/default/files/file/2026/05/Operations%20FY27%20City%20Council%20Hearing.pdf) reports six intervention types and four monitoring tools, and identifies evaluating pilots as a next step. It also reports 99% compliance with the complaint-response service agreement. Response timeliness is a different outcome from sustained improvement on a block.

The [participatory-budgeting pilot](https://www.boston.gov/departments/participatory-budgeting/rat-prevention-initiatives-dense-residential-areas) has a $500,000 allocation and involves ISD, Public Works and BHA. It combines commercial collection, metroSTOR containers, household education and Microshare monitoring. Two containers entered a BHA Commonwealth trial in May 2026; remaining installation is described as starting in **January 2027**. The City's positive trial description is not an independent evaluation. Its page still describes a September meeting in future tense, so do not treat every status sentence as current.

The [June 2024 Boston Rodent Action Plan](https://content.boston.gov/sites/default/files/file/2024/07/Final%20Full%20BRAP%20Report.pdf), particularly printed pages 11–12, 22–23 and 38–40, connects refuse management, interdepartmental coordination and construction-site responsibilities. That provides a practical foundation for a planning tool.

**Fresh public criticism:** [Universal Hub's October 23 hearing report](https://www.universalhub.com/2026/allston-rat-city-more-boston-rat-city-rat-amusement-parks-rat-buffets) describes residents concerned about overnight garbage access, limited bin-storage space, neighboring properties and fragmented responsibility. It also describes existing sensors and container improvements. These are attributed hearing accounts, not a representative survey or proof that every allegation is correct. The buffet metaphor in our concept is inspired by a resident's framing in that report; it is not a new biological discovery.

For scheduling, use the [official waste guidance](https://www.boston.gov/trash-and-recycling) and [current collection instructions](https://www.boston.gov/departments/public-works/trash): set-out is permitted after 5 p.m. before pickup, with readiness required by 6 a.m. Check the selected property's current collection instructions. A report saying residents are *required* to put trash out at night should not become an app rule. The problem includes practical constraints such as work hours and storage space.

**Interpretation:** useful software could connect a complaint to a coordinated, inspectable action and a follow-up observation. That is a stronger proposed improvement than another sighting map. No evidence establishes that these agencies or vendors are Hackachusetts judges or sponsors.

## 2. Eight creative concepts

### R1. NIGHTSHIFT — play one night from the rat's point of view

**Experience:** a schematic block changes from afternoon to morning. Food-access opportunities appear as a restaurant closes, a bin overflows, a collection is missed, or a shared container remains open. The user gets three intervention cards: repair a lid, change a supported collection arrangement, coordinate a cleanup. A “remaining gaps” view shows which opportunities are still unresolved.

The creative twist is an adversarial walkthrough: *if this were the only fix, what remains accessible?* Animated paths are a teaching metaphor, not measured rat routes. Do not invent sewer connections, home ranges, or infestation probabilities from nearby complaints.

**Build today:** one clearly fictional block, 8–12 sites, a time slider, four possible actions and a small budget. Put actual Boston category counts in a separate evidence panel; mark every simulated site and cost. Export an action sheet with owner, dependency, evidence and follow-up date. A future partner can replace fixtures with a site walk and collection records.

**Inputs:** real Boston waste/rodent categories; manually confirmed site conditions and collection windows; City prevention guidance. Actual pickup timestamps, bin inventories and conditions are **not** supplied by the starter kit. Expected pickup is not actual pickup.

**Useful AI:** convert a short site note into proposed structured observations, with the original text attached; explain why an action leaves another gap. A reviewer confirms observations. Code calculates intervals and chooses actions.

**Measure:** minutes needed to assemble a complete plan, unresolved dependencies correctly surfaced, and modeled exposed-food site-hours under explicit assumptions. No claim of rats prevented. **Best overall rodent direction: V1 + V2.**

### R2. BLOCKPACT — make neighboring fixes happen together

**Experience:** three owners each have part of a problem. A housing manager fixes a container, a business confirms storage, and a collection operator confirms a schedule. The interface shows whether the combined plan is ready, missing a commitment, or waiting for evidence. Each sees why their action matters to the shared plan.

**Creative twist:** borrow the logic of a group purchase without payments: a proposed coordinated window becomes ready only when its required participants have accepted. The system exposes the missing participant or dependency rather than treating one completed ticket as a block-wide success. Do not imply that independent maintenance should wait for unanimous agreement.

**Build today:** three fictional participants and one shared plan; manual accept/decline controls; printable coordination cards. No real outreach, automatic notifications or government integration. Integrate a tiny version into NIGHTSHIFT only after its core works.

**Inputs and proof:** hypothetical commitments and costs, verified responsibility descriptions, and an explicit unknown-owner state. Test that one completed action cannot falsely mark every dependent condition resolved. **V1 + V2.**

### R3. LIDLENS — turn a bin photo into a repair request

**Experience:** photograph an overflowing or damaged container. AI proposes observations such as a visible lid gap or waste outside the container, highlights the relevant region and drafts a maintenance card. A human confirms the observation and chooses a repair action. A follow-up photograph supports comparison.

**Creative twist:** inspect the infrastructure that makes the problem persistent. Add an accessibility check: a container can exclude pests yet be difficult for someone to open or reach. The app asks about reach, operation and approach clearance rather than declaring a design universally usable.

**Build today:** six team-owned or permissioned demonstration images, including an ambiguous angle and a closed container. No model training. Ground suggestions in a small reviewed checklist. A photograph cannot establish pest absence, structural integrity, exact gap dimensions or legal compliance.

**Proof:** compare proposed observations with human labels; reward abstention on obscured images. Strip metadata and blur incidental identifiers before publishing examples. **V1 + V3.**

### R4. BINTETRIS — can a rat-resistant block still fit people?

**Experience:** drag container footprints onto a measured courtyard or curb schematic. The planner checks capacity, collection access and a user-specified pedestrian-clearance constraint. A proposed larger container may reduce waste exposure but obstruct a route; the tool makes the tradeoff visible.

**Creative twist:** combine pest prevention with accessibility and dense-city space constraints. Let a user ask, “What is the smallest layout change that makes this option fit?” Produce two feasible layouts and the remaining unknown measurements.

**Build today:** one synthetic site with three explicitly illustrative container dimensions, a simple rectangle collision check and a capacity scenario. A measured real site is a later step. Aerial photographs alone cannot establish all clearances; do not infer accessibility or permitting approval.

**Inputs and proof:** measured dimensions, vendor specifications and a partner-confirmed clearance rule would be required for deployment. For the demo, label assumptions and test overlap/unknown-size cases. **V2 + V3.**

### R5. RATLAB — when more catches do not mean more success

**Experience:** inspect two independent traces: complaints and recorded catches. Turn on views separating device types, reporting periods and reused serial numbers. A panel asks which additional evidence would be needed before declaring a pilot successful.

**Creative twist:** a conclusion stress test. A chart that seems persuasive becomes less certain when the user learns that devices moved, uptime is missing, or the current month is incomplete. Export a transparent evaluation brief and a prospective measurement plan.

**Build today:** use Cambridge's actual public data below; show descriptive comparisons and missing denominators. Do **not** calculate catches per deployed day without installation/removal dates and uptime. Do not call a before/after difference causal. Trap placement is selective, complaints may influence placement, and fewer catches can have several explanations.

**Differentiation:** the Harvard workshop already explores Cambridge catches and complaints. Boston's hearing also describes baseline measurements and comparison sites. A basic overlay or a claim that the City never evaluates interventions would miss existing work. Our proposed contribution is an accessible decision brief, explicit validity checks and an exportable plan for missing evidence. **Strongest data-first alternative: V1 + V2.**

### R6. QUIETBLOCKS — find where we know the least

**Experience:** give a planner three observation slots and ask where they would add the most information. Display reporting density separately from monitoring coverage. An area with few complaints may receive a check because evidence is sparse, rather than because an algorithm declares it rat-free or high-risk.

**Creative twist:** optimize uncertainty reduction, not the loudness of complaints. Show how the suggested sampling locations change under different coverage assumptions and budgets. The user can reject a location as inaccessible or inappropriate.

**Build today:** Cambridge public device locations, a small grid, and a transparent geometric coverage exercise. Coverage radii are illustrative planning parameters, **not rat home ranges**. No exact private-address publicity or automatic dispatch.

**Proof:** hand-check coverage calculations and demonstrate that missing data never becomes a zero. A real pilot requires a professional sampling protocol and authorized locations. **V1 + V2.**

### R7. DIGBEFORE — rehearse a construction site's handoffs

**Experience:** select a permit and build a timeline of responsibilities: pre-work inspection, waste storage, nearby asset ownership, contractor contacts and follow-up observations. The interface highlights unconfirmed owners before work begins.

**Creative twist:** represent the project as a sequence of handoffs. A demolition event changes the checklist and observation plan; it does not generate a fictional rat-migration plume. The user sees where the workflow would stop if an essential responsibility is unknown.

**Build today:** one public permit as context and a reviewed checklist grounded in the BRAP. Use a fictional work schedule unless actual start dates are verified. Permit issuance is not proof that construction started. Sewer ownership and line condition are not available from the supplied permit rows.

**Proof:** missing start date and uncertain owner remain unresolved. Compare the checklist against its cited source. **V1 + V3.**

### R8. RATRECEIPT — distinguish the action from the outcome

**Experience:** a ticket says closed. A resident sees what was actually documented, what condition was addressed, and what follow-up evidence is still missing. A new observation can create a reviewed follow-up packet referencing the earlier case.

**Creative twist:** three separate states: **administrative case state**, **documented action**, **observed condition**. None automatically substitutes for another. A removed trash can, for example, may require a separate conversation about litter or accessible disposal; that is a question to investigate, not a preset accusation.

**Build today:** three curated cases with paraphrased, de-identified evidence and one synthetic follow-up. No automatic re-filing or public blame rankings. Show an unknown outcome explicitly.

**Proof:** verify that a closure record never becomes “rats eliminated.” This is the rodent-specific extension of RepairLedger in document 09. **V1 + V2.**

## 3. Real data and code: what we actually checked

The [machine-readable audit](sources/rodent_resource_audit.json) records URLs, response hashes, fields, counts and limits. Reproduce it with [audit_rodent_resources.py](sources/audit_rodent_resources.py). Individual complaint descriptions and addresses are not retained in that audit.

| Resource | Verified on October 24 | Best use and limits |
|---|---|---|
| [Boston 2026 311 source](https://data.boston.gov/dataset/311-service-requests/resource/1a0b420d-99f1-4887-9851-990b2a5a6e17) | Exact `type = Rodent Activity` returned **5,321** records; earliest/latest `open_dt` were Jan 1 and Oct 23, 2026. Schema includes coordinates, neighborhood, case ID, dates and closure reason | Boston-specific descriptive evidence. This is one category in one resource, not all pest complaints, unique infestations or the number of rats |
| [Boston new-system 311 source](https://data.boston.gov/dataset/311-service-requests/resource/254adca6-64ab-4c5c-9fc0-a6da622be185) | Exact `service_name = Rodent Activity` returned **0**. A separate exploratory full-text query matched unrelated service categories | Category coverage differs between systems. Zero in this filter does not prove no rodent work. Do not concatenate systems before validating overlap and taxonomy |
| [Cambridge Smart Rat Boxes](https://data.cambridgema.gov/Public-Works/Smart-Rat-Boxes/78bs-b5ig/about_data) | API count **528** rows; device type, active flag, coordinates, annual and 2026 monthly counts; Modern Pest attribution | Deployment records, not a rat census. No installation-date column. Separate Box and Pipe devices; do not mistake blank or future-month values for observed zeros |
| [Cambridge rodent sightings](https://data.cambridgema.gov/Public-Works/Commonwealth-Connect-Service-Requests-Rodent-Sight/uz4w-baz5/about_data) | API count **5,188** rows; ticket ID, dates, status, coordinates, description and optional image | Complaints across the dataset, not 2026-only incidence. Metadata says internally originated work orders are excluded. Reporting and intervention traces have no direct shared key |
| [Harvard workshop repository](https://github.com/harvardinformatics/llm-workshop-smart-rat) and [dictionary](https://github.com/harvardinformatics/llm-workshop-smart-rat/blob/main/data/data_dictionary.md) | July snapshot CSVs parsed: **512 deployments / 428 distinct serials**, two rows missing latitude; **4,973 complaints**, last created July 5, 2026 | Useful provenance, parsing pitfalls and competitor baseline. Snapshot differs from the live portal. No claim of novel analysis merely from combining these files |
| [Refuse-reduction research and data/code](https://github.com/ishana-s/Invasive_Rats_Refuse) | Public R repository linked by the paper; GitHub license metadata is absent | `rat_det.csv`, `detHIs.csv` and analysis script are research references. The [PLOS study](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0308917) concerns peri-urban Santa Cruz and reduced human food availability during lockdown. It does not calibrate a Boston forecast |
| [Boston trash-collection GIS layer](https://gisportal.boston.gov/arcgis/rest/services/Infrastructure/OpenData/MapServer/10) | Published polygon-layer description and schedule fields inspected; description credits a 2015 update | Discovery lead only. Current boundaries, field meanings, holiday changes and actual pickup timing remain unverified. Use current address-specific instructions for a real plan |

**Download routes:** Cambridge publishes [smart-box CSV](https://data.cambridgema.gov/resource/78bs-b5ig.csv) and [sightings CSV](https://data.cambridgema.gov/resource/uz4w-baz5.csv) APIs. Those bare endpoints can paginate: request a sufficient limit and check the count rather than assuming one response is complete. The checked [smart-box metadata](https://data.cambridgema.gov/api/views/78bs-b5ig.json) and [sightings metadata](https://data.cambridgema.gov/api/views/uz4w-baz5.json) define field names. Boston's exact filtered API URLs are recorded in the audit; use those instead of a broad text search for statistics.

**Reuse status:** both Cambridge metadata responses had a null `licenseId`; that is an unresolved metadata field, not a finding that reuse is prohibited. Review portal terms before redistributing data. The [Harvard LICENSE](https://github.com/harvardinformatics/llm-workshop-smart-rat/blob/main/LICENSE) is internally inconsistent: its introduction names CC BY, its main section names BY-NC-SA, and its badge links BY-NC-ND. Do not call it MIT-licensed or freely reusable for every purpose. Prefer an original implementation and original City sources; clarify terms before copying workshop material. Public availability does not establish a commercial license for the research repository either.

The starter's 5,000-row 311 extract still lacks a literal rodent match. That earlier finding is correct **for the starter extract**, but no longer a reason to say usable rodent records are unavailable. The larger Boston source and the separate Cambridge datasets materially expand our options.

## 4. The data model that makes the idea honest

Keep three layers visibly distinct:

1. **Observed:** source, jurisdiction, record ID, event time, retrieval time, category and any confirmed condition. Complaints remain reports; catches remain catches.
2. **Proposed:** action, responsible role, estimated effort, prerequisites and the condition it intends to change. Costs and effectiveness assumptions remain labeled.
3. **Scenario:** synthetic site geometry, exposure intervals and illustrative actions. Changing a scenario does not alter the original evidence.

For NIGHTSHIFT, a defensible toy objective is:

`exposed_food_site_hours = sum(duration of each site's confirmed-or-simulated exposed-food intervals)`

Merge overlapping intervals **within a site** before summing. Keep unknown intervals unknown and report missing coverage. Compare action subsets that meet the same budget and ownership constraints. An exact search over four candidate actions is simple enough to explain and verify. The result optimizes the stated model, not real rat outcomes. One large dumpster and one small bin are not biologically equivalent; site-hours is an operational proxy, not food mass or pest risk.

For RATLAB, aggregate complaints by a declared period and spatial unit; identify reused serials and distinguish deployment rows from devices. Proximity joins create associations, not proof that a trap served a particular complaint. Do not invent deployment dates, device uptime or a shared case key. Keep Boston and Cambridge separate. A prospective study would need repeated observations, operating dates, intervention records and comparison sites; this hackathon can design that study but cannot complete it.

The [systematic review of urban rat movement](https://www.frontiersin.org/journals/ecology-and-evolution/articles/10.3389/fevo.2019.00013/full) supports treating resources and movement barriers as context-dependent. It does not provide one universally valid neighborhood radius. Therefore every geometric buffer in our demo is a user-visible planning assumption.

## 5. Stakeholders and the product each might care about

These are reasoned product hypotheses, not private preferences or confirmed partnerships.

| Stakeholder | Likely useful output | Tension to design for |
|---|---|---|
| ISD / environmental services | Evidence-linked inspection and follow-up plan | More reports can increase workload without improving evidence |
| Public Works / collection operators | Clear storage and collection dependencies | Scheduling changes affect crews, residents and streets; an app cannot promise a new pickup |
| BHA / housing managers / residents | Coordinated maintenance and usable containers | Prevention must also work for people with mobility constraints or little storage space |
| Council / resident associations | Transparent distinction between response, action and outcome | Criticism and City process metrics can describe different things; neither alone proves impact |
| BWSC / Parks / construction managers | Verified responsibility for relevant assets | Do not assume private access to sewer maps, sensor feeds or contractor systems |
| metroSTOR, Microshare, Republic; Modern Pest in Cambridge | A reviewed workflow that complements existing operations | These are vendor roles evidenced by public sources, not verified hackathon sponsorships or available integrations |
| Hackathon reviewers | A finished user task, useful implementation and clear design | Official criteria are Potential Value, Implementation, Quality and Design; private weights/preferences remain unknown |

## 6. The version we could actually build today

**Choose NIGHTSHIFT, with one small BLOCKPACT dependency.** Keep RATLAB as the alternative if the team prefers data analysis. Building all eight would weaken the demonstration.

Three screens are enough: **review the evidence → play through one night and choose actions → export the coordinated plan**. Use one real aggregate evidence panel and one conspicuously simulated block. Avoid accounts, payments, live sensors, citywide routing and a biological model.

Suggested work sequence:

1. Confirm data/category definitions and write the scenario assumptions in Kiro.
2. Build the timeline and four-action comparison with deterministic calculations.
3. Add source-linked note extraction and a human-review step.
4. Add one incomplete commitment and one unknown observation; make both visible.
5. Check interval arithmetic, budget constraints and export accuracy, then polish keyboard use and record the completed flow.

**Judging fit:** Potential Value is the completed coordination task for a named user; Implementation is meaningful, documented Kiro work and a reproducible calculation; Quality and Design is the readable overnight story, source inspection, and graceful handling of missing information. None requires claiming proven rat reduction.

**Under-three-minute video:** approximately 20 seconds of problem/context, 90 seconds of the working flow, 25 seconds of actual Kiro evidence, 20 seconds of checks and limits, and 15 seconds of the proposed pilot. Include Kiro footage if it shows a meaningful spec, correction or check. Attribute this Codex research separately. Follow [the submission playbook](01_rules_judging_and_event_playbook.md): public repo with root `/.kiro`, working demo, English description, written Kiro account, maximum four members, public video under three minutes, and SundAI submission by 8 p.m. Eastern.

## 7. Research access and remaining uncertainty

- Opened official City materials, the primary research paper, the movement review, the October 23 local hearing report, public API metadata and repository text. Bounded API requests and workshop CSV parsing are preserved in the audit; no external repository code was executed.
- The [official Boston City Council hearing recording](https://www.youtube.com/watch?v=Fn4cGj8xxBs) was identified through the report and its metadata verified: *City Services on October 23, 2026*, Boston City Council, 2:38:34. Selected caption windows were read; audio and the complete hearing were not independently reviewed. [Caption provenance](sources/rodent_hearing_caption_audit.json) records the track hashes and inspected intervals without copying the transcript.
- TikTok and X searches did not produce an original rodent post verified in this pass. Do not claim a social-media consensus or convert a viral allegation into a business risk score. Existing qualitative Reddit evidence is in [document 11](11_public_voices_and_competitive_gaps.md).
- No Boston sensor API, vendor API, reliable rat-population denominator, current bin inventory or actual collection timestamp feed was established. These are potential pilot inputs, not features already connected.

### Four inspected hearing passages

These are paraphrases of supplied captions, which contain transcription errors. Speaker names are not inferred from imperfect captions.

| Recording interval | Caption-supported point | Product consequence |
|---|---|---|
| [13:30–14:30](https://www.youtube.com/watch?v=Fn4cGj8xxBs&t=810s) | The presentation describes an interdepartmental program and existing sensors, traps and container work | Build around existing operations |
| [19:40–20:50](https://www.youtube.com/watch?v=Fn4cGj8xxBs&t=1180s) | Baselines, comparison sites, presence sensors and camera detection are discussed | Evaluation and computer vision are already in use; establish a specific additional benefit |
| [59:00–60:30](https://www.youtube.com/watch?v=Fn4cGj8xxBs&t=3540s) | A resident argues that garbage can remain outside overnight into the next afternoon and proposes a later set-out pilot | Motivate a scenario; do not present testimony as measured citywide exposure |
| [68:50–70:20](https://www.youtube.com/watch?v=Fn4cGj8xxBs&t=4130s) | Discussion connects community preferences, Streets/Public Works and collection-contractor feasibility | Include practical constraints and responsible roles |
