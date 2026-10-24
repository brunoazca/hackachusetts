"use client";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { useMap } from "@/lib/map-store";
import { buildMapContext } from "@/lib/agent/context";
import { executeClientTool, isClientTool } from "@/lib/agent/tools/client";
import { messageText, STARTERS } from "@/lib/agent/ui";
import Message from "./Message";
import { CollapseButton } from "@/components/shell/Collapse";
import "./Markdown.css";

// "Ask" panel (task 4.4). Streams from /api/chat, runs the map tools on the
// shared store, and sends the current map context with every request.

type Status = { configured: boolean; data?: string; reason?: string } | null;

export default function ChatPanel({ onCollapse }: { onCollapse?: () => void }) {
  const [status, setStatus] = useState<Status>(null);
  const [input, setInput] = useState("");
  const [announce, setAnnounce] = useState("");
  const questionContext = useRef<ReturnType<typeof buildMapContext> | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/chat")
      .then((r) => (r.ok ? r.json() : { configured: false }))
      .then((s) => live && setStatus(s))
      .catch(() => live && setStatus({ configured: false }));
    return () => { live = false; };
  }, []);

  // The transport constructor only stores this callback; the SDK calls it on send.
  // eslint-disable-next-line react-hooks/refs
  const [transport] = useState(() => new DefaultChatTransport({
    api: "/api/chat",
    // Invoked by the SDK at request time, never during rendering.
    prepareSendMessagesRequest: ({ messages, body }) => ({
      body: { ...body, messages, context: questionContext.current ?? buildMapContext(useMap.getState()) },
    }),
  }));

  const { messages, sendMessage, addToolOutput, status: chatStatus, error, regenerate, stop, clearError } = useChat({
    transport,
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
    questionContext.current = buildMapContext(useMap.getState());
    void sendMessage({ text: t });
    setInput("");
  };

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-line py-2 pl-4 pr-3">
        <h2 className="text-[15px] font-semibold text-fg">Ask Piper</h2>
        {onCollapse && <CollapseButton onClick={onCollapse} label="Hide panel (])" dir="right" />}
      </div>
      {/* Screen readers hear each finished answer once, not every streamed token (R9.2). */}
      <div aria-live="polite" className="sr-only">{announce}</div>

      <div role="log" aria-label="Conversation" aria-live="off" className="min-h-0 min-w-0 flex-1 space-y-6 overflow-x-hidden overflow-y-auto p-4">
        {status && !status.configured && (
          <p role="status" className="rounded-md border border-edge bg-card p-3 text-sm text-fg-2">
            Ask is turned off right now. The map, Inspect and Insights still work.
          </p>
        )}
        {status?.configured && status.data === "not_configured" && (
          <p role="status" className="rounded-md border border-accent bg-card p-3 text-sm text-fg">
            Ask can&apos;t reach the city data right now. Please try again later.
          </p>
        )}

        {messages.length === 0 && status?.configured && (
          <div className="space-y-2">
            <p className="pb-1 text-sm text-fg-3">Ask about the area on screen. Answers cite their sources.</p>
            <ul aria-label="Suggested questions" className="space-y-1">
              {STARTERS.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    onClick={() => send(q)}
                    className="group flex w-full items-center justify-between gap-2 rounded-lg border border-line bg-card px-3 py-2.5 text-left text-sm text-fg transition-colors hover:border-edge hover:bg-card-hover focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <span>{q}</span>
                    <span aria-hidden className="text-fg-3 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none">→</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {messages.map((m) => <Message key={m.id} message={m} />)}

        {chatStatus === "submitted" && <p className="text-xs text-fg-3" role="status">Thinking…</p>}

        {error && (
          <div role="alert" className="rounded-md border border-return bg-card p-3 text-sm text-return">
            <p>{error.message.includes("not_configured") ? "Ask is turned off right now." : "Something went wrong. Please try again."}</p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => { clearError(); void regenerate(); }} className="rounded border border-return bg-card px-2 py-0.5 text-xs font-medium hover:bg-card-hover focus-visible:outline-2 focus-visible:outline-return">
                Retry
              </button>
              <button type="button" onClick={clearError} className="rounded px-2 py-0.5 text-xs hover:bg-card-hover focus-visible:outline-2 focus-visible:outline-return">
                Dismiss
              </button>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex shrink-0 items-end gap-2 border-t border-line bg-panel-solid p-3"
      >
        <label htmlFor="chat-input" className="sr-only">Ask the assistant</label>
        <textarea
          id="chat-input"
          rows={2}
          value={input}
          disabled={disabled}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(input); }
          }}
          placeholder={status === null ? "Connecting…" : disabled ? "Assistant not configured" : "Ask about this map…"}
          className="min-h-12 min-w-0 flex-1 resize-none rounded-lg border border-edge bg-card px-3 py-2 text-sm text-fg placeholder:text-fg-3 focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50"
        />
        {busy ? (
          <button type="button" onClick={() => void stop()} className="min-h-10 shrink-0 rounded-md border border-edge bg-card px-3 py-2 text-sm font-medium text-fg hover:bg-card-hover focus-visible:outline-2 focus-visible:outline-accent">
            Stop
          </button>
        ) : (
          <button type="submit" disabled={disabled || !input.trim()} className="min-h-10 shrink-0 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg enabled:hover:bg-accent-hover disabled:bg-card-hover disabled:text-fg-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            Send
          </button>
        )}
      </form>
    </div>
  );
}
