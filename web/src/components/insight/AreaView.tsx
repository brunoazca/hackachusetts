"use client";
import { useEffect, useState } from "react";
import { useMap } from "@/lib/map-store";
import { supabase } from "@/lib/supabase";
import { generateAreaAi, type AreaInsight } from "@/lib/insight";
import RegionSolutionCard from "@/components/insights/regions/RegionSolutionCard";
import { parseRegionSolutions, type RegionLocation } from "@/components/insights/regions/parse";
import type { SourceRow } from "@/components/insights/types";
import { Caveat, num, Section, Stat } from "./shared";

// A cell, hotspot or drawn area. One cell in a ranked hotspot shows the hotspot's card; any other
// cell with rodent history shows its own card (rules until "Generate AI analysis", then cached AI).

export default function AreaView({ insight: a, onLocate, onReload }: {
  insight: AreaInsight; onLocate: (loc: RegionLocation) => void; onReload: () => void;
}) {
  const select = useMap((s) => s.select);
  const flyTo = useMap((s) => s.flyTo);
  const setForecastWeek = useMap((s) => s.setForecastWeek);
  const setLayers = useMap((s) => s.setLayers);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [failedFor, setFailedFor] = useState<string | null>(null);

  // The card component reads region_solutions rows; a cell_solutions row is the same shape keyed by cell_id.
  const raw = a.solution ? { region_id: (a.solution.region_id ?? a.solution.cell_id) as string, ...a.solution } : null;
  const card = raw ? parseRegionSolutions([raw])[0] : undefined;
  const ids = card?.input.source_ids.join(",") ?? "";
  useEffect(() => {
    if (!ids) return;
    let live = true;
    supabase.from("sources").select("id,name,url,retrieved_at").in("id", ids.split(","))
      .then(({ data }) => { if (live) setSources((data ?? []) as SourceRow[]); });
    return () => { live = false; };
  }, [ids]);

  const sv = a.severity as Record<string, number> | undefined;
  const forecast = (a.forecast ?? []) as { week: string; expected: number }[];
  const regions = (a.regions ?? []) as { region_id: string; rank: number; action: string }[];
  const cells = (a.cells ?? []) as { cell_id: string; rank: number; severity: number }[];

  // A cell still on the rule-based card gets its AI analysis as soon as it opens (cached after).
  const pending = a.can_generate_ai ? a.cell_ids[0] : null;
  useEffect(() => {
    if (!pending) return;
    const ctl = new AbortController();
    generateAreaAi(pending, ctl.signal)
      .then((r) => { if (!ctl.signal.aborted) { if (r.source === "ai") onReload(); else setFailedFor(pending); } })
      .catch(() => { if (!ctl.signal.aborted) setFailedFor(pending); });
    return () => ctl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);
  const writing = !!pending && failedFor !== pending;

  return (
    <div className="space-y-3 p-3 text-small">
      {writing ? (
        <div role="status" aria-live="polite" className="space-y-3 rounded-lg border border-line bg-card p-4">
          <div className="flex items-center gap-2 text-fg">
            <svg className="h-4 w-4 animate-spin motion-reduce:animate-none" viewBox="0 0 24 24" fill="none" aria-hidden><circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
            <span className="font-semibold">Writing the AI analysis for this block…</span>
          </div>
          <p className="text-fg-3">Reading its reports, nearby causes, the forecast and past cases (about 15 s, then saved).</p>
          {[0, 1, 2].map((i) => <div key={i} aria-hidden className="h-4 animate-pulse rounded bg-card-hover motion-reduce:animate-none" style={{ width: `${90 - i * 20}%` }} />)}
        </div>
      ) : card ? (
        <RegionSolutionCard solution={card} sources={sources} onLocate={onLocate}
          onShowMap={async (_id, week) => {
            setForecastWeek(week); setLayers({ forecast: true });
            const l = card.locations;
            if (l.length) flyTo({ lat: l.reduce((s, x) => s + x.lat, 0) / l.length, lon: l.reduce((s, x) => s + x.lon, 0) / l.length, zoom: 15 });
          }} />
      ) : (
        <>
          <header className="px-1">
            <h2 className="text-[15px] font-semibold text-fg">{a.cell_ids.length > 1 ? `Selected area · ${a.cell_ids.length} blocks` : "This block"}</h2>
            {a.cell_ids.length === 1 && <p className="text-fg-3">No rodent reports here in the last 2 years, so there is nothing to solve yet.</p>}
          </header>
          <div className="grid grid-cols-3 gap-2">
            <Stat value={num(sv?.observed_12w)} label="Reports, last 12 wk" />
            <Stat value={num(sv?.expected_4w)} label="Expected, next 4 wk" />
            <Stat value={num(sv?.expected_returns_60d)} label="Expected returns" />
          </div>
        </>
      )}

      {!!pending && failedFor === pending && <p role="alert" className="text-fg-3">AI analysis is not available right now; showing the rule-based card.</p>}

      {!card && forecast.length > 0 && (
        <Section title="Next 4 weeks">
          <ul className="space-y-1">{forecast.map((f) => <li key={f.week} className="flex justify-between"><span className="text-fg-2">Week of {f.week}</span><span className="font-mono tabular-nums">{num(f.expected)} expected</span></li>)}</ul>
        </Section>
      )}

      {!card && a.cell_ids.length > 1 && regions.length > 0 && (
        <Section title="Hotspots in this area">
          <ul className="space-y-1.5">{regions.map((r) => (
            <li key={r.region_id}><button type="button" onClick={() => select({ kind: "cell", id: r.region_id })} className="text-left underline decoration-fg-3 underline-offset-2 hover:decoration-accent">#{r.rank} · {r.action.replace(/\[([^\]]+)\]\(L\d+\)/g, "$1")}</button></li>
          ))}</ul>
        </Section>
      )}
      {!card && a.cell_ids.length > 1 && cells.length > 0 && (
        <Section title="Worst blocks in this area">
          <ul className="space-y-1">{cells.slice(0, 8).map((c) => (
            <li key={c.cell_id} className="flex justify-between"><button type="button" onClick={() => select({ kind: "cell", id: c.cell_id })} className="underline decoration-fg-3 underline-offset-2 hover:decoration-accent">Block ranked {c.rank}</button><span className="font-mono tabular-nums text-fg-3">severity {num(c.severity)}</span></li>
          ))}</ul>
        </Section>
      )}
      <Caveat>{String(a.caveat ?? "")}</Caveat>
    </div>
  );
}
