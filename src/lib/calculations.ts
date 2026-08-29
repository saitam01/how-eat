import type { Goal, Inputs, Macros, MacroKey, Result, Sex, ActivityLevel } from '@/types';
import { ACTIVITY_MULTIPLIERS, GOAL_ADJUSTMENTS } from '@/lib/constants';

const KCAL_PER_GRAM: Record<MacroKey, number> = {
  proteinPct: 4,
  carbsPct: 4,
  fatPct: 9,
};

/** True only for a finite number in the inclusive 3–60 range (T7 gate). */
export function isValidBodyFat(bf: unknown): bf is number {
  return typeof bf === 'number' && Number.isFinite(bf) && bf >= 3 && bf <= 60;
}

export function bmrMifflin(inputs: Inputs): number {
  const base = 10 * inputs.weightKg + 6.25 * inputs.heightCm - 5 * inputs.age;
  const raw = inputs.sex === 'male' ? base + 5 : base - 161;
  return Math.round(raw);
}

export function bmrKatchMcArdle(inputs: Inputs): number {
  const lbm = inputs.weightKg * (1 - (inputs.bodyFatPct as number) / 100);
  return Math.round(370 + 21.6 * lbm);
}

export function selectBmr(inputs: Inputs): {
  bmr: number;
  formulaUsed: 'mifflin' | 'katch-mcardle';
} {
  if (isValidBodyFat(inputs.bodyFatPct)) {
    return { bmr: bmrKatchMcArdle(inputs), formulaUsed: 'katch-mcardle' };
  }
  return { bmr: bmrMifflin(inputs), formulaUsed: 'mifflin' };
}

export function tdeeFor(bmr: number, activity: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activity]);
}

function macroResult(pct: number, key: MacroKey, targetCalories: number) {
  const grams = Math.round((targetCalories * pct) / 100 / KCAL_PER_GRAM[key]);
  const calories = grams * KCAL_PER_GRAM[key]; // T3: calories derived from rounded grams
  return { grams, calories, pct };
}

/**
 * Pure TDEE + macro engine. Rounding order (design §5):
 *   bmr = round(raw); tdee = round(bmr * mult);
 *   targetCalories = round(tdee * (1 + adj)).
 * Assumes already-valid Inputs (validation runs upstream).
 */
export function calculate(inputs: Inputs, macros: Macros): Result {
  const { bmr, formulaUsed } = selectBmr(inputs);
  const tdee = tdeeFor(bmr, inputs.activity);
  const targetCalories = Math.round(tdee * (1 + GOAL_ADJUSTMENTS[inputs.goal]));

  return {
    bmr,
    tdee,
    targetCalories,
    formulaUsed,
    macros: {
      protein: macroResult(macros.proteinPct, 'proteinPct', targetCalories),
      carbs: macroResult(macros.carbsPct, 'carbsPct', targetCalories),
      fat: macroResult(macros.fatPct, 'fatPct', targetCalories),
    },
  };
}

// Re-export aliases used by tests/specs for convenience.
export type { Sex, Goal };
