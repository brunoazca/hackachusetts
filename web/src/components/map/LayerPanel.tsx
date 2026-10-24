"use client";
import categories from "@/lib/categories.json";
import { useMap } from "@/lib/map-store";
import { markerDataUrl } from "./icons";
import { STRENGTH_STYLE, testedFor } from "./tested";
import { ERA_STOPS, HOUSING_RAMP } from "./ContextLayers";
import type { CoverageRow } from "@/lib/queries";

// Floating layer + date controls for the draft map.

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
  coverage: CoverageRow[];
  zoom: number;
};

const CITY_ABBR: [string, string][] = [["boston", "BOS"], ["cambridge", "CAM"], ["somerville", "SOM"]];

/** Which of the three cities have data for a layer (R: coverage registry). */
function CityBadges({ layer, coverage }: { layer: string; coverage: CoverageRow[] }) {
  if (!coverage.length) return null;
  const rows = coverage.filter((c) => c.layer === layer && (c.kind === "incident" || c.kind === "incident_history"));
  const has = new Set(rows.filter((c) => c.kind === "incident").map((c) => c.city));
  const span = (city: string) => {
    const mine = rows.filter((c) => c.city === city);
    const map = mine.find((c) => c.kind === "incident");
    const hist = mine.find((c) => c.kind === "incident_history");
    if (!map) return "No data";
    const yr = (d: string | null) => (d ?? "").slice(0, 7);
    return `${yr(map.first_date)} to ${yr(map.last_date)} on the map` + (hist ? `; forecast history from ${yr(hist.first_date)}` : "");
  };
  return (
    <span className="ml-1 inline-flex gap-0.5 align-middle" aria-label={`Data in: ${CITY_ABBR.filter(([c]) => has.has(c)).map(([c, a]) => `${a} (${span(c)})`).join(", ") || "none"}`}>
      {CITY_ABBR.map(([c, a]) => (
        <span key={c} title={span(c)} className={`rounded px-1 text-[10px] font-semibold leading-4 ${has.has(c) ? "bg-neutral-800 text-white" : "bg-neutral-100 text-neutral-500 line-through"}`}>{a}</span>
      ))}
    </span>
  );
}

function Ramp({ colors, label }: { colors: string[]; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden className="h-2.5 w-16 shrink-0 rounded-full" style={{ background: `linear-gradient(to right, ${colors.join(", ")})` }} />
      <span className="text-xs text-neutral-800">{label}</span>
    </div>
  );
}

export default function LayerPanel({ enabled, onChange, mode, onModeChange, count, loading, coverage, zoom }: Props) {
  const filters = useMap((s) => s.filters);
  const setFilters = useMap((s) => s.setFilters);
  const span = Math.round((Date.parse(filters.until) - Date.parse(filters.since)) / 86400000);

  return (
    <div className="absolute left-3 top-3 max-h-[calc(100%-1.5rem)] w-72 overflow-y-auto rounded-lg border border-neutral-200 bg-white/95 p-3 text-sm shadow-lg backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold">Layers</h2>
        <span className="text-xs text-neutral-700" aria-live="polite">
          {loading ? "Loading…" : `${count.toLocaleString()} in view`}
        </span>
      </div>

      <fieldset className="mb-3">
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
      </fieldset>

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
        const ids = Object.entries(CATS).filter(([id, c]) => c.group === g.id);
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
                  <CityBadges layer={id} coverage={coverage} />
                  <span className={`block text-xs ${STRENGTH_STYLE[testedFor(id).strength]}`}>{testedFor(id).text}</span>
                </span>
              </label>
            ))}
          </fieldset>
        );
      })}
      <fieldset className="mb-2">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">Buildings &amp; people</legend>
        <label className="flex cursor-pointer items-start gap-2 rounded px-1 py-0.5 hover:bg-neutral-50">
          <input type="checkbox" checked={!!enabled.ctx_housing} onChange={(e) => onChange({ ...enabled, ctx_housing: e.target.checked })} className="mt-1 accent-neutral-900" />
          <span aria-hidden className="mt-1 h-3 w-5 shrink-0 rounded-sm" style={{ background: `linear-gradient(to right, ${HOUSING_RAMP.join(", ")})` }} />
          <span className="min-w-0">
            <span className="block text-neutral-900">Old housing (% built before 1940)</span>
            <span className="block text-xs text-neutral-700">per census tract · ACS 2024 · BOS CAM SOM</span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 rounded px-1 py-0.5 hover:bg-neutral-50">
          <input type="checkbox" checked={!!enabled.ctx_buildings} onChange={(e) => onChange({ ...enabled, ctx_buildings: e.target.checked })} className="mt-1 accent-neutral-900" />
          <span aria-hidden className="mt-1 flex h-3 w-5 shrink-0 overflow-hidden rounded-sm">
            {ERA_STOPS.map(([, c]) => <span key={c} className="flex-1" style={{ background: c }} />)}
          </span>
          <span className="min-w-0">
            <span className="block text-neutral-900">Buildings by year built</span>
            <span className="block text-xs text-neutral-700">
              {enabled.ctx_buildings && zoom < 15 ? "zoom in to see buildings · " : ""}assessor parcels BOS CAM SOM · {ERA_STOPS.map(([, , l]) => l).join(" / ")}
            </span>
          </span>
        </label>
      </fieldset>

      <p className="mt-2 text-xs text-neutral-700">
        Each layer clusters on its own.{" "}
        Solid icon = open, faded = closed. Tested values: block-level partial correlation with rodent reports.
      </p>
    </div>
  );
}
