# Brand and product design — Piper (v3)

Serves `.kiro/specs/rat-audit/`. v3 replaces v2 ("Undertow"): Guilherme asked
for a brand that openly says **rats and plague**, but chic. History in §10.

## 0. Assumptions (from the spec)

- Rats are a *return* problem: cases close, rats come back (407 addresses). The
  most common response, monitoring, leaves the 60-day repeat rate flat
  (14.1% → 14.2%); a violation lowers it (15.3% → 12.2%). The cause is often next
  door.
- Users: ISD rodent inspectors (desk + phone in daylight), BRAP coordinator.
  Audience this weekend: judges watching a <3 min video.
- Equity is in the data: after controlling for 311 volume, tracts with more
  children, people of color and residents with disabilities file fewer rodent
  reports per resident (`data-audit.md` §4).

## 1. Name: **Piper**

> **Piper** — rat intelligence for Boston.
> **Follow the rats.**

The Pied Piper of Hamelin is Europe's best-known rat-control story (the legend
is medieval; the rats joined it by the late 1500s): a stranger who knows where
the rats go and leads them out. Everyone gets the reference in one second, and it is folklore, not filth.
It also carries a moral the city needs: the town that would not pay the piper
lost far more. Boston pays ≈ $776K a year in pest control (FY2026) for a response
that does not change the repeat rate.

Tagline: **Follow the rats.** It says what the product does: trace reports back
to the lot, the dumpster, the block that keeps feeding them. Pitch line for
the deck: *"Boston keeps paying. Piper shows where the rats actually go."*

| Shortlist | Tagline | Reference | Verdict |
|---|---|---|---|
| **Piper** | Follow the rats. | Pied Piper of Hamelin | **Pick.** Rat-obvious, mythic, YC-short. |
| Rattus | *Rattus norvegicus*, Boston. | Latin genus of the brown rat | Luxe, like a perfume house; colder on stage. Used as the specimen-label voice. |
| Beak | The doctor is in. | Plague doctor's mask | Very chic, but reads as plague first, rats second. Used as an Easter egg (§6). |
| Hamelin | The city that solved it. | The Piper's town | Beautiful, harder to say and spell. |
| Pestis | Know before it spreads. | *Yersinia pestis* | Too clinical, too dark for a civic tool. |

**Wordmark:** `Piper` in Bodoni Moda Italic 500, tracking −0.01em. Fashion-house
energy (didone = Vogue, Harper's Bazaar).

**Mark — the Line Rat:** a rat drawn in one continuous line, nose right; the
tail runs out behind it and straightens into a pipe with three holes (dots).
Rat and flute in one stroke. At 16 px: the rat head + tail line.

## 2. Emotional tone

**Dark folklore, made elegant.** An apothecary at night, a natural-history
museum after hours, a Venetian mask on a velvet stand. Witty, a bit theatrical,
and completely serious about the data.

The rat is allowed now, but only in three registers:
1. **Line art** (one-line mark, engraving-style plates): elegant, never fur
   texture or teeth.
2. **Taxonomy** (*Rattus norvegicus*, specimen labels, Latin): museum distance.
3. **Folklore** (the Piper, the plague doctor): story, not disgust.

Never: cartoon rats, photos of real rats, droppings, sewer greens, gore,
"infestation" language about places.

## 3. References

| Reference | Take | Leave |
|---|---|---|
| Aesop, Le Labo, Byredo (apothecary luxury) | Bone paper, specimen labels, generous margins, serif + mono | Fragrance softness |
| 19th-c. natural-history plates (engraved mammals) | Fine-line rat illustrations on bone, Latin captions | Sepia nostalgia, hunting scenes |
| *Medico della Peste* (Venetian plague-doctor mask) | The beak as a single elegant silhouette | Horror and goth styling |
| Bodoni / Vogue mastheads | Didone italics for headlines | Fashion-ad whitespace that hides data |
| Delft blue tableware (Dutch/German era of the legend) | Delft blue as the "forecast" color | Ornament |
| [Linear 2026 refresh](https://linear.app/now/behind-the-latest-design-refresh) | Near-achromatic UI, one accent, glass panels | Dev-tool density |
| [Felt map design guide](https://felt.com/blog/how-to-design-a-beautiful-map) | Fore / mid / background map hierarchy | GIS toolbars |
| [Urban Institute, Do No Harm](https://www.urban.org/research/publication/do-no-harm-guide-applying-equity-awareness-data-visualization) | "Would I feel offended if I were a data point?" | — |
| [Chartability](https://chartability.fizz.studio/), [Okabe–Ito](https://search.r-project.org/CRAN/refmans/see/html/scale_color_okabeito.html) | Accessible charts; color-blind-safe hues | — |

## 4. Color: "Hamelin"

Soot, bone, brass and vermilion: a plague-era apothecary, made modern. Warm =
what happened (vermilion returns), cool = what might happen (Delft forecast).
Brass is the brand and the buttons, never data.

### Night (desk, default)

| Token | Hex | Use | Contrast on Soot |
|---|---|---|---|
| `soot` | `#0F0D0C` | app, map land (warm black, not blue) | — |
| `velvet` | `#171412` | panels (80% + blur) | — |
| `walnut` | `#211D1A` | cards, inputs | — |
| `seam` | `#302A25` | hairlines | — |
| `ink-water` | `#121416` | map water | — |
| `bone` | `#EDE6DA` | primary text; **open report** dots | ≈16:1 |
| `ash` | `#B5ACA0` | secondary text | ≈8.4:1 |
| `mink` | `#968878` | tertiary text, labels, **closed** hollow dots. The color of rat fur. | ≈5.0:1 |
| `brass` | `#C9A55C` | brand, wordmark, primary button, focus ring | ≈8.0:1 |
| `vermilion` | `#F0643C` | **came back** (recurrence rings). The plague red. | ≈6.1:1 |
| `delft` | `#8FAEE0` | **forecast** (hatched cells), model labels | ≈8.3:1 |
| `verdigris` | `#6FA594` | **stayed closed 60+ days**, "what worked" | ≈6.6:1 |
| `oxblood` | `#7A1E2C` | stamps, the beak, print accents (fills only on night) | — |

Status is also shape: open = filled dot, closed = hollow dot, came back = ring,
forecast = hatch. Vermilion vs brass is separated by role (data vs UI) and by
luminance.

### Bone (field, print, work order)

| Token | Hex | Contrast on Bone |
|---|---|---|
| `bone` (bg) | `#EDE6DA` | — |
| `soot` (text) | `#0F0D0C` | ≈16:1 |
| `oxblood` | `#7A1E2C` | ≈8.2:1 |
| `brass-deep` | `#7E5A1A` | ≈5.1:1 |
| `delft-deep` | `#2C4F8C` | ≈6.5:1 |

## 5. Typography

| Role | Face | Why |
|---|---|---|
| **Display** | **Bodoni Moda** (italic for headlines, ≥ 28 px only) | The didone of fashion mastheads. High contrast reads as luxury and theatre. Variable, with optical sizes, on Google Fonts. |
| **UI + body** | **Atkinson Hyperlegible Next** | Braille Institute's face for low-vision readers; 7 weights, 150 languages. Keeps the accessibility story. |
| **Specimen labels / data** | **Atkinson Hyperlegible Mono** | Case ids, citations, Latin captions in small caps style: `RATTUS NORVEGICUS · OBS. 16`. |

Scale: hero 64/64 Bodoni italic; headline 36/40; title 18/26 Atkinson 600; body
16/24; data 13/20 mono, tabular. Bodoni hairlines vanish at small sizes, so it
never appears under 28 px or in controls.

## 6. Signature visuals

- **The Line Rat.** The mark, and a larger one-line plate on the landing page,
  end card and empty states. Bone line on soot.
- **Rings (recurrence).** Each return adds a thin vermilion ring around a site,
  like the ripples a plague map once drew around a pump. A chronic site is a
  target you can see across the city.
- **The Tune (follow the rats).** From a source (vacant lot, dumpster cluster)
  to the site, a dotted line of small brass dots spaced like notes on a stave
  drifts toward the site. That is the Piper's tune and the product's tagline in
  one visual. Labelled in mono: `vacant lot · 31 m`. Reduced motion: static.
- **Specimen labels.** Every site card has a museum label in mono:
  `SPECIMEN 03 · NORMANDY ST · 02121 · OBS. 16 · RETURNS 9`.
- **The Beak (Easter egg).** The plague-doctor silhouette appears only on the
  forecast lens icon and the 404 page ("The doctor couldn't find this page.").
  Forecast = the doctor's prognosis.

Motion: spring 280 ms; rings draw once; the Tune is the only continuous motion
and stops after 8 s (pause button). `prefers-reduced-motion` turns all of it off.

## 7. Equity: folklore for the brand, never for places

Plague imagery has a real history of blaming neighborhoods: in 1900 San
Francisco quarantined Chinatown during a bubonic plague scare. So the rule is
hard: **the plague and rat aesthetic is for the brand and the city's response,
never for a place or its people.**

- No "infested", "outbreak" or "plague" words about a neighborhood or block.
- Map shading uses rates (rodent reports per 100 total 311 reports), not raw
  counts, and never a red choropleth of neighborhoods.
- **Quiet isn't clean:** under-reporting tracts get a fine bone dot texture and
  a label ("fewer reports per resident here; may be under-counted").
- **Fair ranking** toggle: top 10 citywide or within each neighborhood (R3.14).
- **Two voices:** resident's words (scrubbed) beside the city's closure note.
- Owners and full addresses blurred until a logged reveal (R3.12).

## 8. Accessibility (WCAG 2.2 AA + Chartability)

Unchanged from v2 and still binding: list twin of the map; a sentence before
every chart; button alternatives to dragging; targets ≥ 24 px; focus never hidden
under glass; status in shape and words; `aria-live` for selection and chat; 200%
text; Bone (day) mode for phones in sunlight; color-blind simulator check before
recording. Line art and the Beak get `alt` text; decorative plates are
`aria-hidden`.

## 9. Key screens

1. **Canvas.** Warm-black map, bone dots, vermilion rings on chronic sites.
   Top-left: `Piper` + Live pill. ⌘K bar top-center. Timeline bottom.
2. **Dossier.** Specimen label eyebrow; Bodoni italic headline *Monitored
   eleven times.*; `9 came back` in vermilion; return timeline; Two voices; "What
   feeds it" drivers with the Tune to the vacant lot; Delft forecast bar with the
   beak glyph; recommended actions with *because* lines; Approve (brass) / Edit /
   Reject.
3. **Findings.** Editorial cards, Bodoni headlines (*Monitoring changes nothing.
   Violations do.*), one chart, strength pill, caveat, sources. Nulls included.
4. **Ask.** Mono tool ticker, chips that select features, drafts work orders.
5. **Work order.** A bone sheet rises over the dark map: Bodoni title, mono
   fields, an oxblood wax-seal-style stamp `DRAFT · FOR INSPECTOR USE`, follow-up
   date, Print.
6. **Field mode.** Bone palette, bottom sheet, large Approve.

### Demo moment
Black screen. The Line Rat draws itself; its tail becomes the pipe. `Piper.`
*Follow the rats.* The map fades in with vermilion rings across the city. ⌘K:
*"Where does monitoring keep failing?"* Fly to Normandy St. *Monitored eleven
times.* Brass notes drift from the vacant lot next door to the site. Approve.
The bone work order rises with its oxblood seal.

## 10. History

- v1 *Ratio* / "Stop closing cases. Start closing blocks." — tagline read as vague.
- v2 *Undertow* / "Closed isn't gone." — too abstract; no rats.
- v3 *Piper* / "Follow the rats." — rats and plague, through folklore, taxonomy
  and line art.

## 11. Tokens

```css
@theme {
  --color-soot: #0F0D0C;
  --color-velvet: #171412;
  --color-walnut: #211D1A;
  --color-seam: #302A25;
  --color-ink-water: #121416;
  --color-bone: #EDE6DA;
  --color-ash: #B5ACA0;
  --color-mink: #968878;
  --color-brass: #C9A55C;
  --color-vermilion: #F0643C;
  --color-delft: #8FAEE0;
  --color-verdigris: #6FA594;
  --color-oxblood: #7A1E2C;
  --color-brass-deep: #7E5A1A;
  --color-delft-deep: #2C4F8C;
  --font-display: var(--font-bodoni), "Didot", serif;
  --font-sans: var(--font-atkinson), system-ui, sans-serif;
  --font-mono: var(--font-atkinson-mono), ui-monospace, monospace;
  --radius-panel: 14px;
  --ease-spring: cubic-bezier(0.22, 1, 0.36, 1);
}
```

```ts
// web/src/app/layout.tsx
import { Bodoni_Moda, Atkinson_Hyperlegible_Next, Atkinson_Hyperlegible_Mono } from "next/font/google";
```
