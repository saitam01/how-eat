import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Ensure a working localStorage in the test environment. Some combinations of the
// test DOM environment and Node's experimental localStorage global leave
// `window.localStorage` undefined; polyfill a minimal in-memory store so storage
// tests can run (design §11: storage must handle a missing/blocked store anyway).
if (typeof window !== 'undefined' && !(window as { localStorage?: unknown }).localStorage) {
  const store = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
      setItem: (k: string, v: string) => {
        store.set(k, String(v));
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      clear: () => store.clear(),
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      get length() {
        return store.size;
      },
    },
  });
}

// Mark the React act() environment for Testing Library.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  // Fresh DOM/localStorage per test so persistence + URL hydration tests isolate state.
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
