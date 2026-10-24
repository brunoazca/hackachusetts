# Motion

Part of the [Piper design standards](../README.md).

## The rules

1. **Motion explains cause, recurrence, time or a decision.** If a frozen frame
   loses nothing, don't animate it.
2. **Everything ends.** Only the Live dot loops. The Tune stops after 8 s and has
   a pause control. Timeline Play stops at the last week.
3. **Transform and opacity only** on DOM; `stroke-dashoffset` on SVG; MapLibre
   `*-transition` for paint. Never animate size, layout properties or blur.
4. **Exits are faster than entrances** (≈ 70%) and use `ease-in`.
5. **Reduced motion is a full mode:** OS setting, in-app toggle
   (`data-motion="reduced"`), `?static` in the mockup. Every catalog entry has a fallback.
6. **No typewriter text, no parallax, no bounce.** The seal's small overshoot is
   the only overshoot in the product.

### Tokens

| Token | Value | Use |
|---|---|---|
| `dur-instant` | 80 ms | press, toggle knob |
| `dur-fast` | 140 ms | hover, tooltip, chip select |
| `dur-base` | 220 ms | panel content, popovers |
| `dur-slow` | 320 ms | panels in/out |
| `dur-slower` | 480 ms | work-order sheet |
| `dur-story` | 900 ms | map fly, intro beats |
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | enter, most things |
| `ease-spring` | `cubic-bezier(0.22, 1, 0.36, 1)` | panels |
| `ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | moves on screen, timeline play |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | exit (exits are 70% of enter duration) |
| `stagger` | 40 ms (content) / 80 ms (rings) | |

Only `transform` and `opacity` animate on DOM (plus `stroke-dashoffset` on SVG
and MapLibre paint transitions). Never animate `width`, `height`, `top`, blur.

### Catalog

| Name | Trigger | What moves | Duration / ease | Reduced motion |
|---|---|---|---|---|
| **Intro: Line Rat** | first load, end card | rat stroke draws (`stroke-dashoffset` 100%→0), tail extends into pipe, 3 holes pop (scale 0→1, 80 ms apart), wordmark fades up 8 px | 1200 + 400 + 240 + 300 ms, ease-in-out then ease-out | mark shown static |
| Map reveal | after intro | report layer `circle-opacity` 0→0.85; then rings | 600 ms; rings +400 ms | instant |
| **Rings** | site select / timeline play | each ring radius r−6→r and opacity 0→target, inner first | 600 ms each, stagger 80, ease-out | drawn static |
| **The Tune** | site with a source selected | 5 brass dots travel source→site along the arc, spaced 20%, loop | 2400 ms per traverse, linear; auto-stop after 8 s or on deselect; pause button | static dashed arc + arrowhead |
| Map fly | search, Ask, list click | `flyTo` | 900 ms, curve 1.42, `essential: false` | `jumpTo` |
| Panel in | open Dossier / Ask | x +24→0, opacity 0→1 | 320 ms ease-spring | opacity only, 120 ms |
| Panel content | panel opens / selection changes | sections y +8→0, opacity, stagger 40 | 220 ms ease-out | none |
| Count-up | Dossier stat values | number 0→value | 600 ms ease-out, `tabular-nums` so width is fixed | final value |
| Hover row | list/lens rows | bg → card-hover | 140 ms | same |
| Press | buttons | scale 1→0.98 | 80 ms | none |
| Switch | lens toggle | knob x, track color | 140 ms ease-out | instant |
| ⌘K open | ⌘K, `/` | scrim fade; box scale 0.98→1 + opacity | 160 ms ease-out | opacity |
| Tooltip | hover/focus 300 ms delay | opacity, y +4→0 | 120 ms | opacity |
| Tool step | Ask tool call | row slides in y +6; on done collapses to summary | 140 ms / 220 ms | instant |
| Stream text | Ask answer | none (text appears as streamed; no typewriter effect) | — | — |
| **Approve** | Approve click | button label → check icon (cross-fade 140); Dossier dims to 60%; **work order** rises y 100%→0 with rotate −0.6°→0 | 480 ms ease-out | sheet appears, no rotate |
| **Seal** | 300 ms after sheet lands | oxblood seal scale 1.25→1, opacity 0→1, tiny 2° rotate | 220 ms ease-out (slight overshoot via `cubic-bezier(0.34,1.56,0.64,1)`) | static |
| Reveal (privacy) | eye click | blur 6px→0 via cross-fade of two layers, mono "revealed · logged" line fades in | 220 ms | instant |
| Live dot | always | opacity 0.45↔1 | 2000 ms ease-in-out, infinite | static dot |
| Refresh | Refresh click | pipe holes light in sequence | 3 × 160 ms loop while loading | "Refreshing…" text |
| Skeleton | loading | shimmer bone 4%→8% | 1600 ms linear | static 6% |
| Timeline play | Space / Play | week cursor steps; bars highlight; rings appear on returns that week | 400 ms per week, ease-in-out | step without transition |

Only the Live dot loops forever. The Tune stops after 8 s. Everything else runs
once. All motion respects `prefers-reduced-motion: reduce` and an in-app
"Reduce motion" toggle (Settings popover).

## Choreography

| Moment | Order |
|---|---|
| Select a site | map flies (900) → panel content rises (220, stagger 40) → rings draw (600, stagger 80) → stats count (600) |
| Approve | button → check (140) → sheet rises (480) → seal stamps (+300, 220) → toast (220) |
| Open ⌘K | scrim (140) and box (160) together; focus in input on the first frame |
| Timeline Play | cursor every 400 ms; rings appear on sites whose return falls in that week |
