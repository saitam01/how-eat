import { describe, it, expect } from 'vitest';
import { validateInputs, resolvePreset } from '@/lib/validation';
import { calculate } from '@/lib/calculations';
import { PRESETS } from '@/lib/constants';
import type { Inputs, Macros } from '@/types';

// A fully valid baseline; each case overrides only the field under test.
const base: Inputs = {
  sex: 'male',
  age: 30,
  heightCm: 175,
  weightKg: 75,
  activity: 'moderate',
  goal: 'maintain',
};

describe('validateInputs', () => {
  it('blocks an empty age (required)', () => {
    const r = validateInputs({ ...base, age: '' } as unknown as Partial<Inputs>);
    expect(r.ok).toBe(false);
    expect(r.errors.age).toBe('required');
  });

  it('clamps age 150 down to 100', () => {
    const r = validateInputs({ ...base, age: 150 });
    expect(r.clamped.age).toBe(100);
    expect(r.errors.age).toBe('clamped');
    // clamped is non-blocking → still valid
    expect(r.ok).toBe(true);
  });

  it('accepts a valid age 45', () => {
    const r = validateInputs({ ...base, age: 45 });
    expect(r.clamped.age).toBe(45);
    expect(r.errors.age).toBeUndefined();
    expect(r.ok).toBe(true);
  });

  it('blocks a non-numeric heightCm ("abc")', () => {
    const r = validateInputs({ ...base, heightCm: 'abc' } as unknown as Partial<Inputs>);
    expect(r.ok).toBe(false);
    expect(r.errors.heightCm).toBe('required');
  });

  it('treats weightKg 0 as out-of-range and clamps to the minimum', () => {
    const r = validateInputs({ ...base, weightKg: 0 });
    expect(r.clamped.weightKg).toBe(30);
    expect(r.errors.weightKg).toBe('clamped');
  });

  it('treats an empty bodyFatPct as optional/valid (dropped)', () => {
    const r = validateInputs({ ...base, bodyFatPct: '' } as unknown as Partial<Inputs>);
    expect(r.errors.bodyFatPct).toBeUndefined();
    expect(r.clamped.bodyFatPct).toBeUndefined();
    expect(r.ok).toBe(true);
  });

  it('drops an out-of-range bodyFatPct (2)', () => {
    const r = validateInputs({ ...base, bodyFatPct: 2 });
    expect(r.clamped.bodyFatPct).toBeUndefined();
    expect(r.errors.bodyFatPct).toBeUndefined();
  });

  it('keeps an in-range bodyFatPct (22) and triggers Katch-McArdle', () => {
    const r = validateInputs({ ...base, bodyFatPct: 22 });
    expect(r.clamped.bodyFatPct).toBe(22);
    const result = calculate(r.clamped, { proteinPct: 30, carbsPct: 40, fatPct: 30 });
    expect(result.formulaUsed).toBe('katch-mcardle');
  });
});

describe('resolvePreset', () => {
  it('resolves the standard preset', () => {
    expect(resolvePreset({ proteinPct: 30, carbsPct: 40, fatPct: 30 })).toBe('estandar');
  });

  it('resolves the keto preset', () => {
    expect(resolvePreset(PRESETS.keto as Macros)).toBe('keto');
  });

  it('returns null for a custom, non-matching triple', () => {
    expect(resolvePreset({ proteinPct: 33, carbsPct: 33, fatPct: 34 })).toBeNull();
  });
});
