import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '@/App';

describe('App tab integration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('keeps all application tabs navigable and wires the Plan tab to persisted preferences', () => {
    render(<App />);

    const calculator = screen.getByRole('tab', { name: 'Calculadora' });
    expect(calculator).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Sexo')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Diario' }));
    expect(screen.getByRole('tab', { name: 'Diario' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: 'Buscar alimentos' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Plan semanal' }));
    expect(screen.getByRole('tab', { name: 'Plan semanal' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: 'Preferencias alimentarias' })).toBeInTheDocument();
    expect(screen.getByLabelText('Patrón alimentario')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/Plan semanal (factible|con ajustes)/);

    fireEvent.click(screen.getByRole('tab', { name: 'Progreso' }));
    expect(screen.getByRole('tab', { name: 'Progreso' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: 'Historial de peso' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Calculadora' }));
    expect(screen.getByText('Sexo')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Plan semanal' }));
    expect(screen.getByRole('heading', { name: 'Preferencias alimentarias' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/Plan semanal (factible|con ajustes)/);
  });
});
