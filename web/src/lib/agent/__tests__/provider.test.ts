import { test } from "node:test";
import assert from "node:assert/strict";
import { getModel, providerStatus } from "../provider";

test("defaults to gateway and is not configured without a key", () => {
  const s = providerStatus({});
  assert.equal(s.configured, false);
  assert.equal(s.provider, "gateway");
  assert.equal(getModel({}), null);
});

test("gateway with API key or Vercel OIDC token", () => {
  assert.deepEqual(providerStatus({ AI_GATEWAY_API_KEY: "k" }), { configured: true, provider: "gateway", modelId: "anthropic/claude-sonnet-5.5" });
  assert.equal(providerStatus({ VERCEL_OIDC_TOKEN: "t" }).configured, true);
});

test("anthropic needs ANTHROPIC_API_KEY; MODEL_ID overrides", () => {
  assert.equal(providerStatus({ MODEL_PROVIDER: "anthropic" }).configured, false);
  assert.deepEqual(providerStatus({ MODEL_PROVIDER: "Anthropic", ANTHROPIC_API_KEY: "k", MODEL_ID: "claude-x" }), {
    configured: true, provider: "anthropic", modelId: "claude-x",
  });
  assert.notEqual(getModel({ MODEL_PROVIDER: "anthropic", ANTHROPIC_API_KEY: "k" }), null);
});

test("bedrock needs region and credentials", () => {
  assert.equal(providerStatus({ MODEL_PROVIDER: "bedrock", AWS_ACCESS_KEY_ID: "a", AWS_SECRET_ACCESS_KEY: "b" }).configured, false);
  assert.equal(providerStatus({ MODEL_PROVIDER: "bedrock", AWS_REGION: "us-east-1" }).configured, false);
  assert.equal(providerStatus({ MODEL_PROVIDER: "bedrock", AWS_REGION: "us-east-1", AWS_BEARER_TOKEN_BEDROCK: "t" }).configured, true);
  assert.notEqual(getModel({ MODEL_PROVIDER: "bedrock", AWS_REGION: "us-east-1", AWS_ACCESS_KEY_ID: "a", AWS_SECRET_ACCESS_KEY: "b" }), null);
});

test("unknown provider is reported, not thrown", () => {
  const s = providerStatus({ MODEL_PROVIDER: "openai" });
  assert.equal(s.configured, false);
  assert.equal(s.provider, null);
});
