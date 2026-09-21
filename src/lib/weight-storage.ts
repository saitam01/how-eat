import type { WeightEntry } from './types';

export const WEIGHT_STORAGE_KEY = 'how-eat-weight:v1';

export function loadWeightEntries(): WeightEntry[] {
  try {
    const storedEntries = window.localStorage.getItem(WEIGHT_STORAGE_KEY);
    if (storedEntries === null) return [];

    const entries = JSON.parse(storedEntries);
    return Array.isArray(entries) ? (entries as WeightEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveWeightEntries(entries: WeightEntry[]): void {
  try {
    window.localStorage.setItem(WEIGHT_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* no-op */
  }
}

export function clearWeightEntries(): void {
  try {
    window.localStorage.removeItem(WEIGHT_STORAGE_KEY);
  } catch {
    /* no-op */
  }
}
