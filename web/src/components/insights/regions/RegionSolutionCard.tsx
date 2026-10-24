"use client";
import { useId, useState } from "react";
import { fmtDate, fmtDateTime, fmtNumber } from "../format";
import Sources from "../Sources";
import type { SourceRow } from "../types";
import type { RegionSolution } from "./parse";
import RegionProfile from "./RegionProfile";

const actionLabels = { sanitation: "Clean up & contain waste", exclusion: "Seal entry points", enforcement: "Follow up with property owners", referral: "Coordinate with city agencies", inspect: "Inspect & identify causes" };

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
  return <section aria-labelledby={heading} className="rounded-2xl border border-line bg-card p-4 text-sm leading-relaxed text-fg-2">
    <header className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card-hover text-sm font-semibold tabular-nums text-fg" aria-label={`Priority ${r.rank}`}>{r.rank}</span>
      <div className="min-w-0">
        <h3 id={heading} className="text-lg font-semibold leading-tight text-fg">{input.region.neighborhood ?? "Boston"}</h3>
        <p className="mt-0.5 text-xs text-fg-3">{r.cell_ids.length} blocks · priority region</p>
      </div>
    </header>
    <dl className="my-4 grid grid-cols-2 gap-4 border-y border-line py-3">
      <div><dt className="text-xs text-fg-2">Recent reports</dt><dd className="mt-1 text-2xl font-semibold leading-tight tabular-nums text-fg">{number(input.region.severity.observed_12w)}</dd><dd className="mt-1 text-xs text-fg-3">Past 12 weeks</dd></div>
      <div><dt className="text-xs text-fg-2">Expected reports</dt><dd className="mt-1 text-2xl font-semibold leading-tight tabular-nums text-fg">{number(input.region.severity.expected_4w)}</dd><dd className="mt-1 text-xs text-fg-3">Next 4 weeks · estimate</dd></div>
    </dl>
    <div className="space-y-2">
      <p className="text-xs text-fg-3">Suggested next step</p>
      <h4 className="text-base font-medium text-fg">{actionLabels[r.lane]}</h4>
      <p className="line-clamp-3 text-sm leading-relaxed">{r.action}</p>
      <p className="text-xs text-fg-3">Model suggestion · verify on site</p>
    </div>
    <button type="button" onClick={show} disabled={busy} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-card-hover px-3 text-sm font-medium text-fg transition-colors hover:bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>
      {busy ? "Opening…" : "Show on map"}
    </button>
    {error && <p role="alert" className="mt-2 text-danger">Could not open this region. Please try again.</p>}
    <details className="group/analysis mt-4 border-t border-line">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 pt-2 text-sm font-medium text-fg-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
        <span className="group-open/analysis:hidden">View analysis</span><span className="hidden group-open/analysis:inline">Hide analysis</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden className="transition-transform group-open/analysis:rotate-180 motion-reduce:transition-none"><path d="m6 9 6 6 6-6"/></svg>
      </summary>
      <div className="space-y-4 pt-3">
        <div className="space-y-2"><h4 className="font-medium text-fg">Recommended action</h4><p>{r.action}</p></div>
        <div className="space-y-2"><h4 className="font-medium text-fg">Why this region</h4><p>{r.because}</p></div>
        {r.unknowns.length > 0 && <div><h4 className="mb-2 font-medium text-fg">Check on site</h4><ul className="list-disc space-y-2 pl-4">{r.unknowns.map((u,i) => <li key={i}>{u}</li>)}</ul></div>}
        {input.region.severity.expected_returns_60d !== null && <p className="text-xs">Expected returns within 60 days: {number(input.region.severity.expected_returns_60d)} · severity total: {number(input.region.severity.score)}. Model estimate from active addresses.</p>}
        <p className="text-xs text-fg-3">{r.caveat} Action comparisons are observational and subject to selection bias; a lower predicted return rate is not proof an intervention works.</p>
    <details><summary className="min-h-10 cursor-pointer py-2 text-sm font-medium text-fg">Forecast & possible causes</summary>
      <ul className="space-y-1">{weeks.map(([week,expected]) => <li key={week}>{fmtDate(week)}: {fmtNumber(expected)} expected reports</li>)}</ul>
      {input.forecast.week_1_chance_of_any_report && <p className="mt-2">{input.forecast.week_1_chance_of_any_report} chance of at least one report in the first week.</p>}
      <p className="mt-3 font-semibold text-fg">Model drivers</p>{input.forecast.drivers.length ? <ul>{input.forecast.drivers.map((d,i) => <li key={i}>{d.label}: {d.contribution > 0 ? "+" : ""}{fmtNumber(d.contribution)} expected reports</li>)}</ul> : <p>Drivers not available.</p>}
      <p className="mt-3 font-semibold text-fg">Nearby evidence</p>{input.possible_causes_within_150m.length ? <ul className="space-y-2">{input.possible_causes_within_150m.map((c,i) => <li key={i}>{c.label}: {number(c.count)} · nearest {number(c.nearest_m)} m<Sources ids={c.source_ids} details={sources}/></li>)}</ul> : <p>Nearby causes not available.</p>}
    </details>
    <RegionProfile cellIds={r.cell_ids} />
    <details><summary className="min-h-10 cursor-pointer py-2 text-sm font-medium text-fg">Records · what to do next</summary>
      {!r.records.length && <p>Record-level recommendations pending.</p>}
      <ul className="space-y-3">{r.records.slice(0, all ? undefined : 10).map(record => <li key={record.incident_id} className="border-l-2 border-edge pl-3"><p className="font-semibold text-fg">{record.block ?? "Block unavailable"} · {record.status}</p><p>{fmtDate(record.opened)} · City action: {record.city_did}</p><p className="mt-1">Next: {record.todo}</p>{record.model?.confident && <p className="text-xs text-fg-3">Per-record model ({record.model.best_action}): {record.model.return_if_best ?? "unavailable"} predicted return within 60 days, versus {record.model.return_if_monitoring ?? "unavailable"} under monitoring. This compares the record model’s best action, which may differ from the region proposal.</p>}<p className="break-all text-xs text-fg-3">Record: {record.incident_id}</p></li>)}</ul>
      {r.records.length > 10 && <button className="mt-2 min-h-10 underline" onClick={() => setAll(v => !v)}>{all ? "Show fewer" : "Show all available records"}</button>}
    </details>
    <details><summary className="min-h-10 cursor-pointer py-2 text-sm font-medium text-fg">Past cases in similar situations</summary><p className="mb-2">Observed outcomes, not measured treatment effects. Overlapping intervals do not establish a difference.</p>
      {Object.entries(input.solution_statistics).length ? Object.entries(input.solution_statistics).map(([s,stats]) => <div key={s} className="mb-4"><h4 className="font-semibold text-fg">{s}</h4><p>{number(stats.cases)} past cases · {stats.returned_within_60d ?? "unavailable"} returned within 60 days</p><ul className="mt-2 space-y-2">{stats.by_action.map((a,i) => <li key={i}><strong>{a.action}</strong>{!a.proposable && " (historical action only)"}: {number(a.cases)} cases · {a.returned_within_60d ?? "unavailable"} returned{a.interval_95 && ` (95% interval: ${a.interval_95})`}{a.model_adjusted_return && ` · adjusted model estimate: ${a.model_adjusted_return}`}</li>)}</ul></div>) : <p>Solution statistics pending.</p>}
    </details>
    <p className="text-xs text-fg-3">After-fix forecast not available. The model proposes actions; it does not publish an intervention-effect estimate.</p>
    <details><summary className="min-h-10 cursor-pointer py-2 text-sm font-medium text-fg">Sources & model provenance</summary><p className="break-all">Region: {r.region_id}</p><p>{r.source === "ai" ? r.llm_model ?? "AI model" : "Rule-based fallback"}</p><p className="break-all">Forecast run: {r.forecast_run_id}</p><p>Solution computed: {fmtDateTime(r.computed_at)}</p>{r.cites.length > 0 && <p className="break-words">Evidence cited by the solution: {r.cites.join(" · ")}</p>}<Sources ids={input.source_ids} details={sources}/></details>
      </div>
    </details>
  </section>;
}
