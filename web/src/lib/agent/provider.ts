import type { LanguageModel } from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";

// Provider switch for the assistant (R8.9). MODEL_PROVIDER picks one of three
// backends; MODEL_ID overrides the default model for that backend. When the
// chosen provider has no credentials we report "not configured" instead of
// throwing, so the rest of the app keeps working.

export type ProviderName = "gateway" | "anthropic" | "bedrock";

const DEFAULT_MODEL: Record<ProviderName, string> = {
  gateway: "anthropic/claude-sonnet-5.5",
  anthropic: "claude-sonnet-5-5",
  bedrock: "us.anthropic.claude-sonnet-5-5",
};

type Env = Record<string, string | undefined>;

export type ProviderStatus =
  | { configured: true; provider: ProviderName; modelId: string }
  | { configured: false; provider: ProviderName | null; reason: string };

function parseProvider(raw: string | undefined): ProviderName | null {
  const v = (raw ?? "gateway").trim().toLowerCase();
  return v === "gateway" || v === "anthropic" || v === "bedrock" ? v : null;
}

export function providerStatus(env: Env = process.env): ProviderStatus {
  const provider = parseProvider(env.MODEL_PROVIDER);
  if (!provider) {
    return { configured: false, provider: null, reason: `Unknown MODEL_PROVIDER "${env.MODEL_PROVIDER}"` };
  }
  const missing = missingCredentials(provider, env);
  if (missing) return { configured: false, provider, reason: missing };
  return { configured: true, provider, modelId: env.MODEL_ID?.trim() || DEFAULT_MODEL[provider] };
}

function missingCredentials(p: ProviderName, env: Env): string | null {
  switch (p) {
    case "gateway":
      // On Vercel the OIDC token is injected automatically; locally an API key is needed.
      return env.AI_GATEWAY_API_KEY || env.VERCEL_OIDC_TOKEN ? null : "AI_GATEWAY_API_KEY is not set";
    case "anthropic":
      return env.ANTHROPIC_API_KEY ? null : "ANTHROPIC_API_KEY is not set";
    case "bedrock": {
      if (!env.AWS_REGION) return "AWS_REGION is not set";
      const keys = env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY;
      return keys || env.AWS_BEARER_TOKEN_BEDROCK ? null : "AWS credentials are not set";
    }
  }
}

/** Returns the language model, or null when the provider is not configured. */
export function getModel(env: Env = process.env): LanguageModel | null {
  const s = providerStatus(env);
  if (!s.configured) return null;
  switch (s.provider) {
    case "gateway":
      return createGateway({ apiKey: env.AI_GATEWAY_API_KEY })(s.modelId);
    case "anthropic":
      return createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })(s.modelId);
    case "bedrock":
      return createAmazonBedrock({ region: env.AWS_REGION })(s.modelId);
  }
}
