# Imagery, icons and the rat

Part of the [Piper design standards](../README.md). Brand rationale: [`docs/rat-audit/brand.md`](../../rat-audit/brand.md).

## How the rat may appear

| Allowed | Where | Rules |
|---|---|---|
| **Line Rat** mark | logo, intro, end card, empty states, Ask avatar, seal | one continuous stroke; tail becomes the pipe; three holes. Tail and holes in `accent` only in the intro and wordmark lockup |
| *Rattus norvegicus*, specimen labels | eyebrows, Latin captions | mono, via `text-eyebrow` |
| **The Beak** (plague-doctor mask) | forecast lens icon, 404 | outline only, `forecast` or `fg-2`; never on a place |
| Engraving-style plates | landing page, video only | line art, bone on soot, `aria-hidden` when decorative |

Never: cartoon rats, photos of rats, droppings, teeth, tails as decoration on
data, sewer imagery, gore, or "infested", "plague", "outbreak" about a place.

## Line Rat construction

`viewBox="14 10 86 46"`: body path, ear arc, eye dot, and a tail path that runs
into a straight pipe at y = 50 with holes at x = 72, 81, 90 (r 2.1, stroke 1.5).
Stroke 2.2 at ≥ 32 px wide; 1.6 at hero sizes. Clear space = the ear's height on
all sides. Minimum width 28 px; below that use the wordmark alone. Source: the
`#rat-mark` symbol in `docs/design/mockup/index.html`.

### Icons

Lucide (`lucide-react`), stroke 1.5, sizes 16 / 18 / 20, `currentColor`. Custom
icons (Line Rat, Beak, driver glyphs) as inline SVG at the same stroke. Icon-only
buttons always have `aria-label` and a tooltip.

### Driver glyphs (outline, 14 px, stroke 1.5, `fg-2`)

| Lens | Glyph |
|---|---|
| Food (trash, restaurants, dumpsters) | □ square |
| Shelter (vacant lots, abandoned buildings, weeds) | ◇ diamond |
| Displacement (demolitions, excavation) | △ triangle |
| Protection (Big Belly bins) | ○ circle with center dot |
| Events (Sept 1 move-out) | ⬡ hexagon |
| Smart box (Cambridge) | ⊡ square with dot |

Glyphs never use hue, so the map stays two-tone and color-blind safe.
