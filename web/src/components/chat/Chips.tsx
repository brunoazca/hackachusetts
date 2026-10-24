"use client";
import { useMap } from "@/lib/map-store";
import type { FeatureRef, SourceRef } from "@/lib/agent/types";

const chip = "inline-flex max-w-full items-center gap-1 truncate rounded-full border px-2 py-0.5 text-xs focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-neutral-900";

export function SourceChips({ sources }: { sources: SourceRef[] }) {
  if (!sources.length) return null;
  return (
    <ul aria-label="Sources" className="flex flex-wrap gap-1">
      {sources.map((s) => (
        <li key={s.id} className="max-w-full">
          {s.url ? (
            <a href={s.url} target="_blank" rel="noopener noreferrer" className={`${chip} border-neutral-300 text-neutral-700 hover:bg-neutral-100`}>
              <span aria-hidden>↗</span>
              <span className="truncate">{s.name ?? s.id}</span>
              <span className="sr-only">(source, opens in a new tab)</span>
            </a>
          ) : (
            <span className={`${chip} border-dashed border-neutral-300 text-neutral-600`} title="Source id without a link">
              {s.name ?? s.id}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

const MAX_FEATURES = 12;

export function FeatureChips({ features }: { features: FeatureRef[] }) {
  const select = useMap((s) => s.select);
  const flyTo = useMap((s) => s.flyTo);
  if (!features.length) return null;
  const shown = features.slice(0, MAX_FEATURES);
  return (
    <ul aria-label="Referenced map features" className="flex flex-wrap gap-1">
      {shown.map((f) => (
        <li key={`${f.kind}:${f.id}`} className="max-w-full">
          <button
            type="button"
            onClick={() => {
              if (f.lat != null && f.lon != null) flyTo({ lat: f.lat, lon: f.lon, zoom: 16 });
              select({ kind: f.kind, id: f.id });
            }}
            className={`${chip} border-sky-300 bg-sky-50 text-sky-900 hover:bg-sky-100`}
            aria-label={`Select ${f.label} on the map`}
          >
            <span aria-hidden>◎</span>
            <span className="truncate">{f.label}</span>
          </button>
        </li>
      ))}
      {features.length > MAX_FEATURES && (
        <li className="px-1 text-xs text-neutral-600">+{features.length - MAX_FEATURES} more</li>
      )}
    </ul>
  );
}
