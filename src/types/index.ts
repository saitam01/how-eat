export type Sex = 'male' | 'female';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'extra';

export type Goal =
  'maintain' | 'lose_mild' | 'lose' | 'lose_aggressive' | 'gain_mild' | 'gain' | 'gain_aggressive';

export type PresetKey = 'estandar' | 'alta_proteina' | 'keto' | 'personalizado';

export interface Inputs {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  bodyFatPct?: number;
  activity: ActivityLevel;
  goal: Goal;
}

export interface Macros {
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
}

export interface MacroResult {
  grams: number;
  calories: number;
  pct: number;
}

export type MacroKey = 'proteinPct' | 'carbsPct' | 'fatPct';

export interface Result {
  bmr: number;
  tdee: number;
  targetCalories: number;
  macros: {
    protein: MacroResult;
    carbs: MacroResult;
    fat: MacroResult;
  };
  formulaUsed: 'mifflin' | 'katch-mcardle';
}

export interface AppState {
  inputs: Inputs;
  macros: Macros;
  preset: PresetKey;
}
