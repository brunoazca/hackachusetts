import FindingCard from "./FindingCard";
import ForecastSummary, { ForecastUnavailable } from "./ForecastSummary";
import PriceImpact from "./PriceImpact";
import type { InsightsState } from "./types";

// Pure render of a panel state; InsightsPanel wires it to the data.
export default function InsightsView({ state, onRetry }: { state: InsightsState; onRetry?: () => void }) {
  if (state.status === "loading") {
    return (
      <div role="status" aria-live="polite" aria-busy="true" className="space-y-3 p-4" data-state="loading">
        <p className="text-sm text-neutral-600">Loading findings, forecast and costs…</p>
        {[0, 1, 2].map((i) => <div key={i} aria-hidden className="h-24 animate-pulse rounded-lg bg-neutral-100" />)}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div role="alert" className="m-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm" data-state="error">
        <p className="font-semibold text-red-900">Could not load insights.</p>
        <p className="mt-1 text-xs text-red-900">{state.message}</p>
        {onRetry && (
          <button type="button" onClick={onRetry}
            className="mt-2 rounded border border-red-400 bg-white px-2 py-1 text-xs font-medium text-red-900 hover:bg-red-100">
            Retry
          </button>
        )}
      </div>
    );
  }

  if (state.status === "unavailable") {
    return (
      <div role="status" className="m-4 rounded-lg border border-dashed border-neutral-300 p-3 text-sm" data-state="unavailable">
        <p className="font-semibold text-neutral-900">Results not available yet.</p>
        <p className="mt-1 text-xs text-neutral-600">{state.reason}</p>
        {onRetry && (
          <button type="button" onClick={onRetry}
            className="mt-2 rounded border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-100">
            Check again
          </button>
        )}
      </div>
    );
  }

  const { findings, forecast, costs, exploratory } = state.data;
  return (
    <div className="space-y-4 p-4" data-state="ready">
      {forecast ? <ForecastSummary forecast={forecast} /> : <ForecastUnavailable />}

      <section aria-labelledby="findings-h" className="space-y-2">
        <h2 id="findings-h" className="text-sm font-semibold text-neutral-900">Findings</h2>
        <p className="text-xs text-neutral-600">
          Associations in 311 reports and city data, nulls included. Correlation is not cause; counts are reports, not rats.
        </p>
        {findings.length
          ? findings.map((f) => <FindingCard key={f.id} finding={f} />)
          : <p className="text-xs text-neutral-600" role="note">No findings have been computed yet.</p>}
      </section>

      <PriceImpact costs={costs} exploratory={exploratory} />
    </div>
  );
}
