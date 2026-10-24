"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { fetchSiteDetail, type SiteDetail } from "@/lib/queries";
import { formatDate, formatTimestamp } from "@/lib/dates";
import { COUNT_EXPLANATION, INSPECTION_QUESTIONS, sourceUrl, type SourceEvidence } from "@/lib/evidence";
import categories from "@/lib/categories.json";
import { BRIEF_CSS, standaloneBrief } from "@/lib/inspection-brief";

const CATS = categories.incident_categories as Record<string, { label: string }>;

function Citations({ ids, sources }: { ids: string[] | undefined; sources: SourceEvidence[] }) {
  if (!ids?.length) return <p className="brief-muted">Source attribution unavailable; freshness unknown.</p>;
  return <p className="brief-muted">Sources: {[...new Set(ids)].map((id, i) => {
    const index = sources.findIndex((s) => s.id === id);
    return <span key={id}>{i > 0 ? ", " : ""}{index < 0 ? `${id} (metadata unavailable)` : <a href={`#source-${index + 1}`}>{sources[index].name} [{index + 1}]</a>}</span>;
  })}</p>;
}

export function BriefDocument({ detail: d, generatedAt }: { detail: SiteDetail; generatedAt: string }) {
  const s = d.site;
  const sources = d.evidence?.sources ?? d.report_sources ?? [];
  const reportSourceIds = d.evidence?.report_source_ids ?? d.report_sources?.map((source) => source.id);
  const reports = [...d.reports].sort((a, b) => b.opened.localeCompare(a.opened) || a.id.localeCompare(b.id));
  const reportMetadata = new Map(d.evidence?.reports.map((r) => [r.id, r]));
  const nearby = Object.entries(d.drivers_100m_12mo).sort((a, b) => b[1] - a[1]);

  return <article className="inspection-brief" data-theme="bone">
    <style>{BRIEF_CSS}</style>
    <header className="brief-header">
      <p className="brief-eyebrow">Piper / Field review</p>
      <h1>Inspection brief</h1>
      <h2>{s.address_block ?? "Unnamed block"}</h2>
      <p>{[s.neighborhood, s.city].filter(Boolean).join(" · ")}</p>
      <p className="brief-muted">Place {s.id} · Prepared {formatTimestamp(generatedAt)}</p>
      <p className="brief-muted">Public block label; confirm the precise location before a visit.</p>
    </header>

    <section>
      <h2>Why review this place</h2>
      <p>{s.due ? "Review suggested: the latest closure was within 60 days, and a report has followed an earlier closure." : "This place has repeat rodent reports. It is not currently flagged by the recent-closure rule."}</p>
      <dl className="brief-stats">
        <div><dt>Individual records</dt><dd>{d.reports.length}</dd></div>
        <div><dt>Report days</dt><dd>{s.reports}</dd></div>
        <div><dt>Closure days</dt><dd>{s.closures}</dd></div>
        <div><dt>Return days</dt><dd>{s.returns}</dd></div>
      </dl>
      <p>Report history: {formatDate(s.first_at)}–{formatDate(s.last_at)}. Latest recorded closure: {formatDate(s.last_closed)}.</p>
      <p className="brief-muted">{COUNT_EXPLANATION} History includes rodent reports since January 2024.</p>
      <Citations ids={reportSourceIds} sources={sources} />
    </section>

    <section>
      <h2>Nearby evidence to check</h2>
      <p>Other report records within 100 m of the place’s averaged coordinates, in the last 12 months{d.evidence ? ` (${formatDate(d.evidence.nearby_since)}–${formatDate(d.evidence.as_of)})` : ""}.</p>
      {nearby.length ? <table>
        <thead><tr><th scope="col">Category</th><th scope="col">Records</th><th scope="col">Sources</th></tr></thead>
        <tbody>{nearby.map(([category, count]) => <tr key={category}>
          <th scope="row">{CATS[category]?.label ?? category}</th><td>{count}</td>
          <td><Citations ids={d.evidence?.nearby.find((r) => r.category === category)?.source_ids} sources={sources} /></td>
        </tr>)}</tbody>
      </table> : <p>No nearby records were returned. This does not establish that conditions are absent.</p>}
      <p>Vacant parcels within 40 m: <strong>{d.adjacent_vacant_parcels}</strong>. This is a source snapshot, without the 12-month report filter.</p>
      {d.adjacent_vacant_parcels > 0 && <Citations ids={d.evidence?.vacant.source_ids} sources={sources} />}
      <p className="brief-muted">Proximity provides context and does not establish a cause. Coverage and update schedules differ by source and city.</p>
    </section>

    <section>
      <h2>Questions for the visit</h2>
      <ol className="brief-questions">{INSPECTION_QUESTIONS.map((question) => <li key={question}>{question}</li>)}</ol>
      <div className="brief-notes"><p>Field notes / observer / date / follow-up</p><div /><div /><div /></div>
    </section>

    <section className="brief-history">
      <h2>Report history and recorded responses</h2>
      <p>{d.reports.length} individual records, newest opened first. Closure notes are reproduced in full as available in Piper.</p>
      <Citations ids={reportSourceIds} sources={sources} />
      <ol className="brief-records">{reports.map((r) => {
        const meta = reportMetadata.get(r.id);
        const sourceIndex = meta ? sources.findIndex((source) => source.id === meta.source_id) : -1;
        return <li key={r.id}>
          <div className="brief-record-heading"><strong>Opened {formatDate(r.opened)}</strong><span>{r.closed ? `Closed ${formatDate(r.closed)}` : "No closure date recorded"}</span></div>
          <p>Status: {r.status}. Recorded action: {r.action?.replace(/_/g, " ") ?? "Not recorded"}.</p>
          {meta?.after_closure && <p className="brief-muted">This report followed an earlier closure within the return window.</p>}
          <p className="brief-note">{r.note?.trim() || "No response note recorded."}</p>
          <p className="brief-muted">Record {r.id}{sourceIndex >= 0 && <> · <a href={`#source-${sourceIndex + 1}`}>Source [{sourceIndex + 1}]</a></>}</p>
        </li>;
      })}</ol>
    </section>

    <section className="brief-sources">
      <h2>Sources and freshness</h2>
      <p className="brief-muted">Retrieval and import times describe Piper’s copy, not current field conditions. A live or daily label describes the intended update schedule. Static sources retain their original snapshot.</p>
      {d.evidence_unavailable && <p>Some source attribution could not be loaded. Nearby counts have unknown provenance and freshness in this export.</p>}
      {sources.length ? <ol>{sources.map((source, i) => {
        const url = sourceUrl(source.url);
        return <li key={source.id} id={`source-${i + 1}`}>
          <strong>{source.name}</strong> · {source.update_mode ?? "Unknown update schedule"}
          <p>{url ? <a className="brief-source-url" href={url}>{url}</a> : "Source URL unavailable"}</p>
          <p>Retrieved: {formatTimestamp(source.retrieved_at)}<br />Last successful import: {formatTimestamp(source.last_success_at)}</p>
          {source.update_note && <p>{source.update_note}</p>}
        </li>;
      })}</ol> : <p>Source metadata could not be loaded; freshness is unknown.</p>}
    </section>
    <footer className="brief-footer">Prepared for human review. Reports are not rat counts; a closed case does not confirm resolution. This brief is not an inspection finding or an approved work order.</footer>
  </article>;
}

export default function InspectionBrief({ id }: { id: string }) {
  const [result, setResult] = useState<{ detail?: SiteDetail | null; generatedAt: string; error?: string } | null>(null);
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let live = true;
    fetchSiteDetail(id).then((detail) => {
      if (live) setResult({ detail, generatedAt: new Date().toISOString() });
    }).catch(() => { if (live) setResult({ error: "The inspection brief could not be loaded. Please return to the map and try again.", generatedAt: "" }); });
    return () => { live = false; };
  }, [id]);

  function download() {
    if (!content.current) return;
    const blob = new Blob([standaloneBrief(content.current.innerHTML)], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `piper-inspection-${id.replace(/[^a-zA-Z0-9_-]/g, "")}.html`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <main className="min-h-full bg-bg px-4 py-6 text-fg" data-theme="bone">
    <nav aria-label="Inspection brief actions" className="brief-toolbar mx-auto mb-5 flex max-w-4xl flex-wrap items-center gap-3">
      <Link href="/" className="mr-auto text-sm font-semibold underline underline-offset-4">← Back to map</Link>
      <button type="button" disabled={!result?.detail} onClick={download} className="rounded-md border border-edge px-4 py-2 text-sm font-semibold disabled:opacity-40">Download brief</button>
      <button type="button" disabled={!result?.detail} onClick={() => window.print()} className="rounded-md bg-fg px-4 py-2 text-sm font-semibold text-bg disabled:opacity-40">Print / Save PDF</button>
    </nav>
    {!result && <p role="status" className="mx-auto max-w-4xl">Loading inspection brief…</p>}
    {result?.error && <p role="alert" className="mx-auto max-w-4xl">{result.error}</p>}
    {result?.detail === null && <p className="mx-auto max-w-4xl">This place is no longer available.</p>}
    {result?.detail && <div ref={content}><BriefDocument detail={result.detail} generatedAt={result.generatedAt} /></div>}
  </main>;
}
