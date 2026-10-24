# Controls

Part of the [Piper design standards](../README.md).

## Button
- Variants: **primary** (`accent` bg, `accent-fg` text), **secondary**
  (transparent, 1 px `edge`, `fg`), **ghost** (no border, `fg-2` → `fg` on hover),
  **return** (transparent, 1 px `return`, `return` text; used for "Escalate").
- Sizes sm/md/lg (foundations/space-layout.md, Control sizes). Icon left 18 px, gap 8.
- States: hover (primary → accent-hover; others → card-hover bg), press (scale
  0.98, accent-press), focus ring, disabled (opacity 0.4, no hover, `aria-disabled`),
  loading (label kept, 3 pipe-hole dots replace icon).
- One primary per panel.

## Icon button
36 × 36 (md) / 40 × 40 (map controls), radius 10, ghost style, tooltip on hover
and focus, `aria-label` required.

## Switch
32 × 18 track, 14 knob, radius pill. Off: track `edge`, knob `fg` (≥ 4.5:1 on the track in both themes). On: track
`accent`, knob `accent-fg`. `role="switch"`, `aria-checked`.

## Segmented control
Height 32, radius 10, `card` bg, 2 px inset; segment `text-ui` 13; selected
segment `bg` with 1 px `edge` + `fg`; others `fg-2`. `role="radiogroup"`.

## Chips
| Chip | Size | Style |
|---|---|---|
| Source | 24 h, radius 6, mono 12 | 1 px `line`, `fg-2`; hover `fg`; opens source popover (name, URL, updated) |
| Feature | 28 h, radius pill, `text-ui` 13 | state dot 8 px + label; click selects on map |
| Driver | 28 h, radius 8 | glyph + label + mono count; hover highlights on map |
| Strength | 22 h, radius pill, mono 11 uppercase | strong: `held` text + `held`@14% bg · moderate: `accent` · weak: `fg-2` · none: `fg-3` on `card`. Word always shown. |

## Specimen label (eyebrow)
`text-eyebrow` `fg-3`, items separated by ` · `:
`SPECIMEN 03 · NORMANDY ST · 02121 · OBS. 16 · RETURNS 9`. Never more than one line;
truncate street with ellipsis.
