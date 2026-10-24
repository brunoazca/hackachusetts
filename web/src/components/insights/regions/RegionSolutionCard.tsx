"use client";
import { useId, useState } from "react";
import { fmtDate, fmtDateTime, fmtNumber } from "../format";
import Sources from "../Sources";
import type { SourceRow } from "../types";
import type { RegionSolution } from "./parse";

const number = (n: number | null) => n === null ? "Unavailable" : fmtNumber(n);
export default function RegionSolutionCard({ solution: r, sources, onShowMap }: {
  solution: RegionSolution; sources: SourceRow[]; onShowMap: (id: string, week: string | null) => Promise<void>;
}) {
  const heading = useId();
  const [all, setAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const input = r.input;
  const weeks = Object.entries(input.forecast.next_4_weeks_expected_reports).sort(([a],[b]) => a.localeCompare(b));
  async function show() {
    setBusy(true); setError(false);
    try { await onShowMap(r.region_id, weeks[0]?.[0] ?? null); }
    catch { setError(true); }
    finally { setBusy(false); }
  }
  return <section aria-labelledby={heading} className="space-y-4 rounded-xl border border-edge bg-card p-4 text-small text-fg-2">
    <header><p className="eyebrow">Priority region · {r.cell_ids.length} blocks</p><h3 id={heading} className="mt-1 text-lg font-semibold text-fg">Rank {r.rank} · {input.region.neighborhood ?? "Boston"}</h3><p className="break-all text-xs text-fg-3">{r.region_id}</p></header>
    <div className="grid grid-cols-2 gap-3"><div><strong className="block text-2xl text-fg">{number(input.region.severity.observed_12w)}</strong>reports · last 12 weeks</div><div><strong className="block text-2xl text-fg">{number(input.region.severity.expected_4w)}</strong>expected · next 4 weeks</div></div>
    <div className="space-y-2 rounded-lg border border-accent p-3">
      <p className="text-xs font-semibold uppercase text-accent">Proposed solution · {r.source === "ai" ? "AI" : "Rules"} · {r.lane}</p>
      <h4 className="font-semibold text-fg">{r.action}</h4><p>{r.because}</p>
      {r.unknowns.length > 0 && <div><p className="font-semibold text-fg">Check on site</p><ul className="list-disc pl-4">{r.unknowns.map((u,i) => <li key={i}>{u}</li>)}</ul></div>}
      <p className="text-xs text-fg-3">{r.source === "ai" ? r.llm_model ?? "AI model" : "Rule-based fallback"} · computed {fmtDateTime(r.computed_at)}</p>
    </div>
    <p className="text-xs text-fg-2">{r.caveat} Action comparisons are observational and subject to selection bias; a lower predicted return rate is not proof an intervention works.</p>
    <details><summary className="min-h-10 cursor-pointer py-2 font-semibold text-fg">Forecast & possible causes</summary>
      <ul className="space-y-1">{weeks.map(([week,expected]) => <li key={week}>{fmtDate(week)}: {fmtNumber(expected)} expected reports</li>)}</ul>
      {input.forecast.week_1_chance_of_any_report && <p className="mt-2">{input.forecast.week_1_chance_of_any_report} chance of at least one report in the first week.</p>}
      <p className="mt-3 font-semibold text-fg">Model drivers</p>{input.forecast.drivers.length ? <ul>{input.forecast.drivers.map((d,i) => <li key={i}>{d.label}: {d.contribution > 0 ? "+" : ""}{fmtNumber(d.contribution)} expected reports</li>)}</ul> : <p>Drivers not available.</p>}
      <p className="mt-3 font-semibold text-fg">Nearby evidence</p>{input.possible_causes_within_150m.length ? <ul className="space-y-2">{input.possible_causes_within_150m.map((c,i) => <li key={i}>{c.label}: {number(c.count)} · nearest {number(c.nearest_m)} m<Sources ids={c.source_ids} details={sources}/></li>)}</ul> : <p>Nearby causes not available.</p>}
    </details>
    <details><summary className="min-h-10 cursor-pointer py-2 font-semibold text-fg">Records · what to do next</summary>
      {!r.records.length && <p>Record-level recommendations pending.</p>}
      <ul className="space-y-3">{r.records.slice(0, all ? undefined : 10).map(record => <li key={record.incident_id} className="border-l-2 border-edge pl-3"><p className="font-semibold text-fg">{record.block ?? "Block unavailable"} · {record.status}</p><p>{fmtDate(record.opened)} · City action: {record.city_did}</p><p className="mt-1">Next: {record.todo}</p>{record.model?.confident && <p className="text-xs text-fg-3">Per-record model ({record.model.best_action}): {record.model.return_if_best ?? "unavailable"} predicted return within 60 days, versus {record.model.return_if_monitoring ?? "unavailable"} under monitoring. This compares the record model’s best action, which may differ from the region proposal.</p>}<p className="break-all text-xs text-fg-3">Record: {record.incident_id}</p></li>)}</ul>
      {r.records.length > 10 && <button className="mt-2 min-h-10 underline" onClick={() => setAll(v => !v)}>{all ? "Show fewer" : "Show all available records"}</button>}
    </details>
    <details><summary className="min-h-10 cursor-pointer py-2 font-semibold text-fg">Past cases in similar situations</summary><p className="mb-2">Observed outcomes, not measured treatment effects. Overlapping intervals do not establish a difference.</p>
      {Object.entries(input.solution_statistics).length ? Object.entries(input.solution_statistics).map(([s,stats]) => <div key={s} className="mb-4"><h4 className="font-semibold text-fg">{s}</h4><p>{number(stats.cases)} past cases · {stats.returned_within_60d ?? "unavailable"} returned within 60 days</p><ul className="mt-2 space-y-2">{stats.by_action.map((a,i) => <li key={i}><strong>{a.action}</strong>{!a.proposable && " (historical action only)"}: {number(a.cases)} cases · {a.returned_within_60d ?? "unavailable"} returned{a.interval_95 && ` (95% interval: ${a.interval_95})`}{a.model_adjusted_return && ` · adjusted model estimate: ${a.model_adjusted_return}`}</li>)}</ul></div>) : <p>Solution statistics pending.</p>}
    </details>
    <p className="text-xs text-fg-3">After-fix forecast not available. The model proposes actions; it does not publish an intervention-effect estimate.</p>
    <details><summary className="min-h-10 cursor-pointer py-2 font-semibold text-fg">Sources & model provenance</summary><p className="break-all">Forecast run: {r.forecast_run_id}</p><p>Solution computed: {fmtDateTime(r.computed_at)}</p>{r.cites.length > 0 && <p className="break-words">Evidence cited by the solution: {r.cites.join(" · ")}</p>}<Sources ids={input.source_ids} details={sources}/></details>
    <button type="button" onClick={show} disabled={busy} className="min-h-10 rounded-lg border border-edge px-3 font-semibold text-fg hover:bg-card-hover focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50">{busy ? "Opening…" : "Show on map"}</button>
    {error && <p role="alert" className="text-danger">Could not open this region. Please try again.</p>}
  </section>;
}
