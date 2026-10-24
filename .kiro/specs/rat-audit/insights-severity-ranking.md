# Insights tab — Severity Ranking & Region Action Cards

Status: **spec, Oct 24 (rev. 2 — Bruno's direction merged, see §0).** Owners:
**Carol** (insight structures: ranking SQL, region/cluster assembly, evidence, the
`insights_regions` RPC, the `insights` table and the AI-agent tool — `supabase/migrations/*_analytics_*.sql`,
`web/src/lib/agent/**`), **Gui** (front, `web/src/components/insights/**`),
**Bruno** (models only: forecast `predictions` + the per-record solution model
`record_solutions`, `pipeline/rat_audit/model/**`). Builds on `CONTRACT.md`, `FORECAST_MAP.md`,
`v2-spec.md`, `RPC_PROPOSAL.md`. Nothing in those is deleted here — this file says
exactly what the Insights tab becomes and which existing data feeds it.

---

## 0. Product direction (Bruno, Oct 24) — overrides anything below that disagrees

1. **Rank 250 m cells by severity**, where severity = the problems already in the cell
   **plus** the severity forecast for the future **plus the chance that reports return at
   the cell's addresses** (per-site/per-record return probability, §5.1). Not the forecast
   alone. **Read it from `cell_severity` — do not recompute it.**
2. **One card per ranked region** with: (a) the problems and the estimated future,
   (b) the proposed solution, (c) evidence of possible causes around it (§4).
3. **Proposed solution is per region (cell/cluster), written by AI, grounded in a
   per-record model.** Two layers (§5.2):
   - **Model, per record** (`record_solutions`, Bruno, done): for each rodent report,
     the action the city took (read from the closure note) and the predicted chance of a
     return within 60 days under every legal action. This is the AI's grounding data.
   - **AI, per region** (`region_solutions`, Bruno's batch job, small model): reads the
     region's records + their model rows + drivers + nearby evidence, and writes
     **one solution for the region** and **one short line per record** ("what to do with
     this report"). It may only use numbers present in its input; output is schema-checked
     and legal-lane filtered. Without AI the card falls back to the §5.2 rules.
4. **Cards are ordered** in the Insights tab, worst first, **and the AI agent can read
   them** (§7.2).
5. **Grid cuts.** A hotspot split across 2–4 cells must not lose rank or appear as
   several cards; evidence must not stop at the cell border (§5.5).
6. Split of work: **Carol** builds the insight structures (table, RPC, clustering,
   evidence, agent tool); **Bruno** builds the models (forecast, `record_solutions`,
   the AI `region_solutions` job); **Gui** builds the cards.

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
| **Block profile** (demographics + building age) | `grid_cell_context.attrs` per cell: ACS income/poverty/renters/people of color/limited English/old housing, CDC asthma, Boston SVI shares, people/km² (area-weighted from overlapping tracts) + parcels, median year built, % built before 1900/1940, % from 1980, units, % owner-occupied, median value (assessor parcels in the cell). `source_ids` per cell. Migration `20261025100001_analytics_cell_context.sql` | `cell_context(cell_id)`, `map_cell_context()` |

**What does NOT exist yet and must be built:**
1. A **severity ranking** over the 250 m cells, past + future, edge-safe (§5.1, §5.5). — Carol (SQL over Bruno's `predictions`)
2. A **per-record solution model** (`record_solutions`, §5.2). — Bruno (`pipeline/rat_audit/model/solution.py`)
3. The **AI region solution** + per-record lines (`region_solutions`, §5.2, §5.6). — Bruno (batch job; reads Carol's region rows)
4. **Evidence of possible causes nearby** per region (§4.1). — Carol
5. A **"how it would look after the fix"** estimate per region (§5.3). — Carol (arithmetic on Bruno's outputs)
6. The **region cards UI** and the ranked list. — Gui
7. One **RPC** that returns the ranked regions with everything a card needs (§7) + agent tool (§7.2). — Carol

---

## 4. The card — exactly what each one shows

One card = one region: a 250 m cell, or a cluster of adjacent hot cells merged by §5.5
(`region_id`, with its `cell_ids`). Top N regions, N = 5 by default, with a control to
show 10 / 20. The card maps 1:1 to the five questions (sketch below is the original;
rev. 2 adds the SEVERITY "now vs next 4 weeks" split, NEARBY CAUSES and the RECORDS list —
see §4.1):

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
| **Severity (problems + future + returns)** | `observed_12w` (rodent reports in the last 12 weeks, the problems already here), `expected_4w` (forecast, next 4 weeks), `expected_returns_60d` (per-site return chance summed over active addresses), `severity` = their sum (§5.1), `p_any`, `risk_band` badge, `rank` | `cell_severity` (+ `predictions` for `p_any` / band) |
| **The problem** | top 3–5 `drivers`: plain `label`, signed `contribution`, optional `value`. Sort by `|contribution|` desc | `predictions.drivers` |
| **What you can do** | region solution: `action`, `because` (cites records/evidence), legal lane, `source` = `ai` or `rules`; + the model's per-action return chances for the region (mean of its records) | `region_solutions` (§5.2) |
| **Records** | the region's rodent reports, last 12 weeks, newest first (max 10, "show all"): date, block, status, what the city did (`done_action`), **what to do with this report** (AI line, else model's best action), P(return 60 d) | `incidents` + `record_solutions` + `region_solutions.records` |
| **Evidence — possible causes nearby** | within **150 m of the region's records** (not the cell border, §5.5): vacant parcels (40 m), restaurants, dumpsters / trash-storage / dumping / missed-trash 311 in the last 90 days, excavation & demolition permits, city lots, schools; each with count + distance to the nearest record + `source_ids`. Plus 1–2 `correlations` rows that test that cause (strength + stat + caveat), the region's own closure history (returns), `base_rate` | `places`, `incidents`, `correlations`, `base_rates`, `sources` |
| **After the fix** | `expected` now → `expected_after`, delta over 4 weeks, `recur_p` (chance of return in 60 d) | §5.3 + `record_solutions` |

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

## 5. The ranking & the new outputs

Four pieces: a severity score (past + future), edge-safe regions, a solution per region
(AI over a per-record model), and an after-fix estimate.

### 5.1 Severity score per cell — problems now + forecast future + return chance (Bruno computes, Carol reads)

Severity has **three terms**: the problems already in the cell, the predicted future, and
the **per-site return chance** (how likely reports come back at the cell's active
addresses if they are handled as now). All three are counted in the same unit (rodent
reports), so the sum is a count, not a weighted composite (keeps `v2-spec.md` §5.1 intact):

```
observed_12w(cell)         = rodent reports opened in the cell in the last 12 weeks        # incidents, category='rodent'
expected_4w(cell)          = Σ predictions.expected over the next 4 forecast weeks          # actual is null
expected_returns_60d(cell) = Σ over addresses with a report in the last 12 weeks of
                             record_solutions.p_return_monitoring of the address's latest record
                             # P(a rodent report returns to that address within 60 days if handled
                             # as now); the per-site return probability, per record because
                             # `sites.summary.recur_p` is empty
severity(cell)             = observed_12w + expected_4w + expected_returns_60d             # reports
smoothed(cell)             = severity + 0.5 × Σ severity of the 8 neighbours                # §5.5
ranked on smoothed; tie-breakers: expected_4w → p_any (week 1) → cell_id
```

**This is materialised — use it, do not re-derive it.** Table `cell_severity` (migration
`20261024500006_cell_severity.sql`, public read), written by
`pipeline/rat_audit/model/region_solution.py` on every run, one row per Boston cell
(3,586): `cell_id, forecast_run_id, observed_12w, expected_4w, expected_returns_60d,
severity, smoothed, rank, region_id, computed_at`. `region_id` links the cell to its
`region_solutions` card. Carol's `insights_regions()` and `insights` table **SHALL rank
from `cell_severity`** so the tab, the agent and the AI solutions use the same order.
Region severity = Σ of its cells' terms (also in `region_solutions.input->'region'->'severity'`).

- Show all three parts on the card ("88 reports in the last 12 weeks · 19.3 expected in
  the next 4 · 10.2 expected to return within 60 days"), so the reader sees whether it is
  ranked for its past, its future, or its chronic addresses.
- `risk_band` stays the badge (week 1), never the sort key.
- When `sites.summary.recur_p` is filled, it may replace the per-record term for sites
  that have it (same meaning, same unit). Until then `record_solutions` is the source.
- Note: the forecast already reflects history, so chronic addresses weigh a little
  twice. That is intended: returning addresses are what the program can act on.

### 5.2 Solution per region — AI over a per-record model (Bruno)

**Layer 1 — per-record model, `record_solutions` (built: `pipeline/rat_audit/model/solution.py`).**
One row per Boston rodent report since 2025-01-01:

| Column | Meaning |
|---|---|
| `incident_id` | `incidents.id` |
| `done_action` | what the city did, read from the closure note by rules (`monitoring`, `inspection`, `abatement_order`, `citation`, `warning`, `referral`, `cleanup`, `barrels`, `baiting`, `carcass`, `no_violation`, `duplicate`, `unknown`, `open`…). Analytics' `incidents.action_tag` is not touched. |
| `action`, `label`, `owner` | the legal action with the lowest predicted return; `inspection` ("inspect and record the cause") when nothing beats monitoring by ≥ 2 points |
| `p_return`, `p_return_monitoring`, `gain`, `confident` | P(rodent report at the same address within 60 days) under that action vs under monitoring |
| `alternatives` | `[{action, label, p_return, n_cases}]` for every allowed action, sorted |
| `because` | up to 3 context facts above the city median (e.g. "4 earlier rodent reports at this address", "2 vacant parcels within 40 m") |
| `model_run_id`, `caveat` | `model_runs` row (`record_solution_gbm`); "not a measured effect" caveat |

Model: gradient-boosted classifier, y = return within 60 days at the same address,
features = action + context known at closure (earlier reports at the address, 311
co-signals on the block in the last 90 days, places within 40/100 m, season). Time split,
last 26 weeks held out: **AUC 0.69 vs 0.50 base rate; context-only AUC 0.70**, i.e.
the action adds almost no predictive power. The per-action differences are therefore a
**weak, confounded signal** (inspectors choose actions by situation). Never call them
an effect; use them as one input among the evidence. Legal lane only: baiting and carcass
removal are never proposed.

**Layer 2 — AI, per region, `region_solutions` (Bruno's batch job, runs after Carol builds the regions).**
Input per region (JSON, nothing else): drivers, severity parts, the evidence list
(§4.1), the region's records (last 12 weeks; max 30, worst first) with their
`record_solutions` rows and scrubbed closure notes, and the §5.2 rule result below.
Model: small and cheap (Claude Haiku), temperature 0, cached by a hash of the input.
Output (JSON schema, validated):

```ts
{ action: string; lane: "sanitation"|"exclusion"|"enforcement"|"referral"|"inspect";
  because: string;            // ≤ 2 sentences, every number must appear in the input
  cites: string[];            // evidence ids / incident ids / source ids used
  records: { incident_id: string; todo: string }[];   // ≤ 1 line per record
  unknowns: string[] }        // 1–3 checks to do on site (R3.11)
```

Guards: reject output whose numbers are not in the input, whose lane is outside the
legal lane, or that mentions bait/poison/rodenticide → fall back to the rules. Store
`source = 'ai' | 'rules'` and the model id. Per-record `todo` lines are only generated
for the region's records (≈ 5–20 regions × ≤ 30 records), not for all 10k reports;
records outside the ranked regions show the Layer-1 `label`.

**Fallback — rules** (when there is no AI output), from `v2-spec.md` §6, first match
wins, using the region's drivers + nearby records:

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

### 5.3 After-the-fix estimate per region

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
- Second number, from `record_solutions`: mean `p_return` of the region's records under
  the proposed action vs under monitoring ("chance a report comes back: 18% → 14%").
  Same caveat; hide it when `confident` is false for most records.

### 5.4 Equity cut (P1, optional)

Offer a second ranking "worst within each neighborhood" (top region per hood) so a big
hood doesn't crowd out a small one — reuses `grid_cells.neighborhood`. Same card shape.

### 5.4a Population per 250 m cell — area-weighted from tracts (Carol/Bruno, SQL)

Population exists only at **census tract** level (`tracts.attrs.acs.pop`, via ACS). A
tract is ~2–5k people across many blocks; the grid is 250 m. To put people on the card
and (optionally) on the ranking, rate each tract's population down to the cells.

**Why area-weighting, not point-in-polygon.** A cell often straddles 2–3 tracts, and a
tract covers many cells. Assigning a cell the full pop of "its" tract double-counts.
Instead, split each tract's pop across the cells by the **share of the tract's area that
falls in each cell** — standard areal interpolation. Population is assumed uniform within
a tract (the honest caveat; ACS gives no finer truth).

```
pop(cell) = Σ over tracts t intersecting the cell:
              tract_pop(t) × area(cell ∩ t) / area(t)
```

**Materialize once** (the grid and tracts are static) into a small table, so the RPC
never does live PostGIS intersection per request:

```sql
-- supabase/migrations/<ts>_data_cell_population.sql   (data track; grid+tracts are static)
create table if not exists cell_population (
  cell_id   text primary key references grid_cells(id),
  pop       numeric not null,          -- area-weighted people in the cell
  tract_ids text[]  not null,          -- tracts that contributed (for the citation)
  source_id text    not null references sources(id)  -- the ACS source row
);

insert into cell_population (cell_id, pop, tract_ids, source_id)
select g.id,
       coalesce(sum(
         (t.attrs->'acs'->>'pop')::numeric
         * st_area(st_intersection(g.geom::geometry, t.geom::geometry))
         / nullif(st_area(t.geom::geometry), 0)
       ), 0) as pop,
       array_remove(array_agg(distinct t.geoid), null),
       '<acs-source-id>'          -- the sources row id for the ACS pull
from grid_cells g
left join tracts t
  on t.city = 'boston'
 and st_intersects(g.geom::geometry, t.geom::geometry)
group by g.id;

alter table cell_population enable row level security;
create policy "public read" on cell_population for select using (true);
```

Notes:
- Cast `geography → geometry` for `st_area`/`st_intersection`; the areas are a **ratio**,
  so planar area in 4326 is fine for weighting (no equal-area reprojection needed for the
  split). If a reviewer wants metric areas, wrap in `::geography` on both sides — the
  ratio barely moves at Boston's latitude.
- Cells with no tract overlap (edge of city, water) get `pop = 0` and an empty
  `tract_ids` — show "population not available", never a fake number.
- `source_id` points at the ACS `sources` row so the card cites it like every other fact.
- Re-run only when the grid or the tract set changes (both static). Owner: data track
  builds the table; analytics/Carol join it in `insights_regions` (§7).

**How the card and ranking use it.** Two distinct uses — pick explicitly, do not blend
silently:

1. **People affected (display + benefit).** Show `pop` on the card ("~1,900 residents in
   this block") and expose `people_affected = pop` so the ranking can prefer regions
   where a fix reaches more people. This fits the "best benefit" goal: a tie-break or a
   second "by people reached" ranking, **not** folded into the severity score as a weight
   (the spec forbids a weighted composite, §5.5 / v2 §5.1).
2. **Rate (diagnostic only, caveated).** `reports_per_1k = expected_week / pop × 1000`.
   Useful to spot a small-population block that is intense per capita — but **do not rank
   on it by default**: low reports can mean low reporting, not low rodents (v2 §5), and
   dividing by a small pop explodes the rate. Offer it as an optional view with the
   caveat printed, never as the primary sort.

Add to the region object (§7.1): `population: { pop: number; tract_ids: string[];
reports_per_1k: number | null; source_ids: string[] } | null`.

**Decision (Bruno, Oct 24) — supersedes "not folded into the severity score" above.**
Residents *are* a weight on the region ranking: `weighted_score = score × (1 + log10(1 +
residents / 1000))`, where `score` stays in reports (observed 12 w + expected 4 w + expected
returns 60 d) and `residents` is Σ `cell_population.pop` over the region's cells. Log so a
dense block cannot swamp the report counts (weight ≈ 1.3 at 1k, 2.0 at 9k, 2.3 at 20k).
Stored in `input.region.severity.{residents, people_weight, weighted_score}`; regions are
ranked by `weighted_score` (`region_solution.py`). The card shows "~N residents" and the
weight in the analysis. No other demographic is used on the Insights cards; the full block
profile (`grid_cell_context`) lives on the map only.

### 5.5 Grid cuts — keep hotspots whole (Carol, SQL)

A fixed 250 m lattice splits a hotspot that sits on a cell corner into up to 4 cells.
Each looks medium, so the hotspot drops in rank, or it shows as 3 near-duplicate cards,
and evidence stops at the border. Fixes, all cheap and done in SQL over `grid_cells`
(`col`, `row`):

1. **Smooth before ranking.** `smoothed_severity(c) = severity(c) + 0.5 × Σ severity(n)`
   over the 8 neighbours `n` (3×3 kernel, centre 1, ring 0.5). A hotspot split across
   cells now scores like a hotspot. The card still shows the cell's own raw numbers.
2. **Merge into regions.** Take cells in the top 5% of `smoothed_severity`; join
   8-connected neighbours into clusters (connected components). One cluster = one card
   (`region_id` = its top cell's id, `cell_ids` = all members, capped at 9 cells /
   ~750 m; bigger clusters split at their local maxima). Region severity = sum of the
   members' raw severity; rank regions by it. **Region population = sum of the members'
   `cell_population.pop`** (union their `tract_ids` for the citation), so a merged card
   reports the people across the whole hotspot, not one cell.
3. **Non-max suppression for singletons.** A lone cell becomes a card only if it is the
   local maximum of `smoothed_severity` in its 3×3 neighbourhood; otherwise it is folded
   into the neighbour's card.
4. **Evidence by distance, not by cell.** Nearby causes (§4.1) are counted within 150 m
   of the region's records (PostGIS `ST_DWithin` on `geography`), so a vacant lot 20 m
   across the border counts.
5. **Sanity check (P1).** Re-run the ranking on the lattice shifted by 125 m (half a
   cell) in x and y; report how many of the top 10 regions overlap. If < 7 of 10, raise
   the smoothing ring weight. Report the number in the methodology area.

### 5.6 AI layer — rules (Bruno's job, Carol's agent reads the result)

- The AI writes, it does not decide numbers: every number in its text must exist in its
  input JSON (checked). It sees scrubbed notes only (no names, no full addresses).
- It must say when the evidence is thin ("2 reports, no closure notes: inspect first").
- Output is stored, not generated on page load: `region_solutions` is recomputed after
  each forecast scoring run, so the tab and the agent read the same text.

### 5.7 Implemented (Bruno, Oct 24) — `region_solutions` is live

`pipeline/rat_audit/model/region_solution.py` → `region_solution(conn)`; table
`supabase/migrations/20261024500005_region_solutions.sql` (public read). **20 rows are in
the DB now (19 AI, 1 rules fallback).** Carol / Gui / agent can build against it today.

- **Regions:** until Carol's `insights` table exists, the job builds the regions itself
  exactly per §5.1 + §5.5 (12-week observed + 4-week expected, 3×3 smoothing with ring 0.5,
  top 5 % cells, hill-climb to local maxima = clusters, ≤ 9 cells). `region_id` = the
  cluster's top cell id. When `insights` lands, either adopt these regions (read
  `region_solutions.input->'region'`) or point the job at `insights` — same ids.
- **What the AI sees** (stored verbatim in `region_solutions.input`, so cards and the agent
  can show the same evidence):
  `region` (rank, cell_ids, severity parts) · `forecast` (next 4 weeks expected, week-1
  chance of ≥ 1 report and risk bands, last 8 weeks expected vs actual, top drivers) ·
  `records_last_12_weeks` (≤ 30: date, block, status, what the city did, scrubbed note,
  earlier reports at the address, situation, the `record_solutions` options) ·
  `address_histories` (blocks with ≥ 2 reports in 2 years: action ladder in order +
  returns) · `possible_causes_within_150m` (places + 311 last 90 days, count, nearest m,
  source_ids) · **`solution_statistics`**: for all Boston closed rodent cases and for the
  region's top 3 situations (history at the address × trash 311 on the block × vacant
  parcel within 40 m), per action — monitoring, inspection, abatement, citation, warning,
  referral, cleanup, barrels, ISD treatment, no violation — the cases, share of cases,
  60-day return rate with 95 % interval, model-adjusted return, and whether proposable.
- **AI:** `anthropic/claude-haiku-5.5` through the Vercel AI Gateway (`VERCEL_OIDC_TOKEN`
  or `AI_GATEWAY_API_KEY`), temperature 0, forced tool call `submit_solution` (valid JSON
  guaranteed). Guards: lane enum, never the words bait/poison/rodenticide, every number
  must appear in the input (plus spec constants 40/60/90/100/150/250), every record gets a
  `todo`. Up to 3 attempts with the rejection reason, then the §5.2 rules
  (`source='rules'`, `rule_id`, `guard_errors` says why).
- **Guards added after review (rev. 3):** (1) output may not contain bait/poison/
  rodenticide/treat/treatment/exterminate in any form; past baiting closures are shown to
  the AI as "earlier ISD visit". (2) `region.headline_facts` gives the severity phrases
  ("3.5 expected reports in the next 4 weeks", "1.1 expected returns within 60 days…") and
  the AI must copy them, so a number never changes meaning. (3) each situation table marks
  every action `vs_monitoring` (lower clear / lower not clear / same or higher) and lists
  `proposable_actions_with_lower_return_than_monitoring`; an action that did no better
  than monitoring in all of the region's situations is rejected in code. (4) nearby causes
  carry `per_report_within_150m`, `boston_per_report_within_150m`, `times_boston`; "well
  above Boston" only at ≥ 2×. (5) `region.what_is_specific_here` (causes ≥ 2× Boston, named
  repeat blocks, sewer notes) and the AI must lead with it. Card UI should show
  `times_boston` next to each cause.
- **Columns:** `region_id, forecast_run_id, rank, cell_ids, action, lane, because, cites,
  records [{incident_id, todo}], unknowns, rule_id, source, llm_model, input_hash, input,
  guard_errors, caveat, computed_at`.
- Run after scoring: `record_solution(conn)` then `region_solution(conn)`; ~2 min for 20
  regions.

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

## 7. The RPC (Carol) — `insights_regions()`

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
  region_id: string;            // = top cell id of the cluster (§5.5)
  cell_id: string;              // top cell, g250_<col>_<row>
  cell_ids: string[];           // all cells merged into this region (1..9)
  neighborhood: string | null;
  lat: number; lon: number;     // for "Show on map" flyTo
  severity: {
    observed_12w: number;       // rodent reports in the region, last 12 weeks
    expected_4w: number;        // forecast, next 4 weeks
    expected_returns_60d: number; // Σ per-address return chance, record_solutions (§5.1)
    score: number;              // observed_12w + expected_4w + expected_returns_60d (§5.1), from cell_severity
    expected: number;           // reports/week, current forecast week
    p_any: number;              // 0..1
    band: "low" | "elevated" | "high" | "very_high";
    rank_of: number;            // = total_cells, for "rank 1 of 3,442"
  };
  records: {                    // last 12 weeks, newest first, max 30
    incident_id: string;
    opened_at: string;
    address_block: string | null;
    status: "open" | "closed";
    done_action: string;        // from record_solutions
    todo: string;               // AI line (region_solutions) else record_solutions.label
    p_return: number | null;    // under the proposed action
  }[];
  nearby_causes: {              // §4.1, within 150 m of the region's records
    kind: string;               // vacant_parcel | restaurant | trash_storage_311 | dumping_311 | excavation | ...
    label: string;
    count: number;
    nearest_m: number;
    source_ids: string[];
  }[];
  problems: {                   // from predictions.drivers, sorted |contribution| desc
    label: string;              // plain language, e.g. "Trash reports nearby"
    contribution: number;       // signed, in expected-report units
    value: number | null;
  }[];
  recommendation: {             // §5.2; null when not computed yet
    action: string;
    because: string;
    lane: "sanitation" | "exclusion" | "enforcement" | "referral" | "inspect";
    source: "ai" | "rules";
    rule_id: number | null;     // when source = rules
    cites: string[];            // evidence / incident / source ids
    unknowns: string[];         // 1-3 on-site checks
    p_return_proposed: number | null;   // mean over records, record_solutions
    p_return_monitoring: number | null;
    site_id: string | null;     // worst site in the region, for "Open case"
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
  context: Record<string, number> | null; // grid_cell_context.attrs: demographics + building age.
                                // Context only, shown collapsed ("Block profile"); never a driver or a cause.
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

Storage: Carol materialises the ranked regions into an `insights` table (one row per
region per forecast run: `region_id`, `rank`, `cell_ids`, `payload jsonb` = the region
object minus the AI fields, `run_id`, `computed_at`). Bruno's AI job reads `insights`,
writes `region_solutions (region_id, run_id, action, lane, because, cites, records,
unknowns, source, llm_model, input_hash, computed_at)`. `insights_regions()` joins the
two. Recompute order after each scoring run: `predictions` → `record_solutions` →
`insights` → `region_solutions`.

### 7.2 AI agent access (Carol)

The assistant (`web/src/lib/agent/**`) gets two server tools over the same RPC, so the
agent and the tab always agree:

- `get_insights({ limit?, neighborhood? })` → `insights_regions(lim, hood)`, returns the
  ranked cards (compact: rank, region, severity parts, recommendation, top 3 causes).
- `get_insight({ region_id })` → one full card incl. records and their `todo` lines.

Plus a client tool `show_insight(region_id)` → map-store `flyTo` + select the region.
The agent prompt says: answer "where should we act / what should we do here" from these
tools first, quote the card's numbers and caveat, never invent a recommendation.

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
| 2a. `record_solutions` model §5.2 layer 1 | Bruno | Table filled for every rodent report since 2025-01-01 (model written) |
| 2a'. `cell_severity` §5.1 (3 terms incl. return chance) | Bruno | Done: 3,586 cells, written with `region_solutions` |
| 2b. Regions §5.5 + nearby causes §4.1 → `insights` table, **ranked from `cell_severity`** | Carol | Top regions materialised, hotspots on corners appear once, same order as `cell_severity` |
| 2c. Rule engine fallback §5.2 | Carol | Each region has a rules recommendation, rodenticide impossible |
| 3. After-fix arithmetic §5.3 | Carol | Each non-inspect region has `expected_after` + `delta_4w` |
| 3b. AI `region_solutions` §5.2 layer 2 | Bruno | Each ranked region has an AI solution + per-record lines, guards pass |
| 4. `insights_regions()` RPC §7 + agent tools §7.2 | Carol | One GET returns N cards; agent answers "where to act" from it |
| 5. Front switches to `insights_regions`, collapses old sections into methodology | Gui | Tab is the §4 ranked action list end to end |
| 6. Equity toggle §5.4 | Gui + Carol | "Within neighborhood" re-ranks |

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
9. Severity shows all three parts (last 12 weeks observed + next 4 weeks expected +
   expected returns within 60 days) and the ranking reads `cell_severity` — no other
   severity formula anywhere (RPC, agent, front).
10. A hotspot on a cell corner appears as **one** card, not several (§5.5); nearby causes
    are counted by distance, not by cell membership.
11. Each card lists its records with "what to do" per record; the region solution is AI
    (grounded, guarded) or rules, and says which.
12. The AI agent can list and open the same cards (§7.2) and gives the same answer as the tab.

---

## 11. Open questions for Carol

- Default N: 5 confirmed. Keep 10/20 controls? (assumed yes)
- After-fix estimate: driver-contribution arithmetic (§5.3) is the honest minimum. OK to
  ship that, or hold the "After the fix" block until a measured trial exists?
  (Bruno: ship it, with the caveat, plus the `record_solutions` return-chance line.)
- Severity: resolved — past 12 weeks + next 4 weeks + per-site return chance, in reports,
  materialised in `cell_severity` (§5.1).
- Solution: resolved — per region by AI, grounded in the per-record model (§5.2).
- Does the ranked region card **replace** the city-wide findings view, or sit above it
  with findings collapsed below? (spec assumes: replace as the lead, findings collapse
  into "Methodology & evidence")

---

## 12. Rev. 3 — one Insight panel, behaviour by what is clicked (Bruno, Oct 24)

**Inspect and Insights merge into one panel.** Layout (to build on the new UI main, not before):
the **Insight panel on the left**, **chat (Ask) on the right**, **filters at the bottom** of the page.
The panel shows the ranking when nothing is selected and changes with each click. Same card skeleton
for every kind: **Where/what → Outlook → What to do → Evidence → Related records → Sources & caveat**.
Place names are links (§5.7 `locations`), report ids are links; Back returns to the previous
selection, Esc clears to the ranking (`map-store.history` / `back()`).

| Selection (`map-store.selection`) | Call | Panel | Map |
|---|---|---|---|
| nothing | `region_solutions` by rank | ranked region cards (AI, top 100) | forecast layer |
| `cell` | `area_insight([cell_id])` | the cell's region card if it is in a ranked region, else its own cell card (`cell_solutions`, rules + "Generate AI analysis" → `POST /api/insight-ai` → Modal `insight_ai`, cached) | fly to it, outline cells, highlight its reports |
| `area` (drawn polygon) | `area_insight_polygon(geojson)` | summed severity + forecast, the ranked regions and worst cells it touches | outline |
| `incident`, rodent | `record_insight(id)` | **Outlook:** chance a report comes back within 60 days if monitored vs with the best action, cell forecast · **What to do:** the area card's line for this report, else the per-record model · **Evidence:** causes within 150 m (×Boston), address action history | fly to it (z17), highlight address history |
| `incident`, any other 311 / `place` | `record_insight` routes non-rodent ids to `evidence_insight('incident', id)`; places → `evidence_insight('place', id)` | what it is; rodent reports within 150 m 90 days before vs after (fixed places: last 12 months); the list of those reports (clickable → their record insight); same-kind density vs Boston; caveat "near, not proven caused" | fly to it, highlight related reports |
| `site`, parcel, event, listing, tract | existing detail views (unchanged) | — | — |

Backend (Bruno, live): RPCs `area_insight`, `area_insight_polygon`, `record_insight`, `evidence_insight`
(+ helpers `cell_of`, `nearby_causes`, `cells_forecast`, `cause_label`) in
`20261024500009_insight_rpcs.sql`; tables `cell_solutions`, `cause_baselines`
(`20261024500008`); `record_solutions` now covers every rodent report since 2023; AI cards for the
top **100** regions; Modal `solutions` runs after every scoring and `insight_ai` serves on-demand AI
(needs `AI_GATEWAY_API_KEY` in the `rat-audit` secret and `MODAL_INSIGHT_AI_URL` in the web env).
Front logic (Bruno, local until the new UI lands): `web/src/lib/insight.ts` (`routeSelection`,
`loadInsight`, `highlightIds`, `focusOf`, `generateAreaAi`), `map-store.history/back()`,
`web/src/app/api/insight-ai/route.ts`, tests `web/tests/insight.test.ts`.
