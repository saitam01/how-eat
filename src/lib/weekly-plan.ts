import type {
  DailyTotals, FoodItem, FoodProfileInput, MacroGoal, MealComponentRole, MealRole, PlannedDay,
  PlannedMeal, PlanningFoodItem, PlanningIssue, PlanningNutritionTargets, WeeklyPlanResult,
} from './types';
import { isFoodAllowedForProfile, validatePlanningCandidate } from './weekly-plan-domain';

/** MVP target fit: energy is within ±10%; each macro target is within ±20%. */
export const WEEKLY_PLAN_TARGET_TOLERANCE = { energy: 0.1, macro: 0.2 } as const;
/** Every food portion is between 0.25 and 4 food units (100g/100ml or one unit). */
export const WEEKLY_PLAN_PORTION_BOUNDS = { min: 0.25, max: 4 } as const;
const ROLES: readonly MealRole[] = ['breakfast', 'lunch', 'dinner'];
const DIMENSIONS: readonly (keyof Omit<DailyTotals, 'energyKcal'>)[] = ['proteinG', 'carbsG', 'fatG'];
const NUTRITION_DIMENSIONS: readonly (keyof DailyTotals)[] = ['energyKcal', ...DIMENSIONS];
const MAX_DAY_REPAIR_SWAPS = 40;

export interface WeeklyPlanInput {
  goal: MacroGoal;
  profile: FoodProfileInput;
  candidates: readonly FoodItem[];
  datasetVersion: string;
}

interface MealSlot {
  mealRole: MealRole;
  componentRole?: MealComponentRole;
  mainMealId?: number;
}
type Assignment = readonly PlanningFoodItem[];
const mainMealComponents: readonly MealComponentRole[] = ['protein', 'carbohydrate-fiber', 'produce'];
const FOODS_PER_DAY = 1 + 2 * mainMealComponents.length;
const weeklySlots: readonly MealSlot[] = Array.from({ length: 7 }, (_, day): readonly MealSlot[] => [
  { mealRole: 'breakfast' },
  ...(['lunch', 'dinner'] as const).flatMap((mealRole, mealIndex) => mainMealComponents.map((componentRole): MealSlot => ({
    mealRole, componentRole, mainMealId: day * 2 + mealIndex,
  }))),
]).flat();

function canFillDistinctComponents(componentCandidates: readonly (readonly PlanningFoodItem[])[]): boolean {
  const assign = (index: number, usedFoodIds: ReadonlySet<string>): boolean => {
    if (index === componentCandidates.length) return true;
    return componentCandidates[index].some((food) => !usedFoodIds.has(food.id)
      && assign(index + 1, new Set([...usedFoodIds, food.id])));
  };
  return assign(0, new Set());
}
const emptyTotals = (): DailyTotals => ({ energyKcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });
const compareIds = (left: string, right: string): number => left < right ? -1 : left > right ? 1 : 0;

function makeIssue(code: PlanningIssue['code'], message: string, foodId?: string): PlanningIssue {
  return { code, message, ...(foodId ? { foodId } : {}) };
}

function infeasible(issues: readonly PlanningIssue[]): WeeklyPlanResult {
  return { status: 'infeasible', days: [], issues };
}

function targetsFor(goal: MacroGoal): PlanningNutritionTargets {
  return {
    energyKcal: goal.energyTargetKcal,
    proteinG: goal.energyTargetKcal * goal.proteinPct / 400,
    carbsG: goal.energyTargetKcal * goal.carbsPct / 400,
    fatG: goal.energyTargetKcal * goal.fatPct / 900,
  };
}

function validGoal(goal: MacroGoal): boolean {
  const values = [goal.energyTargetKcal, goal.proteinPct, goal.carbsPct, goal.fatPct];
  return values.every((value) => Number.isFinite(value) && value >= 0) && goal.energyTargetKcal > 0
    && Math.abs(goal.proteinPct + goal.carbsPct + goal.fatPct - 100) < 0.001;
}

function validProfile(profile: FoodProfileInput): boolean {
  const lists = [profile.allergens, profile.strictIntolerances, profile.excludedFoodIds, profile.preferredFoodIds];
  return lists.every((list) => Array.isArray(list) && new Set(list).size === list.length)
    && Number.isInteger(profile.maxFoodRepeatsPerWeek) && profile.maxFoodRepeatsPerWeek >= 1
    && Number.isInteger(profile.maxVarietyGroupRepeatsPerWeek) && profile.maxVarietyGroupRepeatsPerWeek >= 1;
}

function add(left: DailyTotals, right: DailyTotals): DailyTotals {
  return {
    energyKcal: left.energyKcal + right.energyKcal, proteinG: left.proteinG + right.proteinG,
    carbsG: left.carbsG + right.carbsG, fatG: left.fatG + right.fatG,
  };
}

function portionAmount(food: PlanningFoodItem, targets: PlanningNutritionTargets, mealComponents = 1): number {
  const desiredEnergy = targets.energyKcal / ROLES.length / mealComponents;
  const rawAmount = desiredEnergy / Math.max(food.energyKcal, 1);
  return Math.max(WEEKLY_PLAN_PORTION_BOUNDS.min, Math.min(WEEKLY_PLAN_PORTION_BOUNDS.max, Math.round(rawAmount * 4) / 4));
}

function nutritionFor(food: PlanningFoodItem, amount: number): DailyTotals {
  return {
    energyKcal: food.energyKcal * amount, proteinG: food.proteinG * amount,
    carbsG: food.carbsG * amount, fatG: food.fatG * amount,
  };
}

/** Lower is a closer fit for one meal's equal share of the daily target. */
function fitScore(food: PlanningFoodItem, targets: PlanningNutritionTargets, mealComponents = 1): number {
  const nutrition = nutritionFor(food, portionAmount(food, targets, mealComponents));
  const mealTarget = {
    energyKcal: targets.energyKcal / 3 / mealComponents, proteinG: targets.proteinG / 3 / mealComponents,
    carbsG: targets.carbsG / 3 / mealComponents, fatG: targets.fatG / 3 / mealComponents,
  };
  return (Math.abs(nutrition.energyKcal - mealTarget.energyKcal) / Math.max(mealTarget.energyKcal, 1))
    + DIMENSIONS.reduce((score, dimension) => score
      + Math.abs(nutrition[dimension] - mealTarget[dimension]) / Math.max(mealTarget[dimension], 1), 0);
}

function canUse(
  food: PlanningFoodItem, foodCounts: ReadonlyMap<string, number>, groupCounts: ReadonlyMap<string, number>, profile: FoodProfileInput,
): boolean {
  return (foodCounts.get(food.id) ?? 0) < profile.maxFoodRepeatsPerWeek
    && (groupCounts.get(food.planning.varietyGroup) ?? 0) < profile.maxVarietyGroupRepeatsPerWeek;
}

function orderedChoices(
  candidates: readonly PlanningFoodItem[], targets: PlanningNutritionTargets, profile: FoodProfileInput,
  foodCounts: ReadonlyMap<string, number>, groupCounts: ReadonlyMap<string, number>, recentFoodIds: ReadonlySet<string>,
  strict: boolean, mealComponents = 1,
): PlanningFoodItem[] {
  return candidates.filter((food) => !strict || canUse(food, foodCounts, groupCounts, profile)).sort((left, right) => {
    const foodDifference = (foodCounts.get(left.id) ?? 0) - (foodCounts.get(right.id) ?? 0);
    if (foodDifference !== 0) return foodDifference;
    const recentDifference = Number(recentFoodIds.has(left.id)) - Number(recentFoodIds.has(right.id));
    if (recentDifference !== 0) return recentDifference;
    const fitDifference = fitScore(left, targets, mealComponents) - fitScore(right, targets, mealComponents);
    if (fitDifference !== 0) return fitDifference;
    const groupDifference = (groupCounts.get(left.planning.varietyGroup) ?? 0) - (groupCounts.get(right.planning.varietyGroup) ?? 0);
    if (groupDifference !== 0) return groupDifference;
    const preferenceDifference = Number(profile.preferredFoodIds.includes(right.id)) - Number(profile.preferredFoodIds.includes(left.id));
    if (preferenceDifference !== 0) return preferenceDifference;
    return compareIds(left.id, right.id);
  });
}

interface FlowEdge { to: number; reverse: number; capacity: number; }

function addFlowEdge(graph: FlowEdge[][], from: number, to: number, capacity: number): void {
  graph[from].push({ to, reverse: graph[to].length, capacity });
  graph[to].push({ to: from, reverse: graph[from].length - 1, capacity: 0 });
}

/** Exact, dependency-free max-flow check for the remaining role slots and soft capacities. */
function canFillStrictly(
  slots: readonly MealSlot[], slotCandidates: readonly (readonly PlanningFoodItem[])[], profile: FoodProfileInput,
  foodCounts: ReadonlyMap<string, number>, groupCounts: ReadonlyMap<string, number>,
  selectedFoodIdsByMainMeal: ReadonlyMap<number, ReadonlySet<string>> = new Map(),
): boolean {
  if (slots.length === 0) return true;
  const availableSlotCandidates = slotCandidates.map((candidates, index) => {
    const selectedFoodIds = slots[index].mainMealId === undefined
      ? undefined
      : selectedFoodIdsByMainMeal.get(slots[index].mainMealId!);
    return selectedFoodIds ? candidates.filter((food) => !selectedFoodIds.has(food.id)) : candidates;
  });
  const foods = [...new Map(availableSlotCandidates.flat().map((food) => [food.id, food])).values()]
    .sort((left, right) => compareIds(left.id, right.id));
  const groups = [...new Set(foods.map((food) => food.planning.varietyGroup))].sort(compareIds);
  const source = 0;
  const groupOffset = 1;
  const foodOffset = groupOffset + groups.length;
  const mealFoodSlots = new Map<string, { food: PlanningFoodItem; slots: number[] }>();
  slots.forEach((slot, slotIndex) => {
    if (slot.mainMealId === undefined) return;
    for (const food of availableSlotCandidates[slotIndex]) {
      const key = JSON.stringify([food.id, slot.mainMealId]);
      const entry = mealFoodSlots.get(key) ?? { food, slots: [] };
      entry.slots.push(slotIndex);
      mealFoodSlots.set(key, entry);
    }
  });
  const mealFoodOffset = foodOffset + foods.length;
  const slotOffset = mealFoodOffset + mealFoodSlots.size;
  const sink = slotOffset + slots.length;
  const graph: FlowEdge[][] = Array.from({ length: sink + 1 }, () => []);
  const groupNodes = new Map(groups.map((group, index) => [group, groupOffset + index]));
  const foodNodes = new Map(foods.map((food, index) => [food.id, foodOffset + index]));
  const mealFoodNodes = new Map([...mealFoodSlots.keys()].sort(compareIds).map((key, index) => [key, mealFoodOffset + index]));

  for (const group of groups) addFlowEdge(graph, source, groupNodes.get(group)!, Math.max(0, profile.maxVarietyGroupRepeatsPerWeek - (groupCounts.get(group) ?? 0)));
  for (const food of foods) {
    addFlowEdge(graph, groupNodes.get(food.planning.varietyGroup)!, foodNodes.get(food.id)!, Math.max(0, profile.maxFoodRepeatsPerWeek - (foodCounts.get(food.id) ?? 0)));
    slots.forEach((slot, slotIndex) => {
      if (slot.mainMealId === undefined && availableSlotCandidates[slotIndex].some((candidate) => candidate.id === food.id)) {
        addFlowEdge(graph, foodNodes.get(food.id)!, slotOffset + slotIndex, 1);
      }
    });
  }
  for (const [key, { food, slots: mealSlots }] of mealFoodSlots) {
    const mealFoodNode = mealFoodNodes.get(key)!;
    addFlowEdge(graph, foodNodes.get(food.id)!, mealFoodNode, 1);
    for (const slot of mealSlots) addFlowEdge(graph, mealFoodNode, slotOffset + slot, 1);
  }
  slots.forEach((_, slot) => addFlowEdge(graph, slotOffset + slot, sink, 1));

  let flow = 0;
  while (true) {
    const parent: ({ node: number; edge: number } | undefined)[] = Array(sink + 1);
    const queue = [source];
    parent[source] = { node: -1, edge: -1 };
    for (let head = 0; head < queue.length && !parent[sink]; head += 1) {
      const node = queue[head];
      graph[node].forEach((edge, edgeIndex) => {
        if (edge.capacity > 0 && !parent[edge.to]) {
          parent[edge.to] = { node, edge: edgeIndex };
          queue.push(edge.to);
        }
      });
    }
    if (!parent[sink]) return flow === slots.length;
    for (let node = sink; node !== source;) {
      const step = parent[node]!;
      const edge = graph[step.node][step.edge];
      edge.capacity -= 1;
      graph[node][edge.reverse].capacity += 1;
      node = step.node;
    }
    flow += 1;
  }
}

/**
 * Chooses the best stable candidate only when an exact max-flow check proves that every
 * later role slot can still be served within both repeat limits. Therefore soft relaxation
 * happens only after the complete strict-capacity assignment is impossible.
 */
function assignWithinLimits(
  slotCandidates: readonly (readonly PlanningFoodItem[])[], targets: PlanningNutritionTargets, profile: FoodProfileInput,
): Assignment | undefined {
  const foodCounts = new Map<string, number>();
  const groupCounts = new Map<string, number>();
  const selectedFoodIdsByMainMeal = new Map<number, Set<string>>();
  let recentFoodIds = new Set<string>();
  let todayFoodIds = new Set<string>();
  if (!canFillStrictly(weeklySlots, slotCandidates, profile, foodCounts, groupCounts, selectedFoodIdsByMainMeal)) return undefined;
  const assignment: PlanningFoodItem[] = [];
  for (let index = 0; index < weeklySlots.length; index += 1) {
    if (index > 0 && index % FOODS_PER_DAY === 0) {
      recentFoodIds = todayFoodIds;
      todayFoodIds = new Set<string>();
    }
    const slot = weeklySlots[index];
    const selectedFoodIds = slot.mainMealId === undefined
      ? undefined
      : selectedFoodIdsByMainMeal.get(slot.mainMealId) ?? new Set<string>();
    if (slot.mainMealId !== undefined) selectedFoodIdsByMainMeal.set(slot.mainMealId, selectedFoodIds!);
    const components = slot.componentRole ? mainMealComponents.length : 1;
    const choices = orderedChoices(slotCandidates[index], targets, profile, foodCounts, groupCounts, recentFoodIds, true, components)
      .filter((candidate) => !selectedFoodIds?.has(candidate.id));
    const canSelect = (candidate: PlanningFoodItem): boolean => {
      const group = candidate.planning.varietyGroup;
      foodCounts.set(candidate.id, (foodCounts.get(candidate.id) ?? 0) + 1);
      groupCounts.set(group, (groupCounts.get(group) ?? 0) + 1);
      selectedFoodIds?.add(candidate.id);
      const fillsRemainder = canFillStrictly(
        weeklySlots.slice(index + 1), slotCandidates.slice(index + 1), profile, foodCounts, groupCounts, selectedFoodIdsByMainMeal,
      );
      selectedFoodIds?.delete(candidate.id);
      foodCounts.set(candidate.id, (foodCounts.get(candidate.id) ?? 1) - 1);
      groupCounts.set(group, (groupCounts.get(group) ?? 1) - 1);
      return fillsRemainder;
    };
    const food = choices.find(canSelect);
    if (!food) return undefined;
    assignment.push(food);
    selectedFoodIds?.add(food.id);
    todayFoodIds.add(food.id);
    foodCounts.set(food.id, (foodCounts.get(food.id) ?? 0) + 1);
    groupCounts.set(food.planning.varietyGroup, (groupCounts.get(food.planning.varietyGroup) ?? 0) + 1);
  }
  return assignment;
}

function assignWithRelaxedLimits(
  slotCandidates: readonly (readonly PlanningFoodItem[])[], targets: PlanningNutritionTargets, profile: FoodProfileInput,
): Assignment {
  const foodCounts = new Map<string, number>();
  const groupCounts = new Map<string, number>();
  const selectedFoodIdsByMainMeal = new Map<number, Set<string>>();
  let recentFoodIds = new Set<string>();
  let todayFoodIds = new Set<string>();
  return weeklySlots.map((slot, index) => {
    if (index > 0 && index % FOODS_PER_DAY === 0) {
      recentFoodIds = todayFoodIds;
      todayFoodIds = new Set<string>();
    }
    const selectedFoodIds = slot.mainMealId === undefined
      ? undefined
      : selectedFoodIdsByMainMeal.get(slot.mainMealId) ?? new Set<string>();
    if (slot.mainMealId !== undefined) selectedFoodIdsByMainMeal.set(slot.mainMealId, selectedFoodIds!);
    const remainingComponentCandidates = weeklySlots.slice(index + 1)
      .map((nextSlot, offset) => ({ nextSlot, candidates: slotCandidates[index + offset + 1] }))
      .filter(({ nextSlot }) => nextSlot.mainMealId === slot.mainMealId);
    const components = slot.componentRole ? mainMealComponents.length : 1;
    const choices = orderedChoices(slotCandidates[index], targets, profile, foodCounts, groupCounts, recentFoodIds, false, components);
    const canSelect = (candidate: PlanningFoodItem): boolean => !selectedFoodIds?.has(candidate.id) && (slot.mainMealId === undefined || canFillDistinctComponents([
      [candidate],
      ...remainingComponentCandidates.map(({ candidates }) => candidates.filter((nextCandidate) => !selectedFoodIds?.has(nextCandidate.id) && nextCandidate.id !== candidate.id)),
    ]));
    const food = choices.find(canSelect);
    if (!food) throw new Error(`Validated main-meal component coverage could not be assigned distinctly for ${slot.mealRole}:${slot.componentRole ?? 'none'}.`);
    selectedFoodIds?.add(food.id);
    todayFoodIds.add(food.id);
    foodCounts.set(food.id, (foodCounts.get(food.id) ?? 0) + 1);
    groupCounts.set(food.planning.varietyGroup, (groupCounts.get(food.planning.varietyGroup) ?? 0) + 1);
    return food;
  });
}

function isOutsideTolerance(actual: number, target: number, tolerance: number): boolean {
  return target === 0 ? actual !== 0 : Math.abs(actual - target) / target > tolerance;
}

function isDayWithinTolerance(totals: DailyTotals, targets: PlanningNutritionTargets): boolean {
  return NUTRITION_DIMENSIONS.every((dimension) => isOutsideTolerance(
    totals[dimension], targets[dimension], dimension === 'energyKcal' ? WEEKLY_PLAN_TARGET_TOLERANCE.energy : WEEKLY_PLAN_TARGET_TOLERANCE.macro,
  ) === false);
}

function worstRelativeDeviation(totals: DailyTotals, targets: PlanningNutritionTargets): number {
  return Math.max(...NUTRITION_DIMENSIONS.map((dimension) => {
    const target = targets[dimension];
    return target === 0 ? (totals[dimension] === 0 ? 0 : Math.abs(totals[dimension]))
      : Math.abs(totals[dimension] - target) / target;
  }));
}

function totalsForDay(assignment: readonly PlanningFoodItem[], day: number, targets: PlanningNutritionTargets): DailyTotals {
  return assignment.slice(day * FOODS_PER_DAY, (day + 1) * FOODS_PER_DAY).reduce((totals, food, offset) => add(
    totals, nutritionFor(food, portionAmount(food, targets, weeklySlots[day * FOODS_PER_DAY + offset].componentRole ? mainMealComponents.length : 1)),
  ), emptyTotals());
}

function swapTotals(totals: DailyTotals, current: PlanningFoodItem, alternate: PlanningFoodItem, slot: MealSlot, targets: PlanningNutritionTargets): DailyTotals {
  const components = slot.componentRole ? mainMealComponents.length : 1;
  const currentNutrition = nutritionFor(current, portionAmount(current, targets, components));
  const alternateNutrition = nutritionFor(alternate, portionAmount(alternate, targets, components));
  return {
    energyKcal: totals.energyKcal - currentNutrition.energyKcal + alternateNutrition.energyKcal,
    proteinG: totals.proteinG - currentNutrition.proteinG + alternateNutrition.proteinG,
    carbsG: totals.carbsG - currentNutrition.carbsG + alternateNutrition.carbsG,
    fatG: totals.fatG - currentNutrition.fatG + alternateNutrition.fatG,
  };
}

/** Repairs each completed day without violating strict weekly repeat capacities. */
function repairDailyTargets(
  initialAssignment: Assignment, slotCandidates: readonly (readonly PlanningFoodItem[])[],
  targets: PlanningNutritionTargets, profile: FoodProfileInput,
): Assignment {
  const assignment = [...initialAssignment];
  const foodCounts = new Map<string, number>();
  const groupCounts = new Map<string, number>();
  for (const food of assignment) {
    foodCounts.set(food.id, (foodCounts.get(food.id) ?? 0) + 1);
    const group = food.planning.varietyGroup;
    groupCounts.set(group, (groupCounts.get(group) ?? 0) + 1);
  }

  for (let day = 0; day < 7; day += 1) {
    let totals = totalsForDay(assignment, day, targets);
    for (let step = 0; step < MAX_DAY_REPAIR_SWAPS && !isDayWithinTolerance(totals, targets); step += 1) {
      const currentScore = worstRelativeDeviation(totals, targets);
      let best: { index: number; food: PlanningFoodItem; totals: DailyTotals; score: number } | undefined;
      const dayStart = day * FOODS_PER_DAY;
      for (let offset = 0; offset < FOODS_PER_DAY; offset += 1) {
        const index = dayStart + offset;
        const current = assignment[index];
        const group = current.planning.varietyGroup;
        foodCounts.set(current.id, (foodCounts.get(current.id) ?? 1) - 1);
        groupCounts.set(group, (groupCounts.get(group) ?? 1) - 1);
        const slot = weeklySlots[index];
        const mealFoodIds = new Set(assignment.slice(dayStart, dayStart + FOODS_PER_DAY)
          .filter((_, mealOffset) => mealOffset !== offset && weeklySlots[dayStart + mealOffset].mainMealId === slot.mainMealId)
          .map((food) => food.id));
        const components = slot.componentRole ? mainMealComponents.length : 1;
        const choices = orderedChoices(slotCandidates[index], targets, profile, foodCounts, groupCounts, new Set(), true, components);
        for (const alternate of choices) {
          if (alternate.id === current.id || mealFoodIds.has(alternate.id)) continue;
          const alternateTotals = swapTotals(totals, current, alternate, slot, targets);
          const score = worstRelativeDeviation(alternateTotals, targets);
          if (score < currentScore && (!best || score < best.score)) best = { index, food: alternate, totals: alternateTotals, score };
        }
        foodCounts.set(current.id, (foodCounts.get(current.id) ?? 0) + 1);
        groupCounts.set(group, (groupCounts.get(group) ?? 0) + 1);
      }
      if (!best) break;
      const current = assignment[best.index];
      const currentGroup = current.planning.varietyGroup;
      foodCounts.set(current.id, (foodCounts.get(current.id) ?? 1) - 1);
      groupCounts.set(currentGroup, (groupCounts.get(currentGroup) ?? 1) - 1);
      assignment[best.index] = best.food;
      foodCounts.set(best.food.id, (foodCounts.get(best.food.id) ?? 0) + 1);
      const group = best.food.planning.varietyGroup;
      groupCounts.set(group, (groupCounts.get(group) ?? 0) + 1);
      totals = best.totals;
    }
  }
  return assignment;
}

function dayFrom(foods: readonly PlanningFoodItem[], targets: PlanningNutritionTargets): PlannedDay {
  let index = 0;
  const meals: PlannedMeal[] = ROLES.map((role) => {
    const componentCount = role === 'breakfast' ? 1 : mainMealComponents.length;
    const mealFoods = foods.slice(index, index + componentCount);
    index += componentCount;
    const portions = mealFoods.map((food) => {
      const amount = portionAmount(food, targets, componentCount);
      return { foodId: food.id, amount, nutrition: nutritionFor(food, amount) };
    });
    return { role, foods: portions, totals: portions.reduce((total, portion) => add(total, portion.nutrition), emptyTotals()) };
  });
  const totals = meals.reduce((total, meal) => add(total, meal.totals), emptyTotals());
  return {
    meals, totals,
    targetDeviation: {
      energyKcal: totals.energyKcal - targets.energyKcal, proteinG: totals.proteinG - targets.proteinG,
      carbsG: totals.carbsG - targets.carbsG, fatG: totals.fatG - targets.fatG,
    },
  };
}

export function generateWeeklyPlan(input: WeeklyPlanInput): WeeklyPlanResult;
export function generateWeeklyPlan(goal: MacroGoal, profile: FoodProfileInput, candidates: readonly FoodItem[], datasetVersion: string): WeeklyPlanResult;
export function generateWeeklyPlan(inputOrGoal: WeeklyPlanInput | MacroGoal, suppliedProfile?: FoodProfileInput, suppliedCandidates?: readonly FoodItem[], suppliedDatasetVersion?: string): WeeklyPlanResult {
  const input: WeeklyPlanInput = suppliedProfile
    ? { goal: inputOrGoal as MacroGoal, profile: suppliedProfile, candidates: suppliedCandidates ?? [], datasetVersion: suppliedDatasetVersion ?? '' }
    : inputOrGoal as WeeklyPlanInput;
  if (!validGoal(input.goal)) return infeasible([makeIssue('invalid-goal', 'Energy must be positive and macro percentages must total 100.')]);
  if (!validProfile(input.profile)) return infeasible([makeIssue('invalid-profile', 'Profile must be sanitized with positive integer repeat limits.')]);
  if (typeof input.datasetVersion !== 'string' || input.datasetVersion.length === 0) return infeasible([makeIssue('invalid-planning-metadata', 'Dataset version is required for deterministic planning.')]);

  const sortedFoods = [...input.candidates].sort((left, right) => compareIds(left.id, right.id));
  const ids = new Set<string>();
  for (const food of sortedFoods) {
    if (ids.has(food.id)) return infeasible([makeIssue('duplicate-food-id', 'Candidate food IDs must be unique.', food.id)]);
    ids.add(food.id);
    const validation = validatePlanningCandidate(food);
    if (!validation.valid) return infeasible([validation.issue]);
  }
  const safeFoods = sortedFoods.filter((food) => isFoodAllowedForProfile(food, input.profile)) as PlanningFoodItem[];
  if (safeFoods.length === 0) return infeasible([makeIssue('no-safe-candidates', 'No candidates remain after hard safety constraints.')]);
  const roleCandidates = new Map(ROLES.map((role) => [role, safeFoods.filter((food) => food.planning.mealRoles.includes(role))]));
  for (const role of ROLES) if ((roleCandidates.get(role) ?? []).length === 0) return infeasible([makeIssue('missing-meal-role', `No safe candidate can serve ${role}.`)]);
  for (const component of mainMealComponents) {
    if (!safeFoods.some((food) => (['lunch', 'dinner'] as const).some((role) => food.planning.mealRoles.includes(role)) && food.planning.componentRoles.includes(component))) {
      return infeasible([makeIssue('missing-meal-component', `No safe candidate can provide ${component} for a main meal.`)]);
    }
  }
  const slotCandidates = weeklySlots.map((slot) => safeFoods.filter((food) => food.planning.mealRoles.includes(slot.mealRole)
    && (!slot.componentRole || food.planning.componentRoles.includes(slot.componentRole))));
  for (let index = 0; index < slotCandidates.length; index += 1) {
    if (slotCandidates[index].length === 0) {
      const slot = weeklySlots[index];
      return infeasible([makeIssue('missing-meal-component', `No safe candidate can provide ${slot.componentRole} for ${slot.mealRole}.`)]);
    }
  }
  for (const mealRole of ['lunch', 'dinner'] as const) {
    const componentCandidates = mainMealComponents.map((component) => slotCandidates.find((_, index) => weeklySlots[index].mealRole === mealRole && weeklySlots[index].componentRole === component)!);
    if (!canFillDistinctComponents(componentCandidates)) {
      return infeasible([makeIssue('missing-meal-component', `No distinct safe candidates can provide all required components for ${mealRole}.`)]);
    }
  }

  const targets = targetsFor(input.goal);
  const greedyAssignment = assignWithinLimits(slotCandidates, targets, input.profile) ?? assignWithRelaxedLimits(slotCandidates, targets, input.profile);
  const assignment = repairDailyTargets(greedyAssignment, slotCandidates, targets, input.profile);
  const days = Array.from({ length: 7 }, (_, day) => dayFrom(assignment.slice(day * FOODS_PER_DAY, day * FOODS_PER_DAY + FOODS_PER_DAY), targets));
  const foodCounts = new Map<string, number>();
  const groupCounts = new Map<string, number>();
  for (const food of assignment) {
    foodCounts.set(food.id, (foodCounts.get(food.id) ?? 0) + 1);
    const group = food.planning.varietyGroup;
    groupCounts.set(group, (groupCounts.get(group) ?? 0) + 1);
  }
  const issues: PlanningIssue[] = [];
  for (const [foodId, count] of [...foodCounts].sort(([left], [right]) => compareIds(left, right))) if (count > input.profile.maxFoodRepeatsPerWeek) issues.push(makeIssue('food-repeat-limit-exceeded', `${foodId} is used ${count} times; limit is ${input.profile.maxFoodRepeatsPerWeek}.`, foodId));
  for (const [group, count] of [...groupCounts].sort(([left], [right]) => compareIds(left, right))) if (count > input.profile.maxVarietyGroupRepeatsPerWeek) issues.push(makeIssue('variety-group-repeat-limit-exceeded', `${group} is used ${count} times; limit is ${input.profile.maxVarietyGroupRepeatsPerWeek}.`));
  if (days.some((day) => isOutsideTolerance(day.totals.energyKcal, targets.energyKcal, WEEKLY_PLAN_TARGET_TOLERANCE.energy) || DIMENSIONS.some((dimension) => isOutsideTolerance(day.totals[dimension], targets[dimension], WEEKLY_PLAN_TARGET_TOLERANCE.macro)))) issues.push(makeIssue('target-outside-tolerance', 'A daily target is outside the documented MVP tolerance.'));
  return { status: issues.length === 0 ? 'feasible' : 'degraded', days, issues };
}

export const planWeeklyMeals = generateWeeklyPlan;
