import type { ActivityLevel, Goal, Inputs, Macros, MacroKey, PresetKey, Sex } from '@/types';

/** Fixed TDEE activity multipliers (PRD §4.2 / design §5). */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extra: 1.9,
};

/** Goal adjustments applied to TDEE (PRD §4.2 / design §5). */
export const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  maintain: 0,
  lose_mild: -0.1,
  lose: -0.15,
  lose_aggressive: -0.2,
  gain_mild: 0.1,
  gain: 0.15,
  gain_aggressive: 0.2,
};

/** Macro presets (Zone removed per approved proposal; design §1). */
export const PRESETS: Record<Exclude<PresetKey, 'personalizado'>, Macros> = {
  estandar: { proteinPct: 30, carbsPct: 40, fatPct: 30 },
  alta_proteina: { proteinPct: 40, carbsPct: 30, fatPct: 30 },
  keto: { proteinPct: 20, carbsPct: 5, fatPct: 75 },
};

export const PRESET_KEYS: PresetKey[] = ['estandar', 'alta_proteina', 'keto', 'personalizado'];

/** Validation ranges (PRD §4.1). */
export const RANGES = {
  age: { min: 10, max: 100 },
  heightCm: { min: 100, max: 250 },
  weightKg: { min: 30, max: 300 },
  bodyFatPct: { min: 3, max: 60 },
} as const;

export const DEFAULT_INPUTS: Inputs = {
  sex: 'male',
  age: 30,
  heightCm: 175,
  weightKg: 75,
  activity: 'moderate',
  goal: 'maintain',
};

export const DEFAULT_MACROS: Macros = PRESETS.estandar;
export const DEFAULT_PRESET: PresetKey = 'estandar';

/** Spanish (Rioplatense) UI labels (i18n-ready; fixed locale for v1). */
export const LABELS = {
  sex: { male: 'Masculino', female: 'Femenino' } as Record<Sex, string>,
  activity: {
    sedentary: 'Sedentario',
    light: 'Ligero',
    moderate: 'Moderado',
    very: 'Muy activo',
    extra: 'Extra activo',
  } as Record<ActivityLevel, string>,
  goal: {
    maintain: 'Mantener',
    lose_mild: 'Bajar suave (-10%)',
    lose: 'Bajar (-15%)',
    lose_aggressive: 'Bajar fuerte (-20%)',
    gain_mild: 'Subir suave (+10%)',
    gain: 'Subir (+15%)',
    gain_aggressive: 'Subir fuerte (+20%)',
  } as Record<Goal, string>,
  preset: {
    estandar: 'Estándar',
    alta_proteina: 'Alta Proteína',
    keto: 'Keto',
    personalizado: 'Personalizado',
  } as Record<PresetKey, string>,
  macro: {
    proteinPct: 'Proteína',
    carbsPct: 'Carbohidratos',
    fatPct: 'Grasa',
  } as Record<MacroKey, string>,
} as const;

export const STORAGE_KEY = 'how-eat:v1';
