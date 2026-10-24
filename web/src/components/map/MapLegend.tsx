"use client";
import { HEAT_RAMPS, type ViewMode } from "./LayerPanel";

// Always-on, plain-words key for what the map is showing right now. It changes with the zoom:
// city scale = hot spots, street scale = one marker per report (solid = open, hollow ring = closed).

function Ramp({ colors }: { colors: string[] }) {
  return <span aria-hidden className="h-2 w-16 rounded-full" style={{ background: `linear-gradient(to right, ${colors.join(", ")})` }} />;
}

export default function MapLegend({ mode, causes, zoom, priority = false }: { mode: ViewMode; causes: boolean; zoom: number; priority?: boolean }) {
  const street = zoom >= 14 || mode === "points";
  return (
    <div role="note" aria-label="Map key" className="glass rounded-lg px-3 py-2 text-[12px] leading-4 text-fg-2">
      {priority && (
        <div className="mb-1.5 flex items-center gap-2 border-b border-line pb-1.5">
          <span aria-hidden className="flex h-2.5 w-16 overflow-hidden rounded-[2px]">{[0.08, 0.2, 0.4, 0.7].map((o) => <span key={o} className="flex-1 bg-return" style={{ opacity: o }} />)}</span>
          <span><b className="font-semibold text-fg">Priority blocks</b> · low → high · <b className="font-semibold text-fg">1–20</b> outlined · tap for detail</span>
        </div>
      )}
      {!street ? (
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2"><Ramp colors={HEAT_RAMPS.rats} /><span><b className="font-semibold text-fg">Rodent reports</b> · few → many</span></span>
          {causes && <span className="flex items-center gap-2"><Ramp colors={HEAT_RAMPS.evidence} /><span><b className="font-semibold text-fg">Nearby problems</b> · trash, empty lots, building work</span></span>}
          <span className="text-fg-3">Zoom in to see each report.</span>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5"><span aria-hidden className="h-3 w-3 rounded-full bg-[#d7263d]" />Open report</span>
          <span className="flex items-center gap-1.5"><span aria-hidden className="h-3 w-3 rounded-full border-[1.5px] border-[#d7263d] bg-[#d7263d]/15" />Closed</span>
          <span className="flex items-center gap-1.5"><span aria-hidden className="grid h-4 min-w-4 place-items-center rounded-full border-[1.5px] border-[#d7263d] bg-[#d7263d]/20 px-1 text-[9px] font-bold text-fg">12</span>Group</span>
          <span className="flex items-center gap-1.5"><span aria-hidden className="grid h-4 w-4 place-items-center rounded-full border border-return"><span className="h-2 w-2 rounded-full border border-return" /></span>Came back</span>
          <span className="text-fg-3">Faded = older · pulsing = this week</span>
        </div>
      )}
    </div>
  );
}
