import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { parseRegionSolutions } from "../regions/parse";
import RegionSolutionCard from "../regions/RegionSolutionCard";

// Same persisted shape as region_solution.build_inputs + region_solution.region_solution.
const row = {
  region_id: "g250_1_2", forecast_run_id: "run-1", rank: 1, cell_ids: ["g250_1_2", "g250_1_3"],
  action: "Inspect container storage and issue a compliance notice", lane: "enforcement", because: "Trash reports occur near the records.",
  source: "ai", llm_model: "fixture-model", computed_at: "2026-10-24T20:00:00Z", caveat: "Model estimate, not a measured effect.",
  records: [{ incident_id: "i1", todo: "Check sealed containers" }, { incident_id: "outside", todo: "Not in region" }],
  unknowns: ["Check storage access"], cites: ["i1", "trash_storage"],
  input: {
    region: { region_id: "g250_1_2", neighborhood: "Dorchester", severity: { observed_12w: 12, expected_4w: 6.1, score: 18.1 } },
    forecast: { model_run_id: "run-1", next_4_weeks_expected_reports: { "2026-10-26": 1.5 }, week_1_chance_of_any_report: "78%", drivers: [{ label: "Trash reports", contribution: 0.2 }] },
    records_last_12_weeks: [{ incident_id: "i1", opened: "2026-10-23", block: "Example block", status: "closed", city_did: "Inspection", closure_note: "SHOULD NEVER RENDER", model: { best_action: "Warning", return_if_best: "14%", return_if_monitoring: "18%", confident: true } }],
    possible_causes_within_150m: [{ kind: "trash_storage", label: "Trash storage", count: 4, nearest_m: 20, source_ids: ["311"] }],
    solution_statistics: { "first report": { cases: 50, returned_within_60d: "18%", by_action: [{ action: "Inspection", cases: 30, share_of_cases: "60%", returned_within_60d: "18%", interval_95: "10%-30%", model_adjusted_return: "16%", proposable: true }] } },
    source_ids: ["311"],
  },
};
const render = (value: unknown) => renderToStaticMarkup(<RegionSolutionCard solution={parseRegionSolutions([value])[0]} sources={[]} onShowMap={async () => {}}/>);

test("persisted model output renders proposal, record todo, evidence and provenance", () => {
  const html = render(row);
  for (const expected of [row.action, row.because, "Check sealed containers", "Check storage access", "fixture-model", "run-1", "14%", "18%", "observational", "After-fix forecast not available"]) assert.ok(html.includes(expected), expected);
  assert.doesNotMatch(html, /SHOULD NEVER RENDER|Not in region|NaN|undefined/);
  assert.equal(parseRegionSolutions([row])[0].records.length, 1);
});

test("rules and partial model data remain readable without made-up return chances", () => {
  const partial = structuredClone(row);
  partial.source = "rules";
  partial.records = [];
  partial.input.records_last_12_weeks[0].model.confident = false;
  const html = render(partial);
  assert.match(html, /Rule-based fallback/);
  assert.match(html, /Next: Warning/);
  assert.doesNotMatch(html, /14% predicted return/);
});

test("mismatched evidence and malformed rows cannot populate a card", () => {
  assert.deepEqual(parseRegionSolutions([null, {}, { ...row, forecast_run_id: "other" }, { ...row, region_id: "other" }]), []);
  assert.throws(() => parseRegionSolutions({}));
});

test("unsafe proposals and per-record instructions use inspection fallback", () => {
  for (const word of ["bait", "Baiting", "poison", "rodenticide", "toxicant"]) {
    const r = parseRegionSolutions([{ ...row, action: `Apply ${word}`, records: [{ incident_id: "i1", todo: `Use ${word}` }] }])[0];
    assert.equal(r.action, "Inspect and record the cause");
    assert.equal(r.records[0].todo, "Inspect and record the cause");
    assert.equal(r.source, "rules");
  }
});
