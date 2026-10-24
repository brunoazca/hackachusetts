"use client";
import ChatPanel from "@/components/chat/ChatPanel";
import { CollapseButton } from "./Collapse";

// Right panel body: Ask (chat) only. Insight + detail are the left Insight panel.
export default function SidePanel({ onCollapse, bodyRef }: { onCollapse?: () => void; bodyRef?: React.Ref<HTMLDivElement> }) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <h2 role="tablist" aria-label="Side panel" className="flex h-8 items-center px-1 text-[13px] font-semibold text-fg">
          <span role="tab" aria-selected="true" tabIndex={0}>Ask</span>
        </h2>
        {onCollapse && <CollapseButton onClick={onCollapse} label="Hide panel (])" dir="right" />}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="h-full"><ChatPanel /></div>
        <div ref={bodyRef} />
      </div>
    </>
  );
}
