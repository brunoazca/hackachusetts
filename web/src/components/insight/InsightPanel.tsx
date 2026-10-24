"use client";
import { useEffect, useMemo, useState } from "react";
import { useMap } from "@/lib/map-store";
import { highlightIds, loadInsight, routeSelection, type AreaInsight, type EvidenceInsight, type Insight, type RecordInsight } from "@/lib/insight";
import type { RegionLocation } from "@/components/insights/regions/parse";
import InspectorPanel from "@/components/inspector/InspectorPanel";
import RankingList from "./RankingList";
import AreaView from "./AreaView";
import RecordCard from "./RecordCard";
import EvidenceCard from "./EvidenceCard";

// The one Insight panel (left). Nothing selected: the severity ranking (infinite scroll).
// A selection on the map or in the panel changes what it shows:
//   cell / drawn area -> that area's insight     rodent report -> report insight
//   other report / place -> evidence insight     site / parcel / other -> the existing detail view
// "Act" (or Esc) clears the selection and returns to the ranking. Spec: insights-severity-ranking.md §12.

export default function InsightPanel() {
  const selection = useMap((s) => s.selection);
  const select = useMap((s) => s.select);
  const flyTo = useMap((s) => s.flyTo);
  const setHighlight = useMap((s) => s.setHighlight);
  const setRegionCells = useMap((s) => s.setRegionCells);
  const resolvedCells = useMap((s) => s.resolvedCells);
  const toggleResolved = useMap((s) => s.toggleResolved);
  const target = useMemo(() => routeSelection(selection), [selection]);
  const key = JSON.stringify(target);
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<{ key: string; insight?: Insight | null; error?: string }>({ key: "" });

  useEffect(() => {
    if (target.kind === "ranking" || target.kind === "legacy") { setHighlight([]); setRegionCells([]); return; }
    const ctl = new AbortController();
    loadInsight(target, ctl.signal)
      .then((insight) => { if (!ctl.signal.aborted) { setState({ key, insight }); setHighlight(highlightIds(insight)); setRegionCells(insight?.kind === "area" ? insight.cell_ids : []); } })
      .catch(() => { if (!ctl.signal.aborted) setState({ key, error: "Could not load this insight. Try again." }); });
    return () => ctl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce]);

  // Esc returns to the ranking when focus is not in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "Escape" && !/INPUT|TEXTAREA|SELECT/.test(t?.tagName ?? "") && useMap.getState().selection) select(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [select]);

  const onLocate = (loc: RegionLocation) => {
    flyTo({ lat: loc.lat, lon: loc.lon, zoom: 17 });
    if (loc.incident_ids[0]) select({ kind: "incident", id: loc.incident_ids[0] });
  };

  const current = state.key === key ? state : undefined;
  let body: React.ReactNode;
  if (target.kind === "ranking") body = <RankingList onLocate={onLocate} />;
  else if (target.kind === "legacy") body = <InspectorPanel />;
  else if (current?.error) body = <p role="alert" className="p-4 text-small text-danger">{current.error}</p>;
  else if (!current) body = <p className="p-4 text-small text-fg-3" aria-live="polite">Loading…</p>;
  else if (!current.insight) body = <p className="p-4 text-small text-fg-3">This item is no longer available.</p>;
  else if (current.insight.kind === "area") body = <AreaView insight={current.insight as AreaInsight} onLocate={onLocate} onReload={() => setNonce((n) => n + 1)} />;
  else if (current.insight.kind === "record") body = <RecordCard insight={current.insight as RecordInsight} />;
  else if (current.insight.kind === "evidence") body = <EvidenceCard insight={current.insight as EvidenceInsight} />;

  return (
    <aside aria-label="Act" className="map-secondary-panel glass absolute bottom-3 left-3 top-(--shell-top) z-20 flex w-[380px] max-w-[calc(100%-24px)] flex-col overflow-hidden rounded-lg">
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-line px-2">
        {selection ? (
          <button type="button" onClick={() => select(null)} title="Back to Act · Esc"
            className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-[13px] font-medium text-fg-2 hover:bg-card-hover hover:text-fg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden><path d="m15 18-6-6 6-6" /></svg>
            Act
          </button>
        ) : <h2 className="px-2 text-[13px] font-semibold text-fg">Act</h2>}
        {selection?.kind === "cell" && (() => {
          const done = resolvedCells.includes(selection.id);
          return (
            <button type="button" aria-pressed={done} onClick={() => toggleResolved(selection.id)}
              title={done ? "Put the alert back on this block" : "Clear this block's alert on the map"}
              className={`ml-auto inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-[13px] font-medium ${done ? "text-fg-2 hover:bg-card-hover hover:text-fg" : "bg-[#8B0000] text-white hover:bg-[#A31515]"}`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6 9 17l-5-5" /></svg>
              {done ? "Resolved · Reopen" : "Mark resolved"}
            </button>
          );
        })()}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{body}</div>
    </aside>
  );
}
