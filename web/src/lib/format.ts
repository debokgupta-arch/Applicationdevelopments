import { format, parseISO } from "date-fns";

/** Clamp any number to a whole percent between 0 and 100. */
export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.min(100, Math.max(0, value)));
}

/** "Asha Rao" -> "AR", "madonna" -> "M", "  " -> "?" */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** ISO date (yyyy-mm-dd) -> "15 Jan 2027" */
export function formatShortDate(isoDate: string): string {
  return format(parseISO(isoDate), "d MMM yyyy");
}

/** Date -> "Wednesday, 18 November" */
export function formatLongToday(date: Date): string {
  return format(date, "EEEE, d MMMM");
}
