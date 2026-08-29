import { useCallback, useEffect, useState } from 'react';

/**
 * Generic localStorage-backed state hook (design §11). Returns a tuple
 * `[value, setValue]`. Tolerates a missing/blocked localStorage by falling back to
 * an in-memory store so the hook never throws.
 */
export function useLocalStorage<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw) as T;
    } catch {
      /* blocked/missing → fall back to initial */
    }
    return initial;
  });

  const set = useCallback(
    (next: T) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* blocked/missing → in-memory only */
      }
    },
    [key],
  );

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setValue(JSON.parse(e.newValue) as T);
        } catch {
          /* ignore malformed cross-tab payloads */
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  return [value, set];
}
