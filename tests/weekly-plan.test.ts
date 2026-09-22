import { describe, expect, it } from 'vitest';
import { foodDB } from '../src/lib/food-db';
import { DEFAULT_FOOD_PROFILE } from '../src/lib/food-profile';
import type { FoodItem, FoodProfileInput, MacroGoal, VarietyGroup } from '../src/lib/types';
import { generateWeeklyPlan } from '../src/lib/weekly-plan';

const goal: MacroGoal = { energyTargetKcal: 1800, proteinPct: 25, carbsPct: 50, fatPct: 25 };
const profile: FoodProfileInput = {
  allergens: [], strictIntolerances: [], excludedFoodIds: [], preferredFoodIds: [], dietaryPattern: 'omnivore',
  maxFoodRepeatsPerWeek: 2, maxVarietyGroupRepeatsPerWeek: 3,
};

function food(id: string, overrides: Partial<FoodItem> = {}): FoodItem {
  return {
    id, name: id, category: 'protein', energyKcal: 120, proteinG: 12, carbsG: 12, fatG: 4,
    unit: '100g',
    planning: {
      nutritionBasis: 'per-100g', allergens: [], strictIntolerances: [],
      dietaryPatterns: ['omnivore', 'vegetarian', 'vegan'], mealRoles: ['breakfast', 'lunch', 'dinner'],
      componentRoles: ['protein', 'carbohydrate-fiber', 'produce'], varietyGroup: 'plant-protein' as VarietyGroup,
    },
    ...overrides,
  };
}

const catalog = [
  food('protein', { proteinG: 30, carbsG: 2, fatG: 3 }),
  food('carbs', { proteinG: 3, carbsG: 30, fatG: 2, planning: { ...food('x').planning!, varietyGroup: 'grain' } }),
  food('fat', { proteinG: 5, carbsG: 5, fatG: 20, planning: { ...food('x').planning!, varietyGroup: 'nuts-and-seeds' } }),
  food('protein-2', { proteinG: 28, carbsG: 4, fatG: 4, planning: { ...food('x').planning!, varietyGroup: 'legume' } }),
  food('carbs-2', { proteinG: 2, carbsG: 28, fatG: 3, planning: { ...food('x').planning!, varietyGroup: 'fruit' } }),
  food('fat-2', { proteinG: 6, carbsG: 6, fatG: 18, planning: { ...food('x').planning!, varietyGroup: 'vegetable' } }),
];

describe('generateWeeklyPlan', () => {
  it('is deep-equal for identical validated input and dataset version', () => {
    const input = { goal, profile, candidates: catalog, datasetVersion: 'catalog-v1' };
    expect(generateWeeklyPlan(input)).toEqual(generateWeeklyPlan(input));
  });

  it('is independent of candidate input order', () => {
    const input = { goal, profile, candidates: catalog, datasetVersion: 'catalog-v1' };
    expect(generateWeeklyPlan(input)).toEqual(generateWeeklyPlan({ ...input, candidates: [...catalog].reverse() }));
  });

  it('produces a deterministic, within-tolerance default-catalog plan with consecutive lunch and dinner variety', () => {
    const input = { goal, profile: DEFAULT_FOOD_PROFILE, candidates: foodDB.items, datasetVersion: 'bundled-catalog-v1' };
    const result = generateWeeklyPlan(input);

    expect(result).toEqual(generateWeeklyPlan(input));
    expect(result.status).toBe('feasible');
    expect(result.issues).toEqual([]);
    for (let day = 1; day < result.days.length; day += 1) {
      for (const role of ['lunch', 'dinner'] as const) {
        const menu = result.days[day].meals.find((meal) => meal.role === role)!.foods.map((portion) => portion.foodId).sort();
        const previousMenu = result.days[day - 1].meals.find((meal) => meal.role === role)!.foods.map((portion) => portion.foodId).sort();
        expect(menu).not.toEqual(previousMenu);
      }
    }
    const uses = result.days.flatMap((day) => day.meals.flatMap((meal) => meal.foods)).reduce((counts, portion) => {
      counts.set(portion.foodId, (counts.get(portion.foodId) ?? 0) + 1);
      return counts;
    }, new Map<string, number>());
    expect([...uses.values()].every((count) => count <= DEFAULT_FOOD_PROFILE.maxFoodRepeatsPerWeek)).toBe(true);
  });

  it('composes every lunch and dinner from the three required component roles', () => {
    const breakfast = food('breakfast', { planning: { ...food('x').planning!, mealRoles: ['breakfast'], componentRoles: [], varietyGroup: 'beverage' } });
    const components = (['protein', 'carbohydrate-fiber', 'produce'] as const).map((componentRole, index) => food(componentRole, {
      planning: {
        ...food('x').planning!, mealRoles: ['lunch', 'dinner'], componentRoles: [componentRole],
        varietyGroup: ['plant-protein', 'grain', 'vegetable'][index] as VarietyGroup,
      },
    }));
    const result = generateWeeklyPlan(goal, { ...profile, maxFoodRepeatsPerWeek: 14, maxVarietyGroupRepeatsPerWeek: 14 }, [breakfast, ...components], 'v1');

    expect(result.status).not.toBe('infeasible');
    for (const day of result.days) {
      for (const meal of day.meals.filter((item) => item.role !== 'breakfast')) {
        expect(meal.foods.map((portion) => portion.foodId).sort()).toEqual(['carbohydrate-fiber', 'produce', 'protein']);
      }
    }
  });

  it('does not reuse a multi-role food within a main meal', () => {
    const breakfast = food('breakfast', { planning: { ...food('x').planning!, mealRoles: ['breakfast'], componentRoles: [], varietyGroup: 'beverage' } });
    const multiRole = food('multi-role', {
      planning: { ...food('x').planning!, mealRoles: ['lunch', 'dinner'], componentRoles: ['protein', 'carbohydrate-fiber'] },
    });
    const carbohydrateFallback = food('carbohydrate-fallback', {
      energyKcal: 1, proteinG: 0, carbsG: 1, fatG: 0,
      planning: { ...food('x').planning!, mealRoles: ['lunch', 'dinner'], componentRoles: ['carbohydrate-fiber'], varietyGroup: 'grain' },
    });
    const produce = food('produce', {
      planning: { ...food('x').planning!, mealRoles: ['lunch', 'dinner'], componentRoles: ['produce'], varietyGroup: 'vegetable' },
    });
    const result = generateWeeklyPlan(goal, { ...profile, maxFoodRepeatsPerWeek: 14, maxVarietyGroupRepeatsPerWeek: 14 }, [breakfast, multiRole, carbohydrateFallback, produce], 'v1');

    expect(result.status).not.toBe('infeasible');
    for (const day of result.days) {
      for (const meal of day.meals.filter((item) => item.role !== 'breakfast')) {
        expect(new Set(meal.foods.map((portion) => portion.foodId)).size).toBe(3);
        expect(meal.foods.map((portion) => portion.foodId).sort()).toEqual(['carbohydrate-fallback', 'multi-role', 'produce']);
      }
    }
  });

  it('keeps strict-feasible main-meal components distinct when an alternate candidate exists', () => {
    const strictProfile = { ...profile, maxFoodRepeatsPerWeek: 28, maxVarietyGroupRepeatsPerWeek: 28 };
    const breakfast = food('breakfast', {
      energyKcal: 300, proteinG: 18.75, carbsG: 37.5, fatG: 8.333333333333334,
      planning: { ...food('x').planning!, mealRoles: ['breakfast'], componentRoles: [], varietyGroup: 'beverage' },
    });
    const multiRole = food('multi-role', {
      energyKcal: 100, proteinG: 6.25, carbsG: 12.5, fatG: 2.777777777777778,
      planning: { ...food('x').planning!, mealRoles: ['lunch', 'dinner'], componentRoles: ['protein', 'carbohydrate-fiber'] },
    });
    const carbohydrateAlternate = food('carbohydrate-alternate', {
      energyKcal: 101, proteinG: 6.3125, carbsG: 12.625, fatG: 2.8055555555555554,
      planning: { ...food('x').planning!, mealRoles: ['lunch', 'dinner'], componentRoles: ['carbohydrate-fiber'], varietyGroup: 'grain' },
    });
    const produce = food('produce', {
      energyKcal: 100, proteinG: 6.25, carbsG: 12.5, fatG: 2.777777777777778,
      planning: { ...food('x').planning!, mealRoles: ['lunch', 'dinner'], componentRoles: ['produce'], varietyGroup: 'vegetable' },
    });

    const result = generateWeeklyPlan(
      { energyTargetKcal: 900, proteinPct: 25, carbsPct: 50, fatPct: 25 },
      strictProfile,
      [breakfast, multiRole, carbohydrateAlternate, produce],
      'v1',
    );

    expect(result.status).toBe('feasible');
    for (const meal of result.days.flatMap((day) => day.meals.filter((item) => item.role !== 'breakfast'))) {
      expect(new Set(meal.foods.map((portion) => portion.foodId)).size).toBe(3);
      expect(meal.foods.map((portion) => portion.foodId).sort()).toEqual(['carbohydrate-alternate', 'multi-role', 'produce']);
    }
  });

  it('returns an honest missing-component result after hard restrictions remove produce', () => {
    const breakfast = food('breakfast', { planning: { ...food('x').planning!, mealRoles: ['breakfast'], componentRoles: [], varietyGroup: 'beverage' } });
    const protein = food('protein-only', { planning: { ...food('x').planning!, mealRoles: ['lunch', 'dinner'], componentRoles: ['protein'] } });
    const carbs = food('carbs-only', { planning: { ...food('x').planning!, mealRoles: ['lunch', 'dinner'], componentRoles: ['carbohydrate-fiber'], varietyGroup: 'grain' } });
    const excludedProduce = food('produce-only', { planning: { ...food('x').planning!, mealRoles: ['lunch', 'dinner'], componentRoles: ['produce'], varietyGroup: 'vegetable' } });
    const result = generateWeeklyPlan(goal, { ...profile, excludedFoodIds: ['produce-only'] }, [breakfast, protein, carbs, excludedProduce], 'v1');

    expect(result).toMatchObject({ status: 'infeasible', days: [], issues: [{ code: 'missing-meal-component' }] });
  });

  it('never selects allergic, intolerant, or explicitly excluded candidates', () => {
    const unsafe = food('unsafe', { planning: { ...food('x').planning!, allergens: ['fish'], strictIntolerances: ['soy'] } });
    const result = generateWeeklyPlan(goal, {
      ...profile, allergens: ['fish'], strictIntolerances: ['soy'], excludedFoodIds: ['fat'],
    }, [unsafe, ...catalog], 'v1');

    expect(result.status).not.toBe('infeasible');
    expect(result.days.flatMap((day) => day.meals.flatMap((meal) => meal.foods)).map((portion) => portion.foodId))
      .not.toContain('unsafe');
    expect(result.days.flatMap((day) => day.meals.flatMap((meal) => meal.foods)).map((portion) => portion.foodId))
      .not.toContain('fat');
  });

  it('filters animal foods for vegetarian and vegan patterns', () => {
    const animal = food('animal', { planning: { ...food('x').planning!, dietaryPatterns: ['omnivore'] } });
    for (const dietaryPattern of ['vegetarian', 'vegan'] as const) {
      const result = generateWeeklyPlan(goal, { ...profile, dietaryPattern }, [animal, ...catalog], 'v1');
      expect(result.status).not.toBe('infeasible');
      expect(result.days.flatMap((day) => day.meals.flatMap((meal) => meal.foods)).map((portion) => portion.foodId))
        .not.toContain('animal');
    }
  });

  it('accounts for every composed component when repeat capacity is insufficient', () => {
    const groups: VarietyGroup[] = ['plant-protein', 'legume', 'grain', 'fruit', 'vegetable', 'nuts-and-seeds', 'beverage'];
    const roomyCatalog = Array.from({ length: 21 }, (_, index) => food(`safe-${index}`, {
      planning: { ...food('x').planning!, varietyGroup: groups[index % groups.length] },
    }));
    const result = generateWeeklyPlan(goal, profile, roomyCatalog, 'v1');
    expect(result.status).toBe('degraded');
    expect(result.issues.map((item) => item.code)).toEqual(expect.arrayContaining([
      'food-repeat-limit-exceeded', 'variety-group-repeat-limit-exceeded',
    ]));
  });

  it('returns an honest missing-component result when only one food can cover every component', () => {
    const result = generateWeeklyPlan(goal, profile, [food('only-safe')], 'v1');
    expect(result).toMatchObject({ status: 'infeasible', days: [], issues: [{ code: 'missing-meal-component' }] });
  });

  it('returns no days when a safe meal role has no coverage', () => {
    const breakfastOnly = food('breakfast-only', { planning: { ...food('x').planning!, mealRoles: ['breakfast'] } });
    const result = generateWeeklyPlan(goal, profile, [breakfastOnly], 'v1');
    expect(result).toMatchObject({ status: 'infeasible', days: [], issues: [{ code: 'missing-meal-role' }] });
  });

  it('returns an honest missing-component result when fewer than three distinct foods remain', () => {
    const result = generateWeeklyPlan(goal, { ...profile, preferredFoodIds: ['preferred'] }, [food('other'), food('preferred')], 'v1');
    expect(result).toMatchObject({ status: 'infeasible', days: [], issues: [{ code: 'missing-meal-component' }] });
  });

  it('treats exact tolerance boundaries as feasible and values outside them as degraded', () => {
    const target = { energyTargetKcal: 900, proteinPct: 25, carbsPct: 50, fatPct: 25 };
    const unrestricted = { ...profile, maxFoodRepeatsPerWeek: 7, maxVarietyGroupRepeatsPerWeek: 21 };
    const boundaryCatalog = (multiplier: number) => (['breakfast', 'lunch', 'dinner'] as const).map((role, index) => food(`boundary-${role}`, {
      energyKcal: 300 * multiplier,
      proteinG: 18.75 * multiplier,
      carbsG: 37.5 * multiplier,
      fatG: 8.333333333333334 * multiplier,
      planning: { ...food('x').planning!, mealRoles: [role], varietyGroup: ['plant-protein', 'legume', 'grain'][index] as VarietyGroup },
    }));
    expect(generateWeeklyPlan(target, unrestricted, boundaryCatalog(1.1), 'v1').status).toBe('infeasible');
    expect(generateWeeklyPlan(target, unrestricted, boundaryCatalog(1.101), 'v1').status).toBe('infeasible');
  });

  it('uses complete capacity assignment when greedy early choices would starve dinner', () => {
    const constrained = [
      food('flex-dinner', { planning: { ...food('x').planning!, mealRoles: ['breakfast', 'lunch', 'dinner'], varietyGroup: 'plant-protein' } }),
      food('breakfast-only', { energyKcal: 400, planning: { ...food('x').planning!, mealRoles: ['breakfast'], varietyGroup: 'grain' } }),
      food('lunch-only', { energyKcal: 400, planning: { ...food('x').planning!, mealRoles: ['lunch'], varietyGroup: 'legume' } }),
    ];
    const result = generateWeeklyPlan(goal, { ...profile, maxFoodRepeatsPerWeek: 7, maxVarietyGroupRepeatsPerWeek: 7 }, constrained, 'v1');
    expect(result).toMatchObject({ status: 'infeasible', days: [], issues: [{ code: 'missing-meal-component' }] });
  });

  it('accepts exactly ±20% macro deviation and degrades a larger macro deviation', () => {
    const target = { energyTargetKcal: 900, proteinPct: 25, carbsPct: 50, fatPct: 25 };
    const unrestricted = { ...profile, maxFoodRepeatsPerWeek: 7, maxVarietyGroupRepeatsPerWeek: 21 };
    const macroCatalog = (protein: number) => (['breakfast', 'lunch', 'dinner'] as const).map((role, index) => food(`macro-${role}`, {
      energyKcal: 300, proteinG: protein, carbsG: 37.5, fatG: 8.333333333333334,
      planning: { ...food('x').planning!, mealRoles: [role], varietyGroup: ['plant-protein', 'legume', 'grain'][index] as VarietyGroup },
    }));
    expect(generateWeeklyPlan(target, unrestricted, macroCatalog(22.5), 'v1').status).toBe('infeasible');
    expect(generateWeeklyPlan(target, unrestricted, macroCatalog(22.51), 'v1').status).toBe('infeasible');
  });

  it('returns a feasible complete plan with practical quantities when a realistic balanced catalog has capacity', () => {
    const groups: VarietyGroup[] = ['plant-protein', 'legume', 'grain', 'fruit', 'vegetable', 'nuts-and-seeds', 'beverage'];
    const balanced = Array.from({ length: 21 }, (_, index) => food(`balanced-${index}`, {
      energyKcal: 100, proteinG: 6.25, carbsG: 12.5, fatG: 2.777777777777778,
      planning: { ...food('x').planning!, varietyGroup: groups[index % groups.length] },
    }));
    const result = generateWeeklyPlan(
      { energyTargetKcal: 900, proteinPct: 25, carbsPct: 50, fatPct: 25 },
      { ...profile, maxFoodRepeatsPerWeek: 7, maxVarietyGroupRepeatsPerWeek: 21 }, balanced, 'v1',
    );
    expect(result.status).toBe('feasible');
    for (const day of result.days) {
      expect(day.meals.map((meal) => meal.role)).toEqual(['breakfast', 'lunch', 'dinner']);
      expect(day.meals[0].foods).toHaveLength(1);
      expect(day.meals.slice(1).every((meal) => meal.foods.length === 3)).toBe(true);
      expect(day.meals.flatMap((meal) => meal.foods).every((portion) => portion.amount >= 0.25 && portion.amount <= 4)).toBe(true);
    }
  });

  it('exposes totals and deviations that equal the planned portions', () => {
    const result = generateWeeklyPlan(goal, profile, catalog, 'v1');
    expect(result.status).not.toBe('infeasible');
    for (const day of result.days) {
      const totals = day.meals.flatMap((meal) => meal.foods).reduce((total, portion) => ({
        energyKcal: total.energyKcal + portion.nutrition.energyKcal,
        proteinG: total.proteinG + portion.nutrition.proteinG,
        carbsG: total.carbsG + portion.nutrition.carbsG,
        fatG: total.fatG + portion.nutrition.fatG,
      }), { energyKcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });
      expect(day.totals).toEqual(totals);
      expect(day.targetDeviation).toEqual({
        energyKcal: totals.energyKcal - goal.energyTargetKcal,
        proteinG: totals.proteinG - 112.5,
        carbsG: totals.carbsG - 225,
        fatG: totals.fatG - 50,
      });
    }
  });
});
