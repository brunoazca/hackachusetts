"use client";
import categories from "@/lib/categories.json";
import { useMap } from "@/lib/map-store";
import { markerDataUrl } from "./icons";
import { STRENGTH_STYLE, testedFor } from "./tested";
import { ERA_STOPS, HOUSING_RAMP } from "./ContextLayers";
import type { CoverageRow } from "@/lib/queries";
import { useUi } from "@/lib/ui-store";
import { useMorph } from "@/lib/use-morph";
import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";

// Layer dock: a slim vertical rail of group buttons (rat signals, trash, shelter, works, buildings,
// period, view). Each opens one flyout with that group's toggles, so the map keeps its width.
// Keyboard: arrows move along the rail, Enter/Space opens, Esc closes and returns focus.

const CATS = categories.incident_categories as Record<string, { label: string; color: string; group: string }>;
const GROUPS: { id: string; label: string }[] = [
  { id: "rats", label: "Rat signals" },
  { id: "food", label: "Food & trash" },
  { id: "shelter", label: "Shelter" },
  { id: "displace", label: "Displacement" },
];

export function activeCategories(enabled: Record<string, boolean>) {
  return Object.keys(CATS).filter((id) => enabled[id]);
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => iso(new Date(Date.now() - n * 86400000));
const PRESETS = [
  { label: "7 d", days: 7 },
  { label: "30 d", days: 30 },
  { label: "90 d", days: 90 },
  { label: "1 yr", days: 365 },
  { label: "All", days: 365 * 4 },
];

export type ViewMode = "points" | "heat" | "both";
export const HEAT_RAMPS = {
  rats: ["#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"],
  evidence: ["#eff3ff", "#bdd7e7", "#6baed6", "#3182bd", "#08519c"],
};
const MODES: { id: ViewMode; label: string; hint: string }[] = [
  { id: "heat", label: "Hot spots", hint: "Where reports cluster across the city" },
  { id: "points", label: "Each report", hint: "One marker per report" },
  { id: "both", label: "Both", hint: "Hot spots with markers on top" },
];

type Props = {
  enabled: Record<string, boolean>;
  onChange: (next: Record<string, boolean>) => void;
  mode: ViewMode;
  onModeChange: (m: ViewMode) => void;
  causes: boolean;
  onCausesChange: (v: boolean) => void;
  count: number;
  loading: boolean;
  coverage: CoverageRow[];
  zoom: number;
};

const CITY_ABBR: [string, string][] = [["boston", "BOS"], ["cambridge", "CAM"], ["somerville", "SOM"]];

/** Which of the three cities have data for a layer (R: coverage registry). */
function CityBadges({ layer, coverage }: { layer: string; coverage: CoverageRow[] }) {
  if (!coverage.length) return null;
  const has = new Set(coverage.filter((c) => c.kind === "incident" && c.layer === layer).map((c) => c.city));
  return (
    <span className="font-mono" aria-label={`Data in: ${CITY_ABBR.filter(([c]) => has.has(c)).map(([, a]) => a).join(", ") || "none"}`}>
      {CITY_ABBR.filter(([c]) => has.has(c)).map(([, a]) => a).join(" ") || "no data"}
    </span>
  );
}

type DockId = "rats" | "food" | "shelter" | "displace" | "context" | "period" | "view";

/** One layer row: icon, name, one quiet meta line, switch. Whole row toggles. */
function LayerRow({ icon, label, meta, checked, onToggle }: { icon: ReactNode; label: string; meta?: ReactNode; checked: boolean; onToggle: (v: boolean) => void }) {
  return (
    <label className="-mx-1.5 grid min-h-10 cursor-pointer grid-cols-[20px_minmax(0,1fr)_32px] items-center gap-2.5 rounded-sm px-1.5 py-1 transition-colors duration-150 hover:bg-card-hover">
      {icon}
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium leading-[18px] text-fg" title={label}>{label}</span>
        {meta && <span className="block truncate text-[11px] leading-4 text-fg-3">{meta}</span>}
      </span>
      <input type="checkbox" role="switch" aria-label={label} className="piper-switch" checked={checked} onChange={(e) => onToggle(e.target.checked)} />
    </label>
  );
}

export default function LayerPanel({ enabled, onChange, mode, onModeChange, causes, onCausesChange, count, loading, coverage, zoom }: Props) {
  const filters = useMap((s) => s.filters);
  const setFilters = useMap((s) => s.setFilters);
  const [open, setOpen] = useState<DockId | null>(null);
  const flyoutId = useId();
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const flyRef = useRef<HTMLDivElement>(null);
  const span = Math.round((Date.parse(filters.until) - Date.parse(filters.since)) / 86400000);
  const timelineOpen = useUi((s) => s.timelineOpen);
  const setTimelineOpen = useUi((s) => s.setTimelineOpen);
  const whenLabel = span <= 8 ? "1 wk" : span <= 31 ? "1 mo" : span <= 92 ? "3 mo" : span <= 366 ? "1 yr" : span > 1000 ? "All" : `${Math.round(span / 30)} mo`;

  const groupIds = (g: string) => Object.entries(CATS).filter(([, c]) => c.group === g).map(([id]) => id);
  const onIn = (ids: string[]) => ids.filter((id) => enabled[id]).length;

  const dock: { id: DockId; label: string; icon: ReactNode; badge?: number }[] = [
    ...GROUPS.filter((g) => groupIds(g.id).length).map((g) => ({
      id: g.id as DockId,
      label: g.label,
      // eslint-disable-next-line @next/next/no-img-element
      icon: <img src={markerDataUrl(groupIds(g.id)[0])} alt="" aria-hidden className="h-6 w-6" />,
      badge: onIn(groupIds(g.id)),
    })),
    {
      id: "context", label: "Buildings & people",
      icon: <span aria-hidden className="flex h-5 w-6 overflow-hidden rounded-[3px]">{ERA_STOPS.map(([, c]) => <span key={c} className="flex-1" style={{ background: c }} />)}</span>,
      badge: (enabled.ctx_housing ? 1 : 0) + (enabled.ctx_buildings ? 1 : 0),
    },
    { id: "view" as DockId, label: `Show as: ${MODES.find((m) => m.id === mode)?.label ?? mode}`, icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden className="text-fg-2"><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" /></svg>
    ) },
  ];

  // Esc closes and returns focus to the dock button that opened the flyout.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { const o = open; setOpen(null); btnRefs.current[o]?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const onDockKey = (e: ReactKeyboardEvent, i: number) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const next = dock[(i + (e.key === "ArrowDown" ? 1 : dock.length - 1)) % dock.length];
    btnRefs.current[next.id]?.focus();
  };

  // Keep showing the last group while the flyout morphs closed.
  const [lastId, setLastId] = useState<DockId | null>(open);
  if (open && open !== lastId) setLastId(open);
  const shown = useMorph(!!open, flyRef, () => (lastId ? btnRefs.current[lastId] ?? null : null));
  const current = shown ? dock.find((d) => d.id === (open ?? lastId)) : undefined;
  const setAll = (ids: string[], v: boolean) => onChange({ ...enabled, ...Object.fromEntries(ids.map((id) => [id, v])) });

  return (
    <nav aria-label="Map layers" className="absolute left-3 top-[68px] z-20 flex items-start gap-2">
      {/* Rail */}
      <div className="glass flex w-[52px] flex-col items-center gap-1 rounded-lg p-1">
        {dock.map((d, i) => (
          <button
            key={d.id}
            ref={(el) => { btnRefs.current[d.id] = el; }}
            type="button"
            onClick={() => { setTimelineOpen(false); setOpen((o) => (o === d.id ? null : d.id)); }}
            onKeyDown={(e) => onDockKey(e, i)}
            aria-expanded={open === d.id}
            aria-controls={open === d.id ? flyoutId : undefined}
            aria-label={`${d.label}${d.badge ? `, ${d.badge} on` : ""}`}
            title={d.label}
            className="relative grid h-11 w-11 place-items-center rounded-md transition-[background-color,transform] duration-150 hover:bg-card-hover active:scale-95 aria-expanded:bg-card aria-expanded:ring-1 aria-expanded:ring-edge"
          >
            {d.icon}
            {!!d.badge && (
              <span aria-hidden className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-fg px-1 font-mono text-[10px] font-semibold leading-none text-bg">{d.badge}</span>
            )}
          </button>
        ))}
        <span aria-hidden className="my-0.5 h-px w-8 bg-line" />
        <button
          id="dock-when"
          type="button"
          onClick={() => { setOpen(null); setTimelineOpen((v) => !v); }}
          aria-expanded={timelineOpen}
          aria-controls="timeline"
          aria-label={`Time window: ${whenLabel}`}
          title="Time window"
          className="grid h-11 w-11 place-items-center rounded-md text-fg-2 transition-[background-color,transform] duration-150 hover:bg-card-hover hover:text-fg active:scale-95 aria-expanded:bg-card aria-expanded:text-fg aria-expanded:ring-1 aria-expanded:ring-edge"
        >
          <span className="flex flex-col items-center leading-none">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
            <span className="mt-0.5 font-mono text-[9px] font-semibold">{whenLabel}</span>
          </span>
        </button>
        <span className="mt-0.5 border-t border-line pt-1 text-center font-mono text-[10px] leading-3 text-fg-3" aria-live="polite" title="Reports in view">
          {loading ? "…" : count >= 1000 ? `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k` : count}
        </span>
      </div>

      {/* Flyout */}
      {current && (
        <section
          id={flyoutId}
          ref={flyRef}
          aria-label={current.label}
          className="glass w-72 overflow-hidden rounded-lg text-sm will-change-[transform,clip-path]"
        >
          <div className="overflow-y-auto p-3 [max-height:calc(100dvh-92px)]">
          <header className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-[14px] font-bold text-fg">{current.id === "period" ? "Period" : current.id === "view" ? "How to show reports" : current.label}</h2>
            <div className="flex items-center gap-1">
              {GROUPS.some((g) => g.id === current.id) && (() => {
                const ids = groupIds(current.id);
                const all = onIn(ids) === ids.length;
                return (
                  <button type="button" onClick={() => setAll(ids, !all)} className="h-7 rounded-sm px-2 text-[12px] font-semibold text-fg-2 hover:bg-card-hover hover:text-fg">
                    {all ? "None" : "All"}
                  </button>
                );
              })()}
              <button type="button" onClick={() => { setOpen(null); btnRefs.current[current.id]?.focus(); }} aria-label="Close" className="grid h-7 w-7 place-items-center rounded-sm text-fg-3 hover:bg-card-hover hover:text-fg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
          </header>

          {GROUPS.some((g) => g.id === current.id) && (
            <div>
              {groupIds(current.id).map((id) => {
                const t = testedFor(id);
                return (
                  <LayerRow
                    key={id}
                    // eslint-disable-next-line @next/next/no-img-element
                    icon={<img src={markerDataUrl(id)} alt="" aria-hidden className="h-5 w-5" />}
                    label={CATS[id].label}
                    meta={<><span className={STRENGTH_STYLE[t.strength]}>{t.text}</span>{coverage.length > 0 && <> · <CityBadges layer={id} coverage={coverage} /></>}</>}
                    checked={!!enabled[id]}
                    onToggle={(v) => onChange({ ...enabled, [id]: v })}
                  />
                );
              })}
              <p className="mt-2 text-[11px] leading-4 text-fg-3">Faded icon = closed. Tested = block-level partial correlation with rodent reports.</p>
            </div>
          )}

          {current.id === "context" && (
            <div>
              <LayerRow
                icon={<span aria-hidden className="h-3 w-5 rounded-[2px]" style={{ background: `linear-gradient(to right, ${HOUSING_RAMP.join(", ")})` }} />}
                label="Old housing (% before 1940)"
                meta="per census tract · ACS 2024 · BOS CAM SOM"
                checked={!!enabled.ctx_housing}
                onToggle={(v) => onChange({ ...enabled, ctx_housing: v })}
              />
              <LayerRow
                icon={<span aria-hidden className="flex h-3 w-5 overflow-hidden rounded-[2px]">{ERA_STOPS.map(([, c]) => <span key={c} className="flex-1" style={{ background: c }} />)}</span>}
                label="Buildings by year built"
                meta={`${enabled.ctx_buildings && zoom < 15 ? "zoom in to see · " : ""}Boston parcels`}
                checked={!!enabled.ctx_buildings}
                onToggle={(v) => onChange({ ...enabled, ctx_buildings: v })}
              />
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-fg-3">
                {ERA_STOPS.map(([, c, l]) => <span key={l} className="flex items-center gap-1"><span className="h-2 w-2 rounded-[2px]" style={{ background: c }} />{l}</span>)}
              </div>
            </div>
          )}

          {current.id === "period" && (
            <div role="radiogroup" aria-label="Period" className="grid grid-cols-5 gap-0.5 rounded-md border border-line bg-card p-0.5">
              {PRESETS.map((p) => {
                const on = Math.abs(span - p.days) < 2;
                return (
                  <button key={p.label} type="button" role="radio" aria-checked={on}
                    onClick={() => setFilters({ since: daysAgo(p.days), until: iso(new Date()) })}
                    className="h-8 rounded-sm text-[12px] font-medium text-fg-2 hover:text-fg aria-checked:bg-fg aria-checked:text-bg">
                    {p.label}
                  </button>
                );
              })}
            </div>
          )}

          {current.id === "view" && (
            <div className="space-y-2">
              <div role="radiogroup" aria-label="How to show reports" className="flex flex-col gap-1">
                {MODES.map((m) => (
                  <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} onClick={() => onModeChange(m.id)}
                    className="flex items-center gap-3 rounded-md border border-line px-3 py-2 text-left transition-colors duration-150 hover:bg-card-hover aria-checked:border-fg aria-checked:bg-card">
                    <span aria-hidden className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 ${mode === m.id ? "border-fg bg-fg shadow-[inset_0_0_0_2px_var(--p-panel-solid)]" : "border-edge"}`} />
                    <span>
                      <span className="block text-[13px] font-semibold text-fg">{m.label}</span>
                      <span className="block text-[11px] text-fg-3">{m.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
              <LayerRow
                icon={<span aria-hidden className="h-3 w-5 rounded-[2px]" style={{ background: `linear-gradient(to right, ${HEAT_RAMPS.evidence.join(", ")})` }} />}
                label="Show likely causes"
                meta="Trash, vacant lots, construction near reports"
                checked={causes}
                onToggle={onCausesChange}
              />
            </div>
          )}
          </div>
        </section>
      )}
    </nav>
  );
}
