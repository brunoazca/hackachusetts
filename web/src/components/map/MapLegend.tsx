"use client";
import { HEAT_RAMPS, type ViewMode } from "./LayerPanel";

// Always-on, plain-words key for what the map is showing right now. It changes with the zoom:
// city scale = hot spots, street scale = one marker per report (solid = open, white = closed).

function Ramp({ colors }: { colors: string[] }) {
  return <span aria-hidden className="h-2 w-16 rounded-full" style={{ background: `linear-gradient(to right, ${colors.join(", ")})` }} />;
}

export default function MapLegend({ mode, causes, zoom }: { mode: ViewMode; causes: boolean; zoom: number }) {
  const street = zoom >= 14 || mode === "points";
  return (
    <div
      role="note"
      aria-label="Map key"
      className="glass absolute left-3 z-10 rounded-lg px-3 py-2 text-[12px] leading-4 text-fg-2 transition-[bottom] duration-300 ease-[var(--ease-spring)]"
      style={{ bottom: "calc(var(--ctrl-bottom, 4px) + 8px)" }}
    >
      {!street ? (
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2"><Ramp colors={HEAT_RAMPS.rats} /><span><b className="font-semibold text-fg">Rat reports</b> · few → many</span></span>
          {causes && <span className="flex items-center gap-2"><Ramp colors={HEAT_RAMPS.evidence} /><span><b className="font-semibold text-fg">Likely causes</b> · trash, vacant lots, works</span></span>}
          <span className="text-fg-3">Zoom in to see each report.</span>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5"><span aria-hidden className="h-3.5 w-3.5 rounded-full border-2 border-white bg-[#d6324a] shadow-sm" />Open report</span>
          <span className="flex items-center gap-1.5"><span aria-hidden className="h-3.5 w-3.5 rounded-full border-2 border-[#d6324a] bg-white shadow-sm" />Closed</span>
          <span className="flex items-center gap-1.5"><span aria-hidden className="grid h-4 min-w-4 place-items-center rounded-full bg-[#d6324a] px-1 text-[9px] font-bold text-white">12</span>Group</span>
        </div>
      )}
    </div>
  );
}
