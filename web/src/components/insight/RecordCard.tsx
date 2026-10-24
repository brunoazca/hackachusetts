"use client";
import { useMap } from "@/lib/map-store";
import type { RecordInsight } from "@/lib/insight";
import { actionLabel, Caveat, Causes, day, num, pct, ReportLink, Section, Stat, type Cause } from "./shared";

// A single rodent report, read like an insight: will reports come back here, what to do, and the
// evidence around it (nearby causes vs the Boston level, what was tried at this address before).

type Json = Record<string, unknown>;
const plain = (t: unknown) => String(t ?? "").replace(/\[([^\]]+)\]\(L\d+\)/g, "$1");

export default function RecordCard({ insight: r }: { insight: RecordInsight }) {
  const select = useMap((s) => s.select);
  const i = r.incident as Json;
  const o = (r.outlook ?? {}) as Json;
  const s = (r.solution ?? {}) as Json;
  const e = (r.evidence ?? {}) as Json;
  const forecast = (o.cell_forecast ?? []) as { week: string; expected: number }[];
  const next4 = forecast.reduce((t, f) => t + f.expected, 0);
  const history = (e.address_history ?? []) as { id: string; opened: string; closed: string | null; city_did: string | null }[];
  const because = (s.model_because ?? []) as string[];

  return (
    <article className="space-y-3 p-3 text-small">
      <header className="px-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-3">Rodent report · {String(i.status)}</p>
        <h2 className="text-[15px] font-semibold text-fg">{String(i.address_block ?? i.neighborhood ?? "Location withheld")}</h2>
        <p className="text-fg-3">Opened {day(i.opened_at)}{i.closed_at ? ` · closed ${day(i.closed_at)} · ${actionLabel(s.city_did)}` : ""}</p>
        {r.region_id && (
          <button type="button" onClick={() => select({ kind: "cell", id: r.region_id as string })}
            className="mt-1 text-fg underline decoration-fg-3 underline-offset-2 hover:decoration-accent">Open hotspot</button>
        )}
      </header>

      <Section title="Return odds">
        <div className="grid grid-cols-3 gap-2">
          <Stat value={pct(o.p_return_60d_if_monitoring)} label="Returns in 60 d" />
          <Stat value={pct(o.p_return_60d_if_best)} label={o.confident ? `With ${String(o.best_action).toLowerCase()}` : "Best alternative"} />
          <Stat value={num(next4)} label="Block, next 4 wk" />
        </div>
      </Section>

      <Section title="What to do">
        <p className="font-medium text-fg">{plain(s.todo) || String(s.model_action ?? "Inspect and record the cause")}</p>
        {s.area_action != null && <p className="text-fg-2">{plain(s.area_action)}</p>}
        {because.length > 0 && <ul className="list-disc space-y-0.5 pl-4 text-fg-3">{because.map((b) => <li key={b}>{b}</li>)}</ul>}
      </Section>

      <Section title="Nearby · 150 m, prior 90 d · vs Boston">
        <Causes causes={(e.nearby_causes ?? []) as Cause[]} />
      </Section>

      {history.length > 1 && (
        <Section title="This address, 2 yrs">
          <ol className="space-y-1">{history.map((h) => (
            <li key={h.id} className="flex justify-between gap-2">
              {h.id === i.id ? <span className="font-semibold text-fg">{h.opened} · this report</span> : <ReportLink id={h.id}>{h.opened}</ReportLink>}
              <span className="text-fg-3">{actionLabel(h.city_did)}</span>
            </li>
          ))}</ol>
        </Section>
      )}
      <Caveat>{String(r.caveat ?? "")}</Caveat>
    </article>
  );
}
