"use client";
import { useCallback, useEffect, useState } from "react";
import { fetchLiveStatus } from "@/lib/queries";

// Draft top bar: name + live-data badge + Refresh (Vercel /api/refresh -> Modal worker).

function ago(iso: string | null) {
  if (!iso) return "unknown";
  const min = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
}

export default function TopBar() {
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [, tick] = useState(0);

  useEffect(() => {
    fetchLiveStatus().then((s) => setUpdatedAt(s.updatedAt));
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const refresh = useCallback(async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      const body = await res.json();
      if (body.updatedAt) setUpdatedAt(body.updatedAt);
      setMsg(res.status === 429 ? "Already up to date" : res.ok ? "Updated" : body.error ?? "Refresh failed");
    } catch {
      setMsg("Refresh failed");
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-4">
      <h1 className="text-base font-semibold tracking-tight">
        Rat Audit <span className="font-normal text-neutral-700">· Boston, Cambridge, Somerville</span>
      </h1>
      <div className="ml-auto flex items-center gap-2 text-sm">
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">
          <span aria-hidden className="h-2 w-2 rounded-full bg-emerald-500" />
          Live · updated {ago(updatedAt)}
        </span>
        <button
          type="button"
          onClick={refresh}
          disabled={busy}
          className="rounded-md border border-neutral-300 px-2.5 py-1 font-medium hover:bg-neutral-50 disabled:opacity-50"
        >
          {busy ? "Refreshing…" : "Refresh"}
        </button>
        <span className="sr-only" aria-live="polite">{msg}</span>
        {msg && <span className="text-xs text-neutral-700">{msg}</span>}
      </div>
    </header>
  );
}
