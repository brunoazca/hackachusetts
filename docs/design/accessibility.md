# Accessibility

Part of the [Piper design standards](README.md). Target: **WCAG 2.2 AA**, plus the 14 critical [Chartability](https://chartability.fizz.studio/) tests for charts and the map.

## Non-negotiables

1. **The map has a twin.** A features-in-view list mirrors the map, updates on
   pan, syncs selection both ways, and is one key away (`L`).
2. **Status is never color alone.** Shape + word. Checked in protan, deutan and
   tritan simulation before every recording.
3. **Contrast is measured.** `scripts/check-design-tokens.py` fails on any text
   pair under 4.5:1 or control edge under 3:1.
4. **Focus is always visible and never hidden** under a panel (2.4.7, 2.4.11).
5. **No drag-only interaction** (2.5.7): the timeline window, bottom sheet and
   map pan all have button or key alternatives.
6. **Targets ≥ 24 × 24** (2.5.8); 48 on phone for primary actions.
7. **Motion can be turned off.** Nothing loops except the Live dot; anything
   moving more than 5 s has a pause (2.2.2, 2.3.3).
8. **Charts speak first:** a summary sentence (also the `aria-label`), then the
   chart, then a "Show data" table.
9. **Live regions are short.** Announce "Selected Normandy St, 9 came back", not
   the whole panel. Ask answers stream into one polite region; tool steps are
   announced once, when done.
10. **Single-key shortcuts can be turned off** and never fire while typing (2.1.4).

## Component checklist

| Component | Role / pattern | Must have |
|---|---|---|
| Command bar | `dialog` + `combobox` + `listbox` | `aria-activedescendant`; Esc closes; focus returns to trigger |
| Lens row | row is the control; switch is `role="switch"` | name includes the layer |
| Inspect / Ask / Findings | `tablist` / `tab` | arrow keys; `aria-selected` |
| Segmented filter | `radiogroup` / `radio` | arrow keys |
| Map site | `button` inside a `group` | name = rank + street + returns |
| Timeline handles | `slider` | `aria-valuetext` = dates |
| Work order | `dialog aria-modal="true"` | focus trap, Esc, focus restore |
| Private field | button "Reveal owner name (logged)" | blurred text is fake and `aria-hidden` |
| Toast | `status` | 4 s; pauses on hover and focus |
| Line Rat | `img` with a label, or `aria-hidden` when decorative | |

## Ship gate

- [ ] Every interactive element reachable by Tab in visual order; visible focus ring.
- [ ] Focus never hidden under a panel (2.4.11): map focus scrolls into clear area.
- [ ] Map has the features-in-view list twin; selection syncs both ways.
- [ ] Status shown by shape + word, never color alone; checked in protan/deutan/tritan sim.
- [ ] All text pairs ≥ 4.5:1; controls and data marks ≥ 3:1 (foundations/color.md).
- [ ] Targets ≥ 24 × 24; phone actions 48.
- [ ] Dragging (timeline window, bottom sheet) has button alternatives.
- [ ] Every chart has a summary sentence and a data table.
- [ ] `aria-live` for selection changes, Ask answers, Live time, toasts.
- [ ] `prefers-reduced-motion`, `prefers-contrast: more`, `prefers-reduced-transparency` honored; in-app Reduce motion toggle.
- [ ] 200% zoom: panels reflow to sheets, no horizontal scroll at 320 CSS px.
- [ ] Bodoni never under 28 px; body ≥ 16 px.
- [ ] `lang="en"`; images and the Line Rat have `alt` / `aria-label`; decorative SVG `aria-hidden`.

## How to test (15 minutes, before every demo recording)

1. Keyboard only: open → ⌘K → pick a site → Approve → Print → Esc.
2. VoiceOver (⌘F5) on the same path: every control has a name; selection is announced.
3. Chrome DevTools → Rendering → emulate protanopia, deuteranopia, tritanopia, achromatopsia: every status still readable.
4. Rendering → `prefers-reduced-motion: reduce`: only instant state changes.
5. Browser zoom 200%: panels reflow, nothing cut off.
6. `python3 scripts/check-design-tokens.py` prints `tokens OK`.

## Shipped

What is wired in the app today, and where it lives. Paths are under `web/src`.

| Capability | WCAG / spec | Where |
|---|---|---|
| **Map twin — "Features in view" list.** Mirrors what the map draws, updates on pan/zoom, selection syncs both ways, opens with `L` or the on-map **List** button, Esc closes. Polite live region announces the count. | R2.11, R9.1; non-negotiable §1; 2.4.1 | `components/map/FeatureList.tsx`; `featuresInView` + `setFeaturesInView` in `lib/map-store.ts`; sync effect + `L` handler + List button in `components/map/MapView.tsx`. In **Act** mode the Places queue (`components/act/SiteQueue.tsx`) is the twin, so the generic list is Assess-only. |
| **Skip link + `<main>` landmark.** First focusable element jumps past the chrome to the map. | 2.4.1; ship gate | `app/page.tsx` |
| **In-app Reduce motion toggle.** Sets `data-motion="reduced"` on `<html>` (CSS already stops all animation under that or the OS media query); seeds from `prefers-reduced-motion`; remembered; `M` shortcut. | 2.2.2, 2.3.3; ship gate "in-app Reduce motion toggle" | `lib/a11y-store.ts`; button + restore in `components/shell/TopBar.tsx`; CSS in `styles/piper.css` |
| **Live regions.** Selection + streamed answers announced politely, once per finished answer. | R9.2; non-negotiable §9 | `components/chat/ChatPanel.tsx` (`aria-live="polite"`, `role="log"`, `role="alert"`) |
| **Labelled controls, roles, visible focus.** Segmented filter `radiogroup`/`radio`; side panel `tablist`/`tab`; rail `toolbar`; every icon button has `aria-label`; global `:focus-visible` ring. | R9.1; 2.4.7, 4.1.2 | `components/shell/*`, `components/map/*`, `styles/piper.css` |
| **Theme + contrast.** Night/Bone tokens meet AA; `prefers-contrast: more` and `prefers-reduced-transparency` swap to solid panels and stronger lines. Token contrast is gated in CI. | R9.1; 1.4.3, 1.4.11 | `styles/piper.css`; `scripts/check-design-tokens.py` |
| **Single-key shortcuts never fire while typing.** `L` (list), `M` (motion), `T` (theme), `]` (panel). | 2.1.4 | guarded in `MapView.tsx`, `TopBar.tsx`, `shell/RightPanel.tsx` |
| **Hyperlegible type.** Atkinson Hyperlegible Next + Mono, built for low vision. | §Non-negotiables | `app/layout.tsx` |
| **Charts speak first.** Every finding chart leads with a visible plain-language summary (same text as the SVG `aria-label`/`<desc>`), then the chart, then a "Show data" table with `<caption>` and `scope="col"` headers (CI as a column). Status is shape + word, never color alone. | non-negotiable §8 | `components/insights/FindingChart.tsx` (`describeChart` → `<figcaption>` + `<desc>` + `<details><table>`); `PriceImpact.tsx`, `ForecastSummary.tsx`, `ActionSamples.tsx` carry their own tables |

### Still open (tracked, not yet shipped)

- `accessibility-check` Kiro hook (tasks.md §10) — manual 15-minute pass above is the interim gate.
- 200% zoom / mobile sheet reflow (R9.4, task 3.12, P2).
