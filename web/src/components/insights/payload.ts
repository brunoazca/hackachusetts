// Validate the RPC envelope before rendering. JSONB statistics/charts remain unknown:
// their adapters handle missing or unsupported values within each card.
import { z } from "zod";
import type { InsightsPayload } from "./types";

const text = z.string();
const nullableText = text.nullable();
const sources = z.array(text).nullable();
const count = z.number().int().nonnegative();

export const insightsPayloadSchema: z.ZodType<InsightsPayload> = z.object({
  sources: z.array(z.object({ id: text, name: text, url: text, retrieved_at: text })).nullish(),
  correlations: z.array(z.object({
    id: text, title: text, question: text, method: text, unit: nullableText,
    stat: z.unknown(), strength: text, chart: z.unknown(), caveat: text,
    group_name: text, source_ids: sources, sort: z.number().int().nullable(), computed_at: text,
  })).nullable(),
  price_impact: z.array(z.object({
    id: text, title: text, scope: text, scope_id: nullableText, metric: text,
    value: z.unknown(), caveat: text, source_ids: sources, computed_at: text,
  })).nullable(),
  forecast: z.object({
    run: z.object({
      id: text, model: text, trained_through: nullableText, params: z.unknown(),
      metrics: z.unknown(), feature_importance: z.unknown(), created_at: text,
    }).nullable(),
    weeks: z.array(z.object({
      week_start: text, expected_total: z.number().nonnegative(), cells: count,
      bands: z.object({ low: count.optional(), elevated: count.optional(), high: count.optional(), very_high: count.optional() }),
    })).nullable(),
    top_cells: z.array(z.object({
      cell_id: text, week_start: text, expected: z.number().nonnegative(),
      p_any: z.number().min(0).max(1), risk_band: text, neighborhood: nullableText, drivers: z.unknown(),
    })).nullable(),
  }).nullable(),
});
