"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { loadInsights, type InsightsFetcher } from "./load";
import type { InsightsState } from "./types";

// Production read path: one read-only RPC (see RPC_PROPOSAL.md), anon key.
export const fetchInsightsSummary: InsightsFetcher = async () => {
  const { data, error } = await supabase.rpc("insights_summary", undefined, { get: true });
  return { data, error: error ? { code: error.code, message: error.message } : null };
};

export function useInsights(fetcher: InsightsFetcher = fetchInsightsSummary) {
  const [state, setState] = useState<InsightsState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    loadInsights(fetcher).then((s) => { if (live) setState(s); });
    return () => { live = false; };
  }, [fetcher, attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((a) => a + 1);
  }, []);

  return { state, retry };
}
