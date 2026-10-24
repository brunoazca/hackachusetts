"use client";
import categories from "@/lib/categories.json";
import { useMap } from "@/lib/map-store";

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
  { label: "30 d", days: 30 },
  { label: "90 d", days: 90 },
  { label: "1 yr", days: 365 },
  { label: "All", days: 365 * 4 },
];

type Props = {
  enabled: Record<string, boolean>;
  onChange: (next: Record<string, boolean>) => void;
  count: number;
  loading: boolean;
};

export default function LayerPanel({ enabled, onChange, count, loading }: Props) {
  const filters = useMap((s) => s.filters);
  const setFilters = useMap((s) => s.setFilters);
  const span = Math.round((Date.parse(filters.until) - Date.parse(filters.since)) / 86400000);

  return (
    <div className="absolute left-3 top-3 max-h-[calc(100%-1.5rem)] w-64 overflow-y-auto rounded-lg border border-neutral-200 bg-white/95 p-3 text-sm shadow-lg backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold">Layers</h2>
        <span className="text-xs text-neutral-500" aria-live="polite">
          {loading ? "Loading…" : `${count.toLocaleString()} in view`}
        </span>
      </div>

      <fieldset className="mb-3">
        <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">Period</legend>
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
        const ids = Object.entries(CATS).filter(([, c]) => c.group === g.id);
        if (!ids.length) return null;
        return (
          <fieldset key={g.id} className="mb-2">
            <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">{g.label}</legend>
            {ids.map(([id, c]) => (
              <label key={id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={!!enabled[id]}
                  onChange={(e) => onChange({ ...enabled, [id]: e.target.checked })}
                  className="accent-neutral-900"
                />
                <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                <span className="truncate">{c.label}</span>
              </label>
            ))}
          </fieldset>
        );
      })}
      <p className="mt-2 text-xs text-neutral-500">Bright = open · faded = closed. Somerville points are block centroids.</p>
    </div>
  );
}
