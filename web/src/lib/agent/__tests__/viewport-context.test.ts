import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMapContext, parseMapContext } from "../context";
import { systemPrompt } from "../prompt";

test("question context snapshots viewport and filters independently of later navigation", () => {
  const state = {
    selection: { kind: "site", id: "old-site" },
    view: { lat: 42.35, lon: -71.08, zoom: 16 },
    bounds: [-71.09, 42.34, -71.07, 42.36] as [number, number, number, number],
    filters: { since: "2026-07-24", until: "2026-10-24", categories: ["rodent"], status: "all" },
    layers: { rodent: true },
  };
  const question = buildMapContext(state);
  state.view.lat = 42.4;
  state.bounds[0] = -71.2;
  state.filters.categories.push("trash");
  assert.equal(question.view?.lat, 42.35);
  assert.equal(question.bbox?.[0], -71.09);
  assert.deepEqual(question.filters?.categories, ["rodent"]);
  assert.deepEqual(parseMapContext(question), question);
  const next = buildMapContext(state);
  assert.equal(next.view?.lat, 42.4);
  assert.equal(next.bbox?.[0], -71.2);
  const prompt = systemPrompt(question, "2026-10-24");
  assert.match(prompt, /even if an older selection exists/);
  assert.match(prompt, /keep the camera in place/);
  assert.match(prompt, /search_incidents with that bbox/);
});

 test("local explanations explicitly separate viewport totals from radius evidence", () => {
  const prompt = systemPrompt(null, "2026-10-24");
  assert.match(prompt, /Visible map area/);
  assert.match(prompt, /Nearby context — within N m/);
  assert.match(prompt, /radius can extend beyond the visible map/);
  assert.match(prompt, /Reports within N m/);
  assert.match(prompt, /State differing date windows/);
});
