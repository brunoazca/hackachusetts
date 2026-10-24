// Past research from docs/submission/data-report.md, not a live query.
// The matched comparison supersedes the earlier unadjusted before/after chart.

export default function HistoricalFindings() {
  return (
    <div className="space-y-3 px-5 pb-5 pt-4">
      <article className="space-y-3 rounded-xl border border-line bg-card p-5">
        <span className="eyebrow">Past research · City responses</span>
        <h2 className="text-[20px] font-bold leading-7 tracking-[-0.01em] text-fg">No response clearly worked better than the others.</h2>
        <p className="text-[13px] leading-[18px] text-fg-2">We compared 19,496 Boston cases from 2023–2026. Places that got a fine or a clean-up had new reports within 60 days about as often as places that were only watched.</p>
        <dl className="grid grid-cols-2 gap-3 border-y border-line py-3">
          <div><dt className="text-xs text-fg-3">Reports came back, vs. only watching</dt><dd className="font-mono text-xl text-fg">1.03×</dd></div>
          <div><dt className="text-xs text-fg-3">Likely range</dt><dd className="font-mono text-xl text-fg">0.89–1.20×</dd></div>
        </dl>
        <p className="text-xs leading-5 text-fg-2">This does not prove the responses work equally well. Reports are not a count of rats, and the city&apos;s closing notes do not confirm what happened on the street.</p>
        <p className="text-xs leading-5 text-fg-3">Snapshot from October 24, 2026. Source: <a className="underline" href="https://data.boston.gov/dataset/311-service-requests" target="_blank" rel="noreferrer">Boston 311 records</a>. This card does not change with the map.</p>
      </article>
      <article className="space-y-2 rounded-xl border border-line bg-card p-5">
        <span className="eyebrow">Past research · Weather</span>
        <h2 className="text-[20px] font-bold leading-7 tracking-[-0.01em] text-fg">Rain: no clear link found.</h2>
        <p className="text-xs leading-5 text-fg-3">We did not see a clear link between rain and rodent reports in the weeks we checked. That does not mean rain has no effect on rats.</p>
      </article>
    </div>
  );
}
