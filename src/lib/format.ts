const NF = new Intl.NumberFormat("en-US");

export const fmt = (n: number) => NF.format(Math.round(n));

export function fmtDate(unixSec: number | null): string {
  if (unixSec == null) return "—";
  return new Date(unixSec * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function fmtDayKey(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Display order for the heatmap: Monday-first. Values are getDay() indices. */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function hourLabel(h: number): string {
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

/** A friendly model name from a raw slug like "gpt-4o" or "o1-mini". */
export function modelLabel(slug: string): string {
  const map: Record<string, string> = {
    "gpt-4o": "GPT-4o",
    "gpt-4o-mini": "GPT-4o mini",
    "gpt-4": "GPT-4",
    "gpt-4-turbo": "GPT-4 Turbo",
    "gpt-4-gizmo": "GPT-4 (GPT)",
    "gpt-3.5": "GPT-3.5",
    "text-davinci-002-render-sha": "GPT-3.5",
    "o1": "o1",
    "o1-mini": "o1-mini",
    "o1-preview": "o1-preview",
    "o3": "o3",
    "o3-mini": "o3-mini",
    "gpt-4-5": "GPT-4.5",
    "gpt-5": "GPT-5",
  };
  return map[slug] ?? slug;
}
