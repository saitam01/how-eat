import { useMemo } from 'react';
import { foodDB } from '@/lib/food-db';
import { sanitizeFoodProfile } from '@/lib/food-profile';
import { generateWeeklyPlan } from '@/lib/weekly-plan';
import type { DailyTotals, FoodProfileInput, MacroGoal, PlannedMeal } from '@/lib/types';
import { FoodPreferences } from '@/components/FoodPreferences';
import i18n from '@/i18n/es.json';

const FOOD_DATASET_VERSION = 'food-db-v1';
const nutritionFields: readonly [keyof DailyTotals, string, string][] = [
  ['energyKcal', i18n.mealLogEnergy, 'kcal'],
  ['proteinG', i18n.mealLogProtein, 'g'],
  ['carbsG', i18n.mealLogCarbs, 'g'],
  ['fatG', i18n.mealLogFat, 'g'],
];

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(value);
}

function formatSigned(value: number): string {
  return `${value > 0 ? '+' : ''}${formatNumber(value)}`;
}

function formatPortion(amount: number, unit: string): string {
  if (unit === '100g') return `${formatNumber(amount * 100)} g`;
  if (unit === '100ml') return `${formatNumber(amount * 100)} ml`;
  return `${formatNumber(amount)} ${unit}`;
}

function Nutrition({ totals, signed = false }: { totals: DailyTotals; signed?: boolean }) {
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:grid-cols-4">
      {nutritionFields.map(([field, label, unit]) => (
        <div key={field}>
          <dt className="text-muted-foreground">{label}</dt>
          <dd>{signed ? formatSigned(totals[field]) : formatNumber(totals[field])} {unit}</dd>
        </div>
      ))}
    </dl>
  );
}

function Meal({ meal }: { meal: PlannedMeal }) {
  return (
    <section className="space-y-2 border-t border-border pt-3" aria-label={i18n[`meal${meal.role.charAt(0).toUpperCase()}${meal.role.slice(1)}` as keyof typeof i18n] as string}>
      <h4 className="text-sm font-semibold">
        {i18n[`meal${meal.role.charAt(0).toUpperCase()}${meal.role.slice(1)}` as keyof typeof i18n] as string}
      </h4>
      <ul className="space-y-1 text-sm">
        {meal.foods.map((portion) => {
          const food = foodDB.items.find((item) => item.id === portion.foodId);
          return <li key={portion.foodId}>{food?.name ?? portion.foodId}: {formatPortion(portion.amount, food?.unit ?? i18n.planUnit)}</li>;
        })}
      </ul>
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">{i18n.planMealNutrition}</p>
        <Nutrition totals={meal.totals} />
      </div>
    </section>
  );
}

export function WeeklyPlan({
  goal,
  profile,
  onProfileChange,
}: {
  goal: MacroGoal;
  profile: FoodProfileInput;
  onProfileChange: (changes: Partial<FoodProfileInput>) => void;
}) {
  const safeProfile = useMemo(() => sanitizeFoodProfile(profile), [profile]);
  const result = useMemo(
    () => generateWeeklyPlan({ goal, profile: safeProfile, candidates: foodDB.items, datasetVersion: FOOD_DATASET_VERSION }),
    [goal, safeProfile],
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{i18n.tabPlan}</h2>
      <FoodPreferences profile={safeProfile} onChange={onProfileChange} />

      {goal.energyTargetKcal === 0 ? (
        <div className="rounded-lg border border-border bg-background p-4" role="status">
          <h3 className="font-semibold">{i18n.planGoalRequiredTitle}</h3>
          <p className="text-sm text-muted-foreground">{i18n.diaryCTA}</p>
        </div>
      ) : result.status === 'infeasible' ? (
        <section className="rounded-lg border border-destructive/50 bg-background p-4" aria-labelledby="plan-infeasible-title" role="alert">
          <h3 id="plan-infeasible-title" className="font-semibold">{i18n.planInfeasibleTitle}</h3>
          <p className="text-sm text-muted-foreground">{i18n.planInfeasibleDescription}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {result.issues.map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.message}</li>)}
          </ul>
        </section>
      ) : (
        <>
          <section className="rounded-lg border border-border bg-background p-4" aria-labelledby="plan-diagnostics-title" role="status">
            <h3 id="plan-diagnostics-title" className="font-semibold">
              {result.status === 'feasible' ? i18n.planFeasibleTitle : i18n.planDegradedTitle}
            </h3>
            {result.status === 'feasible' ? (
              <p className="text-sm text-muted-foreground">{i18n.planFeasibleDescription}</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{i18n.planDegradedDescription}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {result.issues.map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.message}</li>)}
                </ul>
              </>
            )}
          </section>

          <section className="space-y-4" aria-labelledby="plan-days-title">
            <h3 id="plan-days-title" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{i18n.planDaysTitle}</h3>
            {result.days.map((day, index) => (
              <article key={i18n.planDays[index]} className="space-y-3 rounded-lg border border-border bg-background p-4" aria-labelledby={`plan-day-${index}`}>
                <h3 id={`plan-day-${index}`} className="font-semibold">{i18n.planDays[index]}</h3>
                {day.meals.map((meal) => <Meal key={meal.role} meal={meal} />)}
                <section className="space-y-1 border-t border-border pt-3" aria-label={i18n.planDailyTotals}>
                  <h4 className="text-sm font-semibold">{i18n.planDailyTotals}</h4>
                  <Nutrition totals={day.totals} />
                </section>
                <section className="space-y-1" aria-label={i18n.planTargetDeviation}>
                  <h4 className="text-sm font-semibold">{i18n.planTargetDeviation}</h4>
                  <p className="text-xs text-muted-foreground">{i18n.planTargetDeviationHint}</p>
                  <Nutrition totals={day.targetDeviation} signed />
                </section>
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
