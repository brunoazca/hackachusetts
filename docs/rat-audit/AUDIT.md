# Piper audit: data, ML and AI in the product

What data Piper uses (and what it tested and dropped), which models run where, where an LLM is involved,
and what is live versus still on a branch. For the presentation; numbers checked against the live database on Oct 24, 2026.
Model detail: [`model-report/README.md`](model-report/README.md) (interactive: `model-report/index.html`).

## One-slide summary

- **Data:** 51 public sources across Boston, Cambridge and Somerville. ~580k Boston 311 reports from 2016 to now,
  224k parcels, 238 census tracts, weather, permits, inspections, code enforcement. **43 candidate datasets tested; most did not predict rodent reports and were dropped or kept as context only.**
- **ML (scikit-learn, no LLM):** a weekly forecast per 250 m block (gradient boosting, Poisson), a return-after-closure model
  (logistic regression), a per-record "what to do" model (gradient boosting classifier). All validated out of sample against a simple baseline.
  - Forecast: its top 10% of blocks hold **65% of rodent reports vs 50%** for a 4-week average (146 weeks, 2024–2026, better in 145 of 146 weeks).
  - Return after closure: **AUC 0.71** on 2,964 later cases.
- **AI (LLM), two places only:**
  1. **Ask Piper** chat agent: answers from database tools only, drives the map, cites sources. Model: Claude Sonnet 5.5 via Vercel AI Gateway (Anthropic direct and Bedrock supported by config).
  2. **Region solutions:** Claude Haiku writes one recommended action per high-severity region from the evidence, behind hard guards (allowed actions only, no poison, every number must come from the input, fallback to rules).
- **Not AI:** the closure-note classifier (rules, 99% of rodent cases tagged), sites (DBSCAN clustering), the inspection brief (template).
- **Always "expected reports", never rats.** 311 measures who reports; the audit shows where that bias comes from and how it is handled.

## 1. Product flows → data, ML, AI

Status: **Live** = on `main`, deployed (Vercel + Supabase + Modal). **DB only** = running in the live database from an unmerged branch.
**Not built** = in the spec, not in the product.

| Flow | What the user does | Data | ML | AI | Status |
|---|---|---|---|---|---|
| Refresh / live badge | Sees "latest import N ago", clicks Refresh | `ingest_runs`; Modal re-reads 311, code enforcement, Cambridge/Somerville (last 14 days), then rescoring | forecast rescored | — | Live |
| Assess map | Pans, filters by date, category, status, city; heatmap or points | `incidents` (+ archive), coverage fog from `data_coverage` | — | — | Live |
| Context layers | Tracts (SVI, asthma, old housing), parcels by year built, per-block demographics | `tracts`, `parcels`, `grid_cell_context` | — | — | Live |
| "Tested result" labels | Each layer shows what validation found (e.g. "rain: no effect") | static, from the data audit | — | — | Live |
| Forecast layer | Next 4 weeks or one week; smoothed surface clipped to land, 1+ expected reports | `predictions`, `model_forecast_surface` | Forecast GBM | — | Live |
| Inspect a block | Expected reports, chance of ≥1, 4-week strip, top drivers, last 12 weeks actual vs model | `predictions`, `model_runs` | Forecast GBM + explanations | — | Live |
| Inspect a report / parcel | Report detail, scrubbed note; building facts | `incidents`, `parcels` | — | — | Live |
| Owner reveal | Click to reveal owner name, logged | `private.parcel_owners`, `reveal_log` | — | — | **Not built** (blurred placeholder) |
| Act: site queue | Ranked repeat-report sites, Due for follow-up | `sites` (57, DBSCAN 50 m), `incidents` | Return chance per site (`recur_p`, 56 of 57 sites) | — | Live / DB only (sites from analytics branch) |
| Site case + inspection brief | Timeline, actions, nearby drivers; printable brief | `incidents`, `places`, `sources` | — | — | Live |
| Approve / work order | Approve an action, write a decision | `decisions` | — | — | **Not built** (table empty) |
| Insights | Findings, forecast summary, what worked, costs, model "why" | `insights_summary` RPC, `correlations`, `action_outcomes`, `price_impact` | Forecast metrics | — | DB only (RPC deployed, migration not on `main`) |
| Insights: region solutions | One recommended action per high-severity region | `cell_severity`, `region_solutions` (20), `record_solutions` (10,526) | Per-record solution GBM, severity | Claude Haiku | DB only; **no UI reader on `main`** (branch) |
| Ask Piper (chat) | Asks questions; map moves, sites highlighted, sources shown | 8 server tools over Supabase (read-only) + Insights | reads model outputs | Claude Sonnet 5.5 (Gateway) | Live (`/api/chat` configured) |
| What-if | "Store trash correctly / clear the lot / pest follow-up" → change in expected reports | features of one block | Forecast GBM | — | Endpoint live on Modal; **no UI or agent caller** |
| Prove: trials | Design matched-pair trial, measure returns in 60 days | `trials`, `trial_pairs` | — | — | DB only (RPCs deployed, 0 trials, no UI) |

## 2. Data

### Used (by family)

| Family | Sources | Volume | Update | Used for |
|---|---|---|---|---|
| Boston 311 | 2016–2025 yearly tables, 2026, new system (Aug 2025–) | 303k recent rows (`incidents`) + 279k history (`incidents_archive`) | 2026 + new system live; past years static | target (rodent), leading signals, map, sites |
| 311 volume | Boston, Cambridge, Somerville all-request counts | 343k bin-months | live / daily | "who reports" control |
| Code enforcement | Boston Public Works violations (trash, weeds, dumping) | ~245k tickets as monthly counts; last 6 months as points | live | map; tested in the model, dropped from it (history only from Apr 2026) |
| Parcels | Boston FY2026 assessment (+FY2025), Cambridge, Somerville | 224k | static | building count, age, units; parcel layer; owner (private) |
| Places | food inspections (rodent violations), demolitions, excavations, Big Belly, city lots, vacant parcels, schools, colleges, Cambridge smart rat boxes | 12.9k | daily / static | map context; tested as predictors |
| Weather | NOAA GHCN Logan, daily | 4,160 days | daily | temperature in the forecast |
| Tracts | Climate Ready Boston SVI, CDC PLACES asthma, ACS 5-year (income, renters, poverty, race, language, housing age) | 238 | static | equity view, block profile |
| Cambridge / Somerville | rodent sightings, Commonwealth Connect, Somerville 311, housing violations, permits, assessment | ~30k | live / daily | map, three-city comparison (forecast tested, not shown) |
| Calendar | Sept 1 move-out, Red Sox games, Marathon | 331 events | static | move-out in the forecast; others display only |
| Prices and costs | Zillow ZHVI/ZORI by ZIP, Inside Airbnb rat reviews, Checkbook pest-control spending | 4.1k / 518 / 58 | static | price and cost context (exploratory) |
| Other | iNaturalist rat observations, SAM addresses | 535 / — | static | context; geocoding |

All sources are listed with update mode and retrieval time in `sources`; `data_coverage` gives rows, dates and % located per layer and city.

### Considered and dropped (tested Oct 24)

Method: 1,319 lived-in grid cells, partial correlations controlling for non-rodent 311 volume and address count, plus a placebo
(abandoned vehicles: +0.07 / +0.01). Then the forecast backtest: a group is kept only if it adds ≥0.5 points of top-10% capture without worse error.

| Kept (predicts next year's rodent reports, controlled) | Score |
|---|---|
| Last year's rodent reports | +0.32 |
| Improper trash storage (new 311 system) | +0.18 |
| Dead animals | +0.14 |
| Student move-in trash | +0.13 |
| Indoor pests | +0.11 |
| Weeds | +0.10 |
| Overflowing / out early / litter, code-enforcement trash | +0.09 |
| Temperature (monthly) | r = +0.87 |

| Dropped | Finding |
|---|---|
| Rain (≥1 in, 0.5–1 in), snow | no change in the following 1–2 weeks (p = 0.49, 0.60, 0.32) |
| Demolitions | ×1.01 vs ×1.23 for roof permits (control); consistent with Boston's rule to bait before demolition |
| Restaurants, food/liquor licenses, events, food trucks | −0.10 to 0.00 |
| Big Belly bins, city lots, colleges, trees, parks | −0.04 to +0.01 (trees +0.09 weak) |
| Red Sox games, holidays, trash pickup day | no effect |
| iNaturalist | too sparse |
| Work zones, "rainfall data", RentSmart year built | no usable data |
| Electrical fires, asthma, displacement, Zillow | confounded or negative |
| In the model backtest: city lots, more weather, ACS, permits, iNaturalist, food-inspection fails, more neighbour signals | none passed (+0.45 to −0.40 points) |

Equity finding (167 tracts, controlling 311 volume): fewer reports where there are more children (−0.24), more people of color (−0.23),
more disability (−0.18). Under-reporting is a stated caveat on every model output.

### Privacy

- Public tables have street + ZIP only (`address_block`); full addresses are hashed (`address_key`, sha256) for grouping.
- Owner names, full addresses and raw notes are in a `private` schema not exposed to the API. Closure notes are scrubbed (staff names, phones, emails, house numbers).
- Names are never read from permits, licenses, iNaturalist or Airbnb; reviewer names are replaced.
- The chat agent is told never to reveal owner or staff names or house numbers; house numbers are stripped in code; closure notes are not sent to the chat model.
- Secrets: `.env.local` is git-ignored; a pre-commit hook scans every commit.

## 3. ML models

| Model | Method | Unit | Validation | Output | Where it shows |
|---|---|---|---|---|---|
| Forecast `cell_week_poisson_gbm` | scikit-learn `HistGradientBoostingRegressor(loss="poisson")`, 33 features, trained 2017+ without the pandemic | 250 m block × week | rolling origin, out of sample: 65.0% vs 54.3% capture (26 weeks), 65.3% vs 49.7% (146 weeks); MAE tied with the baseline | expected reports, chance of ≥1, band, drivers, emerging hotspots, smoothed surface | forecast layer, block card, Insights, chat |
| Baseline `cell_week_baseline_mean4` | mean of the last 4 weeks | same | — | comparison | model report |
| Return after closure `site_recurrence_logit` | logistic regression (prior reports, closure action, nearby trash/pest, season) | closed rodent case | AUC 0.71 vs 0.50 on 2,964 later cases; riskiest tenth returned 42%, safest 8% | `sites.summary.recur_p` | Act queue (via agent `get_site`), model report |
| Per-record solution `record_solution_gbm` | `HistGradientBoostingClassifier`: P(return in 60 days ∣ action, context) | rodent record | AUC 0.69 | lowest-return legal action vs monitoring (needs ≥2 points gain) | input to region solutions |
| Severity | reports last 12 weeks + expected next 4 weeks + expected returns, smoothed | block | — | top regions | region solutions |
| What-if | forecast re-run with intervention-scaled inputs | block or site | model estimate only | change in expected reports | Modal endpoint |

Interpretability (model report): the model leans most on **how much people file 311 reports in a block** and **housing density**,
then rodent reports here and next door. Partial-dependence curves and permutation importance are in the report. Training-data choices
were tested on the same weeks (2017+ without pandemic: 0.643 → 0.651 capture).

Known limits: exact counts are no better than the 4-week average; overestimates the busiest blocks (1.5 predicted, 1.1 actual);
Cambridge and Somerville forecasts are weaker (35–46% capture) and not shown; associations, not causes.

## 4. AI (LLMs)

### Ask Piper (chat agent), live

- Vercel AI SDK; provider switch: AI Gateway (default `anthropic/claude-sonnet-5.5`), Anthropic direct, Bedrock. Production runs Claude Sonnet 5.5 through the Gateway (verified with a live answer on Oct 24); earlier builds used GPT-4.1-mini while Claude was blocked on the free-credit account.
- **Answers only from tools**, never from memory; says when a lookup failed. 8 server tools (geocode, search reports, top sites, due sites, site detail, nearby drivers, what worked, draft work order) + Insights + 10 map tools (fly, filter, layers, highlight, forecast, mode).
- Every tool returns sources and caveats; the UI shows them under each answer.
- Guardrails in the prompt **and in code**: "expected reports", never rats; nearby ≠ caused; no owner/staff names or house numbers;
  never recommend rodenticide or poison (a code filter drops any such recommendation); work orders are drafts, never sent; English only;
  max 8 tool steps; injected system messages rejected.
- Tests: ~80 agent tests (fake model, tool routing, guard checks, injection) + Insights tests; 131 pass in the combined suite.
  No formal LLM eval set; real-model answers spot-checked against direct queries.

### Region solutions (Insights), offline batch

- Claude Haiku (`anthropic/claude-haiku-5.5`) via AI Gateway, temperature 0, forced structured output (`submit_solution`).
- Input per region: forecast and drivers, each record with what the city did, per-record model output, address history, nearby causes vs Boston level,
  scrubbed notes, and solution statistics by situation (60-day return with Wilson interval, vs monitoring).
- Guards: action lane must be sanitation, exclusion, enforcement, referral or inspect; banned words (bait, poison, rodenticide, treat, exterminate);
  **every number in the answer must appear in the input**; cannot propose an action that did no better than monitoring; up to 3 attempts, then a fixed rules fallback.
  Each row stores model, input hash, full input and guard errors.
- Result: 20 regions, 19 by the model, 1 by rules.

### Not AI (by design)

- Closure-note classifier: ordered rules (referral, carcass, monitoring, baiting, warning, cleanup, …); 19,263 of 19,496 Boston rodent cases tagged.
  An LLM pass for unknowns is in the spec only.
- Sites: PostGIS DBSCAN (50 m, min 3). Inspection brief: fixed template. No vision, no embeddings.

### AI used to build it (not in the product)

Kiro (specs, steering, hooks, Kiro Crew research campaigns: demo site, data layers, matched study RR 1.03, forecast ablation, closure-classifier rules),
Claude Code and Codex for code. Every entry in `.kiro/KIRO_LOG.md` names the person and the tool.

## 5. Gaps to fix or say out loud before the demo

| Gap | Impact | Suggested line / fix |
|---|---|---|
| Analytics code (sites, insights, trials) runs in the live DB but its code and migrations are on unmerged branches | repo ≠ product | merge `feat/rat-audit-analytics-core` / insights branches or say "deployed from branch" |
| Region solutions have no reader in the UI on `main` | AI recommendations not visible | merge the Insights region cards branch, or show via the model report |
| Owner reveal not built | placeholder in the parcel card | say "designed, private schema in place, not built" |
| Approve / decisions never written; trials 0 | Act and Prove loops not closed | present as next step |
| What-if endpoint has no caller | not demoable in the UI | call it from the block card or the agent, or skip |
| `record_solution` and `region_solution` not wired into Modal jobs | run by hand | fine for the demo; note it |
| Spending FY2026: $776K (validation) vs $783K (ingest) | inconsistent number | use one, cite the source |
