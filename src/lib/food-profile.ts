import { foodDB } from './food-db';
import type { Allergen, DietaryPattern, FoodProfileInput, StrictIntolerance } from './types';

export const FOOD_PROFILE_STORAGE_KEY = 'how-eat-food-profile:v1';
export const FOOD_PROFILE_SCHEMA_VERSION = 1;
export const FOOD_REPEAT_LIMITS = { food: { min: 1, max: 7 }, varietyGroup: { min: 1, max: 21 } } as const;

const allergens: readonly Allergen[] = [
  'egg', 'fish', 'gluten', 'milk', 'peanut', 'sesame', 'shellfish', 'soy', 'tree-nut',
];
const intolerances: readonly StrictIntolerance[] = ['gluten', 'lactose', 'legume', 'soy'];
const dietaryPatterns: readonly DietaryPattern[] = ['omnivore', 'vegetarian', 'vegan'];
const foodIds = new Set(foodDB.items.map((food) => food.id));

export const DEFAULT_FOOD_PROFILE: FoodProfileInput = {
  allergens: [],
  strictIntolerances: [],
  excludedFoodIds: [],
  preferredFoodIds: [],
  dietaryPattern: 'omnivore',
  maxFoodRepeatsPerWeek: 2,
  maxVarietyGroupRepeatsPerWeek: 7,
};

function isKnownList<T extends string>(value: unknown, known: readonly T[]): value is T[] {
  return Array.isArray(value)
    && value.every((item) => typeof item === 'string' && known.includes(item as T))
    && new Set(value).size === value.length;
}

function isKnownFoodList(value: unknown): value is string[] {
  return Array.isArray(value)
    && value.every((item) => typeof item === 'string' && foodIds.has(item))
    && new Set(value).size === value.length;
}

/** Returns a usable profile only when every persisted value matches this storage version's contract. */
export function sanitizeFoodProfile(value: unknown): FoodProfileInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return DEFAULT_FOOD_PROFILE;

  const profile = value as Record<string, unknown>;
  const { allergens: storedAllergens, strictIntolerances, excludedFoodIds, preferredFoodIds, dietaryPattern } = profile;
  const maxFoodRepeatsPerWeek = profile.maxFoodRepeatsPerWeek;
  const maxVarietyGroupRepeatsPerWeek = profile.maxVarietyGroupRepeatsPerWeek;
  const isValid = isKnownList(storedAllergens, allergens)
    && isKnownList(strictIntolerances, intolerances)
    && isKnownFoodList(excludedFoodIds)
    && isKnownFoodList(preferredFoodIds)
    && typeof dietaryPattern === 'string'
    && dietaryPatterns.includes(dietaryPattern as DietaryPattern)
    && typeof maxFoodRepeatsPerWeek === 'number'
    && Number.isInteger(maxFoodRepeatsPerWeek)
    && maxFoodRepeatsPerWeek >= FOOD_REPEAT_LIMITS.food.min
    && maxFoodRepeatsPerWeek <= FOOD_REPEAT_LIMITS.food.max
    && typeof maxVarietyGroupRepeatsPerWeek === 'number'
    && Number.isInteger(maxVarietyGroupRepeatsPerWeek)
    && maxVarietyGroupRepeatsPerWeek >= FOOD_REPEAT_LIMITS.varietyGroup.min
    && maxVarietyGroupRepeatsPerWeek <= FOOD_REPEAT_LIMITS.varietyGroup.max;

  if (!isValid) return DEFAULT_FOOD_PROFILE;

  return {
    allergens: storedAllergens as Allergen[],
    strictIntolerances: strictIntolerances as StrictIntolerance[],
    excludedFoodIds: excludedFoodIds as string[],
    preferredFoodIds: preferredFoodIds as string[],
    dietaryPattern: dietaryPattern as DietaryPattern,
    maxFoodRepeatsPerWeek: maxFoodRepeatsPerWeek as number,
    maxVarietyGroupRepeatsPerWeek: maxVarietyGroupRepeatsPerWeek as number,
  };
}

function sanitizeStoredFoodProfile(value: unknown): FoodProfileInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return DEFAULT_FOOD_PROFILE;

  const stored = value as Record<string, unknown>;
  if (stored.version !== FOOD_PROFILE_SCHEMA_VERSION) return DEFAULT_FOOD_PROFILE;
  return sanitizeFoodProfile(stored.profile);
}

export function loadFoodProfile(): FoodProfileInput {
  try {
    if (typeof window === 'undefined') return DEFAULT_FOOD_PROFILE;
    const stored = window.localStorage.getItem(FOOD_PROFILE_STORAGE_KEY);
    return stored === null ? DEFAULT_FOOD_PROFILE : sanitizeStoredFoodProfile(JSON.parse(stored));
  } catch {
    return DEFAULT_FOOD_PROFILE;
  }
}

export function saveFoodProfile(profile: FoodProfileInput): void {
  try {
    if (typeof window !== 'undefined') {
      const safeProfile = sanitizeFoodProfile(profile);
      window.localStorage.setItem(FOOD_PROFILE_STORAGE_KEY, JSON.stringify({
        version: FOOD_PROFILE_SCHEMA_VERSION,
        profile: safeProfile,
      }));
    }
  } catch {
    // Local persistence is optional and must never interrupt the calculator.
  }
}
