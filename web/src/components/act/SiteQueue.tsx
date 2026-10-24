"use client";
import { useEffect, useMemo, useState } from "react";
import { useMap, type SiteRow } from "@/lib/map-store";
import { fetchSiteQueue } from "@/lib/queries";
import { CollapseButton, CollapsedTab } from "@/components/shell/Collapse";

// Act mode: review suggestions first, then by reports after closure (R4.0). Draft: repeat-report addresses
// from the `site_queue` RPC until the analytics `sites` table (50 m clusters) lands.

export default function SiteQueue() {
  const setSites = useMap((s) => s.setSites);
  const select = useMap((s) => s.select);
  const flyTo = useMap((s) => s.flyTo);
  const selection = useMap((s) => s.selection);
  const [rows, setRows] = useState<SiteRow[] | null>(null);
  const hood = useMap((s) => s.siteNeighborhood);
  const setHood = useMap((s) => s.setSiteNeighborhood);
  const [error, setError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    fetchSiteQueue(300)
      .then((r) => { setRows(r); setSites(r); })
      .catch((e) => setError(String(e)));
  }, [setSites]);

  const hoods = useMemo(
    () => [...new Set((rows ?? []).map((r) => r.neighborhood).filter(Boolean) as string[])].sort(),
    [rows],
  );
  const shown = useMemo(() => (rows ?? []).filter((r) => !hood || r.neighborhood === hood).slice(0, 60), [rows, hood]);
  const due = (rows ?? []).filter((r) => r.due && (!hood || r.neighborhood === hood)).length;

  useEffect(() => { if (rows) setSites(shown); }, [shown, rows, setSites]);

  const open = (r: SiteRow) => {
    select({ kind: "site", id: r.id });
    flyTo({ lat: r.lat, lon: r.lon, zoom: 16.5 });
  };

  if (!panelOpen) return <CollapsedTab side="left" label="Places to visit" meta={`${due} flagged`} onOpen={() => setPanelOpen(true)} />;
  return (
    <div className="glass absolute bottom-3 left-3 top-[68px] z-20 flex w-96 flex-col overflow-hidden rounded-lg text-sm">
      <div className="border-b border-neutral-200 p-3">
        <div className="flex items-baseline justify-between">
          <h2 className="flex items-center gap-1 text-base font-semibold"><CollapseButton onClick={() => setPanelOpen(false)} label="Hide places to visit" dir="left" />Places to visit</h2>
          <span className="text-xs text-fg-3">{shown.length} shown</span>
        </div>
        <p className="mt-0.5 text-xs text-neutral-700">
          Select a place to review its reports and recorded responses.
        </p>
        <p className="mt-1 text-xs text-fg-3">
          Review suggested: closed in the last 60 days, with an earlier report after closure. Flagged places first, then most return days. Counts are distinct dates; multiple records on one date count once.
        </p>
        <label className="mt-2 flex items-center gap-2 text-xs text-neutral-800">
          Neighborhood
          <select
            aria-label="Neighborhood"
            value={hood}
            onChange={(e) => setHood(e.target.value)}
            className="min-w-0 flex-1 rounded border border-neutral-300 bg-white px-1.5 py-1 text-xs"
          >
            <option value="">All</option>
            {hood && !hoods.includes(hood) && <option value={hood}>{hood}</option>}
            {hoods.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </label>
      </div>

      {error && <p role="alert" className="p-3 text-red-800">Could not load the queue: {error}</p>}
      {!rows && !error && <p className="p-3 text-neutral-700">Loading sites…</p>}

      <ol className="min-h-0 flex-1 overflow-y-auto" aria-label="Places, review suggestions first">
        {shown.map((r, i) => {
          const active = selection?.kind === "site" && selection.id === r.id;
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => open(r)}
                aria-current={active ? "true" : undefined}
                className={`grid w-full grid-cols-[1.5rem_minmax(0,1fr)] items-start gap-2 border-b border-neutral-100 px-3 py-2 text-left hover:bg-neutral-50 ${active ? "bg-amber-50" : ""}`}
              >
                <span className="pt-0.5 text-xs font-semibold text-neutral-600">{i + 1}</span>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-neutral-900">{r.address_block ?? "Unnamed block"}</span>
                  <span className="block truncate text-xs text-neutral-700">
                    {r.neighborhood ?? r.city} · last closed {r.days_since_close ?? "—"} d ago
                  </span>
                  <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-800">
                    <span><b>{r.reports}</b> report days</span>
                    <span title="Report dates more than 1 day and no more than 60 days after an earlier closure"><b>{r.returns}</b> return days</span>
                    <span><b>{r.closures}</b> closure days</span>
                  </span>
                  {r.due && <span className="mt-1 inline-block rounded bg-return/15 px-1.5 py-0.5 text-xs font-semibold text-return">Review suggested</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
