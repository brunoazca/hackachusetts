export type SourceEvidence = {
  id: string;
  name: string;
  url: string;
  retrieved_at: string | null;
  update_mode: "live" | "daily" | "static" | null;
  update_note: string | null;
  last_success_at?: string | null;
  newest_record_at?: string | null;
};

export type SiteEvidence = {
  as_of: string;
  nearby_since: string;
  reports: { id: string; source_id: string; after_closure: boolean }[];
  report_source_ids: string[];
  nearby: { category: string; count: number; source_ids: string[] }[];
  vacant: { count: number; source_ids: string[] };
  sources: SourceEvidence[];
};

export function sourcesFor(ids: string[], sources: SourceEvidence[]) {
  return [...new Set(ids)].map((id) => sources.find((s) => s.id === id) ?? {
    id, name: id, url: "", retrieved_at: null, update_mode: null, update_note: null,
  });
}

export function sourceUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch { return null; }
}

/** Multiple records can land on one report day. Use the API's date labels verbatim. */
export function reportDays<T extends { id: string; opened: string }>(reports: T[]) {
  const days = new Map<string, T[]>();
  for (const r of reports) days.set(r.opened, [...(days.get(r.opened) ?? []), r]);
  return [...days].sort(([a], [b]) => a.localeCompare(b)).map(([date, records]) => ({ date, records }));
}

export const COUNT_EXPLANATION = "Report days and closure days count distinct dates, not individual records. Several records can share a date. Return days count report dates with a report more than 1 day and no more than 60 days after an earlier closure.";

export const INSPECTION_QUESTIONS = [
  "Do you see signs of rodents now? Note what, where and when.",
  "What did the city do last time, and can you check it now?",
  "Is there food waste, open trash, a way in, or a place to hide? Check the nearby reports on site.",
  "What should happen next, who will do it, and when should someone come back?",
];
