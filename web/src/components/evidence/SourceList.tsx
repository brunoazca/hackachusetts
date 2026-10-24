import { formatTimestamp } from "@/lib/dates";
import { sourceUrl, type SourceEvidence } from "@/lib/evidence";

export default function SourceList({ sources, unavailable = false }: { sources: SourceEvidence[]; unavailable?: boolean }) {
  return (
    <div className="mt-2 text-[11px] leading-4 text-fg-3">
      {unavailable && <p role="status">Source attribution is unavailable for this section. Freshness is unknown.</p>}
      {sources.length > 0 && <ul aria-label="Sources and freshness" className="space-y-2">
        {sources.map((s) => {
          const url = sourceUrl(s.url);
          return <li key={s.id}>
            {url ? <a href={url} target="_blank" rel="noreferrer" className="font-semibold text-fg-2 underline underline-offset-2">{s.name}</a> : <span>{s.name} · source link unavailable</span>}
            <span className="block">{s.update_mode ? `${s.update_mode[0].toUpperCase()}${s.update_mode.slice(1)} dataset · ` : ""}Retrieved {formatTimestamp(s.retrieved_at)}</span>
            <span className="block">Last successful import: {formatTimestamp(s.last_success_at)}</span>
            {s.update_note && <span className="block">{s.update_note}</span>}
          </li>;
        })}
      </ul>}
    </div>
  );
}
