"use client";
import { useEffect, useMemo, useState } from "react";
import { useMap, type SiteRow } from "@/lib/map-store";
import { fetchSiteQueue } from "@/lib/queries";
import { CollapseButton, CollapsedTab } from "@/components/shell/Collapse";
import { InfoHint } from "@/components/ui/bits";

// Act mode: recheck-now places first, then by comebacks (reports after a closure) (R4.0). Draft: repeat-report
// addresses from the `site_queue` RPC until the analytics `sites` table (50 m clusters) lands.

const closedText = (d: number | null) => d === null ? "never closed" : d === 0 ? "closed today" : d === 1 ? "closed yesterday" : `closed ${d} days ago`;

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

  if (!panelOpen) return <CollapsedTab side="left" label="Recheck list" meta={`${due} to recheck`} onOpen={() => setPanelOpen(true)} />;
  return (
    <div className="map-secondary-panel glass absolute bottom-3 left-3 top-(--shell-top) z-20 flex w-96 max-w-[calc(100%-88px)] flex-col overflow-hidden rounded-lg text-sm">
      <div className="border-b border-line p-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-1 text-base font-semibold text-fg"><CollapseButton onClick={() => setPanelOpen(false)} label="Hide recheck list" dir="left" />Recheck list</h2>
          <InfoHint label="How this list works">
            <p><b className="text-fg">Recheck now</b>: the city closed a case here in the last 60 days, and reports have come back after an earlier closure.</p>
            <p className="mt-1.5"><b className="text-fg">Comeback</b>: a day with a new report 2 to 60 days after a closure.</p>
            <p className="mt-1.5">Recheck-now places come first, then the most comebacks. We count days, not records: several reports on one day count once.</p>
          </InfoHint>
        </div>
        <p className="mt-0.5 text-xs text-fg-2">Addresses where rodent reports came back after the city closed the case.</p>

        <div className="mt-2.5 flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-return">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-return" />{due} to recheck
          </span>
          <span className="text-xs text-fg-3">{shown.length} shown</span>
          <select
            aria-label="Neighborhood"
            value={hood}
            onChange={(e) => setHood(e.target.value)}
            className="ml-auto min-w-0 max-w-[45%] rounded-full border border-line bg-card px-2.5 py-1 text-xs text-fg hover:border-edge"
          >
            <option value="">All neighborhoods</option>
            {hood && !hoods.includes(hood) && <option value={hood}>{hood}</option>}
            {hoods.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>

      {error && <p role="alert" className="p-3 text-return">Could not load the list: {error}</p>}
      {!rows && !error && (
        <div role="status" aria-busy="true" className="space-y-2 p-3">
          <span className="sr-only">Loading places…</span>
          {[0, 1, 2, 3].map((i) => <div key={i} aria-hidden className="h-16 animate-pulse rounded-lg bg-card-hover" />)}
        </div>
      )}
      {rows && !shown.length && <p className="p-3 text-fg-3">No places in this neighborhood.</p>}

      <ol className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2" aria-label="Places, recheck-now first">
        {shown.map((r, i) => {
          const active = selection?.kind === "site" && selection.id === r.id;
          const backShare = r.reports ? Math.min(1, r.returns / r.reports) : 0;
          return (
            <li key={r.id}>
              <button
                type="button"
                data-site-trigger
                aria-controls="details-panel"
                onClick={() => open(r)}
                aria-current={active ? "true" : undefined}
                className={`grid w-full grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-2 rounded-lg border px-2 py-2 text-left transition-colors ${active ? "border-edge bg-card-hover" : "border-transparent hover:bg-card-hover"}`}
              >
                <span className={`mt-0.5 grid h-6 w-6 place-items-center rounded-md font-mono text-[11px] font-bold ${r.due ? "bg-return text-accent-fg" : "bg-card-hover text-fg-2"}`}>{i + 1}</span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-semibold text-fg">{r.address_block ?? "Unnamed block"}</span>
                    {r.due && <span className="ml-auto flex-none rounded-sm bg-return px-1.5 py-px text-[10px] font-semibold text-accent-fg">Recheck now</span>}
                  </span>
                  <span className="block truncate text-xs text-fg-3">{r.neighborhood ?? r.city} · {closedText(r.days_since_close)}</span>
                  <span className="mt-1 flex items-center gap-3 text-xs text-fg-2">
                    <span title="Days with a new report 2 to 60 days after a closure"><b className={r.returns ? "text-return" : "text-fg"}>{r.returns}</b> comebacks</span>
                    <span><b className="text-fg">{r.reports}</b> days reported</span>
                    <span><b className="text-fg">{r.closures}</b> closed</span>
                  </span>
                  <span aria-hidden className="mt-1.5 block h-1 overflow-hidden rounded-full bg-card-hover">
                    <span className="block h-full rounded-full bg-return" style={{ width: `${backShare * 100}%` }} />
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
