# Piper — Rat Audit Boston · Final demo-video script

**Name:** Piper (Rat Audit Boston) · **Tagline:** "Follow the rats." · **Target:** 2:55 (under 3:00) · **Written:** 2026-10-24

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
| 3 | Act | 1:15–1:40 | Recommendation with its "because" line; **Approve**; draft work order with check-again date | After Approve: parcel record (2 s), NYC card (2 s) |
| 4 | Explore | 1:40–2:05 | Depth to Explore; one layer hover with its tested label; one Ask question | Signal table card (4 s) |
| 5 | Predict + Prove | 2:05–2:20 | Due flag (4 s); Prove trial designer (8 s) | BRAP card (3 s) |
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
- **Voiceover:** "This is Piper. Every rodent report in Boston, live from the city's own 311, ranked by the sites that keep coming back. Rats are in the news every week. This year Boston logged 5,321 rodent reports. Almost all are marked closed. But 407 addresses came back. At the worst sites, the city mostly monitors. The top site in the queue is due again."
- **Why this beat:** it shows the product's front door and the paradox that justifies it.

### Beat 2 — Analyze (0:42–1:15)

- **Product (0:42–0:47):** `inspector/SiteCase.tsx` on "Normandy St · Dorchester 02121": counts, Due tag, timeline.
- **Evidence (0:47–1:04):** Rings slice `beat4-animation.html?t=10.3&to=27.3`, full screen. 18 pins drop; the escalation ladder runs with a vermilion ring on every "reported again"; the vacant lot ignites with its nearby reports; the card collapses to one pin at centre frame.
- **Product (1:04–1:08) — the match-cut:** cut on the final pin to the live map (`map/MapView.tsx`) with the Normandy St pin selected at the same spot on screen. Frame both so the pin does not move across the cut.
- **Evidence (1:08–1:15):** scroll the case timeline in `inspector/SiteCase.tsx` (real dates, scrubbed closure notes), then hold 2 s on the source line ("Sources: Boston 311 (2024–2026, live) and code enforcement (live)" in `SiteCase.tsx`; "Source: …" with Live / Daily / Static in `inspector/InspectorPanel.tsx`). This is the visible citation.
- **On-screen text:** "Normandy St · Dorchester 02121" and "one block · 2025-03 → 2026-06"; counter to **18**; ladder rows in order: monitoring (2025-03); clear overgrown foliage in rear (2025-08); citation for overgrown weeds (2025-08); code-enforcement violation (2025-08); ticket (2025-09); abatement order (2025-10); violation placed in for collections (2025-10); referred for trash issues (2025-11); violation to owners of the adjacent lot (2025-12); reported again (2026-01) and again (2026-06). Then "The real driver was next door.", "Illegal dumping ×6 · Dead animal ×4 · Improper trash ×3 · Poor conditions of property ×4 · Rodent activity at neighboring addresses ×4 · the adjacent vacant lot ×1", "A block problem, not an address problem."
- **Voiceover:** "Normandy Street, Dorchester. One block. Eighteen reports between March 2025 and June 2026. The city climbed its whole ladder: monitoring, citations, a ticket, an abatement order, collections. Each case closed in days. Each ring is a report that came back. The real driver was next door, a vacant lot. A block problem, not an address problem. Same pin, live in Piper. These are the city's own records, cited on screen."
- **Why this beat:** the true story makes the paradox concrete, and the match-cut proves the story lives in the product.

### Beat 3 — Act (1:15–1:40)

- **Product:** the recommendation in the case panel (`inspector/SiteCase.tsx`; Act flow per v2 §V3, **not built yet**, see open question 1). The inspector clicks **Approve**. The button turns to a check, the panel dims, the work order rises and the oxblood seal stamps (motion catalog "Approve" and "Seal"). Nothing else moves during the click.
- **Evidence (after Approve):** `inspector/ParcelCard.tsx` on the vacant lot (2 s), then one card (2 s).
- **On-screen text:**
  - Recommendation: **"Joint block visit · notice to the vacant lot's owner"**. Because line: **"Monitoring and citations were tried here. Reports came back each time. A vacant parcel is next door."** Sources listed under it.
  - Button: **Approve**.
  - Work order: **"Draft — for inspector use"**, **"Check again: <today + 60 days>"**.
  - Parcel card: **"RES LAND (Unusable)"**, "Source: Boston property assessment FY2026".
  - Card (bone on soot): **"NYC cut rat sightings 20%+ with containerization. Boston has no measured result yet."**
- **Voiceover:** "Piper suggests the next step and shows why: a joint visit to the block, and a notice to the lot's owner. The inspector decides, and clicks Approve. Piper drafts the work order and sets a check-again date. Nothing is sent on its own. It never suggests poison. New York cut rat sightings with sealed bins. Boston has no measured result yet."
- **Why this beat:** the human decision is the scored moment; it gets the frame to itself.

### Beat 4 — Explore (1:40–2:05)

- **Product (1:40–1:44):** the Depth control in `shell/TopBar.tsx` flips Simple → Explore. `map/LayerPanel.tsx` shows the groups **Rat signals, Food & trash, Shelter, Displacement**.
- **Product (1:44–1:50):** hover exactly one layer. Its tested label comes from `map/tested.ts`. Target label: **"Demolitions: tested, no effect"** (needs a `demolition` entry in `tested.ts`; see open question 3). Fallback that exists today: **"Construction debris — no effect"**.
- **Evidence (1:50–1:54):** signal table card.
- **Product (1:54–2:05):** dock Ask (`chat/ChatPanel.tsx`, **a 6-line stub today**; see open question 1). Type one question. The answer comes from tools, cites sources, and moves the map. Do not voice or caption numbers from the answer.
- **On-screen text:**
  - Signal card: "Warm months → more rats **+0.87** · Last year's reports here **+0.32** · Trash storage problems **+0.17** · Dead-animal + indoor-pest reports **+0.11 to +0.14** · Rain, snow, demolitions, restaurants **~0 — tested, no effect**"
  - Ask input, verbatim: **"Compare returns after citations vs monitoring in Dorchester since 2025"**
- **Voiceover:** "Flip to Explore, and Piper becomes a full evidence map. We tested every layer against rodent reports. When a layer shows no effect, the legend says so. Heat and trash matter most, and rats return to the same blocks. And you can just ask. It answers from the data and moves the map."
- **Why this beat:** it shows technical depth and honest nulls, which buys trust in everything else.

### Beat 5 — Predict + Prove (2:05–2:20)

- **Product (2:05–2:09):** the "Due" tag in `act/SiteQueue.tsx` ("Due = closed in the last 60 days at a site that has come back before").
- **Product (2:09–2:17):** Prove screen, trial designer (v2 §V5.1, **not built yet**). Matched pairs on the map; one site per pair gets containers.
- **Evidence (2:17–2:20):** BRAP card.
- **On-screen text:** "Due"; measure sentence **"Returns in 60 days, treatment vs comparison"**; card **"Boston's rodent plan: 20+ city departments. No published result."**
- **Voiceover:** "Piper flags sites due to come back, and sets up a fair test: matched pairs, one gets sealed containers. Boston's rat plan spans more than twenty city departments. It has never published a measured result."
- **Why this beat:** it moves from fixing one block to proving what works citywide, the gap no one fills today.

### Beat 6 — Built with Kiro (2:20–2:45)

- **Product:** Kiro, four clips, each at least 4 s:
  1. `.kiro/specs/rat-audit/` tree open (5 s): `requirements.md`, `design.md`, `tasks.md`, `data-audit.md`, `v2-spec.md`.
  2. A hook firing on save (5 s): `.kiro/hooks/accessibility-check.kiro.hook`.
  3. `.kiro/agents/civic-judge.json` and its review output (4 s).
  4. MCP live (5 s): a `boston-opendata` (City of Boston OpenContext bridge) tool call returning data.boston.gov rows. See footnote 6 for Supabase.
- **Evidence:** counts card (6 s).
- **On-screen text (counts card only, Atkinson Mono on soot):** **"8 hooks · 5 custom agents · 7 steering files · 5 spec files · 8 MCP servers · 14 migrations · 140 logged work entries"**
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
| S12 | 1:15 | 9 s | Product: recommendation + because line | "Joint block visit · notice to the vacant lot's owner" |
| S13 | 1:24 | 3 s | Product: cursor clicks **Approve** | **Approve** |
| S14 | 1:27 | 9 s | Product: work order rises, seal stamps | "Draft — for inspector use" |
| S15 | 1:36 | 2 s | Product: `ParcelCard.tsx` | "RES LAND (Unusable)" |
| S16 | 1:38 | 2 s | Cutaway card | "Boston has no measured result yet." |
| S17 | 1:40 | 4 s | Product: Depth → Explore, `LayerPanel.tsx` | The four layer groups |
| S18 | 1:44 | 6 s | Product: hover one layer (`tested.ts`) | "tested, no effect" |
| S19 | 1:50 | 4 s | Cutaway: signal table card | "Warm months → more rats +0.87" |
| S20 | 1:54 | 11 s | Product: Ask (`ChatPanel.tsx`), map moves | The question, then a cited source |
| S21 | 2:05 | 4 s | Product: `SiteQueue.tsx` Due tag | "Due" |
| S22 | 2:09 | 8 s | Product: Prove trial designer | "Returns in 60 days, treatment vs comparison" |
| S23 | 2:17 | 3 s | Cutaway: BRAP card | "No published result." |
| S24 | 2:20 | 5 s | Kiro: `.kiro/specs/rat-audit/` | `v2-spec.md` |
| S25 | 2:25 | 5 s | Kiro: hook firing on save | `accessibility-check` |
| S26 | 2:30 | 4 s | Kiro: `civic-judge.json` | Judge agent |
| S27 | 2:34 | 5 s | Kiro: `boston-opendata` MCP call | Live data.boston.gov rows |
| S28 | 2:39 | 6 s | Counts card | "8 hooks · 5 custom agents …" |
| S29 | 2:45 | 6 s | Product: map, pin, approved action | The approved action |
| S30 | 2:51 | 4 s | Title card | "Piper — Rat Audit Boston" |

Ends at **2:55**.

---

## 4. Voiceover word count (limit 150 wpm, 430 words total)

| Beat | Seconds | Words | Ceiling at 150 wpm | OK |
|---|---:|---:|---:|---|
| 0 | 12 | 30 | 30 | yes (150 wpm) |
| 1 | 30 | 63 | 75 | yes (126 wpm) |
| 2 | 33 | 70 | 82 | yes (127 wpm) |
| 3 | 25 | 61 | 62 | yes (146 wpm) |
| 4 | 25 | 53 | 62 | yes (127 wpm) |
| 5 | 15 | 35 | 37 | yes (140 wpm) |
| 6 | 25 | 35 | 62 | yes (84 wpm) |
| Close | 10 | 9 | 25 | yes (54 wpm) |
| **Total** | **175** | **356** | **430** | yes (122 wpm avg) |

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
10. **Kiro counts** (checked 2026-10-24 after pulling `main`): 8 hooks, 5 agents, 7 steering files, 5 spec files, 8 MCP servers, 14 migrations, 140 work entries in `KIRO_LOG.md`.

---

## 7. Open questions for the team (yes / no)

1. Will Approve, the draft work order, Ask and the Prove trial designer be live on the deployed app before recording? (None are in `web/src` today; `ChatPanel.tsx` is a stub.)
2. Should Normandy St show the Rule 2 recommendation (joint block visit and notice to the lot owner), even though Rule 1 matches first?
3. Should we add a `demolition` entry ("tested, no effect", from `data-audit.md` §3) to `tested.ts` so the S18 hover reads "Demolitions: tested, no effect"?
