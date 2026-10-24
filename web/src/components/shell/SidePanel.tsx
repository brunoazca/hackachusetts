"use client";
import { useMap } from "@/lib/map-store";
import InspectorPanel from "@/components/inspector/InspectorPanel";
import InsightsPanel from "@/components/insights/InsightsPanel";
import ChatPanel from "@/components/chat/ChatPanel";

const TABS = [
  { id: "inspector", label: "Inspect" },
  { id: "insights", label: "Insights" },
  { id: "chat", label: "Ask" },
] as const;

export default function SidePanel() {
  const panel = useMap((s) => s.panel);
  const setPanel = useMap((s) => s.setPanel);
  return (
    <>
      <div role="tablist" aria-label="Side panel" className="flex border-b border-neutral-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={panel === t.id}
            onClick={() => setPanel(t.id)}
            className={`flex-1 px-3 py-2 text-sm font-medium ${panel === t.id ? "border-b-2 border-neutral-900 text-neutral-900" : "text-neutral-700 hover:text-neutral-900"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Chat stays mounted so the conversation survives tab switches. */}
        <div hidden={panel !== "chat"} className="h-full"><ChatPanel /></div>
        {panel === "inspector" && <InspectorPanel />}
        {panel === "insights" && <InsightsPanel />}
      </div>
    </>
  );
}
