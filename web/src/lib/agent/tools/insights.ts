import { tool } from "ai";
import { z } from "zod";
import { loadInsights } from "../../../components/insights/load";
import { compare } from "../../forecast-comparison";
import { HISTORICAL_RESEARCH } from "../../insights-history";
import type { AgentData } from "../data/types";
import type { SourceRef } from "../types";

export function createInsightsTools(data: AgentData | null) {
  return {
    get_insights: tool({
      description: "Read the same findings, forecast, costs, exploratory price impacts and dated research as the Insights panel. Returns sources, confidence intervals, missing sections and limitations. Stored study-wide results are not recomputed for map filters. Use this before explaining Insights or choosing a forecast week.",
      inputSchema: z.object({ topic: z.enum(["all", "findings", "forecast", "costs", "prices", "historical"]).default("all") }).strict(),
      execute: async ({ topic }) => {
        const historical = topic === "all" || topic === "findings" || topic === "historical";
        const state = topic === "historical" ? null : data
          ? await loadInsights(async () => ({ data: await data.insightsSummary(), error: null }))
          : { status: "unavailable" as const, reason: "Live data is not configured." };
        if (!historical && state?.status !== "ready") {
          return { ok: false as const, reason: state?.status ?? "unavailable", error: state?.status === "error" ? state.message : state?.status === "unavailable" ? state.reason : "Insights unavailable." };
        }
        const live = state?.status === "ready" ? state.data : null;
        const findings = live && (topic === "all" || topic === "findings") ? live.findings : [];
        const forecast = live && (topic === "all" || topic === "forecast") ? live.forecast : null;
        const costs = live && (topic === "all" || topic === "costs") ? live.costs : [];
        const prices = live && (topic === "all" || topic === "prices") ? live.exploratory : [];
        const sources = new Map<string, SourceRef>();
        for (const item of [...findings, ...costs, ...prices]) {
          for (const source of item.sourceDetails) sources.set(source.id, source);
          for (const id of item.sources) if (!sources.has(id)) sources.set(id, { id, name: null, url: null });
        }
        if (forecast) sources.set(forecast.runId, { id: forecast.runId, name: `Stored forecast · ${forecast.model}`, url: null, update_note: `Computed ${forecast.createdAt}. Model run ${forecast.runId}; trained through ${forecast.trainedThrough ?? "unknown"}.` });
        if (historical) sources.set(HISTORICAL_RESEARCH.source.id, HISTORICAL_RESEARCH.source);
        const missing = live ? [
          ...(!live.findings.length ? ["findings"] : []), ...(!live.forecast ? ["forecast"] : []),
          ...(!live.costs.length ? ["costs"] : []), ...(!live.exploratory.length ? ["prices"] : []),
        ] : ["findings", "forecast", "costs", "prices"];
        return {
          ok: true as const,
          data: {
            scope: "Stored study-wide results; unaffected by map viewport, categories, status or period.",
            live_status: state?.status ?? "not_requested",
            live_error: state?.status === "error" ? state.message : state?.status === "unavailable" ? state.reason : null,
            missing, findings, forecast, costs, prices,
            forecastComparison: forecast ? {
              countAccuracy: { ...forecast.mae, metric: "MAE", betterDirection: "lower", modelVsBaseline: forecast.isBaseline ? null : compare(forecast.mae, true) },
              hotspotRanking: { ...forecast.top10, metric: "Top 10% capture", betterDirection: "higher", modelVsBaseline: forecast.isBaseline ? null : compare(forecast.top10, false) },
              interpretation: "Use these computed verdicts. A model can rank hotspots better while having worse count accuracy; never describe higher MAE as better or claim an overall win from ranking alone.",
            } : null,
            historical: historical ? HISTORICAL_RESEARCH : null,
          },
          sources: [...sources.values()],
          features: forecast?.topCells.map(cell => ({ kind: "cell" as const, id: cell.cellId, label: `${cell.neighborhood ?? "Forecast block"} · ${cell.weekStart}` })) ?? [],
          caveats: [
            "Missing results mean unavailable evidence, not zero or no effect.",
            ...(historical ? [HISTORICAL_RESEARCH.caveat] : []),
            ...(forecast ? ["Forecast predicts reports, not rats. Model run and training dates are in forecast; no source URL is supplied by the forecast summary."] : []),
            ...[...findings, ...costs, ...prices].map(item => item.caveat),
          ],
        };
      },
    }),
  };
}
