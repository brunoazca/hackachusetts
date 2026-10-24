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
    <div className={embedded ? "text-sm" : "absolute right-3 top-3 w-64 rounded-lg bg-white/95 p-3 text-sm shadow-lg ring-1 ring-black/5"}>
      <label className="flex cursor-pointer items-center justify-between gap-2">
        <span className="font-semibold text-neutral-900">Rodent report forecast</span>
        <input type="checkbox" role="switch" aria-label="Show rodent report forecast" checked={on} onChange={(e) => setLayers({ forecast: e.target.checked })} className="piper-switch" />
      </label>
      {on && run && (
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap gap-1" role="group" aria-label="Forecast period">
            {options.map(([v, label]) => (
              <button
                key={v}
                onClick={() => setPeriod(v)}
                aria-pressed={period === v}
                className={`rounded px-2 py-1 text-xs font-medium ${period === v ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div>
            <div className="text-xs text-neutral-700">
              Expected rodent reports {period === "4w" ? "over the next 4 weeks" : `in the week of ${fmtWeek(period)}`} (only 1 or more shown)
            </div>
            <div className="mt-1 h-2.5 rounded-full" style={{ background: grad }} aria-hidden />
            <div className="mt-0.5 flex justify-between font-mono text-[11px] text-neutral-700">
              {SURFACE_STOPS.map(([v], i) => <span key={v}>{i === SURFACE_STOPS.length - 1 ? `${v}+` : v}</span>)}
            </div>
          </div>
          <p className="text-[11px] leading-snug text-neutral-700">
            Smoothed from 250 m blocks, clipped to land. Click an area for the block&apos;s detail. Tested on {fmtWeek(run.metrics.backtest_from)}–{fmtWeek(run.metrics.backtest_to)}:
            its top 10% of blocks caught {Math.round(run.metrics.top10pct_capture * 100)}% of reports (4-week average: {Math.round(run.metrics.baseline_top10pct_capture * 100)}%). Model estimate, not a count of rats.
          </p>
        </div>
      )}
    </div>
  );
}
