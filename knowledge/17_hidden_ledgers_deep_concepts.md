# Hidden ledgers: five concepts that are new, Boston-specific, and demoable in one video

Written **October 24, 2026, ~12:00 PM Eastern**, during the build window. Author: Claude Code (research and ideation; **not** Kiro build activity). Everything marked *verified* below was checked live this hour with the exact query recorded. Everything else is a proposal.

This document deliberately ignores build complexity, as asked. It asks only: *what is the best possible thing to build for this exact hackathon?* The "first 20 minutes" section at the end brings each idea back to earth.

## The thesis

Boston runs on ledgers that nobody reads at the moment they matter:

| Hidden ledger | Who it silently affects | What exists today |
|---|---|---|
| The **Street Occupancy Permit** database (every moving truck, excavation, crane, dumpster that takes public curb or sidewalk) | The driver who gets towed; the wheelchair user whose sidewalk vanishes | A street-name-only lookup page on cityofboston.gov that almost nobody knows |
| The **311 closure note and closing photo** (what the City actually did before it clicked "Closed") | The resident who still has the problem | Buried free-text in the open-data export; the app just says "Closed" |
| The **snow clock** (3 hours after snowfall ends, 42-inch path, curb ramps included) | Anyone on wheels, with a stroller, or with a cane, for the next five months | A rules page; 26,000 snow-related 311 requests this year |
| The **hearing transcript** (2 h 38 min yesterday on rats alone) | Every resident who could not attend but whose block was discussed | A YouTube recording with auto-captions |
| The **town meeting warrant** (Massachusetts' 400-year-old direct democracy) | Every voter in ~260 towns, several voting in the next three weeks | A 40–90 page PDF |

Each concept below turns one hidden ledger into a tool a person uses at the exact moment it touches them. That is the creative move: not a new dataset, not a chatbot, but **the ledger at the curb**. AI reads the messy artifact (a paper sign, a closure note, a transcript, a warrant). Deterministic code does the verification. A human makes the decision. Every fact links to its record.

## What was verified in the last hour

| Finding | Exact evidence | Why it matters |
|---|---|---|
| Boston's live **Street Occupancy Permit Lookup** returns a parseable HTML table | `https://www.cityofboston.gov/streetoccupancy/search/?streetname=Commonwealth` → **420 rows**: `PERMIT NO` (prefixes `OCCU-`, `EXCA-`, `EMER-`), `ADDRESS`, `START`, `END`, `STATUS` (`current`/`past`), `MAP`. Example: `EXCA-1908363 · 285 Commonwealth Av · 2026-10-19 → 2026-11-01 · current`. Search is by street name only | A real, current, City-owned source that no hackathon team will think of. Powers concept 1 end to end |
| Moving-truck permit rules | City page: **$69** for two non-metered spaces, **7 a.m.–5 p.m.**, signs posted **at least 48 hours** before start, three days recommended; `movingtrucks@boston.gov`, 617-635-2560 | Deterministic compliance rules for concept 1 |
| Fake or unofficial tow signs are a documented Boston problem | Public 311 tickets about "fake moving permits" (Hanson St / Tremont St), an unofficial sign on a public street in the South End, suspected unofficial tow signs on Glenside Ave | The problem is real, not invented for the pitch |
| **Parking Enforcement is the #1 311 request type of 2026** | SQL over resource `1a0b420d-99f1-4887-9851-990b2a5a6e17`: Parking Enforcement **52,623**; Request for Snow Plowing **12,724**; Unshoveled Sidewalk **11,731**; Street Cleaning 11,009; Improper Storage of Trash 10,950; Pothole 8,428; Needle Pickup 6,800; Rodent Activity 5,321; Space Savers **1,510**; Misc. Snow 492 | Curb and snow dwarf everything else residents report |
| The 2026 export carries **closure text and closing photos** | Fields include `closed_dt`, `closure_reason`, `closed_photo`, `latitude`, `longitude`, `source`. **127,707** closed cases; **49,666** have a closing photo; `submitted_photo` is empty in the public export (0 rows) | Powers concept 3. Before/after photo pairs are **not** available; closing photo + closure text are |
| Closure notes can be classified into outcomes | Keyword pass over all closed 2026 cases (approximate, needs review): resolved-language 63,357 · enforcement issued 19,856 · **"no violation found" 6,998** · duplicate 4,359 · invalid 2,608 · referred 2,226 · other 28,303. Unshoveled Sidewalk: 6,947 tickets issued, **2,423 "no violation found upon arrival"**. Rodent Activity: **4,111 of 5,236 closed cases carry no outcome language at all** | "Closed" hides at least seven different realities |
| Who files 311 | Employee Generated **101,466**; Citizens Connect App 59,055; Constituent Call 19,226; City Worker App 10,101; Self Service 820 | More than half of "requests" are the City talking to itself. A resident-facing outcome view is a real gap |
| Snow rules | boston.gov: owners clear sidewalks **and curb ramps** abutting their property within **3 hours** after snowfall ends (or after sunrise if overnight); **42-inch** path; no shoveling into the street; fines **$200 / $100 / $50** by property class, each day a separate violation | Deterministic deadline math for concept 2 |
| Snow Emergency Parking (2019) and Snow Emergency Routes datasets exist | `data.boston.gov` package search `snow` | Context layers for concept 2; parking file is stale and must be labeled |
| Open311 endpoint is down | `mayors24.cityofboston.gov/open311/v2/services.json` → HTTP 503 | Do not plan on filing 311 requests programmatically |
| Civic calendar hooks | Voter registration deadline is **today** (online by 11:59 p.m.); early voting Oct 17–30; mail-ballot request by Oct 27, 5 p.m.; Election Day Nov 3. Fall town meetings: Hanover **Nov 9**, Dedham **Nov 16**, Brewster **Nov 16**, Fairhaven **Nov 17** | Timeliness lines for the video; warrant fixtures for concept 5 |

Reproduce the 311 numbers with `datastore_search_sql` against the resource above; the queries are one-liners and the API needs no key.

## Ranking for this hackathon

Judges score mostly from a sub-three-minute video and the written description. So the ranking weights: can a stranger understand it in 20 seconds; is it visibly local and current; is it honestly working; does it have a real AI job and a real human decision; does it give Kiro something to spec and test.

| Rank | Concept | One line | Why it can win | Biggest risk |
|---|---|---|---|---|
| **1** | **CurbCheck** | Point your phone at a paper NO PARKING sign; it reads it, checks the City's live permit database, and tells you if it's real and when to move | #1 complaint type in the city; nobody has done it; live City source; 20-second mobile demo; real AI (vision) plus real verification (permit DB) | OCR on bad photos; street-name-only lookup needs fuzzy matching |
| **2** | **Three Hours** | A wheelchair user's route after a storm: every sidewalk and curb ramp, who must clear it, and the legal deadline, with one-tap correctly-typed reports | Accessibility is the rubric and the story; 26k snow requests; winter starts in six weeks; a countdown is visceral | Ownership per frontage needs parcels; corners have no clear owner (make that the point) |
| **3** | **What Actually Happened** | The 311 outcome layer: every closed case classified into what the City actually did, with the quoted note and closing photo, plus a one-click re-check packet | Uses fields nobody uses; 127k cases; directly answers prompt V2 ("volume hides who is waiting"); extends the team's RodentOps thinking | Tone (frame as closing the loop, not catching the City); photo privacy |
| **4** | **On the Record** | Yesterday's 2 h 38 min rodent hearing becomes a neighborhood-tagged ledger of claims and commitments, each linked to the exact second of the official video | Massachusetts-scalable (351 municipalities); makes hearings accessible; stunning before/after | Caption errors; speaker attribution; must keep neutral |
| **5** | **Warrant** | A town meeting warrant becomes a plain-language voter guide with page citations, cost tallies and "what yes/no means" | Only-in-Massachusetts; four real warrants voted on in November | Boston judges may not relate; political neutrality must be airtight |

If the team keeps rodents, the fusion section below shows how concepts 3 and 4 make RodentOps distinctive instead of another work queue.

---

## 1. CurbCheck — "Is this sign real, and when do I have to move?"

**The moment.** You come home to a laminated or handwritten sign zip-tied to a pole: *NO PARKING — TOW ZONE — Sun 10/26 7AM–5PM — Moving*. Is it a real City permit? Does it cover your spot? When exactly must you move? Is it one of the fake signs people post to save a space? Today you guess, and the guess costs a tow (hundreds of dollars) or a ruined move.

**The tool.** Take a photo. The app:

1. Reads the sign with a vision model: permit number if printed, street, number range, date(s), hours, reason. Shows the crop and its confidence for every field. Handwriting and partial dates ("10/26", "Sun") are expected inputs, not edge cases.
2. Queries the City's **Street Occupancy Permit Lookup** by street name and matches address range and dates deterministically. Three outcomes, each with the matched row or the search that came back empty:
   - **Verified**: `OCCU-xxxxxxx`, 285 Commonwealth Av, Oct 26, current. Hours per permit type (moving: 7–5).
   - **No matching permit found**: not proof of a fake sign, but exactly the case the City asks residents to report. One tap drafts the 311 "Illegal Posting of Signs" report with the photo and the search evidence attached. The user reviews and sends from the official app.
   - **Ambiguous**: date without year, range overlaps two permits, OCR confidence low. The app says so and asks one question instead of guessing.
3. Produces the decision card: *Move your car by Sat Oct 25, 11:59 p.m. (permit starts Sun 7 a.m.)*, add to calendar, and the permit holder's obligations (signs up ≥48 h before; if the sign went up this morning for tomorrow, that's non-compliant and the permit page says so).

**Second entry point, same ledger: pedestrians.** The same database carries `EXCA-` (excavation) and `EMER-` permits with start and end dates. Enter the route you walk or roll every week; the app lists the frontages with current or upcoming permits (*285 Commonwealth Av, excavation through Nov 1*). For a wheelchair user that is the difference between "the sidewalk might be gone on Tuesday" and finding out at the curb. Label it "possible obstruction": a permit is permission, not proof the sidewalk is closed.

**Why it is new.** Boston's own `cds_translator` reads permanent regulatory signs. Curb Lab maps permanent curb rules. Nobody reads the *temporary paper signs* that actually get cars towed, and nobody turns the occupancy permit database into a forecast for the people it displaces. The lookup page even says "Search is only by streetname"; the City built the ledger but not the moment.

**Why it fits this hackathon.** Prompt V1 (one task, plain language, show the next step) and V3 (the last mile is a street). Parking Enforcement is the city's single largest 311 category this year. The demo is a phone pointed at a pole; a judge watching on mute still understands it. The AI job is real (vision over messy signs) and bounded (verification is code). The human decision is explicit (you decide to move or to report). And it is instantly scalable: every Massachusetts city issues these permits.

**Honesty boundaries.** "No match" is never "fake". Never say "safe to park". The lookup is a City web page, not an API: snapshot the responses used in the demo (per the team's steering rule), show the retrieval time, and handle the page being down. Do not store other people's plates or faces; blur incidental ones in demo footage.

**Kiro story that writes itself.**
- Spec: sign schema with required/optional fields, three outcome states, and the rule that an ambiguous date can never produce a "Verified" card.
- Property-based tests: date normalization ("10/26", "Sun Oct 26", "26 OCT") always lands on the correct next occurrence relative to the photo timestamp; address-range matching is symmetric; a permit whose `END` is before the photo date can never verify a sign.
- Steering: tone rules (never accuse; "could not verify"), citation rule (every card shows the permit row or the empty search), accessibility rule (card readable by screen reader, 44-px targets, one-handed).
- Hook: on save of the OCR prompt or matcher, run the fixture set (six team-made signs: clean print, handwritten, partial date, wrong street, expired permit, no permit).

**The 2:50 video.** 0:00 a real pole with a real sign (your own, posted for the shoot). 0:15 photo → fields with confidence → permit row → "move by" card. 0:50 second sign → no match → drafted 311 report, user reviews. 1:15 route view: "excavation at 285 Commonwealth through Nov 1". 1:40 keyboard and screen-reader pass of the card. 1:55 Kiro: the spec line "ambiguous date can never verify" → the property test → the failing case it caught. 2:25 limits and next pilot (Parking Clerk, a disability commission reviewer). 2:45 close.

**Pilot owner hypotheses.** Office of the Parking Clerk (they publish the ledger and answer the phone about it); Boston Disability Commission (sidewalk forecasting); any moving company (compliance card for their own signs).

---

## 2. Three Hours — the snow clock for people on wheels

**The moment.** It stopped snowing at 6:40 a.m. By 9:40 a.m. the law says every sidewalk and curb ramp abutting a property must be clear to 42 inches. For a wheelchair user, a blind pedestrian, or a parent with a stroller, the route to the bus stop is a chain of frontages with different owners, two corners that nobody seems to own, and a bus stop that belongs to a third agency. In March 2026 disability advocates told a public hearing that this is exactly where the city fails them. This year Boston has already logged **11,731** Unshoveled Sidewalk requests, **12,724** plowing requests and **1,510** Space Saver complaints.

**The tool.**
1. **Build your route once** (home → bus stop → pharmacy). The app decomposes it into frontages and corners. Each segment gets a responsibility class from public data: abutting private property (owner class only, never a name), City building or park, MBTA facility, state road (MassDOT/DCR), unknown. Unknown is shown as unknown; it is the product's most useful word.
2. **Arm it when it snows.** The clock starts from the National Weather Service observed end of snowfall (or sunrise), per the ordinance. Each segment shows its deadline and fine class ($50/$100/$200). A single visual: the 42-inch path, segment by segment, clear / unknown / reported.
3. **Report correctly in one tap.** For each segment still blocked after the deadline, the app pre-fills the correct 311 type (Unshoveled Sidewalk vs Request for Snow Plowing vs Misc. Snow), the correct location text, and the time-since-deadline. The user reviews and sends through the official app. Correct typing matters: in 2026, 2,423 Unshoveled Sidewalk cases closed "no violation found upon arrival" and 6,947 with a ticket; a report that arrives late or mistyped is a wasted trip for an officer.
4. **Block snow pact (pre-season).** Before the first storm, neighbors on one block see the orphan corners and pre-commit who clears them. Export a one-page pact with the rule text and the deadlines. No accounts; a printable sheet is the deliverable.

**Why it is new.** Snow apps show plow trackers (where the truck went). None model the *legal obligation chain along a specific person's route* with deadlines, nor the corners that fall between owners. The City's rules page and the 311 app exist; the gap is the five minutes between "it stopped snowing" and "who is responsible for this exact ramp, by when."

**Why it fits this hackathon.** Accessibility is a scored requirement, and here it is the entire product, not a checklist. Prompt V2 ("who an alert misses") and V3. The timing is unusually good: judges are Bostonians six weeks from the first storm, and the first snow emergency of the season will make every finalist remember this demo. Data is public and already in the repo family (311 snow types, Cambridge ramps GeoJSON, MBTA stops; Boston parcels and snow-route layers are on data.boston.gov).

**Honesty boundaries.** Responsibility for corners and bus stops is genuinely contested; show the ordinance text and let "unknown owner" stand. A deadline computed from NWS data is an estimate ("the City tries to be reasonable" is in the rule). Never imply a route is clear because nobody reported it. Use February 2026 311 timestamps as a replay, labeled as replay.

**Kiro story.** Spec the deadline function from the ordinance text with worked examples (overnight snow → sunrise + 3 h). Property tests: deadline monotonic in snowfall-end time; fine class determined only by property class; no segment can be "clear" without an observation. Steering: ordinance-citation rule, no owner names, plain-language rule. Hook: run the replay fixture on every change to the deadline logic.

**Video beat that sells it.** A 3:00:00 countdown starts at the NWS snowfall-end time; the route turns from unknown to clear/reported segment by segment; the one orphan corner stays red with "owner unknown, ask the City" and the drafted question.

---

## 3. What Actually Happened — the 311 outcome layer

**The moment.** Your rodent report says *Closed*. Was a bait station placed, was the property cited, was nothing found, or was it marked duplicate and referred to Public Works? The City wrote it down; the public export carries it in `closure_reason` and often a `closed_photo`. The 311 app shows one word.

**The tool.**
1. **Outcome classification at scale.** Every closed 2026 case gets an outcome state with the exact quoted phrase: *resolved (with evidence)*, *enforcement issued*, *no violation found on arrival*, *duplicate*, *referred to another department*, *invalid*, *closed without stated outcome*. The last state is the headline finding: **4,111 of 5,236 closed Rodent Activity cases have no outcome language**. For Improper Storage of Trash, 4,884 tickets were issued and 1,776 closed as no violation found.
2. **Closing-photo reading.** When a closing photo exists (49,666 cases), a vision model writes a one-line *description* ("photo shows a sealed bait station at a foundation", "photo shows cleared crosswalk"). It is labeled as an AI description, never as proof, and a reviewer can reject it.
3. **The block ledger.** For one neighborhood and one category: a timeline of cases with outcome states, not counts. The question the prompt asks, "who is still waiting," becomes answerable: closed-without-outcome and no-violation-found cases that were re-reported within 30 days at the same location.
4. **The re-check packet (the completed task).** A resident still seeing the problem picks their closed case, adds a new dated observation and photo, and the app drafts a follow-up that cites the earlier case ID, its closure note and date. The resident reviews and submits through the official channel.

**Why it is new.** Dashboards count cases. RentSmart aggregates complaints per address. Nobody has published the *outcome* layer of Boston 311, and the City's own closure vocabulary makes it possible. This is the scaled, data-real version of the team's RATRECEIPT/RepairLedger idea.

**Why it fits.** Prompt V2 word for word. It demonstrates evaluation discipline, which Boston's own Innovation Expo rewarded. The Kiro story is strong: the classifier is a spec with a labeled fixture set and precision/recall that you actually measure today.

**Honesty boundaries.** Frame as closing the loop for residents and quality signal for the City, never as an accusation. Keyword classes are approximate; publish the rules and the reviewed sample. Photos may show homes: use aggregates for neighborhoods and only the user's own case for photo display; blur in the video. A closed case is not a failed case; "closed without stated outcome" is a documentation gap, not misconduct.

---

## 4. On the Record — a hearing becomes a neighborhood ledger

**The moment.** Yesterday the Council's City Services committee held a 2 h 38 min hearing on the Rodent Action Plan. Residents from Allston, Beacon Hill, Jamaica Plain spoke. Officials described sensors, containers, baselines, a January 2027 installation. Almost nobody who lives on those blocks will ever watch it.

**The tool.**
1. Pull the official recording's captions. Segment by topic and by place mentioned. Extract *claims* (what someone said is true), *commitments* (who will do what by when) and *asks* (what residents requested), each with the quote span and a deep link to the exact second of the official video.
2. Tag each to a neighborhood or street when the text says so; never infer.
3. Resident view: "What was said about Allston yesterday" → 7 items, each playable. Commitment view: dated promises with their source (hearing timestamp, or the City web page that states the date), and a follow-up date.
4. Human review before anything is published; speaker attribution only from the agenda or an explicit self-introduction, otherwise "a resident" / "a City presenter".

**Why it is new.** Meeting-summary tools exist for private meetings and for legislative tracking at the state level. A place-indexed, timestamp-linked ledger of municipal hearings for residents does not, and the same pipeline works for every Massachusetts city and town that posts recordings (most do, under the Open Meeting Law culture).

**Why it fits.** Accessibility (deaf and hard-of-hearing residents get hearings as text with place filters). Civic Action's "trusted information" theme. A dramatic demo: a 158-minute video collapses into a ledger in the time it takes to say it, and every line proves itself with one click. The team already has the caption-audit tooling and the four inspected windows in document 16.

**Honesty boundaries.** Auto-captions contain errors; the link to the moment is the trust mechanism, and the reviewer step is not optional. No sentiment scores, no "promise broken" labels; just dated statements and what the record shows later.

---

## 5. Warrant — the town meeting decoder

**The moment.** Hanover votes on November 9, Dedham and Brewster on November 16, Fairhaven on November 17. Each voter receives or downloads a warrant: dozens of articles in legal form. Zoning articles under the MBTA Communities law, capital borrowing, bylaw changes. The quorum problem is real because the document is unreadable.

**The tool.** Upload the warrant PDF. For each article: what it does in plain language, what a *yes* and a *no* each mean, money involved and funding source, sponsor, Finance Committee or Select Board recommendation if printed, the page citation, and how to speak to it at the meeting (procedure differs between open and representative town meeting). A "my evening" tally: total borrowing proposed, articles that change my taxes, articles about my street. Nothing recommends a vote.

**Why it is new and Massachusetts-only.** Town meeting is the Commonwealth's signature civic institution and has essentially no software. Four real warrants are live in the next three weeks.

**Why it is ranked fifth.** Judges in Boston may never have attended one, so the 20-second legibility is weaker than concepts 1–3. Political neutrality must be visibly engineered (quote-only, no adjectives). Still, for a hub team at Babson (Wellesley) or UMass Amherst it may be the most resonant idea on this list.

---

## If the team stays on rodents: make RodentOps unmistakable

The current direction is RodentOps, an inspection-preparation tool for an environmental-services coordinator. It is credible but, as document 16 says, at risk of looking like an internal work queue the City may already have. Two fusions make it distinctive using only data verified today:

1. **Outcome states from the real closure notes (concept 3).** 4,111 of 5,236 closed rodent cases carry no outcome language; 508 say treated/abated; 360 duplicate; 122 no violation found. Put that on the queue: the coordinator's first screen is not "most complaints" but "closed without a stated outcome and re-reported within 30 days". That is a genuinely new signal, computed from public data, and it matches what the Council was told yesterday about baselines and follow-up.
2. **Hearing context cards (concept 4).** Beside a Jamaica Plain cluster, the three things said about Jamaica Plain at yesterday's hearing, each deep-linked to the video second. The coordinator's packet then contains complaints, outcomes, and the public record in one place.

Those two additions cost a classifier and a caption parser, both of which already have fixtures in this repository.

---

## Sparks (not developed, worth ten seconds each)

- **Pole notice decoder**: concept 1 generalized to every paper notice taped to a pole in Boston (zoning hearing, liquor license, street cleaning, film shoot). Same pipeline, broader ledger.
- **Space Saver Referee**: Boston tolerates space savers for 48 hours after a snow emergency ends (South Boston bans them). A tiny deterministic timer with the official declaration time. Pure delight, zero AI, surprisingly real (1,510 complaints this year).
- **Public comment composer for the CAPER** (comments open through November 9): find what the housing performance report says about your neighborhood and draft a comment in your own words with page citations.
- **New-to-Massachusetts civic calendar**: today is the voter registration deadline; early voting ends Oct 30; mail ballot request by Oct 27. A student-facing timeline with official sources. Not novel, but the dates make a good opening line for any video today.
- **Needle Pickup** (6,800 requests) and **Encampments** (777) are large categories; they involve vulnerable people and should not be a hackathon demo.

---

## Choosing in fifteen minutes, then proving the hardest dependency in twenty

| Concept | Prove this first (20 minutes) | If it fails |
|---|---|---|
| CurbCheck | A vision model extracts street, number range, date and hours from three photos of your own handwritten signs, and a fetch of the lookup page for that street parses into rows | Fall back to typed sign fields plus the lookup; the verification is still the product |
| Three Hours | A ten-segment schematic route with responsibility classes and a working deadline function on the ordinance's worked examples | Drop geography; keep the schematic and the one-tap report typing |
| What Actually Happened | The keyword classifier over 300 sampled closure notes agrees with a human on 90%+; one closing photo described sensibly | Drop photo reading; the outcome ledger alone is a result |
| On the Record | Captions for the Oct 23 hearing download and segment; ten extracted claims link to the right seconds | Use the four windows already audited in document 16 as the fixture |
| Warrant | One real warrant PDF (Hanover or Dedham) parses into articles with page numbers | Switch to a Boston docket hearing notice (concept 4's inputs) |

All five keep the team's non-negotiables: committed snapshot on the demo path, in-product citations, a human decision before any action, keyboard and screen-reader operability, root `/.kiro` with real specs, tests and steering, English description, public video under three minutes, SundAI submission by 8:00 p.m.

## Recommendation

Build **CurbCheck**. It is the only concept here that a judge understands from a muted phone screen, it stands on a live City ledger that no other team will find, its AI job is honest and visible, its verification is deterministic, and its "no match → report" path gives the human decision real teeth. Keep the pedestrian route view as the second half of the video; it is the accessibility story and it uses the identical data. If the team wants the strongest *accessibility-first* story instead, build **Three Hours** and let CurbCheck be the sequel.

## Sources checked this hour

- Boston 311 2026 export (CKAN resource `1a0b420d-99f1-4887-9851-990b2a5a6e17`, `datastore_search` and `datastore_search_sql`), queried 11:50–12:05 ET.
- Street Occupancy Permit Lookup: https://www.cityofboston.gov/streetoccupancy/search/ (HTTP 200; `?streetname=Commonwealth` → 420 rows).
- Moving-truck permit rules: https://www.boston.gov/departments/parking-clerk/reserve-parking-spot-your-moving-truck
- Snow rules: https://www.boston.gov/departments/public-works/rules-clearing-snow
- Snow Emergency Parking / Routes datasets: https://data.boston.gov/dataset/snow-emergency-parking and `snow-emergency-routes`
- Fake/unofficial sign reports: public 311 tickets at 311.boston.gov (e.g. `/tickets/101006216186`, `/tickets/BCS-00238557`)
- Election dates: Secretary of the Commonwealth voter information booklet; WBUR Oct 14, 2026 guide; NBC Boston guide.
- Town meetings: Hanover (Nov 9), Dedham (Nov 16), Brewster (Nov 16), Fairhaven (Nov 17) town pages.
- Council hearing recordings: boston.gov/city-council-tv; Oct 23 City Services hearing recording verified in document 16.
- Open311 probe: `mayors24.cityofboston.gov/open311/v2/services.json` → 503.
- RentSmart dataset (PDDL, last updated July 2024): https://data.boston.gov/dataset/rentsmart
