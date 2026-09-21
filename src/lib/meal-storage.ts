import type { MealEntry } from './types';
import { toLocalDate, todayLocal } from './date';

export const MEAL_STORAGE_KEY = 'how-eat-meals:v2';
const LEGACY_KEY = 'how-eat-meals:v1';

type LegacyMealEntry = Omit<MealEntry, 'date'>;

function legacyDate(entry: LegacyMealEntry, now: Date): string {
  const timestamp = entry.timestamp;
  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp) || Number.isNaN(new Date(timestamp).getTime())) {
    return todayLocal(now);
  }
  return toLocalDate(timestamp);
}

export function loadMealEntries(now: Date = new Date()): MealEntry[] {
  try {
    const storedEntries = window.localStorage.getItem(MEAL_STORAGE_KEY);
    if (storedEntries !== null) {
      const entries = JSON.parse(storedEntries);
      return Array.isArray(entries) ? (entries as MealEntry[]) : [];
    }

    const legacyEntries = window.localStorage.getItem(LEGACY_KEY);
    if (legacyEntries === null) return [];

    const parsedEntries = JSON.parse(legacyEntries);
    if (!Array.isArray(parsedEntries)) return [];

    const entries = (parsedEntries as LegacyMealEntry[]).map((entry) => ({
      ...entry,
      date: legacyDate(entry, now),
    }));
    window.localStorage.setItem(MEAL_STORAGE_KEY, JSON.stringify(entries));
    window.localStorage.removeItem(LEGACY_KEY);
    return entries;
  } catch {
    return [];
  }
}

export function saveMealEntries(entries: MealEntry[]): void {
  try {
    window.localStorage.setItem(MEAL_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* no-op */
  }
}

export function clearMealEntries(): void {
  try {
    window.localStorage.removeItem(MEAL_STORAGE_KEY);
  } catch {
    /* no-op */
  }
}
