# Color — "Hamelin"

Part of the [Piper design standards](../README.md). Values: [`tokens.json`](../tokens/tokens.json).

## The rules

1. **Warm = it happened. Cool = it might. Brass = you can act.** Vermilion marks
   returns, Delft marks forecasts, brass marks actions and brand. Never swap them.
2. **Semantic tokens only in components.** Write `text-fg-2`, `bg-card`,
   `text-return`. A raw hex or palette name in a component fails review. Only
   `tokens.json`, `web/src/styles/piper.css`, `web/src/lib/design-tokens.ts` and
   the generated `mockup/tokens.css` may hold hex values.
3. **Color is never alone.** Every data state also has a shape and, in lists, a word.
4. **The map is two-tone.** Bone dots on soot. Only returns get color. Drivers are
   outline glyphs, not hues.
5. **Brass is for doing, not for data.** No brass chart series or dots. One
   exception: the selection halo, which marks what you are acting on.
6. **Vermilion is never a button fill.** "Escalate" is an outlined `return`
   button; the solid button is always `accent`.
7. **`danger` is for the system, not the city.** Errors only, never data.
8. **No sewer greens, no hazard yellow, no red choropleths of neighborhoods.**

### Raw palette

| Name | Hex | Notes |
|---|---|---|
| soot | `#0F0D0C` | warm black |
| velvet | `#171412` | panel base |
| walnut | `#211D1A` | card |
| walnut-2 | `#2A2521` | hover on card |
| seam | `#302A25` | hairline (decorative only) |
| edge | `#6A5F55` | control borders (3.1:1 on soot) |
| ink-water | `#121416` | map water |
| bone | `#EDE6DA` | text / open dots / light bg |
| bone-2 | `#F5F0E6` | light panel |
| bone-3 | `#FBF8F2` | light card |
| ash | `#B5ACA0` | secondary text |
| mink | `#968878` | tertiary text, closed dots |
| brass | `#C9A55C` | brand, primary action |
| brass-hi | `#D8B872` | hover |
| brass-lo | `#B08E47` | pressed |
| vermilion | `#F0643C` | came back |
| delft | `#8FAEE0` | forecast |
| verdigris | `#6FA594` | held / what worked |
| oxblood | `#7A1E2C` | seal, stamps |
| error | `#FF7A6B` | system errors (night) |

Deep variants for Bone theme: brass-deep `#7E5A1A`, vermilion-deep `#A8381A`,
delft-deep `#2C4F8C`, verdigris-deep `#2F6B5A`, error-deep `#B3261E`,
fg-2 `#4F463E`, fg-3 `#6B6056`, line `#D8CFC1`, edge `#857868`.

### Semantic tokens

| Token | Night | Bone | Use |
|---|---|---|---|
| `bg` | soot | bone | app background, map land |
| `panel` | velvet @ 82% + blur | bone-2 @ 88% + blur | floating panels |
| `panel-solid` | velvet | bone-2 | panels under `prefers-contrast: more` / `prefers-reduced-transparency` |
| `card` | walnut | bone-3 | cards inside panels |
| `card-hover` | walnut-2 | `#F1EADF` | |
| `line` | seam | `#D8CFC1` | dividers |
| `edge` | edge | `#857868` | input / switch / secondary-button borders |
| `fg` | bone | soot | primary text |
| `fg-2` | ash | `#4F463E` | secondary text |
| `fg-3` | mink | `#6B6056` | tertiary text, captions, axis labels |
| `accent` | brass | brass-deep | brand, links, focus ring |
| `accent-fg` | soot | bone | text on accent |
| `accent-hover` | brass-hi | `#6B4C15` | |
| `accent-press` | brass-lo | `#5A3F11` | |
| `return` | vermilion | vermilion-deep | came back, escalate |
| `forecast` | delft | delft-deep | model output |
| `held` | verdigris | verdigris-deep | stayed closed, what worked |
| `seal` | oxblood | oxblood | stamps |
| `danger` | error | error-deep | errors only, never data |
| `scrim` | soot @ 48% | soot @ 24% | behind ⌘K and work order |
| `water` | ink-water | `#DCD8CF` | map water |

### Data encoding (color + shape, always both)

| State | Shape | Night | Bone |
|---|---|---|---|
| Open report | filled dot | bone @ 85% | soot @ 85% |
| Closed report | hollow dot, 1 px | mink | mink |
| Came back | filled dot + ring | vermilion | vermilion-deep |
| Chronic site | dot + 1–5 rings (one per return, cap 5) | vermilion | vermilion-deep |
| Forecast cell | 45° hatch, band = density | delft | delft-deep |
| Held 60+ days | filled square, 8 px | verdigris | verdigris-deep |
| Driver place | outline glyph (see 7.4) | ash | fg-2 |
| Under-reporting tract | 6 px dot texture | bone @ 18% | soot @ 14% |
| Approximate location | hollow dot, dashed | mink | mink |
| Selected | 2 px brass halo, +3 px offset | brass | brass-deep |

## Contrast (computed by `scripts/check-design-tokens.py`)

| Pair | Night | Bone | Minimum |
|---|---|---|---|
| `fg` on `bg` | 15.63 | 15.63 | 4.5 |
| `fg-2` on `bg` | 8.65 | 7.43 | 4.5 |
| `fg-3` on `bg` | 5.62 | 4.93 | 4.5 |
| `accent` on `bg` | 8.33 | 5.03 | 4.5 |
| `accent-fg` on `accent` | 8.33 | 5.03 | 4.5 |
| `return` on `bg` | 6.09 | 5.22 | 4.5 |
| `forecast` on `bg` | 8.58 | 6.50 | 4.5 |
| `held` on `bg` | 6.91 | 5.02 | 4.5 |
| `fg` on `card` | 13.49 | 18.29 | 4.5 |
| `fg-2` on `card` | 7.47 | 8.70 | 4.5 |
| `fg-3` on `card` | 4.85 | 5.77 | 4.5 |
| `edge` on `bg` | 3.12 | 3.47 | 3.0 (non-text) |

`line` (≈1.4:1) is decorative only. Anything a user must see to operate (input
borders, switch tracks, segment outlines) uses `edge`.

## Usage

| Need | Token | Not |
|---|---|---|
| Body text | `fg` | `fg-2` for paragraphs |
| Labels, meta | `fg-2` | `fg-3` for anything longer than a line |
| Axis labels, captions, eyebrows | `fg-3` | `line` |
| Panel over the map | `panel` + `glass` | `card` (opaque, hides map) |
| Card inside a panel | `card` | `panel` nested in `panel` |
| Primary button | `accent` / `accent-fg` | `return` |
| A site that came back | `return` | `danger` |
| Forecast cell / model value | `forecast` | `accent` |
| "What worked", held 60+ days | `held` | any other green |
| Stamp, seal | `seal` | any text |

## Themes

- **Night** is the desktop default. **Bone** follows `prefers-color-scheme:
  light`, is one key away (`T`), is recommended outdoors, and is **always** used
  by the work order and print.
- Set with `<html data-theme="night|bone">`. Any subtree can force a theme with
  `data-theme` (the work order does).
- `prefers-contrast: more` and `prefers-reduced-transparency` swap glass for
  `panel-solid` and raise `line` to `edge`.
