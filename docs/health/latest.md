# Build Health — web/

**Timestamp:** 2026-10-24 16:35 EDT
**Git HEAD:** `b405ea7` — Kiro Crew: keep only Da Vinci, Hopper, Ginsburg, Keller

## Status

| Check | Result | Counts |
|-------|--------|--------|
| lint  | FAIL   | 3 errors, 1103 warnings |
| types | PASS   | 0 errors |
| build | PASS   | 23s |

## Failures

### lint — first error
`web/src/components/inspector/InspectorPanel.tsx:30:5`
`react-hooks/set-state-in-effect` — Calling setState synchronously within an effect can trigger cascading renders. `setDetail(null)` is called directly inside the effect body.

Likely introduced by:
```
6f21bc1 bone-blackbone Clarify Piper evidence, default to place review, and complete submission docs
921d99b bone-blackbone Merge origin/main (forecast layer, CellCard, parcels for 3 cities) into feat/piper-ui; forecast control moved into the layer dock
a36a247 Bruno Azambuja Carvalho Forecast on the map: RPCs, draft forecast layer + block card, integration doc
```

Two more errors of the same rule:
- `web/src/components/inspector/SiteCase.tsx:42:5` — `setD(null)` in effect
- `web/src/components/map/ContextLayers.tsx:47:45` — `setParcels(EMPTY)` in effect

## Diagnosis

The app runs and ships fine: it compiles, types are clean, and the production build finishes in about 23 seconds. The only red light is lint. Three React components set a piece of state directly at the top of a `useEffect`, before any async work. The newest React lint rule flags this because it can make the screen redraw more than once in a row. It is a quality warning turned into an error, not a crash. The demo will still work. No fix was applied.
