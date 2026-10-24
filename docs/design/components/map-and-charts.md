# Map and charts

Part of the [Piper design standards](../README.md). JS values: `web/src/lib/design-tokens.ts`.

## The rules

1. The basemap is colorless; data owns color.
2. Status = color + shape (foundations/color.md, Data encoding).
3. Rates, not raw counts, for any area shading. No red choropleths of neighborhoods.
4. At most two series per chart. Every chart has a summary sentence and a data table.
5. Approximate locations (block centroids) are hollow and dashed, labelled `approx.`.

### Basemap

MapLibre GL + **OpenFreeMap** `dark` style (free, no key:
`https://tiles.openfreemap.org/styles/dark`), recolored on `style.load` by layer
type. Values:

| Layer group | Night | Bone |
|---|---|---|
| background / land | `#0F0D0C` | `#EDE6DA` |
| water | `#121416` | `#DCD8CF` |
| parks / green | `#13120F` (no green) | `#E4DFD3` |
| buildings (z ≥ 15) | `#171412`, outline `#211D1A` | `#E2DACD` |
| roads minor | `#1C1916`, width ×1 | `#DDD4C6` |
| roads major | `#2A2521` | `#D2C8B8` |
| rail / transit | `#241F1B`, dashed | `#CFC5B5` |
| boundaries | `#302A25` | `#C9BFAF` |
| labels: places | Atkinson 12, `#968878`, halo `#0F0D0C` 1.2 | `#6B6056`, halo `#EDE6DA` |
| labels: streets | Atkinson 11, `#6A5F55` | `#857A6E` |
| POI labels | hidden | hidden |

The basemap is deliberately colorless so data owns the color. Glyphs: use the
style's glyph server; set `text-font` to its closest sans (Noto Sans Regular) if
Atkinson glyph PBFs are not hosted.

### Data layers (paint)

```js
// reports, unclustered (z ≥ 13)
"circle-radius": ["interpolate", ["linear"], ["zoom"], 13, 2.5, 16, 5, 18, 7]
// open
"circle-color": T.bone, "circle-opacity": 0.85
// closed
"circle-color": "transparent", "circle-stroke-color": T.mink, "circle-stroke-width": 1
// came back
"circle-color": T.vermilion, + ring layer: "circle-radius": r + 5, "circle-color": "transparent",
"circle-stroke-color": T.vermilion, "circle-stroke-width": 1, "circle-stroke-opacity": 0.6
// glow underlay (came back only)
"circle-radius": r * 3, "circle-color": T.vermilion, "circle-opacity": 0.18, "circle-blur": 1

// clusters (z < 13)
"circle-color": "rgba(237,230,218,0.08)", "circle-stroke-color": "rgba(237,230,218,0.5)",
"circle-stroke-width": 1, "circle-radius": ["step", ["get","point_count"], 12, 25, 16, 100, 22, 500, 28]
// cluster count: "text-field": "{point_count_abbreviated}", text 11, color T.bone

// chronic sites: one circle layer per ring index i = 1..5,
// filter ["<=", i, ["min", ["get","recurrences"], 5]]
"circle-radius": 8 + 7 * i (scaled by zoom: × ["interpolate",["linear"],["zoom"],11,0.6,15,1,17,1.4])
"circle-color": "transparent", "circle-stroke-color": T.vermilion,
"circle-stroke-width": 1.25, "circle-stroke-opacity": 1 - 0.17 * i

// heatmap mode
"heatmap-color": ["interpolate",["linear"],["heatmap-density"],
  0,"rgba(15,13,12,0)", 0.2,"rgba(139,125,112,0.35)", 0.5,"rgba(201,165,92,0.6)",
  0.8,"rgba(240,100,60,0.8)", 1,"rgba(240,100,60,0.95)"]

// forecast cells (fill-pattern from a 6×6 hatch image tinted delft)
band low: "fill-opacity": 0.25 · mid: 0.5 · high: 0.85; "line-color": T.delft, "line-width": 0.5
// listening gap (fill-pattern: 6×6 dot image), "fill-opacity": 0.18
// selected: extra circle layer, stroke brass 2 px, radius + 3
// highlighted by Ask / hover: stroke bone 1.5 px
```

Paint changes use `*-transition: { duration: 300 }`.

### Map hover card

240 w, `card` bg, radius 10, `shadow-pop`, padding 12. Eyebrow (category, mono),
one line title (`text-ui` 600), one line status + date (mono). Appears on hover
(150 ms delay) and on keyboard focus of the list twin. Click selects.

### Map controls

Zoom +/−, compass reset, locate; 40 × 40 icon buttons in a vertical `surface` stack
bottom-right of the clear map area (above timeline). Scale bar mono 11.
Attribution collapsed to an (i) button.

### Charts (Recharts)

- Size: in cards 100% × 120 (Dossier), Findings 100% × 160.
- Axes: mono 11 `fg-3`, no axis line, ticks 4 max. Grid: horizontal only,
  `line`, 1 px, dashed 2 4.
- Series: max two. Baseline `fg-3`/`ash`, highlight `return`; forecast `forecast`
  dashed 4 3; "what worked" `held`.
- Bars: radius 2 top, gap 2, width auto ≥ 4.
- Tooltip: `card`, radius 8, mono 12, no shadow over 12 px blur.
- Annotations: mono 11 with a 1 px leader line.
- Every chart: `role="img"`, `aria-label` = its summary sentence; a "Show data"
  button reveals a table.
- Numbers: one decimal for percents, thousands separators, `tabular-nums`.
