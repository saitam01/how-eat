import type { Macros, MacroKey } from '@/types';

const MACRO_KEYS: MacroKey[] = ['proteinPct', 'carbsPct', 'fatPct'];

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/**
 * Largest-remainder (Hamilton) apportionment: distributes `total` across `values`
 * proportionally to their magnitudes, returning integers whose sum is exactly `total`.
 * When the proportional basis is all-zero, splits as evenly as possible.
 * Invariant: Σ out === total (design §6.1).
 */
export function largestRemainder(values: number[], total: number): number[] {
  const n = values.length;
  if (n === 0) return [];
  const sum = values.reduce((a, b) => a + b, 0);

  if (sum <= 0) {
    const base = Math.floor(total / n);
    const out = new Array(n).fill(base);
    const rem = total - base * n;
    for (let i = 0; i < rem; i++) out[i]++;
    return out;
  }

  const raw = values.map((v) => (v / sum) * total);
  const floored = raw.map(Math.floor);
  const remainder = total - floored.reduce((a, b) => a + b, 0);

  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);

  const out = floored.slice();
  for (let k = 0; k < remainder; k++) out[order[k].i]++;
  return out;
}

/**
 * Redistribute macros when slider `moved` is committed to `v`. The moved slider is fixed;
 * the other two absorb the remaining (100 - v) proportionally to their current ratio.
 * Always returns a triple summing to exactly 100 (design §6.2).
 */
export function redistributeMacros(moved: MacroKey, v: number, current: Macros): Macros {
  const nv = clamp(Math.round(v), 0, 100);
  const remaining = 100 - nv;
  const others = MACRO_KEYS.filter((k) => k !== moved);
  const [a, b] = largestRemainder([current[others[0]], current[others[1]]], remaining);
  return { ...current, [moved]: nv, [others[0]]: a, [others[1]]: b };
}

/** Coerce any triple to one summing to exactly 100 (defensive on hydrate/preset). */
export function normalizeTo100(m: Macros): Macros {
  const [p, c, f] = largestRemainder([m.proteinPct, m.carbsPct, m.fatPct], 100);
  return { proteinPct: p, carbsPct: c, fatPct: f };
}

export function macroSum(m: Macros): number {
  return m.proteinPct + m.carbsPct + m.fatPct;
}
