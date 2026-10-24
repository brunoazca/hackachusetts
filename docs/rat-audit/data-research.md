# Rat Audit data research

October 24, 2026 · Bruno. This is the story of how we chose the Rat Audit's data: what we thought might explain rats in Boston, what we tested, and what held up. The full numbers are in `.kiro/specs/rat-audit/data-audit.md`. Scripts are in `knowledge/sources/rats/validation/`. The dataset board is the [Rat Audit Data Plan](https://claude.ai/artifact/6bCS5853Lo3fcDvkGqqXid).

## The question

Boston's 311 logged 5,321 rodent reports in 2026 through Oct 23, more than all of 2025. We want to tell an inspector **why a block keeps getting reports and what to do next**. So we need signals that actually predict reports, not just ones that sound plausible.

## What we thought might matter

Rats need food, shelter and water. Reports rise when something changes, or when different people start reporting. We listed 43 candidate datasets in five groups:

- **Food:** trash storage and set-out time, missed pickups, litter baskets, restaurants, bars, food trucks, events, Big Belly bins, the Sept 1 student move-out, holiday pickup delays.
- **Shelter:** old buildings, absentee owners, vacant lots, weeds and trees, sewers, gardens.
- **Displacement:** demolitions, street digs, heavy rain, snowmelt, mild winters.
- **Who reports:** 311 volume, income, language, children, an independent rat signal (iNaturalist).
- **Impact:** city spending, schools, fires, asthma, sidewalks, restaurants, visitors, property values.

We dropped the COVID 2020 test early because it's not actionable now.

## How we tested

1. **Block grid.** Boston split into about 1,300 lived-in cells of roughly 280 m × 205 m. For each dataset we asked two things:
   - Does it track rodent reports once a block's overall 311 volume is removed? Busy blocks report everything.
   - Does it predict *next year's* reports beyond what last year's reports already tell us?

   A placebo (abandoned-vehicle reports) showed how much is just noise.
2. **Over time.** Daily reports from 2023 to 2026, compared with the same weekday in the same month, after rain, snow, demolitions, Red Sox home games, holiday weeks and Sept 1.
3. **By neighborhood.** 167 census tracts, reports per resident vs vulnerability, displacement risk and asthma.

## What we found

**1. Rats follow trash and housing conditions, not restaurants.**

The best predictors of next year's reports on a block:
- Last year's reports (+0.32).
- Improper trash storage reports (+0.18).
- Dead-animal pickups (+0.14).
- Student move-in trash (+0.13).
- Indoor pest complaints (+0.11).
- Inspector-issued tickets for residential trash storage (+0.09). These come from the code enforcement dataset, which we found during the audit.

Restaurants, bars, food licenses and restaurant rodent citations all turn slightly *negative* once 311 volume is controlled for.

**2. Season is the forecast. Weather events are not.**

Monthly reports track temperature closely (r = +0.87): about 22 reports a day in August vs 6 in February. Heavy rain, snow, Red Sox games and holiday weeks show no effect. The "rat weather" forecast idea didn't survive.

**3. Demolitions don't cause spikes.**

Around 396 demolition sites, reports in the 90 days after were the same as before (875 vs 863). Boston already requires rodent baiting before demolition, and this is consistent with that rule working.

**4. 311 may miss the most vulnerable neighborhoods.**

Tracts with more children, people of color, residents with disabilities and adult asthma have *fewer* reports per resident (−0.18 to −0.29 after controls). Either they have fewer rats or they report less. The independent iNaturalist data is too sparse to tell which. Either way, ranking by 311 counts alone would under-serve them, and we can't claim rats drive asthma.

**5. Some costs are real and countable.**

- **City spending:** in FY2026 the city paid about $776K to pest-control vendors, and Boston Public Schools paid $611K of it.
- **Schools:** 49% of schools sit in or next to a rat hot spot, vs 35% of lived-in blocks.
- **Fires:** electrical fires showed no link once fire-call volume was controlled for.

**6. Some datasets aren't usable.**

- "Rainfall data" on Analyze Boston is only a link to a web page.
- Public Works work zones has 460 current rows, with no history and no coordinates.
- RentSmart's building years are unreliable: 94% of rental properties are listed as built in 1900–1915.
- The Census API failed three times.

## What it changed in the product

- **The forecast model** uses last year's reports, the leading 311 signals, code-enforcement trash tickets, season, and the move-out week. Rain, snow, demolitions, restaurants, Big Belly and events are out.
- **The Insights panel** shows the honest null results as findings. The spec already required reporting weak and null results.
- **A new equity view** ranks chronic sites within each neighborhood and flags low-reporting tracts.
- **Impact** shows city pest spending and schools near hot spots. There are no asthma, fire or property-value claims.
- **Live rain forecasts** (NWS) are no longer needed.

## Open questions

- Is the under-reporting real, or do those tracts really have fewer rats? A field check, or Cambridge's smart rat box catches as ground truth, could tell.
- Do the city's actions work? The 60-day repeat rate by closure action ("what worked") is the next analysis, and it's in the spec as P0.
- Do sewers matter? No public sewer data was found.
