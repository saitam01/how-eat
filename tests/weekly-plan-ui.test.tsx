import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { WeeklyPlan } from '@/components/WeeklyPlan';
import { foodDB } from '@/lib/food-db';
import { DEFAULT_FOOD_PROFILE } from '@/lib/food-profile';
import type { FoodProfileInput, MacroGoal } from '@/lib/types';

const goal: MacroGoal = { energyTargetKcal: 1800, proteinPct: 25, carbsPct: 50, fatPct: 25 };

function PlannerHarness({ initialProfile = DEFAULT_FOOD_PROFILE }: { initialProfile?: FoodProfileInput }) {
  const [profile, setProfile] = useState<FoodProfileInput>(initialProfile);
  return (
    <>
      <button type="button" onClick={() => setProfile((current) => ({ ...current, excludedFoodIds: foodDB.items.map((food) => food.id) }))}>
        Restringir todos los alimentos
      </button>
      <WeeklyPlan goal={goal} profile={profile} onProfileChange={(changes) => setProfile((current) => ({ ...current, ...changes }))} />
    </>
  );
}

describe('WeeklyPlan', () => {
  it('renders seven planned days with breakfast, lunch, dinner, food portions, totals, and signed deviations', () => {
    render(<PlannerHarness />);

    expect(screen.getAllByRole('heading', { level: 3 }).filter((heading) =>
      ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].includes(heading.textContent ?? ''),
    )).toHaveLength(7);
    expect(screen.getAllByRole('heading', { name: 'Desayuno' })).toHaveLength(7);
    expect(screen.getAllByRole('heading', { name: 'Almuerzo' })).toHaveLength(7);
    expect(screen.getAllByRole('heading', { name: 'Cena' })).toHaveLength(7);
    expect(screen.getAllByText('Totales diarios')).toHaveLength(7);
    expect(screen.getAllByText('Desviación respecto del objetivo')).toHaveLength(7);
    expect(screen.getAllByText(/^Energía$/).some((label) => label.parentElement?.textContent?.includes('+') || label.parentElement?.textContent?.includes('-'))).toBe(true);
  });

  it('updates planning output safely when a hard food exclusion changes', () => {
    render(<PlannerHarness />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Restringir todos los alimentos' }));

    expect(screen.getByRole('alert')).toHaveTextContent('No se puede generar un plan seguro');
    expect(screen.queryByText('Lunes')).not.toBeInTheDocument();
  });

  it('renders infeasible reasons and no planned days', () => {
    render(<PlannerHarness initialProfile={{ ...DEFAULT_FOOD_PROFILE, excludedFoodIds: foodDB.items.map((food) => food.id) }} />);

    expect(screen.getByRole('alert')).toHaveTextContent('No candidates remain after hard safety constraints.');
    expect(screen.queryByText('Comidas planificadas')).not.toBeInTheDocument();
    expect(screen.queryByText('Lunes')).not.toBeInTheDocument();
  });

  it('does not retain the diary-driven repeated chicken, rice, and oil template', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/WeeklyPlan.tsx'), 'utf8');

    expect(source).not.toContain('mealLogEntries');
    expect(source).not.toContain('entriesForDate');
    expect(source).not.toContain('planSuggestionProtein');
    expect(source).not.toContain('planDailyTemplate');
  });
});
