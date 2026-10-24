"use client";
import { useEffect, useState } from "react";
import { loadInsights } from "./load";
import RegionCard, { Sources } from "./RegionCard";
import type { InsightsRegionsPayload } from "./parse";

export default function InsightsPanel() {
  const [limit, setLimit] = useState(5);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; data?: InsightsRegionsPayload; error?: string }>({ key: "" });
  const key = `${limit}-${attempt}`;
  useEffect(() => {
    const controller = new AbortController();
    loadInsights(limit, controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ key, data });
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ key, error: error?.code === "PGRST202" ? "Results not available yet. Forecast results are still being prepared." : "Could not load insights. Please try again." });
    });
    return () => controller.abort();
  }, [limit, key]);
  const data = result.key === key ? result.data : undefined;
  const error = result.key === key ? result.error : undefined;
  return <div className="space-y-4 bg-neutral-50 p-4 text-sm">
    <header><p className="text-[10px] font-bold uppercase tracking-widest text-teal-800">Prioritize · investigate · act</p><h2 className="mt-1 text-xl font-semibold">Where to act first</h2><p className="mt-1 text-xs leading-relaxed text-neutral-600">The most urgent regions, with evidence and practical next steps. You decide where to act.</p></header>
    <label className="flex items-center justify-between text-xs font-medium">Show regions<select value={limit} onChange={e => setLimit(Number(e.target.value))} className="min-h-10 rounded-lg border border-neutral-300 bg-white px-3">{[5,10,20].map(n => <option key={n} value={n}>Top {n}</option>)}</select></label>
    <div role="status" aria-live="polite" className="text-xs text-neutral-700">{!data && !error ? "Loading ranked regions…" : data ? `${data.regions.length} regions available${data.week ? ` · forecast week ${data.week}` : ""}` : ""}</div>
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-white p-4"><p>{error}</p><button onClick={() => setAttempt(a => a+1)} className="mt-2 min-h-10 underline">Try again</button></div>}
    {data && <>{data.fallback && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">Forecast preview: ranked by expected reports for the next week. Full severity ranking, merged regions and observed history are pending. Only the available top five blocks can be shown.</p>}
      {!data.regions.length ? <p className="rounded-lg border bg-white p-4">Results not available yet. No ranked regions were returned.</p> : <ol className="space-y-4">{data.regions.map(r => <li key={r.region_id}><RegionCard region={r} payload={data}/></li>)}</ol>}
      <details className="rounded-lg border border-neutral-200 bg-white p-3 text-xs leading-relaxed"><summary className="min-h-10 cursor-pointer py-2 font-semibold">Methodology & evidence</summary><p>Severity combines observed reports over the last 12 weeks and expected reports over the next four. Full region rankings group adjacent hotspots; nearby evidence follows report locations across grid borders.</p><p className="mt-2">{data.caveat} Reporting activity can vary by neighborhood. Fewer reports do not necessarily mean fewer rodents.</p><p className="mt-2">Recommendations support human review. Action comparisons are confounded by inspection context and are not measured effects.</p><p className="mt-2">Backtest metrics: {Object.entries(data.run?.metrics ?? {}).filter(([,v]) => typeof v === "number").map(([k,v]) => `${k.replaceAll("_", " ")}: ${Number(v).toFixed(3)}`).join(" · ") || "Not available"}</p><p>Source: model run {data.run?.id ?? data.run?.run_id ?? "pending"}.</p><Sources ids={data.sources.map(s => s.id)} sources={data.sources}/></details>
    </>}
  </div>;
}
