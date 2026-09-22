import type {
  Allergen,
  DietaryPattern,
  FoodItem,
  FoodProfileInput,
  MealComponentRole,
  MealRole,
  PlanningFoodItem,
  PlanningFoodMetadata,
  PlanningIssue,
  StrictIntolerance,
  VarietyGroup,
} from './types';

const allergens: readonly Allergen[] = [
  'egg', 'fish', 'gluten', 'milk', 'peanut', 'sesame', 'shellfish', 'soy', 'tree-nut',
];
const intolerances: readonly StrictIntolerance[] = ['gluten', 'lactose', 'legume', 'soy'];
const dietaryPatterns: readonly DietaryPattern[] = ['omnivore', 'vegetarian', 'vegan'];
const mealRoles: readonly MealRole[] = ['breakfast', 'lunch', 'dinner'];
const componentRoles: readonly MealComponentRole[] = ['protein', 'carbohydrate-fiber', 'produce'];
const varietyGroups: readonly VarietyGroup[] = [
  'beverage', 'dairy', 'egg', 'fish', 'fruit', 'grain', 'legume', 'meat',
  'nuts-and-seeds', 'plant-protein', 'poultry', 'seafood', 'vegetable',
];

export type PlanningCandidateValidation =
  | { valid: true; candidate: PlanningFoodItem }
  | { valid: false; issue: PlanningIssue };

function hasOnlyKnownValues<T extends string>(values: unknown, knownValues: readonly T[]): values is readonly T[] {
  return Array.isArray(values)
    && values.every((value) => typeof value === 'string' && knownValues.includes(value as T))
    && new Set(values).size === values.length;
}

function invalid(food: FoodItem, code: PlanningIssue['code'], message: string): PlanningCandidateValidation {
  return { valid: false, issue: { code, message, foodId: food.id } };
}

function hasValidNutritionBasis(food: FoodItem, nutritionBasis: unknown): boolean {
  if (nutritionBasis === 'per-100g') return food.unit === '100g';
  if (nutritionBasis === 'per-100ml') return food.unit === '100ml';

  return nutritionBasis === 'per-unit'
    && food.unit !== '100g'
    && food.unit !== '100ml'
    && Number.isFinite(food.unitPer100G)
    && (food.unitPer100G ?? 0) > 0;
}

function hasValidMetadata(food: FoodItem, metadata: PlanningFoodMetadata): boolean {
  return hasOnlyKnownValues(metadata.allergens, allergens)
    && hasOnlyKnownValues(metadata.strictIntolerances, intolerances)
    && hasOnlyKnownValues(metadata.dietaryPatterns, dietaryPatterns)
    && metadata.dietaryPatterns.length > 0
    && hasOnlyKnownValues(metadata.mealRoles, mealRoles)
    && metadata.mealRoles.length > 0
    && hasOnlyKnownValues(metadata.componentRoles, componentRoles)
    && typeof metadata.varietyGroup === 'string'
    && varietyGroups.includes(metadata.varietyGroup);
}

/**
 * Rejects incomplete or ambiguous data before it can enter the planner. This is
 * intentionally stricter than the legacy food log, which does not use planning metadata.
 */
export function validatePlanningCandidate(food: FoodItem): PlanningCandidateValidation {
  const nutritionValues = [food.energyKcal, food.proteinG, food.carbsG, food.fatG];
  if (nutritionValues.some((value) => !Number.isFinite(value) || value < 0)) {
    return invalid(food, 'invalid-nutrition-values', 'Nutrition values must be finite and non-negative.');
  }

  if (!food.planning) {
    return invalid(food, 'missing-planning-metadata', 'Planning metadata is required.');
  }

  if (!hasValidNutritionBasis(food, food.planning.nutritionBasis)) {
    return invalid(food, 'ambiguous-nutrition-basis', 'Nutrition basis does not match the food unit.');
  }

  if (!hasValidMetadata(food, food.planning)) {
    return invalid(food, 'invalid-planning-metadata', 'Planning metadata contains missing, duplicate, or unknown values.');
  }

  return { valid: true, candidate: food as PlanningFoodItem };
}

/** Hard constraints only; preferences and variety remain planner scoring inputs. */
export function isFoodAllowedForProfile(food: FoodItem, profile: FoodProfileInput): boolean {
  const validation = validatePlanningCandidate(food);
  if (!validation.valid) return false;

  const { planning } = validation.candidate;
  return !profile.excludedFoodIds.includes(food.id)
    && planning.dietaryPatterns.includes(profile.dietaryPattern)
    && !planning.allergens.some((allergen) => profile.allergens.includes(allergen))
    && !planning.strictIntolerances.some((intolerance) => profile.strictIntolerances.includes(intolerance));
}
