import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearWeightEntries,
  loadWeightEntries,
  saveWeightEntries,
  WEIGHT_STORAGE_KEY,
} from '@/lib/weight-storage';
import type { WeightEntry } from '@/lib/types';

const entry: WeightEntry = {
  id: 'weight-1',
  date: '2026-09-20',
  weightKg: 75.5,
  timestamp: new Date(2026, 8, 20, 12).getTime(),
};

describe('weight storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('loads an empty array when storage is empty, invalid, or corrupt', () => {
    expect(loadWeightEntries()).toEqual([]);

    window.localStorage.setItem(WEIGHT_STORAGE_KEY, JSON.stringify({ entry }));
    expect(loadWeightEntries()).toEqual([]);

    window.localStorage.setItem(WEIGHT_STORAGE_KEY, 'not json');
    expect(loadWeightEntries()).toEqual([]);
  });

  it('round-trips saved entries and clears storage', () => {
    saveWeightEntries([entry]);
    expect(loadWeightEntries()).toEqual([entry]);

    clearWeightEntries();
    expect(window.localStorage.getItem(WEIGHT_STORAGE_KEY)).toBeNull();
  });

  it('never throws when storage is blocked', () => {
    const getItem = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(loadWeightEntries()).toEqual([]);
    getItem.mockRestore();

    const setItem = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => saveWeightEntries([entry])).not.toThrow();
    setItem.mockRestore();

    vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => clearWeightEntries()).not.toThrow();
  });
});
