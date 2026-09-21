import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { FoodPreferences } from '@/components/FoodPreferences';
import { DEFAULT_FOOD_PROFILE } from '@/lib/food-profile';
import type { FoodProfileInput } from '@/lib/types';

function PreferencesHarness() {
  const [profile, setProfile] = useState<FoodProfileInput>(DEFAULT_FOOD_PROFILE);
  return <FoodPreferences profile={profile} onChange={(changes) => setProfile((current) => ({ ...current, ...changes }))} />;
}

describe('FoodPreferences', () => {
  it('provides labelled Spanish controls and explains total intolerance blocking', () => {
    render(<PreferencesHarness />);

    expect(screen.getByRole('heading', { name: 'Preferencias alimentarias' })).toBeInTheDocument();
    expect(screen.getByLabelText('Patrón alimentario')).toBeInTheDocument();
    expect(screen.getByText(/Bloquean totalmente los alimentos relacionados/)).toBeInTheDocument();
    expect(screen.getByLabelText('Alimentos que no querés incluir')).toHaveAttribute('multiple');
    expect(screen.getByLabelText('Máximo de repeticiones por alimento (semana)')).toHaveAttribute('min', '1');
  });

  it('updates restrictions, food selections, and clamped repeat limits', () => {
    render(<PreferencesHarness />);

    fireEvent.click(screen.getByLabelText('Leche'));
    expect(screen.getByLabelText('Leche')).toBeChecked();

    fireEvent.click(screen.getByLabelText('Lactosa'));
    expect(screen.getByLabelText('Lactosa')).toBeChecked();

    const exclusions = screen.getByLabelText('Alimentos que no querés incluir') as HTMLSelectElement;
    const chicken = Array.from(exclusions.options).find((option) => option.value === 'p01') as HTMLOptionElement;
    chicken.selected = true;
    fireEvent.change(exclusions);
    expect(chicken.selected).toBe(true);

    const repeats = screen.getByLabelText('Máximo de repeticiones por alimento (semana)');
    fireEvent.change(repeats, { target: { value: '99' } });
    expect(repeats).toHaveValue(7);
  });
});
