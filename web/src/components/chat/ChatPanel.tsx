"use client";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { useMap } from "@/lib/map-store";
import { buildMapContext } from "@/lib/agent/context";
import { executeClientTool, isClientTool } from "@/lib/agent/tools/client";
import { messageText, STARTERS } from "@/lib/agent/ui";
import Message from "./Message";

// "Ask" panel (task 4.4). Streams from /api/chat, runs the map tools on the
// shared store, and sends the current map context with every request.

type Status = { configured: boolean; data?: string; reason?: string } | null;

export default function ChatPanel() {
  const [status, setStatus] = useState<Status>(null);
  const [input, setInput] = useState("");
  const [announce, setAnnounce] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/chat")
      .then((r) => (r.ok ? r.json() : { configured: false }))
      .then((s) => live && setStatus(s))
      .catch(() => live && setStatus({ configured: false }));
    return () => { live = false; };
  }, []);

  const { messages, sendMessage, addToolOutput, status: chatStatus, error, regenerate, stop, clearError } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      // Read the store at send time so automatic follow-ups carry fresh context too.
      prepareSendMessagesRequest: ({ messages, body }) => ({
        body: { ...body, messages, context: buildMapContext(useMap.getState()) },
      }),
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall({ toolCall }) {
      if (toolCall.dynamic || !isClientTool(toolCall.toolName)) return;
      const out = executeClientTool(toolCall.toolName, toolCall.input, useMap.getState());
      // No await: avoids deadlocks with the automatic resend.
      if (out.ok) void addToolOutput({ tool: toolCall.toolName, toolCallId: toolCall.toolCallId, output: out });
      else void addToolOutput({ tool: toolCall.toolName, toolCallId: toolCall.toolCallId, state: "output-error", errorText: out.error });
    },
    onFinish({ message }) {
      const text = messageText(message);
      if (text) setAnnounce(text);
    },
  });

  const busy = chatStatus === "submitted" || chatStatus === "streaming";
  const disabled = !status?.configured;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || busy || disabled) return;
    void sendMessage({ text: t });
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Screen readers hear each finished answer once, not every streamed token (R9.2). */}
      <div aria-live="polite" className="sr-only">{announce}</div>

      <div role="log" aria-label="Conversation" className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {status && !status.configured && (
          <p role="status" className="rounded-md border border-neutral-300 bg-neutral-50 p-3 text-sm text-neutral-700">
            Assistant not configured. The map, Inspect and Insights still work.
          </p>
        )}
        {status?.configured && status.data === "not_configured" && (
          <p role="status" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            Live data is not connected, so the assistant can&apos;t look anything up.
          </p>
        )}

        {messages.length === 0 && status?.configured && (
          <div className="space-y-2">
            <p className="text-sm text-neutral-700">Ask about reports, chronic sites, what&apos;s nearby or what worked. Answers cite their sources and move the map.</p>
            <ul aria-label="Suggested questions" className="space-y-1">
              {STARTERS.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    onClick={() => send(q)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-neutral-900"
                  >
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {messages.map((m) => <Message key={m.id} message={m} />)}

        {chatStatus === "submitted" && <p className="text-xs text-neutral-600" role="status">Thinking…</p>}

        {error && (
          <div role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
            <p>{error.message.includes("not_configured") ? "Assistant not configured." : "Something went wrong answering that."}</p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => { clearError(); void regenerate(); }} className="rounded border border-red-400 bg-white px-2 py-0.5 text-xs font-medium hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-red-900">
                Retry
              </button>
              <button type="button" onClick={clearError} className="rounded px-2 py-0.5 text-xs hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-red-900">
                Dismiss
              </button>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-end gap-2 border-t border-neutral-200 p-3"
      >
        <label htmlFor="chat-input" className="sr-only">Ask the assistant</label>
        <textarea
          id="chat-input"
          rows={2}
          value={input}
          disabled={disabled}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
          }}
          placeholder={status === null ? "Connecting…" : disabled ? "Assistant not configured" : "Ask about this map…"}
          className="min-h-[2.5rem] flex-1 resize-none rounded-md border border-neutral-300 px-3 py-2 text-sm placeholder:text-neutral-500 focus-visible:outline-2 focus-visible:outline-neutral-900 disabled:bg-neutral-100"
        />
        {busy ? (
          <button type="button" onClick={() => void stop()} className="rounded-md border border-neutral-400 px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-neutral-900">
            Stop
          </button>
        ) : (
          <button type="submit" disabled={disabled || !input.trim()} className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:bg-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900">
            Send
          </button>
        )}
      </form>
    </div>
  );
}
