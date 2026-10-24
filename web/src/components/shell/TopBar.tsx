"use client";
import { useEffect } from "react";
import { restoreTheme, useTheme } from "@/lib/theme-store";
import { restoreMotion, useA11y } from "@/lib/a11y-store";
import PiperLogo from "@/components/brand/PiperLogo";

// Top bar: name and which view you are in. New reports are pulled in automatically every 5 minutes.

const REFRESH_MS = 5 * 60 * 1000;

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
          tabIndex={value === o.id ? 0 : -1}
          title={o.hint}
          onClick={() => onChange(o.id)}
          onKeyDown={(e) => {
            const index = options.findIndex((option) => option.id === o.id);
            const next = e.key === "Home" ? 0 : e.key === "End" ? options.length - 1
              : ["ArrowRight", "ArrowDown"].includes(e.key) ? (index + 1) % options.length
              : ["ArrowLeft", "ArrowUp"].includes(e.key) ? (index - 1 + options.length) % options.length : null;
            if (next === null) return;
            e.preventDefault();
            onChange(options[next].id);
            e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
          }}
          className="whitespace-nowrap rounded-sm px-3 text-[13px] font-semibold text-fg-2 transition-colors duration-150 hover:text-fg aria-checked:bg-fg aria-checked:text-bg"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function TopBar() {
  useEffect(() => {
    restoreTheme();
    restoreMotion();
    // Pull new reports every 5 minutes while the app is open (the route itself throttles to once per 5 min).
    const refresh = () => { fetch("/api/refresh", { method: "POST" }).catch(() => {}); };
    refresh();
    const t = setInterval(refresh, REFRESH_MS);
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = /INPUT|TEXTAREA|SELECT/.test(target?.tagName ?? "") || target?.isContentEditable;
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "t" || e.key === "T") useTheme.getState().toggle();
      if (e.key === "m" || e.key === "M") useA11y.getState().toggleMotion();
    };
    window.addEventListener("keydown", onKey);
    return () => { clearInterval(t); window.removeEventListener("keydown", onKey); };
  }, []);

  return (
    <header className="pointer-events-none absolute inset-x-3 top-3 z-40 grid grid-cols-[auto_1fr] items-center gap-2 sm:flex sm:gap-3">
      <div className="glass pointer-events-auto flex h-11 shrink-0 items-center gap-2.5 rounded-lg px-3">
        <h1 className="flex items-center">
          <PiperLogo />
        </h1>
        <span className="hidden text-[13px] text-fg-3 lg:inline">Rat reports in Boston, Cambridge &amp; Somerville</span>
      </div>


    </header>
  );
}
