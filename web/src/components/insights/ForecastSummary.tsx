import { fmtDate, fmtDateTime, fmtNumber, fmtPct } from "./format";
import type { ForecastView, RiskBand, ScorePair } from "./types";

const BAND_LABEL: Record<RiskBand, string> = {
  low: "Low", elevated: "Elevated", high: "High", very_high: "Very high",
};

type Verdict = "better" | "worse" | "same" | null;

// lowerIsBetter: MAE; otherwise higher is better (top-10% capture).
export function compare(p: ScorePair, lowerIsBetter: boolean): Verdict {
  if (p.model === null || p.baseline === null) return null;
  const d = p.model - p.baseline;
  if (Math.abs(d) < 1e-9) return "same";
  return (lowerIsBetter ? d < 0 : d > 0) ? "better" : "worse";
}

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
    <tr className="border-t border-neutral-100" data-score={name}>
      <th scope="row" className="py-1 pr-2 text-left font-normal text-neutral-700">
        {name}<span className="block text-[10px] text-neutral-500">{hint}</span>
      </th>
      <td className="py-1 pr-2 tabular-nums">{isBaseline ? "—" : pair.model === null ? "n/a" : fmt(pair.model)}</td>
      <td className="py-1 pr-2 tabular-nums">{pair.baseline === null ? "n/a" : fmt(pair.baseline)}</td>
      <td className="py-1 text-neutral-700" data-verdict={v ?? "none"}>
        {isBaseline ? "Baseline only" : v ? VERDICT_TEXT[v] : "No comparison available"}
      </td>
    </tr>
  );
}

export function ForecastUnavailable() {
  return (
    <section aria-labelledby="forecast-h" className="rounded-lg border border-dashed border-neutral-300 p-3" data-state="unavailable">
      <h3 id="forecast-h" className="text-sm font-semibold text-neutral-900">Forecast: expected reports</h3>
      <p className="mt-1 text-xs text-neutral-600">
        No forecast run has been written yet. Neither the baseline nor the trained model is available, so
        there is nothing to compare.
      </p>
    </section>
  );
}

export default function ForecastSummary({ forecast: f }: { forecast: ForecastView }) {
  const upcoming = f.weeks;
  const label = f.isBaseline
    ? "Baseline: mean of the last 4 weeks"
    : `Backtested model (${f.model})`;
  const baselineMissing = !f.isBaseline && f.mae.baseline === null && f.top10.baseline === null;

  return (
    <section aria-labelledby="forecast-h" className="rounded-lg border border-neutral-200 p-3" data-model-kind={f.isBaseline ? "baseline" : "model"}>
      <h3 id="forecast-h" className="text-sm font-semibold text-neutral-900">Forecast: expected reports</h3>
      <p className="mt-1 text-xs text-neutral-600">
        Expected 311 rodent <em>reports</em> per 250 m cell, not a count of rats.
      </p>
      <p className="mt-1 text-xs">
        <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-medium text-neutral-800">{label}</span>
      </p>

      <table className="mt-2 w-full text-xs">
        <caption className="text-left text-neutral-600">
          Backtest{f.backtestWeeks !== null ? ` over the last ${fmtNumber(f.backtestWeeks)} weeks` : " (window not reported)"}
        </caption>
        <thead>
          <tr className="text-left text-neutral-500">
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
        <p className="mt-1 text-xs text-neutral-600" role="note">
          The baseline was not scored for this run, so we cannot say whether the model beats it.
        </p>
      )}
      {f.isBaseline && (
        <p className="mt-1 text-xs text-neutral-600" role="note">
          The trained model is not available yet; the map forecast uses this baseline.
        </p>
      )}

      {upcoming.length > 0 ? (
        <table className="mt-3 w-full text-xs">
          <caption className="text-left text-neutral-600">Next weeks, citywide</caption>
          <thead>
            <tr className="text-left text-neutral-500">
              <th scope="col" className="pr-2 font-medium">Week of</th>
              <th scope="col" className="pr-2 font-medium">Expected reports</th>
              <th scope="col" className="pr-2 font-medium">High / very high cells</th>
            </tr>
          </thead>
          <tbody>
            {upcoming.map((w) => (
              <tr key={w.week_start} className="border-t border-neutral-100">
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
        <p className="mt-3 text-xs text-neutral-600" role="note">No future weeks have been scored for this run.</p>
      )}

      {f.topCells.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-semibold text-neutral-800">Highest expected reports, {fmtDate(f.topCells[0].weekStart)}</h4>
          <ol className="mt-1 space-y-1 text-xs">
            {f.topCells.map((c) => (
              <li key={`${c.cellId}-${c.weekStart}`} data-cell={c.cellId}>
                <span className="font-medium">{c.neighborhood ?? c.cellId}</span>{" "}
                <span className="tabular-nums">{fmtNumber(c.expected, 1)} expected reports</span>
                {c.band && <> · {BAND_LABEL[c.band]}</>}
                {c.drivers.length > 0 && (
                  <span className="block text-neutral-600">Drivers: {c.drivers.join(", ")}</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {f.features.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-semibold text-neutral-800">What the model leans on</h4>
          <ol className="mt-1 list-decimal pl-4 text-xs text-neutral-700">
            {f.features.map((x) => <li key={x.label}>{x.label}</li>)}
          </ol>
        </div>
      )}

      <p className="mt-2 text-[11px] text-neutral-500">
        Run <code>{f.runId}</code>
        {f.trainedThrough && <> · trained through {fmtDate(f.trainedThrough)}</>}
        {" "}· computed <time dateTime={f.createdAt}>{fmtDateTime(f.createdAt)}</time>
      </p>
    </section>
  );
}
