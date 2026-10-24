"use client";
import categories from "@/lib/categories.json";
import { useMap } from "@/lib/map-store";
import { markerDataUrl } from "./icons";
import { STRENGTH_STYLE, testedFor } from "./tested";

// Floating layer + date controls for the draft map.

const CATS = categories.incident_categories as Record<string, { label: string; color: string; group: string }>;
const GROUPS: { id: string; label: string }[] = [
  { id: "rats", label: "Rat signals" },
  { id: "food", label: "Food & trash" },
  { id: "shelter", label: "Shelter" },
  { id: "displace", label: "Displacement" },
];

// Simple depth shows only the outcome and the signals that tested as predictive (R0.5).
export const SIMPLE_LAYERS = ["rodent", "dead_animal", "pest", "trash_storage"];

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
const MODES: { id: ViewMode; label: string }[] = [
  { id: "points", label: "Points" },
  { id: "heat", label: "Heatmap" },
  { id: "both", label: "Both" },
];

type Props = {
  enabled: Record<string, boolean>;
  onChange: (next: Record<string, boolean>) => void;
  mode: ViewMode;
  onModeChange: (m: ViewMode) => void;
  count: number;
  loading: boolean;
};

function Ramp({ colors, label }: { colors: string[]; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden className="h-2.5 w-16 shrink-0 rounded-full" style={{ background: `linear-gradient(to right, ${colors.join(", ")})` }} />
      <span className="text-xs text-neutral-800">{label}</span>
    </div>
  );
}

export default function LayerPanel({ enabled, onChange, mode, onModeChange, count, loading }: Props) {
  const filters = useMap((s) => s.filters);
  const setFilters = useMap((s) => s.setFilters);
  const explore = useMap((s) => s.depth) === "explore";
  const span = Math.round((Date.parse(filters.until) - Date.parse(filters.since)) / 86400000);

  return (
    <div className="absolute left-3 top-3 max-h-[calc(100%-1.5rem)] w-72 overflow-y-auto rounded-lg border border-neutral-200 bg-white/95 p-3 text-sm shadow-lg backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold">Layers</h2>
        <span className="text-xs text-neutral-700" aria-live="polite">
          {loading ? "Loading…" : `${count.toLocaleString()} in view`}
        </span>
      </div>

      {explore && <fieldset className="mb-3">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">View</legend>
        <div className="flex gap-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={mode === m.id}
              onClick={() => onModeChange(m.id)}
              className={`flex-1 rounded px-2 py-1 text-xs font-medium ${
                mode === m.id ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {mode !== "points" && (
          <div className="mt-2 space-y-1">
            <Ramp colors={HEAT_RAMPS.rats} label="Rat reports (rat signals checked)" />
            <Ramp colors={HEAT_RAMPS.evidence} label="Evidence (trash, shelter, displacement)" />
          </div>
        )}
      </fieldset>}

      <fieldset className="mb-3">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">Period</legend>
        <div className="flex gap-1">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              aria-pressed={Math.abs(span - p.days) < 2}
              onClick={() => setFilters({ since: daysAgo(p.days), until: iso(new Date()) })}
              className={`flex-1 rounded px-2 py-1 text-xs font-medium ${
                Math.abs(span - p.days) < 2 ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </fieldset>

      {GROUPS.map((g) => {
        const ids = Object.entries(CATS).filter(([id, c]) => c.group === g.id && (explore || SIMPLE_LAYERS.includes(id)));
        if (!ids.length) return null;
        return (
          <fieldset key={g.id} className="mb-2">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">{g.label}</legend>
            {ids.map(([id, c]) => (
              <label key={id} className="flex cursor-pointer items-start gap-2 rounded px-1 py-0.5 hover:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={!!enabled[id]}
                  onChange={(e) => onChange({ ...enabled, [id]: e.target.checked })}
                  className="mt-1 accent-neutral-900"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={markerDataUrl(id)} alt="" aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate text-neutral-900">{c.label}</span>
                  <span className={`block text-xs ${STRENGTH_STYLE[testedFor(id).strength]}`}>{testedFor(id).text}</span>
                </span>
              </label>
            ))}
          </fieldset>
        );
      })}
      <p className="mt-2 text-xs text-neutral-700">
        {explore ? "Each layer clusters on its own. " : "Simple view: the outcome and the signals that tested as predictive. Switch to Explore for every layer. "}
        Solid icon = open, faded = closed. Tested values: block-level partial correlation with rodent reports.
      </p>
    </div>
  );
}
