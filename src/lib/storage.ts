import type { AppState } from '@/types';
import { STORAGE_KEY } from '@/lib/constants';

export function loadPersisted(): AppState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || typeof parsed !== 'object' || !parsed.inputs || !parsed.macros) return null;
    return parsed;
  } catch {
    return null;
  } // corrupt/blocked → null (design §11)
}

export function savePersisted(state: AppState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* no-op */
  }
}

export function clearPersisted(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* no-op */
  }
}
