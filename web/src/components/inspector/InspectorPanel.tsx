"use client";
import { useEffect, useState } from "react";
import categories from "@/lib/categories.json";
import { useMap } from "@/lib/map-store";
import { fetchIncidentDetail, type IncidentDetail } from "@/lib/queries";
import { markerDataUrl } from "@/components/map/icons";
import SiteCase from "./SiteCase";
import ParcelCard from "./ParcelCard";
import CellCard from "./CellCard";
import { formatDate as fmt } from "@/lib/dates";
import SourceList from "@/components/evidence/SourceList";
import { Skeleton } from "@/components/ui/bits";
import { NextHere } from "./HereSections";

// Draft inspector: details of a selected report + other reports at the same address.
// Owner: map/inspector track — replace with the full site card later.

const CATS = categories.incident_categories as Record<string, { label: string; color: string }>;
export default function InspectorPanel() {
  const selection = useMap((s) => s.selection);
  const at = useMap((s) => s.selectionAt);
  const id = selection?.kind === "incident" ? selection.id : null;
  const [result, setResult] = useState<{ id: string; detail?: IncidentDetail | null; error?: string; at?: number } | null>(null);

  useEffect(() => {
    if (!id) return;
    let live = true;
    fetchIncidentDetail(id)
      .then((detail) => live && setResult({ id, detail, at: Date.now() }))
      .catch((e) => live && setResult({ id, error: String(e) }));
    return () => { live = false; };
  }, [id]);

  if (selection?.kind === "site") return <SiteCase key={selection.id} id={selection.id} />;
  if (selection?.kind === "cell") return <CellCard id={selection.id} />;
  if (selection?.kind === "place" && selection.id.startsWith("parcel:")) return <ParcelCard key={selection.id} pid={selection.id.slice(7)} />;
  if (!id) {
    return (
      <div className="p-4 text-sm text-fg-2">
        <h2 className="mb-1 text-base font-semibold text-fg">Pick a place</h2>
        <p>Choose a place from the recheck list, or tap a report on the map.</p>
      </div>
    );
  }
  if (result?.id === id && result.error) return <p role="alert" className="p-4 text-sm text-return">Could not load this report. Please try again.</p>;
  const detail = result?.id === id ? result.detail : undefined;
  if (detail === null) return <p className="p-4 text-sm text-fg-3">This report is no longer available.</p>;
  if (!detail) return <Skeleton label="Loading report…" rows={2} />;

  const i = detail.incident;
  const cat = CATS[i.category];
  const open = i.status === "open";
  const days = i.closed_at ? Math.max(0, Math.round((Date.parse(i.closed_at) - Date.parse(i.opened_at)) / 86400000)) : null;
  const openFor = !i.closed_at ? Math.max(0, Math.round(((result?.at ?? Date.parse(i.opened_at)) - Date.parse(i.opened_at)) / 86400000)) : null;

  return (
    <article className="space-y-4 p-4 text-sm" aria-live="polite">
      <header>
        <div className="mb-1.5 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={markerDataUrl(i.category)} alt="" aria-hidden className="h-6 w-6" />
          <span className="text-eyebrow font-semibold uppercase tracking-wide text-fg-3">{cat?.label ?? i.category}</span>
          <span className={`ml-auto flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${open ? "bg-red-100 text-return" : "bg-card-hover text-fg-2"}`}>
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${open ? "bg-return" : "bg-fg-3"}`} />{open ? "Open" : "Closed"}
          </span>
        </div>
        <h2 className="text-title font-bold text-fg">{i.address_block ?? i.neighborhood ?? i.city}</h2>
        <p className="text-fg-3">
          {i.neighborhood ? `${i.neighborhood} · ` : ""}{i.city}
          {i.geo_precision !== "point" && " · location is approximate"}
        </p>
      </header>

      {/* Opened → (days) → Closed, as one track */}
      <div className="rounded-xl border border-line bg-card p-3">
        <div className="flex items-center gap-2">
          <span aria-hidden className="h-2.5 w-2.5 flex-none rounded-full bg-fg" />
          <span aria-hidden className={`h-0.5 flex-1 rounded-full ${open ? "bg-[repeating-linear-gradient(90deg,var(--p-fg-3)_0_4px,transparent_4px_8px)]" : "bg-fg-3"}`} />
          <span className="flex-none rounded-full bg-card-hover px-2 py-0.5 font-mono text-[11px] tabular-nums text-fg-2">
            {days !== null ? `${days} day${days === 1 ? "" : "s"}` : `open ${openFor} day${openFor === 1 ? "" : "s"}`}
          </span>
          <span aria-hidden className={`h-0.5 flex-1 rounded-full ${open ? "bg-[repeating-linear-gradient(90deg,var(--p-fg-3)_0_4px,transparent_4px_8px)]" : "bg-fg-3"}`} />
          <span aria-hidden className={`h-2.5 w-2.5 flex-none rounded-full ${open ? "border-2 border-fg-3" : "bg-held"}`} />
        </div>
        <dl className="mt-1.5 flex justify-between text-xs">
          <div><dt className="text-fg-3">Reported</dt><dd className="font-medium text-fg">{fmt(i.opened_at)}</dd></div>
          <div className="text-right"><dt className="text-fg-3">Closed</dt><dd className="font-medium text-fg">{i.closed_at ? fmt(i.closed_at) : "Not yet"}</dd></div>
        </dl>
      </div>

      {i.closure_note && (
        <section>
          <h3 className="mb-1 text-[12px] font-semibold text-fg-2">What the city wrote</h3>
          <blockquote className="border-l-2 border-edge pl-3 text-[13px] leading-5 text-fg">{i.closure_note}</blockquote>
        </section>
      )}

      {detail.same_address.length > 0 && (
        <section>
          <h3 className="mb-1.5 flex items-baseline gap-1.5 text-[12px] font-semibold text-fg-2">
            <span className="font-bold uppercase tracking-wide">So far</span><span>· other reports at this address · {detail.same_address.length}</span>
          </h3>
          <ol className="relative space-y-2 border-l border-line pl-4">
            {detail.same_address.map((o) => (
              <li key={o.id} className="relative">
                <span aria-hidden className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-bg ${o.closed ? "bg-fg-3" : "bg-return"}`} />
                <div className="flex justify-between gap-2 text-xs">
                  <span className="font-medium text-fg">{CATS[o.category]?.label ?? o.category}</span>
                  <span className="flex-none font-mono tabular-nums text-fg-3">{fmt(o.opened)}{o.closed ? ` → ${fmt(o.closed)}` : " · open"}</span>
                </div>
                {o.note && <p className="mt-0.5 line-clamp-2 text-xs text-fg-2">{o.note}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {at && <NextHere lon={at[0]} lat={at[1]} />}

      <footer className="border-t border-line pt-2 text-xs text-fg-3">
        <SourceList sources={[detail.source, ...(detail.same_address_sources ?? [])].filter((x, k, all) => all.findIndex((y) => y.id === x.id) === k)} />
      </footer>
    </article>
  );
}
