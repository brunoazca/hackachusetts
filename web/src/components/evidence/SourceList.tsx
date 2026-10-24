import { formatTimestamp } from "@/lib/dates";
import { sourceUrl, type SourceEvidence } from "@/lib/evidence";

export default function SourceList({ sources, unavailable = false }: { sources: SourceEvidence[]; unavailable?: boolean }) {
  return (
    <div className="mt-2 text-[11px] leading-4 text-fg-3">
      {unavailable && <p role="status">We can&apos;t show where this part came from right now.</p>}
      {sources.length > 0 && <details>
        <summary className="cursor-pointer font-semibold text-fg-2">Where this comes from · {sources.length} source{sources.length === 1 ? "" : "s"}</summary>
        <ul aria-label="Sources" className="mt-2 space-y-2">
        {sources.map((s) => {
          const url = sourceUrl(s.url);
          return <li key={s.id}>
            {url ? <a href={url} target="_blank" rel="noreferrer" className="font-semibold text-fg-2 underline underline-offset-2">{s.name}</a> : <span>{s.name}</span>}
            <span className="block">Updated {formatTimestamp(s.last_success_at ?? s.retrieved_at)}</span>
            {s.update_note && <span className="block">{s.update_note}</span>}
          </li>;
        })}
        </ul>
      </details>}
    </div>
  );
}
