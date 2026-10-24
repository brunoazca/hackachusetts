# Data validation — Rat Audit Boston

Which signals are worth loading, modelling and showing, tested on live data on Oct 24, 2026. Full evidence: `knowledge/19_rat_data_validation.md`. Scripts: `knowledge/sources/rats/validation/`. `design.md` §4–5 already follow this file. `requirements.md` and `tasks.md` had uncommitted edits from a scope-freeze pass, so the changes below are **proposed** for them, not applied.

## Evidence summary

Grid: 1,319 lived-in cells (~280 m × 205 m). "predict" = partial Spearman with 2025–26 rodent reports, controlling for 2024 rodent reports, non-rodent 311 volume and address count. Placebo (abandoned vehicles) = +0.01, so anything at or below that is noise.

| Signal | predict | Use |
|---|---|---|
| Rodent reports last year, same cell | +0.32 | core lag feature |
| 311 new: Improper Trash Storage | +0.18 | core |
| 311 Pick up Dead Animal | +0.14 | core |
| 311 new: Student Move-In trash | +0.13 | core (move-out flag) |
| 311 Pest Infestation - Residential | +0.11 | core |
| 311 new: Overgrown Weeds | +0.10 | supporting |
| Code enforcement: improper trash, residential (`90ed3816…`) | +0.09 | core (inspector-issued, less reporting bias) |
| 311 new: Overflowing Trash, Trash Placed Out Early, Litter | +0.09 | supporting |
| Restaurants, food/liquor/entertainment licenses, Big Belly, city lots, demolitions, events, colleges, food trucks | −0.04 to +0.05 | **not predictive** |

Time:
- **Season and temperature:** r = +0.87 by month. This is the forecast's calendar signal.
- **Rain** (p = 0.49), **snow** (p = 0.32), **Fenway home games** (4.01% vs 4.12% share) and **holiday weeks** (p = 0.93): no effect.
- **Demolitions:** 863 → 875 reports within 200 m, 90 days before vs after. No spike, consistent with the existing pre-demolition baiting rule.
- **Sept 1 move-out:** a small, consistent rise in student ZIPs (Sep/Jul 1.17 vs 0.80 in 2023; 1.11 vs 0.87 in 2024; 0.99 vs 0.95 in 2025).

Tracts: after controls, rodent reports per resident are **lower** where there are more children (−0.24), people of color (−0.23) and adult asthma (−0.29). Either 311 under-counts those areas or they have fewer rats. Either way, ranking by 311 counts alone under-serves them.

## Proposed edits to `requirements.md`

| Req | Change |
|---|---|
| R1.7 | Drop Public Works work zones (460 current rows, no history, no coordinates). Add **code enforcement violations** (trash storage, overfilling, dumping, weeds) as places/incidents. |
| R1.9 | Weather: keep temperature, drop rain/snow events. Events: keep Sept 1 move-out; drop one-day licenses, Red Sox games and holiday-delay events (no rodent effect). |
| R1.10 | Keep SVI tracts (equity lens). Mark CDC asthma, Zillow and iNaturalist as context only, not findings. |
| R5.2 | Keep trash storage, what worked and move-out. Add **dead animal and indoor pest as leading signals**. |
| R5.3 | Report the honest nulls as findings: rain (none), demolition (no spike; baiting rule), restaurants (none after controls), Big Belly (none), events (none), trash day (none). Replace "asthma by tract" with **"311 under-reporting by tract"**. |
| R6.4 | Remove (live NWS rain adds nothing). |
| R7 / impact | Keep Checkbook. Add **schools near hot spots** (49% of schools vs 35% of lived-in cells; BPS paid $611K). Do not claim asthma or fire impacts. |
| R3.2 / R2 | Add an equity view to the chronic-site ranking (rank within neighborhood, or flag low-reporting tracts) and a caveat that 311 counts are not rat counts. |

## Proposed edits to `tasks.md`

- 1.6: replace "PW work zones" with "code enforcement violations".
- 1.7: weather = temperature only; events = move-out only.
- 2.9: use the tested results in `knowledge/sources/rats/validation/*_results.txt` instead of recomputing the nulls.
- 2.10: remove (NWS rain).
- New P1: equity view for the site ranking (rank within neighborhood + low-reporting tract flag).
