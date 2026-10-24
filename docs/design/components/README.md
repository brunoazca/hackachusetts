# Components

Part of the [Piper design standards](../README.md).

| File | Components |
|---|---|
| [controls.md](controls.md) | Button, Icon button, Switch, Segmented control, Chips, Specimen label |
| [navigation.md](navigation.md) | Command bar (⌘K), Lens rail, Timeline scrubber, Keyboard map |
| [panels.md](panels.md) | Dossier, Return timeline, Two voices, Probability bar, Action card, Private field, Findings card, Ask |
| [overlays-feedback.md](overlays-feedback.md) | Work order sheet, Live pill, Toast, Empty / loading / error, Tooltip |
| [map-and-charts.md](map-and-charts.md) | Basemap, data layers, hover card, map controls, charts |

## How a component spec is written

Each spec states, in order: **anatomy** (parts in reading order) · **sizes**
(from the scales only) · **tokens** (semantic, per part) · **states** (the matrix
below plus its own) · **behaviour** (keyboard, focus, motion by catalog name) ·
**a11y** (role, name, live region) · **copy** (label patterns).

## Universal state matrix

Every interactive component implements all of these. A missing state fails review.

| State | Visual | Notes |
|---|---|---|
| Default | as specced | |
| Hover | `card-hover` bg, or `accent-hover` on primary | pointer only; never the only cue |
| Focus-visible | 2 px `accent` outline, 2 px offset | keyboard only (`:focus-visible`); never removed |
| Pressed | scale 0.98; `accent-press` on primary | 80 ms |
| Selected / on | styled from `aria-checked` / `aria-selected` / `aria-pressed` | ARIA state drives style, not a separate class |
| Disabled | opacity 0.4, no hover | prefer `aria-disabled` plus a reason over hiding |
| Loading | label kept, three pipe-hole dots | width must not change |
| Error | 1 px `danger` border + message below | message says what to do next |
| Empty | Line Rat + one sentence + optional action | see overlays-feedback.md |

## Inventory and status

| Component | Spec | Mockup | App file | Status |
|---|---|---|---|---|
| Button, Icon button | controls.md | ✓ | `components/ui/Button.tsx` (new) | to build |
| Switch, Segmented, Chips | controls.md | ✓ | `components/ui/*` (new) | to build |
| TopBar + Live pill | overlays-feedback.md | ✓ | `components/shell/TopBar.tsx` | restyle |
| Command bar | navigation.md | ✓ | `components/shell/CommandBar.tsx` (new) | to build |
| Lens rail | navigation.md | ✓ | `components/map/LayerPanel.tsx`, `components/shell/SidePanel.tsx` | restyle |
| Map | map-and-charts.md | ✓ (SVG stand-in) | `components/map/MapView.tsx` | restyle |
| Dossier, This week's 10 | panels.md | ✓ | `components/inspector/InspectorPanel.tsx` | restyle |
| Ask | panels.md | ✓ | `components/chat/ChatPanel.tsx` | restyle |
| Findings | panels.md | ✓ | `components/insights/InsightsPanel.tsx` | restyle |
| Timeline | navigation.md | ✓ | `components/shell/Timeline.tsx` (new) | to build |
| Work order | overlays-feedback.md | ✓ | `components/inspector/WorkOrderSheet.tsx` (new) | to build |
| Line Rat | ../foundations/imagery.md | ✓ | `components/brand/LineRat.tsx` (new) | to build |
