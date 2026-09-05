export type FoodCategory =
  | 'protein'
  | 'fruit'
  | 'vegetable'
  | 'legume'
  | 'dairy'
  | 'fat'
  | 'grain'
  | 'snack'
  | 'beverage'
  | 'vegan';

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  category: FoodCategory;
  energyKcal: number; // kcal per 100g or per unit
  proteinG: number; // grams per 100g or per unit
  carbsG: number; // grams per 100g or per unit
  fatG: number; // grams per 100g or per unit
  unit: string; // e.g., '100g', 'piece', 'cup'
  unitPer100G?: number; // conversion factor if unit != '100g'
}

export interface MealEntry {
  id: string;
  foodId: string;
  amount: number; // e.g., number of units; if unit is '100g', amount=1 means 100g
  energyKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  timestamp: number; // epoch ms when added
}

export interface MacroGoal {
  energyTargetKcal: number; // TDEE adjusted by goal
  proteinPct: number; // % of energy from protein (0-100)
  carbsPct: number; // % of energy from carbs
  fatPct: number; // % of energy from fat
}

export interface DailyTotals {
  energyKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}
