"use client";
import { useMap } from "@/lib/map-store";
import RegionSolutions from "./regions/RegionSolutions";
import HistoricalFindings from "./HistoricalFindings";
import InsightsView from "./InsightsView";
import { useInsights } from "./useInsights";

export default function InsightsPanel() {
  const { state, retry } = useInsights();
  const setMode = useMap((s) => s.setMode);
  const setLayers = useMap((s) => s.setLayers);
  const setForecastWeek = useMap((s) => s.setForecastWeek);
  const research = <HistoricalFindings onReviewPlaces={() => setMode("act")} />;
  const showForecast = (week: string) => {
    setForecastWeek(week);
    setLayers({ forecast: true });
    setMode("assess");
  };
  return (
    <>
      <RegionSolutions />
      <details className="mx-4 mb-4 rounded-lg border border-edge">
        <summary className="min-h-10 cursor-pointer p-3 text-small font-semibold text-fg">Methodology & city-wide evidence</summary>
      <InsightsView state={state} onRetry={retry} research={research} onShowForecast={showForecast} />
      {(state.status === "unavailable" || state.status === "error") && <div className="px-4 pb-4">{research}</div>}
      </details>
    </>
  );
}
