# Space, size, shape and layout

Part of the [Piper design standards](../README.md).

## The rules

1. **4 px grid.** Every margin, padding, gap and size is on the scale. 6, 10, 14,
   18 appear only as radii or icon sizes.
2. **Fixed rhythm:** card padding 16 · panel padding 20 · between cards 12 ·
   between sections 24 · edge gap 12 (desktop) / 8 (phone).
3. **Three control heights:** 32, 40, 48. A clickable row is ≥ 36 tall.
4. **Nothing interactive under 24 × 24** (WCAG 2.5.8). Phone actions are 48.
5. **Panels float** 12 px from the viewport edge on a solid `surface`. No edge-to-edge bars on desktop.
6. **The map's clear area is protected.** `flyTo`/`fitBounds` always pass
   `mapPadding` so targets land between the panels, never under them.

### Spacing (4 px base)

`0 · 2 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64` (Tailwind default
spacing scale = 4 px steps, so `p-3` = 12 px).

- Inside cards: 16. Inside panels: 20. Between cards: 12. Between sections: 24.
- Floating gap from viewport edge: 12 (desktop), 8 (phone).

### Control sizes

| Size | Height | Padding x | Text | Icon | Radius |
|---|---|---|---|---|---|
| sm | 32 | 12 | text-ui 13 | 16 | 8 |
| md (default) | 40 | 16 | text-ui 14 | 18 | 10 |
| lg | 48 | 20 | text-ui 16 | 20 | 12 |

Minimum hit target 24 × 24 (WCAG 2.5.8); all interactive rows ≥ 36 tall;
phone primary actions 48.

### Radius

`xs 6` (chips, kbd) · `sm 8` · `md 10` (buttons, inputs) · `lg 14` (cards,
panels) · `xl 20` (sheets, work order) · `pill 999`.

### Borders

Hairline 1 px `line`. Control borders 1 px `edge`. Focus ring: 2 px `accent`
outline with 2 px `bg` offset (`outline: 2px solid; outline-offset: 2px`).

### Elevation (night)

| Token | Value | Use |
|---|---|---|
| `shadow-panel` | `0 1px 2px rgb(0 0 0 / .25)` | floating panels |
| `shadow-pop` | `0 4px 12px rgb(0 0 0 / .2)` | menus, tooltips, ⌘K |
| `shadow-sheet` | `0 -8px 24px rgb(0 0 0 / .25)` | work order, bottom sheet |
| `surface` | `panel-solid` + 1 px `line` + 1–2 px shadow | all panels (default) |
| `glass` | `backdrop-filter: blur(12px)` | opt-in only; never the default |

Bone theme uses the same geometry at ¼ alpha with warm shadow `rgb(60 40 20)`.

### Z-index

`map 0 · map-overlay 10 · rail 20 · panel 30 · timeline 30 · popover 40 ·
cmdk 50 · sheet 60 · toast 70 · tooltip 80`.

### Breakpoints

`sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`. Demo target: **1280 × 800**.

### Desktop (≥ 1024)

```
┌──────────────────────────────── 12 px gap ────────────────────────────────┐
│ [TopBar 56h: Line Rat · Piper · Live pill]   [⌘K 560w]   [theme][?]       │
│ ┌─Lens rail 264w─┐                                   ┌──Dossier 400w────┐ │
│ │ (collapsible   │            MAP (full bleed)       │ (or This week's  │ │
│ │  to 56w)       │                                   │  10 / Ask)       │ │
│ │                │                                   │                  │ │
│ └────────────────┘                                   │                  │ │
│        ┌──────────── Timeline 112h ───────────────┐  │                  │ │
│        └──────────────────────────────────────────┘  └──────────────────┘ │
└───────────────────────────────────────────────────────────────────────────┘
```

- TopBar is not a bar: three floating clusters on `surface`, 12 px from the top.
- Rail: top 80, left 12, bottom 136 (above timeline). Collapsed: 56 w, glyphs only.
- Dossier: top 80, right 12, bottom 12, width 400 (lg) / 440 (2xl). Scrolls inside.
- Timeline: left = rail right + 12, right = Dossier left − 12, bottom 12, height 112.
- Map padding (for `fitBounds`/`flyTo`): `{ top: 80, left: 288, right: 424, bottom: 136 }`, so the target lands in the clear area, never under a panel.
- At 1024–1279 the rail starts collapsed.

### Phone (< 768)

- TopBar 52 h: mark + Live dot + ⌘K search icon.
- Map fills the screen; **bottom sheet** with snaps at 96 px (peek: "This
  week's 10" title + first row), 50%, 92%. Drag handle 36 × 4, plus a button to
  change snap (drag alternative).
- Lens rail becomes a "Lenses" button → full-height sheet.
- Timeline is inside the sheet, under the Dossier header.
- Default theme on phone follows OS; Bone recommended outdoors (toggle in TopBar).

### Tablet (768–1023)

Rail collapsed; Dossier is a right sheet 380 w that covers the map; timeline
hidden behind a "Timeline" toggle.
