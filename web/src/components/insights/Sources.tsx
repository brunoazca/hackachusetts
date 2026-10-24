import { fmtDateTime } from "./format";
import type { SourceRow } from "./types";

function sourceUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch { return null; }
}

// Older payloads may contain only IDs. Keep that absence visible; never invent citations.
export default function Sources({ ids, details }: { ids: string[]; details: SourceRow[] }) {
  if (!ids.length) return <span className="text-fg-3">Source not recorded</span>;
  return (
    <ul className="mt-1 list-none space-y-1 p-0 text-fg-3" aria-label="Sources">
      {[...new Set(ids)].map((id) => {
        const source = details.find((s) => s.id === id);
        const url = source ? sourceUrl(source.url) : null;
        return (
          <li key={id} className="break-words">
            {source ? <>
              {url
                ? <a href={url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2">{source.name}</a>
                : <span>{source.name} · Source link unavailable</span>}
              {" · "}<code>{id}</code>
              <span className="block">Retrieved <time dateTime={source.retrieved_at}>{fmtDateTime(source.retrieved_at)}</time></span>
            </> : <><code>{id}</code> · Source details unavailable</>}
          </li>
        );
      })}
    </ul>
  );
}
