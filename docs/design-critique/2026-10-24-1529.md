# Rat Audit — Design Critique

- **Date:** 2026-10-24 15:29 (local)
- **Target:** `http://localhost:3107/` — route `/` (single-page app)
- **Captured:** desktop 1280×900 (full page) + mobile 390×844, both real renders (not blank/error/loading)
- **Mode:** Heuristic critique (Mode A). Unattended run — no clarifying questions asked.

## Assumptions (unattended run)

- **Users:** Boston/Cambridge/Somerville staff and civic analysts reading rodent + 311 data on a desktop map; mobile is a secondary but plausible context.
- **Primary task:** read the heatmap, toggle signal layers and a time period, then click a point to inspect its report.
- **Maturity:** working release candidate (data is live: "updated 37 min ago").
- The orange **"Cache disabled"** pill (bottom-left) is a **Next.js dev-server toast**, not product UI. Not critiqued as a product finding; it will not appear in production.
- Only the default idle state of `/` was seen. No point was clicked, so the populated Inspect panel, the Insights/Ask tabs, the Act mode, and the Forecast overlay state were **not evaluated**.

## Overall read

A genuinely strong, information-dense desktop tool — the map does the heavy lifting and the layer panel is well organized — but it is **not responsive**: at 390px the desktop layout is reused unchanged, so the panel overlaps the map and the Inspect column is pushed off-screen. That is the single biggest thing to fix.

**Health: promising, needs work — 0 catastrophes, 2 major, 2 minor.**

Contrast was measured from computed styles, not eyeballed: every text treatment I could read passes WCAG AA comfortably (leading-signal green 7.6:1, weak-signal amber 7.1:1, "not tested" gray 7.8:1 — all against the white panel). So there is **no contrast finding** here.

## What's working

- **The map is the hero.** The red/blue heatmap reads instantly against a muted basemap; dense clusters (Cambridge, Dorchester, Seaport) pop without a legend lookup. Keep this.
- **Layer panel hierarchy is clear.** Grouping ("RAT SIGNALS", "FOOD & TRASH"), the per-signal city coverage pills (BOS/CAM/SOM), and the plain-language annotations ("the outcome we track", "leading signal, +0.11", "not tested") give each row a real story. This is the product's best idea.
- **Inspect empty state is honest.** "Click any point on the map to see the report…" tells the user exactly what to do instead of showing a blank panel. Good.

## What I'd tighten

1. **Mobile layout is not responsive (Major, Accessibility/Usability — measured).** At 390×844 the desktop three-column layout is reused: the left Layers panel overlaps the map, the header "Rat Audit" wraps, and the Inspect/Insights/Ask column is pushed almost entirely off the right edge ("what the city" is all that shows). The document is 420px wide in a 390px viewport, so the page also scrolls horizontally. The core inspect task is effectively unreachable on a phone. *Consider a single-column / drawer layout below ~768px, with the layer panel collapsible over the map.*

2. **Interactive targets are too small for touch (Major, Accessibility — measured).** Computed sizes: layer checkboxes **16×16px**, city pills (BOS/CAM/SOM) **29×16px**, period buttons (7 d / 30 d …) **49×24px**, Refresh **73×30px**. All fall under the WCAG 2.5.8 minimum of 24×24px (checkboxes and pills), and all under the 44×44px comfortable target. On the mobile layout these are the primary controls. Increase hit areas to ≥24px (ideally 44px) on touch — padding the checkbox/pill tap zone is enough; the visual size can stay.

3. **On-map overlays compete for the same corner (Minor, Visual hierarchy).** Top-left the Layers panel, top-center the floating "Forecast: next 4 weeks" checkbox card, and bottom-left the dev "Cache disabled" pill all sit over the map edges. The Forecast card floats with no visual tie to the panel it logically belongs with, so it reads as a stray control. *Consider docking Forecast into the Layers panel (or the period row) rather than floating it over the map.*

4. **The struck-through city pills have no explained meaning (Minor, Content).** Several rows show pills like ~~CAM~~ ~~SOM~~ in strikethrough beside solid BOS. The intent is clearly "signal not available for that city," but nothing on screen states that, and strikethrough-as-"not-covered" is not a convention a first-time user knows. *Add a one-line legend or a tooltip ("struck-through = not published by that city").*

## Couldn't see — send a screenshot / a running interaction

- **Populated Inspect panel** (after clicking a map point) — the whole right column's real content.
- **Insights** and **Ask** tabs, and the **Act** mode (header toggle).
- **Forecast overlay** turned on.
- Any **hover / focus / keyboard** behavior (U18 motion & focus states not judged from a static frame).

## Since last run

No previous report was found at `docs/design-critique/latest.md` — this is the first critique. Nothing to compare.
