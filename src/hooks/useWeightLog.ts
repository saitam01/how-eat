import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { todayLocal } from '@/lib/date';
import { RANGES } from '@/lib/constants';
import { loadWeightEntries, saveWeightEntries } from '@/lib/weight-storage';
import type { WeightEntry } from '@/lib/types';

export function useWeightLog() {
  const [entries, setEntries] = useState<WeightEntry[]>(loadWeightEntries);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      saveWeightEntries(entries);
    }, 300);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [entries]);

  const addEntry = useCallback((weightKg: number) => {
    if (
      !Number.isFinite(weightKg) ||
      weightKg < RANGES.weightKg.min ||
      weightKg > RANGES.weightKg.max
    ) {
      return;
    }

    const timestamp = Date.now();
    setEntries((previous) => [
      ...previous,
      {
        id: `${timestamp}-${Math.random().toString(36).slice(2, 11)}`,
        date: todayLocal(),
        weightKg,
        timestamp,
      },
    ]);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((previous) => previous.filter((entry) => entry.id !== id));
  }, []);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date) || a.timestamp - b.timestamp),
    [entries],
  );

  return { entries: sortedEntries, addEntry, removeEntry };
}
