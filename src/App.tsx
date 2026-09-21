import { useCallback, useEffect, useState } from 'react';
import type { PresetKey } from '@/types';
import type { MacroGoal, FoodItem } from '@/lib/types';
import { useCalculator } from '@/hooks/useCalculator';
import { useMealLog } from '@/hooks/useMealLog';
import { useFoodProfile } from '@/hooks/useFoodProfile';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { loadState, shareUrl } from '@/lib/url';
import { CalculatorForm } from '@/components/CalculatorForm';
import { MacroSliders } from '@/components/MacroSliders';
import { ResultCard } from '@/components/ResultCard';
import { ShareButton } from '@/components/ShareButton';
import { FoodSearch } from '@/components/FoodSearch';
import { MealLog } from '@/components/MealLog';
import { WeeklyPlan } from '@/components/WeeklyPlan';
import { WeightLog } from '@/components/WeightLog';
import { Disclaimer } from '@/components/Disclaimer';
import { TabBar, type TabKey } from '@/components/TabBar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster } from '@/components/ui/toast';
import { toast } from '@/lib/toast';
import { todayLocal } from '@/lib/date';
import i18n from '@/i18n/es.json';

export function App() {
  const [initial] = useState(() => loadState());
  const calc = useCalculator(initial.state);
  const [activeTab, setActiveTab] = useLocalStorage<TabKey>('how-eat:active-tab', 'calculator');

  // Derive macro goal from calculator result
  const goal: MacroGoal = {
    energyTargetKcal: calc.result?.targetCalories ?? 0,
    proteinPct: calc.macros.proteinPct,
    carbsPct: calc.macros.carbsPct,
    fatPct: calc.macros.fatPct,
  };

  const mealLog = useMealLog(goal);
  const { profile, updateProfile } = useFoodProfile();

  useEffect(() => {
    if (initial.invalidParams) toast(i18n.invalidParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePreset = useCallback(
    (key: PresetKey) => {
      if (key === 'personalizado') calc.setPreset('personalizado');
      else calc.applyPreset(key);
    },
    [calc],
  );

  const handleSelectFood = useCallback(
    (food: FoodItem, quantity: number) => {
      mealLog.addEntry(food.id, quantity);
      toast(`${i18n.foodAdded}: ${food.name} (${quantity})`);
    },
    [mealLog],
  );

  const url = shareUrl({ inputs: calc.inputs, macros: calc.macros, preset: calc.preset });

  return (
    <>
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
        <header className="mb-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">how-eat</h1>
            <ThemeToggle />
          </div>
          <p className="text-sm text-muted-foreground">{i18n.tagline}</p>
        </header>

        <TabBar active={activeTab} onChange={setActiveTab} />

        {activeTab === 'calculator' && (
          <div className="grid gap-6 md:grid-cols-2">
            <section>
              <CalculatorForm inputs={calc.inputs} onChange={calc.setInputs} />
              <MacroSliders
                macros={calc.macros}
                onLiveDrag={calc.onMacroLiveDrag}
                onCommit={calc.onMacroCommit}
                preset={calc.preset}
                onPreset={handlePreset}
              />
            </section>

            <aside className="space-y-4 md:sticky md:top-6 md:self-start">
              <ResultCard result={calc.result} onReset={calc.reset} />
              <ShareButton url={url} disabled={calc.shareDisabled} onCopied={() => undefined} />
            </aside>
          </div>
        )}

        {activeTab === 'diario' && (
          <div>
            {calc.result === null ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <p className="text-muted-foreground">{i18n.diaryCTA}</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <section>
                  <h2 className="mb-3 text-sm font-semibold">{i18n.mealLogSearchTitle}</h2>
                  <FoodSearch onSelect={handleSelectFood} />
                </section>

                <aside className="space-y-4 md:sticky md:top-6 md:self-start">
                  <MealLog
                    entries={mealLog.dayEntries}
                    totals={mealLog.totals}
                    progress={mealLog.progress}
                    goal={goal}
                    selectedDate={mealLog.selectedDate}
                    isToday={mealLog.isToday}
                    onPrevDay={mealLog.goToPrevDay}
                    onNextDay={mealLog.goToNextDay}
                    onToday={() => mealLog.goToDate(todayLocal())}
                    onRemove={mealLog.removeEntry}
                    onClear={mealLog.clear}
                  />
                </aside>
              </div>
            )}
          </div>
        )}

        {activeTab === 'plan' && (
          <div>
            <WeeklyPlan goal={goal} profile={profile} onProfileChange={updateProfile} />
          </div>
        )}

        {activeTab === 'progreso' && <WeightLog />}

        <Disclaimer />
      </main>
      <Toaster />
    </>
  );
}
