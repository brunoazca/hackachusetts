// Turns one fetch of the insights payload into a panel state. Pure (the fetcher is
// injected) so the state handling is testable without Supabase.

import { isEmpty, toInsightsData } from "./parse";
import { insightsPayloadSchema } from "./payload";
import type { InsightsState } from "./types";

export type RpcError = { code?: string; message: string };
export type InsightsFetcher = () => Promise<{ data: unknown; error: RpcError | null }>;

// PostgREST: function not in the schema cache (RPC not deployed yet).
const MISSING_RPC = new Set(["PGRST202", "42883"]);

export async function loadInsights(fetcher: InsightsFetcher): Promise<InsightsState> {
  let res: Awaited<ReturnType<InsightsFetcher>>;
  try {
    res = await fetcher();
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : String(e) };
  }
  if (res.error) {
    if (res.error.code && MISSING_RPC.has(res.error.code)) {
      return {
        status: "unavailable",
        reason: "The insights read endpoint (insights_summary) is not deployed yet.",
      };
    }
    return { status: "error", message: res.error.message };
  }
  const parsed = insightsPayloadSchema.safeParse(res.data);
  if (!parsed.success) {
    return { status: "error", message: "Unexpected response from insights_summary." };
  }
  let data;
  try {
    data = toInsightsData(parsed.data);
  } catch {
    return { status: "error", message: "Unexpected response from insights_summary." };
  }
  if (isEmpty(data)) {
    return { status: "unavailable", reason: "Analytics and the forecast have not written any results yet." };
  }
  return { status: "ready", data };
}
