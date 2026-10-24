"use client";
import { useEffect, useState } from "react";
import { booleanPointInPolygon } from "@turf/turf";
import categories from "@/lib/categories.json";
import { useMap, type SiteRow } from "@/lib/map-store";
import { fetchForecast, fmtWeek, type ForecastCellProps } from "@/lib/forecast";
import { fetchIncidents, fetchSiteQueue } from "@/lib/queries";
import { BandPill } from "@/components/ui/bits";

// The three questions every card answers, so a report, a place and a block all read the same way:
//   So far    — what is already here (reports filed in the chosen period)
//   Came back — repeat places in reach (from the recheck queue)
//   Next      — what the model expects for the block around this point
// A card drops in whichever of these it does not already answer itself. Owner: map track.

const CATS = categories.incident_categories as Record<string, { label: string }>;
const HALF = { lat: 0.00113, lon: 0.00152 }; // ~125 m: half of one 250 m model block
// The whole recheck queue, fetched once: the store only holds the rows the Act list is showing.
let queue: Promise<SiteRow[]> | null = null;
const fullQueue = () => (queue ??= fetchSiteQueue(300).catch(() => { queue = null; return []; }));
const box = (lon: number, lat: number): [number, number, number, number] => [lon - HALF.lon, lat - HALF.lat, lon + HALF.lon, lat + HALF.lat];

function Title({ kind, children }: { kind: "So far" | "Came back" | "Next"; children?: React.ReactNode }) {
  const tone = kind === "Next" ? "text-forecast" : kind === "Came back" ? "text-return" : "text-fg-2";
  return (
    <h3 className="flex items-baseline gap-1.5 text-[12px] font-semibold text-fg-2">
      <span className={`font-bold uppercase tracking-wide ${tone}`}>{kind}</span>
      {children && <span>· {children}</span>}
    </h3>
  );
}

function periodLabel(since: string, until: string) {
  const days = Math.round((Date.parse(until) - Date.parse(since)) / 86400000);
  return days <= 8 ? "last week" : days <= 31 ? "last month" : days <= 92 ? "last 3 months" : days <= 366 ? "last year" : "all time";
}

/** So far: reports already filed inside this block in the chosen period. */
export function SoFarHere({ lon, lat }: { lon: number; lat: number }) {
  const since = useMap((s) => s.filters.since);
  const until = useMap((s) => s.filters.until);
  const key = `${lon.toFixed(5)},${lat.toFixed(5)}:${since}:${until}`;
  const [got, setGot] = useState<{ key: string; n: number; open: number; top: [string, number][] } | null>(null);
  useEffect(() => {
    let live = true;
    fetchIncidents(box(lon, lat), Object.keys(CATS), since, until)
      .then((fc) => {
        if (!live) return;
        const counts: Record<string, number> = {};
        let open = 0;
        for (const f of fc.features) {
          counts[f.properties.category] = (counts[f.properties.category] ?? 0) + 1;
          if (f.properties.status === "open") open++;
        }
        setGot({ key, n: fc.features.length, open, top: Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3) });
      })
      .catch(() => live && setGot({ key, n: 0, open: 0, top: [] }));
    return () => { live = false; };
  }, [lon, lat, since, until, key]);
  const r = got?.key === key ? got : null;
  return (
    <section className="pt-1">
      <Title kind="So far">in this block · {periodLabel(since, until)}</Title>
      {!r ? <p className="mt-1 text-fg-3">Counting…</p> : r.n === 0 ? (
        <p className="mt-1 text-fg-3">No reports filed in this block in the period.</p>
      ) : (
        <p className="mt-1 text-[13px] text-fg">
          <b className="font-mono font-bold tabular-nums">{r.n}</b> report{r.n === 1 ? "" : "s"}{r.open > 0 && <>, <b className="font-mono font-bold tabular-nums text-return">{r.open}</b> still open</>}
          {r.top.length > 0 && <span className="text-fg-2"> · {r.top.map(([c, n]) => `${CATS[c]?.label ?? c} ${n}`).join(", ")}</span>}
        </p>
      )}
    </section>
  );
}

/** Came back: repeat places inside this block, from the recheck queue. */
export function CameBackHere({ lon, lat }: { lon: number; lat: number }) {
  const select = useMap((s) => s.select);
  const flyTo = useMap((s) => s.flyTo);
  const [sites, setSites] = useState<SiteRow[]>([]);
  useEffect(() => { let live = true; fullQueue().then((r) => live && setSites(r)); return () => { live = false; }; }, []);
  const near = sites.filter((r) => r.returns > 0 && Math.abs(r.lon - lon) <= HALF.lon && Math.abs(r.lat - lat) <= HALF.lat).slice(0, 3);
  return (
    <section className="pt-1">
      <Title kind="Came back">repeat places in this block</Title>
      {near.length === 0 ? <p className="mt-1 text-fg-3">No place here is on the recheck list.</p> : (
        <ul className="mt-1 space-y-1">
          {near.map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => { select({ kind: "site", id: r.id }); flyTo({ lat: r.lat, lon: r.lon, zoom: 16.5 }); }}
                className="flex w-full items-baseline justify-between gap-2 rounded-md border border-line bg-card px-2.5 py-1.5 text-left hover:bg-card-hover">
                <span className="truncate text-[13px] font-medium text-fg">{r.address_block ?? r.neighborhood ?? "Place"}</span>
                <span className="flex-none font-mono text-[11px] tabular-nums text-return">{r.returns} comeback{r.returns === 1 ? "" : "s"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Next: the forecast for the model block that contains this point, with a way into the block card. */
export function NextHere({ lon, lat }: { lon: number; lat: number }) {
  const select = useMap((s) => s.select);
  const setLayers = useMap((s) => s.setLayers);
  const key = `${lon.toFixed(5)},${lat.toFixed(5)}`;
  const [got, setGot] = useState<{ key: string; week: string | null; cell: ForecastCellProps | null } | null>(null);
  useEffect(() => {
    let live = true;
    fetchForecast(box(lon, lat), null, 0)
      .then((fc) => {
        if (!live) return;
        const f = fc.features.find((x) => booleanPointInPolygon([lon, lat], x)) ?? fc.features[0] ?? null;
        setGot({ key, week: (fc as unknown as { week?: string }).week ?? null, cell: f?.properties ?? null });
      })
      .catch(() => live && setGot({ key, week: null, cell: null }));
    return () => { live = false; };
  }, [lon, lat, key]);
  const r = got?.key === key ? got : null;
  return (
    <section className="pt-1">
      <Title kind="Next">this block{r?.week ? `, week of ${fmtWeek(r.week)}` : ""}</Title>
      {!r ? <p className="mt-1 text-fg-3">Looking up the forecast…</p> : !r.cell ? (
        <p className="mt-1 text-fg-3">No forecast for this block.</p>
      ) : (
        <button type="button" onClick={() => { setLayers({ priority: true }); select({ kind: "cell", id: r.cell!.id }); }}
          className="mt-1 flex w-full items-center gap-2.5 rounded-md border border-line bg-card px-2.5 py-2 text-left hover:bg-card-hover">
          <span className="font-mono text-[18px] font-bold tabular-nums text-fg">{r.cell.expected.toFixed(1)}</span>
          <span className="min-w-0 flex-1 text-[12px] leading-4 text-fg-2">
            reports expected <BandPill band={r.cell.band} />{r.cell.emerging ? " · emerging" : ""}
            {r.cell.label && <span className="block truncate text-fg-3">{r.cell.label}{r.cell.neighborhood ? ` · ${r.cell.neighborhood}` : ""}</span>}
          </span>
          <span className="flex-none text-[12px] font-semibold text-fg">Open block →</span>
        </button>
      )}
    </section>
  );
}
