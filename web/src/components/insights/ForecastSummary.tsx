import { fmtDate, fmtDateTime, fmtNumber, fmtPct } from "./format";
import type { ForecastView, RiskBand, ScorePair } from "./types";
import { compare, type Verdict } from "@/lib/forecast-comparison";
export { compare } from "@/lib/forecast-comparison";

export default function ForecastSummary({ forecast: f, onShowForecast }: {
  forecast: ForecastView; onShowForecast?: (week: string) => void;
}) {
  const ranking = compare(f.top10, false);
  const counts = compare(f.mae, true);
  const next = f.weeks[0];
  const headline = f.isBaseline ? "A forecast from the last four weeks."
    : ranking === "better" && counts === "worse" ? "Better at locating reports. Less accurate on counts."
    : ranking === "better" ? "More reports found in the highest-ranked areas."
    : ranking === "worse" ? "The simple benchmark ranked areas better."
    : ranking === "same" ? "No ranking gain over the simple benchmark."
    : "This forecast still needs a benchmark.";
  const ranked = !f.isBaseline && f.top10.model !== null && f.top10.baseline !== null;
  return (
    <section aria-labelledby="forecast-summary-h" className="space-y-3 rounded-lg border border-line bg-card p-4" data-forecast-summary>
      <p className="eyebrow">Where to look next · Model estimate</p>
      <h3 id="forecast-summary-h" className="text-title font-semibold text-fg">{headline}</h3>
      {ranked ? (
        <div className="space-y-2 text-small text-fg-2">
          <p>In the backtest, the highest-ranked 10% of cells contained:</p>
          {([ ["Model", f.top10.model!, "bg-forecast"], ["Simple benchmark", f.top10.baseline!, "bg-fg-3"] ] as const).map(([label, value, color]) => (
            <div key={label}>
              <div className="flex justify-between gap-2"><span>{label}</span><span className="font-mono text-fg">{fmtPct(value)} of reports</span></div>
              <div aria-hidden className="mt-1 h-2 overflow-hidden rounded-sm bg-card-hover"><div className={`h-full ${color}`} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} /></div>
            </div>
          ))}
          <p>The benchmark uses the average of the previous four weeks. This measures past performance, not a guarantee for the next month.</p>
        </div>
      ) : <p className="text-small text-fg-2">{f.isBaseline
        ? "This uses the average of the previous four weeks. A trained model has not been validated for this run."
        : "A complete comparison with the simple benchmark is missing, so its ranking advantage is unknown."}</p>}

      {!f.isBaseline && f.mae.model !== null && f.mae.baseline !== null && (
        <p className="border-l-2 border-warn pl-3 text-small text-fg-2" role="note">
          Average error: <span className="font-mono text-fg">{fmtNumber(f.mae.model, 3)}</span> for the model vs <span className="font-mono text-fg">{fmtNumber(f.mae.baseline, 3)}</span> for the benchmark per cell-week.
          {counts === "worse" ? " The benchmark was more accurate on counts." : counts === "better" ? " The model was more accurate on counts." : " The two had the same count error."}
        </p>
      )}
      <p className="text-small text-fg-2">Use the ranking to review places and their report history. It does not establish which response will work. Fewer reports can also reflect less reporting.</p>

      {next && <div className="space-y-2 border-t border-line pt-3">
        <p className="text-small text-fg-2"><span className="font-mono text-data-lg text-fg">{fmtNumber(next.expected_total)}</span> expected reports in the covered area, week of {fmtDate(next.week_start)}.</p>
        <p className="text-small text-fg-3">Across {fmtNumber(next.cells)} cells of 250 m. Reports, not a count of rats.</p>
        {onShowForecast && <button type="button" onClick={() => onShowForecast(next.week_start)} className="min-h-10 rounded-md border border-edge px-3 text-ui text-fg hover:bg-card-hover">Show this forecast on the map</button>}
      </div>}
      <p className="text-small text-fg-3">Stored model result · <time dateTime={f.createdAt}>{fmtDateTime(f.createdAt)}</time></p>
      <details className="border-t border-line pt-3 text-small text-fg-2" data-model-details>
        <summary className="cursor-pointer font-medium text-fg">Forecast details and model checks</summary>
        <div className="mt-3"><ForecastDetails forecast={f} /></div>
      </details>
    </section>
  );
}

const BAND_LABEL: Record<RiskBand, string> = {
  low: "Low", elevated: "Elevated", high: "High", very_high: "Very high",
};

const VERDICT_TEXT: Record<Exclude<Verdict, null>, string> = {
  better: "Better than baseline",
  worse: "Worse than baseline",
  same: "Same as baseline",
};

function ScoreRow({ name, hint, pair, lowerIsBetter, fmt, isBaseline }: {
  name: string; hint: string; pair: ScorePair; lowerIsBetter: boolean; fmt: (v: number) => string; isBaseline: boolean;
}) {
  const v = isBaseline ? null : compare(pair, lowerIsBetter);
  return (
    <tr className="border-t border-line" data-score={name}>
      <th scope="row" className="py-1 pr-2 text-left font-normal text-fg-2">
        {name}<span className="block text-[10px] text-fg-3">{hint}</span>
      </th>
      <td className="py-1 pr-2 tabular-nums">{isBaseline ? "—" : pair.model === null ? "n/a" : fmt(pair.model)}</td>
      <td className="py-1 pr-2 tabular-nums">{pair.baseline === null ? "n/a" : fmt(pair.baseline)}</td>
      <td className="py-1 text-fg-2" data-verdict={v ?? "none"}>
        {isBaseline ? "Baseline only" : v ? VERDICT_TEXT[v] : "No comparison available"}
      </td>
    </tr>
  );
}

export function ForecastUnavailable() {
  return (
    <section aria-labelledby="forecast-h" className="rounded-lg border border-dashed border-edge p-3" data-state="unavailable">
      <h3 id="forecast-h" className="text-sm font-semibold text-fg">Forecast: expected reports</h3>
      <p className="mt-1 text-xs text-fg-2">
        No forecast run has been written yet. Neither the baseline nor the trained model is available, so
        there is nothing to compare.
      </p>
    </section>
  );
}

function ForecastDetails({ forecast: f }: { forecast: ForecastView }) {
  const upcoming = f.weeks;
  const label = f.isBaseline
    ? "Baseline: mean of the last 4 weeks"
    : `Backtested model (${f.model})`;
  const baselineMissing = !f.isBaseline && f.mae.baseline === null && f.top10.baseline === null;

  return (
    <section aria-labelledby="forecast-h" className="rounded-lg border border-line p-3" data-model-kind={f.isBaseline ? "baseline" : "model"}>
      <h3 id="forecast-h" className="text-sm font-semibold text-fg">Forecast: expected reports</h3>
      <p className="mt-1 text-xs text-fg-2">
        Expected 311 rodent <em>reports</em> per 250 m cell, not a count of rats.
      </p>
      <p className="mt-1 text-xs">
        <span className="rounded bg-card-hover px-1.5 py-0.5 font-medium text-fg">{label}</span>
      </p>

      <table className="mt-2 w-full text-xs">
        <caption className="text-left text-fg-2">
          Backtest{f.backtestWeeks !== null ? ` over the last ${fmtNumber(f.backtestWeeks)} weeks` : " (window not reported)"}
        </caption>
        <thead>
          <tr className="text-left text-fg-3">
            <th scope="col" className="pr-2 font-medium">Score</th>
            <th scope="col" className="pr-2 font-medium">Model</th>
            <th scope="col" className="pr-2 font-medium">Baseline</th>
            <th scope="col" className="pr-2 font-medium">Comparison</th>
          </tr>
        </thead>
        <tbody>
          <ScoreRow name="MAE" hint="mean absolute error, lower is better" pair={f.mae} lowerIsBetter fmt={(v) => fmtNumber(v, 3)} isBaseline={f.isBaseline} />
          <ScoreRow name="Top-10% capture" hint="share of reports in the top 10% of cells, higher is better" pair={f.top10} lowerIsBetter={false} fmt={fmtPct} isBaseline={f.isBaseline} />
        </tbody>
      </table>
      {baselineMissing && (
        <p className="mt-1 text-xs text-fg-2" role="note">
          The baseline was not scored for this run, so we cannot say whether the model beats it.
        </p>
      )}
      {f.isBaseline && (
        <p className="mt-1 text-xs text-fg-2" role="note">
          The trained model is not available yet; the map forecast uses this baseline.
        </p>
      )}

      {upcoming.length > 0 ? (
        <table className="mt-3 w-full text-xs">
          <caption className="text-left text-fg-2">Next weeks, citywide</caption>
          <thead>
            <tr className="text-left text-fg-3">
              <th scope="col" className="pr-2 font-medium">Week of</th>
              <th scope="col" className="pr-2 font-medium">Expected reports</th>
              <th scope="col" className="pr-2 font-medium">High / very high cells</th>
            </tr>
          </thead>
          <tbody>
            {upcoming.map((w) => (
              <tr key={w.week_start} className="border-t border-line">
                <td className="py-1">{fmtDate(w.week_start)}</td>
                <td className="py-1 tabular-nums">{fmtNumber(w.expected_total, 1)}</td>
                <td className="py-1 tabular-nums">
                  {fmtNumber((w.bands.high ?? 0) + (w.bands.very_high ?? 0))} of {fmtNumber(w.cells)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-3 text-xs text-fg-2" role="note">No future weeks have been scored for this run.</p>
      )}

      {f.topCells.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-semibold text-fg">Highest expected reports, {fmtDate(f.topCells[0].weekStart)}</h4>
          <ol className="mt-1 space-y-1 text-xs">
            {f.topCells.map((c) => (
              <li key={`${c.cellId}-${c.weekStart}`} data-cell={c.cellId}>
                <span className="font-medium">{c.neighborhood ?? c.cellId}</span>{" "}
                <span className="tabular-nums">{fmtNumber(c.expected, 1)} expected reports</span>
                {c.band && <> · {BAND_LABEL[c.band]}</>}
                {c.drivers.length > 0 && (
                  <span className="block text-fg-2">Drivers: {c.drivers.join(", ")}</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {f.features.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-semibold text-fg">What the model leans on</h4>
          <ol className="mt-1 list-decimal pl-4 text-xs text-fg-2">
            {f.features.map((x) => <li key={x.label}>{x.label}</li>)}
          </ol>
        </div>
      )}

      <p className="mt-2 text-[11px] text-fg-3">
        Run <code>{f.runId}</code>
        {f.trainedThrough && <> · trained through {fmtDate(f.trainedThrough)}</>}
        {" "}· computed <time dateTime={f.createdAt}>{fmtDateTime(f.createdAt)}</time>
      </p>
    </section>
  );
}
