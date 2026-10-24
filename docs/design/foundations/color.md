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
| soot | `#111315` | warm black |
| velvet | `#181B1E` | panel base |
| walnut | `#1F2327` | card |
| walnut-2 | `#282D32` | hover on card |
| seam | `#2F353B` | hairline (decorative only) |
| edge | `#68717A` | control borders (3.1:1 on soot) |
| ink-water | `#0D1A26` | map water |
| bone | `#F2F3F1` | text / open dots / light bg |
| bone-2 | `#FAFAF9` | light panel |
| bone-3 | `#FFFFFF` | light card |
| ash | `#AEB5BC` | secondary text |
| mink | `#8A929A` | tertiary text, closed dots |
| brass | `#F2F3F1` | brand, primary action |
| brass-hi | `#FFFFFF` | hover |
| brass-lo | `#C9CED3` | pressed |
| vermilion | `#FF5A4E` | came back |
| delft | `#6FA0FF` | forecast |
| verdigris | `#3DBE7A` | held / what worked |
| oxblood | `#7A1E2C` | seal, stamps |
| error | `#FF7A6B` | system errors (night) |

Deep variants for Bone theme: brass-deep `#111315`, vermilion-deep `#C8241A`,
delft-deep `#003DA5`, verdigris-deep `#00733A`, error-deep `#B3261E`,
fg-2 `#4A4F55`, fg-3 `#646A71`, line `#DCDDD9`, edge `#82878D`.

### Semantic tokens

| Token | Night | Bone | Use |
|---|---|---|---|
| `bg` | soot | bone | app background, map land |
| `panel` | velvet @ 82% + blur | bone-2 @ 88% + blur | floating panels |
| `panel-solid` | velvet | bone-2 | panels under `prefers-contrast: more` / `prefers-reduced-transparency` |
| `card` | walnut | bone-3 | cards inside panels |
| `card-hover` | walnut-2 | `#EEEFEC` | |
| `line` | seam | `#DCDDD9` | dividers |
| `edge` | edge | `#82878D` | input / switch / secondary-button borders |
| `fg` | bone | soot | primary text |
| `fg-2` | ash | `#4A4F55` | secondary text |
| `fg-3` | mink | `#646A71` | tertiary text, captions, axis labels |
| `accent` | brass | brass-deep | brand, links, focus ring |
| `accent-fg` | soot | bone | text on accent |
| `accent-hover` | brass-hi | `#2A2E33` | |
| `accent-press` | brass-lo | `#3A3F45` | |
| `return` | vermilion | vermilion-deep | came back, escalate |
| `forecast` | delft | delft-deep | model output |
| `held` | verdigris | verdigris-deep | stayed closed, what worked |
| `seal` | oxblood | oxblood | stamps |
| `danger` | error | error-deep | errors only, never data |
| `scrim` | soot @ 48% | soot @ 24% | behind ⌘K and work order |
| `water` | ink-water | `#C9DDF0` | map water |

### Data encoding (color + shape, always both)

| State | Shape | Night | Bone |
|---|---|---|---|
| Open report | filled dot | bone @ 85% | soot @ 85% |
| Closed report | hollow dot, 1 px | mink | mink |
| Came back | filled dot + ring | vermilion | vermilion-deep |
| Chronic site | dot + 1–3 rings (one per ~4 returns, cap 3) | vermilion | vermilion-deep |
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
| Panel over the map | `glass` (`panel` + blur 20 + hairline) | glow, big shadows |
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
