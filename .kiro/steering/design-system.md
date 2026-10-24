---
inclusion: fileMatch
fileMatchPattern: ["web/src/**/*.tsx", "web/src/**/*.css", "web/src/**/*.ts", "docs/design/**"]
---

# Piper design system — rules for UI work

Source of truth: `docs/design/README.md` and `docs/design/tokens/tokens.json`.
Read the relevant foundation or component file before building or restyling UI.

- Use semantic tokens only (`bg-card`, `text-fg-2`, `text-return`, `border-edge`).
  No raw hex and no Tailwind palette colors (`neutral-*`, `emerald-*`) in components.
- Warm = observed (`return`), cool = forecast (`forecast`), brass = action (`accent`).
  Every status also has a shape and, in lists, a word.
- Bodoni Moda (`font-display`) only for one headline per panel, ≥ 28 px. Body 16 px
  Atkinson Hyperlegible Next. Numbers and sources in Atkinson Mono, tabular.
- 4 px spacing; controls 32 / 40 / 48; targets ≥ 24 × 24.
- Motion from the catalog in `docs/design/foundations/motion.md`; each animation has
  a reduced-motion fallback; only the Live dot loops.
- Map: pass `mapPadding` to `flyTo`/`fitBounds`; colorless basemap; rates, not
  counts, for areas.
- Copy: "reports", never "rats" as a count; never "infested"/"plague" about a place.
- New or changed tokens: edit `tokens.json`, mirror into `web/src/styles/piper.css`
  and `web/src/lib/design-tokens.ts`, run `python3 scripts/check-design-tokens.py --write`.
- `piper.css` and `design-tokens.ts` are not imported by the app yet. Do not wire
  them into `globals.css` / `layout.tsx` unless the teammate asks.
