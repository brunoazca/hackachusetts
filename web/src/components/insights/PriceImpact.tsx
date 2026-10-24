import { Caveat } from "./FindingCard";
import Sources from "./Sources";
import { fmtDateTime } from "./format";
import type { ImpactItem } from "./types";

const toNum = (v: string) => { const n = Number(v.replace(/[$,%\s]/g, "")); return Number.isFinite(n) ? n : null; };

function ImpactCard({ item }: { item: ImpactItem }) {
  const headingId = `impact-${item.id}`;
  return (
    <article aria-labelledby={headingId} data-impact={item.id} data-kind={item.kind}
      className="rounded-xl border border-line bg-card p-3 text-fg">
      <div className="flex items-start justify-between gap-2">
        <h4 id={headingId} className="text-small font-semibold text-fg">{item.title}</h4>
        {item.kind === "exploratory" && (
          <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-warn">
            Early look
          </span>
        )}
      </div>
      {item.headline !== null && (
        <p className="mt-1 font-mono text-headline-sm font-bold tabular-nums text-fg">
          {item.headline}
          {item.headlineLabel && <span className="ml-1.5 font-sans text-xs font-normal text-fg-3">{item.headlineLabel}</span>}
        </p>
      )}
      {item.headline === null && !item.details.length && !item.tables.length && (
        <p className="mt-1 text-xs italic text-fg-3">No number yet</p>
      )}
      <p className="text-xs text-fg-3">
        {item.metric}{item.scope !== "city" && <> · {item.scope}{item.scopeId ? ` ${item.scopeId}` : ""}</>}
      </p>
      {item.details.length > 0 && (
        <dl className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
          {item.details.map(([k, v]) => (
            <div key={k} className="rounded-lg bg-card-hover px-2 py-1.5">
              <dt className="text-[11px] text-fg-3">{k}</dt><dd className="font-mono font-semibold tabular-nums text-fg">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {item.tables.map((t) => {
        const last = t.columns.length - 1;
        const nums = t.rows.map((r) => toNum(r[last] ?? ""));
        const max = Math.max(0, ...nums.map((n) => n ?? 0));
        const bars = max > 0 && nums.every((n) => n !== null && n >= 0);
        return (
          <table key={t.name} className="mt-3 w-full text-left text-xs">
            <caption className="mb-1 text-left text-[11px] font-semibold text-fg-2">{t.name}</caption>
            <thead>
              <tr className="text-[11px] text-fg-3">{t.columns.map((c) => <th key={c} scope="col" className="pb-1 pr-2 font-medium">{c}</th>)}</tr>
            </thead>
            <tbody>
              {t.rows.map((r, i) => (
                <tr key={i} className="border-t border-line">
                  {r.map((v, j) => (
                    <td key={j} className={`py-1 pr-2 tabular-nums ${j === last ? "text-right font-mono" : ""}`}>
                      {j === last && bars ? (
                        <span className="flex items-center justify-end gap-2">
                          <span aria-hidden className="block h-1.5 w-16 overflow-hidden rounded-full bg-card-hover">
                            <span className="block h-full rounded-full bg-fg-3" style={{ width: `${((nums[i] ?? 0) / max) * 100}%` }} />
                          </span>
                          {v}
                        </span>
                      ) : v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      })}
      {/* R7.5: the caveat sits next to every price figure. */}
      <Caveat text={item.caveat} />
      <div className="mt-2 border-t border-line pt-2 text-[11px] text-fg-3">
        Source: <Sources ids={item.sources} details={item.sourceDetails} /> · Updated{" "}
        <time dateTime={item.computedAt}>{fmtDateTime(item.computedAt)}</time>
      </div>
    </article>
  );
}

export default function PriceImpact({ costs, exploratory }: { costs: ImpactItem[]; exploratory: ImpactItem[] }) {
  return (
    <>
      {costs.length > 0 && <section aria-labelledby="costs-h" className="space-y-2">
        <h3 id="costs-h" className="text-sm font-semibold text-fg">Costs we can count</h3>
        {costs.map((c) => <ImpactCard key={c.id} item={c} />)}
      </section>}
      {exploratory.length > 0 && <section aria-labelledby="price-h" className="space-y-2">
        <h3 id="price-h" className="text-sm font-semibold text-fg">Home prices near hot spots (early look)</h3>
        <p className="text-xs text-fg-2">
          An early look only. Many things change home prices, so these do not show that rodents lower property values.
        </p>
        {exploratory.map((c) => <ImpactCard key={c.id} item={c} />)}
      </section>}
    </>
  );
}
