"use client";
import { useEffect, useState } from "react";
import { useMap } from "@/lib/map-store";
import { fetchForecastRun, fmtWeek, SURFACE_STOPS, type ForecastRun } from "@/lib/forecast";

// Forecast toggle + period picker + legend, top-right of the map. Owner: model track.
// forecastWeek in the store holds the period: "4w" (total of the next 4 weeks) or a week_start.

export default function ForecastControl({ embedded = false }: { embedded?: boolean }) {
  const on = useMap((s) => s.layers.forecast);
  const setLayers = useMap((s) => s.setLayers);
  const period = useMap((s) => s.forecastWeek) ?? "4w";
  const setPeriod = useMap((s) => s.setForecastWeek);
  const [run, setRun] = useState<ForecastRun | null>(null);

  useEffect(() => { fetchForecastRun().then(setRun).catch(() => {}); }, []);

  const grad = `linear-gradient(90deg, ${SURFACE_STOPS.map(([, c]) => c).join(", ")})`;
  const options: [string, string][] = run ? [["4w", "Next 4 weeks"], ...run.weeks.map((w): [string, string] => [w, fmtWeek(w)])] : [];
  return (
    <div className={embedded ? "text-sm" : "glass absolute right-3 top-3 w-64 rounded-lg p-3 text-sm"}>
      <label className="flex cursor-pointer items-center justify-between gap-2">
        <span className="font-semibold text-fg"><span className="font-bold uppercase tracking-wide text-forecast">Next</span> · where reports are likely</span>
        <input type="checkbox" role="switch" aria-label="Show where reports are likely" checked={on} onChange={(e) => setLayers({ forecast: e.target.checked })} className="piper-switch" />
      </label>
      {on && run && (
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap gap-1" role="group" aria-label="Next: forecast period">
            {options.map(([v, label]) => (
              <button
                key={v}
                onClick={() => setPeriod(v)}
                aria-pressed={period === v}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${period === v ? "border-accent bg-accent text-accent-fg" : "border-line text-fg-2 hover:bg-card-hover hover:text-fg"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div>
            <div className="text-xs text-fg-2">
              Reports we expect {period === "4w" ? "in the next 4 weeks" : `the week of ${fmtWeek(period)}`}
            </div>
            <div className="mt-1 h-2.5 rounded-full" style={{ background: grad }} aria-hidden />
            <div className="mt-0.5 flex justify-between font-mono text-[11px] text-fg-3">
              {SURFACE_STOPS.map(([v], i) => <span key={v}>{i === SURFACE_STOPS.length - 1 ? `${v}+` : v}</span>)}
            </div>
          </div>
          <p className="flex items-center gap-2 rounded-lg bg-card px-2 py-1.5 text-[11px] leading-snug text-fg-2">
            <span className="font-mono text-small font-bold text-held">{Math.round(run.metrics.top10pct_capture * 100)}%</span>
            <span>of reports landed in our top 10% of blocks. A simple guess got {Math.round(run.metrics.baseline_top10pct_capture * 100)}%.</span>
          </p>
          <p className="text-[10px] text-fg-3">Tap an area to see its block. Counts reports, not rats.</p>
        </div>
      )}
    </div>
  );
}
