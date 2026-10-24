import { z } from "zod";

const text = z.string();
const number = z.number().finite();
const count = number.transform(v => Math.max(0, v)).nullable().catch(null);
const probability = number.transform(v => Math.max(0, Math.min(1, v))).nullable().catch(null);
const strings = z.array(text).catch([]);
const forbidden = /bait|poison|rodenticide|carcass/i;
export const safeAction = (value: string) => forbidden.test(value) ? "Inspect and record the cause" : value;
const recommendation = z.object({
  action: text, because: text.catch(""), lane: z.enum(["sanitation", "exclusion", "enforcement", "referral", "inspect"]),
  source: z.enum(["ai", "rules"]).catch("rules"), cites: strings, unknowns: strings,
  site_id: text.nullable().catch(null), p_return_proposed: probability, p_return_monitoring: probability,
}).transform(r => forbidden.test([r.action, r.because, ...r.unknowns].join(" ")) ? {
  ...r, action: "Inspect and record the cause", because: "Confirm the cause during an on-site inspection.", lane: "inspect" as const,
  source: "rules" as const, unknowns: [], p_return_proposed: null, p_return_monitoring: null,
} : r).nullable().catch(null);
export const regionSchema = z.object({
  rank: number.int().positive(), region_id: text, cell_id: text, cell_ids: strings,
  neighborhood: text.nullable().catch(null), lat: number.min(-90).max(90).nullable().catch(null), lon: number.min(-180).max(180).nullable().catch(null),
  severity: z.object({ observed_12w: count, expected_4w: count, score: count, expected: count, p_any: probability,
    band: z.enum(["low", "elevated", "high", "very_high"]).nullable().catch(null), rank_of: count }),
  problems: z.array(z.object({ label: text, contribution: number, value: count })).catch([]),
  recommendation,
  records: z.array(z.object({ incident_id: text, opened_at: text, address_block: text.nullable().catch(null), status: text,
    done_action: text.catch("Not recorded"), todo: text.transform(safeAction).catch("Recommendation pending"), p_return: probability })).catch([]),
  nearby_causes: z.array(z.object({ kind: text, label: text, count, nearest_m: count, source_ids: strings })).catch([]),
  evidence: z.array(z.object({ kind: text, text, stat: text.optional(), strength: text.optional(), caveat: text.optional(), source_ids: strings })).catch([]),
  after_fix: z.object({ expected_after: count, delta_4w: count, floor_reached: z.boolean().catch(false), recur_p: probability }).nullable().catch(null),
  population: z.object({ pop: count, reports_per_1k: count, source_ids: strings, tract_ids: strings }).nullable().catch(null),
  source_ids: strings,
}).transform(r => ({ ...r, after_fix: !r.recommendation || r.recommendation.lane === "inspect" ? null : r.after_fix }));
export type InsightsRegion = z.infer<typeof regionSchema>;
const sourceSchema = z.object({ id: text, name: text, url: text.catch(""), retrieved_at: text.nullable().catch(null) });
const runSchema = z.object({ id: text.optional(), run_id: text.optional(), trained_through: text.nullable().catch(null), created_at: text.nullable().catch(null), computed_at: text.nullable().catch(null), metrics: z.record(text, z.unknown()).catch({}) });
export const envelopeSchema = z.object({ run: runSchema.nullable().catch(null), week: text.catch(""), total_cells: count,
  caveat: text.catch("Model estimate of 311 rodent reports, not a count of rats."), sources: z.array(sourceSchema).catch([]), regions: z.array(z.unknown()).catch([]) });
export function parseRegions(input: unknown) {
  const payload = envelopeSchema.parse(input);
  const regions = payload.regions.flatMap(item => { const result = regionSchema.safeParse(item); return result.success ? [result.data] : []; });
  return { ...payload, regions: regions.sort((a, b) => a.rank - b.rank), fallback: false };
}
export type InsightsRegionsPayload = ReturnType<typeof parseRegions>;
export const summarySchema = z.object({ sources: z.array(sourceSchema).catch([]), forecast: z.object({ run: runSchema.nullable().catch(null),
  top_cells: z.array(z.object({ cell_id: text, neighborhood: text.nullable().catch(null), week_start: text, expected: count, p_any: probability, risk_band: text,
    drivers: z.array(z.object({ label: text, contribution: number, value: count })).catch([]) })).catch([]),
}).nullable().catch(null) });
