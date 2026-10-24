import { tool } from "ai";
import { z } from "zod";
import { loadInsights } from "../../../components/insights/load";
import { compare } from "../../forecast-comparison";
import { HISTORICAL_RESEARCH } from "../../insights-history";
import type { AgentData } from "../data/types";
import type { SourceRef } from "../types";

type Json = Record<string, unknown>;
const plain = (t: unknown) => String(t ?? "").replace(/\[([^\]]+)\]\(L\d+\)/g, "$1");
const arr = <T = Json>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const causes = (v: unknown) => arr(v).slice(0, 6).map(c => ({
  label: c.label, count: c.count, nearest_m: c.nearest_m, times_boston: c.times_boston ?? null,
}));
const unavailable = { ok: false as const, reason: "unavailable", error: "Live data is not configured." };

/** The area card (region_solutions / cell_solutions row) as the agent needs it: no raw AI input. */
function areaSummary(a: Json) {
  const sol = (a.solution ?? null) as Json | null;
  const input = (sol?.input ?? {}) as Json;
  const region = (input.region ?? {}) as Json;
  return {
    kind: "area", cell_ids: a.cell_ids, ranked_hotspot: a.region_id ?? null, severity: a.severity, forecast_next_4_weeks: a.forecast,
    solution: sol ? {
      action: plain(sol.action), because: plain(sol.because), lane: sol.lane, written_by: sol.source === "ai" ? "AI (grounded, guarded)" : "rules",
      checks_on_site: arr<string>(sol.unknowns).map(plain),
      reports: arr(sol.records).slice(0, 12).map(r => ({ incident_id: r.incident_id, todo: plain(r.todo) })),
    } : null,
    what_is_specific_here: arr<string>(region.what_is_specific_here),
    nearby_causes: causes(input.possible_causes_within_150m),
    ai_pending: a.can_generate_ai === true,
    regions_touched: arr(a.regions).slice(0, 8), worst_blocks: arr(a.cells).slice(0, 8),
  };
}

function recordSummary(r: Json) {
  const o = (r.outlook ?? {}) as Json, s = (r.solution ?? {}) as Json, e = (r.evidence ?? {}) as Json;
  return {
    kind: "report", incident: r.incident, cell_id: r.cell_id, ranked_hotspot: r.region_id ?? null,
    will_it_return: {
      p_return_60d_if_monitored: o.p_return_60d_if_monitoring, p_return_60d_with_best_option: o.p_return_60d_if_best,
      best_option: o.best_action, best_option_clearly_better: o.confident === true, block_forecast_next_4_weeks: o.cell_forecast,
    },
    what_to_do: { this_report: plain(s.todo) || null, area_plan: plain(s.area_action) || null, city_recorded: s.city_did, model_context: arr<string>(s.model_because) },
    nearby_causes: causes(e.nearby_causes), address_history: arr(e.address_history).slice(-10),
  };
}

function evidenceSummary(v: Json) {
  return {
    kind: "evidence", item: v.item, window: v.window, after_days: v.after_days ?? null,
    rodent_reports_within_150m: { before: v.rodent_before ?? null, after: v.rodent_after },
    related_rodent_reports: arr(v.related_rodent_reports).slice(0, 15), same_kind_nearby: v.same_kind_nearby ?? null,
    other_nearby_causes: causes(v.nearby_causes),
  };
}

export function createInsightsTools(data: AgentData | null) {
  return {
    get_ranking: tool({
      description: "Read the Insight panel ranking (what the user sees with nothing selected): ranked hotspots first, then single 250 m blocks, worst first by severity = rodent reports in the last 12 weeks + expected in the next 4 + expected returns within 60 days. Each entry has its proposed action. Page with offset. Use for \"where should we act first\" and before naming a ranked place.",
      inputSchema: z.object({ offset: z.number().int().min(0).default(0), limit: z.number().int().min(1).max(30).default(10) }).strict(),
      execute: async ({ offset, limit }) => {
        if (!data) return unavailable;
        const rows = arr(await data.insightRpc("insight_ranking", { lim: limit, off: offset }));
        const entries = rows.map(r => {
          const region = (r.region ?? {}) as Json;
          return { position: r.position, type: r.entry === "region" ? "hotspot" : "block", cell_id: r.id, blocks: arr(r.cell_ids).length,
            neighborhood: region.neighborhood ?? null, severity: region.severity ?? null, action: plain(r.action), lane: r.lane,
            written_by: r.source === "ai" ? "AI" : "rules" };
        });
        return {
          ok: true as const,
          data: { total: rows[0]?.total ?? 0, offset, entries },
          sources: [] as SourceRef[],
          features: entries.map(e => ({ kind: "cell" as const, id: String(e.cell_id), label: `#${e.position} ${e.neighborhood ?? "Block"}` })),
          caveats: ["Severity counts 311 rodent reports and model estimates, not rats. Proposed actions compare past cases; not a measured effect."],
        };
      },
    }),
    get_insight: tool({
      description: "Read the Insight panel card for one thing: target 'block' (a 250 m cell id like g250_948_3594, or a hotspot's id) gives severity, forecast, the proposed solution, per-report next steps and nearby causes; 'report' (incident id) gives a rodent report's chance of returning, what to do and evidence, or — for trash/dumping/other 311 ids — the evidence view; 'place' (place id) gives the evidence view: rodent reports within 150 m before/after and related reports. Pair with open_insight so the user sees the same card.",
      inputSchema: z.object({ target: z.enum(["block", "report", "place"]), id: z.string().min(1).max(120) }).strict(),
      execute: async ({ target, id }) => {
        if (!data) return unavailable;
        const raw = (target === "block" ? await data.insightRpc("area_insight", { cell_ids: [id] })
          : target === "report" ? await data.insightRpc("record_insight", { incident_id: id })
          : await data.insightRpc("evidence_insight", { kind: "place", id })) as Json | null;
        if (!raw) return { ok: false as const, reason: "not_found", error: `No ${target} ${id}.` };
        const summary = raw.kind === "area" ? areaSummary(raw) : raw.kind === "record" ? recordSummary(raw) : evidenceSummary(raw);
        const featureKind = target === "block" ? "cell" as const : target === "report" ? "incident" as const : "place" as const;
        return {
          ok: true as const,
          data: summary,
          sources: [] as SourceRef[],
          features: [{ kind: featureKind, id, label: target }],
          caveats: [String(raw.caveat ?? (raw.solution as Json | undefined)?.caveat ?? "Model estimate of 311 reports, not rats.")],
        };
      },
    }),
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
