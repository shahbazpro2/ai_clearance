/**
 * Shared month ordering and formatting for availability/review UIs.
 * Use this for manual availability review, availability report step, and any month-based tables.
 */

export const MONTH_ORDER: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
} as const;

export const MONTH_KEYS_ORDERED = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
] as const;

/** Display label: "january" -> "January" */
export function formatMonthLabel(month: string): string {
  if (!month || typeof month !== "string") return month;
  return month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
}

/** Normalize API month (e.g. "May" or "may") to lowercase key */
export function normalizeMonthKey(month: string): string {
  if (!month || typeof month !== "string") return "";
  return month.toLowerCase();
}

/** Sort an array of month keys by calendar order */
export function sortMonths(months: string[]): string[] {
  const unique = Array.from(new Set(months)).filter(Boolean);
  return unique.sort((a, b) => (MONTH_ORDER[a] ?? 999) - (MONTH_ORDER[b] ?? 999));
}

/** Get ordered month keys from availability entries (e.g. from programs) */
export function getOrderedMonthsFromEntries(
  entries: Array<{ month?: string }>
): string[] {
  const monthSet = new Set<string>();
  entries.forEach((e) => {
    const key = normalizeMonthKey(e.month ?? "");
    if (key) monthSet.add(key);
  });
  return sortMonths(Array.from(monthSet));
}
