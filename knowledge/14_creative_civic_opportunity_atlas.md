# Beyond a civic chatbot: 15 buildable experiments

Research and proposals: **October 24, 2026**. Read with the [resource catalog](22_public_data_and_repositories.md), [public voices and competing products](13_public_voices_and_competitive_gaps.md), and [official rubric](01_rules_judging_and_event_playbook.md). These are original product proposals, not official challenge requirements, secured partnerships, or predictions of winning.

## The creative direction

**Make the gap between “a service exists” and “a person can use it” visible—and let someone change the conditions.** A route can exist while its entrance is inaccessible. Training can be free while its hours are impossible. A directory can be accurate about an organization and wrong about its intake process. A ticket can be administratively closed while the underlying obstacle remains.

The strongest demo is a small, manipulable model of one of these gaps. Change an elevator, an opening time, a document requirement, or a pickup window; show what becomes possible and explain exactly why. Use AI to interpret messy information and communicate the result. Use explicit rules and calculations for the result itself.

This broadens the earlier conservative shortlist. **BlockBrief remains the fallback with the fewest data dependencies. It is no longer the default recommendation when originality is the priority.**

**Topic expansion:** [document 12](16_rodent_control_creative_playbook.md) adds eight rodent-control concepts. RodentOps turns recurring complaints into a reviewed inspection and follow-up brief; other ideas address container geometry, repair evidence, observation gaps and intervention evaluation. Real Boston/Cambridge records and selected October 23 hearing captions support the research. The 15 concepts below remain the broader atlas.

## First choices

| Choice | Why it is compelling | What must be true before choosing it |
|---|---|---|
| **A1 Last 100 Feet** | A visually immediate accessibility story: one broken connection removes access to an otherwise available destination | Team can curate and verify a tiny pedestrian graph; do not attempt all Boston routing |
| **A2 ShiftFits** | Turns workforce opportunity into a solvable schedule problem, then identifies the smallest helpful change | Obtain three actual program schedules; otherwise label schedule fixtures as illustrative |
| **A4 OpenDoor** | Already has a real, inspectable source conflict; combines useful AI extraction with an understandable resident outcome | Keep scope to a few public resource pages and one reviewed journey |
| **A3 CityHandshake** | Strong service-delivery story, motivated by reported confusion between jurisdictions | Verify responsibility for three example assets; unresolved ownership stays unresolved |
| **A13 Lab2Block** | Distinctively Massachusetts: connect university research to a small civic experiment | Human-review a handful of papers; citations alone do not establish applicability |

Pick **one**. The larger vision is a possible follow-on pilot. The day-of demonstration should finish one useful task in roughly 90 seconds.

## A1. Last 100 Feet — show the connection that breaks a journey

**User and moment:** a student using a mobility aid wants to get from a station entrance to a campus service. The transit portion looks possible, but one curb, entrance, or station connection has incomplete or adverse evidence.

**Experience:** a chain of journey segments, each with a source, observation time, and known/unknown state. Disable a segment and watch reachable destinations change. Switch into a planner view: “Which single verified improvement reconnects the most destinations in this small graph?” This is reachability under stated assumptions, not a prediction of how many people will benefit.

**Build today:** one Cambridge corridor, approximately 12–20 manually checked segments, two destinations, one official alert and one explicitly simulated closure. Export a short verification/repair brief. A schematic graph is enough if a fully connected map would consume the day.

**Building blocks:** [Cambridge ramp data](https://www.cambridgema.gov/gis/gisdatadictionary/dpw/dpw_pedestrianramps), MBTA facilities/alerts, campus points; [AccessMap Beyond the Curb](https://github.com/TaskarCenterAtUW/AccessMapBeyondTheCurb) and [Project Sidewalk](https://github.com/ProjectSidewalk/SidewalkWebpage) are precedents. The [catalog](22_public_data_and_repositories.md) records actual downloaded schemas. Add verified pedestrian connections; proximity alone is not connectivity.

**AI and proof:** extract relevant alert clauses and explain the broken chain with citations. Check graph results by hand, include an unknown segment, and test the keyboard journey. Proposed pilot owners: campus accessibility staff and a municipal accessibility team.

**Differentiation and stretch:** accessible routing already exists. The proposed contribution is a Boston/Cambridge evidence chain plus repair counterfactuals. A later pilot could incorporate field observations and validation by disabled users. Never label a route safe or accessible merely because no alert exists. **V3 + V4.**

## A2. ShiftFits — find the smallest change that makes opportunity possible

**User and moment:** a working student finds a relevant training program but cannot reconcile class times, travel, work, and caregiving.

**Experience:** place the person's voluntary constraints and three program schedules on a timeline. Explain the exact conflict. A “change one thing” control tries an alternative cohort, an earlier departure, or a hypothetical 30-minute schedule shift. Produce an adviser-ready question: “Could this cohort start later?” The model changes the opportunity, rather than treating the person as the problem.

**Build today:** three human-verified programs, one week's timetable, two travel scenarios, no accounts. Use a small deterministic interval solver; distinguish verified schedules from invented demonstration fixtures.

**Building blocks:** Scorecard/IPEDS for institution context, O*NET skills for occupation context, public MassHire/provider listings for actual programs, MBTA schedules for travel. The [Massachusetts youth employment report](https://www.mass.gov/doc/2026-barriers-to-employment-report/download), dated February and **published June 2026**, discusses transportation and caregiving constraints. Those findings motivate the concept; they do not prove a particular person cannot attend.

**AI and proof:** normalize published program descriptions and turn conflicts into understandable explanations. Manually solve ten feasible/impossible examples and compare. Proposed pilot owners: a MassHire adviser, community-college career office, or youth-employment intermediary.

**Differentiation and stretch:** opportunity search already exists. The proposed feature is a transparent feasibility certificate and a counterfactual for providers. A later pilot could explore whether changing one cohort schedule expands access. No guaranteed admission, placement, wages, childcare slot, or benefit eligibility. **V5 + V3 + V4.**

## A3. CityHandshake — stop making the resident carry the handoff

**User and moment:** a resident reports a blocked approach to a bus stop and is unsure which organization owns the next action. [March hearing reporting](https://www.wgbh.org/news/politics/2026-03-03/commuters-disability-advocates-blast-bostons-snow-response) includes a resident's account of being redirected between City and state contacts.

**Experience:** separate the physical object, its location, the observed problem, and the responsible service. Show an evidence-backed responsibility chain and a portable “handoff receipt”: facts already supplied, what remains unknown, and the next question. The user can correct the interpretation without retelling everything.

**Build today:** three curated examples—municipal sidewalk, transit facility, campus entrance—with verified responsibility sources. Produce a reviewed draft and official contact link. Do not send reports or impersonate a government case system.

**Building blocks:** starter 311 department/category vocabulary, MBTA facility relationships, official agency pages, [OpenContext](https://github.com/CityOfBoston/OpenContext), and [FixMyStreet](https://github.com/mysociety/fixmystreet) as a mature reporting precedent. Curb maps alone do not establish maintenance responsibility.

**AI and proof:** convert a short description into a structured issue and summarize source-supported responsibility. Evaluate correct routing, unnecessary repeated questions, and explicit handling of unknown ownership. Proposed pilot owner: a campus help desk or community navigator, with agency validation later.

**Differentiation and stretch:** a portable, minimal handoff between systems; not another complaint inbox. A future pilot needs counterpart organizations willing to acknowledge receipt. The prototype must not suggest they already do. **V1 + V2 + V3.**

## A4. OpenDoor — check the instructions before making the trip

**User and moment:** a student finds a resource but sees conflicting opening hours or intake instructions.

**Concrete evidence:** [UMass Boston's official pantry page](https://www.umb.edu/campus-life/current-students/u-access/food-pantry/) publishes Fall 2026 hours and a registration link. A [Lemontree listing](https://www.foodhelpline.org/resources/umass-boston-u-access-food-pantry) contains a no-preregistration statement, alongside other schedule information. The mismatch is real in the reviewed pages; it does not establish what happens at the door. Different seasons and definitions can explain some discrepancies.

**Experience:** compare source cards, surface the disagreement, prefer the provider's current instructions, and create a “before you leave” card. Overlay a user-entered class/work window to explain whether the published hours fit. Include a ready-to-copy clarification question if the source cannot settle it.

**Build today:** three resources, one actual conflict, one updated-source scenario, no sensitive intake. Extract structured fields with evidence spans, then require review before treating them as operational facts.

**Building blocks:** campus pages, [Open Referral HSDS](https://github.com/openreferral/specification), campus locations, and a small curated timetable. [Findhelp already offers closed-loop referrals](https://company.findhelp.com/products/platform/); the differentiation to test is source-conflict detection plus schedule feasibility, without needing a provider integration.

**AI and proof:** identify conflicting instructions and missing effective dates. Measure supported-field accuracy and whether a user can identify the correct next action. Proposed pilot owner: student basic-needs office. A later pilot could let providers acknowledge corrections. No claim of stock, appointments, or completed service. **V4 + V1 + V5.**

## A5. DockFallback — plan the return, then expose the weak fallback

**User and moment:** a Bluebikes rider cannot dock at their destination and the next nearby station is also full. A [resident discussion](https://www.reddit.com/r/boston/comments/1tc6g6l/anyone_else_feel_like_bluebikes_completely_fails/) describes this; other commenters point out that availability is already visible in the app.

**Experience:** show destination plus two fallbacks, walking distance to the final destination, feed age, and whether each currently accepts returns. Toggle one station unavailable. The result explains how many alternatives remain under the selected walking constraint. A campus operator can explore where a temporary staffed return arrangement might be worth investigating.

**Build today:** one destination cluster, real GBFS snapshot, deterministic filters, one clearly simulated outage. Never call a current observation a reservation or a reliable future-availability prediction.

**Building blocks:** official [Bluebikes feeds and CSVs](https://bluebikes.com/system-data), historical station-pair counts, [Boston's existing display](https://github.com/OETBoston/blue). [Bike Angels](https://bluebikes.com/bike-angels) already incentivizes rebalancing, so do not claim to invent it.

**AI and proof:** explain constraints and summarize an operator experiment; core availability logic is ordinary code. Test stale feeds, disabled returns, renamed stations, and zero alternatives. Proposed pilot owner: campus transportation/TMA, with operator cooperation for any operational change. **V3 + V4.**

## A6. HeatHours — a cooling location is useful only when it is usable

**User and moment:** a community organization plans outreach for a hot evening and needs to understand which listed resources have verified hours and access information.

**Experience:** move a time slider across a small set of facilities. Published hours, unknown hours, and scenario closures change the coverage picture. Show what a hypothetical one-hour extension would change for selected origin points. Separate the weather bulletin, service availability, and demographic context.

**Build today:** three verified facilities, one hypothetical hot-day scenario, three representative origins. A coverage schematic is sufficient; do not imply clinical safety or precise heat exposure.

**Building blocks:** Boston's [heat resources](https://www.boston.gov/departments/emergency-management/keeping-cool-heat), cooling-center GIS, NWS point/alert APIs, full MassGIS EJ geometries. The starter EJ CSV has no geometry and cannot locate households.

**AI and proof:** extract opening/access conditions and draft a reviewed outreach card. Test timezone, missing hours, closed facility, and an empty alert response. Proposed pilot owners: a community organization and emergency-management liaison. A later pilot needs maintained hours, accessibility checks and facility capacity. **V2 + V3.**

## A7. Storm Rehearsal — a community tabletop exercise people can manipulate

**User and moment:** a neighborhood group wants to practice what happens if a normal resource becomes unavailable during a storm.

**Experience:** choose a clearly hypothetical scenario, remove a meeting point or transport connection, and see which preparation tasks now lack an owner or source. Generate a rehearsal card with official references and unanswered questions. Offer low-connectivity printable output.

**Build today:** one neighborhood, one hazard, three public facilities, a manually authored dependency graph. The “wow” is the cascading effect of one closure, followed by a concrete preparation question.

**Building blocks:** FEMA declaration history for historical context, NWS notices, NOAA Boston tide predictions, neighborhood context, and [Coastmix](https://github.com/OETBoston/Coastmix) as an existing coastal-participation tool. Tide predictions are not inundation forecasts; FEMA rows are not a count of independent storms.

**AI and proof:** explain the scenario and turn gaps into a sourced checklist. Test that historical records and simulated disruptions cannot be presented as current warnings. Proposed pilot owner: community resilience group. A later version requires agency review; no autonomous evacuation advice or invented shelter capacity. **V2.**

## A8. PermitDiff — show which requirement changed the path

**User and moment:** a small applicant understands the goal but cannot see how changing one project detail affects preparation.

**Experience:** two scenario cards feed a small dependency graph. Changed requirements are highlighted with their exact source passages. Produce the missing-information list and the right question for staff. Later, compare a revised official page with its prior version and flag affected checklists.

**Build today:** one municipality, one permit task, two human-reviewed scenarios. Use the simplest rules that produce a meaningful before/after.

**Building blocks:** official service pages; approved-permit data for examples of categories, not processing-time estimates; [docassemble](https://github.com/jhpyle/docassemble) for guided-interview patterns. [Boston Indicators' September report](https://www.tbf.org/news-and-insights/press-releases/2026/september/indicators-permitting-reform-report-20260915) discusses process uncertainty across six other Massachusetts communities; it is not a Boston delay measurement.

**AI and proof:** extract requirements and explain differences, with expert-reviewed rules controlling applicability. Test known relevant/irrelevant changes and absent information. Proposed pilot owner: small-business assistance or off-campus housing staff. Boston already has permitting AI and parking interpretation; a generic permit chatbot is a weak novelty claim. **V1.**

## A9. RepairLedger — distinguish an administrative event from an observed outcome

**User and moment:** a resident or community navigator wants to understand what happened after a service request, without conflating a citation, a referral, and a fixed problem.

**Experience:** a timeline has separate lanes for official administrative events and resident observations. Each item retains its source. “Closed,” “repair observed,” “resident disagrees,” and “unknown” remain different states. The useful output is a concise factual follow-up packet.

**Build today:** three synthetic case timelines, explicitly labeled, plus real neighborhood-level 311 context. The starter lacks stable case IDs and closure dates; it cannot support real case tracking. Violation status dates are not verified repair dates.

**Building blocks:** 311, violations, permits; the full Boston APIs expose additional address/identifier fields, but a reliable cross-dataset property join remains unvalidated. [SeeClickFix already manages requests](https://www.civicplus.com/seeclickfix-311-crm/); our hypothesis is that a clearer resident outcome record helps an existing process.

**AI and proof:** summarize events while preserving attribution and disputed facts. Test that a citation never becomes a claimed repair. Proposed pilot owner: community navigator or tenant-support organization. Later work needs consent, trustworthy case identity and agency cooperation, not landlord/person rankings. **V1 + V2.**

## A10. MoveOut Relay — coordinate the last useful hour of an unwanted object

**User and moment:** a student has a usable desk, a fixed move-out deadline, and no vehicle; a recipient needs furniture but cannot collect it in time.

**Experience:** item cards carry dimensions, pickup window, owner-confirmed condition and an expiry time. Match compatible windows and a hypothetical shared vehicle capacity. Show how moving one collection window saves a feasible handoff. Export a pickup plan; leave actual commitments to people.

**Build today:** five synthetic items, three volunteered scenario constraints, one neighborhood, simple capacity/time-window checks. The demo is a matching puzzle with a practical result, not a citywide marketplace.

**Building blocks:** college locations, 311 waste context, current disposal guidance. [Harvard Kennedy School students already studied furniture reuse](https://www.hks.harvard.edu/faculty-research/policy-topics/cities-communities/each-year-boston-student-move-ins-lead-loads); [2026 GBH reporting](https://www.wgbh.org/news/local/2026-08-06/allston-christmas-isnt-just-in-allston-anymore-heres-how-to-dispose-of-bulky-items-when-moving) includes the City's collection concerns. Neither source establishes available partners or vehicles.

**AI and proof:** normalize item descriptions and explain rejected matches; deterministic code checks capacity and windows. Compare completed feasible matches with first-come matching on the same fixture. Proposed pilot owner: campus sustainability/reuse group. Verify acceptance rules and item condition; do not certify discarded goods as safe. **V2 + V4 + V1.**

## A11. StreetTradeoffs — make a public comment show its assumptions

**User and moment:** residents disagree about a street change but lack a shared way to compare the space and access tradeoffs.

**Experience:** allocate a fixed street width among walking, cycling, loading, transit and parking. Add a “whose task changes?” panel: delivery, wheelchair approach, bus rider, local business. Produce an evidence-linked public-comment card describing the preferred option and what it sacrifices.

**Build today:** one schematic block and three fictional design alternatives, with an actual width only if verified. Display starter crash/count data as historical context, not as a causal simulator.

**Building blocks:** Vision Zero, Cambridge crashes and bike counts, Somerville counts, historic Numina, [Streetmix](https://github.com/streetmix/streetmix), and [Curb Atlas](https://github.com/OETBoston/curb-atlas). A cross-section editor already exists. Our proposed layer is the explicit task tradeoff and evidence audit.

**AI and proof:** translate competing concerns into testable questions; preserve dissent rather than collapsing it into a manufactured consensus. Test width conservation and source attribution. Proposed pilot owner: community engagement/planning staff. Do not forecast injuries prevented from these files. **V3 + V1.**

## A12. ParkTime — design a visit window with honest historical evidence

**User and moment:** a campus/community group wants a park visit or event time that accommodates different preferences and access needs.

**Experience:** compare historic hourly patterns with a proposed event calendar and user-entered preferences. A vintage control makes the age of the evidence obvious. Show “historically lower count in this dataset” rather than “quiet now.” Let a group compare two windows without exposing individual medical information.

**Build today:** one Fresh Pond historical month, two proposed time windows, an accessible comparison and printable plan. Add official current opening/event information only after verification.

**Building blocks:** Fresh Pond, Eco-Totem, Cambridge and Somerville count data; MapLibre for presentation. These sources differ in place, sampling and period. They cannot be added together as one live crowd count.

**AI and proof:** explain observed patterns and evidence gaps. Verify time aggregation and missing-value behavior. Proposed pilot owner: community recreation organizer. A later pilot needs fresh observations and participants' feedback; no sensory-accessibility guarantee from count data. **V3 + V4.**

## A13. Lab2Block — turn a paper into a small, testable civic experiment

**User and moment:** a community organization has a concrete problem; a nearby university has relevant research, but neither side has a usable experiment brief.

**Experience:** start with one local question, retrieve a few relevant works, and build a card for each: method, study setting, available code/data, limitations, and what a local test would need. Produce a two-week pilot proposal with a measurable outcome and a result that would falsify the idea.

**Build today:** one problem, five manually reviewed works, one pilot brief. The unusual demo is a highly cited but unsuitable paper being rejected in favor of a less famous, testable method.

**Building blocks:** OpenAlex works, campus locations, institution identity crosswalk, relevant civic dataset, and a public repository actually linked by the chosen paper. The [OpenAlex API](https://help.openalex.org/api/) provides identifiers missing from the starter. A metadata record is not permission to reproduce full paper text.

**AI and proof:** draft method summaries with evidence spans; a person checks transferability and citations. Validate five references and one deliberately irrelevant match. Proposed pilot owners: community-engaged research office and community organization. No invented researcher endorsement, contact, or implementation claim. **V4 + V5 + the selected civic problem.**

## A14. NoticeStudio — rehearse whether a notice lets someone act

**User and moment:** a public-facing editor needs a notice that a resident can actually use.

**Experience:** source passage → action card → role-based task rehearsal. A resident must find the deadline, required action and destination using only the keyboard. Change a source date and show which card fields become stale. Generate a review queue rather than silently publishing new advice.

**Build today:** three curated official notices, two accessible output layouts, one source-change fixture. This combines the earlier Notice to Action and AccessCheck ideas with a concrete change-impact demonstration.

**Building blocks:** official [housing comment notice](https://www.boston.gov/news/request-public-comment-py25-consolidated-annual-performance-and-evaluation-report), traffic advisories and a small HTML template. A public-source text extractor is enough; arbitrary PDF remediation and autonomous translation are separate projects.

**AI and proof:** extract fields and simplify wording with evidence links. Measure field accuracy, keyboard task completion and missing-date handling. Proposed pilot owner: a communications editor or community group. A reviewed second language can add value; a language button alone proves little. **V1 + V2.**

## A15. Evidence Time Machine — make misleading civic conclusions visibly fail

**User and moment:** a civic analyst combines attractive datasets and accidentally tells a story the dates and fields cannot support.

**Experience:** drag 311, transit, crash and demographic cards onto a question. The app shows compatible periods and keys, then demonstrates how changing the snapshot changes what can be claimed. “Which neighborhood waits longest?” fails honestly when closure dates are missing; the interface suggests a supportable alternative.

**Build today:** four audited starter datasets, five question templates and a downloadable evidence receipt. Show an unsupported claim becoming a useful, narrower analysis.

**Building blocks:** the [existing starter audit](sources/civic_dataset_audit.json), [new endpoint audit](sources/public_resource_audit.json), and a small deterministic compatibility checker. Reuse OpenContext patterns if useful; no external database is necessary.

**AI and proof:** translate a question into required evidence and explain why a calculation is or is not supportable. Test missing columns, duplicate IDs, mixed vintages and geographic mismatches. Proposed pilot owner: municipal data team or university civic lab. Differentiation is interactive analytical restraint with a useful next action, not a generic provenance badge. **V1–V5 infrastructure.**

## How the earlier ideas evolve

| Earlier idea | More distinctive direction | What stays useful |
|---|---|---|
| CivicBridge / MoveReady | CityHandshake, PermitDiff, MoveOut Relay | One task and an official handoff |
| Neighborhood Lens / BlockBrief | RepairLedger, StreetTradeoffs, Evidence Time Machine | Transparent calculations and source limits |
| AccessCheck / Notice to Action | NoticeStudio, OpenDoor | Human-reviewed extraction and usable output |
| StepFree Alert | Last 100 Feet, DockFallback | Official disruption evidence and explicit unknowns |
| ReadyTogether | HeatHours, Storm Rehearsal | Public preparation sources and offline output |
| Opportunity Map | ShiftFits, Lab2Block, OpenDoor | Real institutions, constraints and next steps |

## Build for the rubric, not an imagined secret preference

**Potential Value:** name the person, obstacle, current alternative and completed output. Test one assumption with an actual person if possible. Public complaints suggest questions to test; they are not prevalence estimates.

**Implementation:** meaningful Kiro work should be visible in specs, decisions, implementation and checks. A strong candidate: a Kiro-generated first draft wrongly treats missing information as success; the team identifies the flaw, tightens the specification, and shows the corrected behavior. Only describe that sequence if it really happens. Credit reused code and this Codex research separately.

**Quality and Design:** one polished interaction, keyboard access, readable sources, and an understandable failure state. A clear schematic can beat a geographically impressive but misleading map.

Before committing, spend 20 minutes proving the hardest dependency: one connected corridor for A1; three real schedules for A2; one source conflict and final action for A4. If it fails, reduce the scope immediately. Full networks, calibrated forecasting, interagency integrations, and field-validated impact belong to a later pilot.

Keep the video **under three minutes**, the public GitHub repository and root `/.kiro`, the written Kiro account, and the working demo. A short actual Kiro segment is recommended; it is not a separately stated video requirement. No idea here changes the **8 PM Eastern** submission deadline or maximum team size of four. See [the rules](01_rules_judging_and_event_playbook.md).
