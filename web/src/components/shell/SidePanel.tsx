"use client";
import ChatPanel from "@/components/chat/ChatPanel";

// Right panel body: Ask (chat) only. Insight + detail are the left Insight panel.
export default function SidePanel({ onCollapse, bodyRef }: { onCollapse?: () => void; bodyRef?: React.Ref<HTMLDivElement> }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="h-full"><ChatPanel onCollapse={onCollapse} /></div>
      <div ref={bodyRef} />
    </div>
  );
}
