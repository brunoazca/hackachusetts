"use client";
import { useMap } from "@/lib/map-store";
import InspectorPanel from "@/components/inspector/InspectorPanel";
import InsightsPanel from "@/components/insights/InsightsPanel";
import ChatPanel from "@/components/chat/ChatPanel";
import { CollapseButton } from "./Collapse";

const TABS = [
  { id: "inspector", label: "Inspect" },
  { id: "insights", label: "Insights" },
  { id: "chat", label: "Ask" },
] as const;

export default function SidePanel({ onCollapse }: { onCollapse?: () => void }) {
  const panel = useMap((s) => s.panel);
  const setPanel = useMap((s) => s.setPanel);
  return (
    <>
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <div role="tablist" aria-label="Side panel" className="inline-flex h-8 gap-0.5 rounded-md border border-line bg-card p-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={panel === t.id}
              onClick={() => setPanel(t.id)}
              className="rounded-sm border border-transparent px-3 text-[13px] font-medium text-fg-2 transition-colors duration-150 hover:text-fg aria-selected:border-edge aria-selected:bg-bg aria-selected:text-fg"
            >
              {t.label}
            </button>
          ))}
        </div>
        {onCollapse && <CollapseButton onClick={onCollapse} label="Hide panel (])" dir="right" />}
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
