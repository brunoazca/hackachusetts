"use client";
import type { RegionLocation } from "./parse";

const LINK = /\[([^\]]+)\]\((L\d+)\)/g;

/** Renders region text, turning `[label](L3)` place links into buttons that fly the map there. */
export default function PlaceText({ text, locations, onLocate }: {
  text: string; locations: RegionLocation[]; onLocate: (loc: RegionLocation) => void;
}) {
  const byId = new Map(locations.map(l => [l.id, l]));
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    const [whole, label, id] = m;
    const at = m.index ?? 0;
    if (at > last) parts.push(text.slice(last, at));
    const loc = byId.get(id);
    parts.push(loc
      ? <button key={at} type="button" onClick={() => onLocate(loc)} title={`Show ${loc.block ?? label} on the map`}
          className="inline cursor-pointer font-medium text-fg underline decoration-fg-3 decoration-1 underline-offset-2 hover:decoration-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent">{label}</button>
      : label);
    last = at + whole.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
