"use client";
import { useEffect, useRef, useState } from "react";
import { useMap } from "@/lib/map-store";
import { useUi } from "@/lib/ui-store";
import { useMorph } from "@/lib/use-morph";

// Time window as a compact card next to the layer dock (it grows out of the calendar button):
// the range in words, quick picks, a short two-handle slider for fine tuning, and exact dates.
// Native inputs throughout, so keyboard and screen readers get it for free.

const DAY = 86400000;
const START = Date.UTC(2016, 0, 1); // Boston 311 history (incidents_archive) starts in 2016
// Module scope (evaluated once on the client), not during render.
const NOW = new Date();
const TODAY = Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth(), NOW.getUTCDate());
const TOTAL = Math.round((TODAY - START) / DAY);
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
const nice = (t: number, year = true) =>
  new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", ...(year ? { year: "numeric" } : {}), timeZone: "UTC" });
const toIdx = (isoDate: string) => Math.min(TOTAL, Math.max(0, Math.round((Date.parse(isoDate) - START) / DAY)));

const QUICK = [
  { label: "Last week", days: 7 },
  { label: "Last month", days: 30 },
  { label: "Last 3 months", days: 90 },
  { label: "Last year", days: 365 },
  { label: "Everything", days: 0 },
];

export default function Timeline() {
  const filters = useMap((s) => s.filters);
  const setFilters = useMap((s) => s.setFilters);
  const open = useUi((s) => s.timelineOpen);
  const setOpen = useUi((s) => s.setTimelineOpen);
  const boxRef = useRef<HTMLElement>(null);
  useMorph(open, boxRef, () => document.getElementById("dock-when"));

  const [lo, setLo] = useState(() => toIdx(filters.since));
  const [hi, setHi] = useState(() => toIdx(filters.until));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stay in sync if something else (the assistant, a finding) changes the window.
  const key = `${toIdx(filters.since)}-${toIdx(filters.until)}`;
  const [synced, setSynced] = useState(key);
  if (synced !== key) { setSynced(key); setLo(toIdx(filters.since)); setHi(toIdx(filters.until)); }

  const commit = (a: number, b: number, now = false) => {
    if (timer.current) clearTimeout(timer.current);
    const go = () => setFilters({ since: iso(START + a * DAY), until: iso(START + b * DAY) });
    if (now) go(); else timer.current = setTimeout(go, 250);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); document.getElementById("dock-when")?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const pick = (days: number) => {
    const a = days ? Math.max(0, TOTAL - days) : 0;
    setLo(a); setHi(TOTAL); commit(a, TOTAL, true);
  };
  const activeQuick = hi === TOTAL ? QUICK.find((q) => (q.days ? TOTAL - lo === q.days : lo === 0))?.label : undefined;
  const pct = (i: number) => (i / TOTAL) * 100;
  const years: number[] = [];
  for (let y = 2018; y <= NOW.getUTCFullYear(); y += 2) years.push(y); // every other year: ten labels don't fit 320px
  const close = () => { setOpen(false); document.getElementById("dock-when")?.focus(); };

  return (
    <section
      id="timeline"
      ref={boxRef}
      aria-label="Dates"
      inert={!open}
      className="glass absolute left-[60px] top-0 w-[320px] overflow-hidden rounded-lg will-change-[transform,clip-path]"
    >
      <div className="p-3">
        <header className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-[14px] font-bold text-fg">Dates</h2>
            <p className="mt-0.5 text-[13px] text-fg-2" aria-live="polite">
              {nice(START + lo * DAY, false)} – {nice(START + hi * DAY)} <span className="text-fg-3">· {hi - lo + 1} days</span>
            </p>
          </div>
          <button type="button" onClick={close} aria-label="Close dates" className="grid h-7 w-7 place-items-center rounded-sm text-fg-3 hover:bg-card-hover hover:text-fg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </header>

        <div role="radiogroup" aria-label="Quick picks" className="mt-3 grid grid-cols-2 gap-1">
          {QUICK.map((q, i) => (
            <button
              key={q.label}
              type="button"
              role="radio"
              aria-checked={activeQuick === q.label}
              onClick={() => pick(q.days)}
              className={`h-8 rounded-sm border border-line px-2.5 text-left text-[12px] font-semibold text-fg-2 transition-colors duration-150 hover:bg-card-hover hover:text-fg aria-checked:border-fg aria-checked:bg-fg aria-checked:text-bg ${i === QUICK.length - 1 ? "col-span-2" : ""}`}
            >
              {q.label}
            </button>
          ))}
        </div>

        <p className="mt-3 text-[11px] font-semibold text-fg-3">Or drag to pick your own dates</p>
        <div className="relative mt-1 h-9">
          <div className="absolute inset-x-0 top-[13px] h-1.5 rounded-full bg-card" />
          <div className="absolute top-[13px] h-1.5 rounded-full bg-fg" style={{ left: `${pct(lo)}%`, width: `${Math.max(1, pct(hi) - pct(lo))}%` }} />
          {years.map((y) => {
            const i = Math.round((Date.UTC(y, 0, 1) - START) / DAY);
            return (
              <span key={y} aria-hidden className="absolute top-6 -translate-x-1/2 text-[10px] font-semibold text-fg-3" style={{ left: `${pct(i)}%` }}>{y}</span>
            );
          })}
          <input
            type="range" min={0} max={TOTAL} value={lo}
            aria-label="From" aria-valuetext={nice(START + lo * DAY)}
            onChange={(e) => { const v = Math.min(Number(e.target.value), hi - 1); setLo(v); commit(v, hi); }}
            // Short windows put both thumbs on the same pixel; near the end only "From" can move, so it must be the one on top.
            className={`piper-range absolute inset-x-0 top-0 h-7 w-full ${lo > TOTAL / 2 ? "z-10" : ""}`}
          />
          <input
            type="range" min={0} max={TOTAL} value={hi}
            aria-label="To" aria-valuetext={nice(START + hi * DAY)}
            onChange={(e) => { const v = Math.max(Number(e.target.value), lo + 1); setHi(v); commit(lo, v); }}
            className="piper-range absolute inset-x-0 top-0 h-7 w-full"
          />
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="text-[11px] font-semibold text-fg-3">
            From
            <input
              type="date" aria-label="From date" min={iso(START)} max={iso(TODAY)} value={iso(START + lo * DAY)}
              onChange={(e) => { if (!e.target.value) return; const v = Math.min(toIdx(e.target.value), hi - 1); setLo(v); commit(v, hi, true); }}
              className="mt-0.5 block h-8 w-full rounded-sm border border-edge bg-card px-2 font-mono text-[12px] text-fg"
            />
          </label>
          <label className="text-[11px] font-semibold text-fg-3">
            To
            <input
              type="date" aria-label="To date" min={iso(START)} max={iso(TODAY)} value={iso(START + hi * DAY)}
              onChange={(e) => { if (!e.target.value) return; const v = Math.max(toIdx(e.target.value), lo + 1); setHi(v); commit(lo, v, true); }}
              className="mt-0.5 block h-8 w-full rounded-sm border border-edge bg-card px-2 font-mono text-[12px] text-fg"
            />
          </label>
        </div>
      </div>
    </section>
  );
}
