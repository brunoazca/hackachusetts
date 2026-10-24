"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMap } from "@/lib/map-store";
import { loadRanking, type RankingEntry } from "@/lib/insight";
import PlaceText from "@/components/insights/regions/PlaceText";
import type { RegionLocation } from "@/components/insights/regions/parse";

// Severity tiers on the score (reports in the last 12 weeks + expected in the next 4 + expected
// returns). Hotspots run ~15-120, lone blocks mostly under 5.
const TIERS = [
  { min: 75, label: "Critical", bar: "bg-return", chip: "bg-return/15 text-return" },
  { min: 30, label: "High severity", bar: "bg-danger", chip: "bg-danger/15 text-danger" },
  { min: 8, label: "Moderate", bar: "bg-warn", chip: "bg-warn/15 text-warn" },
  { min: -Infinity, label: "Low", bar: "bg-fg-3", chip: "bg-card-hover text-fg-3" },
] as const;
const tierOf = (sv: { score?: number; observed_12w?: number; expected_4w?: number; expected_returns_60d?: number }) => {
  const score = sv.score ?? (sv.observed_12w ?? 0) + (sv.expected_4w ?? 0) + (sv.expected_returns_60d ?? 0);
  return TIERS.find((t) => score >= t.min)!;
};

// Nothing selected: every hotspot and block ranked by severity, worst first, loaded page by page
// as the list scrolls. Tapping an entry opens its insight; place names fly the map there.

const PAGE = 20;

export default function RankingList({ onLocate }: { onLocate: (loc: RegionLocation) => void }) {
  const select = useMap((s) => s.select);
  const flyTo = useMap((s) => s.flyTo);
  const setRegionCells = useMap((s) => s.setRegionCells);
  // Prediction mode: the same places, ordered by expected reports in the next 4 weeks instead of severity.
  const predict = useMap((s) => s.layers.forecast);
  const byForecast = useRef<RankingEntry[] | null>(null);
  const [rows, setRows] = useState<RankingEntry[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinel = useRef<HTMLLIElement>(null);
  // Switching Current / Prediction starts the list over in the other order.
  const [order, setOrder] = useState(predict);
  if (order !== predict) { setOrder(predict); setRows([]); setTotal(null); }
  const done = total != null && rows.length >= total;

  const more = useCallback(async () => {
    if (busy || done) return;
    setBusy(true); setError(null);
    try {
      if (predict) {
        byForecast.current ??= (await loadRanking(0, 5000)).rows
          .sort((a, b) => (b.region?.severity?.expected_4w ?? 0) - (a.region?.severity?.expected_4w ?? 0));
        const all = byForecast.current;
        setRows(all.slice(0, rows.length + PAGE));
        setTotal(all.length);
        return;
      }
      const page = await loadRanking(rows.length, PAGE);
      setRows((r) => [...r, ...page.rows.filter((x) => !r.some((y) => y.id === x.id))]);
      setTotal(page.rows.length ? page.total : rows.length);
    } catch {
      setError("Could not load more. Scroll to retry.");
    } finally { setBusy(false); }
  }, [busy, done, rows.length, predict]);


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
    // Light the whole region at once; the loaded insight confirms (or corrects) the cells.
    setRegionCells(r.cell_ids?.length ? r.cell_ids : [r.id]);
    select({ kind: "cell", id: r.id });
  };

  return (
    <div className="space-y-3 p-3">
      <header className="px-1">
        <h2 className="text-[15px] font-semibold text-fg">{predict ? "Where it gets worse next" : "Where to act first"}</h2>
        <p className="text-small text-fg-3">{predict ? "Most reports expected in the next 4 weeks first." : "Worst first."} Tap one to see it on the map.</p>
      </header>
      <ol className="space-y-2" aria-live="polite">
        {rows.map((r, i) => {
          const tier = tierOf(r.region?.severity ?? {});
          const next = r.region?.severity?.expected_4w ?? 0;
          return (
            <li key={r.id}>
              <article className={`relative overflow-hidden rounded-lg border p-3 pl-4 text-small transition-colors ${predict ? "border-warn/40 bg-warn/10 hover:border-warn" : "border-line bg-card hover:border-edge"}`}>
                <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${predict ? "bg-warn" : tier.bar}`} />
                <button type="button" onClick={() => open(r)} className="flex w-full items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-accent">
                  <span className="font-mono text-[12px] font-semibold tabular-nums text-fg-3" aria-label={`Rank ${predict ? i + 1 : r.position}`}>{predict ? i + 1 : r.position}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-fg">{r.region?.neighborhood ?? "Boston"}</span>
                    <span className="block text-[11px] text-fg-3">{r.entry === "region" ? "Hotspot" : "Single block"}</span>
                  </span>
                  {predict
                    ? <span className="shrink-0 rounded-full bg-warn/20 px-2 py-0.5 text-[11px] font-semibold text-warn">~{next.toFixed(1)} next 4 wk</span>
                    : <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tier.chip}`}>{tier.label}</span>}
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
