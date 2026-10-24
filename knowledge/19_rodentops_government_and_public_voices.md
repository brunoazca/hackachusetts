# RodentOps: government priorities, resident complaints and existing work

Research cutoff: **October 24, 2026**. This extends the [rodent playbook](16_rodent_control_creative_playbook.md) and pairs with the [data and research catalog](24_rodentops_data_and_research_catalog.md). RodentOps is an inspection and coordination **tool**, not a game. None of these sources establishes City endorsement, an internal software gap, or private judging preferences.

## 1. The strongest product direction

Help a coordinator answer: **“What do we actually know about this recurring problem, what needs checking on site, who should review the next step, and when will we check again?”**

That is a better-supported proposition than another sighting map or an AI infestation forecast. Boston already has a rodent plan, analytics staff, sensors, pilots and interdepartmental work. Our proposed improvement is a concise, reviewable case brief assembled from scattered public records. Whether this saves staff time or fits their existing systems still needs practitioner testing.

The most interesting opportunity is **managing uncertainty and handoffs**: a ticket may be closed after an inspection; a later resident report may concern the same place; the relevant condition could involve a building, a public alley, waste collection or infrastructure. The tool can put that evidence together without deciding that a resident, business, landlord or agency caused the problem.

## 2. What the government actually says

### Current administration: dated statements, not inferred political preferences

The City's [2026 summit announcement](https://www.boston.gov/news/city-boston-host-second-ever-national-urban-rat-summit), updated August 21, emphasizes new technology, coordination through data, area-specific strategies and residents' quality of life. It describes participation by **more than 20 departments, agencies and external partners**. That is a broader category than the original plan's department count; do not treat the two as contradictory headcounts.

| Stakeholder | Publicly stated emphasis in that announcement | Our design inference |
|---|---|---|
| Mayor Michelle Wu | Technology, coordinated services, locally appropriate responses | Show a concrete decision supported by traceable records |
| Operations / Dion Irish | Coordination, data collection, community engagement | Make an unresolved handoff visible |
| ISD / Tania Del Rio and John Ulrich | Evidence, learning and practical collaboration | Let staff challenge an AI summary and inspect its sources |
| BHA / Kenzie Bok | Resident quality of life | Preserve the reported problem and follow-up need |
| BWSC / Chase Berkeley | Infrastructure and sewer monitoring | Support referrals without inventing sewer-condition data |
| Parks / Diana Fernandez | Landscape maintenance and prevention | Include relevant public-space context |

These are proposed product responses to public statements, not commitments to use our tool.

The current [BRAP page](https://www.boston.gov/departments/inspectional-services/boston-rodent-action-plan-brap) describes proactive prevention across parks, alleys, construction and sewers. Its stated 24–48-hour response expectation should be treated as a service statement, **not proof that every case met it or that a visit eliminated the condition**. In the interface, response time, documented action, resident follow-up and verified condition are separate fields.

### The most useful recent technical statement: the City's own analytics team

Selected automatic captions from [Rat Summit Day 1, 1:13:40–1:17:30](https://www.youtube.com/watch?v=bCHkCVaHFp0&t=4420s) describe two aims: evaluating interventions and supporting proactive operations. The speaker reports incomplete sensor coverage, maintenance burdens and vendor/hardware issues, then discusses a smaller deployment and camera approaches. This is unusually useful evidence: **measurement reliability is part of the operational problem**.

Other reviewed windows discuss a dedicated BHA team and training ([1:31:40](https://www.youtube.com/watch?v=bCHkCVaHFp0&t=5500s)), collection operations ([6:53:50](https://www.youtube.com/watch?v=bCHkCVaHFp0&t=24830s)), and community input, space constraints and collection-provider feasibility ([7:03:00](https://www.youtube.com/watch?v=bCHkCVaHFp0&t=25380s)). These are speaker accounts, not independently audited results. Automatic captions were read; audio was not independently transcribed. Do not repeat numerical budget or survey claims from these passages without checking the underlying documents.

**Product implication:** a future sensor panel should show coverage and downtime before showing a trend. A bin recommendation needs feasibility checks; a dot on a map is insufficient.

### What the community-slide dates actually establish

The City's [community-feedback page](https://www.boston.gov/government/cabinets/operations-cabinet/community-feedback-guiding-potential-trash-changes) links two presentation folders. The PDF filenames and Drive metadata establish **August 12 and October 16, 2025**, not 2026. Treat their implementation dates as historical plans.

- [August 12, 2025 slides](https://drive.google.com/file/d/1UzeuyJU5FqTb7zeDKBTncNUpeVPS9lSj/view): describe received sensors, a planned four-week clean baseline, interdepartmental work and preparation of a resident dashboard. This disproves any broad claim that Boston had no evaluation or public-reporting work underway.
- [October 16, 2025 slides](https://drive.google.com/file/d/1RD5FHqW1U9sIvgBkG38slLcJv-rPsRtU/view): describe Harvard Kennedy School work on trash-contract recommendations and evaluation by cost, feasibility and operational impact. A camera/containerization plan names a comparison site. The slides also summarize requests for affordable bins, collection timing changes, accountability, multilingual information and accessible reporting. These are the City's qualitative synthesis of participants' feedback; no representative citywide sample is established.

Current completion must be checked against newer records. A 2025 proposed Q1 2026 rollout cannot be presented as a completed deployment merely because that date has passed.

### Oversight and disagreement are useful evidence too

The [October 23, 2026 Council hearing notice](https://www.boston.gov/public-notices/16632881), [official recording](https://www.youtube.com/watch?v=Fn4cGj8xxBs), and [contemporaneous Universal Hub report](https://www.universalhub.com/2026/allston-rat-city-more-boston-rat-city-rat-amusement-parks-rat-buffets) document continuing scrutiny of rodent control. The reporting includes frustration about exposed waste, dense neighborhoods and responsibility, alongside examples of improvement. See [document 16](16_rodent_control_creative_playbook.md) for the previously reviewed caption windows and their limitations.

Council criticism and administration descriptions should remain separately attributed. A demand for more accountability is not proof of an agency's failure in a particular case. Similarly, public claims of progress are not a causal evaluation. Counts mentioned at a hearing may cover different dates and categories from the exact `Rodent Activity` query used in our data audit.

Third-party transcript sites are discovery aids. [OpenTowns](https://opentowns.org/towns/boston-ma/bc170e7a-6c2c-42f9-98e8-0ccd7884e42c/transcript/) and [OpenPublica](https://www.openpublica.com/meetings/boston-massachusetts-city-council-2026-10-23-6adbf461328dc7b98fa7fa0f) contain machine-generated material; apparent name errors make verbatim reliance inappropriate. An unverified future-report date or attributed quote from them must not become a product claim.

### Budget and vendor context

- The [FY27 Operations hearing presentation](https://www.boston.gov/sites/default/files/file/2026/05/Operations%20FY27%20City%20Council%20Hearing.pdf) documents existing pilots and monitoring. Use it to understand the program, not to claim our app created that capability.
- The [participatory-budgeting project page](https://www.boston.gov/departments/participatory-budgeting/rat-prevention-initiatives-dense-residential-areas) describes a funded containerization initiative and identifies implementation partners. It is a potential setting for future measurement, not an open API or an invitation to integrate with vendor systems.
- Extra Sense, metroSTOR, Microshare and waste-service providers appear in the linked program material. They are **program/vendor context**, not established Hackachusetts sponsors, judges or partners of our team. Product claims by a vendor need independent outcome evidence.
- Kiro/AWS, SundAI and Mass AI Coalition have event roles described in [document 12](12_civic_strategy_stakeholders_and_ideas.md). Their documented competition requirements remain in [document 01](01_rules_judging_and_event_playbook.md). Municipal preferences do not override those rules.

## 3. Public complaints: what people are trying to accomplish

Public testimony and social posts are **qualitative discovery evidence**. They are not a representative survey, verified site inspection or a training label for whether an address has rats. Do not publish a resident's identity, contact details or an accusation against a named business in the demo.

| Observed concern | Source and verification level | Useful product response |
|---|---|---|
| Trash timing, overflowing containers and food left outside | [2025 community recording, 19:40–21:40](https://www.youtube.com/watch?v=JWZ90tmPptY&t=1180s); selected automatic captions | Record reported condition and time separately; show the actual collection schedule beside it |
| Private pest-control expense and suspected construction effects; City visits also described positively | [Same meeting, 25:50–28:20](https://www.youtube.com/watch?v=JWZ90tmPptY&t=1550s); testimony, not causal proof | Show nearby permit dates as context and a question for an inspector; retain positive response history |
| Bin cost, storage, collection timing, multilingual communication and stronger oversight | October 2025 slides linked above; City summary of engagement | An operational checklist should ask whether the proposed remedy is practical for that building and household |
| More than one contact can be necessary; residents want lasting attention to conditions | [Boston Reddit thread](https://www.reddit.com/r/boston/comments/1woezas/report_rats_to_311/); original thread read | Connect potentially related reports, but preserve each source and require review before merging |
| Removing a trash receptacle can be perceived as shifting the problem; responsibility may be unclear | Same thread; unverified personal accounts | Track what action was recorded and what remains to inspect, rather than displaying a generic “resolved” badge |
| Reporting can help: a commenter describes replacement of deteriorated dumpsters | Same thread; positive self-report | Preserve successful examples and conditions for success; do not build an all-failure narrative |
| Tenant says repeat pest visits did not address entry points | [October 5 Boston thread](https://www.reddit.com/r/boston/comments/1wxve3e/rats_when_is_enough_enough/); search-index excerpt only, original page not retrieved | Candidate interview question about repair versus treatment; insufficient evidence for an allegation about the property |
| Neighbors describe a shared waste problem crossing property boundaries | [October 8 Somerville thread](https://www.reddit.com/r/Somerville/comments/1x117sd/what_are_you_doing_to_tackle_the_rats/); search excerpt, **another municipality** | Motivation for a shared-space task; not evidence of Boston prevalence or policy |

The Reddit thread's precise publication date was not reliably established in this pass. Account names suggesting a government affiliation were not authenticated. Relative “days ago” labels and search snippets should not be promoted to exact dates or official statements.

### A complaint classification that preserves the person's need

For each source-backed record, distinguish:

1. **Reported observation:** live sighting, droppings, possible burrow, damaged container, loose waste, indoor entry. Preserve uncertainty and distinguish mice, rats and unspecified pests.
2. **Reported consequence:** repeated disruption, inability to use a space, expense, accessibility barrier, worry. These are reported experiences, not measured medical or financial outcomes.
3. **Requested remedy:** inspection, container repair, exclusion repair, collection clarification, cleanup or explanation.
4. **Process barrier:** no clear responsible role, no access, uncertain location, conflicting instructions, repeated reporting or unavailable follow-up.
5. **Agency record:** inspection described, no activity observed during visit, referral, citation, monitoring or other documented action.
6. **Next missing observation:** what an authorized person would need to check before deciding the next step.

An LLM can draft these labels with supporting text and record IDs. It must be allowed to answer **unknown**. Do not infer sarcasm, anger or repetition as proof of greater infestation. This design is also consistent with the Vancouver complaint study discussed in document 24.

## 4. Existing tools and overlap to acknowledge

| Existing capability | Evidence | Consequence for our scope |
|---|---|---|
| Boston rodent sighting map | [rats.boston](https://rats.boston), linked by its creator in a [2024 public post](https://www.reddit.com/r/boston/comments/1ecl605) | Prior public map is established by the post; current site requests timed out. Availability and production quality were not established |
| City analytics, sensor pilots and intervention mapping | Official summit captions and BRAP materials above | Do not claim Boston lacks analytics, coordination or an intervention map |
| Proposed resident-facing dashboard | August 2025 City slides | A dashboard concept alone is insufficient differentiation; current release status not established |
| Rapid reporting app presentation | [2026 summit agenda](https://www.boston.gov/government/cabinets/operations-cabinet/2026-national-urban-rat-summit), Ally Littlefield's “Whack-a-rat” session | The agenda establishes a presentation, not verified functionality, adoption, access or source code |
| NYC inspection map and district reporting | [Official mitigation-zone report](https://a816-dohbesp.nyc.gov/IndicatorPublic/data-features/rat-report/) | Borrow distinctions between complaint-driven and proactive inspections; don't transfer NYC results to Boston |
| Cambridge smart-device data | [Smart Rat Boxes](https://data.cambridgema.gov/Inspectional-Services/Smart-Rat-Boxes/78bs-b5ig) | Useful separate-city sandbox; does not fill missing Boston sensor measurements |

Our defensible differentiation hypothesis: **a transparent brief that connects records, preserves disagreements, identifies missing evidence and gives a human a practical follow-up workflow**. Validate it with an inspector before asserting novelty or adoption.

## 5. Creative enhancements supported by this evidence

These are proposals, not existing implemented features.

| Enhancement | What the user does | What makes it useful | Scope |
|---|---|---|---|
| **What remains unknown?** | Opens a recurring case and sees three unanswered inspection questions | AI turns incomplete records into an explicit verification plan instead of pretending to know the cause | Build today |
| **Closed ticket, open question** | Compares the closure note with a later report | Makes the difference between an administrative action and a verified condition visible | Build today |
| **Shared-alley brief** | Reviews related records across a small shared space | Encourages coordination without turning proximity into a causal claim | Build one reviewed example |
| **One condition, one proposed owner** | Assigns a proposed reviewing role to each task, then confirms it | A waste question and a building-repair question need different follow-up; ownership remains unverified until confirmed | Build manual role selection |
| **Bin feasibility card** | Checks space, access, lid condition, service compatibility and collection timing | A recommendation must fit the physical and operational setting | Demonstrate checklist; no automated siting |
| **Sensor coverage receipt** | Sees monitored days, outages, location changes and observation method | Prevents an offline device from looking like successful control | Later; Boston telemetry not established as public |
| **Intervention passport** | Records actual start date, maintenance, comparator, observation method and planned follow-up | Makes later evaluation possible without inventing effects from a closed ticket | Design now; real evaluation later |
| **Resident update draft** | Reviews a plain-language explanation of what was checked and what remains | Addresses uncertainty without promising eradication | Draft only; no automatic messages |

For the hackathon, keep the three-screen flow: **review queue → evidence timeline → approved follow-up brief**. Pick three real, manually checked examples. Add a source date, uncertainty label and editable next-step question to each. The feature to emphasize is the transition from scattered evidence to a reviewable action.

## 6. What this means for the pitch and judging

The documented judging dimensions are Potential Value, Implementation and Quality/Design; weights and individual preferences are not established. Our inference:

- **Value:** demonstrate a recognizable coordination task and explain what an inspector still must decide.
- **Implementation:** show working data retrieval or a dated snapshot, deterministic IDs/counts, source-grounded extraction and actual Kiro build evidence.
- **Quality/design:** make source status, human edits and unresolved questions obvious. A polished misleading risk score is weaker than a small trustworthy workflow.

Suggested pitch: **“RodentOps turns recurring public rodent reports and nearby municipal records into a brief an inspector can review, correct and use to plan follow-up.”**

Do not promise fewer rats, financial savings, validated treatment recommendations or an agency partnership. Measure briefing accuracy and task time first. A later operational pilot can measure field-confirmed conditions and resident follow-up with an appropriate design.

## 7. Coverage and what remains unverified

- Read official pages, both community slide PDFs, selected official-video captions, original public discussion and clearly labeled search excerpts. The [media audit](sources/artifacts/rodentops_media_audit.json) records metadata, caption hashes and exact reviewed windows.
- Summit Day 1 is 8:49:01; Day 2 is 9:43:21. **Neither was reviewed end to end.** Day 2 exposed no usable captions in the probe; the agenda establishes topics, not the content of each presentation. Upload date was October 2, 2026; event dates were September 23–24.
- The community video was uploaded October 20, 2025 and lasts 57:15. Only the windows identified above were inspected in this pass. Slide text and video testimony are different evidence types.
- Searches for relevant TikTok and X material did not yield an original post/video that could be verified here. No sentiment or trend is inferred from that access gap. The Mayor's social directory is a navigation lead, not evidence for a particular statement.
- No representative resident survey, current internal workflow interview, raw Boston sensor API, vendor service agreement or complete intervention log was obtained. No City staff, residents or vendors were contacted.
- This is a broad research pass, not a claim to have found every public record or all social discussion. The prioritized data gaps and practical next steps are in document 24.
