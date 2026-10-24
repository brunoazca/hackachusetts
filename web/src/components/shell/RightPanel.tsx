"use client";
import { useEffect, useState } from "react";
import { useMap } from "@/lib/map-store";
import SidePanel from "./SidePanel";
import { CollapsedTab } from "./Collapse";

// Right panel (Inspect / Insights / Ask). Collapsible with the chevron or "]";
// a new map selection opens it again.

export default function RightPanel() {
  const [open, setOpen] = useState(true);
  const selection = useMap((s) => s.selection);
  const [lastSel, setLastSel] = useState(selection);
  if (selection !== lastSel) { setLastSel(selection); if (selection && !open) setOpen(true); }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName ?? "");
      if (!typing && !e.metaKey && !e.ctrlKey && e.key === "]") setOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return <CollapsedTab side="right" label="Details" onOpen={() => setOpen(true)} />;
  return (
    <aside
      aria-label="Details, insights and assistant"
      className="glass absolute bottom-3 right-3 top-[68px] z-30 flex w-[400px] flex-col overflow-hidden rounded-lg 2xl:w-[440px]"
    >
      <SidePanel onCollapse={() => setOpen(false)} />
    </aside>
  );
}
