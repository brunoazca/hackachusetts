import { convertToModelMessages, safeValidateUIMessages, stepCountIs, streamText, type LanguageModel } from "ai";
import { parseMapContext } from "./context";
import { systemPrompt } from "./prompt";
import { providerStatus, getModel } from "./provider";
import { clientTools } from "./tools/client";
import { createServerTools } from "./tools/server";
import { createSupabaseData, supabaseConfigured } from "./data/supabase";
import type { AgentData } from "./data/types";

// /api/chat handler (task 4.2). Dependencies are injected so the fake-model
// test drives exactly the code the route runs.

export type ChatDeps = {
  getModel: () => LanguageModel | null;
  getData: () => AgentData | null;
  now?: () => Date;
  maxSteps?: number;
};

export function createTools(data: AgentData | null, now?: () => Date) {
  return { ...createServerTools({ data, now }), ...clientTools };
}

export function nyDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(d);
}

const MAX_MESSAGES = 40;

export function createChatHandler(deps: ChatDeps) {
  return async function POST(req: Request): Promise<Response> {
    const model = deps.getModel();
    if (!model) {
      return Response.json({ error: "not_configured", message: "Assistant not configured." }, { status: 503 });
    }
    let body: { messages?: unknown; context?: unknown } | null;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "bad_request", message: "Body must be JSON." }, { status: 400 });
    }
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return Response.json({ error: "bad_request", message: "messages is required." }, { status: 400 });
    }
    const now = deps.now ?? (() => new Date());
    const tools = createTools(deps.getData(), now);
    const validated = await safeValidateUIMessages({ messages: body.messages.slice(-MAX_MESSAGES), tools });
    if (!validated.success || validated.data.some((m) => m.role === "system")) {
      return Response.json({ error: "bad_request", message: "Invalid conversation messages." }, { status: 400 });
    }
    const messages = validated.data;

    const result = streamText({
      model,
      system: systemPrompt(parseMapContext(body.context), nyDate(now())),
      messages: await convertToModelMessages(messages, { tools, ignoreIncompleteToolCalls: true }),
      tools,
      stopWhen: stepCountIs(deps.maxSteps ?? 8),
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onError: (e) => {
        console.error("[api/chat]", e);
        return "The assistant hit an error. Try again.";
      },
    });
  };
}

/** Production wiring: env-selected provider, live Supabase (or none). */
export const defaultChatDeps: ChatDeps = {
  getModel: () => getModel(),
  getData: () => (supabaseConfigured() ? createSupabaseData() : null),
};

export function chatStatus() {
  const s = providerStatus();
  return {
    configured: s.configured,
    provider: s.provider,
    data: supabaseConfigured() ? "live" : "not_configured",
    ...(s.configured ? {} : { reason: s.reason }),
  };
}
