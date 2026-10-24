import { test } from "node:test";
import assert from "node:assert/strict";
import { createMemoryData } from "../data/memory";
import { createInsightsTools } from "../tools/insights";
import { rankingFocusFallback } from "../ranking-focus";

test("current Insight ranking retains every hotspot cell and single-block geometry references", async () => {
  const data = createMemoryData({ insightRpc: (name, args) => {
    assert.equal(name, "insight_ranking");
    assert.deepEqual(args, { lim: 2, off: 0 });
    return [
      { position: 1, id: "region1", entry: "region", cell_ids: ["a", "b"], region: { neighborhood: "Back Bay" }, total: 2 },
      { position: 2, id: "block1", entry: "cell", cell_ids: [], total: 2 },
    ];
  } });
  const tool = createInsightsTools(data).get_ranking;
  const output = await tool.execute!({ offset: 0, limit: 2 }, { toolCallId: "test", messages: [], context: {} });
  assert.deepEqual(rankingFocusFallback([{ type: "tool-get_ranking", output }]), [
    { region_id: "region1", rank: 1, cell_ids: ["a", "b"] },
    { region_id: "block1", rank: 2, cell_ids: ["block1"] },
  ]);
});
