import type { MacroGoal, MealEntry } from '@/lib/types';
import { foodDB } from '@/lib/food-db';
import { entriesForDate, todayLocal } from '@/lib/date';
import i18n from '@/i18n/es.json';

export function WeeklyPlan({
  goal,
  mealLogEntries,
}: {
  goal: MacroGoal;
  mealLogEntries: MealEntry[];
}) {
  const todayEntries = entriesForDate(mealLogEntries, todayLocal());

  // Calculate current totals from today's meal log.
  const currentTotals = todayEntries.reduce(
    (acc, entry) => ({
      energyKcal: acc.energyKcal + entry.energyKcal,
      proteinG: acc.proteinG + entry.proteinG,
      carbsG: acc.carbsG + entry.carbsG,
      fatG: acc.fatG + entry.fatG,
    }),
    { energyKcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

  // If no goal set, show placeholder
  if (goal.energyTargetKcal === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold">{i18n.tabPlan}</h2>
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-sm text-muted-foreground">{i18n.diaryCTA}</p>
        </div>
      </div>
    );
  }

  // Calculate remaining needed
  const remaining = {
    energyKcal: Math.max(0, goal.energyTargetKcal - currentTotals.energyKcal),
    proteinG: Math.max(
      0,
      (goal.energyTargetKcal * goal.proteinPct) / 100 / 4 - currentTotals.proteinG,
    ),
    carbsG: Math.max(0, (goal.energyTargetKcal * goal.carbsPct) / 100 / 4 - currentTotals.carbsG),
    fatG: Math.max(0, (goal.energyTargetKcal * goal.fatPct) / 100 / 9 - currentTotals.fatG),
  };

  // Days of the week
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // Format number with one decimal, rounded up
  const formatUp = (value: number): string => {
    return Math.ceil(value * 10) / 10 + '';
  };

  // Calculate daily remaining (split week into 7 days)
  const dailyRemaining = {
    energyKcal: remaining.energyKcal / 7,
    proteinG: remaining.proteinG / 7,
    carbsG: remaining.carbsG / 7,
    fatG: remaining.fatG / 7,
  };

  // Meal ratios: breakfast 25%, lunch 35%, dinner 40%
  const mealRatios = {
    breakfast: 0.25,
    lunch: 0.35,
    dinner: 0.4,
  };

  // Calculate suggested food amounts for each meal type
  const getFoodAmounts = (macro: 'proteinG' | 'carbsG' | 'fatG', ratio: number): number => {
    const macroValue = dailyRemaining[macro];
    if (macroValue <= 0) return 0;

    // grams of food needed per macro unit
    const macrosPer100g = {
      proteinG: 31, // chicken breast: 31g protein per 100g
      carbsG: 23, // rice: 23g carbs per 100g
      fatG: 100, // olive oil: 100g fat per 100ml
    }[macro];

    return ((macroValue * ratio) / macrosPer100g) * 100;
  };

  // Pre-calculate meal data for efficiency
  const mealData = {
    breakfast: {
      ratio: mealRatios.breakfast,
      proteinGrams: getFoodAmounts('proteinG', mealRatios.breakfast),
      carbsGrams: getFoodAmounts('carbsG', mealRatios.breakfast),
      fatML: getFoodAmounts('fatG', mealRatios.breakfast),
    },
    lunch: {
      ratio: mealRatios.lunch,
      proteinGrams: getFoodAmounts('proteinG', mealRatios.lunch),
      carbsGrams: getFoodAmounts('carbsG', mealRatios.lunch),
      fatML: getFoodAmounts('fatG', mealRatios.lunch),
    },
    dinner: {
      ratio: mealRatios.dinner,
      proteinGrams: getFoodAmounts('proteinG', mealRatios.dinner),
      carbsGrams: getFoodAmounts('carbsG', mealRatios.dinner),
      fatML: getFoodAmounts('fatG', mealRatios.dinner),
    },
  };

  // Format suggestion string for a meal
  const formatMealSuggestion = (data: typeof mealData.breakfast): string => {
    const parts: string[] = [];
    if (data.proteinGrams > 0) parts.push(`${Math.round(data.proteinGrams)}g de pechuga de pollo`);
    if (data.carbsGrams > 0) parts.push(`${Math.round(data.carbsGrams)}g de arroz integral`);
    if (data.fatML > 0) parts.push(`${Math.round(data.fatML)}ml de aceite de oliva`);
    return parts.length > 0 ? parts.join(', ') : 'Ninguno';
  };

  // Pre-format the suggestions to avoid complex JSX
  const breakfastSuggestion = formatMealSuggestion(mealData.breakfast);
  const lunchSuggestion = formatMealSuggestion(mealData.lunch);
  const dinnerSuggestion = formatMealSuggestion(mealData.dinner);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{i18n.tabPlan}</h2>

      {/* Base meals info */}
      <div className="rounded-lg border border-border bg-background p-4">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Base de comidas (hoy)
        </h3>
        {todayEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground">{i18n.diaryCTA}</p>
        ) : (
          <div className="space-y-2">
            {todayEntries
              .map((entry) => {
                const food = foodDB.items.find((f) => f.id === entry.foodId);
                if (!food) return null;
                return (
                  <div key={entry.id} className="flex items-center justify-between text-xs">
                    <div>
                      <p className="truncate font-medium">{food.name}</p>
                      <p className="text-muted-foreground">
                        {entry.amount} — {formatUp(entry.energyKcal)} kcal,{' '}
                        {formatUp(entry.proteinG)}g prot, {formatUp(entry.carbsG)}g carb,{' '}
                        {formatUp(entry.fatG)}g grasa
                      </p>
                    </div>
                  </div>
                );
              })
              .filter(Boolean)}
          </div>
        )}
      </div>

      {/* Reusable daily meal template */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Plantilla diaria (repetí cada día)
        </h3>
        {days.map((day, dayIndex) => (
          <div key={dayIndex} className="rounded-lg border border-border bg-background p-4">
            <h3 className="mb-2 text-sm font-semibold">{day}</h3>

            {/* Breakfast */}
            <div className="mb-4 pt-2 border-t border-border">
              <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Desayuno
              </h4>
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-1 text-xs">
                  <div>
                    <span className="text-muted-foreground">Energía</span>
                    {formatUp(dailyRemaining.energyKcal * mealRatios.breakfast)} kcal
                  </div>
                  <div>
                    <span className="text-muted-foreground">Proteína</span>
                    {formatUp(dailyRemaining.proteinG * mealRatios.breakfast)}g
                  </div>
                  <div>
                    <span className="text-muted-foreground">Carbos</span>
                    {formatUp(dailyRemaining.carbsG * mealRatios.breakfast)}g
                  </div>
                  <div>
                    <span className="text-muted-foreground">Grasa</span>
                    {formatUp(dailyRemaining.fatG * mealRatios.breakfast)}g
                  </div>
                </div>
                <div className="mt-1">
                  <p className="text-xs text-muted-foreground">Sugerido: {breakfastSuggestion}</p>
                  <p className="text-xs text-muted-foreground">
                    Bebidas: Té sin azúcar o Café negro (sin límite)
                  </p>
                </div>
              </div>
            </div>

            {/* Lunch */}
            <div className="mb-4 pt-2 border-t border-border">
              <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Almuerzo
              </h4>
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-1 text-xs">
                  <div>
                    <span className="text-muted-foreground">Energía</span>
                    {formatUp(dailyRemaining.energyKcal * mealRatios.lunch)} kcal
                  </div>
                  <div>
                    <span className="text-muted-foreground">Proteína</span>
                    {formatUp(dailyRemaining.proteinG * mealRatios.lunch)}g
                  </div>
                  <div>
                    <span className="text-muted-foreground">Carbos</span>
                    {formatUp(dailyRemaining.carbsG * mealRatios.lunch)}g
                  </div>
                  <div>
                    <span className="text-muted-foreground">Grasa</span>
                    {formatUp(dailyRemaining.fatG * mealRatios.lunch)}g
                  </div>
                </div>
                <div className="mt-1">
                  <p className="text-xs text-muted-foreground">Sugerido: {lunchSuggestion}</p>
                  <p className="text-xs text-muted-foreground">
                    Bebidas: Té sin azúcar o Café negro (sin límite)
                  </p>
                </div>
              </div>
            </div>

            {/* Dinner */}
            <div className="pt-2 border-t border-border">
              <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Cena
              </h4>
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-1 text-xs">
                  <div>
                    <span className="text-muted-foreground">Energía</span>
                    {formatUp(dailyRemaining.energyKcal * mealRatios.dinner)} kcal
                  </div>
                  <div>
                    <span className="text-muted-foreground">Proteína</span>
                    {formatUp(dailyRemaining.proteinG * mealRatios.dinner)}g
                  </div>
                  <div>
                    <span className="text-muted-foreground">Carbos</span>
                    {formatUp(dailyRemaining.carbsG * mealRatios.dinner)}g
                  </div>
                  <div>
                    <span className="text-muted-foreground">Grasa</span>
                    {formatUp(dailyRemaining.fatG * mealRatios.dinner)}g
                  </div>
                </div>
                <div className="mt-1">
                  <p className="text-xs text-muted-foreground">Sugerido: {dinnerSuggestion}</p>
                  <p className="text-xs text-muted-foreground">
                    Bebidas: Té sin azúcar o Café negro (sin límite)
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Daily target and projection */}
      <div className="rounded-lg border border-border bg-background p-4">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Objetivo diario y proyección
        </h3>
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">{i18n.mealLogEnergy}</span>
            {formatUp(currentTotals.energyKcal + remaining.energyKcal)} kcal
          </div>
          <div>
            <span className="text-muted-foreground">{i18n.mealLogProtein}</span>
            {formatUp(currentTotals.proteinG + remaining.proteinG)}g
          </div>
          <div>
            <span className="text-muted-foreground">{i18n.mealLogCarbs}</span>
            {formatUp(currentTotals.carbsG + remaining.carbsG)}g
          </div>
          <div>
            <span className="text-muted-foreground">{i18n.mealLogFat}</span>
            {formatUp(currentTotals.fatG + remaining.fatG)}g
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Objetivo: {goal.energyTargetKcal} kcal | {goal.proteinPct}%P / {goal.carbsPct}%C /{' '}
          {goal.fatPct}%F
        </div>
        <div className="mt-1 text-xs">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              currentTotals.energyKcal + remaining.energyKcal >= goal.energyTargetKcal * 0.9 &&
              currentTotals.energyKcal + remaining.energyKcal <= goal.energyTargetKcal * 1.1
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            Energía:{' '}
            {Math.round(
              ((currentTotals.energyKcal + remaining.energyKcal) / goal.energyTargetKcal) * 100,
            )}
            %
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-2 ${
              ((currentTotals.proteinG + remaining.proteinG) * 4 * 100) / goal.energyTargetKcal >=
                goal.proteinPct * 0.9 &&
              ((currentTotals.proteinG + remaining.proteinG) * 4 * 100) / goal.energyTargetKcal <=
                goal.proteinPct * 1.1
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            Proteína:{' '}
            {Math.round(
              ((currentTotals.proteinG + remaining.proteinG) * 4 * 100) / goal.energyTargetKcal,
            )}
            %
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-2 ${
              ((currentTotals.carbsG + remaining.carbsG) * 4 * 100) / goal.energyTargetKcal >=
                goal.carbsPct * 0.9 &&
              ((currentTotals.carbsG + remaining.carbsG) * 4 * 100) / goal.energyTargetKcal <=
                goal.carbsPct * 1.1
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            Carbs:{' '}
            {Math.round(
              ((currentTotals.carbsG + remaining.carbsG) * 4 * 100) / goal.energyTargetKcal,
            )}
            %
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-2 ${
              ((currentTotals.fatG + remaining.fatG) * 9 * 100) / goal.energyTargetKcal >=
                goal.fatPct * 0.9 &&
              ((currentTotals.fatG + remaining.fatG) * 9 * 100) / goal.energyTargetKcal <=
                goal.fatPct * 1.1
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            Grasa:{' '}
            {Math.round(((currentTotals.fatG + remaining.fatG) * 9 * 100) / goal.energyTargetKcal)}%
          </span>
        </div>
      </div>
    </div>
  );
}
