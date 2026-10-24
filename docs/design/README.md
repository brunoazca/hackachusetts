# Piper design standards (v1.2.0)

How Piper looks, moves, reads and behaves. Brand and naming:
[`docs/rat-audit/brand.md`](../rat-audit/brand.md). See it applied:
[`mockup/index.html`](mockup/index.html) — open the file in a browser, no build.

**If a value is not in [`tokens/tokens.json`](tokens/tokens.json), it does not
exist. Add it there first, then use it.**

## Map of the standards

| Area | File |
|---|---|
| Tokens (source of truth) | [tokens/tokens.json](tokens/tokens.json) · [tokens/README.md](tokens/README.md) |
| Color | [foundations/color.md](foundations/color.md) |
| Typography | [foundations/typography.md](foundations/typography.md) |
| Space, size, layout | [foundations/space-layout.md](foundations/space-layout.md) |
| Motion | [foundations/motion.md](foundations/motion.md) |
| Imagery, icons, the rat | [foundations/imagery.md](foundations/imagery.md) |
| Components | [components/README.md](components/README.md) |
| Flows | [patterns/flows.md](patterns/flows.md) |
| Content, voice, equity | [content.md](content.md) |
| Accessibility | [accessibility.md](accessibility.md) |
| Mockup | [mockup/index.html](mockup/index.html) · deep links `?demo=site`, `?demo=approve`, `?demo=ask`, `?demo=findings`, `?demo=cmdk`, `?theme=bone`, `?static` |

## Principles

1. **The map is the stage; panels are the frame.** The map is full-bleed. UI
   floats on it in glass. Nothing covers the map without a reason.
2. **One accent per job.** Brass = you can act. Vermilion = it came back. Delft =
   forecast. Everything else is bone, ash, mink on soot.
3. **Evidence under everything.** Every number has a mono source line beneath it.
4. **Motion explains, never decorates.** Things move to show cause (the Tune),
   recurrence (rings), time (timeline) or a decision (work order). Then they stop.
5. **Chic, not cute.** The rat appears as a single line, a Latin label, a myth.
   Never a cartoon, never a photo.
6. **Fair by default.** Rates, not raw counts. Quiet isn't clean. Conditions are
   the subject, never people or neighborhoods.

## When rules conflict

Accessibility → truthful data → equity → clarity → brand flourish. A flourish
(Bodoni, the Tune) is the first thing removed when it costs any of the others.

## Code locations

| What | Where | Imported by the app? |
|---|---|---|
| CSS tokens, themes, keyframes, utilities | `web/src/styles/piper.css` | **No** (opt-in) |
| JS tokens for MapLibre, Recharts, motion | `web/src/lib/design-tokens.ts` | **No** |
| Mockup tokens (generated) | `docs/design/mockup/tokens.css` | n/a |
| Drift and contrast guard | `scripts/check-design-tokens.py` | run by hand or in CI |
| Kiro steering for UI work | `.kiro/steering/design-system.md` | loaded for `web/**` and `docs/design/**` |

## Adopting in the app (when the team decides)

| Spec | File |
|---|---|
| Tokens, themes, keyframes, base | `web/src/styles/piper.css` → `@import "../styles/piper.css";` in `web/src/app/globals.css` after `@import "tailwindcss";` and remove the Arial body rule |
| JS tokens (map, charts, motion) | `web/src/lib/design-tokens.ts` |
| Fonts | `web/src/app/layout.tsx`: swap Geist for Bodoni Moda + Atkinson Next + Atkinson Mono (foundations/typography.md); `title: "Piper — rat intelligence for Boston"`; `<html data-theme>` |
| TopBar, Live pill, ⌘K trigger, theme toggle | `web/src/components/shell/TopBar.tsx` (+ `CommandBar.tsx`) |
| Lens rail | `web/src/components/shell/SidePanel.tsx` |
| Basemap recolor + data layers | `web/src/components/map/MapView.tsx` (+ `map-style.ts`) |
| Dossier, This week's 10 | `web/src/components/inspector/InspectorPanel.tsx` |
| Ask | `web/src/components/chat/ChatPanel.tsx` |
| Findings | `web/src/components/insights/InsightsPanel.tsx` |
| New | `components/shell/Timeline.tsx`, `components/inspector/WorkOrderSheet.tsx`, `components/ui/*` (Button, Chip, Switch, Segmented, Tooltip, Toast), `components/brand/LineRat.tsx` |
| Dependency | `lucide-react` |

## Changing a standard

1. Change `tokens/tokens.json` and/or the doc, in one commit.
2. Mirror token changes into `web/src/styles/piper.css` and `web/src/lib/design-tokens.ts`.
3. Run `python3 scripts/check-design-tokens.py --write`. It must print `tokens OK`.
4. Update the mockup if the change is visible.
5. Add a changelog line below and an entry in `.kiro/KIRO_LOG.md`.

## Review checklist (paste into PRs that touch UI)

- [ ] Only semantic tokens; no raw hex, no Tailwind palette colors (`neutral-*`, `emerald-*`).
- [ ] Every status has color + shape (+ a word in lists).
- [ ] All states from the universal matrix (components/README.md).
- [ ] Keyboard path works; focus visible; nothing hidden under glass.
- [ ] Reduced motion: every new animation has a fallback; nothing new loops.
- [ ] Numbers carry a mono source line; "reports", never "rats" as a count.
- [ ] Equity: rates, not counts, for areas; no place-blaming words.
- [ ] `python3 scripts/check-design-tokens.py` prints `tokens OK`.

## Changelog

- **1.2.0 — Oct 24, 2026.** Frosted glass is back as the default panel over the map
  (Guilherme's call): `glass` = `panel` + blur 20 + saturate 1.15 + hairline + small
  shadow. Everything else from 1.1.0 stays (no glow, no big shadows, upright Bodoni,
  quiet labels). `surface` remains for places that are not over the map. First app
  implementation on branch `feat/piper-ui`.

- **1.1.0 — Oct 24, 2026. Cleaner.** Removed the effects that read as generated:
  map glows, glass blur on panels (solid surfaces + hairline + 1-2 px shadow;
  `glass` is opt-in only), big drop shadows, italic Bodoni (now upright; italic
  only in the wordmark), mono uppercase eyebrows (now 12 px sans, sentence case),
  chip rows of sources (one quiet "Sources:" line). Rings capped at 3, thinner.
  Fewer map marks. Fixed a theme bug: a themed subtree now sets its own text color.

- **1.0.0 — Oct 24, 2026.** First release. Hamelin palette; the contrast guard
  raised `mink` to `#8A929A`, Bone `return` to `#C8241A` and Bone `edge` to
  `#82878D` after three pairs measured under target. Bodoni Moda + Atkinson
  Hyperlegible Next/Mono, 22 components, motion catalog, map spec, equity and
  accessibility rules, mockup.
