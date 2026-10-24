import { test } from "node:test";
import assert from "node:assert/strict";
import { simulateReadableStream, type UIMessage } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { createChatHandler } from "../chat";
import { createMemoryData } from "../data/memory";
import { NOW, tables } from "./fixtures";

// Fake-model loop through the real handler (task 4.6): server tool → client
// map tool (stream pauses for the browser) → final answer after the client output.

const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 1, text: 1, reasoning: undefined },
};
const finish = (unified: "stop" | "tool-calls") => ({ type: "finish", finishReason: { unified, raw: undefined }, logprobs: undefined, usage }) as const;
const toolCall = (id: string, name: string, input: unknown) => ({ type: "tool-call", toolCallId: id, toolName: name, input: JSON.stringify(input) }) as const;

function fakeModel(steps: unknown[][]) {
  let i = 0;
  return new MockLanguageModelV4({
    doStream: async () => ({ stream: simulateReadableStream({ chunks: steps[Math.min(i++, steps.length - 1)] as never[] }) }),
  });
}

async function readChunks(res: Response) {
  const text = await res.text();
  return text.split("\n").filter((l) => l.startsWith("data: ") && !l.includes("[DONE]")).map((l) => JSON.parse(l.slice(6)));
}

const post = (body: unknown) => new Request("http://x/api/chat", { method: "POST", body: JSON.stringify(body) });
const context = {
  selection: { kind: "site", id: "fixture-site-1" },
  view: { lat: 42.32, lon: -71.08, zoom: 12 },
  bbox: null,
  filters: { since: "2026-07-26", until: "2026-10-24", categories: [], status: "all" },
  layers: ["rodent", "sites"],
};
const userMsg: UIMessage = { id: "u1", role: "user", parts: [{ type: "text", text: "Why do reports keep coming back at this site?" }] };

test("server tool runs on the server, client tool call is streamed to the browser", async () => {
  const model = fakeModel([
    [toolCall("c1", "get_site", { site_id: "fixture-site-1" }), finish("tool-calls")],
    [toolCall("c2", "map_fly_to", { lat: 42.3051, lon: -71.0712, zoom: 16 }), finish("tool-calls")],
  ]);
  const POST = createChatHandler({ getModel: () => model, getData: () => createMemoryData(tables), now: () => NOW });
  const res = await POST(post({ messages: [userMsg], context }));
  assert.equal(res.status, 200);
  const chunks = await readChunks(res);

  const out = chunks.find((c) => c.type === "tool-output-available" && c.toolCallId === "c1");
  assert.ok(out, "get_site output streamed");
  assert.equal(out.output.ok, true);
  assert.equal(out.output.data.site.id, "fixture-site-1");
  assert.ok(out.output.sources.length > 0);

  assert.ok(chunks.some((c) => c.type === "tool-input-available" && c.toolCallId === "c2" && c.toolName === "map_fly_to"));
  assert.ok(!chunks.some((c) => c.type === "tool-output-available" && c.toolCallId === "c2"), "client tool is not executed on the server");
  assert.equal(model.doStreamCalls.length, 2, "loop stops waiting for the client tool");

  // Map context reached the system prompt.
  const sys = JSON.stringify(model.doStreamCalls[0].prompt[0]);
  assert.match(sys, /fixture-site-1/);
  assert.match(sys, /Answer only from tool results/);
});

test("after the client tool output is sent back, the model answers", async () => {
  const model = fakeModel([[
    { type: "text-start", id: "t" },
    { type: "text-delta", id: "t", delta: "Two closures were followed by new reports." },
    { type: "text-end", id: "t" },
    finish("stop"),
  ]]);
  const POST = createChatHandler({ getModel: () => model, getData: () => createMemoryData(tables), now: () => NOW });
  const assistant: UIMessage = {
    id: "a1",
    role: "assistant",
    parts: [
      { type: "step-start" },
      { type: "tool-map_fly_to", toolCallId: "c2", state: "output-available", input: { lat: 42.3051, lon: -71.0712 }, output: { ok: true, done: "Moved the map" } },
    ],
  } as UIMessage;
  const res = await POST(post({ messages: [userMsg, assistant], context }));
  const chunks = await readChunks(res);
  const text = chunks.filter((c) => c.type === "text-delta").map((c) => c.delta).join("");
  assert.equal(text, "Two closures were followed by new reports.");
  // The client tool result is in the model prompt.
  assert.match(JSON.stringify(model.doStreamCalls[0].prompt), /Moved the map/);
});

test("no provider → 503 not_configured; bad body → 400", async () => {
  const off = createChatHandler({ getModel: () => null, getData: () => null });
  const r = await off(post({ messages: [userMsg] }));
  assert.equal(r.status, 503);
  assert.equal((await r.json()).error, "not_configured");

  const on = createChatHandler({ getModel: () => fakeModel([[finish("stop")]]), getData: () => null });
  assert.equal((await on(post({}))).status, 400);
  assert.equal((await on(new Request("http://x", { method: "POST", body: "{" }))).status, 400);
});


test("v2 route exposes due_sites and streams app_set_mode with the recommendation rule", async () => {
  const model = fakeModel([
    [toolCall("due", "due_sites", { limit: 1 }), finish("tool-calls")],
    [toolCall("mode", "app_set_mode", { mode: "inspect" }), finish("tool-calls")],
  ]);
  const data = createMemoryData({ ...tables, sites: tables.sites!.map((s) => ({ ...s, summary: { ...s.summary, due: true } })) });
  const POST = createChatHandler({ getModel: () => model, getData: () => data, now: () => NOW });
  const response = await POST(post({ messages: [userMsg], context: { ...context, mode: "assess" } }));
  const chunks = await readChunks(response);
  assert.equal(chunks.find((c) => c.type === "tool-output-available" && c.toolCallId === "due").output.data.sites.length, 1);
  assert.ok(chunks.some((c) => c.type === "tool-input-available" && c.toolName === "app_set_mode"));
  assert.ok(!chunks.some((c) => c.type === "tool-output-available" && c.toolCallId === "mode"));
  const prompt = JSON.stringify(model.doStreamCalls[0].prompt[0]);
  assert.match(prompt, /Never recommend rodenticide or poison/);
  assert.match(prompt, /app mode: assess/);
});


test("malformed conversation bodies return 400 before any model call", async () => {
  const model = fakeModel([[finish("stop")]]);
  const handler = createChatHandler({ getModel: () => model, getData: () => null });
  for (const body of [null, { messages: [null] }, { messages: [{ id: "x", role: "user", parts: "invalid" }] }, { messages: [{ ...userMsg, role: "system" }] }, { messages: [{ id: "x", role: "assistant", parts: [{ type: "tool-map_fly_to", toolCallId: "bad", state: "output-available", input: { lat: 0, lon: 0 }, output: { ok: true } }] }] }]) {
    const response = await handler(post(body));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, "bad_request");
  }
  assert.equal(model.doStreamCalls.length, 0);
});
