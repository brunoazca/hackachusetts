# Video Script — Rat Audit Boston (brand: **Piper**)

> Target: under 3:00. One-take feel, YC-demo polish. Grounded in the CURRENT spec
> (`.kiro/specs/rat-audit/v2-spec.md`) and brand **Piper** ("Follow the rats.").
> Every on-screen claim is backed by a committed data snapshot. The human
> decision point (inspector approves the action) is scored — it must be shown.

## The three things this cut does (your notes)

1. **Data & news are woven through the whole video**, not dumped at the start.
   Each loop step cuts briefly to the real-world evidence behind it (a headline, a
   311 number, the graph motion), then back to the product. Product and proof
   alternate.
2. **Explore gets its own beat.** It's the deep/technical flex: every layer, every
   filter, the timeline, the heatmaps — and each layer labelled with its *tested
   result*. That honest-science angle is the credibility moment.
3. **"Who/what is Piper" is established up front** and tied to the real UI (the
   other branch's Piper design system) and to the recurrence **graph motion we're
   building with Claude** (`beat4-animation.html`). Piper = the Pied Piper: it
   follows the rats to their real source so the city can act.

## Which script I'd shoot

The **product loop with the evidence braided in** — Track → Analyze → Act →
Predict → Prove, cutting to data/news at each step. It is the pitch ("Boston
closes 99% of cases but can't tell which fixes last"), it hits the scored
human-decision moment at Act, it shows the technical depth at Explore, and it ends
on Prove (the trial that measures what works) — the part no competitor has.

## Brand / aesthetic (Piper — carry it everywhere)

- Name **Piper** (Pied Piper of Hamelin). Tagline **"Follow the rats."**
- Palette: soot (near-black bg), bone (off-white surfaces), brass (accent),
  vermilion (recurrence/alarm), Delft blue (city actions/forecast), oxblood (deep alarm).
- Type: Bodoni Moda (display) + Atkinson Hyperlegible Next / Mono (UI + data).
- **Plague aesthetic is for the BRAND ONLY — never over a real neighborhood.**
  The map and data stay clean and civic.
- Motion: sleek, eased, data-journalism. **"Rings" = recurrence** (the graph
  motion). "Tune" motif auto-stops after ~8s. Respect reduced-motion.
- UI source of truth: the Piper design system on the other branch
  (`docs/rat-audit/design-system.md`, `web/src/styles/piper.css`,
  `web/src/lib/design-tokens.ts`). **Must be pushed before the UI matches the video.**

## The beats

| # | Beat | Time | Product | Evidence woven in |
|---|---|---|---|---|
| 0 | Who is Piper | 0:00–0:20 | Logo → UI reveal | Pied Piper line + graph motion |
| 1 | Track | 0:20–0:50 | Live map + queue | News wall + "99% closed, 407 back" |
| 2 | Analyze (data reveal) | 0:50–1:25 | Normandy St case | The Rings graph motion + 311 timeline |
| 3 | Act | 1:25–1:50 | Approve → work order | The vacant-lot record, NYC −20% context |
| 4 | Explore (technical) | 1:50–2:15 | Every layer + tested labels | The "tested, no effect" honesty |
| 5 | Predict + Prove | 2:15–2:35 | Due list + trial designer | BRAP has no measure today |
| 6 | Built with Kiro | 2:35–2:55 | .kiro montage | Real specs/hooks/agents/MCP |
| — | Close | 2:55–3:00 | One pin | "Follow the rats." |

---

## Beat 0 — Who is Piper (0:00–0:20)

**On screen:** soot background. The **Line Rat** mark draws itself; the word
**PIPER** sets in Bodoni; tagline **"Follow the rats."** Then a fast, elegant
transition INTO the real product UI (the Piper-styled map + queue), so the viewer
immediately knows Piper *is* the app, not a mascot. Underneath, one line of the
**Rings graph motion** pulses (borrow a 2–3s slice of `beat4-animation.html`).

**Voiceover:** "In the legend, the Piper followed the rats out of Hamelin. Boston
has a rat problem it can't solve by closing cases. **Piper** follows the rats to
where they actually come from — and helps the city act."

**Why this beat:** answers "who/what is Piper" in one breath, binds the name to
the UI, and plants the Rings motion you'll pay off in Beat 2.

---

## Beat 1 — Track (0:20–0:50) — product + the news/paradox woven in

**Product:** the live app. Landing is the **site queue** (Due first), map beside
it, Live badge updating. "Every rat report in Boston, live from the city's own
311." Click the top Due site; the map flies to it.

**Cut to evidence (~6s):** a quick news wall — Globe / WBZ / Boston 25 headlines
on Boston's rat crisis — resolving into the paradox in Piper type:
**5,321 reports in 2026 · 99% closed · 407 addresses came back.**

**Voiceover:** "The city logged 5,321 rat reports this year and closed almost all
of them — but 407 addresses came right back. Closed isn't gone."

Back to product. `web/src/components/map`, `act/SiteQueue.tsx`.

---

## Beat 2 — Analyze / the data reveal (0:50–1:25) — product + the graph motion

**Product:** the case panel opens on **Normandy St · Dorchester 02121**.
- Timeline: **18 reports**, each closed in days.
- **The Rings graph motion plays** (the Claude animation, `beat4-animation.html`):
  a vermilion ring blooms on every "closed" case that came back — the recurrence
  made visible. This is the signature moment and it ties straight to Beat 0.
- Escalation ladder: monitoring → clear foliage → weeds citation → code violation
  → ticket → abatement order → **collections** → trash referral → **violation to
  the adjacent lot's owner**.
- Within 100 m lights up: the **vacant lot** ("RES LAND (Unusable)"), illegal
  dumping ×6, dead animal ×4, improper trash ×3.

**Cut to evidence (~5s):** the raw 311 rows behind the timeline — real dates,
scrubbed closure notes — so a judge sees it's actual city data, cited in-product.

**Voiceover:** "One site in Dorchester. Eighteen reports in a year. Every ring is
a case the city closed — that came back. Because the real source is the empty lot
next door. Piper shows the city it's been fixing the wrong parcel."

The exploded card then **collapses back into a single pin** on the map.
`InspectorPanel.tsx`, `SiteCase.tsx`.

---

## Beat 3 — Act (1:25–1:50) — THE SCORED MOMENT, with the record on screen

**Product:** the recommendation appears by the §6 rules — *"Monitoring tried
here, reports returned each time + vacant parcel within 40 m → joint block visit;
notice to the lot's owner"* — each with a "because" line and **sources**. The
inspector **Approves** → a draft work order prints, "Draft — for inspector use,"
check-again date = today + 60 days.

**Cut to evidence (~4s):** the actual parcel record for the vacant lot, and a one
-line context card: "NYC cut rat sightings 20%+ with containerization — Boston has
no measured result yet."

**Voiceover:** "Piper recommends the step not tried here yet, and says why. A
human approves it — nothing is ever sent automatically. And it never recommends
poison; sanitation, exclusion, enforcement, referral only."

---

## Beat 4 — Explore (1:50–2:15) — the technical / depth flex

**Product:** flip the top-bar depth to **Explore**. The map blooms with every
layer group — **Rat signals, Food & trash, Shelter, Displacement** — plus
Points / Heatmap / Both, the period presets (7d → all), and the timeline Play.

**The credibility beat:** hover a layer and **its tested result shows in the
legend** — e.g. *"Demolitions: tested, no effect, ×1.01"*, *"Improper trash:
holds, strongest remaining driver"*. We ran the stats and we **label what didn't
work**. Then dock the **Ask** agent open and type one deep question
("Compare returns after citations vs monitoring in Dorchester since 2025"); it
answers from tools, cites sources, and sets the map layers to illustrate.

**Voiceover:** "Under the hood, Piper is a full evidence map — every signal the
city has. We tested each one. When a layer doesn't predict rats, we say so, right
on the legend. And you can just ask."

`web/src/components/map/LayerPanel.tsx`, `tested.ts`, `chat/ChatPanel.tsx`.

---

## Beat 5 — Predict + Prove (2:15–2:35) — product + "the gap"

**Product:** the queue's **"due to come back"** flag (base return rates), then
the **Prove** screen — the trial designer picks matched pairs of sites, assigns
one the containers, states the measure: returns in 60 days, treatment vs comparison.

**Voiceover:** "Piper flags the sites due to come back — and sets up the test
that finally measures what works. Boston's rodent plan spans twenty agencies and
has never published that number. This is how it gets one."

`act/SiteQueue.tsx`, Prove screen (v2 §V5).

---

## Beat 6 — Built with Kiro (2:35–2:55) — YC-demo montage

Fast montage, each ~2–3s:
- `.kiro/specs/rat-audit/` — requirements, design, tasks, data-audit, **v2-spec**
- A **hook firing** on save (accessibility-check / demo-path-green)
- `.kiro/agents/civic-judge.json` — a judge agent we ran against our own build
- `.kiro/steering/` — always-on rules keeping every change on-rubric
- A real **chat moment** — a prompt → Kiro writing a migration or component
- `.kiro/KIRO_LOG.md` — 1,000+ lines of logged teammate work
- MCP: City of Boston OpenContext + Supabase live on screen

**Voiceover:** "We built Piper with Kiro, spec-first — and Boston's open data
piped in live through MCP."

**Verify counts before recording** (moved after the pull). Last known: 8 hooks ·
5 agents · 7 steering · 5 spec files · 4 MCP servers · 11 migrations · 1,035 log lines.

---

## Close (2:55–3:00)

Back to the map, one pin selected, the approved action showing. Bodoni title:
**Piper — Rat Audit Boston.** Tagline: **"Follow the rats."**

**Voiceover:** "Piper. Boston closes cases. We help it close blocks."

---

## Recording checklist

- [ ] Block-level only on screen — "Normandy St · Dorchester 02121", no house
      number, no names. (v2 §V7 property test enforces this.)
- [ ] Beat 0 makes "Piper = the app" unmistakable, and shows the Rings motion.
- [ ] Each loop step cuts to its real evidence (news / 311 rows / parcel record).
- [ ] Explore shows at least one "tested, no effect" label — the honesty beat.
- [ ] The Approve step (human decision) is clearly shown — scored.
- [ ] At least one in-product source citation visible — scored.
- [ ] Live badge visible; if seeded, badge says "seeded".
- [ ] Plague/brand art never over the real map.
- [ ] Rings graph motion from `beat4-animation.html` is final.
- [ ] Kiro counts re-verified post-pull.
- [ ] Final file public, under 3:00.

## Open decisions for you

1. Is the Rings graph motion (`beat4-animation.html`) the SAME motion used in
   Beat 0 and Beat 2? (Recommended — one signature, paid off twice.)
2. Explore gets ~25s. Enough to land the "tested, no effect" point, or give it more?
3. Keep Prove in the main cut, or move it to the written submission to stay tight?
