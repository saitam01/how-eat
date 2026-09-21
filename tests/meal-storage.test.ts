import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearMealEntries,
  loadMealEntries,
  MEAL_STORAGE_KEY,
  saveMealEntries,
} from '@/lib/meal-storage';
import type { MealEntry } from '@/lib/types';

const LEGACY_KEY = 'how-eat-meals:v1';
const entry: MealEntry = {
  id: 'meal-1',
  foodId: 'apple',
  amount: 1,
  energyKcal: 52,
  proteinG: 0.3,
  carbsG: 14,
  fatG: 0.2,
  timestamp: new Date(2026, 8, 20, 12).getTime(),
  date: '2026-09-20',
};

describe('meal storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('loads v2 entries as-is', () => {
    window.localStorage.setItem(MEAL_STORAGE_KEY, JSON.stringify([entry]));

    expect(loadMealEntries()).toEqual([entry]);
  });

  it('migrates v1 entries to v2 and removes the legacy key', () => {
    const legacyEntry = {
      id: entry.id,
      foodId: entry.foodId,
      amount: entry.amount,
      energyKcal: entry.energyKcal,
      proteinG: entry.proteinG,
      carbsG: entry.carbsG,
      fatG: entry.fatG,
      timestamp: entry.timestamp,
    };
    window.localStorage.setItem(LEGACY_KEY, JSON.stringify([legacyEntry]));

    expect(loadMealEntries()).toEqual([entry]);
    expect(JSON.parse(window.localStorage.getItem(MEAL_STORAGE_KEY) as string)).toEqual([entry]);
    expect(window.localStorage.getItem(LEGACY_KEY)).toBeNull();
  });

  it('uses today when a legacy timestamp is missing or invalid', () => {
    const legacyEntry = {
      id: entry.id,
      foodId: entry.foodId,
      amount: entry.amount,
      energyKcal: entry.energyKcal,
      proteinG: entry.proteinG,
      carbsG: entry.carbsG,
      fatG: entry.fatG,
    };
    window.localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify([{ ...legacyEntry }, { ...legacyEntry, id: 'invalid', timestamp: Number.NaN }]),
    );

    expect(loadMealEntries(new Date(2026, 8, 21, 12))).toEqual([
      { ...legacyEntry, date: '2026-09-21' },
      { ...legacyEntry, id: 'invalid', timestamp: null, date: '2026-09-21' },
    ]);
  });

  it('returns an empty array for empty, non-array, or corrupt storage', () => {
    expect(loadMealEntries()).toEqual([]);

    window.localStorage.setItem(MEAL_STORAGE_KEY, JSON.stringify({ entry }));
    expect(loadMealEntries()).toEqual([]);

    window.localStorage.setItem(MEAL_STORAGE_KEY, 'not json');
    expect(loadMealEntries()).toEqual([]);

    window.localStorage.removeItem(MEAL_STORAGE_KEY);
    window.localStorage.setItem(LEGACY_KEY, JSON.stringify({ entry }));
    expect(loadMealEntries()).toEqual([]);
  });

  it('migrates an empty legacy array', () => {
    window.localStorage.setItem(LEGACY_KEY, JSON.stringify([]));

    expect(loadMealEntries()).toEqual([]);
    expect(window.localStorage.getItem(LEGACY_KEY)).toBeNull();
  });

  it('round-trips saved entries and clears v2 storage', () => {
    saveMealEntries([entry]);
    expect(loadMealEntries()).toEqual([entry]);

    clearMealEntries();
    expect(window.localStorage.getItem(MEAL_STORAGE_KEY)).toBeNull();
  });

  it('never throws when storage is blocked', () => {
    const getItem = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(loadMealEntries()).toEqual([]);
    getItem.mockRestore();

    const setItem = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => saveMealEntries([entry])).not.toThrow();
    setItem.mockRestore();

    vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => clearMealEntries()).not.toThrow();
  });
});
