import { describe, it, expect } from 'vitest';
import { serializeParams, shareUrl, parseUrlParams, loadState } from '@/lib/url';
import { savePersisted } from '@/lib/storage';
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

const expectedPartial = {
  inputs: {
    sex: 'female' as const,
    age: 45,
    heightCm: 165,
    weightKg: 60,
    bodyFatPct: 22,
    activity: 'light' as const,
    goal: 'lose' as const,
  },
  macros: { proteinPct: 40, carbsPct: 30, fatPct: 30 },
  preset: 'alta_proteina' as const,
};

describe('serializeParams', () => {
  it('characterizes privacy debt: serializes anthropometric state into the query string', () => {
    const qs = serializeParams(state);
    expect(qs).toBe(
      's=female&a=45&h=165&w=60&b=22&ac=light&g=lose&p=40&c=30&f=30&pr=alta_proteina',
    );
  });

  it('omits bodyFatPct when absent', () => {
    const qs = serializeParams({
      ...state,
      inputs: { ...state.inputs, bodyFatPct: undefined },
    });
    expect(qs).not.toContain('b=');
  });
});

describe('shareUrl', () => {
  it('characterizes privacy debt: recognized URL fields override persisted/default state', () => {
    savePersisted(state);
    window.history.replaceState({}, '', '/?a=40');
    try {
      const { state: loaded } = loadState();
      expect(loaded.inputs.age).toBe(40);
    } finally {
      window.history.replaceState({}, '', '/');
    }
  });

  it('round-trips through parseUrlParams (exact, incl macros+preset)', () => {
    const url = shareUrl(state);
    const search = url.includes('?') ? url.slice(url.indexOf('?')) : '';
    const { partial, invalid } = parseUrlParams(search);
    expect(invalid).toBe(false);
    expect(partial).toEqual(expectedPartial);
  });
});

describe('parseUrlParams', () => {
  it('round-trips a serialized full state (exact)', () => {
    const { partial, invalid } = parseUrlParams('?' + serializeParams(state));
    expect(invalid).toBe(false);
    expect(partial).toEqual(expectedPartial);
  });

  it('treats garbage params as invalid and ignores them', () => {
    const { partial, invalid } = parseUrlParams('?a=abc&s=bogus');
    expect(invalid).toBe(true);
    expect(partial).toEqual({});
  });

  it('applies a partial param (female) and leaves the rest unset', () => {
    const { partial, invalid } = parseUrlParams('?s=female');
    expect(invalid).toBe(false);
    expect(partial.inputs?.sex).toBe('female');
    expect(partial.inputs?.age).toBeUndefined();
    expect(partial.macros).toBeUndefined();
    expect(partial.preset).toBeUndefined();
  });

  it('flags out-of-range numeric params as invalid', () => {
    const { partial, invalid } = parseUrlParams('?a=999');
    expect(invalid).toBe(true);
    expect(partial.inputs?.age).toBeUndefined();
  });

  it('flags a malformed macro param as invalid', () => {
    const { partial, invalid } = parseUrlParams('?p=abc');
    expect(invalid).toBe(true);
    expect(partial.macros).toBeUndefined();
  });
});

describe('loadState', () => {
  it('returns the default state when nothing is present and no invalid params', () => {
    const { state: loaded, invalidParams } = loadState();
    expect(invalidParams).toBe(false);
    expect(loaded.macros.proteinPct + loaded.macros.carbsPct + loaded.macros.fatPct).toBe(100);
  });
});
