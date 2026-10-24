"use client";
import LineRat from "@/components/brand/LineRat";

// Placeholder styled with Piper tokens until the assistant track lands. Owned by its track;
// replace freely, keep the export name.

const STARTERS = ["Where does monitoring keep failing?", "What will rise next month?", "Compare Roxbury and Dorchester"];

export default function ChatPanel() {
  return (
    <div className="flex h-full flex-col gap-4 px-5 pb-5 pt-4">
      <div>
        <span className="eyebrow">Ask Piper</span>
        <h2 className="mt-1 text-[20px] font-bold leading-7 tracking-[-0.01em] text-fg">Answers from the data, with sources.</h2>
      </div>
      <div className="flex items-center gap-3 rounded-lg border border-line bg-card p-4 text-fg-3">
        <LineRat width={36} />
        <p className="text-[13px] leading-[18px]">The assistant is not connected yet. The map and site queue work without it.</p>
      </div>
      <div className="flex-1" />
      <div className="flex flex-wrap gap-2">
        {STARTERS.map((q) => (
          <span key={q} className="inline-flex h-7 items-center rounded-full border border-line bg-card px-3 text-[13px] text-fg-3">{q}</span>
        ))}
      </div>
      <div className="flex min-h-12 items-center gap-2 rounded-[12px] border border-edge bg-card px-3 opacity-60">
        <span className="flex-1 text-[16px] text-fg-3">Ask about a place, a site, or a trend…</span>
        <span className="rounded-sm bg-accent px-3 py-1.5 text-[13px] font-semibold text-accent-fg">Send</span>
      </div>
    </div>
  );
}
