"use client";
import { useMap } from "@/lib/map-store";
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
      <InsightsView state={state} onRetry={retry} research={research} onShowForecast={showForecast} />
      {(state.status === "unavailable" || state.status === "error") && <div className="px-4 pb-4">{research}</div>}
    </>
  );
}
