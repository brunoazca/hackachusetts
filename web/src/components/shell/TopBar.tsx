"use client";
import { useCallback, useEffect, useState } from "react";
import { fetchLiveStatus } from "@/lib/queries";
import { useMap, type Mode } from "@/lib/map-store";
import { restoreTheme, useTheme } from "@/lib/theme-store";
import LineRat from "@/components/brand/LineRat";

// Top bar for everyday users: name, what view you are in, and a plain "Updated 12 minutes ago"
// with one button to check for new reports. No jargon, no blinking dots.

function ago(iso: string | null) {
  if (!iso) return "a while ago";
  const min = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

export function Segmented<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: { id: T; label: string; hint?: string }[]; onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex h-9 gap-0.5 rounded-md border border-line bg-card p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          title={o.hint}
          onClick={() => onChange(o.id)}
          className="rounded-sm px-3 text-[13px] font-semibold text-fg-2 transition-colors duration-150 hover:text-fg aria-checked:bg-fg aria-checked:text-bg"
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
      setMsg(res.status === 429 ? "Already up to date" : res.ok ? "New reports loaded" : "Couldn't check right now");
    } catch {
      setMsg("Couldn't check right now");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 4000);
    }
  }, []);

  return (
    <header className="pointer-events-none absolute inset-x-3 top-3 z-40 flex h-11 items-center gap-3">
      <div className="glass pointer-events-auto flex h-11 items-center gap-2.5 rounded-lg pl-3 pr-3">
        <LineRat width={34} className="text-fg" accentTail />
        <h1 className="text-[18px] font-bold leading-none tracking-[-0.02em] text-fg">Piper<span className="text-return">.</span></h1>
        <span className="hidden text-[13px] text-fg-3 lg:inline">Rat reports in Boston, Cambridge &amp; Somerville</span>
      </div>

      <div className="glass pointer-events-auto mx-auto flex h-11 items-center rounded-lg px-1">
        <Segmented<Mode>
          label="View"
          value={mode}
          options={[
            { id: "assess", label: "Map", hint: "See every report on the map" },
            { id: "act", label: "Places to visit", hint: "Addresses where rats keep coming back" },
          ]}
          onChange={(m) => { setMode(m); setPanel("inspector"); }}
        />
      </div>

      <div className="glass pointer-events-auto flex h-11 items-center gap-1 rounded-lg pl-3 pr-1">
        <span className="text-[13px] text-fg-2" aria-live="polite">
          {busy ? "Checking for new reports…" : msg ?? <>Updated {ago(updatedAt)}</>}
        </span>
        <button
          type="button"
          onClick={refresh}
          disabled={busy}
          aria-label="Check for new reports"
          title="Check for new reports"
          className="grid h-9 w-9 place-items-center rounded-md text-fg-2 transition-colors duration-150 hover:bg-card-hover hover:text-fg disabled:opacity-40"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden className={busy ? "animate-spin" : ""}>
            <path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 4v5h-5" />
          </svg>
        </button>
        <span aria-hidden className="mx-0.5 h-5 w-px bg-line" />
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "night" ? "Use light colors" : "Use dark colors"}
          title={theme === "night" ? "Light colors (T)" : "Dark colors (T)"}
          className="grid h-9 w-9 place-items-center rounded-md text-fg-2 transition-colors duration-150 hover:bg-card-hover hover:text-fg"
        >
          {theme === "night" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>
          )}
        </button>
      </div>
    </header>
  );
}
