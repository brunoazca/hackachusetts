import { connection } from "next/server";
import { chatStatus, createChatHandler, defaultChatDeps } from "@/lib/agent/chat";

// Assistant endpoint. POST streams a UI message stream (AI SDK v7) with server
// tool results and client map-tool calls; GET reports whether a model provider
// is configured so the panel can show "assistant not configured" up front.

export const maxDuration = 60;

export const POST = createChatHandler(defaultChatDeps);

export async function GET() {
  await connection(); // read env at request time, not at build (Cache Components)
  return Response.json(chatStatus());
}
