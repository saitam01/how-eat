import type { ActivityLevel, Goal, Inputs, Macros, PresetKey, Sex } from '@/types';
import { DEFAULT_INPUTS, PRESETS, RANGES } from '@/lib/constants';

type FieldError = 'required' | 'invalid' | 'clamped';

export interface ValidationResult {
  ok: boolean;
  errors: Partial<Record<keyof Inputs, FieldError>>;
  clamped: Inputs;
}

const VALID_SEX: Sex[] = ['male', 'female'];
const VALID_ACTIVITY: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'very', 'extra'];
const VALID_GOAL: Goal[] = [
  'maintain',
  'lose_mild',
  'lose',
  'lose_aggressive',
  'gain_mild',
  'gain',
  'gain_aggressive',
];

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function parseNum(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Validate + clamp raw form values into a complete Inputs.
 * - Missing/garbage required field → blocking error (ok=false), clamped falls back to default.
 * - Present but out-of-range → clamped to bound, non-blocking 'clamped' note.
 * - bodyFatPct optional: invalid/out-of-range values are dropped (undefined) so the engine
 *   falls back to Mifflin-St Jeor (design §5 T7 gate).
 */
export function validateInputs(raw: Partial<Inputs>): ValidationResult {
  const errors: ValidationResult['errors'] = {};
  const clamped: Inputs = { ...DEFAULT_INPUTS };

  // sex
  if (!raw.sex || !VALID_SEX.includes(raw.sex)) {
    errors.sex = 'required';
  } else {
    clamped.sex = raw.sex;
  }

  // age
  const age = parseNum(raw.age);
  if (age === null) {
    errors.age = 'required';
  } else if (age < RANGES.age.min || age > RANGES.age.max) {
    clamped.age = Math.round(clamp(age, RANGES.age.min, RANGES.age.max));
    errors.age = 'clamped';
  } else {
    clamped.age = Math.round(age);
  }

  // heightCm
  const heightCm = parseNum(raw.heightCm);
  if (heightCm === null) {
    errors.heightCm = 'required';
  } else if (heightCm < RANGES.heightCm.min || heightCm > RANGES.heightCm.max) {
    clamped.heightCm = Math.round(clamp(heightCm, RANGES.heightCm.min, RANGES.heightCm.max));
    errors.heightCm = 'clamped';
  } else {
    clamped.heightCm = Math.round(heightCm);
  }

  // weightKg
  const weightKg = parseNum(raw.weightKg);
  if (weightKg === null) {
    errors.weightKg = 'required';
  } else if (weightKg < RANGES.weightKg.min || weightKg > RANGES.weightKg.max) {
    clamped.weightKg = Math.round(clamp(weightKg, RANGES.weightKg.min, RANGES.weightKg.max));
    errors.weightKg = 'clamped';
  } else {
    clamped.weightKg = Math.round(weightKg);
  }

  // bodyFatPct (optional)
  const bodyFatPct = parseNum(raw.bodyFatPct);
  if (bodyFatPct !== null) {
    if (bodyFatPct >= RANGES.bodyFatPct.min && bodyFatPct <= RANGES.bodyFatPct.max) {
      clamped.bodyFatPct = Math.round(bodyFatPct);
    }
    // out-of-range / invalid → dropped (engine falls back to Mifflin)
  }

  // activity
  if (!raw.activity || !VALID_ACTIVITY.includes(raw.activity)) {
    errors.activity = 'required';
  } else {
    clamped.activity = raw.activity;
  }

  // goal
  if (!raw.goal || !VALID_GOAL.includes(raw.goal)) {
    errors.goal = 'required';
  } else {
    clamped.goal = raw.goal;
  }

  const ok = !Object.values(errors).some((e) => e === 'required' || e === 'invalid');
  return { ok, errors, clamped };
}

/** Map a macro triple to its preset key, or null if it matches none (→ personalizado). */
export function resolvePreset(macros: Macros): PresetKey | null {
  for (const key of Object.keys(PRESETS) as Exclude<PresetKey, 'personalizado'>[]) {
    const p = PRESETS[key];
    if (
      p.proteinPct === macros.proteinPct &&
      p.carbsPct === macros.carbsPct &&
      p.fatPct === macros.fatPct
    ) {
      return key;
    }
  }
  return null;
}
