# Kiro prompt — write the final video script for Rat Audit Boston (brand: Piper)

> Production concept: some beats below depend on unfinished features. Use [demo-script.md](demo-script.md) for the implemented recording path. Do not present recommendations, approval/work orders, the assistant, or trial design as working features. Editable claims were corrected on October 24; existing video exports must be re-rendered before reuse.

Paste everything below the line into Kiro.

---

You are writing the FINAL demo-video script for Rat Audit Boston, brand name **Piper**, tagline **"Follow the rats."** Target length: under 3:00. One-take feel, YC-demo polish, data-journalism motion. Overwrite `docs/submission/video-script.md` with your output. Read every instruction before writing.

## 1. Read these first (source of truth, in this order)

1. `.kiro/specs/rat-audit/v2-spec.md` — the product as currently specified. Screens, §6 recommendation rules, §V5 Prove, §V7 privacy test.
2. `.kiro/specs/rat-audit/data-audit.md` — the validated numbers (tested live 2026-10-24).
3. `data/civic/CATALOG.md` and `data/civic/datasets/<name>/README.md` — the committed snapshot (saved 2026-10-18).
4. `docs/rat-audit/brand.md`, `docs/rat-audit/design-system.md`, `web/src/styles/piper.css`, `web/src/lib/design-tokens.ts` — Piper brand and UI tokens.
5. `docs/submission/beat4-animation.html` — the finished "Rings" graph motion (27 s, self-contained HTML). It is final; do not propose changes to it.
6. `docs/submission/video-script.md` — the previous draft. Keep what works, fix what §5 below says to fix.
7. `.kiro/KIRO_LOG.md`, `.kiro/hooks/`, `.kiro/agents/`, `.kiro/steering/`, `.kiro/settings/mcp.json` — for the "Built with Kiro" beat. Count what is actually there.

## 2. Hard rules (non-negotiable; violating any one fails the script)

- **Block level only.** The one on-screen location is exactly "Normandy St · Dorchester 02121". Never a house number. Never a person's, owner's, or staff name. Never invent one. (v2 §V7 property test enforces this.)
- **Every number on screen must come from §3 or §4 below, exactly as written.** If a number you want is not there, do not use it. If two sources disagree, use the data-audit value and add a one-line footnote in the script naming both sources.
- **Human in the loop.** The inspector approves every action; nothing is sent automatically. The Approve click must be visible and called out in the voiceover. This moment is scored.
- **At least one in-product source citation visible** (a `sources` row: name, URL, time). Scored.
- **Never recommend poison.** Sanitation, exclusion, enforcement, referral only.
- **A 311 count is a report, not a rat.** Say it once, on screen, in the Explore or Track beat.
- **Brand art stays off the real map.** Plague/Hamelin aesthetic is for the logo and title cards only. Map and data stay clean and civic.
- **Palette:** soot (near-black background), bone (off-white surfaces), brass (accent, first reports), vermilion (recurrence and alarm), Delft blue (city actions and forecast), oxblood (deep alarm). **Type:** Bodoni Moda for display, Atkinson Hyperlegible Next / Mono for UI and data.
- **Voiceover budget:** 150 words per minute maximum. Under 3:00 means the whole voiceover is at most 430 words. Count them and print the count at the end.
- **Live badge** visible in the product beats; if the data is seeded, the badge says "seeded".

## 3. The Normandy St story (the emotional core; every fact below is approved)

Citywide frame:
- 5,321 rodent reports in Boston in 2026, already more than all of 2025.
- 99% of cases are marked closed.
- 407 addresses got a NEW report 30+ days after an earlier one.
- Across Boston's 46 chronic addresses (5+ reports), 237 of ~280 recorded actions were "monitoring"; only 14 were violations. The records do not establish which response works better.

One block, Normandy St · Dorchester 02121, 2025-03 to 2026-06: 18 separate rodent reports. The city closed each case within days, then it was reported again. The 311 closure actions, in order:
1. Area inspector monitoring (2025-03)
2. Inspector asks landlord to clear overgrown foliage in rear (2025-08)
3. Citation issued for overgrown weeds (2025-08)
4. Violation issued by code enforcement (2025-08)
5. Ticket issued by code-enforcement officer (2025-09)
6. Inspector confirmed rodent activity → abatement order (2025-10)
7. Violation issued; placed in for collections (2025-10)
8. Referred to code enforcement for trash issues (2025-11)
9. Violation issued to owners of the adjacent lot (2025-12)
10. Rodent activity reported again (2026-01) and again (2026-06)

Nearby context includes a vacant lot classed "RES LAND (Unusable)". Within ~100 m in 2025: Illegal Dumping ×6, Improper Trash Storage (barrels) ×3, Pick up Dead Animal ×4, Poor Conditions of Property ×4, Rodent Activity at neighboring addresses ×4, the adjacent vacant lot ×1.

Resolution line: "Review the block around each report."

## 4. The data report (what the product is built on; use for Track, Explore, Predict)

Snapshot: 22 datasets, all committed as static CSV in `data/civic/datasets/`. Four drive the demo:

| Dataset | What it is | Rows | Source |
|---|---|---:|---|
| boston-311 | 311 service requests | 5,000 | data.boston.gov |
| permits | Approved building permits | 8,240 | data.boston.gov |
| violations | Code / property violations | 2,018 | data.boston.gov |
| neighborhoods | Per-neighborhood population + income | 24 | data.boston.gov |

Other layers available for the Explore beat (name them, do not invent rows): numina street sensors 245,555; vision-zero crashes 44,986; bluebikes 63,063; ej environmental-justice block groups 2,604; mbta-stations 170; colleges 206; fema declarations 415. Cambridge and Somerville counts, scorecard, ipeds, onet, openalex-works, mbta-alerts and mbta-routes exist as context only.

Join keys: `ward` (311, permits, violations), `zip` / `zip_code` (311, permits, violations), `neighborhood` (311 → the 24 neighborhoods). One ward or ZIP ties a 311 complaint, a building permit, a code violation and the neighborhood's people-and-income context to one place.

Tested signals (ward-month cells; these are the labels for the Explore legend):

| Signal | Strength | Read |
|---|---:|---|
| Warm months → more reports | +0.87 | Strongest effect. Summer is rat season. |
| Last year's reports here | +0.32 | Rats come back to the same blocks. |
| Trash storage problems (311 + code) | +0.17 | Real but smaller. |
| Dead-animal + indoor-pest reports | +0.11 to +0.14 | Early warning before a hot spot. |
| Rain, snow, demolitions, restaurants | ~0 | Honest nulls. Shown as "no association detected". |

One-sentence version: rats follow heat and trash, and they come back to the same place, so we forecast where, and a human picks the next action.

Overlaps that make a hot spot: 311 trash reports and code violations in the same ward (reported and cited); rat reports in a low-income neighborhood (311 counts are lower where vulnerable people live, so we flag under-reporting, not fewer rats); forecast high but ≤ 1 report in 12 weeks (an emerging hot spot, act before it blows up).

Real vs live: the demo path is the committed CSVs, nothing breaks on stage. The live path refreshes the same tables from data.boston.gov through read-only calls; every number cites its `sources` row.

**Reconcile before you write:** the animation says 5,321 reports in 2026; the snapshot table says boston-311 has 5,000 rows. These are not the same measure. Find in data-audit.md which query produced 5,321 and write one footnote in the script that states the source of each number. Do not change either number.

## 5. The Rings motion and where it goes (do not duplicate numbers across beats)

`beat4-animation.html` is one 27-second piece with seven scenes. Use it as three slices; open the file with the URL parameters shown and screen-record the 1920×1080 stage. The stage auto-stops at `to`.

| Script beat | URL | Length | What plays |
|---|---|---:|---|
| Beat 0 (logo) | `beat4-animation.html?t=23.7` | 3.6 s | the exploded card collapses into one pin, "Review the block around each report." |
| Beat 1 (paradox) | `beat4-animation.html?t=0&to=10.3` | 10 s | 5,321 counts up; "99% closed" cracks; "but 407 addresses came back" |
| Beat 2 (reveal) | `beat4-animation.html?t=10.3&to=27.3` | 17 s | 46 / 237 / 14 strip; Normandy St block, 18 pins; the escalation ladder with a vermilion ring on every "reported again"; the vacant lot ignites with dumping ×6, dead animal ×4, improper trash ×3; collapse to one pin |

The Beat 2 slice ends on a single pin at centre frame. **Match-cut** to the live product map with the Normandy St pin selected at the same spot. That cut is the signature moment of the video; write it as its own shot.

## 6. Beat structure (use these timings; total 2:55)

| # | Beat | Time | Product on screen | Evidence woven in |
|---|---|---|---|---|
| 0 | Who is Piper | 0:00–0:12 | Logo sets over the pin collapse; fast transition into the real Piper UI (map + queue) | Rings slice (3.6 s) |
| 1 | Track | 0:12–0:42 | Site queue (Review suggested first), map, Live badge; click the top Review suggested site, map flies | News wall 4 s → Rings slice 0–10.3 s → back to product |
| 2 | Analyze | 0:42–1:15 | Case panel on Normandy St (5 s) → Rings slice 10.3–27.3 s full-screen (17 s) → raw 311 rows with real dates and scrubbed closure notes (5 s) → match-cut to the pin on the live map (4 s) | the 311 rows are the citation |
| 3 | Act | 1:15–1:40 | Recommendation by the §6 rules with its "because" line and sources; inspector clicks **Approve**; draft work order prints, "Draft — for inspector use", check-again date = today + 60 days | After the approve, 4 s: the vacant-lot parcel record, then one card: "NYC cut rat sightings 20%+ with containerization. These records do not establish which response lasts." |
| 4 | Explore | 1:40–2:05 | Flip depth to Explore; layer groups Rat signals, Food & trash, Shelter, Displacement; hover exactly ONE layer so its tested label shows ("Demolitions: no post-work report spike detected"); dock Ask and type one question ("Compare returns after citations vs monitoring in Dorchester since 2025"); it answers from tools, cites sources, moves the map | the signal table in §4 |
| 5 | Predict + Prove | 2:05–2:20 | Queue "Review suggested" flag (4 s); Prove screen: matched pairs, one gets containers, the measure sentence "returns in 60 days, treatment vs comparison" (8 s) | "Evaluating outcomes requires field follow-up and a defined comparison." |
| 6 | Built with Kiro | 2:20–2:45 | Four clips, not seven: `.kiro/specs/rat-audit/` tree; one hook firing on save; `.kiro/agents/civic-judge.json`; MCP (City of Boston OpenContext + Supabase) live. Then ONE card with the verified counts | counts you verified in §1 item 7 |
| — | Close | 2:45–2:55 | Map, one pin selected, the approved action showing. Bodoni title "Piper — Rat Audit Boston". Tagline "Follow the rats." | — |

Beat-level rules:
- Beat 0 is 12 seconds, not 20. The logo is the pin collapse, not a separate animation.
- Beat 1 and Beat 2 never show the same number twice. 5,321 / 99% / 407 live in Beat 1 only. 18 / the ladder / the lot live in Beat 2 only.
- Beat 3: nothing competes with the Approve click. Evidence cards come after it.
- Beat 4: one hover, one question. No tour of period presets or point/heatmap toggles.
- Beat 5: Prove stays in the main cut at 12 s max. Trial mechanics go to the written submission.
- Beat 6: each clip ≥ 4 s. Numbers only on the final counts card.

## 7. Voiceover guidance

Plain, confident, civic. No jokes about rats. No "AI decides". Short sentences. Each beat's voiceover should say what the viewer is seeing plus one fact. Opening line (keep or improve, same meaning): "In the legend, the Piper followed the rats out of Hamelin. Boston has a rat problem it can't solve by closing cases. Piper follows the rats to where they actually come from, and helps the city act." Closing line: "Piper. Boston closes cases. We help it close blocks."

## 8. Output format (write exactly this, in this order)

1. **Title block:** name, tagline, target length, date, the sources list from §1.
2. **Beat table:** the §6 table with your final timings.
3. **Per-beat script.** For each beat: `Product` (what is on screen, which component: e.g. `web/src/components/act/SiteQueue.tsx`, `InspectorPanel.tsx`, `SiteCase.tsx`, `map/LayerPanel.tsx`, `tested.ts`, `chat/ChatPanel.tsx`), `Evidence` (the cutaway and its source), `On-screen text` (verbatim, every number from §3/§4), `Voiceover` (verbatim), `Why this beat` (one line).
4. **Shot list:** one row per shot, with start time, duration, source (product screen / animation slice URL / cutaway asset), and the one thing the viewer must read.
5. **Voiceover word count** and seconds-per-beat check against 150 wpm.
6. **Recording checklist**, including: block-level only; Approve click visible; one source citation visible; Live or "seeded" badge visible; one "no association detected" label visible; brand art never over the map; Kiro counts re-verified after pull; final file public, under 3:00.
7. **Footnotes:** the 5,321 vs 5,000 reconciliation, and any other place two sources differ.
8. **Open questions for the team:** at most three, each answerable with yes/no.

Do not add facts, datasets, numbers, dates, names or screens that are not in the files you read or in §3/§4 above. If something you need is missing, say so in the open questions instead of inventing it.
