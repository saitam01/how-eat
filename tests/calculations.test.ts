import { describe, it, expect } from 'vitest';
import {
  calculate,
  bmrMifflin,
  bmrKatchMcArdle,
  selectBmr,
  tdeeFor,
  isValidBodyFat,
} from '@/lib/calculations';
import type { Inputs, Macros } from '@/types';

const base: Inputs = {
  sex: 'male',
  age: 30,
  heightCm: 175,
  weightKg: 75,
  activity: 'moderate',
  goal: 'maintain',
};

const STANDARD: Macros = { proteinPct: 30, carbsPct: 40, fatPct: 30 };

describe('isValidBodyFat (T7 gate)', () => {
  it('accepts values in 3..60', () => {
    expect(isValidBodyFat(3)).toBe(true);
    expect(isValidBodyFat(22)).toBe(true);
    expect(isValidBodyFat(60)).toBe(true);
  });
  it('rejects out-of-range, missing, non-numeric', () => {
    expect(isValidBodyFat(2)).toBe(false);
    expect(isValidBodyFat(61)).toBe(false);
    expect(isValidBodyFat(0)).toBe(false);
    expect(isValidBodyFat(-5)).toBe(false);
    expect(isValidBodyFat(undefined)).toBe(false);
    expect(isValidBodyFat(null)).toBe(false);
    expect(isValidBodyFat(NaN)).toBe(false);
    expect(isValidBodyFat('22' as unknown)).toBe(false);
    expect(isValidBodyFat(Infinity)).toBe(false);
  });
});

describe('Vector A — male,30,175,75,none,moderate,maintain', () => {
  const r = calculate(base, STANDARD);
  it('matches reference numbers', () => {
    expect(r.bmr).toBe(1699);
    expect(r.tdee).toBe(2633);
    expect(r.targetCalories).toBe(2633);
    expect(r.formulaUsed).toBe('mifflin');
  });
  it('macro grams/calories (T3: from rounded grams)', () => {
    expect(r.macros.protein).toEqual({ grams: 197, calories: 788, pct: 30 });
    expect(r.macros.carbs).toEqual({ grams: 263, calories: 1052, pct: 40 });
    expect(r.macros.fat).toEqual({ grams: 88, calories: 792, pct: 30 });
  });
  it('calories are self-consistent with grams', () => {
    expect(r.macros.protein.calories).toBe(r.macros.protein.grams * 4);
    expect(r.macros.carbs.calories).toBe(r.macros.carbs.grams * 4);
    expect(r.macros.fat.calories).toBe(r.macros.fat.grams * 9);
  });
});

describe('Female offset', () => {
  it('female,30,175,75 → bmr 1533', () => {
    const r = calculate({ ...base, sex: 'female' }, STANDARD);
    expect(r.bmr).toBe(1533);
    expect(r.formulaUsed).toBe('mifflin');
  });
  it('bmrMifflin computes the offset directly', () => {
    expect(bmrMifflin(base)).toBe(1699);
    expect(bmrMifflin({ ...base, sex: 'female' })).toBe(1533);
  });
});

describe('Vector B — female,28,165,60,22,light,lose (Katch-McArdle)', () => {
  const r = calculate(
    {
      sex: 'female',
      age: 28,
      heightCm: 165,
      weightKg: 60,
      bodyFatPct: 22,
      activity: 'light',
      goal: 'lose',
    },
    STANDARD,
  );
  it('selects Katch-McArdle', () => {
    expect(r.bmr).toBe(1381);
    expect(r.tdee).toBe(1899);
    expect(r.targetCalories).toBe(1614);
    expect(r.formulaUsed).toBe('katch-mcardle');
  });
  it('bmrKatchMcArdle matches the LBM formula', () => {
    expect(
      bmrKatchMcArdle({
        sex: 'female',
        age: 28,
        heightCm: 165,
        weightKg: 60,
        bodyFatPct: 22,
        activity: 'light',
        goal: 'lose',
      }),
    ).toBe(1381);
  });
});

describe('Vector C — invalid body-fat falls back to Mifflin', () => {
  const r = calculate({ ...base, bodyFatPct: 2 }, STANDARD);
  it('identical to A, formulaUsed mifflin', () => {
    expect(r.bmr).toBe(1699);
    expect(r.tdee).toBe(2633);
    expect(r.targetCalories).toBe(2633);
    expect(r.formulaUsed).toBe('mifflin');
  });
  it('selectBmr honors the gate', () => {
    expect(selectBmr({ ...base, bodyFatPct: 2 }).formulaUsed).toBe('mifflin');
    expect(selectBmr({ ...base, bodyFatPct: NaN }).formulaUsed).toBe('mifflin');
  });
});

describe('TDEE multipliers', () => {
  it('moderate (1.55) on raw 1698.75 → 2633', () => {
    expect(tdeeFor(1698.75, 'moderate')).toBe(2633);
  });
  it('every multiplier produces an integer', () => {
    for (const a of ['sedentary', 'light', 'moderate', 'very', 'extra'] as const) {
      expect(Number.isInteger(tdeeFor(1700, a))).toBe(true);
    }
  });
});

describe('Goal adjustments', () => {
  it('maintain keeps TDEE', () => {
    expect(calculate(base, STANDARD).targetCalories).toBe(2633);
  });
  it('lose -15% on tdee 1899 → 1614', () => {
    const r = calculate(
      {
        sex: 'female',
        age: 28,
        heightCm: 165,
        weightKg: 60,
        bodyFatPct: 22,
        activity: 'light',
        goal: 'lose',
      },
      STANDARD,
    );
    expect(r.tdee).toBe(1899);
    expect(r.targetCalories).toBe(1614);
  });
  it('gain_aggressive +20%', () => {
    const r = calculate({ ...base, goal: 'gain_aggressive' }, STANDARD);
    expect(r.targetCalories).toBe(Math.round(2633 * 1.2));
  });
});

describe('Deterministic rounding & integer outputs', () => {
  it('all numeric fields are integers', () => {
    const r = calculate(base, STANDARD);
    for (const v of [
      r.bmr,
      r.tdee,
      r.targetCalories,
      r.macros.protein.grams,
      r.macros.protein.calories,
      r.macros.carbs.grams,
      r.macros.fat.grams,
    ]) {
      expect(Number.isInteger(v)).toBe(true);
    }
  });
  it('same inputs → same result', () => {
    expect(calculate(base, STANDARD)).toEqual(calculate(base, STANDARD));
  });
});

describe('Numeric safety on extreme-but-valid inputs', () => {
  it('max valid extremes produce finite numbers', () => {
    const r = calculate(
      {
        sex: 'male',
        age: 100,
        heightCm: 250,
        weightKg: 300,
        bodyFatPct: 60,
        activity: 'extra',
        goal: 'gain_aggressive',
      },
      STANDARD,
    );
    expect(Number.isFinite(r.bmr)).toBe(true);
    expect(Number.isFinite(r.tdee)).toBe(true);
    expect(Number.isFinite(r.targetCalories)).toBe(true);
    expect(Number.isFinite(r.macros.fat.grams)).toBe(true);
  });
});

describe('No side effects', () => {
  it('does not throw and returns a result object', () => {
    const r = calculate(base, STANDARD);
    expect(r).toBeTypeOf('object');
    expect(r.macros.protein).toHaveProperty('grams');
  });
});
