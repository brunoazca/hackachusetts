# Rat Audit v2 — ideas for the team

Full spec: `.kiro/specs/rat-audit/v2-spec.md` (builds on v1; nothing deleted).

## The pitch
Boston closes 99% of rat cases, but can't tell which fixes last. We track every report,
explain why a site keeps coming back, help the inspector pick the next step, predict which
sites are due to come back, and set up the test that shows what works.

## The product: one loop, five jobs
**Track → Analyze → Act → Predict → Prove**

| Job | What it does |
|---|---|
| Track | Live map of reports, sites and every layer |
| Analyze | Why a site comes back: timeline, action history, closure notes, what's next door |
| Act | Approve / edit / reject the next step → draft work order → check-again date |
| Predict | "Due to come back" list + baseline forecast + early warning |
| Prove | Trial designer + BRAP scorecard + findings |

## Two depths
- **Simple** (default): queue → case → approve. Nothing to learn.
- **Explore** (one toggle): every layer, filter, timeline, heatmap, area stats, full agent.

## Main changes from v1
- Site queue opens first; the map is the evidence beside it.
- Site = **50 m cluster** of reports (keeps the vacant lot next door in the site).
- **Raw counts** (reports, closures, returns) instead of a 0–100 score.
- **60-day window** everywhere.
- Escalation uses the **site's own history** ("monitoring tried 9× here, came back each time").
  The citywide "what worked" number gets a selection-bias caveat.
- Forecast = "due" list + labelled baseline. GBM, logit and simulator are cut.
- **Every layer shows its tested result** (e.g. "Demolitions: no effect, ×1.01").
- Agent keeps all tools, adds trial / base-rate / area tools, can switch to Explore.
- Closure notes get an **action tag + cause tag** (sewer, dumpster, trash…).
- Reject needs a reason; reopening a site shows whether reports came back.
- **Never recommend rodenticide** (MA law). Sanitation, exclusion, enforcement, referral only.

## New ideas
- **Trial designer:** pick matched pairs of sites (same neighborhood, history, trash level),
  give one the $500K containers, compare returns after 60 days. First real measure of what works.
- **BRAP practice card:** monitoring fell 49% → 27% of closures; did returns change?
- **Closure speed:** cases closed in a day look like desk closures, not visits.
- **Early warning:** dead-animal + indoor-pest reports rising while rodent reports stay low.
- **Enforcement gap:** due sites with zero trash tickets nearby.
- **Season-adjusted counts:** 5 reports in February mean more than 5 in August.

## Build order
1. Simple loop end to end (data → sites/returns SQL → queue → case → approve).
2. Then Prove (trial designer, scorecard, findings).
3. Then Explore (layers with tested labels, full agent).

## Decide / verify
- Cost figure: $776K or $783K.
- Normandy St counts under the 50 m rule.
- "Due" threshold (25% placeholder).
