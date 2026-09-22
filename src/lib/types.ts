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

export type NutritionBasis = 'per-100g' | 'per-100ml' | 'per-unit';

export type Allergen =
  | 'egg'
  | 'fish'
  | 'gluten'
  | 'milk'
  | 'peanut'
  | 'sesame'
  | 'shellfish'
  | 'soy'
  | 'tree-nut';

export type StrictIntolerance = 'gluten' | 'lactose' | 'legume' | 'soy';

export type DietaryPattern = 'omnivore' | 'vegetarian' | 'vegan';

export type MealRole = 'breakfast' | 'lunch' | 'dinner';

/** Required balanced-plate components for lunch and dinner. */
export type MealComponentRole = 'protein' | 'carbohydrate-fiber' | 'produce';

export type VarietyGroup =
  | 'beverage'
  | 'dairy'
  | 'egg'
  | 'fish'
  | 'fruit'
  | 'grain'
  | 'legume'
  | 'meat'
  | 'nuts-and-seeds'
  | 'plant-protein'
  | 'poultry'
  | 'seafood'
  | 'vegetable';

export interface PlanningFoodMetadata {
  nutritionBasis: NutritionBasis;
  allergens: readonly Allergen[];
  strictIntolerances: readonly StrictIntolerance[];
  dietaryPatterns: readonly DietaryPattern[];
  mealRoles: readonly MealRole[];
  /** Empty for foods that are not a balanced-plate component. */
  componentRoles: readonly MealComponentRole[];
  varietyGroup: VarietyGroup;
}

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
  /** Optional for legacy callers; planning requires this metadata to be present. */
  planning?: PlanningFoodMetadata;
}

export interface PlanningFoodItem extends FoodItem {
  planning: PlanningFoodMetadata;
}

export interface FoodProfileInput {
  allergens: readonly Allergen[];
  strictIntolerances: readonly StrictIntolerance[];
  excludedFoodIds: readonly string[];
  preferredFoodIds: readonly string[];
  dietaryPattern: DietaryPattern;
  maxFoodRepeatsPerWeek: number;
  maxVarietyGroupRepeatsPerWeek: number;
}

export interface PlanningNutritionTargets {
  energyKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface PlannedFoodPortion {
  foodId: string;
  /** Food units: 1 is 100g/100ml for base foods, or one item for per-unit foods. */
  amount: number;
  nutrition: DailyTotals;
}

export interface PlannedMeal {
  role: MealRole;
  foods: readonly PlannedFoodPortion[];
  totals: DailyTotals;
}

export interface PlannedDay {
  meals: readonly PlannedMeal[];
  totals: DailyTotals;
  /** Actual daily totals minus the requested daily targets. */
  targetDeviation: DailyTotals;
}

export type PlanningIssueCode =
  | 'ambiguous-nutrition-basis'
  | 'invalid-nutrition-values'
  | 'missing-planning-metadata'
  | 'invalid-planning-metadata'
  | 'no-safe-candidates'
  | 'invalid-goal'
  | 'invalid-profile'
  | 'duplicate-food-id'
  | 'missing-meal-role'
  | 'missing-meal-component'
  | 'target-outside-tolerance'
  | 'food-repeat-limit-exceeded'
  | 'variety-group-repeat-limit-exceeded';

export interface PlanningIssue {
  code: PlanningIssueCode;
  message: string;
  foodId?: string;
}

export interface FeasibleWeeklyPlanResult {
  status: 'feasible';
  days: readonly PlannedDay[];
  issues: readonly PlanningIssue[];
}

export interface DegradedWeeklyPlanResult {
  status: 'degraded';
  days: readonly PlannedDay[];
  issues: readonly PlanningIssue[];
}

export interface InfeasibleWeeklyPlanResult {
  status: 'infeasible';
  days: readonly [];
  issues: readonly PlanningIssue[];
}

export type WeeklyPlanResult =
  | FeasibleWeeklyPlanResult
  | DegradedWeeklyPlanResult
  | InfeasibleWeeklyPlanResult;

export interface MealEntry {
  id: string;
  foodId: string;
  amount: number; // e.g., number of units; if unit is '100g', amount=1 means 100g
  energyKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  timestamp: number; // epoch ms when added
  date: string; // local YYYY-MM-DD
}

export interface WeightEntry {
  id: string;
  date: string; // local YYYY-MM-DD
  weightKg: number;
  timestamp: number;
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
