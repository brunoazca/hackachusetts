import FindingChart from "./FindingChart";
import ActionSamples from "./ActionSamples";
import Sources from "./Sources";
import { fmtDateTime } from "./format";
import type { Finding, Strength } from "./types";

// Null results get the same card, size and prominence as positive ones (R5.4).
const STRENGTH: Record<Strength, { label: string; cls: string }> = {
  strong: { label: "Strong association", cls: "border-neutral-900 text-neutral-900" },
  moderate: { label: "Moderate association", cls: "border-neutral-700 text-neutral-800" },
  weak: { label: "Weak association", cls: "border-neutral-500 text-neutral-700" },
  none: { label: "No association found", cls: "border-neutral-500 text-neutral-700" },
};

export function Caveat({ text }: { text: string }) {
  return (
    <p className="mt-2 rounded border-l-2 border-amber-500 bg-amber-50 px-2 py-1 text-xs text-neutral-800">
      <span className="font-semibold">Caveat: </span>{text}
    </p>
  );
}

export default function FindingCard({ finding: f }: { finding: Finding }) {
  const headingId = `finding-${f.id}`;
  const s = f.insufficient
    ? { label: "Insufficient data", cls: "border-neutral-500 text-neutral-700" }
    : f.strength ? STRENGTH[f.strength] : { label: "Strength not labelled", cls: "border-neutral-400 text-neutral-600" };
  return (
    <article aria-labelledby={headingId} data-finding={f.id} data-strength={f.insufficient ? "insufficient" : f.strength ?? "unknown"}
      className="rounded-lg border border-neutral-200 p-3">
      <div className="flex items-start justify-between gap-2">
        <h3 id={headingId} className="text-sm font-semibold text-neutral-900">{f.title}</h3>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${s.cls}`}>{s.label}</span>
      </div>

      <dl className="mt-2 grid grid-cols-[5.5rem_1fr] gap-x-2 gap-y-1 text-xs">
        <dt className="text-neutral-500">Question</dt>
        <dd className="text-neutral-800">{f.question}</dd>
        <dt className="text-neutral-500">Result</dt>
        <dd className="text-neutral-800">
          {f.statText ?? (f.moreStats.length ? "See the statistics below and the chart" : "Statistic not reported")}
        </dd>
        <dt className="text-neutral-500">Method</dt>
        <dd className="text-neutral-800">{f.method}</dd>
        <dt className="text-neutral-500">Sample</dt>
        <dd className="text-neutral-800">{f.sampleText ?? (f.unit ? `Size not reported (${f.unit})` : "Size not reported")}</dd>
      </dl>

      {f.moreStats.length > 0 && (
        <details className="mt-1 text-xs text-neutral-600" data-more-stats>
          <summary className="cursor-pointer">More statistics</summary>
          <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-2">
            {f.moreStats.map(([k, v]) => (
              <div key={k} className="contents"><dt className="text-neutral-500">{k}</dt><dd className="tabular-nums">{v}</dd></div>
            ))}
          </dl>
        </details>
      )}

      {f.chart
        ? <FindingChart spec={f.chart} id={headingId} />
        : <p className="mt-2 text-xs italic text-neutral-500" role="note">Chart unavailable: {f.chartProblem}</p>}

      <ActionSamples samples={f.actionSamples} />

      <Caveat text={f.caveat} />

      <div className="mt-2 text-[11px] text-neutral-500">
        Source: <Sources ids={f.sources} details={f.sourceDetails} /> · Computed{" "}
        <time dateTime={f.computedAt}>{fmtDateTime(f.computedAt)}</time>
      </div>
    </article>
  );
}
