import { describe, expect, it } from 'vitest';
import { foodDB } from '../src/lib/food-db';
import type { FoodItem, FoodProfileInput } from '../src/lib/types';
import { isFoodAllowedForProfile, validatePlanningCandidate } from '../src/lib/weekly-plan-domain';

const profile: FoodProfileInput = {
  allergens: [],
  strictIntolerances: [],
  excludedFoodIds: [],
  preferredFoodIds: [],
  dietaryPattern: 'omnivore',
  maxFoodRepeatsPerWeek: 2,
  maxVarietyGroupRepeatsPerWeek: 3,
};

describe('planning candidate validation', () => {
  it('rejects foods without planning metadata', () => {
    const food: FoodItem = {
      id: 'legacy-food', name: 'Legacy food', category: 'protein', energyKcal: 10,
      proteinG: 1, carbsG: 0, fatG: 0, unit: '100g',
    };

    expect(validatePlanningCandidate(food)).toMatchObject({
      valid: false,
      issue: { code: 'missing-planning-metadata', foodId: 'legacy-food' },
    });
  });

  it('rejects a nutrition basis that conflicts with the legacy unit', () => {
    const original = foodDB.items[0];
    if (!original.planning) throw new Error('Bundled food must have planning metadata.');
    const food = {
      ...original,
      planning: { ...original.planning, nutritionBasis: 'per-unit' as const },
    };

    expect(validatePlanningCandidate(food)).toMatchObject({
      valid: false,
      issue: { code: 'ambiguous-nutrition-basis' },
    });
  });

  it('rejects unknown or duplicate component roles', () => {
    const original = foodDB.items[0];
    if (!original.planning) throw new Error('Bundled food must have planning metadata.');
    const food = {
      ...original,
      planning: { ...original.planning, componentRoles: ['protein', 'protein'] as unknown as ['protein'] },
    };

    expect(validatePlanningCandidate(food)).toMatchObject({
      valid: false,
      issue: { code: 'invalid-planning-metadata' },
    });
  });

  it('treats allergies, intolerances, exclusions, and dietary patterns as hard filters', () => {
    const salmon = foodDB.items.find((food) => food.id === 'p05')!;
    const yogurt = foodDB.items.find((food) => food.id === 'd01')!;
    const tofu = foodDB.items.find((food) => food.id === 'vg01')!;

    expect(isFoodAllowedForProfile(salmon, { ...profile, allergens: ['fish'] })).toBe(false);
    expect(isFoodAllowedForProfile(yogurt, { ...profile, strictIntolerances: ['lactose'] })).toBe(false);
    expect(isFoodAllowedForProfile(tofu, { ...profile, excludedFoodIds: ['vg01'] })).toBe(false);
    expect(isFoodAllowedForProfile(salmon, { ...profile, dietaryPattern: 'vegan' })).toBe(false);
  });
});

describe('bundled planning catalog', () => {
  it('has complete, valid, explicit planning metadata for every food', () => {
    expect(foodDB.items.length).toBeGreaterThan(0);
    for (const food of foodDB.items) {
      const validation = validatePlanningCandidate(food);
      expect(validation).toMatchObject({ valid: true });
      if (validation.valid) {
        expect(validation.candidate.planning.mealRoles.length).toBeGreaterThan(0);
      }
    }
  });
});
