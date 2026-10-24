"use client";
import { useEffect, useState } from "react";
import { CELL_METRICS, fetchRegionContext, fmtMetric, type RegionContext } from "@/lib/cell-context";

// Who lives in the region and how old its buildings are, next to the typical Boston block.
// Static context (census + assessor), not a model driver and not a cause. Loaded only when opened.

const SUMMED = new Set(["parcels", "units"]);

export default function RegionProfile({ cellIds }: { cellIds: string[] }) {
  const [open, setOpen] = useState(false);
  const key = cellIds.join(",");
  const [got, setGot] = useState<{ key: string; c?: RegionContext; error?: boolean } | null>(null);
  useEffect(() => {
    if (!open || got?.key === key) return;
    let live = true;
    fetchRegionContext(cellIds).then((c) => live && setGot({ key, c })).catch(() => live && setGot({ key, error: true }));
    return () => { live = false; };
  }, [open, key, cellIds, got?.key]);
  const c = got?.key === key ? got.c : undefined;
  const rows = c ? CELL_METRICS.filter((m) => c.attrs[m.key] !== undefined) : [];

  return (
    <details onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="min-h-10 cursor-pointer py-2 text-sm font-medium text-fg">People & buildings</summary>
      {got?.key === key && got.error && <p role="alert" className="text-danger">Could not load the block profile.</p>}
      {open && !got && <p aria-live="polite" className="text-fg-3">Loading…</p>}
      {c && (rows.length ? (
        <>
          <p className="mb-2 text-xs text-fg-3">{c.n_cells} blocks with data, compared with the typical (median) Boston block.</p>
          {(["Buildings", "People"] as const).map((g) => (
            <table key={g} className="mb-3 w-full text-left text-xs">
              <caption className="pb-1 text-left font-semibold text-fg">{g}</caption>
              <thead className="text-fg-3"><tr><th scope="col" className="font-normal">Value</th><th scope="col" className="text-right font-normal">Region</th><th scope="col" className="text-right font-normal">Typical block</th></tr></thead>
              <tbody>
                {rows.filter((m) => m.group === g).map((m) => {
                  const v = c.attrs[m.key]!, med = c.city_median[m.key];
                  const sum = SUMMED.has(m.key);
                  // "older/newer" past 10 years; "higher/lower" past 15% of the typical block. Totals aren't compared.
                  const note = sum || med === undefined ? ""
                    : m.unit === "year" ? (Math.abs(v - med) < 10 ? "" : v < med ? "older" : "newer")
                    : med === 0 || Math.abs(v - med) / Math.abs(med) < 0.15 ? "" : v > med ? "higher" : "lower";
                  return (
                    <tr key={m.key} className="border-t border-line">
                      <th scope="row" className="py-1 font-normal" title={m.source}>{m.label}{sum && <span className="text-fg-3"> (total)</span>}</th>
                      <td className="py-1 text-right font-mono tabular-nums text-fg">{fmtMetric(m, v)}{note && <span className="ml-1 font-sans text-fg-3">{note}</span>}</td>
                      <td className="py-1 text-right font-mono tabular-nums text-fg-3">{sum ? "—" : fmtMetric(m, med)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ))}
          <p className="text-xs text-fg-3">
            Census values are area-weighted from overlapping tracts; buildings are assessor parcels. Context for spotting patterns, not a cause or a model driver.
            Sources: {c.sources.map((s, i) => <span key={s.id}>{i > 0 && ", "}<a className="underline" href={s.url} target="_blank" rel="noreferrer">{s.name}</a></span>)}.
          </p>
        </>
      ) : <p>No census or parcel data for these blocks.</p>)}
    </details>
  );
}
