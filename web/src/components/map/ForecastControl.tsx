"use client";
import { useEffect, useState } from "react";
import { useMap } from "@/lib/map-store";
import { fetchForecastRun, fmtWeek, FORECAST_STOPS, type ForecastRun } from "@/lib/forecast";

// Draft forecast toggle + week picker + legend, top-right of the map. Owner: model track.

export default function ForecastControl() {
  const on = useMap((s) => s.layers.forecast);
  const setLayers = useMap((s) => s.setLayers);
  const week = useMap((s) => s.forecastWeek);
  const setWeek = useMap((s) => s.setForecastWeek);
  const [run, setRun] = useState<ForecastRun | null>(null);

  useEffect(() => { fetchForecastRun().then(setRun).catch(() => {}); }, []);
  useEffect(() => { if (run?.weeks.length && !week) setWeek(run.weeks[0]); }, [run, week, setWeek]);

  const grad = `linear-gradient(90deg, ${FORECAST_STOPS.map(([, c]) => c).join(", ")})`;
  return (
    <div className="absolute right-3 top-3 w-64 rounded-lg bg-white/95 p-3 text-sm shadow-lg ring-1 ring-black/5">
      <label className="flex cursor-pointer items-center justify-between gap-2">
        <span className="font-semibold text-neutral-900">Forecast: next 4 weeks</span>
        <input type="checkbox" checked={on} onChange={(e) => setLayers({ forecast: e.target.checked })} className="h-4 w-4" />
      </label>
      {on && run && (
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap gap-1" role="group" aria-label="Forecast week">
            {run.weeks.map((w) => (
              <button
                key={w}
                onClick={() => setWeek(w)}
                aria-pressed={week === w}
                className={`rounded px-2 py-1 text-xs font-medium ${week === w ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200"}`}
              >
                {fmtWeek(w)}
              </button>
            ))}
          </div>
          <div>
            <div className="text-xs text-neutral-700">Expected rodent reports per block per week</div>
            <div className="mt-1 h-2.5 rounded-full" style={{ background: grad }} aria-hidden />
            <div className="mt-0.5 flex justify-between font-mono text-[11px] text-neutral-700">
              {FORECAST_STOPS.map(([v]) => <span key={v}>{v >= 10 ? "10+" : v}</span>)}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-800">
            <span aria-hidden className="inline-block h-3 w-3 border-2 border-dashed border-[#1f5fbf]" />
            Emerging: high forecast, few reports so far
          </div>
          <p className="text-[11px] leading-snug text-neutral-700">
            250 m blocks. Click one to see why. Tested on {fmtWeek(run.metrics.backtest_from)}–{fmtWeek(run.metrics.backtest_to)}: its top 10% of blocks caught{" "}
            {Math.round(run.metrics.top10pct_capture * 100)}% of reports (4-week average: {Math.round(run.metrics.baseline_top10pct_capture * 100)}%).
            Model estimate, not a count of rats.
          </p>
        </div>
      )}
    </div>
  );
}
