import { test } from "node:test";
import assert from "node:assert/strict";
import { executeClientTool, type MapActions } from "../tools/client";
import { buildMapContext, parseMapContext } from "../context";
import { useMap } from "../../map-store";

function fakeMap() {
  const calls: [string, unknown][] = [];
  const rec = (name: string) => (v: unknown) => { calls.push([name, v]); };
  const map: MapActions = {
    setMode: rec("setMode"),
    flyTo: rec("flyTo"), setLayers: rec("setLayers"), setFilters: rec("setFilters"), setHighlight: rec("setHighlight"),
    select: rec("select"), setPanel: rec("setPanel"), setForecastWeek: rec("setForecastWeek"),
  };
  return { map, calls };
}

test("map_fly_to drives the store; coordinates outside the region are rejected", () => {
  const { map, calls } = fakeMap();
  assert.equal(executeClientTool("map_fly_to", { lat: 42.3051, lon: -71.0712, zoom: 16 }, map).ok, true);
  assert.deepEqual(calls, [["flyTo", { lat: 42.3051, lon: -71.0712, zoom: 16 }]]);
  const bad = executeClientTool("map_fly_to", { lat: 40.7, lon: -74 }, map);
  assert.equal(bad.ok, false);
  assert.equal(calls.length, 1);
});

test("layers, highlight, select, forecast, panel, filters", () => {
  const { map, calls } = fakeMap();
  executeClientTool("map_set_layers", { on: ["food"], off: ["rodent"] }, map);
  executeClientTool("map_highlight", { ids: ["a", "b"] }, map);
  executeClientTool("map_select", { kind: "site", id: "s1" }, map);
  executeClientTool("map_show_forecast", { week_start: "2026-10-26" }, map);
  executeClientTool("open_panel", { panel: "insights" }, map);
  executeClientTool("map_set_filters", { status: "open" }, map);
  assert.deepEqual(calls, [
    ["setLayers", { rodent: false, food: true }],
    ["setHighlight", ["a", "b"]],
    ["select", { kind: "site", id: "s1" }],
    ["setLayers", { forecast: true }],
    ["setForecastWeek", "2026-10-26"],
    ["setPanel", "insights"],
    ["setFilters", { status: "open" }],
  ]);
});

test("unknown layer and unknown tool are errors", () => {
  const { map, calls } = fakeMap();
  assert.equal(executeClientTool("map_set_layers", { on: ["lasers"] }, map).ok, false);
  assert.equal(executeClientTool("rm_rf", {}, map).ok, false);
  assert.equal(calls.length, 0);
});

test("map context: bbox stays null without store bounds; round-trips validation", () => {
  const state = {
    mode: "act" as const,
    selection: { kind: "site", id: "s1" },
    view: { lat: 42.32, lon: -71.08, zoom: 12 },
    filters: { since: "2026-07-26", until: "2026-10-24", categories: [], status: "all" },
    layers: { rodent: true, sites: true, food: false },
  };
  const ctx = buildMapContext(state);
  assert.equal(ctx.bbox, null);
  assert.equal(ctx.mode, "act");
  assert.deepEqual(ctx.layers, ["rodent", "sites"]);
  assert.deepEqual(parseMapContext(ctx), ctx);
  assert.deepEqual(buildMapContext({ ...state, bounds: [-71.1, 42.3, -71.0, 42.4] }).bbox, [-71.1, 42.3, -71.0, 42.4]);
  assert.equal(parseMapContext({ junk: true }), null);
});


test("app_set_mode changes modes and rejects removed depth options", () => {
  const { map, calls } = fakeMap();
  assert.equal(executeClientTool("app_set_mode", { mode: "act" }, map).ok, true);
  assert.equal(executeClientTool("app_set_mode", { mode: "assess" }, map).ok, true);
  assert.deepEqual(calls, [["setMode", "act"], ["setMode", "assess"]]);
  for (const input of [{}, { mode: "delete" }, { mode: "act", depth: "explore" }, { depth: "simple" }]) {
    assert.equal(executeClientTool("app_set_mode", input, map).ok, false);
  }
  assert.equal(calls.length, 2, "invalid input must not partially change the store");
});

test("app_set_mode uses the current real store and preserves selection", () => {
  const before = useMap.getState();
  try {
    before.select({ kind: "site", id: "fixture-selected" });
    assert.equal(executeClientTool("app_set_mode", { mode: "act" }, useMap.getState()).ok, true);
    assert.equal(useMap.getState().mode, "act");
    assert.deepEqual(useMap.getState().selection, { kind: "site", id: "fixture-selected" });
  } finally {
    useMap.setState(before, true);
  }
});
