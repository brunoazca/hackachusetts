"use client";
import { useEffect, useRef } from "react";
import { useMap } from "@/lib/map-store";

// Features-in-view list — the accessible twin of the map (R2.11, R9.1 and
// docs/design/accessibility.md §1: "The map has a twin"). It mirrors what the map
// draws, updates as you pan/zoom, syncs selection both ways, and is one key away (`L`).
//
// MapView fills `featuresInView`; selecting a row flies the map there and selects it,
// exactly like clicking the marker. A polite live region announces the count on change.

export default function FeatureList({ onClose }: { onClose: () => void }) {
  const features = useMap((s) => s.featuresInView);
  const select = useMap((s) => s.select);
  const flyTo = useMap((s) => s.flyTo);
  const selection = useMap((s) => s.selection);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the heading when the list opens, so keyboard users land inside it.
  useEffect(() => { headingRef.current?.focus(); }, []);

  // Esc closes and returns focus to the map region (handled by the opener).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const open = (f: (typeof features)[number]) => {
    select({ kind: f.kind, id: f.id });
    flyTo({ lat: f.lat, lon: f.lon, zoom: 16 });
  };

  return (
    <section
      aria-label="Features in view (list alternative to the map)"
      className="glass absolute bottom-3 left-3 top-[68px] z-30 flex w-96 flex-col overflow-hidden rounded-lg text-sm motion-reduce:transition-none"
    >
      <div className="flex items-start justify-between border-b border-line p-3">
        <div>
          <h2 ref={headingRef} tabIndex={-1} className="text-base font-semibold text-fg outline-none">
            Features in view
          </h2>
          <p className="mt-0.5 text-xs text-fg-2">
            A keyboard list of everything on the map right now. Selecting a row moves the map to it.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the list (Esc)"
          title="Close the list (Esc)"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-sm text-fg-3 transition-colors duration-150 hover:bg-card-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Screen readers hear the count whenever the view changes. */}
      <div aria-live="polite" className="sr-only">
        {features.length} feature{features.length === 1 ? "" : "s"} in view.
      </div>

      {features.length === 0 ? (
        <p className="p-3 text-fg-2">Nothing in view. Pan or zoom the map, or widen the date range.</p>
      ) : (
        <ol className="min-h-0 flex-1 overflow-y-auto" aria-label="Features currently in view">
          {features.map((f, i) => {
            const active = selection != null && "id" in selection && selection.id === f.id && selection.kind === f.kind;
            return (
              <li key={`${f.kind}:${f.id}`}>
                <button
                  type="button"
                  onClick={() => open(f)}
                  aria-current={active ? "true" : undefined}
                  className={`grid w-full grid-cols-[1.5rem_minmax(0,1fr)] items-start gap-2 border-b border-line/60 px-3 py-2 text-left transition-colors hover:bg-card-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${active ? "bg-card-hover" : ""}`}
                >
                  <span className="pt-0.5 font-mono text-xs font-semibold text-fg-3">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-fg">{f.label}</span>
                    <span className="block truncate text-xs text-fg-2">{f.detail}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
