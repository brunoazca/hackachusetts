"use client";
import InsightsView from "./InsightsView";
import { useInsights } from "./useInsights";

// Insights tab: forecast summary, findings with charts and caveats, price & cost (R5.1, R6.2, R7).
export default function InsightsPanel() {
  const { state, retry } = useInsights();
  return <InsightsView state={state} onRetry={retry} />;
}
