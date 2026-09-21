import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
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
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('serializes without a browser global', () => {
    vi.stubGlobal('window', undefined);
    expect(shareUrl(state)).toBe(`?${serializeParams(state)}`);
  });

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
  afterEach(() => {
    vi.unstubAllGlobals();
  });

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

  it('flags invalid height, weight, and body-fat params without setting fields', () => {
    for (const [param, field] of [
      ['h=99', 'heightCm'],
      ['w=29', 'weightKg'],
      ['b=61', 'bodyFatPct'],
    ] as const) {
      const { partial, invalid } = parseUrlParams(`?${param}`);
      expect(invalid).toBe(true);
      expect(partial.inputs?.[field]).toBeUndefined();
    }
  });

  it('flags invalid activity, goal, and preset params', () => {
    for (const param of ['ac=bogus', 'g=bogus', 'pr=bogus']) {
      const { invalid } = parseUrlParams(`?${param}`);
      expect(invalid).toBe(true);
    }
  });

  it('creates inputs when a valid field appears without sex', () => {
    for (const [param, field, value] of [
      ['h=165', 'heightCm', 165],
      ['w=75', 'weightKg', 75],
      ['b=20', 'bodyFatPct', 20],
      ['ac=light', 'activity', 'light'],
      ['g=maintain', 'goal', 'maintain'],
    ] as const) {
      const { partial, invalid } = parseUrlParams(`?${param}`);
      expect(invalid).toBe(false);
      expect(partial.inputs).toEqual({ [field]: value });
    }
  });

  it('parses a valid preset without sex', () => {
    const { partial, invalid } = parseUrlParams('?pr=keto');
    expect(invalid).toBe(false);
    expect(partial).toEqual({ preset: 'keto' });
  });

  it('uses an empty default search without a browser global', () => {
    vi.stubGlobal('window', undefined);
    expect(parseUrlParams()).toEqual({ partial: {}, invalid: false });
  });
});

describe('loadState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns the default state when nothing is present and no invalid params', () => {
    const { state: loaded, invalidParams } = loadState();
    expect(invalidParams).toBe(false);
    expect(loaded.macros.proteinPct + loaded.macros.carbsPct + loaded.macros.fatPct).toBe(100);
  });

  it('keeps a persisted custom preset when its macros match no preset', () => {
    savePersisted({
      ...state,
      macros: { proteinPct: 25, carbsPct: 45, fatPct: 30 },
      preset: 'personalizado',
    });

    const { state: loaded } = loadState();
    expect(loaded.macros).toEqual({ proteinPct: 25, carbsPct: 45, fatPct: 30 });
    expect(loaded.preset).toBe('personalizado');
  });
});
