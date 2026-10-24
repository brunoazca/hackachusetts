import FindingCard from "./FindingCard";
import ForecastSummary, { ForecastUnavailable } from "./ForecastSummary";
import PriceImpact from "./PriceImpact";
import type { InsightsState } from "./types";

// Pure render of a panel state; InsightsPanel wires it to the data.
export default function InsightsView({ state, onRetry }: { state: InsightsState; onRetry?: () => void }) {
  if (state.status === "loading") {
    return (
      <div role="status" aria-live="polite" aria-busy="true" className="space-y-3 p-4" data-state="loading">
        <p className="text-sm text-neutral-600">Loading findings…</p>
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
        <p className="mt-1 text-xs text-neutral-600">We are still getting these ready. Try again in a moment.</p>
        <details className="mt-1 text-[11px] text-neutral-500"><summary className="cursor-pointer">Details</summary>{state.reason}</details>
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
        <h2 id="findings-h" className="text-sm font-semibold text-neutral-900">Patterns we found</h2>
        <p className="text-xs text-neutral-600">
          What tends to show up with more rodent reports. We show checks that found nothing, too. A pattern is not proof of cause.
        </p>
        {findings.length
          ? findings.map((f) => <FindingCard key={f.id} finding={f} />)
          : <p className="text-xs text-neutral-600" role="note">No patterns to show yet.</p>}
      </section>

      <PriceImpact costs={costs} exploratory={exploratory} />
    </div>
  );
}
