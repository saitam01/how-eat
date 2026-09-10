import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadPersisted, savePersisted, clearPersisted } from '@/lib/storage';
import { STORAGE_KEY } from '@/lib/constants';
import type { AppState } from '@/types';

const state: AppState = {
  inputs: {
    sex: 'female',
    age: 45,
    heightCm: 165,
    weightKg: 60,
    bodyFatPct: 22,
    activity: 'light',
    goal: 'lose',
  },
  macros: { proteinPct: 40, carbsPct: 30, fatPct: 30 },
  preset: 'alta_proteina',
};

describe('storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('uses the versioned key "how-eat:v1"', () => {
    savePersisted(state);
    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string);
    expect(parsed.inputs).toEqual(state.inputs);
    expect(parsed.macros).toEqual(state.macros);
    expect(parsed.preset).toBe('alta_proteina');
  });

  it('round-trips a saved state', () => {
    savePersisted(state);
    expect(loadPersisted()).toEqual(state);
  });

  it('returns null when nothing is stored', () => {
    expect(loadPersisted()).toBeNull();
  });

  it('returns null on corrupt JSON', () => {
    window.localStorage.setItem(STORAGE_KEY, 'this is not json {{{');
    expect(loadPersisted()).toBeNull();
  });

  it('returns null on a malformed object', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 'bar' }));
    expect(loadPersisted()).toBeNull();
  });

  it('characterizes the unsafe shallow check: nested invalid fields currently pass', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ inputs: { age: 'not-a-number' }, macros: { proteinPct: null } }),
    );
    expect(loadPersisted()).toEqual({
      inputs: { age: 'not-a-number' },
      macros: { proteinPct: null },
    });
  });

  it('characterizes the unsafe unversioned check: unknown-version-like data currently passes', () => {
    const unknownVersion = { schemaVersion: 999, inputs: {}, macros: {} };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unknownVersion));
    expect(loadPersisted()).toEqual(unknownVersion);
  });

  it('does not crash when getItem throws (blocked storage)', () => {
    const spy = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => loadPersisted()).not.toThrow();
    expect(loadPersisted()).toBeNull();
    spy.mockRestore();
  });

  it('does not crash when setItem throws (blocked storage)', () => {
    const spy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => savePersisted(state)).not.toThrow();
    spy.mockRestore();
  });

  it('does not crash when removeItem throws (blocked storage)', () => {
    const spy = vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => clearPersisted()).not.toThrow();
    spy.mockRestore();
  });
});
