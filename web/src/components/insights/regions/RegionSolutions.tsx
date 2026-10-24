"use client";
import { useEffect, useState } from "react";
import { useMap } from "@/lib/map-store";
import { fetchCellDetail } from "@/lib/forecast";
import { loadRegionSolutions } from "./load";
import RegionSolutionCard from "./RegionSolutionCard";

type Result = Awaited<ReturnType<typeof loadRegionSolutions>>;
export default function RegionSolutions() {
  const [limit, setLimit] = useState(5);
  const [attempt, setAttempt] = useState(0);
  const key = `${limit}-${attempt}`;
  const [result, setResult] = useState<{ key: string; data?: Result; error?: string }>({ key: "" });
  useEffect(() => {
    const controller = new AbortController();
    loadRegionSolutions(limit, controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ key, data });
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ key, error: "Could not load proposed solutions. Please try again." });
    });
    return () => controller.abort();
  }, [limit, key]);
  const data = result.key === key ? result.data : undefined;
  const error = result.key === key ? result.error : undefined;
  async function showMap(id: string, week: string | null) {
    const detail = await fetchCellDetail(id);
    if (!detail.cell) throw new Error("Region location unavailable");
    const map = useMap.getState();
    map.setMode("assess"); map.setLayers({ forecast: true }); map.setForecastWeek(week);
    map.flyTo({ lat: detail.cell.lat, lon: detail.cell.lon, zoom: 15 });
    map.select({ kind: "cell", id });
  }
  return <div className="space-y-4 p-4">
    <header><span className="eyebrow">Insights · proposed actions</span><h2 className="mt-1 text-title font-semibold text-fg">Where to act first</h2><p className="text-small text-fg-2">Ranked regions, with solutions grounded in past cases, nearby evidence and expected reports.</p></header>
    <label className="flex items-center justify-between text-small text-fg">Priority regions<select className="min-h-10 rounded-lg border border-edge bg-card px-3 text-fg" value={limit} onChange={e => setLimit(Number(e.target.value))}>{[5,10,20].map(n => <option key={n} value={n}>Top {n}</option>)}</select></label>
    <p role="status" aria-live="polite" className="text-small text-fg-3">{data ? data.regions.length ? `${data.regions.length} regions · ranked by published severity` : "Proposed solutions are not available yet. Existing evidence is available below." : error ? "" : "Loading proposed solutions…"}</p>
    {error && <p role="alert" className="text-small text-danger">{error}</p>}
    {(error || data?.regions.length === 0) && <button className="min-h-10 rounded-lg border border-edge px-3 text-fg" onClick={() => setAttempt(a => a+1)}>Check again</button>}
    {data?.sourcesUnavailable && <p className="text-xs text-fg-3">Source details could not be loaded. Source IDs remain available on each card.</p>}
    <ol className="space-y-4">{data?.regions.map(r => <li key={r.region_id}><RegionSolutionCard solution={r} sources={data.sources} onShowMap={showMap}/></li>)}</ol>
  </div>;
}
