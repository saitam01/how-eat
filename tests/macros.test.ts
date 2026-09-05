import { describe, it, expect } from 'vitest';
import { largestRemainder, redistributeMacros, normalizeTo100, macroSum } from '@/lib/macros';
import type { Macros } from '@/types';

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

describe('largestRemainder', () => {
  it('returns [] for empty input', () => {
    expect(largestRemainder([], 50)).toEqual([]);
  });

  it('apportions proportionally with largest-remainder', () => {
    expect(largestRemainder([40, 30], 50)).toEqual([29, 21]);
  });

  it('keeps the sum exactly equal to total (multi-remainder loop)', () => {
    const out = largestRemainder([1, 1, 1], 50);
    expect(out).toEqual([17, 17, 16]);
    expect(sum(out)).toBe(50);
  });

  it('splits all-zero input as evenly as possible', () => {
    const out = largestRemainder([0, 0, 0], 100);
    expect(out).toEqual([34, 33, 33]);
    expect(sum(out)).toBe(100);
  });
});

describe('redistributeMacros', () => {
  it('fixes moved slider and renormalizes the other two', () => {
    expect(
      redistributeMacros('proteinPct', 50, { proteinPct: 30, carbsPct: 40, fatPct: 30 }),
    ).toEqual({
      proteinPct: 50,
      carbsPct: 29,
      fatPct: 21,
    });
  });

  it('handles a lower moved value', () => {
    expect(
      redistributeMacros('proteinPct', 40, { proteinPct: 30, carbsPct: 35, fatPct: 35 }),
    ).toEqual({
      proteinPct: 40,
      carbsPct: 30,
      fatPct: 30,
    });
  });

  it('works for a non-protein moved key', () => {
    const out = redistributeMacros('carbsPct', 40, { proteinPct: 30, carbsPct: 35, fatPct: 35 });
    expect(out.carbsPct).toBe(40);
    expect(macroSum(out)).toBe(100);
  });

  it('clamps negative moved values to 0', () => {
    const out = redistributeMacros('proteinPct', -5, { proteinPct: 30, carbsPct: 40, fatPct: 30 });
    expect(out.proteinPct).toBe(0);
    expect(macroSum(out)).toBe(100);
  });

  it('clamps moved values above 100 to 100', () => {
    const out = redistributeMacros('proteinPct', 150, { proteinPct: 30, carbsPct: 40, fatPct: 30 });
    expect(out.proteinPct).toBe(100);
    expect(macroSum(out)).toBe(100);
  });
});

describe('normalizeTo100', () => {
  it('returns a triple that sums to exactly 100', () => {
    const out = normalizeTo100({ proteinPct: 30, carbsPct: 40, fatPct: 30 });
    expect(macroSum(out)).toBe(100);
  });

  it('splits an all-zero triple evenly', () => {
    const out = normalizeTo100({ proteinPct: 0, carbsPct: 0, fatPct: 0 } as Macros);
    expect(out).toEqual({ proteinPct: 34, carbsPct: 33, fatPct: 33 });
    expect(macroSum(out)).toBe(100);
  });

  it('preserves a triple already summing to 100', () => {
    expect(normalizeTo100({ proteinPct: 30, carbsPct: 40, fatPct: 30 })).toEqual({
      proteinPct: 30,
      carbsPct: 40,
      fatPct: 30,
    });
  });
});

describe('macroSum', () => {
  it('sums the three percentages', () => {
    expect(macroSum({ proteinPct: 30, carbsPct: 40, fatPct: 30 })).toBe(100);
  });
});
