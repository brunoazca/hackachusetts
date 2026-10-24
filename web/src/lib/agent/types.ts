// Shapes shared by the agent route, its tools and the ChatPanel.

/** A citable row in `sources`. Every tool answer carries the ones it used. */
export type SourceRef = {
  id: string;
  name: string | null;
  url: string | null;
  retrieved_at?: string | null;
  update_mode?: "live" | "daily" | "static" | null;
  update_note?: string | null;
};

/** A map feature the answer refers to; ids equal table primary keys (map feature ids). */
export type FeatureRef = {
  kind: "incident" | "place" | "event" | "site" | "cell";
  id: string;
  label: string;
  lat?: number | null;
  lon?: number | null;
};

/** [minLon, minLat, maxLon, maxLat] */
export type BBox = [number, number, number, number];

/** What every server tool returns: data plus what to cite and what to show. */
export type ToolResult<T> = {
  ok: true;
  data: T;
  sources: SourceRef[];
  features: FeatureRef[];
  /** Plain-language limits of the answer (e.g. truncated, approximate grouping). */
  caveats: string[];
};

export type ToolFailure = {
  ok: false;
  error: string;
  /** not_configured | connection | permission | missing_table | query | analytics_not_computed */
  reason: string;
};

/** Map context sent with each chat message (R8.5). */
export type MapContext = {
  mode?: "assess" | "act";
  viewMode?: "points" | "heat" | "both";
  nearbyRecords?: boolean;
  forecastPeriod?: string;
  siteNeighborhood?: string;
  blockMetric?: string | null;
  focusedRegions?: { id: string; rank: number; position?: number }[];
  selection: { kind: string; id: string } | { kind: "area" } | null;
  view: { lat: number; lon: number; zoom: number } | null;
  /** Visible map bounds. null before load or while a requested flight is pending. */
  bbox: BBox | null;
  filters: { since: string; until: string; categories: string[]; status: string } | null;
  layers: string[];
};
