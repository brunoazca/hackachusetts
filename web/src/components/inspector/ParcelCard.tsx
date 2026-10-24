"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchSources } from "@/lib/queries";
import type { SourceEvidence } from "@/lib/evidence";
import SourceList from "@/components/evidence/SourceList";
import { Eyebrow, Skeleton, StatTile } from "@/components/ui/bits";

// Building facts for one Boston parcel. Owner name stays in the private schema (reveal, R3.9 — not built yet).

type Parcel = {
  pid: string; address_block: string | null; zip: string | null; land_use: string | null; yr_built: number | null;
  own_occ: boolean | null; units: number | null; city: string; source_id: string; sources: { name: string; update_note: string | null } | null;
};

export default function ParcelCard({ pid }: { pid: string }) {
  const [p, setP] = useState<Parcel | null>(null);
  const [sources, setSources] = useState<SourceEvidence[]>([]);
  useEffect(() => {
    let live = true;
    supabase.from("parcels").select("pid,address_block,zip,land_use,yr_built,own_occ,units,city,source_id,sources(name,update_note)").eq("pid", pid).maybeSingle()
      .then(async ({ data }) => {
        if (!live) return;
        setP(data as Parcel | null);
        if (data) {
          const result = await fetchSources([data.source_id]);
          if (live) setSources(result);
        }
      });
    return () => { live = false; };
  }, [pid]);
  if (!p) return <Skeleton label="Loading building…" rows={1} />;
  const age = p.yr_built ? new Date().getFullYear() - p.yr_built : null;
  return (
    <article className="space-y-3 p-4 text-sm" aria-live="polite">
      <header>
        <Eyebrow>Building</Eyebrow>
        <h2 className="mt-0.5 text-title font-bold text-fg">{p.address_block ?? "Building"}</h2>
        <p className="text-fg-3">{p.land_use ?? "Use unknown"} · {p.city}</p>
      </header>
      <div className="grid grid-cols-3 gap-2">
        <StatTile value={age !== null ? `${age} yr` : "—"} label={p.yr_built ? `built ${p.yr_built}` : "age unknown"} tone={age !== null && age >= 100 ? "text-warn" : undefined} />
        <StatTile value={p.units ?? "—"} label={p.units === 1 ? "home" : "homes"} />
        <StatTile value={p.own_occ == null ? "—" : p.own_occ ? "Yes" : "No"} label="owner lives here" />
      </div>
      <p className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-2 text-[13px] text-fg-2">
        <span aria-hidden>🔒</span><span>Owner name is hidden to protect privacy.</span>
      </p>
      <footer className="border-t border-line pt-2 text-xs text-fg-3">
        <SourceList sources={sources} unavailable={!sources.length} />
      </footer>
    </article>
  );
}
