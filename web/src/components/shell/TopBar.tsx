"use client";
import { useCallback, useEffect, useState } from "react";
import { fetchLiveStatus } from "@/lib/queries";
import { useMap, type Depth, type Mode } from "@/lib/map-store";
import { restoreTheme, useTheme } from "@/lib/theme-store";
import LineRat from "@/components/brand/LineRat";

// Top bar: three floating glass clusters (brand + live, mode controls, actions).
// Spec: docs/design/components/overlays-feedback.md (Live pill), controls.md (Segmented).

function ago(iso: string | null) {
  if (!iso) return "unknown";
  const min = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
}

export function Segmented<T extends string>({ label, value, options, onChange, size = "md" }: {
  label: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label={label} className={`flex gap-0.5 rounded-md border border-line bg-card p-0.5 ${size === "sm" ? "h-8" : "h-9"}`}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className="rounded-sm border border-transparent px-2.5 text-[13px] font-medium text-fg-2 transition-colors duration-150 hover:text-fg aria-checked:border-edge aria-checked:bg-bg aria-checked:text-fg"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function TopBar() {
  const mode = useMap((s) => s.mode);
  const setMode = useMap((s) => s.setMode);
  const depth = useMap((s) => s.depth);
  const setDepth = useMap((s) => s.setDepth);
  const setPanel = useMap((s) => s.setPanel);
  const theme = useTheme((s) => s.theme);
  const toggleTheme = useTheme((s) => s.toggle);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [, tick] = useState(0);

  useEffect(() => {
    restoreTheme();
    fetchLiveStatus().then((s) => setUpdatedAt(s.updatedAt));
    const t = setInterval(() => tick((n) => n + 1), 30000);
    const onKey = (e: KeyboardEvent) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName ?? "");
      if (!typing && !e.metaKey && !e.ctrlKey && (e.key === "t" || e.key === "T")) useTheme.getState().toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => { clearInterval(t); window.removeEventListener("keydown", onKey); };
  }, []);

  const refresh = useCallback(async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      const body = await res.json();
      if (body.updatedAt) setUpdatedAt(body.updatedAt);
      setMsg(res.status === 429 ? "Already up to date" : res.ok ? "Updated" : body.error ?? "Refresh failed");
    } catch {
      setMsg("Refresh failed");
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <header className="pointer-events-none absolute inset-x-3 top-3 z-40 flex h-11 items-center gap-3">
      <div className="glass pointer-events-auto flex h-11 items-center gap-2.5 rounded-[12px] pl-3 pr-2">
        <LineRat width={36} className="text-fg" />
        <h1 className="text-[18px] font-bold leading-none tracking-[-0.02em] text-fg">Piper<span className="text-return">.</span></h1>
        <span className="hidden text-[13px] text-fg-3 xl:inline">Boston · Cambridge · Somerville</span>
        <span className="ml-1 flex h-7 items-center gap-2 rounded-full border border-line bg-card px-2.5 font-mono text-xs text-fg-2">
          <span aria-hidden className="h-1.5 w-1.5 animate-live rounded-full bg-return" />
          <span aria-live="polite">Live · updated {ago(updatedAt)}</span>
        </span>
      </div>

      <div className="glass pointer-events-auto mx-auto flex h-11 items-center gap-2 rounded-[12px] px-1.5">
        <Segmented<Mode>
          label="Mode"
          value={mode}
          options={[{ id: "assess", label: "Assess" }, { id: "act", label: "Act" }]}
          onChange={(m) => { setMode(m); setPanel("inspector"); }}
        />
        <Segmented<Depth>
          label="Depth"
          value={depth}
          options={[{ id: "simple", label: "Simple" }, { id: "explore", label: "Explore" }]}
          onChange={setDepth}
        />
      </div>

      <div className="glass pointer-events-auto flex h-11 items-center gap-1 rounded-[12px] px-1.5">
        <button
          type="button"
          onClick={refresh}
          disabled={busy}
          className="h-8 rounded-sm border border-edge px-3 text-[13px] font-semibold text-fg transition-colors duration-150 hover:bg-card-hover active:scale-[.98] disabled:opacity-40"
        >
          {busy ? "Refreshing…" : "Refresh"}
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "night" ? "Bone (light)" : "Night (dark)"} theme (T)`}
          title={`${theme === "night" ? "Bone" : "Night"} theme · T`}
          className="grid h-9 w-9 place-items-center rounded-md text-fg-2 transition-colors duration-150 hover:bg-card-hover hover:text-fg"
        >
          {theme === "night" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>
          )}
        </button>
        <span className="sr-only" aria-live="polite">{msg}</span>
        {msg && <span className="px-1 text-xs text-fg-3">{msg}</span>}
      </div>
    </header>
  );
}
