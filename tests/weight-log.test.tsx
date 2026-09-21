import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WeightLog } from '@/components/WeightLog';
import { WEIGHT_STORAGE_KEY } from '@/lib/weight-storage';

describe('WeightLog', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('shows an empty state before any entries are added', () => {
    render(<WeightLog />);

    expect(screen.getByText('Sin registros de peso todavía')).toBeInTheDocument();
  });

  it('adds an entry and persists it', async () => {
    render(<WeightLog />);

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Peso (kg)' }), {
      target: { value: '72.4' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(screen.getByText(/72\.4 kg/)).toBeInTheDocument();
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem(WEIGHT_STORAGE_KEY) ?? '[]');
      expect(saved).toHaveLength(1);
      expect(saved[0]).toMatchObject({ weightKg: 72.4 });
    });
  });

  it('shows an error for an out-of-range weight', () => {
    render(<WeightLog />);

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Peso (kg)' }), {
      target: { value: '301' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(screen.getByText('Peso fuera de rango (30–300 kg)')).toBeInTheDocument();
    expect(screen.queryByText(/301 kg/)).not.toBeInTheDocument();
  });
});
