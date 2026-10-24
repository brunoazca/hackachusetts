# Insights tab — Severity Ranking & Region Action Cards

Status: **spec, Oct 24.** Owners: **Gui** (front, `web/src/components/insights/**`),
**Bruno** (model + recommendation payload, `pipeline/rat_audit/model/**` +
`supabase/migrations/*_analytics_*.sql`). Builds on `CONTRACT.md`, `FORECAST_MAP.md`,
`v2-spec.md`, `RPC_PROPOSAL.md`. Nothing in those is deleted here — this file says
exactly what the Insights tab becomes and which existing data feeds it.

Read this whole file before touching front or model. Every number shown must cite a
`sources` row. Language rule stands everywhere: **"expected reports", never "rats".**

---

## 1. What the Insights tab is, in one line

> **Where it is worst, what the problem is, what you can do, what evidence backs it,
> and how it would look after the fix — ranked so a decision-maker acts on the top of
> the list first.**

It is not a forecast dump. It is a **prioritized action list**: the top N 250 m regions
ranked by *where fixing it buys the most*, each region a self-contained card a BRAP
coordinator or ISD inspector can read and act on without opening anything else.

The old Insights tab (findings table + forecast summary + price impact) becomes the
**evidence that lives inside each card**, not three separate sections. The city-wide
findings and the backtest move into a collapsed "methodology & evidence" area.

---

## 2. The user and the one decision

| User | The question this tab answers | What they do after |
|---|---|---|
| BRAP coordinator (primary) | Of all 250 m blocks in Boston, which 5 should I fund this month, and why those? | Picks a region, sends an inspector / work crew |
| ISD inspector (secondary) | Which blocks are worst and already have a recommended next step? | Opens the region on the map, acts |
| Councillor (read-only) | Where is it worst in my area and is the city doing something? | Reads, holds the city accountable |

The whole tab exists so **a person with budget authority can choose where to spend
next, and defend the choice with evidence.** A human always decides; the tab ranks and
explains, it never auto-assigns.

---

## 3. The four things that already exist (do not rebuild)

Everything the cards need — except the ranking math and the recommendation text — is
already in the database. Confirmed against the migrations and model code.

| Thing the card shows | Where it already lives | RPC / column |
|---|---|---|
| **Granularity 250 m** | `grid_cells` (3,442 cells, id `g250_<col>_<row>`), `predictions` keyed by `cell_id` | `grid_cells`, `predictions` |
| **Severity now** | `predictions.risk_band` (`low`/`elevated`/`high`/`very_high`), `predictions.expected`, `predictions.p_any` for the current / next week | `map_forecast`, `cell_detail` |
| **The future (after + before)** | `predictions` future rows (`actual is null`, next 4 weeks) **and** backtest rows (`actual is not null`, last 12 weeks) for the same cell | `cell_detail.forecast`, `cell_detail.history` |
| **The problems (drivers)** | `predictions.drivers` = `[{feature, label, contribution, value}]` top 3–5 per cell | `cell_detail.drivers` |
| **Evidence** | `correlations` (tested block-level findings + caveat + `source_ids`), `base_rates` (return rates), `site_detail` (closure history, nearby drivers, vacant parcels) | `insights_summary`, `base_rates`, `site_detail` |
| **Return chances** | `site_recurrence_logit` → `sites.summary.recur_p` (P(report returns within 60 days)); `base_rates` by prior-return bucket | `base_rates`, `sites.summary` |
| **Sources** | `sources` (name, url, retrieved_at, update_mode) referenced by id everywhere | `insights_summary.sources` |

**What does NOT exist yet and must be built:**
1. A **severity-×-benefit ranking** over the 250 m cells (§5). — Bruno
2. A **proposed solution** per region (recommendation rules already drafted in
   `v2-spec.md` §6; needs to be computed per cell and returned). — Bruno
3. A **"how it would look after the fix"** estimate per region (expected-report
   reduction if the recommended action is applied). — Bruno
4. The **region cards UI** and the ranked list. — Gui
5. One **RPC** that returns the ranked regions with everything a card needs (§7). — Bruno

---

## 4. The card — exactly what each one shows

One card = one 250 m region (one `cell_id`). Top N regions, N = 5 by default, with a
control to show 10 / 20. The card maps 1:1 to the five questions:

```
┌─ #1 · Dorchester · g250_142_88 ──────────── VERY HIGH ──┐
│                                                          │
│  SEVERITY NOW          8.4 expected reports / week       │  ← where it is worst
│                        92% chance of ≥1 report           │
│                        rank 1 of 3,442 blocks            │
│                                                          │
│  THE PROBLEM           Trash reports nearby (+3.1)       │  ← drivers, plain words
│                        Vacant lot within 40 m (+1.8)     │
│                        Demolition 90 d ago (+0.9)        │
│                                                          │
│  WHAT YOU CAN DO       Container compliance visit;       │  ← proposed solution
│                        sealed containers                 │     (Bruno's model)
│                        Because: trash tickets near site  │
│                                                          │
│  EVIDENCE              • Block-level trash↔rodent: weak   │  ← why these are the
│                          (ρ=0.18, n=3,442) [src]          │     problems
│                        • 2 past closures here, reports    │
│                          returned both times [src]        │
│                        • 42% base return rate (bucket 2)  │
│                                                          │
│  AFTER THE FIX         8.4 → ~5.3 expected / week         │  ← the future
│                        −3.1 over 4 weeks (model estimate) │
│                        62% chance reports return in 60 d  │
│                                                          │
│  [ Show on map ]  [ Open case ]      Model estimate ·     │
│                                       not a measured effect│
└──────────────────────────────────────────────────────────┘
```

### 4.1 The five blocks, field by field

| Block | Fields | Source |
|---|---|---|
| **Severity now** | `expected` (reports/week), `p_any` (% chance ≥1), `risk_band` badge, `rank` of 3,442 | `predictions` current week |
| **The problem** | top 3–5 `drivers`: plain `label`, signed `contribution`, optional `value`. Sort by `|contribution|` desc | `predictions.drivers` |
| **What you can do** | `recommendation.action` + `recommendation.because` + legal-lane tag (sanitation / exclusion / enforcement / referral) | new, §5.2 (Bruno) |
| **Evidence** | 1–3 bullets: relevant `correlations` row (strength + stat + caveat + source), this region's own closure history (returns), `base_rate` for its bucket | `insights_summary.correlations`, `site_detail`, `base_rates` |
| **After the fix** | `expected` now → `expected_after`, delta over 4 weeks, `recur_p` (chance of return in 60 d) | new, §5.3 (Bruno) + `sites.summary.recur_p` |

### 4.2 Hard rules on the card

- **Every number carries its source.** The severity and after-the-fix numbers cite the
  model run (`run_id`, `trained_through`, `computed_at`); evidence bullets cite
  `sources` rows by id, rendered as name + link + retrieved date.
- **The caveat is always visible**, not hidden: "Model estimate, not a measured
  effect." on severity and after-the-fix; the §5 selection-bias caveat on any city-wide
  "what worked" evidence bullet.
- **Legal lane** (`v2-spec.md` §5.2): the recommendation is sanitation, exclusion,
  enforcement or referral — **never** rodenticide/poison. If the model emits one, the
  card drops it and shows rule #5 "Inspect and record the cause".
- **Fewer reports ≠ fewer rats.** The "after the fix" number is a change in *expected
  reports*, labelled as such.
- **Missing data is explicit.** No recommendation yet → show "Recommendation pending";
  no after-fix estimate → show the severity and omit the after block with a one-line
  note. Never show a placeholder number.

---

## 5. The ranking & the two new model outputs (Bruno)

This is the only genuinely new modelling work. Three pieces: a severity score, a
recommendation per cell, and an after-fix estimate. The rank is severity × benefit.

### 5.1 Severity score per cell

Severity is already latent in `predictions`. Define a single ordered score per cell for
the **current/next forecast week** so cards can be ranked:

```
severity_score(cell) = expected          # expected reports/week, the primary sort key
tie-breakers, in order:  p_any  →  risk_band rank  →  cell_id   # deterministic
```

- Primary = `expected` (continuous, already stored). `risk_band` is the badge, not the
  sort key, because many cells share a band.
- Keep it this simple for the demo. Do **not** invent a weighted composite — `v2-spec.md`
  §5.1 forbids a composite score. `expected` is a raw model output, defensible.

### 5.2 Recommendation per cell

Apply the **recommendation rules already written in `v2-spec.md` §6** (first match
wins) to each ranked cell, using that cell's drivers + nearby records:

| # | When (computed from existing data) | Recommend | Because line |
|---|---|---|---|
| 1 | ≥2 monitoring/inspection closures here with a return after each | An option not yet tried: citation or abatement order | "Tried N times here; reports returned each time" |
| 2 | Vacant parcel within 40 m (`site_detail.adjacent_vacant_parcels`) | Joint block visit; notice to lot owner/agency | "Adjacency + parcel record" |
| 3 | Trash tickets / trash-311 are the top nearby drivers | Container compliance visit; sealed containers | "Tickets near site; NYC containerization (context)" |
| 4 | Cause tag = sewer in a recent note | Referral to BWSC catch-basin check | "Note text" |
| 5 | Otherwise | Inspect and record the cause | "Show the unknowns" |

Return shape per cell: `{ action, because, lane, rule_id }` where `lane ∈
{sanitation, exclusion, enforcement, referral, inspect}`. **Never** emit rodenticide.

> A 250 m cell may cover several addresses. Resolve the rule inputs from the
> **worst `site` inside the cell** (highest returns), via the existing `site_detail` /
> `draft_sites` logic joined to the cell. State in the payload which site the
> recommendation came from (`recommendation.site_id`) so the card's "Open case" works.

### 5.3 After-the-fix estimate per cell

The simplest honest estimate, labelled as a model estimate:

- `expected_after` = the cell's `expected` with the recommended driver's contribution
  removed. E.g. rule #3 (trash) → subtract the summed positive contribution of the
  trash-family drivers from `expected`, floored at the cell's baseline (season + lag
  terms). Use the **same GBM contributions already stored in `predictions.drivers`** —
  no new model, just arithmetic on stored `contribution` values.
- `delta_4w` = (`expected` − `expected_after`) × 4, the 4-week reduction.
- `recur_p` = from `site_recurrence_logit` for the worst site in the cell
  (`sites.summary.recur_p`), the chance reports return within 60 days if nothing
  changes — the "cost of doing nothing" counterpart to the fix.

Rules:
- If the recommended lane is "inspect" (rule #5, cause unknown) there is **no** after-fix
  number — show "unknown until inspected". Do not fabricate a reduction.
- Clamp `expected_after ≥ 0`. If removing contributions would go below the cell's
  intercept/seasonal floor, stop at the floor and say "floor reached".
- This is a **counterfactual on the model's own attributions**, not a measured
  intervention effect. The card label says exactly that.

### 5.4 Equity cut (P1, optional)

Offer a second ranking "worst within each neighborhood" (top region per hood) so a big
hood doesn't crowd out a small one — reuses `grid_cells.neighborhood`. Same card shape.

---

## 6. States (what the tab shows when data is partial)

The forecast exists (206k predictions, 6 model runs confirmed). Correlations,
price_impact and `sites` may be empty. Degrade per block, never blank the tab:

| Condition | Behaviour |
|---|---|
| Forecast present, no recommendation model yet | Cards rank by severity; "What you can do" = "Recommendation pending"; omit "After the fix" with a note |
| Forecast present, recommendations present, no `sites` | Cards show severity + recommendation + driver evidence; evidence bullets drop the return-history line; after-fix uses driver arithmetic only (no `recur_p`) |
| No forecast run at all | Tab shows the existing "Results not available yet" state (`PGRST202`), unchanged |
| A single cell missing drivers | Card shows severity + rank, "Problem drivers not available for this block", still rankable |

`insights_summary` already returns the forecast with `top_cells` (top 5 of next week)
— that is the **minimum viable version of this tab** today: those 5 cells are the first
5 cards, ranked by `expected`, with drivers as the problem and the existing forecast
caveat. Build on it.

---

## 7. The RPC (Bruno) — `insights_regions()`

One read-only RPC, same conventions as `insights_summary` (STABLE, security definer /
invoker per track convention, `GET`, anon key, every number joinable to `sources`).
Returns the ranked regions with everything a card needs so the front makes **one** call.

```sql
-- supabase/migrations/<ts>_analytics_insights_regions.sql  (analytics track)
create or replace function insights_regions(lim int default 5, hood text default null)
returns jsonb
language sql stable security definer set search_path = public as $$
  -- newest cell_week_poisson_gbm run with predictions (reuse forecast_run_id())
  -- 1. pick the forecast week = min(week_start) where actual is null
  -- 2. rank cells by expected desc, p_any desc, cell_id   → rank, limit lim
  -- 3. for each cell: drivers (from predictions.drivers),
  --    recommendation (rule engine §5.2, from worst site in cell),
  --    expected_after + delta_4w (§5.3), recur_p (sites.summary),
  --    evidence (matching correlations rows + base_rate bucket + site returns),
  --    neighborhood, source_ids
  select jsonb_build_object(
    'run',    (select to_jsonb(r) from model_runs r where r.id = forecast_run_id()),
    'week',   <forecast week>,
    'total_cells', 3442,
    'regions', jsonb_agg(region order by rank),
    'caveat', 'Model estimate of 311 rodent reports, not a count of rats.'
  );
$$;
```

### 7.1 Region object (the card's contract)

```ts
type InsightsRegion = {
  rank: number;                 // 1-based
  cell_id: string;              // g250_<col>_<row>
  neighborhood: string | null;
  lat: number; lon: number;     // for "Show on map" flyTo
  severity: {
    expected: number;           // reports/week, current forecast week
    p_any: number;              // 0..1
    band: "low" | "elevated" | "high" | "very_high";
    rank_of: number;            // = total_cells, for "rank 1 of 3,442"
  };
  problems: {                   // from predictions.drivers, sorted |contribution| desc
    label: string;              // plain language, e.g. "Trash reports nearby"
    contribution: number;       // signed, in expected-report units
    value: number | null;
  }[];
  recommendation: {             // §5.2; null when not computed yet
    action: string;
    because: string;
    lane: "sanitation" | "exclusion" | "enforcement" | "referral" | "inspect";
    rule_id: number;
    site_id: string | null;     // worst site in the cell, for "Open case"
  } | null;
  evidence: {                   // 1-3 bullets, each cited
    kind: "correlation" | "site_history" | "base_rate";
    text: string;
    strength?: "strong" | "moderate" | "weak" | "none";
    stat?: string;              // e.g. "ρ=0.18 · n=3,442"
    source_ids: string[];
  }[];
  after_fix: {                  // §5.3; null when lane = inspect or no estimate
    expected_after: number;
    delta_4w: number;           // reports avoided over 4 weeks
    floor_reached: boolean;
    recur_p: number | null;     // chance reports return in 60 d if nothing changes
  } | null;
  source_ids: string[];         // union of every source cited in the card
};

type InsightsRegionsPayload = {
  run: ModelRunRow | null;
  week: string;                 // ISO date of the forecast week
  total_cells: number;
  regions: InsightsRegion[];
  caveat: string;
  sources: SourceRow[];         // referenced source rows, as insights_summary
};
```

Add `sources` to the envelope exactly like `insights_summary` so the card can render
name + link + retrieved date. Keep all JSONB intact; narrow in `parse.ts`, never trust
raw (follow the existing `types.ts` note).

---

## 8. Front (Gui) — files and wiring

Owned path: `web/src/components/insights/**` (CONTRACT ownership = analytics track;
coordinate with Carol, this is the Insights panel she owns). New/changed files:

| File | Change |
|---|---|
| `types.ts` | Add `InsightsRegion`, `InsightsRegionsPayload` (copy §7.1). |
| `parse.ts` | Add `parseRegions(payload)` → `InsightsRegion[]`, narrowing JSONB, dropping rodenticide lanes, clamping, labelling missing fields. Mirror the existing defensive style. |
| `load.ts` / `useInsights.ts` | Add a fetch for `insights_regions` via `rpc("insights_regions", { lim, hood }, { get: true })`. |
| `RegionCard.tsx` *(new)* | The §4 card. Reuse `FindingChart`/driver bars where useful; theme tokens only. |
| `RegionList.tsx` *(new)* | Ranked list + "show 5 / 10 / 20" + optional "within neighborhood" toggle (§5.4). |
| `InsightsView.tsx` | Lead with `RegionList`. Move the city-wide findings + forecast backtest into a collapsed `<details>` "Methodology & evidence". Keep the existing empty/error/unavailable states. |
| `InsightsPanel.tsx` | Wire the new loader; keep `onShowForecast` and add `onShowRegion(cell_id)` → map-store `flyTo` + `select({kind:'cell', id})` + `setLayers({forecast:true})`. |

Map integration is **through the existing map-store** (`flyTo`, `select`, `setLayers`,
`setForecastWeek`) — no map file edits (Gui owns map, but keep this panel's coupling to
the store only). "Open case" uses `select({kind:'site', id: recommendation.site_id})`.

### 8.1 Accessibility (scored — do not skip)

- Each card is a `<section>` with an `aria-labelledby` heading = "Rank N · neighborhood".
- The ranked list is an ordered list (`<ol>`); rank is conveyed in text, not only color.
- `risk_band` badge has a text label, never color alone; AA contrast on every surface.
- Driver bars and the after-fix bar have a text equivalent (number + unit).
- Buttons ≥ 40 px target; full keyboard order; `aria-live="polite"` when the list reloads.
- The whole tab is operable at 1280×800 and keyboard-only (R9).

---

## 9. Build order

| Step | Owner | Done when |
|---|---|---|
| 1. `RegionCard` + `RegionList` render from `insights_summary.forecast.top_cells` (severity + drivers only) | Gui | Top 5 cells show as ranked cards today, no new RPC |
| 2. Rule engine §5.2 computed per cell | Bruno | Each top cell has a recommendation + lane, rodenticide impossible |
| 3. After-fix arithmetic §5.3 | Bruno | Each non-inspect cell has `expected_after` + `delta_4w` |
| 4. `insights_regions()` RPC §7 returns the full region object | Bruno | One GET returns N cards' data incl. evidence + sources |
| 5. Front switches to `insights_regions`, collapses old sections into methodology | Gui | Tab is the §4 ranked action list end to end |
| 6. Equity toggle §5.4 | Gui + Bruno | "Within neighborhood" re-ranks |

Step 1 is shippable **now** against existing data and is the demo-safe fallback. Steps
2–5 are the real feature. Step 6 is P1.

---

## 10. Acceptance criteria (this is law)

1. The tab shows a ranked list of 250 m regions, worst first, default top 5.
2. Each card answers all five: **where worst · the problem · what to do · evidence ·
   after the fix** — or explicitly says which piece is pending.
3. Every number cites a source (model run for forecast numbers; `sources` rows for
   evidence); the "model estimate, not a measured effect" caveat is visible on each card.
4. No card ever recommends rodenticide or poison (property test, `v2-spec.md` V7.3).
5. "Show on map" flies to and selects the cell; "Open case" opens the worst site in it.
6. With the recommendation/after-fix model absent, the tab still ranks by severity and
   degrades per §6 — it never blanks and never shows placeholder numbers.
7. Keyboard operable, AA contrast, rank conveyed in text, 1280×800 (§8.1).
8. One read-only RPC call powers the tab (`insights_regions`), GET + anon key, STABLE.

---

## 11. Open questions for Carol

- Default N: 5 confirmed. Keep 10/20 controls? (assumed yes)
- After-fix estimate: driver-contribution arithmetic (§5.3) is the honest minimum. OK to
  ship that, or hold the "After the fix" block until a measured trial exists?
- Does the ranked region card **replace** the city-wide findings view, or sit above it
  with findings collapsed below? (spec assumes: replace as the lead, findings collapse
  into "Methodology & evidence")
