"use client";
import { useEffect, useMemo, useState } from "react";
import { useMap, type SiteRow } from "@/lib/map-store";
import { fetchSiteQueue } from "@/lib/queries";

// Act mode: Due sites first, then by returns (R4.0). Draft: sites are repeat-report addresses
// from the `site_queue` RPC until the analytics `sites` table (50 m clusters) lands.

export default function SiteQueue() {
  const setSites = useMap((s) => s.setSites);
  const select = useMap((s) => s.select);
  const flyTo = useMap((s) => s.flyTo);
  const selection = useMap((s) => s.selection);
  const [rows, setRows] = useState<SiteRow[] | null>(null);
  const [hood, setHood] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="glass absolute bottom-3 left-3 top-[68px] z-20 flex w-96 flex-col overflow-hidden rounded-lg text-sm">
      <div className="border-b border-line p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[18px] font-semibold leading-[26px]">Site queue</h2>
          <span className="font-mono text-xs text-fg-3">{due} due · {shown.length} shown</span>
        </div>
        <p className="mt-0.5 text-xs text-fg-2">
          Due = closed in the last 60 days at a site that has come back before. Then most returns.
        </p>
        <label className="mt-2 flex items-center gap-2 text-xs text-fg-2">
          Neighborhood
          <select
            value={hood}
            onChange={(e) => setHood(e.target.value)}
            className="h-8 min-w-0 flex-1 rounded-sm border border-edge bg-card px-2 text-[13px] text-fg"
          >
            <option value="">All</option>
            {hoods.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </label>
      </div>

      {error && <p role="alert" className="p-3 text-return">Could not load the queue: {error}</p>}
      {!rows && !error && <p className="p-3 text-fg-2">Loading sites…</p>}

      <ol className="min-h-0 flex-1 overflow-y-auto" aria-label="Sites, most urgent first">
        {shown.map((r, i) => {
          const active = selection?.kind === "site" && selection.id === r.id;
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => open(r)}
                aria-current={active ? "true" : undefined}
                className={`grid w-full grid-cols-[1.5rem_1fr_auto] items-start gap-2 border-b border-line px-4 py-2.5 text-left transition-colors duration-150 hover:bg-card-hover ${active ? "bg-card-hover" : ""}`}
              >
                <span className="pt-0.5 font-mono text-[13px] text-fg-3">{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-fg">{r.address_block ?? "Unnamed block"}</span>
                  <span className="block truncate text-xs text-fg-2">
                    {r.neighborhood ?? r.city} · last closed {r.days_since_close ?? "—"} d ago
                  </span>
                  <span className="mt-1 flex gap-3 font-mono text-xs text-fg-3">
                    <span><b className="font-medium text-fg">{r.reports}</b> reports</span>
                    <span><b className="font-medium text-return">{r.returns}</b> returns</span>
                    <span><b className="font-medium text-fg">{r.closures}</b> closures</span>
                  </span>
                </span>
                {r.due && <span className="rounded-full border border-return px-2 py-0.5 text-xs font-medium text-return">Due</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
