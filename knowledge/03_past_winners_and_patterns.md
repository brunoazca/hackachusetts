# Hackachusetts preparation — Past winners, highlights, and transferable patterns

Research checked: **October 24, 2026**, Eastern. Companion documents: [rules and judging](01_rules_judging_and_event_playbook.md) and [Civic strategy](02_civic_strategy_stakeholders_and_ideas.md).

## 1. What this evidence can establish

**These are comparable-event winners, not past Hackachusetts winners.** SundAI describes Hackachusetts as the Mass AI Coalition's first statewide hackathon with Kiro. No verified prior edition's winner list was found in the reviewed sources. The current event is taking place on the research date, so its eventual winners cannot inform a pre-build historical analysis. [Hackachusetts listing][W1]

SundAI's own story describes its ordinary weekly hacks as collaborative events without prizes. A project appearing in its community gallery is therefore not automatically a competition winner. [SundAI philosophy][W2]

The closest comparison is **Code with Kiro 2025**, which used the same broad Potential Value and Implementation categories and a creativity/originality category. It ran July 14–September 15, 2025, rather than a single day. Its team limit, licensing requirements and prize structure differ from Hackachusetts. Use its projects as examples of demonstrated value and Kiro evidence, not as an alternate rulebook. [Event overview][W3]

**Important limitation:** an award establishes that a project won. Without judge score sheets or published deliberations, it does not prove why it won. Every “lesson” below is our interpretation. This is a small, selected sample without nonwinning controls; it cannot estimate win probability or reveal secret preferences.

## 2. Verified award summary

| Project | Competition | Award established by source | Evidence quality | Civic relevance |
|---|---|---|---|---|
| Upload Drive-In | Code with Kiro, 2025 | First place; Bonus Blog Prize | Devpost project award badges [W4] | A narrow workflow can be compelling |
| Denarii | Code with Kiro, 2025 | Second place | Devpost award badge [W5] | Explainable decision support and explicit development method |
| CleanClik | Code with Kiro, 2025 | Third place | Devpost award badge inspected in browser [W6] | Direct civic-action precedent: urban cleanup |
| AllVoice | ASU Kiro Spark Challenge, April 2026 | Grand prize + Best Build | University organizer report [W7] | Accessibility as the core benefit |
| Ghosty | Same ASU event | Best Collaboration | University organizer report [W7] | Community connection |
| Meshrun | Same ASU event | Best Impact | University organizer report [W7] | Enabling infrastructure |
| Colosseum | Same ASU event | Best Story | University organizer report [W7] | Review before consequential actions |
| SchoolGuard | Kiro × Miro Amsterdam, reported May 26, 2026 | First place, according to its builder | First-person account; no independent organizer result located [W8] | Jurisdiction-aware resources and human approval |

The first three awards are corroborated by the [Code with Kiro gallery][W9]; the project pages establish the precise placements. Kiro's own [showcase][W10] includes these projects, but a showcase listing alone does not establish a prize.

## 3. Code with Kiro 2025: the closest rubric comparison

### Upload Drive-In — first place

**Verified project facts:** a self-hosted Laravel application for receiving files into an organization's cloud storage. Its competition write-up describes Google Drive support and lists other storage providers as future work. Devpost marks it first place and a Bonus Blog winner. [Project entry][W4]

**Our lesson:** finish a frequent, understandable task. A judge can recognize a useful upload workflow immediately; the product does not need a spectacular science-fiction premise to demonstrate value. For CivicBridge, the equivalent is a resident reaching the correct next step with a usable packet, rather than a long generic conversation.

**What to study:** onboarding, instructions, integration boundaries, and how the author separates current features from plans. The [current repository][W11] includes operational documentation, but it has continued developing. Do not assume today's code matches the submitted version.

**What not to infer:** this does not show that every winning product needs an LLM at runtime or that Civic submissions should copy a file-upload app. Kiro is the development tool; product functionality is a separate design choice.

### Denarii — second place

**Verified project facts:** a purchase-decision assistant using weighted decision matrices and multi-criteria analysis. Its builder describes feature specs with acceptance criteria, design/tasks, smaller edits in vibe mode, and a hook keeping tests/documentation synchronized with decision-model changes. The project page confirms second place. These implementation details are the builder's account, not independently benchmarked results. [Project entry][W5]

**Our lesson:** explain the decision method and the engineering process. For a Civic project, show the source-backed reason for each suggested step and connect one requirement to code and a test.

**What to study:** how a single user question anchors the interface and how the write-up makes Kiro's contribution inspectable.

**What not to transfer:** financial-advisor claims, personalized financial recommendations, or arbitrary scoring of residents' worthiness. A transparent-looking score is not automatically valid or fair. For public services, a checklist and human determination may be more appropriate than a score.

### CleanClik — third place; strongest direct Civic analogy

**Verified project facts:** a mobile cleanup game using camera-based item recognition, collection/disposal steps, QR-linked bins and rewards. Its entry acknowledges general-purpose detection limits and uses virtual demo-bin QR codes because physical installation was future work. Devpost confirms third place. [Project entry][W6]

**Our lesson:** make a civic behavior concrete and visible. The user does something understandable, sees feedback, and can repeat the loop. A public-value concept becomes easier to evaluate when it has a complete interaction.

**What to study:** the working loop, explicit demo limitations, and separation between prototype and future community deployment. The [repository][W12] visibly contains `.kiro/steering`; its README says Android is tested while iOS is untested. This is useful evidence practice, not proof of a particular judging score.

**What not to copy:** claiming real sanitation partnerships, validated disposal, or environmental impact without evidence. Gamification can be useful, but points do not by themselves prove behavior change. Build a distinct need instead of reskinning this winner.

## 4. ASU Kiro Spark Challenge: useful student-event comparison

The university's May 7, 2026 report describes an April 24 build event and names these outcomes. [Organizer report][W7]

| Project | Reported function | Reported prize |
|---|---|---|
| AllVoice | Converts visual information into audio for visually impaired users | $4,500 grand prize + $1,500 Best Build |
| Ghosty | Helps event attendees make useful connections | $1,500 Best Collaboration |
| Meshrun | Distributes large-model workloads across computing resources | $1,500 Best Impact |
| Colosseum | Developer risk signals and isolated rehearsals before database commands | $1,500 Best Story |

**Our interpretation:** this set suggests several forms of value can be recognized: direct access, community connection, enabling technology, and understandable safeguards. Hackachusetts does not advertise these same four bonus categories. Use the examples to sharpen the product's benefit, not to invent awards or assume the judging panels overlap.

The report's total-prize headline and listed individual awards are not perfectly aligned arithmetically. We preserve named awards and do not use its aggregate as an exact financial benchmark.

## 5. SchoolGuard: a highly relevant, lower-certainty precedent

**First-person report:** Jeffrey Luppes says he and a teammate won first place at Kiro × Miro Amsterdam with SchoolGuard. A teacher enters a school; the tool identifies relevant jurisdictional resources; a teacher reviews them before they enter the knowledge base; role-specific guidance follows. The post describes Miro planning and a Kiro-built MVP. [Builder account][W8]

**Our lesson:** locality and review can be the central feature. CivicBridge could demonstrate correct jurisdiction, show applicable evidence, and require review before a next action. This is a more distinctive flow than asking a general chatbot to summarize a city webpage.

**What to study:** the short demonstration sequence and a visible point where the user approves proposed information.

**Limits:** the result is self-reported; no independent organizer announcement was verified here. The post does not validate legal accuracy, school adoption, child-safety outcomes, or production readiness. Do not reuse its legal or safeguarding claims as evidence for our own product.

## 6. Relevant highlights that are not verified winners

### Civic-accessibility ideas from an earlier linked resource sheet

The current challenge portal links a document titled for a **September 28, 2025 hackathon**. It proposes document accessibility remediation, spreadsheet accessibility, reviewing vendor accessibility documentation, and ASL conversion. No prize or winner is identified in that document. [Resource sheet][W13]

**Use:** evidence that accessibility problems have been discussed in adjacent event materials. Narrowing document review to a few supported checks could produce a credible one-day flow. A promise to fix every accessibility defect or translate ASL accurately is much broader than this evidence supports.

### Boston's existing public technology

Boston's Emerging Technology page and OpenContext repository are useful references for an adoption-minded Civic project. **They are not listed here as hackathon winners.** They establish that existing public infrastructure should be understood before claiming novelty. [Boston portfolio][W14], [OpenContext][W15]

The detailed competitive implications are in [the Civic strategy brief](02_civic_strategy_stakeholders_and_ideas.md). Present an improvement over an existing task flow, not the unsupported claim that no civic AI or service-navigation tools exist.

### Boston Innovation Expo 2026: City awards with direct Civic relevance

Boston also published its own municipal award winners: **311 Help Center** (People’s Choice), **Mapping Disability Access in Boston** (Cross-Departmental Collaboration), **Lessons from BidBot** (Rising Innovation), and **New Algorithms for Old Mattresses** (Public Impact). These are City Expo awards, not Hackachusetts competition wins. [Official City award list](https://www.boston.gov/news/winners-innovation-expo-2026).

The follow-up inspected the project posters, the short captioned award promo, and a research abstract describing BidBot’s randomized employee evaluation. See [the detailed findings and numerical-claim limits](06_deep_evidence_transcripts_and_city_priorities.md#4-what-boston-itself-recognized-four-actual-city-award-winners). The useful pattern is a specific public-service improvement with inspectable evidence. Awards alone still do not explain an individual judge’s reasoning.

## 7. Patterns worth adopting — and their limits

The following is our synthesis, not a statement from judges.

| Pattern | Why it is useful for this team | A concrete action |
|---|---|---|
| A specific user and task | Reduces explanation time and makes scope testable | Write one sentence naming the person, task and obstacle |
| A visible completion loop | Makes the demo understandable even if judges never run the app | Show input, useful output and next action in under 90 seconds |
| Accessible benefit | Connects implementation to a person's ability to act | Demonstrate keyboard completion or another tested access improvement |
| Relevant local context | Makes source selection and usefulness defensible | Support one jurisdiction and show an unsupported-location case |
| Inspectable Kiro contribution | Maps directly to the Implementation criterion | Show a spec, a decision, an artifact and a result |
| Honest prototype boundaries | Helps judges distinguish working functionality from roadmap | Label snapshots, simulations, manual steps and untested platforms |
| A believable operator | Explains how value could continue after the event | Name a proposed department/community owner and what must be validated |
| Useful feedback or review | Makes errors recoverable | Allow source inspection, corrections and a human decision point |

These are not proof that feature count, gamification, agents, particular model providers, or sponsor branding cause wins. A few successful examples cannot reveal the relative value of each attribute. The published Hackachusetts rubric is stronger evidence than this pattern analysis.

### Anti-patterns this research helps avoid

- **Copying the surface:** adopting a cleanup leaderboard because CleanClik won, without a new problem or validation plan.
- **Using contemporary code as historical evidence:** assuming features added later were in the award-winning submission.
- **Confusing polish with truth:** presenting a plausible answer confidently without verified sources.
- **Treating a public repository as a test result:** code visibility is useful, but does not show that the app runs or its claims are correct.
- **Importing another event's rules:** e.g. the earlier Code with Kiro team limit or license requirement.
- **Calling community projects winners:** a showcase, launch, or ordinary SundAI hack is not automatically a competition result.
- **Inferring individual bias:** institutional interests and prior awards do not establish how a specific judge will score this project.

## 8. A 30-minute study plan before committing to the idea

1. **Minutes 0–7:** read CleanClik's submitted story. Identify the complete user action and the demo-only elements.
2. **Minutes 7–14:** read Denarii's Kiro section. Write the equivalent requirement → artifact → benefit story for our concept.
3. **Minutes 14–20:** read Upload Drive-In's scope and setup explanation. Identify what our judge must understand without developer assistance.
4. **Minutes 20–25:** inspect SchoolGuard's flow, remembering the lower certainty of its award report. Decide whether jurisdiction and review improve our task.
5. **Minutes 25–30:** write the 90-second working demo and delete features that cannot be justified by it.

Do not spend the build window cloning all these repositories. The research value is in product scope and evidence presentation; implementation should be the team's original work, built with Kiro and with any reuse properly licensed and disclosed.

## 9. Translate inspiration into our submission

Use this draft only after replacing every bracket with actual evidence:

```markdown
We built [product] for [specific user] completing [specific civic task].

The current alternative is [existing service/workflow]. Our improvement is
[specific difference], demonstrated by [observed result and sample size].

The demo uses [authoritative sources and snapshot/live status]. We support
[narrow scope] and explicitly defer when [known unsupported situation].

Kiro helped us implement [feature] from [spec], guided by [steering rule].
[Hook/test/integration] produced [actual observed result].

What works today: [complete task].
What remains: [limits and future work].
Next validation step: [proposed user/owner and experiment, not a claimed partnership].
```

The practical goal is to produce a small body of convincing evidence: one complete journey, a few checked results, a concrete Kiro development story, and a realistic next step. Do not claim these patterns guarantee selection.

## 10. Source register and verification notes

| ID | Source | What was verified |
|---|---|---|
| W1 | [Hackachusetts SundAI listing][W1] | Description as first statewide coalition/Kiro event; contains logistics conflicts documented elsewhere |
| W2 | [SundAI story/philosophy][W2] | Ordinary weekly hacks described as noncompetitive |
| W3 | [Code with Kiro overview][W3] | 2025 dates, broad criteria and distinct rules |
| W4 | [Upload Drive-In Devpost entry][W4] | First-place and Bonus Blog badges directly inspected in browser; project story also retrieved |
| W5 | [Denarii Devpost entry][W5] | Second-place badge directly inspected in browser; builder's development account retrieved |
| W6 | [CleanClik Devpost entry][W6] | Third-place badge and project story directly inspected in browser |
| W7 | [ASU organizer report][W7] | Four named winning projects and awards; published May 7, 2026 |
| W8 | [SchoolGuard builder post][W8] | First-person first-place claim and described flow; published May 26, 2026 |
| W9 | [Code with Kiro gallery][W9] | Winner labels; gallery is not a scoring explanation |
| W10 | [Kiro showcase][W10] | Official highlighting of projects, distinct from award proof |
| W11 | [Upload Drive-In repository][W11] | Current code/documentation; not pinned to submission commit |
| W12 | [CleanClik repository][W12] | Current `.kiro/steering`, README and platform-limit statement |
| W13 | [Earlier accessibility idea sheet][W13] | Idea list dated September 28, 2025; no winners stated |
| W14 | [Boston Emerging Technology][W14] | Existing public technology context |
| W15 | [CityOfBoston OpenContext][W15] | Existing civic data tooling; no award claim |

Some Devpost pages returned 403 to the web extraction tool; accessible indexed primary content and browser inspection were used as noted. All three Code with Kiro placement badges were subsequently verified directly in the browser. No winner code was run, no demo's effectiveness independently benchmarked, and no judge deliberation accessed. Secondary social posts were used only as discovery leads, not as proof for those placements.

[W1]: https://www.sundai.club/events/boston/hackachusetts-with-kiro
[W2]: https://www.sundai.foundation/about
[W3]: https://kiro.devpost.com/
[W4]: https://devpost.com/software/upload-drive-in
[W5]: https://devpost.com/software/denarii
[W6]: https://devpost.com/software/trashypal
[W7]: https://tech.asu.edu/features/students-solve-educational-environmental-and-economic-challenges-new-ai-tool
[W8]: https://www.jeffluppes.nl/blog/kiro-miro-hackathon/
[W9]: https://kiro.devpost.com/project-gallery
[W10]: https://kiro.dev/showcase/
[W11]: https://github.com/johnfmorton/upload-drive-in
[W12]: https://github.com/manuu-r/cleanclik
[W13]: https://docs.google.com/document/d/1SNUjxvBK5cCq273aYCceGPGKflVUCUF_zrxGw741kAs/edit
[W14]: https://www.boston.gov/departments/emerging-technology
[W15]: https://github.com/CityOfBoston/OpenContext
