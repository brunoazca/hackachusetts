"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Building facts for one Boston parcel. Owner name stays in the private schema (reveal, R3.9 — not built yet).

type Parcel = { pid: string; address_block: string | null; zip: string | null; land_use: string | null; yr_built: number | null; own_occ: boolean | null; units: number | null };

export default function ParcelCard({ pid }: { pid: string }) {
  const [p, setP] = useState<Parcel | null>(null);
  useEffect(() => {
    supabase.from("parcels").select("pid,address_block,zip,land_use,yr_built,own_occ,units").eq("pid", pid).maybeSingle()
      .then(({ data }) => setP(data as Parcel | null));
  }, [pid]);
  if (!p) return <p className="p-4 text-sm text-neutral-700">Loading building…</p>;
  const age = p.yr_built ? new Date().getFullYear() - p.yr_built : null;
  return (
    <article className="space-y-3 p-4 text-sm" aria-live="polite">
      <header>
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-700">Building</span>
        <h2 className="text-lg font-semibold">{p.address_block ?? "Boston parcel"}</h2>
        <p className="text-neutral-700">{p.land_use ?? "—"}</p>
      </header>
      <dl className="grid grid-cols-3 gap-2">
        <div><dt className="text-xs text-neutral-700">Built</dt><dd className="font-semibold">{p.yr_built ?? "—"}{age ? ` (${age} yr)` : ""}</dd></div>
        <div><dt className="text-xs text-neutral-700">Units</dt><dd className="font-semibold">{p.units ?? "—"}</dd></div>
        <div><dt className="text-xs text-neutral-700">Owner lives here</dt><dd className="font-semibold">{p.own_occ == null ? "—" : p.own_occ ? "Yes" : "No"}</dd></div>
      </dl>
      <p className="rounded-md bg-neutral-50 p-2 text-neutral-800">Owner: <span className="select-none blur-sm">Hidden Owner Name LLC</span> <span className="text-xs text-neutral-700">(reveal coming)</span></p>
      <footer className="border-t border-neutral-100 pt-2 text-xs text-neutral-700">Source: Boston property assessment FY2026 (static).</footer>
    </article>
  );
}
