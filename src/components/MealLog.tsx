import type { MealEntry, DailyTotals, MacroGoal } from '../lib/types';
import { foodDB } from '../lib/food-db';
import i18n from '../i18n/es.json';

interface MealLogProps {
  entries: MealEntry[];
  totals: DailyTotals;
  progress: { energy: number; protein: number; carbs: number; fat: number };
  goal: MacroGoal;
  onRemove: (id: string) => void;
  onClear: () => void;
}

function getFoodName(foodId: string): string {
  const item = foodDB.items.find((f) => f.id === foodId);
  return item?.name ?? foodId;
}

function ProgressBar({
  label,
  percentage,
  target,
  consumed,
  unit,
}: {
  label: string;
  percentage: number;
  target: number;
  consumed: number;
  unit: string;
}) {
  const clamped = Math.min(percentage, 150);
  const color =
    percentage > 100 ? 'bg-amber-500' : percentage >= 80 ? 'bg-emerald-500' : 'bg-emerald-400';

  const diff = consumed - target;
  const diffText =
    percentage > 100
      ? `+${Math.round(diff)}${unit} ${i18n.excess}`
      : percentage >= 80
        ? `✓ ${i18n.onTarget}`
        : `${Math.round(diff)}${unit} ${i18n.deficit}`;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">{percentage.toFixed(0)}%</span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={Math.round(percentage)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${percentage.toFixed(0)}%`}
        >
          <div
            className={`h-full rounded-full transition-all ${color}`}
            style={{ width: `${Math.min(clamped, 100)}%` }}
          />
        </div>
        <span className="w-24 text-right text-xs tabular-nums text-muted-foreground">
          {diffText}
        </span>
      </div>
    </div>
  );
}

export const MealLog = ({
  entries,
  totals,
  progress,
  goal,
  onRemove,
  onClear,
}: MealLogProps) => {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">{i18n.mealLogEmpty}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bars */}
      <div className="space-y-3 rounded-lg border border-border bg-background p-4 shadow-sm">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Progreso diario
        </h3>
        <ProgressBar
          label={i18n.mealLogEnergy}
          percentage={progress.energy}
          target={goal.energyTargetKcal}
          consumed={totals.energyKcal}
          unit=" kcal"
        />
        <ProgressBar
          label={i18n.mealLogProtein}
          percentage={progress.protein}
          target={Math.round((goal.energyTargetKcal * goal.proteinPct) / 100 / 4)}
          consumed={totals.proteinG}
          unit="g"
        />
        <ProgressBar
          label={i18n.mealLogCarbs}
          percentage={progress.carbs}
          target={Math.round((goal.energyTargetKcal * goal.carbsPct) / 100 / 4)}
          consumed={totals.carbsG}
          unit="g"
        />
        <ProgressBar
          label={i18n.mealLogFat}
          percentage={progress.fat}
          target={Math.round((goal.energyTargetKcal * goal.fatPct) / 100 / 9)}
          consumed={totals.fatG}
          unit="g"
        />
      </div>

      {/* Daily totals */}
      <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {i18n.mealLogTotals}
        </h3>
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">{i18n.mealLogEnergy}</span>
            <p className="font-medium tabular-nums">{totals.energyKcal} kcal</p>
          </div>
          <div>
            <span className="text-muted-foreground">{i18n.mealLogProtein}</span>
            <p className="font-medium tabular-nums">{totals.proteinG}g</p>
          </div>
          <div>
            <span className="text-muted-foreground">{i18n.mealLogCarbs}</span>
            <p className="font-medium tabular-nums">{totals.carbsG}g</p>
          </div>
          <div>
            <span className="text-muted-foreground">{i18n.mealLogFat}</span>
            <p className="font-medium tabular-nums">{totals.fatG}g</p>
          </div>
        </div>
      </div>

      {/* Entries list */}
      <div className="space-y-2">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between rounded-md border border-border p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{getFoodName(entry.foodId)}</p>
              <p className="text-xs text-muted-foreground">
                {entry.amount} — {entry.energyKcal} kcal, {entry.proteinG}g prot,{' '}
                {entry.carbsG}g carb, {entry.fatG}g grasa
              </p>
            </div>
            <button
              onClick={() => onRemove(entry.id)}
              className="ml-2 shrink-0 text-xs text-destructive hover:underline"
              aria-label={i18n.mealLogRemoveAria}
            >
              {i18n.mealLogRemove}
            </button>
          </div>
        ))}
      </div>

      {/* Clear button */}
      <button
        onClick={onClear}
        className="w-full rounded-md border border-destructive py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
        aria-label={i18n.mealLogClear}
      >
        {i18n.mealLogClear}
      </button>
    </div>
  );
};
