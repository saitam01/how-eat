import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/hooks/useTheme';

const STORAGE_KEY = 'how-eat:theme';

function resetThemeEnvironment() {
  document.documentElement.classList.remove('dark');
  window.localStorage.clear();
}

describe('theme', () => {
  beforeEach(resetThemeEnvironment);
  afterEach(resetThemeEnvironment);

  it('toggles the document class and persists the selected theme from the control', () => {
    render(createElement(ThemeToggle));

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar tema' }));

    expect(document.documentElement).toHaveClass('dark');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('dark');
  });

  it('defaults to light and toggles to dark', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('light');
    expect(document.documentElement).not.toHaveClass('dark');

    act(() => {
      result.current.toggle();
    });

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement).toHaveClass('dark');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('dark');
  });

  it('uses a pre-seeded dark theme', () => {
    window.localStorage.setItem(STORAGE_KEY, 'dark');

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement).toHaveClass('dark');
  });
});
