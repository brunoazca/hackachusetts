import { tool } from "ai";
import { z } from "zod";
import type { AgentData } from "../data/types";

const n = z.number().finite().nonnegative().nullable().catch(null);
const strings = z.array(z.string()).catch([]);
const safeText = z.string().transform(s => /\b(bait\w*|poison\w*|rodenticide\w*|toxicant\w*)/i.test(s) ? "Inspect and record the cause" : s);
const regionSchema = z.object({
  region_id: z.string().min(1), rank: z.number().int().positive(), cell_ids: strings,
  neighborhood: z.string().nullable().catch(null),
  severity: z.object({ observed_12w: n, expected_4w: n, expected_returns_60d: n, score: n }),
  recommendation: z.object({ action: safeText, because: safeText, unknowns: z.array(safeText).catch([]) }).nullable().catch(null),
  population: z.object({ pop: n, source_ids: strings }).nullable().catch(null),
  after_fix: z.object({ expected_after: n, delta_4w: n, recur_p: n }).nullable().catch(null),
  source_ids: strings,
  computed_at: z.string().nullable().catch(null), run_id: z.string().nullable().catch(null),
  // Public evidence only: never pass raw records or arbitrary model payloads through.
  evidence: z.array(z.object({ label: z.string().optional(), text: z.string().optional(), count: n, nearest_m: n, source_ids: strings })).catch([]),
  forecast: z.object({ next_4_weeks_expected_reports: z.record(z.string(), z.number().finite().nonnegative()).catch({}) }).nullable().catch(null),
});
const payloadSchema = z.object({ regions: z.array(regionSchema), truncated: z.boolean().optional(), origin: z.string().optional(), run: z.object({ id: z.string(), created_at: z.string().optional() }).nullable().optional() });
const selector = z.object({
  region_id: z.string().min(1).optional(), rank: z.number().int().positive().optional(), neighborhood: z.string().min(1).max(100).optional(),
}).refine(v => Object.values(v).filter(x => x !== undefined).length === 1, "Choose exactly one region ID, published rank or neighborhood.");
type Region = z.infer<typeof regionSchema>;
type Selector = z.infer<typeof selector>;
const caveats = [
  "Stored region ranking; not recomputed for current map filters. Forecasts count reports, not rats.",
  "Population is an area-weighted resident estimate, not people proven affected or guaranteed to benefit. Regions can overlap; do not sum their populations.",
  "Missing benefit/after-fix estimates are unavailable, not zero. Predicted returns within 60 days are not reports avoided.",
  "Nearby evidence is association, not proof of cause. Comparisons apply to these regions, not whole neighborhoods.",
];
function summary(r: Region) {
  return { region_id: r.region_id, rank: r.rank, neighborhood: r.neighborhood, cell_ids: r.cell_ids,
    problem: r.severity, solution: r.recommendation, evidence: r.evidence,
    future: { expected_4w: r.severity.expected_4w, expected_returns_60d: r.severity.expected_returns_60d, after_fix: r.after_fix, weekly: r.forecast },
    people: { estimated_residents: r.population?.pop ?? null, guaranteed_beneficiaries: null },
    computed_at: r.computed_at, run_id: r.run_id,
  };
}
function pick(rows: Region[], s: Selector) {
  return rows.find(r => s.region_id ? r.region_id === s.region_id : s.rank ? r.rank === s.rank : r.neighborhood?.toLowerCase() === s.neighborhood!.toLowerCase());
}

export function createRegionTools(data: AgentData | null) {
  async function read() {
    if (!data) throw new Error("Live region data is not configured.");
    const parsed = payloadSchema.safeParse(await data.regionInsights());
    if (!parsed.success) throw new Error("Region ranking has an unsupported or invalid response.");
    const regions = parsed.data.regions.map(r => ({ ...r, run_id: r.run_id ?? parsed.data.run?.id ?? null, computed_at: r.computed_at ?? parsed.data.run?.created_at ?? null })).sort((a, b) => a.rank - b.rank);
    if (new Set(regions.map(r => r.region_id)).size !== regions.length || new Set(regions.map(r => r.rank)).size !== regions.length) throw new Error("Region ranking contains ambiguous IDs or ranks.");
    return { ...parsed.data, regions };
  }
  async function result(regions: Region[], extra: Record<string, unknown>) {
    const ids = [...new Set(regions.flatMap(r => [...r.source_ids, ...(r.population?.source_ids ?? [])]))];
    let sources;
    let sourceWarning = false;
    try { sources = await data!.sources(ids); } catch { sources = ids.map(id => ({ id, name: null, url: null })); sourceWarning = true; }
    const features = await Promise.all(regions.map(async r => {
      let position: { lat: number; lon: number } | null = null;
      try {
        const parsed = z.object({ lat: z.number().finite().min(41.9).max(42.7), lon: z.number().finite().min(-71.5).max(-70.7) }).safeParse(await data!.regionLocation(r.region_id));
        if (parsed.success) position = parsed.data;
      } catch { /* Ranking remains usable without a camera target. */ }
      return { kind: "cell" as const, id: r.region_id, label: `#${r.rank} · ${r.neighborhood ?? "Region"}`, ...position };
    }));
    return { ok: true as const, data: { ...extra, regions: regions.map(summary) }, features, sources,
      caveats: [...caveats, ...(sourceWarning ? ["Source details unavailable; IDs retained."] : []), ...(features.some(f => !("lat" in f)) ? ["Some region coordinates are unavailable; do not invent a camera target."] : [])] };
  }
  async function guarded(fn: () => Promise<unknown>) {
    try { return await fn(); } catch (error) { return { ok: false as const, error: error instanceof Error ? error.message : "Region lookup failed." }; }
  }
  return {
    rank_regions: tool({
      description: "Rank the stored Insights regions by published severity order, estimated residents or published benefit (reports avoided in 4 weeks). Use order lowest with sort_by severity for best/least severe regions; highest for worst. Only set people_above when the user explicitly requests a population threshold. Filter neighborhood or resident threshold BEFORE taking top N. Population is not a measured intervention benefit. Returns map-selectable cell IDs and available coordinates.",
      inputSchema: z.object({ limit: z.number().int().min(1).max(20).default(5), neighborhood: z.string().min(1).max(100).optional(), people_above: z.number().finite().nonnegative().optional(), sort_by: z.enum(["severity", "people", "benefit"]).default("severity"), order: z.enum(["highest", "lowest"]).default("highest").describe("highest = worst severity / most residents / most benefit; lowest = least severe / fewest residents / least benefit") }).strict(),
      execute: q => guarded(async () => {
        const payload = await read();
        const truncated = payload.truncated ?? payload.regions.length >= 201;
        if (q.sort_by === "severity" && q.order === "lowest" && truncated) throw new Error("The published severity ranking is truncated; the least-severe end is unavailable.");
        let rows = payload.regions.filter(r => !q.neighborhood || r.neighborhood?.toLowerCase() === q.neighborhood.toLowerCase());
        const unknownPeople = rows.filter(r => r.population?.pop == null).length;
        if (q.people_above !== undefined) {
          if (rows.length && unknownPeople === rows.length) throw new Error("Population estimates are unavailable; the population filter cannot be evaluated.");
          rows = rows.filter(r => r.population?.pop != null && r.population.pop > q.people_above!);
        }
        if (q.sort_by !== "severity") {
          const value = (r: Region) => q.sort_by === "people" ? r.population?.pop : r.after_fix?.delta_4w;
          if (rows.length && rows.every(r => value(r) == null)) throw new Error(`No published ${q.sort_by} estimates available for this ranking.`);
          rows = rows.filter(r => value(r) != null).sort((a, b) => (q.order === "lowest" ? value(a)! - value(b)! : value(b)! - value(a)!) || a.rank - b.rank);
        }
        if (q.sort_by === "severity" && q.order === "lowest") rows.sort((a, b) => b.rank - a.rank);
        return result(rows.slice(0, q.limit), { sort_by: q.sort_by, order: q.order ?? "highest", matched_in_loaded_ranking: rows.length, population_unknown: unknownPeople, truncated, origin: payload.origin ?? "insights_regions", ranking_scope: "Published priority regions only, not all areas in the city. Lowest severity means the least severe in this published set, not safe or rat-free areas. Filtered before limit. Published rank remains the stable region reference." });
      }),
    }),
    explain_region: tool({
      description: "Read a region's five card fields: problem, proposed solution, evidence, future and estimated residents. Use the stable region ID or published rank from rank_regions; neighborhood chooses its highest-ranked published region.",
      inputSchema: selector,
      execute: q => guarded(async () => {
        const payload = await read(); const r = pick(payload.regions, q);
        if (!r) throw new Error("No published region matches that reference.");
        return result([r], { selection: q, neighborhood_scope: "Highest-ranked published region, not the whole neighborhood." });
      }),
    }),
    compare_regions: tool({
      description: "Compare two published Insights regions side by side: severity, estimated residents, forecast returns and available after-fix benefit. A neighborhood selects its top published region; this is not a neighborhood-wide comparison.",
      inputSchema: z.object({ left: selector, right: selector }).strict(),
      execute: q => guarded(async () => {
        const payload = await read(); const left = pick(payload.regions, q.left), right = pick(payload.regions, q.right);
        if (!left || !right) throw new Error("Both regions must have published data to compare; at least one was not found.");
        if (left.run_id && right.run_id && left.run_id !== right.run_id) throw new Error("Regions come from different model runs and cannot be compared as one current ranking.");
        if (left.region_id === right.region_id) throw new Error("Both references resolve to the same region.");
        return result([left, right], { comparison_order: ["left", "right"], priority_by_published_rank: left.rank < right.rank ? left.region_id : right.region_id, neighborhood_scope: "One highest-ranked region per neighborhood, not whole-neighborhood totals." });
      }),
    }),
  };
}
