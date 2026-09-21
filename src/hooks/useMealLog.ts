import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { foodDB } from '../lib/food-db';
import { todayLocal } from '../lib/date';
import type { MealEntry, MacroGoal } from '../lib/types';

/**
 * Hook to manage meal logging state.
 * @param goal - The macro goal from the calculator.
 * @returns Object with entries, totals, progress, and mutator functions.
 */
export function useMealLog(goal: MacroGoal) {
  // Initialize state from localStorage
  const [entries, setEntriesState] = useState<MealEntry[]>(() => {
    try {
      const raw = window.localStorage.getItem('how-eat-meals:v1');
      if (raw !== null) {
        return JSON.parse(raw) as MealEntry[];
      }
    } catch {
      /* blocked/missing → fall back to empty array */
    }
    return [];
  });

  // Persist entries to localStorage with debounce to prevent excessive writes
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear previous timeout if exists
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout to save after 300ms debounce
    saveTimeoutRef.current = setTimeout(() => {
      try {
        window.localStorage.setItem('how-eat-meals:v1', JSON.stringify(entries));
      } catch {
        /* blocked/missing → in-memory only */
      }
    }, 300);

    // Cleanup on unmount or before next effect run
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [entries]);

  const totals = useMemo(() => {
    return entries.reduce(
      (acc: DailyTotals, entry: MealEntry) => ({
        energyKcal: acc.energyKcal + entry.energyKcal,
        proteinG: acc.proteinG + entry.proteinG,
        carbsG: acc.carbsG + entry.carbsG,
        fatG: acc.fatG + entry.fatG,
      }),
      {
        energyKcal: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
      },
    );
  }, [entries]);

  const progress = useMemo(() => {
    if (goal.energyTargetKcal <= 0) {
      return { energy: 0, protein: 0, carbs: 0, fat: 0 };
    }
    const energyProgress = (totals.energyKcal / goal.energyTargetKcal) * 100;
    const proteinProgress = ((totals.proteinG * 4) / goal.energyTargetKcal) * 100;
    const carbsProgress = ((totals.carbsG * 4) / goal.energyTargetKcal) * 100;
    const fatProgress = ((totals.fatG * 9) / goal.energyTargetKcal) * 100;
    return {
      energy: Math.min(energyProgress, 150),
      protein: Math.min(proteinProgress, 150),
      carbs: Math.min(carbsProgress, 150),
      fat: Math.min(fatProgress, 150),
    };
  }, [totals, goal]);

  const addEntry = useCallback((foodId: string, amount: number) => {
    if (amount <= 0) {
      console.warn('Amount must be positive');
      return;
    }
    // Find the food item in the food database
    const foodItem = foodDB.items.find((item) => item.id === foodId);
    if (!foodItem) {
      console.warn(`Food item with id ${foodId} not found`);
      return;
    }
    // Compute nutrients for the given amount
    // Nutrients in foodItem are per unit (as defined by foodItem.unit)
    const newEntry: MealEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      foodId,
      amount,
      energyKcal: foodItem.energyKcal * amount,
      proteinG: foodItem.proteinG * amount,
      carbsG: foodItem.carbsG * amount,
      fatG: foodItem.fatG * amount,
      timestamp: Date.now(),
      date: todayLocal(),
    };
    setEntriesState((prev) => [...prev, newEntry]);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntriesState((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const clear = useCallback(() => {
    setEntriesState([]);
  }, []);

  return {
    entries,
    totals,
    progress,
    addEntry,
    removeEntry,
    clear,
  };
}

// Helper type for totals (not exported)
interface DailyTotals {
  energyKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}
