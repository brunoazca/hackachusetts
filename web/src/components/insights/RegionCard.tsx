"use client";
import { useState } from "react";
import { fetchCellDetail } from "@/lib/forecast";
import { useMap } from "@/lib/map-store";
import type { InsightsRegion, InsightsRegionsPayload } from "./parse";

const fmt = (n: number | null) => n === null ? "Unavailable" : n.toLocaleString("en-US", { maximumFractionDigits: 1 });
const pct = (n: number) => `${Math.round(n * 100)}%`;
const date = (s: string | null | undefined) => s ? new Date(s).toLocaleDateString("en-US", { timeZone: "UTC" }) : "Unavailable";
const bands = { low: "bg-neutral-100 text-neutral-800", elevated: "bg-amber-100 text-amber-950", high: "bg-orange-100 text-orange-950", very_high: "bg-red-100 text-red-900" };
const button = "min-h-10 rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50";
export function Sources({ ids, sources }: { ids: string[]; sources: InsightsRegionsPayload["sources"] }) {
  return <span className="block text-[11px] text-neutral-600">{ids.length ? ids.map((id, i) => {
    const s = sources.find(s => s.id === id);
    return <span key={id}>{i > 0 && " · "}{s && /^https?:\/\//i.test(s.url) ? <a className="underline" href={s.url} target="_blank" rel="noreferrer">{s.name}</a> : s?.name ?? `Source ${id} (details pending)`}{s && ` · retrieved ${date(s.retrieved_at)}`}</span>;
  }) : "Source attribution pending"}</span>;
}
export default function RegionCard({ region: r, payload }: { region: InsightsRegion; payload: InsightsRegionsPayload }) {
  const [all, setAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const rec = r.recommendation;
  const runId = payload.run?.id ?? payload.run?.run_id;
  async function showMap() {
    setBusy(true); setError("");
    try {
      const point = r.lat !== null && r.lon !== null ? { lat: r.lat, lon: r.lon } : (await fetchCellDetail(r.cell_id)).cell;
      if (!point) throw new Error("Block location unavailable. Please try again.");
      const map = useMap.getState();
      map.setMode("assess"); map.setLayers({ forecast: true }); map.setForecastWeek(payload.week || null);
      map.flyTo({ lat: point.lat, lon: point.lon, zoom: 15 }); map.select({ kind: "cell", id: r.cell_id });
    } catch { setError("Could not open this block on the map. Please try again."); }
    finally { setBusy(false); }
  }
  return <section aria-labelledby={`region-${r.region_id}`} className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
    <header className="border-b border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-start justify-between gap-2"><h3 id={`region-${r.region_id}`} className="font-semibold">Rank {r.rank} · {r.neighborhood ?? "Boston"}</h3>
        {r.severity.band && <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${bands[r.severity.band]}`}>{r.severity.band.replaceAll("_", " ")}</span>}</div>
      <p className="mt-1 break-all font-mono text-[10px] text-neutral-600">{r.cell_id} · {r.cell_ids.length > 1 ? "Merged region" : "250 m block"}</p>
    </header>
    <div className="space-y-4 p-4 text-xs leading-relaxed">
      <div><h4 className="mb-2 font-semibold uppercase tracking-wide text-neutral-600">Severity · problems + future</h4>
        <div className="grid grid-cols-2 gap-2"><div className="rounded-lg bg-neutral-100 p-3"><strong className="block text-2xl tabular-nums">{fmt(r.severity.observed_12w)}</strong>reports · last 12 weeks</div><div className="rounded-lg bg-amber-50 p-3"><strong className="block text-2xl tabular-nums">{fmt(r.severity.expected_4w)}</strong>expected · next 4 weeks</div></div>
        {r.severity.score !== null && <p className="mt-2">Severity: <b>{fmt(r.severity.score)}</b> reports across the observed and forecast periods.</p>}
        {r.severity.expected !== null && <p className="mt-2"><b>{fmt(r.severity.expected)}</b> expected reports this week{r.severity.p_any !== null && ` · ${pct(r.severity.p_any)} chance of at least one report`}.</p>}
        <p className="mt-2 text-neutral-600">Model estimate, not a measured effect.</p>
        <p className="break-words text-[10px] text-neutral-600">Model run: {runId ?? "Attribution pending"} · trained through {date(payload.run?.trained_through)} · computed {date(payload.run?.computed_at ?? payload.run?.created_at)}</p>
        <Sources ids={r.source_ids} sources={payload.sources} />
      </div>
      {r.population && <div>{r.population.pop ? <>~{fmt(r.population.pop)} residents. Area-weighted estimate; population assumed uniform within each tract.</> : "Population not available."}<Sources ids={r.population.source_ids} sources={payload.sources} /></div>}
      <div><h4 className="font-semibold">The problem</h4>{r.problems.length ? <ul className="mt-2 space-y-2">{[...r.problems].sort((a,b) => Math.abs(b.contribution)-Math.abs(a.contribution)).slice(0,5).map((p,i) => <li key={i}><div className="flex justify-between gap-3"><span>{p.label}</span><span className="shrink-0 font-mono">{p.contribution > 0 ? "+" : ""}{fmt(p.contribution)}</span></div></li>)}</ul> : <p>Problem drivers not available for this block.</p>}<p className="mt-1 text-[10px] text-neutral-600">Contributions in expected reports · model run above.</p></div>
      <div className="rounded-lg border border-teal-200 bg-teal-50 p-3"><h4 className="font-semibold">What you can do</h4>{rec ? <><p className="mt-1 font-semibold">{rec.action}</p><p>{rec.because}</p><p className="mt-2 text-[10px] uppercase">{rec.source === "ai" ? "AI recommendation" : "Rule-based recommendation"} · {rec.lane}</p>{rec.unknowns.length > 0 && <p className="mt-2">Check on site: {rec.unknowns.join("; ")}</p>}</> : <p>Recommendation pending.</p>}</div>
      <div><h4 className="font-semibold">Evidence · possible causes nearby</h4>{!r.nearby_causes.length && !r.evidence.length && <p>Nearby evidence pending.</p>}
        {r.nearby_causes.map((c,i) => <div key={i} className="mt-2"><p>{c.label}: {fmt(c.count)} · nearest {fmt(c.nearest_m)} m from a report</p><Sources ids={c.source_ids} sources={payload.sources}/></div>)}
        {r.evidence.map((e,i) => <div key={i} className="mt-2"><p>{e.text} {e.strength && `(${e.strength})`} {e.stat}</p>{e.caveat && <p>{e.caveat}</p>}<p className="text-neutral-600">Association is not causation. City actions reflect the situations inspectors encountered; comparisons are subject to selection bias.</p><Sources ids={e.source_ids} sources={payload.sources}/></div>)}
      </div>
      <div><h4 className="font-semibold">After the fix</h4>{r.after_fix?.expected_after !== null && r.after_fix?.expected_after !== undefined ? <><p className="mt-1 text-xl font-semibold">{fmt(r.severity.expected)} → {fmt(r.after_fix.expected_after)}</p><p>expected reports / week · {fmt(r.after_fix.delta_4w)} fewer expected over four weeks.</p><p>Counterfactual on model attributions, not a measured intervention effect.{r.after_fix.floor_reached && " Model floor reached."}</p>{r.after_fix.recur_p !== null && <p>{pct(r.after_fix.recur_p)} chance reports return within 60 days if nothing changes.</p>}<p className="text-[10px] text-neutral-600">Model run: {runId ?? "Attribution pending"}</p></> : <p>{rec?.lane === "inspect" ? "Unknown until inspected." : "After-fix estimate pending."}</p>}</div>
      <details><summary className="min-h-10 cursor-pointer py-2 font-semibold">Records · what to do next</summary>{r.records.length ? <><ul className="space-y-3">{[...r.records].sort((a,b) => b.opened_at.localeCompare(a.opened_at)).slice(0, all ? undefined : 10).map(record => <li key={record.incident_id} className="border-l-2 border-neutral-200 pl-3"><p className="font-semibold">{date(record.opened_at)} · {record.status}</p><p>{record.address_block ?? "Block unavailable"}</p><p>City action: {record.done_action.replaceAll("_", " ")}</p><p>Next: {record.todo}</p>{record.p_return !== null && <p>{pct(record.p_return)} predicted chance of return within 60 days · model estimate.</p>}<p className="break-all text-[10px] text-neutral-600">Record {record.incident_id}</p></li>)}</ul>{r.records.length > 10 && <button className={button} onClick={() => setAll(!all)}>{all ? "Show fewer" : "Show all available records"}</button>}</> : <p>Record-level recommendations pending.</p>}</details>
      <div className="flex flex-wrap gap-2"><button className={button} onClick={showMap} disabled={busy}>{busy ? "Opening…" : "Show on map ↗"}</button><button className={button} disabled={!rec?.site_id} title={!rec?.site_id ? "No linked site available" : undefined} onClick={() => { if (rec?.site_id) useMap.getState().select({ kind: "site", id: rec.site_id }); }}>Open case</button></div>
      {error && <p role="alert" className="text-red-800">{error}</p>}
    </div>
  </section>;
}
