import { Caveat } from "./FindingCard";
import Sources from "./Sources";
import { fmtDateTime } from "./format";
import type { ImpactItem } from "./types";

function ImpactCard({ item }: { item: ImpactItem }) {
  const headingId = `impact-${item.id}`;
  return (
    <article aria-labelledby={headingId} data-impact={item.id} data-kind={item.kind}
      className="rounded-lg border border-line p-3">
      <div className="flex items-start justify-between gap-2">
        <h4 id={headingId} className="text-sm font-semibold text-fg">{item.title}</h4>
        {item.kind === "exploratory" && (
          <span className="shrink-0 rounded-full border border-edge px-2 py-0.5 text-[11px] font-medium text-fg-2">
            Exploratory
          </span>
        )}
      </div>
      {item.headline !== null && (
        <p className="mt-1 text-lg font-semibold tabular-nums text-fg">
          {item.headline}
          {item.headlineLabel && <span className="ml-1 text-xs font-normal text-fg-3">{item.headlineLabel}</span>}
        </p>
      )}
      {item.headline === null && !item.details.length && !item.tables.length && (
        <p className="mt-1 text-xs italic text-fg-3">Value not reported</p>
      )}
      <p className="text-xs text-fg-3">
        {item.metric}{item.scope !== "city" && <> · {item.scope}{item.scopeId ? ` ${item.scopeId}` : ""}</>}
      </p>
      {item.details.length > 0 && (
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 text-xs">
          {item.details.map(([k, v]) => (
            <div key={k} className="contents"><dt className="text-fg-3">{k}</dt><dd className="tabular-nums">{v}</dd></div>
          ))}
        </dl>
      )}
      {item.tables.map((t) => (
        <table key={t.name} className="mt-2 w-full text-left text-xs">
          <caption className="text-left text-fg-2">{t.name}</caption>
          <thead>
            <tr className="text-fg-3">{t.columns.map((c) => <th key={c} scope="col" className="pr-2 font-medium">{c}</th>)}</tr>
          </thead>
          <tbody>
            {t.rows.map((r, i) => (
              <tr key={i} className="border-t border-line">{r.map((v, j) => <td key={j} className="pr-2 tabular-nums">{v}</td>)}</tr>
            ))}
          </tbody>
        </table>
      ))}
      {/* R7.5: the caveat sits next to every price figure. */}
      <Caveat text={item.caveat} />
      <div className="mt-2 text-[11px] text-fg-3">
        Source: <Sources ids={item.sources} details={item.sourceDetails} /> · Computed{" "}
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
        <h3 id="price-h" className="text-sm font-semibold text-fg">Prices near hot spots (exploratory)</h3>
        <p className="text-xs text-fg-2">
          These comparisons are exploratory and confounded. They do not show that rodents lower property values.
        </p>
        {exploratory.map((c) => <ImpactCard key={c.id} item={c} />)}
      </section>}
    </>
  );
}
