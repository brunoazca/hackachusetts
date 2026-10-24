// The recorded research shown in Insights, distinct from current computed results.
export const HISTORICAL_RESEARCH = {
  date: "2026-10-24",
  source: {
    id: "piper-team-research-20261024",
    name: "Piper team research · Oct 24, 2026",
    url: "https://github.com/brunoazca/hackachusetts/blob/cf4389b/docs/submission/data-report.md",
    update_mode: "static" as const,
    update_note: "Historical research snapshot; not recalculated with map filters.",
  },
  repeatReports: {
    windowDays: 60, noPriorReports: "8–12%", fiveOrMorePriorReports: "56–75%",
    caveat: "Another report does not establish treatment failure; a closure is not evidence of a lasting fix.",
  },
  matchedResponse: {
    cases: 19496, city: "Boston", years: "2023–2026", riskRatio: 1.03, ci95: [0.89, 1.20],
    comparison: "Citation or abatement versus monitoring, matched on prior reports, neighborhood and month.",
    caveat: "The interval includes 1: no clear difference was established. This does not prove equal effectiveness. Observational, not a trial; closure notes do not confirm field actions.",
  },
  rain: "No rain association detected in the tested windows; this does not establish no effect on rats.",
  caveat: "Reports measure reporting, not rat population. Historical results are not recalculated for the map's period or area.",
};
