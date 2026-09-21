function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toLocalDate(ts: number): string {
  return formatLocalDate(new Date(ts));
}

export function todayLocal(now: Date = new Date()): string {
  return toLocalDate(now.getTime());
}

export function addDays(date: string, delta: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;

  const [year, month, day] = date.split('-').map(Number);
  const result = new Date(year, month - 1, day);
  result.setDate(result.getDate() + delta);
  return formatLocalDate(result);
}

export function groupByDate(entries: { date: string }[]): Record<string, { date: string }[]> {
  return entries.reduce<Record<string, { date: string }[]>>((groups, entry) => {
    (groups[entry.date] ??= []).push(entry);
    return groups;
  }, {});
}

export function entriesForDate<T extends { date: string }>(entries: T[], date: string): T[] {
  return entries.filter((entry) => entry.date === date);
}

export function listDates(entries: { date: string }[]): string[] {
  return [...new Set(entries.map((entry) => entry.date))].sort();
}
