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

export default function SidePanel({ onCollapse, bodyRef }: { onCollapse?: () => void; bodyRef?: React.Ref<HTMLDivElement> }) {
  const panel = useMap((s) => s.panel);
  const setPanel = useMap((s) => s.setPanel);
  return (
    <>
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <div role="tablist" aria-label="Side panel" className="inline-flex h-8 gap-0.5 rounded-md border border-line bg-card p-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`side-tab-${t.id}`}
              aria-controls={`side-content-${t.id}`}
              aria-selected={panel === t.id}
              tabIndex={panel === t.id ? 0 : -1}
              onClick={() => setPanel(t.id)}
              onKeyDown={(e) => {
                const index = TABS.findIndex((tab) => tab.id === t.id);
                const next = e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1
                  : e.key === "ArrowRight" ? (index + 1) % TABS.length
                  : e.key === "ArrowLeft" ? (index - 1 + TABS.length) % TABS.length : null;
                if (next === null) return;
                e.preventDefault();
                setPanel(TABS[next].id);
                e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
              }}
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
        <div id="side-content-chat" role="tabpanel" aria-labelledby="side-tab-chat" hidden={panel !== "chat"} className="h-full" tabIndex={0}><ChatPanel /></div>
        {/* Measured by RightPanel so the panel is only as tall as what it shows. */}
        <div ref={bodyRef}>
          <div id="side-content-inspector" role="tabpanel" aria-labelledby="side-tab-inspector" hidden={panel !== "inspector"} tabIndex={0}>
            {panel === "inspector" && <InspectorPanel />}
          </div>
          <div id="side-content-insights" role="tabpanel" aria-labelledby="side-tab-insights" hidden={panel !== "insights"} tabIndex={0}>
            {panel === "insights" && <InsightsPanel />}
          </div>
        </div>
      </div>
    </>
  );
}
