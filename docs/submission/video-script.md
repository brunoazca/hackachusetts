# Piper — Rat Audit Boston · Final demo-video script

**Name:** Piper (Rat Audit Boston) · **Tagline:** "Follow the rats." · **Target:** 2:55 (under 3:00) · **Written:** 2026-10-24

**Required motion-graphics instructions for Claude:** Read and follow [Motion graphics from scratch — Claude master prompt](motion-graphics-from-scratch-claude.md) before creating or revising original animated inserts, titles, diagrams, data graphics, or transitions. Include that document's **Master prompt** with this script when handing the work to Claude. Build those graphics from editable text, shapes, vector paths, and code; follow its composition, typography, timing, easing, choreography, deterministic rendering, and quality-check instructions.

Use this script and any supplied shot plan for the approved copy, facts, shot order, durations, and output settings. Piper's supplied brand rules, privacy requirements, factual caveats, and the under-three-minute limit take precedence over the guide's generic defaults. The guide governs authored motion graphics; keep the real product captures and published evidence required by this script. Validate a short animation sample before rendering the full sequence.

**Sources read (in this order):**
1. `.kiro/specs/rat-audit/v2-spec.md` (screens, §6 rules, §V5 Prove, §V7 privacy test)
2. `.kiro/specs/rat-audit/data-audit.md` (validated numbers, tested 2026-10-24)
3. `data/civic/CATALOG.md`, `data/civic/datasets/boston-311/README.md` (snapshot saved 2026-10-18)
4. Piper brand and UI tokens: `docs/rat-audit/brand.md`, `docs/rat-audit/design-system.md`, `docs/design/foundations/motion.md`, `web/src/styles/piper.css`, `web/src/lib/design-tokens.ts`. **These are only on branch `feat/piper-ui`** (local worktree `hackachusetts-piper-ui`). They are not on `main` yet.
5. `docs/submission/beat4-animation.html` (final; scene times read from its code)
6. Previous draft of this file
7. `.kiro/KIRO_LOG.md`, `.kiro/hooks/`, `.kiro/agents/`, `.kiro/steering/`, `.kiro/settings/mcp.json` (counted after the pull of 2026-10-24)

**Palette (Piper "Hamelin", night):** soot `#0F0D0C` background · bone `#EDE6DA` text and surfaces · brass `#C9A55C` accent and first reports · vermilion `#F0643C` recurrence · Delft `#8FAEE0` city actions and forecast · oxblood `#7A1E2C` deep alarm and seal. **Type:** Bodoni Moda (display, italic, 28 px and up) and Atkinson Hyperlegible Next / Mono (UI and data).

---

## 1. Beat table

| # | Beat | Time | Product on screen | Evidence woven in |
|---|---|---|---|---|
| 0 | Who is Piper | 0:00–0:12 | Wordmark sets over the pin collapse, then a transition into the real UI (map and queue) | Rings slice `?t=23.7` (3.6 s) |
| 1 | Track | 0:12–0:42 | Site queue (Due first), map, Live badge; click the top Due site, the map flies | News wall (4 s), then Rings slice `?t=0&to=10.3` (10.3 s), then back to product |
| 2 | Analyze | 0:42–1:15 | Case panel (5 s), Rings slice `?t=10.3&to=27.3` full screen (17 s), match-cut to the live pin (4 s), raw 311 rows and the source line (7 s) | The 311 rows are the citation |
| 3 | Act | 1:15–1:40 | Recommendation with its "because" line; **Approve**; draft work order with check-again date | After Approve: parcel record (2 s), NYC card (5 s) |
| 4 | Explore | 1:40–2:05 | Depth to Explore; one layer hover with its tested label; one Ask question | Signal table card (6 s) |
| 5 | Predict + Prove | 2:05–2:20 | Due flag (4 s); Prove trial designer (7 s) | BRAP card (4 s) |
| 6 | Built with Kiro | 2:20–2:45 | Four clips: specs, a hook firing, civic-judge agent, MCP live | Counts card (6 s) |
| — | Close | 2:45–2:55 | Map with the approved action (6 s); title card (4 s) | — |

---

## 2. Per-beat script

### Beat 0 — Who is Piper (0:00–0:12)

- **Product:** none for the first 7 s. From 0:07, a 900 ms transition into the real app: `web/src/app/page.tsx` with `shell/TopBar.tsx`, `map/MapView.tsx`, `act/SiteQueue.tsx`. The wordmark is gone before the map appears.
- **Evidence:** Rings slice `beat4-animation.html?t=23.7` (3.6 s). The exploded card collapses into one pin.
- **On-screen text:** from the animation: "Normandy St · Dorchester 02121", "A block problem, not an address problem." Overlay in the edit, set over the collapse: wordmark **Piper** (Bodoni Moda Italic 500, brass on soot), then **Follow the rats.** (bone).
- **Voiceover:** "In the legend, the Piper led the rats out of Hamelin. Boston can't close its way out of rats. Piper follows them to their source, so the city can act."
- **Why this beat:** it says who Piper is in one breath and plants the single pin we return to.

### Beat 1 — Track (0:12–0:42)

- **Product (0:12–0:20):** `act/SiteQueue.tsx` with Due sites first, `map/MapView.tsx`, and the Live badge in `shell/TopBar.tsx`. If the data is seeded, the badge reads "seeded".
- **Evidence (0:20–0:24):** news wall. Use real published headlines from the outlets cited in `knowledge/15_boston_rat_audit.md` §2 and §5 (WGBH, Boston 25, City of Boston, Boston Globe). Screenshots only. Do not retype or edit a headline.
- **Evidence (0:24–0:34.3):** Rings slice `beat4-animation.html?t=0&to=10.3`. It plays 5,321 counting up, "99%" closed cracking, "but 407 addresses came back", then the 46 / 237 / 14 strip (see footnote 4).
- **Product (0:34.3–0:42):** click the Normandy St row in the queue (it must be the top Due site; see checklist). The map flies (900 ms) and the rings draw.
- **On-screen text:**
  - Caption, bottom left, once: **"Every count is a 311 report, not a rat."**
  - Queue: "Due". Badge: "Live · updated …" or "seeded".
  - Animation (as built): "5,321 rodent reports · 2026", "More than all of 2025.", "99%", "but 407 addresses came back", "a new report 30+ days after an earlier one", "Boston's chronic addresses · 5+ reports", "46", "237 of ~280 recorded actions were "monitoring"", "14", "Monitoring does not reduce recurrence. Escalation does."
- **Voiceover:** "This is Piper. Every rodent report in Boston, live, ranked by the sites that keep coming back. Rats are in the news. This year Boston logged 5,321 rodent reports. Last year, almost every case was closed. Yet 407 addresses came back. The top site in the queue is due again."
- **Why this beat:** it shows the product's front door and the paradox that justifies it.

### Beat 2 — Analyze (0:42–1:15)

- **Product (0:42–0:47):** `inspector/SiteCase.tsx` on "Normandy St · Dorchester 02121": counts, Due tag, timeline.
- **Evidence (0:47–1:04):** Rings slice `beat4-animation.html?t=10.3&to=27.3`, full screen. 18 pins drop; the escalation ladder runs with a vermilion ring on every "reported again"; the vacant lot ignites with its nearby reports; the card collapses to one pin at centre frame.
- **Product (1:04–1:08) — the match-cut:** cut on the final pin to the live map (`map/MapView.tsx`) with the Normandy St pin selected at the same spot on screen. Frame both so the pin does not move across the cut.
- **Evidence (1:08–1:15):** scroll the case timeline in `inspector/SiteCase.tsx` (real dates, scrubbed closure notes), then hold 2 s on the source line ("Sources: Boston 311 (2024–2026, live) and code enforcement (live)" in `SiteCase.tsx`; "Source: …" with Live / Daily / Static in `inspector/InspectorPanel.tsx`). This is the visible citation.
- **On-screen text:** "Normandy St · Dorchester 02121" and "one block · 2025-03 → 2026-06"; counter to **18**; ladder rows in order: monitoring (2025-03); clear overgrown foliage in rear (2025-08); citation for overgrown weeds (2025-08); code-enforcement violation (2025-08); ticket (2025-09); abatement order (2025-10); violation placed in for collections (2025-10); referred for trash issues (2025-11); violation to owners of the adjacent lot (2025-12); reported again (2026-01) and again (2026-06). Then "The real driver was next door.", "Illegal dumping ×6 · Dead animal ×4 · Improper trash ×3 · Poor conditions of property ×4 · Rodent activity at neighboring addresses ×4 · the adjacent vacant lot ×1", "A block problem, not an address problem."
- **Voiceover:** "Normandy Street, Dorchester. One block. Eighteen reports, each closed in days. The city climbed its whole ladder: monitoring, citations, a ticket, an abatement order, collections. Each one came back. The real driver was next door, a vacant lot. A block problem, not an address problem. Same pin, live in Piper. These are the city's own records, cited on screen."
- **Why this beat:** the true story makes the paradox concrete, and the match-cut proves the story lives in the product.

### Beat 3 — Act (1:15–1:40)

- **Product:** the recommendation in the case panel (`inspector/SiteCase.tsx`; Act flow per v2 §V3, **not built yet**, see open question 1). The inspector clicks **Approve**. The button turns to a check, the panel dims, the work order rises and the oxblood seal stamps (motion catalog "Approve" and "Seal"). Nothing else moves during the click.
- **Evidence (after Approve):** `inspector/ParcelCard.tsx` on the vacant lot (2 s), then one card (5 s).
- **On-screen text:**
  - Recommendation: **"Joint block visit · notice to the vacant lot's owner"**. Because line: **"Monitoring and citations were tried here. Reports came back each time. A vacant parcel is next door."** Sources listed under it.
  - Button: **Approve**.
  - Work order: **"Draft — for inspector use"**, **"Check again: <today + 60 days>"**.
  - Parcel card: **"RES LAND (Unusable)"**, "Source: Boston property assessment FY2026".
  - Card (bone on soot): **"NYC cut rat sightings 20%+ with containerization. Boston has no measured result yet."**
- **Voiceover:** "Piper suggests the next step and shows why: a block visit, and a notice to the lot's owner. The inspector decides, and clicks Approve. Piper drafts the work order and a check-again date. Nothing is sent on its own. New York measured its fix. Boston hasn't yet."
- **Why this beat:** the human decision is the scored moment; it gets the frame to itself.

### Beat 4 — Explore (1:40–2:05)

- **Product (1:40–1:44):** the Depth control in `shell/TopBar.tsx` flips Simple → Explore. `map/LayerPanel.tsx` shows the groups **Rat signals, Food & trash, Shelter, Displacement**.
- **Product (1:44–1:50):** hover exactly one layer. Its tested label comes from `map/tested.ts`. Target label: **"Demolitions: tested, no effect"** (needs a `demolition` entry in `tested.ts`; see open question 3). Fallback that exists today: **"Construction debris — no effect"**.
- **Evidence (1:50–1:56):** signal table card, drawn as five labelled bars.
- **Product (1:56–2:05):** dock Ask (`chat/ChatPanel.tsx`, **a 6-line stub today**; see open question 1). Type one question. The answer comes from tools, cites sources, and moves the map. Do not voice or caption numbers from the answer.
- **On-screen text:**
  - Signal card: "Warm months → more rats **+0.87** · Last year's reports here **+0.32** · Trash storage problems **+0.17** · Dead-animal + indoor-pest reports **+0.11 to +0.14** · Rain, snow, demolitions, restaurants **~0 — tested, no effect**"
  - Ask input, verbatim: **"Compare returns after citations vs monitoring in Dorchester since 2025"**
- **Voiceover:** "Flip to Explore, and Piper becomes a full evidence map. We tested every layer. When one shows no effect, the legend says so. Heat and trash matter most, and rats return to the same blocks. And you can just ask. It answers from the data, cites it, and moves the map."
- **Why this beat:** it shows technical depth and honest nulls, which buys trust in everything else.

### Beat 5 — Predict + Prove (2:05–2:20)

- **Product (2:05–2:09):** the "Due" tag in `act/SiteQueue.tsx` ("Due = closed in the last 60 days at a site that has come back before").
- **Product (2:09–2:16):** Prove screen, trial designer (v2 §V5.1, **not built yet**). Matched pairs on the map; one site per pair gets containers.
- **Evidence (2:16–2:20):** BRAP card.
- **On-screen text:** "Due"; measure sentence **"Returns in 60 days, treatment vs comparison"**; card **"Boston's rodent plan: 20+ city departments. No published result."**
- **Voiceover:** "Piper flags sites due to come back, and sets up a fair test: matched pairs, one gets sealed containers. Boston's rat plan has never published a measured result."
- **Why this beat:** it moves from fixing one block to proving what works citywide, the gap no one fills today.

### Beat 6 — Built with Kiro (2:20–2:45)

- **Product:** Kiro, four clips, each at least 4 s:
  1. `.kiro/specs/rat-audit/` tree open (5 s): `requirements.md`, `design.md`, `tasks.md`, `data-audit.md`, `v2-spec.md`.
  2. A hook firing on save (5 s): `.kiro/hooks/accessibility-check.kiro.hook`.
  3. `.kiro/agents/civic-judge.json` and its review output (4 s).
  4. MCP live (5 s): a `boston-opendata` (City of Boston OpenContext bridge) tool call returning data.boston.gov rows. See footnote 6 for Supabase.
- **Evidence:** counts card (6 s).
- **On-screen text (counts card only, Atkinson Mono on soot):** **"8 hooks · 6 custom agents · 7 steering files · 5 spec files · 8 MCP servers · 14 migrations · 141 logged work entries"**
- **Voiceover:** "We built Piper with Kiro, spec first. Specs drove the tasks. Hooks check accessibility and secrets on every save. A judge agent reviewed our own build. And Boston's open data comes in live through MCP."
- **Why this beat:** the rules require specific, provable Kiro use; real files on screen prove it.

### Close (2:45–2:55)

- **Product (2:45–2:51):** the live map, Normandy St pin selected, the approved action showing in the panel. No brand art over the map.
- **Title card (2:51–2:55):** soot background. **"Piper — Rat Audit Boston"** (Bodoni Moda Italic, brass), **"Follow the rats."** (bone). The Line Rat mark may appear here.
- **Voiceover:** "Piper. Boston closes cases. We help it close blocks."
- **Why this beat:** it ends on the finished task and the name.

---

## 3. Shot list

| Shot | Start | Dur | Source | The one thing to read |
|---|---|---:|---|---|
| S01 | 0:00 | 3.6 s | `beat4-animation.html?t=23.7` + Piper wordmark overlay | "Piper" over the one pin |
| S02 | 0:03.6 | 3.4 s | Hold final frame + tagline overlay | "Follow the rats." |
| S03 | 0:07 | 5 s | Product: transition into map + queue | This is the app |
| S04 | 0:12 | 8 s | Product: `SiteQueue.tsx`, `MapView.tsx`, `TopBar.tsx` | "Every count is a 311 report, not a rat." |
| S05 | 0:20 | 4 s | Cutaway: news-wall screenshots | Boston rats are in the news |
| S06 | 0:24 | 10.3 s | `beat4-animation.html?t=0&to=10.3` | "but 407 addresses came back" |
| S07 | 0:34.3 | 7.7 s | Product: click Normandy St row, map flies | "Due" on the top row |
| S08 | 0:42 | 5 s | Product: `SiteCase.tsx` | "Normandy St · Dorchester 02121" |
| S09 | 0:47 | 17 s | `beat4-animation.html?t=10.3&to=27.3` | "The real driver was next door." |
| S10 | 1:04 | 4 s | Product: live map, same pin, same spot (match-cut) | Same pin, live |
| S11 | 1:08 | 7 s | Product: `SiteCase.tsx` timeline, hold on source line | "Sources: Boston 311 … live" |
| S12 | 1:15 | 8 s | Product: recommendation + because line | "Joint block visit · notice to the vacant lot's owner" |
| S13 | 1:23 | 3 s | Product: cursor clicks **Approve** | **Approve** |
| S14 | 1:26 | 7 s | Product: work order rises, seal stamps | "Draft — for inspector use" |
| S15 | 1:33 | 2 s | Product: `ParcelCard.tsx` | "RES LAND (Unusable)" |
| S16 | 1:35 | 5 s | Cutaway card | "Boston has no measured result yet." |
| S17 | 1:40 | 4 s | Product: Depth → Explore, `LayerPanel.tsx` | The four layer groups |
| S18 | 1:44 | 6 s | Product: hover one layer (`tested.ts`) | "tested, no effect" |
| S19 | 1:50 | 6 s | Cutaway: signal table card | "Warm months → more rats +0.87" |
| S20 | 1:56 | 9 s | Product: Ask (`ChatPanel.tsx`), map moves | The question, then a cited source |
| S21 | 2:05 | 4 s | Product: `SiteQueue.tsx` Due tag | "Due" |
| S22 | 2:09 | 7 s | Product: Prove trial designer | "Returns in 60 days, treatment vs comparison" |
| S23 | 2:16 | 4 s | Cutaway: BRAP card | "No published result." |
| S24 | 2:20 | 5 s | Kiro: `.kiro/specs/rat-audit/` | `v2-spec.md` |
| S25 | 2:25 | 5 s | Kiro: hook firing on save | `accessibility-check` |
| S26 | 2:30 | 4 s | Kiro: `civic-judge.json` | Judge agent |
| S27 | 2:34 | 5 s | Kiro: `boston-opendata` MCP call | Live data.boston.gov rows |
| S28 | 2:39 | 6 s | Counts card | "8 hooks · 6 custom agents …" |
| S29 | 2:45 | 6 s | Product: map, pin, approved action | The approved action |
| S30 | 2:51 | 4 s | Title card | "Piper — Rat Audit Boston" |

Ends at **2:55**.

---

## 4. Voiceover word count (limit 150 wpm, 430 words total)

| Beat | Seconds | Words | Ceiling at 150 wpm | OK |
|---|---:|---:|---:|---|
| 0 | 12 | 30 | 30 | yes (150 wpm) |
| 1 | 30 | 50 | 75 | yes (100 wpm) |
| 2 | 33 | 59 | 82 | yes (107 wpm) |
| 3 | 25 | 47 | 62 | yes (113 wpm) |
| 4 | 25 | 51 | 62 | yes (122 wpm) |
| 5 | 15 | 28 | 37 | yes (112 wpm) |
| 6 | 25 | 35 | 62 | yes (84 wpm) |
| Close | 10 | 9 | 25 | yes (54 wpm) |
| **Total** | **175** | **309** | **430** | yes (106 wpm avg) |

Counted on written words. "5,321" and "2025" count as one word each but take longer to say; Beats 1 and 2 have room for that.

---

## 5. Recording checklist

- [ ] Block level only: the one location is "Normandy St · Dorchester 02121". No house number. No person, owner or staff name, on screen or in the 311 notes shown.
- [ ] The **Approve** click is visible, unhurried, and nothing else moves during it.
- [ ] One source citation is visible (S11 source line; S15 parcel source).
- [ ] Live badge visible in product beats. If the data is seeded, it reads "seeded".
- [ ] "Every count is a 311 report, not a rat." appears once (S04).
- [ ] One "tested, no effect" label visible (S18).
- [ ] Brand art (wordmark, Line Rat, plague motifs) never over the real map. Only S01–S02 and S30.
- [ ] Normandy St is the top Due site in the queue when S07 is recorded.
- [ ] The match-cut (S09 → S10) keeps the pin at the same screen position.
- [ ] Record the animation slices at 1920×1080 with the URLs above. Each stops on its own at `to`.
- [ ] Piper UI (`feat/piper-ui`) merged to `main` and deployed before recording, so the product matches the brand.
- [ ] `v2-spec.md` and the `docs/submission/` files committed, so the public repo matches the Kiro clip.
- [ ] Kiro counts re-checked after the final pull (last check below).
- [ ] Final file is public and under 3:00.

---

## 6. Footnotes

1. **5,321 vs 5,000 are different measures. Neither is changed.**
   - **5,321** = Rodent Activity reports in the 311 **2026 yearly table** (resource `1a0b420d-99f1-4887-9851-990b2a5a6e17`) through 2026-10-23, queried live on 2026-10-24. Source: `knowledge/15_boston_rat_audit.md` §2 (2025 comparison: 5,225 in resource `9d7c2214-…`). It is **not** in `data-audit.md`; the prompt expected it there.
   - **5,000** = rows in the committed snapshot `data/civic/datasets/boston-311/data.csv`: all topics from the **new 311 system** (resource `254adca6-64ab-4c5c-9fc0-a6da622be185`), opened 2026-10-08 to 2026-10-18. It has no rodent category (rodent reports live only in the yearly tables, per `knowledge/15` §3).
2. **Trash storage:** the §4 signal table and `data-report.md` say **+0.17** (code enforcement, residential trash, *assoc*, `data-audit.md` §2). `web/src/components/map/tested.ts` labels `trash_storage` **+0.18** (311 new system, *predict*). The signal card uses +0.17. The layer hover is not on this layer, so the two do not appear side by side.
3. **BRAP size:** `knowledge/15` §2 says 10 agencies (WGBH, July 2024). §5 of the same file says "20+ city departments" (City of Boston, rat summit). The script says "more than twenty city departments", which matches the City's own page.
4. **46 / 237 / 14:** in the animation this strip plays at 7.8–10.3 s, so it falls in the Beat 1 slice, not Beat 2. No number repeats across Beats 1 and 2.
5. **Shot order in Beat 2:** §6 of the brief listed 311 rows before the match-cut; §5 says the match-cut follows the slice's last frame. The script puts the match-cut first so the signature cut works. Durations are unchanged (rows get 7 s, including a 2 s hold on the source).
6. **MCP:** `.kiro/settings/mcp.json` holds 8 servers: boston-opendata, massgis, cambridge-opendata, somerville-opendata, civic-snapshots, mbta, aws-docs, playwright. Supabase MCP was added in a teammate's local Claude config (`KIRO_LOG.md`, 13:44), not in the repo. Show Supabase only if it is live in Kiro on the recording machine.
7. **Normandy St = 18:** the approved address-level count (`docs/rat-audit/demo_site.md`). v2-spec §10 notes the count under the new 50 m site rule is not verified yet.
8. **Recommendation rule:** v2-spec §6 is first-match-wins. Rule 1 (monitoring at least twice, return after each) matches first, but its options (citation, abatement order) were already tried here. The script shows the Rule 2 output (vacant parcel within 40 m). See open question 2.
9. **Animation vs Piper brand:** the animation is final and uses its own palette (`#0e1116` background, amber, teal, red) and ends on the caption "Rat Audit Boston". The Piper UI uses the Hamelin palette above. In Beat 0, the "Piper" wordmark is overlaid in the edit over the collapse.
10. **Kiro counts** (re-checked 2026-10-24, `main` at `847218f`): 8 hooks, **6 agents** (`a11y-auditor` was added in `43eda6a`), 7 steering files, 5 spec files, 8 MCP servers, 14 migrations, **141** `###` work entries in `KIRO_LOG.md` (1,146 lines).
11. **Which year:** 5,321 is 2026 (through Oct 23). The 99% closed figure and the 407 recurring addresses are from 2025 (`knowledge/15_boston_rat_audit.md` §2). A teammate's edit to Beat 1 caught this, so the voiceover says "last year". The animation is final and shows "99%" right after the 2026 count, so the voiceover carries the year.
11. **Which year each paradox number belongs to.** 5,321 is **2026** (through Oct 23). 99% closed, 407 recurring addresses and 46 chronic addresses are **2025** full-year figures (`knowledge/15_boston_rat_audit.md` §2: 5,167 closed of 5,225; 407 addresses with a new report 30+ days after an earlier one; 46 addresses with 5+ reports). The animation shows them without a year, which is accurate; the Beat 1 voiceover now says "last year" for the 2025 figures so the two are not conflated.

---

## 7. Open questions for the team (yes / no)

1. Will Approve, the draft work order, Ask and the Prove trial designer be live on the deployed app before recording? (None are in `web/src` today; `ChatPanel.tsx` is a stub.)
2. Should Normandy St show the Rule 2 recommendation (joint block visit and notice to the lot owner), even though Rule 1 matches first?
3. Should we add a `demolition` entry ("tested, no effect", from `data-audit.md` §3) to `tested.ts` so the S18 hover reads "Demolitions: tested, no effect"?

---

## 8. Capture and motion direction (for the recording agent)

Paste this section into Claude (or whichever agent records the demo) together with sections 1–7. The full timeline is editable data in `docs/submission/shot-plan.json`; this section explains how to use it.

### 8.1 Role and feel

Act as a product-demo director, motion designer, browser-automation engineer and video editor. The video should feel like a confident founder showing a product they have used on real data: direct, calm, visually refined, easy to follow. Every move has a reason. The product does the talking; the edit just points.

Voice delivery: plain and unhurried, about 120–150 wpm, no hype words. Pause about 0.4 s after "Yet 407 addresses came back" (the 46 / 237 / 14 strip then plays without voice), after "Each one came back", and after "clicks Approve". Land the closing line slowly.

### 8.2 Project inputs

| Input | Value |
|---|---|
| Product | Piper (Rat Audit Boston). Live: [rat-ops.vercel.app](https://rat-ops.vercel.app). Local: `pnpm dev` in `web/`, bound to 127.0.0.1 only |
| Audience | Hackachusetts 2026 Civic Action judges. They may score from the video alone |
| Main takeaway | Boston closes 99% of rat cases but can't tell which fixes last. Piper shows why a block keeps coming back and lets an inspector approve the right next step |
| User | An ISD rodent inspector |
| Workflow | Open this week's queue → pick the top Due site → see why it keeps coming back → approve the next step → draft work order with a check-again date |
| Target / hard limit | 2:55 / under 3:00 (this replaces the usual 90–120 s default, because the rules allow 3:00 and require the Kiro beat) |
| Output | 1920×1080, landscape, MP4 (H.264 High, yuv420p), 60 fps, AAC 48 kHz |
| Narration | Script only. A team member records the voiceover. Until then, use a silent pacing track with captions. Use a generated voice only if the team approves it, and label it provisional |
| Brand | Piper "Hamelin" palette and type (title block above); motion tokens in `docs/design/foundations/motion.md` (branch `feat/piper-ui`) |
| Required proof | Approve click; one source citation; Live or "seeded" badge; one "tested, no effect" label; block-level location only |

### 8.3 The story, in one line per part

| Part | Content |
|---|---|
| Starting situation | The inspector has a queue of sites that keep coming back |
| Action | Picks the top Due site and opens its case |
| Product response | Shows the 18-report timeline, the city's whole ladder, and the vacant lot next door |
| Finished result | The inspector approves a block visit; Piper drafts the work order with a check-again date |
| Why it matters | The city stops fixing the wrong parcel and can finally measure what works |

Timing targets: the product is on screen by 0:07. The value is clear by 0:20 (the queue plus "Every count is a 311 report"). The first proof (5,321 / 407) lands at 0:24–0:31.

### 8.4 Rehearse the real product first

Do not use exploratory browsing as footage. Rehearse on the deployed app, write down what you find, then record clean takes.

| Check | What to confirm on Piper |
|---|---|
| Starting state | Top bar Mode = Act, Depth = Simple, Live badge showing "updated …" (or "seeded"). Normandy St · Dorchester 02121 is the top Due row in `act/SiteQueue.tsx` |
| Loading states | Map tiles and the MapLibre worker loaded; queue rows filled; no "Loading…" in `LayerPanel.tsx` |
| Controls used | Queue row; Depth segmented control (Simple / Explore); one layer row in `LayerPanel.tsx`; side-panel tab "Ask"; Approve button; Prove screen switch |
| Result locations | Case panel (right, 420 px wide); map centre after `flyTo`; work order sheet; layer tested label; Ask answer and its citation |
| Scroll containers | Side panel (`overflow-y-auto` in `shell/SidePanel.tsx`); layer panel (`overflow-y-auto`) |
| Steps that can fail | Refresh returns 429 within 5 minutes (do not press Refresh on camera); map fly lands under a panel; Ask shows "not configured"; Normandy St is not the top Due site |
| Screens not built yet | Approve, work order, seal, Ask, Prove, "seeded" badge (see open question 1) |

**Unbuilt screens.** Record only what really works. If a screen is still missing on recording day, either record the Piper mockup (`docs/design/mockup/index.html` on `feat/piper-ui`, which has Approve, the work order, the seal and Ask, but not Prove) with a small "Prototype" tag in the corner of those shots, or cut the shot and re-time the beat. Never fake a success state. Editing may shorten waiting, but it must keep the order of cause and effect, and it must not suggest a speed that was not measured.

### 8.5 Camera language

Three framing levels, the same all video long. Measure real coordinates in rehearsal; the shot plan names targets, not pixels.

| Level | Scale | Piper framing |
|---|---|---|
| Context | 1.0× | The whole app: top bar, map, side panel |
| Working | 1.3–1.5× | One region: the queue, the case panel, the layer panel, the Ask panel |
| Detail | 1.6–1.8× | Not used in this cut. The Approve button stays in a Working frame so the work order's landing area is inside the crop |

- Leave about 10% breathing room around the target. Keep the bottom 12% free for captions.
- Never crop away a tooltip, the tested label, the work order sheet, or the Ask answer that the next action reveals.
- The camera moves only for orientation, legibility, emphasis or continuity. It is still for about 97% of the runtime in this plan (moves total about 5 s).
- Far targets get a clean cut, not a long pan. Animation slices and cards are always 1.0× and static.

### 8.6 Motion settings (starting values; adjust after the sample)

All values live in `shot-plan.json` → `motion`. These are starting points for this production, not proven optimums.

| Setting | Value |
|---|---|
| Camera easing | `cubic-bezier(0.4, 0, 0.2, 1)`; frame-based: `eased = 6u^5 − 15u^4 + 10u^3` |
| Zoom in / reframe / zoom out | 600 ms / 800 ms / 650 ms |
| Settle before a key click | 300 ms |
| Dead zone (if tracking) | central 65% of the frame |
| Motion blur | off |
| Cursor | 1.35× size; local move 350 ms; nearby move 600 ms; hover 350 ms; click pulse 160 ms |
| Typing | 11 characters per second |
| Reading holds (minimum) | confirmation 1 s; short result 3 s; dense result 5 s, counted after the camera settles |
| Captions | 1–2 lines, 15–17 characters per second, Atkinson Hyperlegible Next 34 px, bone on soot at 82%, bottom-centre, max 70% width |
| Callouts | brass `#C9A55C` 2 px outline, 8 px radius, label 3–7 words in Atkinson 26 px, in 220 ms, out 150 ms |
| Transitions | clean cut by default; one 400 ms dissolve (title → app, S02 → S03) |

The product's own motion (map fly 900 ms, rings, Approve sheet with its small rotate, seal) is real UI and is recorded as it is. The rule against rotation and bounce applies to the edit's camera, not to the product.

### 8.7 Cursor choreography

- The pointer reaches the control before the click; the product's response starts after the click, never before.
- Keep the cursor still while a result is explained. Move it to empty map space if it covers text. Hide it during long reads (S08, S10, S14 after it moves away, S29).
- Drive the browser with eased paths (many small `mouse.move` steps along the quintic curve) so hover states are real. Log every event: time, x, y, target selector, target box.
- A browser driven by Playwright does not move the system cursor, so the screen recording has no pointer. Rebuild one cursor in the edit from the event log, drawn in app coordinates and given the same camera transform as the app. Never show two cursors. In the Kiro clips (S24–S27) the real system cursor is recorded; keep it still and add nothing.

### 8.8 Input, response and reading

- **Ask question (S20):** type "Compare returns after citations" at 11 characters per second (about 2.8 s), paste the rest, hold 0.4 s, press Enter. If the answer takes more than 2 s, cut the wait cleanly; it is not a speed claim.
- **Approve (S13):** the cursor arrives, hovers 350 ms, and clicks as the word "Approve" is spoken. The camera does not move during the click.

Reading-time check (at 16 characters per second, after the camera settles):

| Shot | Must read | Needs | Planned | Note |
|---|---|---:|---:|---|
| S04 | "Every count is a 311 report, not a rat." | 2.5 s | 6.5 s | ok |
| S11 | Source line | 4.1 s | 3.5 s | brass outline helps; check in sample |
| S14 | "Draft — for inspector use" and check-again date | 2.8 s | 5 s | ok |
| S15 | "RES LAND (Unusable)" | 1.2 s | 2 s | the source line is supporting only |
| S16 | NYC card (84 characters) | 5.3 s | 5 s | voiceover paraphrases it; check |
| S18 | Tested label | 1.9 s | 3 s | ok |
| S19 | Signal card | 9 s | 6 s | **too dense.** Bars carry it; the must-reads are the top bar and the "~0" bar. If the sample fails, keep only those two rows |
| S22 | "Returns in 60 days, treatment vs comparison" | 2.8 s | 5 s | ok |
| S23 | BRAP card | 4 s | 4 s | ok |
| S28 | Counts card (112 characters) | 7 s | 6 s | silent shot; check |

### 8.9 Attention cues (one at a time)

| Shot | Cue | Label (explains meaning) |
|---|---|---|
| S04 | label lane, bottom-left above captions | "Every count is a 311 report, not a rat." (required text) |
| S11 | brass outline on the source line | "The city's own records, cited" |
| S13 | stationary pointer on Approve | "A human approves every action" |
| S18 | brass outline on the tested label | "We label what doesn't work" |
| S20 | brass outline on the answer's citation | "Answers cite their sources" |
| S22 | brass outline on the measure sentence | "The first fair test of what works" |

No callout on any other shot. No animated backgrounds, frames or click sounds.

### 8.10 Capture and render pipeline

| Stage | Plan |
|---|---|
| A. Capture: product | Headed Chromium driven by Playwright, window 1920×1080 CSS px, `deviceScaleFactor: 2`. Record with the OS screen recorder at native Retina pixels (3840×2160), 60 fps. This needs a display that fits a 1920×1080-point window. Playwright's `recordVideo` records at CSS size only, so use it for rehearsal, not for 1.5× crops. If no Retina capture is possible, cap the camera at 1.0× and use cuts only; never upscale and call it sharp |
| A. Capture: animation | Open `beat4-animation.html` with the slice URLs in the same window. Each slice stops itself at `to`. No camera moves |
| A. Capture: cards | Render S05, S16, S19, S23, S28, S30 as HTML at 1920×1080 with `web/src/styles/piper.css` (from `feat/piper-ui`). Bodoni Moda only on S30 and the S01–S02 overlay |
| A. Capture: Kiro | OS screen recording of Kiro at Retina pixels |
| B. Edit | Drive the edit from `shot-plan.json`, frame by frame (Remotion if Node is available; otherwise Python plus ffmpeg). Camera crop, cursor and callouts share one coordinate system; captions are drawn in output space. Clamp crops so no empty edges show. Wait for fonts before rendering. No wall-clock timers, no unseeded randomness |
| C. Audio | Voiceover at −16 LUFS integrated, peaks at or below −1 dBTP. Music optional, ducked about 18 dB under speech. No sound effects on clicks or zooms |
| D. Encode and inspect | H.264 High, yuv420p, 1920×1080, 60 fps. Run `ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate:format=duration -of compact piper-demo.mp4` and watch the file itself at full size and at a small embed size |

Keep raw 4K captures outside the repo (they are large). Map every capture's timestamps to edit time with a sync marker at the start of each take.

### 8.11 Style sample first

Render S07–S08 (0:34.3–0:47, 12.7 s) before anything else. It has a context shot, a zoom in, a cursor move and click, a visible response (map fly, rings, case panel), a reading hold and a zoom out. Watch the encoded file at normal speed and check that:

- the focal point is obvious at once;
- the zoom settles cleanly, with no drift or jitter;
- the cursor lands before the click and the response follows;
- "Normandy St · Dorchester 02121" reads without pausing;
- nothing is blurred, clipped or covered by captions.

Adjust `motion` in `shot-plan.json`, then render the full video.

### 8.12 Acceptance checks

- **Clarity:** the first 20 s show a user, a task and the queue; each shot has one takeaway; the finished work order is clearly shown.
- **Framing:** no label, number or control is cut off or covered by captions or the cursor.
- **Motion:** no zoom without a reason; no zoom-out/zoom-in loops between nearby controls; nothing is read while the camera moves.
- **Timing:** every key click has a visible approach; holds pass the table in 8.8; total under 3:00.
- **Honesty:** every unbuilt screen is either real, tagged "Prototype", or cut; no faked success; numbers match sections 3–4 of the brief.
- **Technical:** check resolution, frame rate, duration and audio tracks with `ffprobe`; check every transition, the first and last frame, no double cursor, no black gaps, no cut-off audio.
- **Viewer test:** if possible, ask two people new to the project: "What does Piper do?", "What task did it finish?", "What proved it works?" If no one was asked, say so in the delivery note.

### 8.13 Deliverables

| File | Content |
|---|---|
| `docs/submission/video/piper-demo.mp4` | Final video (or a public link if the file is too large for git) |
| `docs/submission/video/piper-demo.en.srt` | Captions, timed to the recorded voice |
| `docs/submission/shot-plan.json` | Editable timeline and motion settings |
| `docs/submission/video/capture/` | Playwright script, event logs, sync notes |
| `docs/submission/video/edit/` | Edit project that renders from `shot-plan.json` |
| `docs/submission/video/README.md` | How to reproduce the render, plus open limits (unbuilt screens, prototype shots, viewer test done or not) |

Do not call the video done until it has been rendered and watched. If a tool is missing (Retina capture, Remotion, a voice), name the missing tool, deliver everything else, and write the next step that can be run.
