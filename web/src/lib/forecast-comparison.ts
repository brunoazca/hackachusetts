import type { ScorePair } from "../components/insights/types";

export type Verdict = "better" | "worse" | "same" | null;

/** Shared by Insights and chat. MAE is lower-is-better; capture is higher-is-better. */
export function compare(p: ScorePair, lowerIsBetter: boolean): Verdict {
  if (p.model === null || p.baseline === null) return null;
  const d = p.model - p.baseline;
  if (Math.abs(d) < 1e-9) return "same";
  return (lowerIsBetter ? d < 0 : d > 0) ? "better" : "worse";
}
