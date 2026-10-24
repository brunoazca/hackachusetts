import { test } from "node:test";
import assert from "node:assert/strict";
import { filterIncidentStatus } from "../../map-filters";
import type { FeatureCollection, Point } from "geojson";
import type { IncidentProps } from "../../queries";

test("status filters preserve correct marker and heatmap counts for points and bins", () => {
  const data: FeatureCollection<Point, IncidentProps> = { type: "FeatureCollection", features: [
    { category: "rodent", status: "open" as const }, { category: "rodent", status: "closed" as const },
    { category: "rodent", n: 10, n_open: 3 }, { category: "rodent", n: 2, n_open: 0 },
  ].map(properties => ({ type: "Feature", geometry: { type: "Point", coordinates: [-71, 42] }, properties })) };
  const count = (status: "all" | "open" | "closed") => filterIncidentStatus(data, status).features.reduce((sum,f) => sum + (f.properties.n ?? 1), 0);
  assert.equal(count("all"), 14);
  assert.equal(count("open"), 4);
  assert.equal(count("closed"), 10);
  assert.equal(filterIncidentStatus(data,"all"),data);
  assert.equal(data.features[2].properties.n,10);
});
