# What we should build: creative choices and fallback scopes

Prepared October 24, 2026. This is a recommendation, **not a team decision or implementation claim**. It synthesizes [the rules](01_rules_judging_and_event_playbook.md), [winner patterns](03_past_winners_and_patterns.md), [recent City evidence](06_deep_evidence_transcripts_and_city_priorities.md), and [dataset verification](07_civic_dataset_verification.md).

## Updated recommendation after the deeper research

**For originality, start with Last 100 Feet, ShiftFits, or OpenDoor.** The [15-idea atlas](09_creative_civic_opportunity_atlas.md) supersedes this document's earlier default recommendation of BlockBrief. It adds real public-data/code connections and checks proposed novelty against existing products.

| Choose | Demonstrate | First dependency to prove |
|---|---|---|
| **Last 100 Feet** | One broken journey segment removes access; a verified repair scenario reconnects destinations | One small, manually verified corridor graph |
| **ShiftFits** | A training option fails a person's schedule; one changed condition makes it feasible | Three real program schedules and a bounded travel assumption |
| **OpenDoor** | Conflicting resource instructions become a reviewed, source-linked preparation card | One actual source conflict; UMass Boston pantry pages provide a candidate |
| **CityHandshake** | A resident keeps one factual receipt through an uncertain agency handoff | Responsibility sources for three curated examples |
| **RodentOps — rodent-control tool** | Recurring reports become an evidence-linked inspection and follow-up brief | Three manually reviewed evidence groups and a demonstrably useful inspection packet; see [document 12](12_rodent_control_creative_playbook.md) |

The [data/repository catalog](10_public_data_and_repositories.md) supplies concrete inputs; the [public-voices brief](11_public_voices_and_competitive_gaps.md) explains the reported problems and existing alternatives. These are research recommendations, not a team decision. Choose one concept and prove its hardest dependency in the first 20 minutes.

**BlockBrief remains the conservative fallback** for the strongest connection to already committed data. Notice to Action and MoveReady remain bounded alternatives below. Each can also become a component of a more distinctive concept.

The shared strategy is one person completing one useful task, with evidence they can inspect. The official categories are Potential Value, Implementation, and Quality and Design; no numerical weights were found. Meaningful Kiro use and a clear working demonstration matter across the shortlist.

**Rodent-control update:** RodentOps is our preferred operational tool within this topic; RATLAB is its data-analysis alternative. The user explicitly wants a tool, superseding the earlier game/simulation framing. Its workflow advantage still needs validation with an intended user. The larger Boston 2026 source contains real Rodent Activity records, while Cambridge publishes separate trap/sighting datasets. This removes the starter extract's main limitation for descriptive rodent research. It does not establish rat counts, individual movement or intervention effects. Document 12 includes eight concepts, exact data probes and selected captions from the October 23 hearing. This remains a proposal for the team to select.

## 1. BlockBrief — fallback with the strongest immediate data connection

**User:** a neighborhood association volunteer preparing to discuss a service concern with a relevant City team.

**MVP flow:** select neighborhood and one waste-service category → inspect real snapshot counts/statuses → add a separately labeled personal observation → generate and review a one-page brief → print/export it with sources and questions for follow-up.

**Creative feature:** three visually distinct sections: “What the records show,” “What residents report,” and “What we still need to ask.” Every generated statistic points to a deterministic calculation. The app flags claims that exceed the data, such as calling a neighborhood the city's worst-served or treating a closed ticket as a resolved problem.

**Data already available:** `data/civic/datasets/boston-311/data.csv`, 5,000 records from October 8–18. Direct inspection in this pass found 619 rows where `service_name + case_topic` contains “trash”: 264 Trash Placed Out Early, 194 Improper Trash Storage, 160 Overflowing Trash, and one Park Overflowing Trash Can. Another 236 are Missed Waste Pick-up. These are extract counts, not citywide totals or unique unresolved problems. No rows matched the literal keyword “rodent”; that string search does not establish the absence of all pest-related issues.

**Why now:** the City scheduled an October 23 [hearing on its Rodent Action Plan](https://www.boston.gov/public-notices/16632881). That supports relevance of neighborhood sanitation concerns; the waste data cannot establish rodent incidence or disease risk.

**AI role:** turn a user's question into supported filters; explain calculated aggregates; draft a clear, source-linked brief. Code handles filtering, counting, dates and source IDs.

**Demo moment:** a user makes an overbroad claim. The app preserves their concern, shows exactly what the extract supports, and produces a useful request for investigation. A person reviews before export; no government message is sent automatically.

**Proof to collect:** manually verify the displayed counts; show a missing-data case; ask three people to complete the flow; record actual completion time and confusion. Success is a clear, accurate brief—not a claim that City response times improved.

**Cut:** maps requiring missing coordinates, live case tracking, automated escalation, municipal-performance rankings, and predictions of infestations.

## 2. Notice to Action — strongest visual/accessibility alternative

**User:** a community organization preparing a readable explanation of one public notice for residents.

**MVP flow:** choose one of three curated official notices → extract who/what/when/next step → show each item beside its source passage → reviewer resolves ambiguities → export an accessible HTML action card or print view.

**Creative feature:** an “unclear in the source” state. A missing deadline or inconsistent date becomes a visible question rather than a confident invented answer. Add a calendar file only after the user reviews the date, time and timezone.

**Sources:** the [October 23 housing-comment notice](https://www.boston.gov/news/request-public-comment-py25-consolidated-annual-performance-and-evaluation-report) and [traffic advisory](https://www.boston.gov/news/traffic-advisory-october-23-2026) offer concrete material. A publication date must not be mistaken for an event date. Do not infer detailed housing-program outcomes without reviewing the underlying report.

**AI role:** extract and simplify information. A constrained output schema, quoted evidence spans, date checks and reviewer approval make that work inspectable.

**Demo moment:** dense notice → readable action card → click a statement to reveal its source → handle an ambiguity → finish using only the keyboard.

**Proof to collect:** supported-field accuracy against human-reviewed examples, task completion, keyboard flow and reading comprehension. A second language is optional and needs a fluent reviewer.

**Cut:** arbitrary web crawling, all-purpose PDF remediation, automatic public publishing, and claims of complete accessibility compliance.

## 3. MoveReady — strongest straightforward resident journey

**User:** a Boston student preparing a moving-truck parking application.

**MVP flow:** enter a supported scenario → identify missing information → build a cited preparation checklist → review the packet → open the official application.

**Creative feature:** explain which input changed the checklist and why. Unsupported jurisdiction or uncertain applicability produces a useful official handoff.

**Data:** a small, verified set of current official service pages linked in document 02. The supplied building-permit CSV is not a parking-permit database. Requirements and dates must be checked before they become executable rules.

**AI role:** interpret the user's situation and explain the checklist. Keep date calculations and verified conditions in code.

**Demo moment:** change one relevant scenario input and show the changed, source-backed next step.

**Proof to collect:** compare completing the chosen preparation task with the existing official flow; test applicable and unsupported scenarios.

**Main tradeoff:** Boston already has permitting navigation and Curb Lab work. The proposed advantage must be a validated preparation gap. No live parking availability, payments, government login or automated filing is needed.

## How to make any option competitive

Boston's [own Innovation Expo](https://www.boston.gov/news/winners-innovation-expo-2026) recognized 311 knowledge, disability-access mapping, procurement assistance and collection optimization. Our interpretation is that specific public-service improvements can be compelling. These are not Hackachusetts results, and they do not reveal private judge preferences.

For **Potential Value**, show the named user, the obstacle, and a useful completed output. For **Implementation**, preserve a real Kiro spec, steering decision, useful automated check and observed result. For **Quality and Design**, polish the main journey, make evidence easy to inspect, and handle one realistic failure gracefully.

Use a lightweight app with a committed snapshot and a small curated source set. Three screens are enough: input, evidence review, final output. Add no infrastructure whose absence would not weaken the demonstration.

## Build and submission budget

These are suggested work allocations, not guaranteed completion estimates: 30 minutes to settle the user and acceptance criteria; two hours for a working end-to-end slice; 90 minutes for evidence handling and AI; one hour for usability/testing; one hour for recording and submission. Parallel work is a team choice, not an assumption that four developers are available.

Use Kiro for the actual build and attribute this Codex research separately. Retain a public repository with root `/.kiro`, a working demo, English description, written Kiro account, all team members (maximum four), and a public video **under three minutes**. Submit on SundAI by **8 PM Eastern** and begin the submission process around 6 PM. The [rules playbook](01_rules_judging_and_event_playbook.md) links the governing source and records unresolved details.

Suggested 2:50 video: 20 seconds problem; 90 seconds completed workflow; 25 seconds actual Kiro evidence; 20 seconds measured checks and boundaries; 15 seconds intended next pilot. Kiro screen footage is a recommendation, not a separately stated requirement.

The final concept remains for the team to choose. For the current request's emphasis on creativity, prefer **Last 100 Feet, ShiftFits, or OpenDoor**, contingent on their data checks. Use **BlockBrief** if the available time or unresolved dependencies require a smaller build.
