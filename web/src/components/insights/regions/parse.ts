import { z } from "zod";

const text = z.string();
const count = z.number().finite().nonnegative().nullable().catch(null);
const strings = z.array(text).catch([]);
const percent = text.regex(/^(?:100|\d{1,2})(?:\.\d+)?%$/).nullable().catch(null);
const banned = /\b(bait\w*|poison\w*|rodenticide\w*|toxicant\w*)/i;
const safe = (s: string) => banned.test(s) ? "Inspect and record the cause" : s;
const model = z.object({ best_action: text.transform(safe), return_if_best: percent, return_if_monitoring: percent, confident: z.boolean().catch(false) }).nullable().catch(null);
const record = z.object({ incident_id: text, opened: text, block: text.nullable().catch(null), status: text, city_did: text.catch("Not recorded"), model });
const cause = z.object({ kind: text, label: text, count, nearest_m: count, source_ids: strings });
const statistic = z.object({ cases: count, returned_within_60d: percent, by_action: z.array(z.object({
  action: text, cases: count, share_of_cases: percent, returned_within_60d: percent,
  interval_95: text.nullable().catch(null), model_adjusted_return: percent, proposable: z.boolean().catch(false),
})).catch([]) });
const schema = z.object({
  region_id: text, forecast_run_id: text, rank: z.number().int().positive(), cell_ids: strings,
  action: text, lane: z.enum(["sanitation", "exclusion", "enforcement", "referral", "inspect"]).catch("inspect"), because: text,
  source: z.enum(["ai", "rules"]), llm_model: text.nullable().catch(null), computed_at: text, caveat: text.catch("Model estimate, not a measured effect."),
  cites: strings, unknowns: strings, records: z.array(z.object({ incident_id: text, todo: text.transform(safe) })).catch([]),
  input: z.object({
    region: z.object({ region_id: text, neighborhood: text.nullable().catch(null), severity: z.object({ observed_12w: count, expected_4w: count, expected_returns_60d: count, score: count }) }),
    forecast: z.object({ model_run_id: text, next_4_weeks_expected_reports: z.record(text, z.number().finite().nonnegative()).catch({}),
      week_1_chance_of_any_report: percent, drivers: z.array(z.object({ label: text, contribution: z.number().finite() })).catch([]),
    }),
    records_last_12_weeks: z.array(record).catch([]), possible_causes_within_150m: z.array(cause).catch([]),
    solution_statistics: z.record(text, statistic).catch({}), source_ids: strings,
  }),
});
export function parseRegionSolutions(raw: unknown) {
  if (!Array.isArray(raw)) throw new Error("Unexpected region solutions response.");
  return raw.flatMap(row => {
    const result = schema.safeParse(row);
    if (!result.success) return [];
    const r = result.data;
    // Never join evidence from a different region or forecast run.
    if (r.region_id !== r.input.region.region_id || r.forecast_run_id !== r.input.forecast.model_run_id) return [];
    const rejected = banned.test([r.action, r.because, ...r.unknowns].join(" "));
    const todos = new Map(r.records.map(record => [record.incident_id, record.todo]));
    return [{ ...r,
      action: rejected ? "Inspect and record the cause" : r.action,
      because: rejected ? "Confirm the cause during an on-site inspection." : r.because,
      lane: rejected ? "inspect" : r.lane, source: rejected ? "rules" as const : r.source,
      unknowns: rejected ? [] : r.unknowns,
      records: [...r.input.records_last_12_weeks].sort((a,b) => b.opened.localeCompare(a.opened)).map(record => ({
        ...record, todo: rejected ? "Inspect and record the cause" : todos.get(record.incident_id) ?? record.model?.best_action ?? "Recommendation pending",
      })),
    }];
  }).sort((a,b) => a.rank - b.rank);
}
export type RegionSolution = ReturnType<typeof parseRegionSolutions>[number];
