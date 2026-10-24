"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMap } from "@/lib/map-store";
import { loadRanking, type RankingEntry } from "@/lib/insight";
import PlaceText from "@/components/insights/regions/PlaceText";
import type { RegionLocation } from "@/components/insights/regions/parse";
import InsightsView from "@/components/insights/InsightsView";
import HistoricalFindings from "@/components/insights/HistoricalFindings";
import { useInsights } from "@/components/insights/useInsights";
import { num } from "./shared";

// Nothing selected: every hotspot and block ranked by severity, worst first, loaded page by page
// as the list scrolls. Tapping an entry opens its insight; place names fly the map there.

const PAGE = 20;

export default function RankingList({ onLocate }: { onLocate: (loc: RegionLocation) => void }) {
  const select = useMap((s) => s.select);
  const flyTo = useMap((s) => s.flyTo);
  const [rows, setRows] = useState<RankingEntry[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinel = useRef<HTMLLIElement>(null);
  const done = total != null && rows.length >= total;

  const more = useCallback(async () => {
    if (busy || done) return;
    setBusy(true); setError(null);
    try {
      const page = await loadRanking(rows.length, PAGE);
      setRows((r) => [...r, ...page.rows.filter((x) => !r.some((y) => y.id === x.id))]);
      setTotal(page.rows.length ? page.total : rows.length);
    } catch {
      setError("Could not load more. Scroll to retry.");
    } finally { setBusy(false); }
  }, [busy, done, rows.length]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => { if (e[0]?.isIntersecting) void more(); }, { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [more]);

  const open = (r: RankingEntry) => {
    const locs = r.locations ?? [];
    if (locs.length) flyTo({ lat: locs.reduce((s, l) => s + l.lat, 0) / locs.length, lon: locs.reduce((s, l) => s + l.lon, 0) / locs.length, zoom: r.cell_ids.length > 1 ? 15 : 16 });
    select({ kind: "cell", id: r.id });
  };

  return (
    <div className="space-y-3 p-3">
      <header className="px-1">
        <h2 className="text-[15px] font-semibold text-fg">Where to act first</h2>
        <p className="text-small text-fg-3">Hotspots, then single blocks, by severity: reports in the last 12 weeks + expected in the next 4 + expected returns. Tap one, or anything on the map.</p>
      </header>
      <Methodology />
      <ol className="space-y-2" aria-live="polite">
        {rows.map((r) => {
          const sv = r.region?.severity ?? {};
          return (
            <li key={r.id}>
              <article className="rounded-lg border border-line bg-card p-3 text-small transition-colors hover:border-edge">
                <button type="button" onClick={() => open(r)} className="flex w-full items-start gap-3 text-left focus-visible:outline-2 focus-visible:outline-accent">
                  <span className="grid h-7 min-w-7 place-items-center rounded-full bg-card-hover px-1 font-mono text-[12px] font-semibold tabular-nums text-fg" aria-label={`Rank ${r.position}`}>{r.position}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-fg">{r.region?.neighborhood ?? "Boston"}</span>
                    <span className="block text-[11px] text-fg-3">
                      {r.entry === "region" ? `Hotspot · ${r.cell_ids.length} blocks` : "Block"} · {num(sv.observed_12w)} recent · {num(sv.expected_4w)} expected · {num(sv.expected_returns_60d)} returns
                    </span>
                  </span>
                  <span className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase ${r.source === "ai" ? "bg-fg text-bg" : "border border-line text-fg-3"}`}>{r.source === "ai" ? "AI" : "Rules"}</span>
                </button>
                <p className="mt-2 line-clamp-2 text-fg-2"><PlaceText text={r.action} locations={r.locations as RegionLocation[]} onLocate={onLocate} /></p>
              </article>
            </li>
          );
        })}
        <li ref={sentinel} className="py-2 text-center text-[11px] text-fg-3">
          {error ? <button type="button" onClick={() => void more()} className="underline">{error}</button>
            : done ? `All ${rows.length} ranked places shown` : busy || total == null ? "Loading…" : ""}
        </li>
      </ol>
    </div>
  );
}

function Methodology() {
  const { state, retry } = useInsights();
  const setLayers = useMap((s) => s.setLayers);
  const setForecastWeek = useMap((s) => s.setForecastWeek);
  const research = <HistoricalFindings onReviewPlaces={() => setLayers({ priority: true })} />;
  return (
    <details className="rounded-lg border border-edge">
      <summary className="min-h-10 cursor-pointer p-3 text-small font-semibold text-fg">Methodology & city-wide evidence</summary>
      <InsightsView state={state} onRetry={retry} research={research} onShowForecast={(w) => { setForecastWeek(w); setLayers({ forecast: true }); }} />
    </details>
  );
}
