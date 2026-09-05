import type { Result } from '@/types';

/** Builds the screen-reader announcement for the current result (design D4). */
export function buildAnnouncement(r: Result): string {
  return `Objetivo: ${r.targetCalories} kcal por día. Proteína ${r.macros.protein.grams} g, Carbohidratos ${r.macros.carbs.grams} g, Grasa ${r.macros.fat.grams} g. Fórmula: ${
    r.formulaUsed === 'katch-mcardle' ? 'Katch-McArdle' : 'Mifflin-St Jeor'
  }.`;
}
