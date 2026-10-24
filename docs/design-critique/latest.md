# Piper (Rat Audit) — Design Critique

- **Date:** 2026-10-24 16:37 (local)
- **Target:** `http://localhost:3107/` — route `/` (single-page app)
- **Captured:** desktop 1280×900 (full page) + mobile 390×844, both real renders (not blank/error/loading)
- **Mode:** Heuristic critique (Mode A). Unattended run — no clarifying questions asked.

## Assumptions (unattended run)

- **Users:** Boston ISD rodent inspectors and the Rodent Action Plan coordinator on a desktop; phone is a real but secondary context.
- **Primary task:** scan the "Places to visit" list (places flagged for review), pick one, and open its report to review reports-after-closure and recorded responses. The map gives spatial context.
- **Maturity:** working release candidate (data is live: "Updated 21 minutes ago").
- The product is now branded **Piper** with a dark theme. The old light "layer panel" design from the previous report is gone; the default landing view is now the **Places to visit** list over a dark heatmap.
- The orange **"Cache disabled"** pill (bottom-left) is a **Next.js dev-server toast**, not product UI. Not critiqued; it won't ship.
- Only the default idle state of `/` was seen. No place was opened, so the populated Inspect panel, the Insights/Ask tabs, and the Map-only view were **not evaluated**.

## Overall read

A clear, confident single-task tool: the landing view puts the inspector's actual job — "which places to visit" — front and centre, with an honest explanation of what the flag means. Contrast and layout are in good shape, and mobile is now genuinely responsive (a real fix since last run). The one thing to fix is that on a phone the two header icon-buttons (refresh, theme) sit off the right edge and are cut off.

**Health: strong, just polish — 0 catastrophes, 1 major, 2 minor.**

Contrast was measured from computed styles, not eyeballed. Everything readable passes WCAG AA comfortably: body copy 174/181/188 gray on the dark panel = **8.35:1**, the lighter "Review suggested: closed in the last 60 days…" helper text = **5.48:1**, place names (near-white) = **15.5:1**, the "Map" tab label = **7.63:1**, the selected "Places to visit" tab (dark-on-light) = **16.7:1**. No contrast finding.

## What's working

- **The landing view matches the task.** Opening straight into "Places to visit — 60 shown," ranked, with each row showing reports / after-closure / closures counts and a "Review suggested" chip, means the inspector sees their worklist first, not a map they have to interpret. This is the product's strongest idea.
- **Honest, scoped framing.** The helper text — "A review flag, not an inspection deadline" — actively prevents the tool from overclaiming, which the product brief explicitly requires. Good restraint.
- **List rows are large, well-chunked targets.** Each place button is 382×95px with a clean title / location·recency / metrics / chip stack. Easy to scan and easy to hit on both desktop and touch.

## What I'd tighten

1. **Header icon-buttons are cut off on mobile (Major, Accessibility/Usability — measured).** At 390px the refresh ("Check for new reports") and theme ("Use light colors") buttons render at left=380 and left=413, with right edges at **401px and 434px** — both past the 390px viewport, so they're clipped (the second is fully off-screen). They're also only **21px wide**, under the WCAG 2.5.8 24px minimum. The page doesn't scroll sideways, so on a phone the inspector can't refresh the data or switch theme. Fix the header to wrap or collapse these controls into the row at narrow widths, and give them a ≥24px hit area.

2. **The right-rail tool buttons overlap the list on mobile (Minor, Visual hierarchy — measured).** The floating Open Inspect / Insights / Ask rail (44×44px each, at x=330) sits on top of the full-width Places panel on a phone, landing over the right edge of the list rows and the neighborhood selector. It reads as stray controls floating on the content rather than a docked toolbar. Consider moving the rail into the header row or a bottom bar below ~768px so it doesn't cover the list.

3. **Two list entries look identical with no tiebreaker (Minor, Content).** Rows 2 and 3 both read "E Springfield St, 02118 · South End," and several other streets repeat (Cortes St, Commonwealth Ave appear multiple times). Since the list is the primary worklist, two visually identical rows give the inspector no way to tell which record is which before opening it. Consider adding a distinguishing detail to the row (street number, case id, or a short date range) so repeated streets are separable at a glance.

## Couldn't see — send a screenshot / a running interaction

- **Populated Inspect panel** (after selecting a place) — the report-after-closure and recorded-responses content, i.e. the product's core.
- **Insights** and **Ask** tabs.
- **Map-only view** (the "Map" header tab).
- Any **hover / focus / keyboard** behaviour (focus states and motion not judged from a static frame).

## Since last run

Compared with `docs/design-critique/latest.md` (2026-10-24 15:29). The product was redesigned and renamed (Rat Audit → **Piper**), swapping the light layer-panel landing for a dark "Places to visit" worklist.

- **Fixed — Mobile layout not responsive (was Major).** Confirmed gone: at 390px the page width now equals the viewport (no horizontal scroll), and the Places panel stacks full-width over the map instead of overlapping it off-screen.
- **Fixed — Interactive targets too small (was Major).** The 16×16 layer checkboxes and 29×16 city pills no longer exist; that whole panel was replaced. New primary targets (list rows 382×95, tabs 26px tall, rail 44×44) meet or exceed 24px. (One small regression remains — see new #1 header icons.)
- **Fixed — Floating Forecast card competing on the map (was Minor).** The floating "Forecast: next 4 weeks" card is gone from the default view.
- **Fixed — Unexplained strikethrough city pills (was Minor).** The strikethrough BOS/CAM/SOM pills were part of the removed layer panel; not present.
- **New — Header icon-buttons cut off on mobile (Major).** See #1.
- **New — Right-rail tool buttons overlap the list on mobile (Minor).** See #2.
- **New — Duplicate-looking list rows (Minor).** See #3.
- **Still open:** none from the prior report — all four prior findings are resolved by the redesign.
