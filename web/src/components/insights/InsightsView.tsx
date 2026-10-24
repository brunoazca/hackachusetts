import type { ReactNode } from "react";
import FindingCard from "./FindingCard";
import ForecastSummary from "./ForecastSummary";
import PriceImpact from "./PriceImpact";
import type { InsightsState } from "./types";

// Pure render of a panel state; InsightsPanel wires it to the data.
export default function InsightsView({ state, onRetry, research, onShowForecast }: {
  state: InsightsState; onRetry?: () => void; research?: ReactNode; onShowForecast?: (week: string) => void;
}) {
  if (state.status === "loading") {
    return (
      <div role="status" aria-live="polite" aria-busy="true" className="space-y-3 p-4" data-state="loading">
        <p className="text-sm text-fg-2">Loading findings, forecast and costs…</p>
        {[0, 1, 2].map((i) => <div key={i} aria-hidden className="h-24 animate-pulse rounded-lg bg-card-hover" />)}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div role="alert" className="m-4 rounded-lg border border-danger bg-card p-3 text-sm" data-state="error">
        <p className="font-semibold text-danger">Could not load insights.</p>
        <p className="mt-1 text-xs text-danger">{state.message}</p>
        {onRetry && (
          <button type="button" onClick={onRetry}
            className="mt-2 rounded border border-danger bg-card px-2 py-1 text-xs font-medium text-danger hover:bg-card-hover">
            Retry
          </button>
        )}
      </div>
    );
  }

  if (state.status === "unavailable") {
    return (
      <div role="status" className="m-4 rounded-lg border border-dashed border-edge p-3 text-sm" data-state="unavailable">
        <p className="font-semibold text-fg">Results not available yet.</p>
        <p className="mt-1 text-xs text-fg-2">{state.reason}</p>
        {onRetry && (
          <button type="button" onClick={onRetry}
            className="mt-2 rounded border border-edge px-2 py-1 text-xs font-medium text-fg hover:bg-card-hover">
            Check again
          </button>
        )}
      </div>
    );
  }

  const { findings, forecast, costs, exploratory } = state.data;
  const pending = [
    !findings.length && "updated findings",
    !forecast && "forecast",
    !costs.length && "recorded costs",
    !exploratory.length && "property-price comparisons",
  ].filter(Boolean);
  return (
    <div className="space-y-4 p-4" data-state="ready">
      <header className="space-y-1">
        <h2 className="text-title font-semibold text-fg">What the evidence says</h2>
        <p className="text-small text-fg-2">What to review, what remains uncertain, and the records behind it.</p>
      </header>
      {findings.length > 0 ? (
        <section aria-label="Computed findings" className="space-y-3">
          <p className="text-small text-fg-3">Computed findings · Each card carries its date and sources. Associations do not establish causes.</p>
          {findings.map((f) => <FindingCard key={f.id} finding={f} />)}
        </section>
      ) : research}
      {forecast && <ForecastSummary forecast={forecast} onShowForecast={onShowForecast} />}
      <PriceImpact costs={costs} exploratory={exploratory} />
      {pending.length > 0 && (
        <aside className="space-y-2 rounded-lg border border-dashed border-edge p-3 text-small text-fg-3" aria-label="Data still pending" data-pending>
          <p>Awaiting published results: {pending.join(", ")}.</p>
          <p>Missing results do not establish that there is no association or no cost.</p>
          {onRetry && <button type="button" onClick={onRetry} className="min-h-8 rounded-md border border-edge px-3 text-ui text-fg hover:bg-card-hover">Check for new results</button>}
        </aside>
      )}
    </div>
  );
}
