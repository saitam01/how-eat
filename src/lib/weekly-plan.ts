import type {
  DailyTotals, FoodItem, FoodProfileInput, MacroGoal, MealRole, PlannedDay, PlannedFoodPortion,
  PlannedMeal, PlanningFoodItem, PlanningIssue, PlanningNutritionTargets, WeeklyPlanResult,
} from './types';
import { isFoodAllowedForProfile, validatePlanningCandidate } from './weekly-plan-domain';

/** MVP target fit: energy is within ±10%; each macro target is within ±20%. */
export const WEEKLY_PLAN_TARGET_TOLERANCE = { energy: 0.1, macro: 0.2 } as const;
/** Every food portion is between 0.25 and 4 food units (100g/100ml or one unit). */
export const WEEKLY_PLAN_PORTION_BOUNDS = { min: 0.25, max: 4 } as const;
const ROLES: readonly MealRole[] = ['breakfast', 'lunch', 'dinner'];
const DIMENSIONS: readonly (keyof Omit<DailyTotals, 'energyKcal'>)[] = ['proteinG', 'carbsG', 'fatG'];

export interface WeeklyPlanInput {
  goal: MacroGoal;
  profile: FoodProfileInput;
  candidates: readonly FoodItem[];
  datasetVersion: string;
}

type Assignment = readonly PlanningFoodItem[];
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

function portionAmount(food: PlanningFoodItem, targets: PlanningNutritionTargets): number {
  const desiredEnergy = targets.energyKcal / ROLES.length;
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
function fitScore(food: PlanningFoodItem, targets: PlanningNutritionTargets): number {
  const nutrition = nutritionFor(food, portionAmount(food, targets));
  const mealTarget = {
    energyKcal: targets.energyKcal / 3, proteinG: targets.proteinG / 3,
    carbsG: targets.carbsG / 3, fatG: targets.fatG / 3,
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
  foodCounts: ReadonlyMap<string, number>, groupCounts: ReadonlyMap<string, number>, strict: boolean,
): PlanningFoodItem[] {
  return candidates.filter((food) => !strict || canUse(food, foodCounts, groupCounts, profile)).sort((left, right) => {
    const fitDifference = fitScore(left, targets) - fitScore(right, targets);
    if (fitDifference !== 0) return fitDifference;
    const foodDifference = (foodCounts.get(left.id) ?? 0) - (foodCounts.get(right.id) ?? 0);
    if (foodDifference !== 0) return foodDifference;
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
  slots: readonly MealRole[], roleCandidates: ReadonlyMap<MealRole, readonly PlanningFoodItem[]>, profile: FoodProfileInput,
  foodCounts: ReadonlyMap<string, number>, groupCounts: ReadonlyMap<string, number>,
): boolean {
  if (slots.length === 0) return true;
  const foods = [...new Map([...roleCandidates.values()].flat().map((food) => [food.id, food])).values()]
    .sort((left, right) => compareIds(left.id, right.id));
  const groups = [...new Set(foods.map((food) => food.planning.varietyGroup))].sort(compareIds);
  const source = 0;
  const groupOffset = 1;
  const foodOffset = groupOffset + groups.length;
  const slotOffset = foodOffset + foods.length;
  const sink = slotOffset + slots.length;
  const graph: FlowEdge[][] = Array.from({ length: sink + 1 }, () => []);
  const groupNodes = new Map(groups.map((group, index) => [group, groupOffset + index]));
  const foodNodes = new Map(foods.map((food, index) => [food.id, foodOffset + index]));

  for (const group of groups) addFlowEdge(graph, source, groupNodes.get(group)!, Math.max(0, profile.maxVarietyGroupRepeatsPerWeek - (groupCounts.get(group) ?? 0)));
  for (const food of foods) {
    addFlowEdge(graph, groupNodes.get(food.planning.varietyGroup)!, foodNodes.get(food.id)!, Math.max(0, profile.maxFoodRepeatsPerWeek - (foodCounts.get(food.id) ?? 0)));
    slots.forEach((role, slot) => {
      if (food.planning.mealRoles.includes(role)) addFlowEdge(graph, foodNodes.get(food.id)!, slotOffset + slot, 1);
    });
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
  roleCandidates: ReadonlyMap<MealRole, readonly PlanningFoodItem[]>, targets: PlanningNutritionTargets, profile: FoodProfileInput,
): Assignment | undefined {
  const slots = Array.from({ length: 7 }, () => ROLES).flat();
  const foodCounts = new Map<string, number>();
  const groupCounts = new Map<string, number>();
  if (!canFillStrictly(slots, roleCandidates, profile, foodCounts, groupCounts)) return undefined;
  const assignment: PlanningFoodItem[] = [];
  for (let slot = 0; slot < slots.length; slot += 1) {
    const choices = orderedChoices(roleCandidates.get(slots[slot]) ?? [], targets, profile, foodCounts, groupCounts, true);
    const food = choices.find((candidate) => {
      foodCounts.set(candidate.id, (foodCounts.get(candidate.id) ?? 0) + 1);
      const group = candidate.planning.varietyGroup;
      groupCounts.set(group, (groupCounts.get(group) ?? 0) + 1);
      const fillsRemainder = canFillStrictly(slots.slice(slot + 1), roleCandidates, profile, foodCounts, groupCounts);
      foodCounts.set(candidate.id, (foodCounts.get(candidate.id) ?? 1) - 1);
      groupCounts.set(group, (groupCounts.get(group) ?? 1) - 1);
      return fillsRemainder;
    });
    if (!food) return undefined;
    assignment.push(food);
    foodCounts.set(food.id, (foodCounts.get(food.id) ?? 0) + 1);
    const group = food.planning.varietyGroup;
    groupCounts.set(group, (groupCounts.get(group) ?? 0) + 1);
  }
  return assignment;
}

function assignWithRelaxedLimits(
  roleCandidates: ReadonlyMap<MealRole, readonly PlanningFoodItem[]>, targets: PlanningNutritionTargets, profile: FoodProfileInput,
): Assignment {
  const foodCounts = new Map<string, number>();
  const groupCounts = new Map<string, number>();
  return Array.from({ length: 7 }, () => ROLES).flat().map((role) => {
    const food = orderedChoices(roleCandidates.get(role) ?? [], targets, profile, foodCounts, groupCounts, false)[0];
    foodCounts.set(food.id, (foodCounts.get(food.id) ?? 0) + 1);
    const group = food.planning.varietyGroup;
    groupCounts.set(group, (groupCounts.get(group) ?? 0) + 1);
    return food;
  });
}

function isOutsideTolerance(actual: number, target: number, tolerance: number): boolean {
  return target === 0 ? actual !== 0 : Math.abs(actual - target) / target > tolerance;
}

function dayFrom(foods: readonly PlanningFoodItem[], targets: PlanningNutritionTargets): PlannedDay {
  const meals: PlannedMeal[] = foods.map((food, index) => {
    const amount = portionAmount(food, targets);
    const portion: PlannedFoodPortion = { foodId: food.id, amount, nutrition: nutritionFor(food, amount) };
    return { role: ROLES[index], foods: [portion], totals: portion.nutrition };
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

  const targets = targetsFor(input.goal);
  const assignment = assignWithinLimits(roleCandidates, targets, input.profile) ?? assignWithRelaxedLimits(roleCandidates, targets, input.profile);
  const days = Array.from({ length: 7 }, (_, day) => dayFrom(assignment.slice(day * 3, day * 3 + 3), targets));
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
