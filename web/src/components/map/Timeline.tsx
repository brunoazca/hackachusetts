"use client";
import { useEffect, useRef, useState } from "react";
import { useMap } from "@/lib/map-store";
import { rightInset, useUi } from "@/lib/ui-store";

// Time window as a timeline, not a row of "7 d / 30 d" chips: a strip from Jan 2023 to today with a
// draggable window (two handles), quick picks in plain words, and the range written out in full.
// Two native range inputs keep it keyboard and screen-reader friendly (arrows = 1 day, PgUp/PgDn = 1 month).

const DAY = 86400000;
const START = Date.UTC(2023, 0, 1);
// Module scope (evaluated once on the client), not during render.
const NOW = new Date();
const TODAY = Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth(), NOW.getUTCDate());
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
const nice = (t: number, year = true) =>
  new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", ...(year ? { year: "numeric" } : {}), timeZone: "UTC" });

const QUICK = [
  { label: "Last week", days: 7 },
  { label: "Last month", days: 30 },
  { label: "3 months", days: 90 },
  { label: "1 year", days: 365 },
  { label: "Everything", days: 0 },
];

export default function Timeline() {
  const filters = useMap((s) => s.filters);
  const setFilters = useMap((s) => s.setFilters);
  const appMode = useMap((s) => s.mode);
  const rightOpen = useUi((s) => s.rightOpen);
  const today = TODAY;
  const open = useUi((s) => s.timelineOpen);
  const setOpen = useUi((s) => s.setTimelineOpen);
  const total = Math.round((today - START) / DAY);

  const toIdx = (isoDate: string) => Math.min(total, Math.max(0, Math.round((Date.parse(isoDate) - START) / DAY)));
  const [lo, setLo] = useState(() => toIdx(filters.since));
  const [hi, setHi] = useState(() => toIdx(filters.until));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep in sync if someone else (the assistant, a finding) changes the window.
  const sinceIdx = toIdx(filters.since), untilIdx = toIdx(filters.until);
  const [synced, setSynced] = useState(`${sinceIdx}-${untilIdx}`);
  if (synced !== `${sinceIdx}-${untilIdx}`) { setSynced(`${sinceIdx}-${untilIdx}`); setLo(sinceIdx); setHi(untilIdx); }

  const commit = (a: number, b: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setFilters({ since: iso(START + a * DAY), until: iso(START + b * DAY) }), 250);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  // Map controls lift above the strip while it is open.
  useEffect(() => { document.documentElement.style.setProperty("--ctrl-bottom", open ? "112px" : "4px"); }, [open]);

  // Esc closes and hands focus back to the "When" button in the layer dock.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); document.getElementById("dock-when")?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const pick = (days: number) => {
    const a = days ? Math.max(0, total - days) : 0;
    setLo(a); setHi(total);
    setFilters({ since: iso(START + a * DAY), until: iso(today) });
  };
  const activeQuick = hi === total ? QUICK.find((q) => (q.days ? total - lo === q.days : lo === 0))?.label : undefined;

  const years = [];
  for (let y = 2023; y <= new Date(today).getUTCFullYear(); y++) years.push(y);
  const pct = (i: number) => (i / total) * 100;
  const span = hi - lo;

  return (
    <section
      id="timeline"
      aria-label="Time window"
      inert={!open}
      aria-hidden={!open}
      className={`glass absolute bottom-3 z-20 rounded-lg px-4 pb-3 pt-2.5 transition-[right,transform,opacity] duration-300 ease-[var(--ease-spring)] ${open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[calc(100%+16px)] opacity-0"}`}
      style={{ left: appMode === "act" ? 420 : 76, right: rightInset(rightOpen) }}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="min-w-0 text-[14px] text-fg">
          <span className="text-fg-3">Showing </span>
          <b className="font-semibold">{nice(START + lo * DAY, false)} – {nice(START + hi * DAY)}</b>
          <span className="text-fg-3"> · {span + 1} days</span>
        </p>
        <div role="radiogroup" aria-label="Quick picks" className="ml-auto flex flex-wrap items-center gap-1">
          {QUICK.map((q) => (
            <button
              key={q.label}
              type="button"
              role="radio"
              aria-checked={activeQuick === q.label}
              onClick={() => pick(q.days)}
              className="h-7 rounded-sm px-2.5 text-[12px] font-semibold text-fg-2 transition-colors duration-150 hover:bg-card-hover hover:text-fg aria-checked:bg-fg aria-checked:text-bg"
            >
              {q.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => { setOpen(false); document.getElementById("dock-when")?.focus(); }}
            aria-label="Close time window"
            className="ml-1 grid h-7 w-7 place-items-center rounded-sm text-fg-3 hover:bg-card-hover hover:text-fg"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Track */}
      <div className="relative mt-3 h-8">
        <div className="absolute inset-x-0 top-3 h-2 rounded-full bg-card" />
        <div className="absolute top-3 h-2 rounded-full bg-fg" style={{ left: `${pct(lo)}%`, width: `${Math.max(0.6, pct(hi) - pct(lo))}%` }} />
        {years.map((y) => {
          const i = Math.round((Date.UTC(y, 0, 1) - START) / DAY);
          return (
            <span key={y} aria-hidden className="absolute top-0 h-full" style={{ left: `${pct(i)}%` }}>
              <span className="absolute top-1 h-6 w-px bg-line" />
              <span className="absolute left-1 top-5 text-[11px] font-semibold text-fg-3">{y}</span>
            </span>
          );
        })}
        <input
          type="range" min={0} max={total} value={lo}
          aria-label="From"
          aria-valuetext={nice(START + lo * DAY)}
          onChange={(e) => { const v = Math.min(Number(e.target.value), hi - 1); setLo(v); commit(v, hi); }}
          className="piper-range absolute inset-x-0 top-0 h-8 w-full"
        />
        <input
          type="range" min={0} max={total} value={hi}
          aria-label="To"
          aria-valuetext={nice(START + hi * DAY)}
          onChange={(e) => { const v = Math.max(Number(e.target.value), lo + 1); setHi(v); commit(lo, v); }}
          className="piper-range absolute inset-x-0 top-0 h-8 w-full"
        />
      </div>
    </section>
  );
}
