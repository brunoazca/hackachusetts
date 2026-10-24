# Hackachusetts 2026 — Rules, judging, and event playbook

Research checked: **October 24, 2026**, America/New_York. All event times below are Eastern. Intended track: **Civic Action**, also called **Civic Services** in the prize table. “Civil” is the team's shorthand, not the published track name.

This is a research and preparation brief, not an organizer-issued rulebook. The linked official rules and subsequent organizer clarifications govern. No product implementation or submission has been performed as part of this research.

## Read these three files in this order

1. This file: eligibility, required artifacts, judging, deadlines, contradictions, and submission checklist.
2. [Civic strategy and stakeholders](12_civic_strategy_stakeholders_and_ideas.md): actual challenge directions, sponsor incentives, candidate ideas, data, and differentiation.
3. [Past winners and patterns](03_past_winners_and_patterns.md): verified comparable winners, evidence quality, and lessons that transfer.

## 1. The decisions that matter immediately

- **Use Kiro to build the project.** The detailed rules require it and permit disqualification for insufficient use. A last-minute empty `.kiro` directory is not evidence of meaningful usage.
- **Maximum four members; register every member and appoint a representative.** Solo entries are allowed by the event FAQ.
- **Choose one track.** For this team, use the Civic Action/Civic Services option in the live submission form.
- **Submit on SundAI by 8:00 PM Saturday, October 24.** Start the submission process around 6:00 PM; do not confuse the Notion idea form with the final submission.
- **Deliver a public GitHub repository with root `/.kiro`, a working project, an English description, a public demo video under three minutes, and a specific Kiro usage write-up.**
- **The judges may rely entirely on the submitted description, images, and video.** A good live app cannot rescue a submission that fails to explain what works.
- **No numerical rubric weights were found.** Do not assume equal weighting, invent percentages, or treat sponsor interest as an extra official category.

Sources: [official rules][R1], [event page and FAQ][R2], [setup guide][R3], [kickoff slides][R5].

## 2. Event identity and participation

| Item | Confirmed information | Practical consequence |
|---|---|---|
| Event | Hackachusetts powered by Kiro; theme concerns Massachusetts' defining industries | Connect the problem to a Massachusetts user, institution, place, or dataset |
| Date | Saturday, October 24, 2026; finalist activities Sunday, October 25 | Leave Sunday available if selected |
| Registration | Massachusetts students; `.edu` email; student ID checked | An email address alone is not the complete stated eligibility condition |
| Venue choice | Nine hubs; participants can attend a school other than their own | Register for the location actually attended |
| Attendance | FAQ permits leaving after showing up to collect credits and begin hacking | Do the in-person check-in; remote-only entry is not established |
| Equipment | Student ID, laptop, charger | Resolve Wi-Fi and power early |
| Kiro credits | Unique physical code for 2,000 free credits collected in person | Do not assume registration automatically deposits credits |
| Meals | Breakfast, lunch, dinner | Site-specific logistics still apply |
| Team | Up to four; one authorized representative | Check the SundAI card contains everyone |

Sources: [event page][R2], [setup][R3], [rules][R1]. The full entry eligibility definitions referenced by the rules are not comprehensively reproduced in the fetched document. Age/residency and other edge cases should be checked with organizers. The **18+ requirement in the prize table concerns the AWS interview benefit**; do not silently turn it into a universal event age rule.

### Locations

These are copied as factual logistics from the event materials, not independently verified campus directions. Confirm room access at check-in.

| Hub | Published address/location |
|---|---|
| MIT + The Engine | 750 Main Street, Cambridge, MA 02139 |
| Harvard | 125 Western Avenue, Allston, MA 02134 |
| Boston College | 245 Beacon Street, Hayden Hall |
| Boston University | CDS1301, Faculty of Computing & Data Sciences, 665 Commonwealth Avenue, Boston, MA 02215 |
| Northeastern | Snell Engineering Center, Room 108, 110 Forsyth Street, Boston, MA 02115 |
| UMass Amherst | Campus Center Marriott Center, 1 Campus Center Way; **floor conflicts: coalition says 11th, SundAI says 1st** |
| UMass Lowell | Meehan Student Center, Room 490, 220 Pawtucket Street, Lowell, MA 01854 |
| UMass Boston | AI Computer Lab / MAC-A-Lab, Healey Library UL, 100 Morrissey Boulevard, Boston, MA 02125 |
| Babson + The Generator | Weissman Foundry, 9 Map Hill Drive, Wellesley, MA 02482 |

Sources: [coalition venue list][R2], [SundAI listing][R4].

## 3. Schedule and a realistic work budget

The coalition's detailed day-of schedule is more specific than the short SundAI event description. Prefer it for planning while following live organizer announcements. This is a practical precedence rule, not a published legal hierarchy. [R2][R4][R5]

| Saturday time | Activity |
|---|---|
| 8:00–9:00 AM | Registration, QR check-in, breakfast, student ID, physical Kiro code, setup |
| 9:00–9:30 AM | Welcome and sponsor introductions |
| 9:30–9:40 AM | AI news |
| 9:40–10:00 AM | Challenges, rules, judging, team size |
| 10:00–10:30 AM | Kiro walkthrough |
| 10:30–10:40 AM | Official kickoff with Secretary Eric Paley |
| 10:40–11:30 AM | Brainstorming and team formation |
| **11:30 AM** | **Hacking officially begins** |
| Noon–1:00 PM | Lunch |
| 1:00–5:00 PM | Build and test |
| 5:00 PM | Dinner |
| **6:00–8:00 PM** | **Project submission window** |
| 6:00–6:30 PM | Virtual judges' training |
| 6:30–8:00 PM | Local submission support |
| 7:30 PM | Final 30-minute reminder |
| **8:00 PM** | **Deadline and end of hacking** |
| 8:00–11:00 PM | Judging |
| Midnight | Coalition schedule says finalist notification emails |

**Planning implication:** 11:30 AM–8:00 PM is 8.5 hours, including food, testing, recording, uploading, and submission. Treat the focused implementation budget as roughly 5–6 hours. That is our planning estimate, not an event rule.

The linked slides' extracted text includes updated Sunday notes: **11:00–11:30 brunch, 11:30–11:45 remarks, 11:45–1:15 finalist pitches, 1:15–1:30 deliberation, 1:30–2:00 awards, at WHOOP headquarters**. These are deck notes rather than a separately verified finalist invitation. Confirm the exact address, attendance requirements, pitch length, and schedule in the invitation. The SundAI page has a less detailed Sunday outline. [R5][R4]

### Recommended internal schedule

| Deadline | Team outcome |
|---|---|
| Before building | One user, one problem, one completion outcome, accessible data, agreed scope |
| 12:00 PM | Kiro spec approved; repository connected; first change visible on GitHub |
| 1:00 PM | Input → processing → useful output works with a real example |
| 3:00 PM | Core experience integrated; saved-data fallback works |
| 4:30 PM | Test evidence captured; Kiro usage notes drafted; scope frozen |
| 5:30 PM | Release candidate; README and testing instructions complete |
| 6:00 PM | SundAI draft created; video recording/upload underway |
| 7:00 PM | Submission complete enough to accept; all links checked from a fresh browser |
| 7:30 PM | Verify received submission, team, track, video, repo, and demo; retain confirmation |
| 8:00 PM | Stop changes and preserve the submitted version |

These are suggested team checkpoints. Adapt them to the actual remaining time.

## 4. Mandatory submission artifacts

The following requirements come from the [official rules][R1], corroborated at a higher level by the [slides][R5].

| Artifact | Requirement | Reviewable evidence |
|---|---|---|
| Team | All members, maximum four, authorized representative | Names and membership visible on submission |
| Track | Identify one challenge track | Civic Action/Civic Services selected |
| Description | Explain functionality and features | Concrete user journey and what is actually implemented |
| Demo video | Under three minutes; show functioning project on its intended device | 2:40–2:55 target, readable screen recording, clear narration |
| Video hosting | Publicly visible on YouTube, Vimeo, Facebook Video, or Youku; link in submission | Play without account or permission request; Public is safest because “unlisted” acceptability is unstated |
| Repository | Public GitHub URL; all source, assets, and functional instructions | Fresh clone can be run from README |
| Kiro evidence | Root `/.kiro` committed; do not ignore it or its subfolders | Actual specs, steering, hooks/configuration produced and used during development |
| Kiro explanation | Write-up explaining how effectively Kiro was used | Decisions, concrete examples, artifacts, and verified benefits |
| Working access | Website, functioning demo, or test build | Free, unrestricted judge access through the judging period |
| Private demo | Include test credentials in testing instructions | Dedicated demo account, not personal or production credentials |
| Language | English materials, or English translations of all submitted materials | English video narration/subtitles, description, and run instructions |
| Rights | Original work, ownership, permissions and license compliance | Attribution and license notices; no unauthorized media |

**Public source is explicitly required; an OSI license for the entire project is not explicitly mandated in the Hackachusetts document we read.** The older Code with Kiro event had different licensing and team-size rules. Do not import those into this competition.

The rules list multiple Kiro tools and features as examples, not as a requirement to use every feature. Thoughtful use of a smaller number is easier to substantiate than a list of nominal integrations.

## 5. Kiro usage that the judges can inspect

The rules explicitly ask about specs, agent hooks, steering, MCP, property-based testing, powers, and any differences among tools used. The Implementation criterion rewards the strategy, depth, and benefit of those choices. [R1]

### A manageable plan for this team

| Capability | Suggested meaningful use | Evidence to preserve |
|---|---|---|
| Specs | Define a complete civic task, acceptance criteria, design, and implementation tasks | Requirements/design/tasks plus a requirement-to-demo mapping |
| Steering | Define source citation rules, civic tone, accessibility, jurisdiction boundaries, and data handling | Steering file and an example where it changed the output |
| Hooks | Automate one useful check after relevant changes, such as data-schema validation or regression tests | Actual hook configuration and successful execution evidence |
| MCP | Connect Kiro to a useful approved resource if it removes real work | Tool call outcome and what it enabled; omit if unnecessary |
| Property-based tests | Test invariants, e.g. no unknown source IDs, bounded scoring, or ordering stability | Property definition and any discovered counterexample |
| Powers | Use relevant bundled expertise if available and useful | Name/version where available, decision it informed, resulting change |

Capability descriptions: [Kiro specs][K1], [steering][K2], [hooks][K3], [MCP][K4], [documentation index][K5]. These are proposed uses, not claims that this repository already contains them.

**Distinguish development tools from product features.** Kiro using MCP during development is one thing; the finished civic app calling a runtime MCP service is another. Document both accurately if both exist. Neither is established as mandatory.

### Kiro write-up template

```markdown
## How we used Kiro
Tools and versions actually used:
Why we selected these capabilities:

### Specification to implementation
User requirement:
Spec artifact:
Implemented behavior:
Validation result:

### Steering
Constraint encoded:
Where the steering lives:
Concrete improvement observed:

### Hooks / MCP / testing / powers, where applicable
Workflow or problem:
Capability used:
Evidence:
What failed or changed:
Benefit, with measurement method if quantified:

### Human decisions and limitations
What we reviewed or corrected:
What remains unfinished:
Which external components and tools we used:
```

These research briefs were prepared with Codex. They are not proof that Kiro built the application. Use Kiro for the actual event development and describe contributions honestly. The reviewed rules do not settle every question about supplementary assistants; ask organizers if their intended use could affect eligibility.

## 6. Official judging criteria and how to demonstrate them

The three criteria below are official. The evidence suggestions are our recommendations. **No weights, scoring scale, general tie-break order, or named Civic judge panel were found in the reviewed rules/slides.** [R1][R5]

| Criterion | What the rules emphasize | Strong Civic evidence |
|---|---|---|
| **Potential Value** | Real, clearly defined problem; usefulness, scalability, ease of use; community needs; accessibility, equity, adoption; differentiation | Named user and task; local source; before/after walkthrough; feasible institutional owner; tested accessible interaction |
| **Implementation** | Effective Kiro use; thoughtful AI development strategy; interesting integrations; depth, experimentation, and choices | Spec-to-feature trace; steering effect; useful hook; one integration that works; observed test results |
| **Quality and Design** | Creativity, originality, polished and intuitive design; distinctive public resources and combinations | One complete flow; credible source-backed output; graceful errors; accessible controls; purposeful layout |

### Private self-review, not a predicted judge score

Use 0–4 on each category: 0 absent, 1 asserted, 2 partially shown, 3 working and supported, 4 working with convincing validation. Do not average these into an “official probability of winning.” Improve the weakest area first.

Ask three people unfamiliar with the build to answer after the video: Who is it for? What task did it complete? Why does AI help? How was Kiro used? What is the trustworthy next action? Confusion is actionable design feedback.

### Best Use of Kiro

The rules say the winner must have the highest Implementation score **and** be in the top 10% of projects. A tie is resolved at judges' discretion. The document does not explain how the top decile is calculated across tracks. An eligible entry may win one overall category prize and up to two bonus prizes. [R1]

## 7. Prizes: detailed rules versus headline marketing

| Prize | Detailed rulebook amount/benefit |
|---|---|
| Civic Services first | $3,500 per team, divided equally |
| Civic Services second | $1,000 per team, divided equally |
| Civic Services third | $500 per team, divided equally |
| Other three tracks | Same $3,500 / $1,000 / $500 structure |
| Best Use of Kiro | One year of Kiro Pro Max, stated ARV $1,200 |
| Top 50 finalists | 50 WHOOP straps, stated combined ARV $10,000 |
| Aggregate | **$31,200 approximate retail value**, including noncash prizes |
| AWS interview | First-place prize entries describe an interview opportunity for eligible top winners |

Arithmetic: 4 × ($3,500 + $1,000 + $500) = **$20,000 cash**; plus $10,000 WHOOP ARV and $1,200 Kiro ARV = $31,200. This does not mean $31,200 cash. A four-member Civic first-place team would split $3,500 into $875 each, before any applicable deductions. [R1]

AWS interview eligibility specified in the prize text: age 18+, experience with at least one listed general-purpose language, and enrollment in a bachelor's or higher CS/related STEM program. It promises an interview opportunity, not employment. Do not assume every finalist qualifies. [R1]

## 8. Ownership, access, and post-deadline restrictions

The following summarizes the event terms; retain the actual rulebook for exact wording. [R1]

- The entry remains the creator's/team's intellectual property. The sponsor receives a paid-up, nonexclusive license for judging.
- The sponsor and administrator receive promotional rights concerning the entry and contributors' name, likeness, voice, and image during the event and for three years afterward.
- Open-source components are allowed when their licenses are followed and the entry adds functionality. Attribute reused work and disclose what the team built.
- The submission must not infringe intellectual property, privacy, or other rights. Use permitted music/images and synthetic personal examples in the public demo.
- Projects developed with prior financial or preferential support from the sponsor/administrator can be excluded; the rules also reserve discretion over apparent conflicts. Normal event credits are explicitly offered, but the excerpt does not define every boundary. Disclose relevant prior support to organizers.
- After the submission period, changes are prohibited except narrowly permitted organizer-approved corrections to problematic content. Do not assume bug fixes or Sunday feature additions are allowed.
- The project must remain available without charge/restriction through judging. Because Sunday finalist judging may matter, confirm the actual access end time and keep the submitted build stable through the awards.
- The terms contain releases, indemnification, liability limitations, and organizer-finality language. A sent form is not automatically proof it was received; resubmission remedies are discretionary.

## 9. Known contradictions and unresolved questions

| Topic | Conflicting evidence | Working approach |
|---|---|---|
| Track name | SundAI description says Education; current rules/slides say Civic Action; prize table says Civic Services | Select current Civic category; education/opportunity ideas can still fit the civic portal |
| Start time | SundAI short schedule says 9 AM hacking; detailed coalition schedule says 11:30 AM | Use detailed schedule and live instructions; do not infer prior work permission |
| Setup window | Event quick-link label says 8–11; full setup text emphasizes 8–9 | Finish early; morning program starts 9 |
| Finalist notification | SundAI says 11 PM; coalition says midnight | Monitor official email/Discord through midnight |
| Finalists | Approx. 50 finalists in FAQ/prize text; 12–20 finalist teams in schedule | People and teams may explain the numbers, but that reconciliation is not confirmed |
| Prize total | $30,000 headline vs $31,200 detailed ARV | Use detailed prize table for budgeting; ask about allocation details |
| Extra prize wording | FAQ refers to $5,000 for remaining participants per track | Do not assume a separate award beyond the detailed table |
| Scale | 500+ students/“7 hubs” in SundAI vs 1K+/nine campuses on coalition site | Marketing estimates, not verified attendance or odds |
| UMass Amherst | First floor vs eleventh floor | Ask campus check-in staff |
| Sunday | Broad SundAI outline vs detailed notes in slides | Invitation/live announcement is needed |
| Challenge status | Portal repeatedly labels ideas as guidance, not final briefs | Confirm any binding challenge constraint at kickoff |
| Old accessibility resource | “Additional Civic Action Resources” document is titled for September 28, 2025 | Useful inspiration, not new 2026 rules |

Sources: [R1][R2][R3][R4][R5][R6][R7].

### High-value questions to ask organizers

These are an actionable list for the team, not messages already sent.

1. Does our specific idea qualify for Civic Action/Civic Services, and are the portal prompts optional?
2. What pre-existing code, datasets, assets, or earlier prototypes may be reused, and how should they be disclosed?
3. Are supplementary coding assistants allowed alongside substantial Kiro use?
4. What is the exact SundAI submission workflow, and where should the Kiro write-up/testing instructions go?
5. Are unlisted videos accepted, or must visibility be Public?
6. Are there rubric weights, a numeric scale, or Civic-specific tie-break rules?
7. Do finalists need to attend Sunday in person; what is the live pitch limit?
8. When does project-access retention end, and are any post-deadline changes permitted?

## 10. A 2:50 demo structure

**Should the video show Kiro? Yes: reserve about 20–30 seconds for your own project inside Kiro.** This is a strategic recommendation, not an additional submission rule. The rules require meaningful Kiro use, the committed root `/.kiro` directory, and a written usage account; we did not find a separate requirement that Kiro footage appear in the video. The Implementation criterion makes concise visual evidence worthwhile. [R1]

Use a short cause-and-effect sequence: **an acceptance criterion in your spec → the steering rule, hook, or development action that helped implement it → the relevant passing test or working behavior**. For example, show how a real requirement to label stale civic data became a visible freshness warning. Describe only artifacts and actions your team actually used. One clear example is enough; you do not need every Kiro feature.

Record a few short clips while building, then choose the strongest example. Avoid a generic Kiro promotional video, a long coding time-lapse, or unreadable chat scrolling. Put the working product first. The footage supports the written Kiro account and repository; it does not replace them. Keep redemption codes, credentials, and personal information out of the recording. Include captions and zoom enough for the evidence to be readable.

| Timestamp | Show |
|---|---|
| 0:00–0:20 | Specific Massachusetts user and concrete task; avoid unsupported prevalence claims |
| 0:20–1:25 | Working input → useful output → next action, on the intended device |
| 1:25–1:50 | One source check and one failure/uncertainty or accessibility interaction |
| 1:50–2:20 | Kiro spec, steering, hook or test, tied to the feature just demonstrated |
| 2:20–2:40 | Measured prototype result, pilot owner, and path beyond the event |
| 2:40–2:50 | Limits, what works today, and concise closing |

This is our suggested allocation. The only official video limit is under three minutes. Do not present staged output as a live integration. Clearly label prerecorded data, simulations, and unbuilt features.

## 11. Final acceptance checklist

- [ ] Every member is eligible and listed; team has at most four; representative agreed.
- [ ] Civic Action/Civic Services is selected on the final SundAI submission.
- [ ] Repository is public and accessible without a GitHub login.
- [ ] `/.kiro` is present at repository root, populated with genuine project artifacts, and pushed.
- [ ] Neither `.kiro` nor its subdirectories are excluded by ignore rules.
- [ ] Source, required assets, dependency information, configuration example, and setup instructions are included.
- [ ] Credentials, physical redemption codes, and private participant/customer information are absent from source and video.
- [ ] Working demo/test build is reachable; any demo credentials work; no payment required.
- [ ] English description names beneficiary, problem, features, local context, limits, and adopted sources.
- [ ] Kiro write-up describes actual usage, including specific artifacts and outcomes.
- [ ] Video is under three minutes, on an allowed host, publicly viewable, and shows functioning software.
- [ ] Third-party content and reused software have appropriate rights and attribution.
- [ ] Another person follows the testing instructions and completes the core task.
- [ ] SundAI confirms the final entry was received before 8 PM; confirmation retained.
- [ ] Submitted commit/deployment is recorded; changes stop at deadline; build remains available for judging.

## 12. Source register and useful links

The two user-supplied text attachments provided the event copy and full rules. The current linked rulebook was also fetched through Google Drive; its metadata reported modification on October 24, 2026 at **7:51 AM Eastern**. The linked slide deck metadata reported **9:00 AM Eastern**. A modification time establishes freshness, not that every slide is final.

| ID | Source | Use and reliability |
|---|---|---|
| R1 | [Official Hackachusetts rules][R1] | Primary, linked directly from coalition event page; submission/judging/prize authority |
| R2 | [Coalition event page][R2] | Primary schedule, FAQ, sponsors and locations; read live browser because web extraction was incomplete |
| R3 | [Setup guide][R3] | Organizer setup instructions; also provided verbatim by user |
| R4 | [SundAI event page][R4] | Primary registration listing; contains contradictions documented above |
| R5 | [Kickoff slides][R5] | Primary linked deck, read through Drive; extraction also includes presenter notes |
| R6 | [Civic challenge portal][R6] | Organizer-linked guidance and data catalog; not final binding briefs |
| R7 | [Additional Civic Action Resources][R7] | Linked resource sheet, internally dated September 28, 2025 |

Operational links: [SundAI event][R4] · [SundAI Discord](https://discord.gg/h5zqSsSCu) · [Kiro Discord](https://discord.gg/kirodotdev) · [Kiro downloads](https://kiro.dev/downloads/) · [all-campus brainstorm hub](https://app.notion.com/p/Hackachusetts-Hub-402af740ef9481ce8613d72e8010f944) · [idea form linked by challenge portal](https://rich-uranium-d4e.notion.site/b836a9c5ce974d32a09bbec1bd38f928).

The brainstorm hub/form were identified as links; their contents and submission behavior were not inspected. They are not substitutes for the final SundAI entry.

[R1]: https://docs.google.com/document/d/1aDagPzc29sNGHdycZ-30GMf2z-Np2SwqZX_hY46tLrQ/edit
[R2]: https://massaicoalition.com/hackachusetts/
[R3]: https://massaicoalition.com/hackachusetts/setup/
[R4]: https://www.sundai.club/events/boston/hackachusetts-with-kiro
[R5]: https://docs.google.com/presentation/d/1X4RmC1_I3XLiYQSJZ4rrT-CMqUxTiXW4z_fDW63c6pM/edit
[R6]: https://hackachusetts2026.vercel.app/#/civic
[R7]: https://docs.google.com/document/d/1SNUjxvBK5cCq273aYCceGPGKflVUCUF_zrxGw741kAs/edit
[K1]: https://kiro.dev/docs/specs/
[K2]: https://kiro.dev/docs/steering/
[K3]: https://kiro.dev/docs/hooks/
[K4]: https://kiro.dev/docs/mcp/
[K5]: https://kiro.dev/docs/
