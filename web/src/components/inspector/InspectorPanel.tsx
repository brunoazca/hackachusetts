"use client";
import { useEffect, useState } from "react";
import categories from "@/lib/categories.json";
import { useMap } from "@/lib/map-store";
import { fetchIncidentDetail, type IncidentDetail } from "@/lib/queries";
import { markerDataUrl } from "@/components/map/icons";
import SiteCase from "./SiteCase";
import ParcelCard from "./ParcelCard";

// Draft inspector: details of a selected report + other reports at the same address.
// Owner: map/inspector track — replace with the full site card later.

const CATS = categories.incident_categories as Record<string, { label: string; color: string }>;
const MODE_LABEL = { live: "Live", daily: "Daily", static: "Static" } as const;

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
}

export default function InspectorPanel() {
  const selection = useMap((s) => s.selection);
  const id = selection?.kind === "incident" ? selection.id : null;
  const [detail, setDetail] = useState<IncidentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let live = true;
    setDetail(null);
    fetchIncidentDetail(id)
      .then((d) => live && (setDetail(d), setError(null)))
      .catch((e) => live && setError(String(e)));
    return () => { live = false; };
  }, [id]);

  if (selection?.kind === "site") return <SiteCase key={selection.id} id={selection.id} />;
  if (selection?.kind === "place" && selection.id.startsWith("parcel:")) return <ParcelCard pid={selection.id.slice(7)} />;
  if (!id) {
    return (
      <div className="p-4 text-sm text-neutral-800">
        <h2 className="mb-1 text-base font-semibold text-neutral-900">Inspect</h2>
        <p>Click any point on the map to see the report, what the city did, and other reports at the same address.</p>
      </div>
    );
  }
  if (error) return <p role="alert" className="p-4 text-sm text-red-700">Could not load this report: {error}</p>;
  if (!detail) return <p className="p-4 text-sm text-neutral-700" aria-live="polite">Loading…</p>;

  const i = detail.incident;
  const cat = CATS[i.category];
  const days = i.closed_at ? Math.max(0, Math.round((Date.parse(i.closed_at) - Date.parse(i.opened_at)) / 86400000)) : null;

  return (
    <article className="space-y-4 p-4 text-sm" aria-live="polite">
      <header>
        <div className="mb-1 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={markerDataUrl(i.category)} alt="" aria-hidden className="h-6 w-6" />
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-700">{cat?.label ?? i.category}</span>
          <span className={`ml-auto rounded px-1.5 py-0.5 text-xs font-medium ${i.status === "open" ? "bg-red-100 text-red-800" : "bg-neutral-100 text-neutral-700"}`}>
            {i.status}
          </span>
        </div>
        <h2 className="text-lg font-semibold">{i.address_block ?? i.neighborhood ?? i.city}</h2>
        <p className="text-neutral-700">
          {i.neighborhood ? `${i.neighborhood} · ` : ""}{i.city}
          {i.geo_precision !== "point" && " · approximate location"}
        </p>
      </header>

      <dl className="grid grid-cols-3 gap-2">
        <div><dt className="text-xs text-neutral-700">Opened</dt><dd className="font-medium">{fmt(i.opened_at)}</dd></div>
        <div><dt className="text-xs text-neutral-700">Closed</dt><dd className="font-medium">{fmt(i.closed_at)}</dd></div>
        <div><dt className="text-xs text-neutral-700">Days to close</dt><dd className="font-medium">{days ?? "—"}</dd></div>
      </dl>

      {i.closure_note && (
        <section>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">What the city noted</h3>
          <p className="rounded-md bg-neutral-50 p-2 text-neutral-800">{i.closure_note}</p>
        </section>
      )}

      {detail.same_address.length > 0 && (
        <section>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">
            Other reports at this address ({detail.same_address.length})
          </h3>
          <ol className="space-y-1">
            {detail.same_address.map((o) => (
              <li key={o.id} className="rounded border border-neutral-100 p-2">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{CATS[o.category]?.label ?? o.category}</span>
                  <span className="text-neutral-700">{o.opened}{o.closed ? ` → ${o.closed}` : " · open"}</span>
                </div>
                {o.note && <p className="mt-0.5 line-clamp-2 text-xs text-neutral-800">{o.note}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}

      <footer className="border-t border-neutral-100 pt-2 text-xs text-neutral-700">
        Source:{" "}
        <a href={detail.source.url} target="_blank" rel="noreferrer" className="underline">{detail.source.name}</a>
        {" · "}
        <span className="font-medium">{MODE_LABEL[detail.source.update_mode]}</span>
        {detail.source.update_note ? ` — ${detail.source.update_note}` : ""}
      </footer>
    </article>
  );
}
