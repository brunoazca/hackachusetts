// Display helpers. Times are stored in UTC and shown in America/New_York (CONTRACT.md).

const TZ = "America/New_York";

export function fmtNumber(v: number, digits = 2): string {
  if (!Number.isFinite(v)) return "—";
  if (Number.isInteger(v)) return v.toLocaleString("en-US");
  const abs = Math.abs(v);
  const d = abs >= 100 ? 0 : abs >= 10 ? 1 : digits;
  return v.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: 0 });
}

export function fmtP(p: number): string {
  if (!Number.isFinite(p)) return "—";
  return p < 0.001 ? "< 0.001" : p.toFixed(3);
}

export function fmtPct(share: number): string {
  // share is 0..1
  if (!Number.isFinite(share)) return "—";
  return `${(share * 100).toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
}

export function fmtUsd(v: number): string {
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    timeZone: TZ, year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

// `date` columns (week_start, trained_through) have no time zone: format them as calendar dates.
export function fmtDate(isoDate: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!m) return isoDate;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" });
}

export function humanize(key: string): string {
  const s = key.replace(/[_-]+/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
