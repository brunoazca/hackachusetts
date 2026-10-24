"use client";
import { useEffect, useMemo, useState } from "react";
import { useMap } from "@/lib/map-store";
import { fetchRankedCells, weekKey, type RankedCell } from "@/lib/priority";
import { fmtWeek } from "@/lib/forecast";
import { BAND_STYLE, InfoHint } from "@/components/ui/bits";
import { CollapseButton } from "@/components/shell/Collapse";

// Left panel: every block ranked by expected reports for the chosen week, strongest first.
// Tapping a row selects the block (its Detail opens) and the map zooms to it. The grid on the map
// uses the same ranking, so the numbers agree. Sits to the right of the layer rail. Owner: map track.

const LEFT = 12 + 52 + 8; // rail at left-3, 52 px wide, 8 px gap
const SHOW = 60;

export default function BlockQueue({ hidden = false }: { hidden?: boolean }) {
  const week = weekKey(useMap((s) => s.forecastWeek));
  const select = useMap((s) => s.select);
  const selection = useMap((s) => s.selection);
  const flyTo = useMap((s) => s.flyTo);
  const [rows, setRows] = useState<{ week: string | null; cells: RankedCell[]; label: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hood, setHood] = useState("");
  const [open, setOpen] = useState(true);

  // One retry after 4 s: the database occasionally answers 500 while a teammate deploys a function.
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    fetchRankedCells(week)
      .then((fc) => live && setRows({ week, cells: fc.features.map((f) => f.properties), label: (fc as unknown as { week?: string }).week ?? week }))
      .catch((e) => {
        if (!live) return;
        const msg = typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : String(e);
        if (attempt < 1) timer = setTimeout(() => setAttempt((n) => n + 1), 4000);
        else setError(msg);
      });
    return () => { live = false; if (timer) clearTimeout(timer); };
  }, [week, attempt]);

  const cells = useMemo(() => (rows?.week === week ? rows.cells : []), [rows, week]);
  const hoods = useMemo(() => [...new Set(cells.map((c) => c.neighborhood).filter(Boolean) as string[])].sort(), [cells]);
  const shown = useMemo(() => cells.filter((c) => !hood || c.neighborhood === hood).slice(0, SHOW), [cells, hood]);
  const emerging = cells.filter((c) => c.emerging).length;
  const selectedId = selection?.kind === "cell" ? selection.id : null;

  const pick = (c: RankedCell) => {
    select({ kind: "cell", id: c.id });
    flyTo({ lat: c.lat, lon: c.lon, zoom: 15.5 });
  };

  if (hidden) return null;
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="map-secondary-panel glass absolute z-20 flex h-10 items-center gap-2 rounded-lg px-3 text-[13px] font-semibold text-fg transition-colors hover:bg-card-hover"
        style={{ left: LEFT, top: "var(--shell-top)" }}
      >
        Blocks <span className="font-mono text-[11px] font-normal text-fg-3">{cells.length ? `${cells.length} ranked` : ""}</span>
      </button>
    );
  }
  return (
    <div
      className="map-secondary-panel glass absolute bottom-3 top-(--shell-top) z-20 flex w-80 max-w-[calc(100%-160px)] flex-col overflow-hidden rounded-lg text-sm"
      style={{ left: LEFT }}
    >
      <div className="border-b border-line p-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-1 text-base font-semibold text-fg"><CollapseButton onClick={() => setOpen(false)} label="Hide block list" dir="left" />Blocks to check</h2>
          <InfoHint label="How this list works">
            <p>Every 250 m block, ranked by the <b className="text-fg">reports the model expects</b> for the chosen week. Highest first.</p>
            <p className="mt-1.5"><b className="text-fg">Emerging</b>: a high forecast with almost no recent reports, so it may be new.</p>
            <p className="mt-1.5">Tap a block to zoom to it. Its Detail shows what is there so far, which places came back, and why the model ranks it.</p>
          </InfoHint>
        </div>
        <p className="mt-0.5 text-xs text-fg-2">
          Ranked by expected reports{rows?.label ? `, week of ${fmtWeek(rows.label)}` : ""}. Counts reports from people, not rats.
        </p>
        <div className="mt-2.5 flex items-center gap-2">
          {emerging > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-card px-2 py-0.5 text-xs font-semibold text-forecast">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-forecast" />{emerging} emerging
            </span>
          )}
          <span className="text-xs text-fg-3">{shown.length} of {cells.length}</span>
          <select
            aria-label="Neighborhood"
            value={hood}
            onChange={(e) => setHood(e.target.value)}
            className="ml-auto min-w-0 max-w-[50%] rounded-full border border-line bg-card px-2.5 py-1 text-xs text-fg hover:border-edge"
          >
            <option value="">All neighborhoods</option>
            {hoods.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>

      {error && <p role="alert" className="p-3 text-return">Could not load the blocks: {error}</p>}
      {!rows && !error && <p className="p-3 text-fg-3" aria-live="polite">Ranking blocks…</p>}
      {rows && (
        <ol className="min-h-0 flex-1 overflow-y-auto" aria-label="Blocks ranked by expected reports">
          {shown.map((c) => {
            const active = c.id === selectedId;
            const band = BAND_STYLE[c.band] ?? BAND_STYLE.low;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => pick(c)}
                  aria-current={active ? "true" : undefined}
                  className={`grid w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2.5 border-b border-line/60 px-3 py-2 text-left transition-colors hover:bg-card-hover ${active ? "bg-card-hover" : ""}`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg font-mono text-sm font-bold ${band.solid}`}>{c.rank}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-fg">{c.label ?? c.neighborhood ?? "Block"}</span>
                    <span className="block truncate text-[11px] text-fg-3">
                      {c.label && c.neighborhood ? `${c.neighborhood} · ` : ""}{band.label}{c.emerging ? " · emerging" : ""}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-mono text-[15px] font-bold tabular-nums text-fg">{c.expected.toFixed(1)}</span>
                    <span className="block text-[10px] text-fg-3">expected</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
