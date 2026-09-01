import { renderHook, act } from '@testing-library/react';
import type { MacroGoal } from '../src/lib/types';

describe('useMealLog hook', () => {
  beforeEach(() => {
    vi.resetModules();
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should initialize with empty entries and zero totals', async () => {
    const { useMealLog } = await import('../src/hooks/useMealLog');
    const goal: MacroGoal = {
      energyTargetKcal: 2000,
      proteinPct: 20,
      carbsPct: 50,
      fatPct: 30,
    };

    const { result } = renderHook(() => useMealLog(goal));

    expect(result.current.entries).toHaveLength(0);
    expect(result.current.totals).toEqual({
      energyKcal: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
    });
    expect(result.current.progress).toEqual({
      energy: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });

  it('should add food with default amount and compute nutrients correctly', async () => {
    const { foodDB } = await import('../src/lib/food-db');
    foodDB.items = [
      {        id: 'apple',
        name: 'Apple',
        category: 'fruit',
        energyKcal: 52,
        proteinG: 0.3,
        carbsG: 14,
        fatG: 0.2,
        unit: '100g',
      },
    ];
    const { useMealLog } = await import('../src/hooks/useMealLog');
    const goal: MacroGoal = {
      energyTargetKcal: 2000,
      proteinPct: 20,
      carbsPct: 50,
      fatPct: 30,
    };

    const { result } = renderHook(() => useMealLog(goal));

    // Act: add food with amount 1 (default)
    act(() => {
      result.current.addEntry('apple', 1);
    });

    // Debug: log entry and totals
    const entry = result.current.entries[0];
    console.log('Entry:', entry);
    console.log('Totals:', result.current.totals);
    console.log('Progress:', result.current.progress);

    // Assert: entry added
    expect(result.current.entries).toHaveLength(1);
    expect(entry.foodId).toBe('apple');
    expect(entry.amount).toBe(1);
    expect(entry.energyKcal).toBeCloseTo(52);
    expect(entry.proteinG).toBeCloseTo(0.3);
    expect(entry.carbsG).toBeCloseTo(14);
    expect(entry.fatG).toBeCloseTo(0.2);
    expect(entry.timestamp).toBeGreaterThan(0);

    // Assert: totals updated
    expect(result.current.totals).toEqual({
      energyKcal: 52,
      proteinG: 0.3,
      carbsG: 14,
      fatG: 0.2,
    });

    // Assert: progress updated (assuming goal)
    // energy: 52 / 2000 * 100 = 2.6%
    // protein: (0.3g * 4 kcal/g) = 1.2 kcal -> 1.2/2000*100 = 0.06%
    // carbs: (14g * 4) = 56 kcal -> 56/2000*100 = 2.8%
    // fat: (0.2g * 9) = 1.8 kcal -> 1.8/2000*100 = 0.09%
    expect(result.current.progress.energy).toBeCloseTo(2.6);
    expect(result.current.progress.protein).toBeCloseTo(0.06);
    expect(result.current.progress.carbs).toBeCloseTo(2.8);
    expect(result.current.progress.fat).toBeCloseTo(0.09);
  });

  describe('edge cases', () => {
    const localStorageMock = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    beforeEach(() => {
      vi.resetModules();
      if (window.localStorage) {
        // @ts-expect-error — testing localStorage unavailability
        delete window.localStorage;
      }
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
        configurable: true,
      });
    });

    it('should reject zero or negative amount', async () => {
      const { foodDB } = await import('../src/lib/food-db');
      foodDB.items = [
        {          id: 'apple',
          name: 'Apple',
          category: 'fruit',
          energyKcal: 52,
          proteinG: 0.3,
          carbsG: 14,
          fatG: 0.2,
          unit: '100g',
        },
      ];
      const { useMealLog } = await import('../src/hooks/useMealLog');

      const goal: MacroGoal = {
        energyTargetKcal: 2000,
        proteinPct: 20,
        carbsPct: 50,
        fatPct: 30,
      };

      const { result } = renderHook(() => useMealLog(goal));

      // Act: attempt to add zero amount
      act(() => {
        result.current.addEntry('apple', 0);
      });

      // Expect: no entry added
      expect(result.current.entries).toHaveLength(0);

      // Act: attempt to add negative amount
      act(() => {
        result.current.addEntry('apple', -1);
      });

      // Expect: still no entry added
      expect(result.current.entries).toHaveLength(0);
    });

    it('should handle storage failure gracefully', async () => {
      vi.useFakeTimers();
      const { foodDB } = await import('../src/lib/food-db');
      foodDB.items = [
        {          id: 'apple',
          name: 'Apple',
          category: 'fruit',
          energyKcal: 52,
          proteinG: 0.3,
          carbsG: 14,
          fatG: 0.2,
          unit: '100g',
        },
      ];
      // Make setItem throw
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const { useMealLog } = await import('../src/hooks/useMealLog');

      const goal: MacroGoal = {
        energyTargetKcal: 2000,
        proteinPct: 20,
        carbsPct: 50,
        fatPct: 30,
      };

      const { result } = renderHook(() => useMealLog(goal));

      act(() => {
        result.current.addEntry('apple', 1);
      });

      // Even if storage fails, entry should be in memory
      expect(result.current.entries).toHaveLength(1);
      expect(result.current.entries[0].foodId).toBe('apple');

      // Advance timers to trigger debounced save
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Verify that setItem was called (and threw)
      expect(localStorageMock.setItem).toHaveBeenCalled();

      // After another add, entries length should increase
      act(() => {
        result.current.addEntry('apple', 1);
      });

      expect(result.current.entries).toHaveLength(2);

      // Restore mock
      localStorageMock.setItem.mockRestore();
      vi.useRealTimers();
    });

    it('should handle large amounts without overflow', async () => {
      const { foodDB } = await import('../src/lib/food-db');
      foodDB.items = [
        {          id: 'apple',
          name: 'Apple',
          category: 'fruit',
          energyKcal: 52,
          proteinG: 0.3,
          carbsG: 14,
          fatG: 0.2,
          unit: '100g',
        },
      ];
      const { useMealLog } = await import('../src/hooks/useMealLog');

      const goal: MacroGoal = {
        energyTargetKcal: 2000,
        proteinPct: 20,
        carbsPct: 50,
        fatPct: 30,
      };

      const { result } = renderHook(() => useMealLog(goal));

      const largeAmount = 10000; // 100 * normal amount

      act(() => {
        result.current.addEntry('apple', largeAmount);
      });

      expect(result.current.entries).toHaveLength(1);
      const entry = result.current.entries[0];
      expect(entry.amount).toBe(largeAmount);
      expect(entry.energyKcal).toBeCloseTo(52 * largeAmount);
      expect(entry.proteinG).toBeCloseTo(0.3 * largeAmount);
      expect(entry.carbsG).toBeCloseTo(14 * largeAmount);
      expect(entry.fatG).toBeCloseTo(0.2 * largeAmount);

      // Totals should reflect large amount
      expect(result.current.totals.energyKcal).toBeCloseTo(52 * largeAmount);
      // Progress may exceed 150% clamp
      expect(result.current.progress.energy).toBeCloseTo(
        Math.min(((52 * largeAmount) / 2000) * 100, 150),
      );
    });

    it('should update progress when goal changes mid-day', async () => {
      const { foodDB } = await import('../src/lib/food-db');
      foodDB.items = [
        {          id: 'apple',
          name: 'Apple',
          category: 'fruit',
          energyKcal: 52,
          proteinG: 0.3,
          carbsG: 14,
          fatG: 0.2,
          unit: '100g',
        },
      ];
      const { useMealLog } = await import('../src/hooks/useMealLog');

      const initialGoal: MacroGoal = {
        energyTargetKcal: 2000,
        proteinPct: 20,
        carbsPct: 50,
        fatPct: 30,
      };

      const { result } = renderHook(() => useMealLog(initialGoal));

      // Add some food
      act(() => {
        result.current.addEntry('apple', 10); // 10 * 100g = 1000g
      });

      // Verify progress with initial goal
      expect(result.current.progress.energy).toBeCloseTo(((52 * 10) / 2000) * 100); // 26

      // Change goal to lower target
      const newGoal: MacroGoal = {
        energyTargetKcal: 1500,
        proteinPct: 20,
        carbsPct: 50,
        fatPct: 30,
      };

      // Re-render hook with new goal (simulate goal change)
      const { result: result2 } = renderHook(() => useMealLog(newGoal));

      // Since localStorage is cleared before each test, we need to add the entry again
      // (or we could persist it, but for simplicity we re-add).
      act(() => {
        result2.current.addEntry('apple', 10);
      });

      // Expect progress based on new goal
      expect(result2.current.progress.energy).toBeCloseTo(((52 * 10) / 1500) * 100); // ~34.666...
    });
  });

  describe('unit conversion with non-standard units', () => {
    it('should handle food with unit pieces (2 pieces = 100g)', async () => {
      const { foodDB } = await import('../src/lib/food-db');
      foodDB.items = [
        {
          id: '011',
          name: 'Huevo (pieza)',
          category: 'protein',
          energyKcal: 78,
          proteinG: 6.5,
          carbsG: 0.6,
          fatG: 5.5,
          unit: 'piece',
          unitPer100G: 2,
        },
      ];
      const { useMealLog } = await import('../src/hooks/useMealLog');
      const goal: MacroGoal = {
        energyTargetKcal: 2000,
        proteinPct: 20,
        carbsPct: 50,
        fatPct: 30,
      };

      const { result } = renderHook(() => useMealLog(goal));

      // Add 2 pieces (which should be 100g)
      act(() => {
        result.current.addEntry('011', 2); // foodId '011' is Huevo (pieza)
      });

      // Expect: entry added with correct nutrients for 2 pieces
      expect(result.current.entries).toHaveLength(1);
      const entry = result.current.entries[0];
      expect(entry.foodId).toBe('011');
      expect(entry.amount).toBe(2);
      // 2 pieces * nutrients per piece
      expect(entry.energyKcal).toBeCloseTo(78 * 2); // 156 kcal
      expect(entry.proteinG).toBeCloseTo(6.5 * 2); // 13g
      expect(entry.carbsG).toBeCloseTo(0.6 * 2); // 1.2g
      expect(entry.fatG).toBeCloseTo(5.5 * 2); // 11g;

      // Expect: totals updated
      expect(result.current.totals).toEqual({
        energyKcal: 156,
        proteinG: 13,
        carbsG: 1.2,
        fatG: 11,
      });

      // Expect: progress calculated correctly (based on 156 kcal out of 2000 goal)
      expect(result.current.progress.energy).toBeCloseTo((156 / 2000) * 100); // 7.8%
    });

    it('should handle food with unit slice (3.33 slices = 100g)', async () => {
      const { foodDB } = await import('../src/lib/food-db');
      foodDB.items = [
        {
          id: '012',
          name: 'Rebanada de pan blanco',
          category: 'grain',
          energyKcal: 80,
          proteinG: 2.7,
          carbsG: 14.7,
          fatG: 1.0,
          unit: 'slice',
          unitPer100G: 3.33,
        },
      ];
      const { useMealLog } = await import('../src/hooks/useMealLog');
      const goal: MacroGoal = {
        energyTargetKcal: 2000,
        proteinPct: 20,
        carbsPct: 50,
        fatPct: 30,
      };

      const { result } = renderHook(() => useMealLog(goal));

      // Add 3.33 slices (which should be 100g)
      act(() => {
        result.current.addEntry('012', 3.33); // foodId '012' is Rebanada de pan blanco
      });

      // Expect: entry added with correct nutrients for 3.33 slices
      expect(result.current.entries).toHaveLength(1);
      const entry = result.current.entries[0];
      expect(entry.foodId).toBe('012');
      expect(entry.amount).toBeCloseTo(3.33);
      // 3.33 slices * nutrients per slice
      expect(entry.energyKcal).toBeCloseTo(80 * 3.33); // ~266.4 kcal
      expect(entry.proteinG).toBeCloseTo(2.7 * 3.33); // ~8.991g
      expect(entry.carbsG).toBeCloseTo(14.7 * 3.33); // ~48.951g
      expect(entry.fatG).toBeCloseTo(1.0 * 3.33); // ~3.33g;

      // Expect: totals updated
      expect(result.current.totals.energyKcal).toBeCloseTo(266.4);
      expect(result.current.totals.proteinG).toBeCloseTo(8.991);
      expect(result.current.totals.carbsG).toBeCloseTo(48.951);
      expect(result.current.totals.fatG).toBeCloseTo(3.33);

      // Expect: progress calculated correctly
      expect(result.current.progress.energy).toBeCloseTo((266.4 / 2000) * 100); // ~13.32%
    });

    it('should handle food with unit cup (0.66 cups = 100g)', async () => {
      const { foodDB } = await import('../src/lib/food-db');
      foodDB.items = [
        {
          id: '013',
          name: 'Arroz blanco cocido (taza)',
          category: 'grain',
          energyKcal: 195,
          proteinG: 4.0,
          carbsG: 42.0,
          fatG: 0.5,
          unit: 'cup',
          unitPer100G: 0.66,
        },
      ];
      const { useMealLog } = await import('../src/hooks/useMealLog');
      const goal: MacroGoal = {
        energyTargetKcal: 2000,
        proteinPct: 20,
        carbsPct: 50,
        fatPct: 30,
      };

      const { result } = renderHook(() => useMealLog(goal));

      // Add 0.66 cups (which should be 100g)
      act(() => {
        result.current.addEntry('013', 0.66); // foodId '013' is Arroz blanco cocido (taza)
      });

      // Expect: entry added with correct nutrients for 0.66 cups
      expect(result.current.entries).toHaveLength(1);
      const entry = result.current.entries[0];
      expect(entry.foodId).toBe('013');
      expect(entry.amount).toBeCloseTo(0.66);
      // 0.66 cups * nutrients per cup
      expect(entry.energyKcal).toBeCloseTo(195 * 0.66); // ~128.7 kcal
      expect(entry.proteinG).toBeCloseTo(4.0 * 0.66); // ~2.64g
      expect(entry.carbsG).toBeCloseTo(42.0 * 0.66); // ~27.72g
      expect(entry.fatG).toBeCloseTo(0.5 * 0.66); // ~0.33g;

      // Expect: totals updated
      expect(result.current.totals.energyKcal).toBeCloseTo(128.7);
      expect(result.current.totals.proteinG).toBeCloseTo(2.64);
      expect(result.current.totals.carbsG).toBeCloseTo(27.72);
      expect(result.current.totals.fatG).toBeCloseTo(0.33);

      // Expect: progress calculated correctly
      expect(result.current.progress.energy).toBeCloseTo((128.7 / 2000) * 100); // ~6.435%
    });
  });

  describe('progress bar clamping at 150%', () => {
    it('should clamp energy progress at 150% when exceeding goal', async () => {
      const { foodDB } = await import('../src/lib/food-db');
      foodDB.items = [
        {
          id: '002',
          name: 'Arroz blanco',
          category: 'grain',
          energyKcal: 130,
          proteinG: 2.7,
          carbsG: 28,
          fatG: 0.3,
          unit: '100g',
        },
      ];
      const { useMealLog } = await import('../src/hooks/useMealLog');
      const goal: MacroGoal = {
        energyTargetKcal: 2000,
        proteinPct: 20,
        carbsPct: 50,
        fatPct: 30,
      };

      const { result } = renderHook(() => useMealLog(goal));

      // Add food that will give us lots of energy: 1000g of Arroz blanco (energyKcal: 130 per 100g)
      // 1000g = 10 * 100g portions
      // Energy: 130 * 10 = 1300 kcal
      // Progress: (1300 / 2000) * 100 = 65%

      act(() => {
        result.current.addEntry('002', 10); // Arroz blanco, 10 units (each unit is 100g)
      });

      expect(result.current.progress.energy).toBeCloseTo(65); // Not clamped yet

      // Add more to exceed 150%: need > 3000 kcal total
      // Current: 1300 kcal, need additional > 1700 kcal
      // Let's add another 15 units of Arroz blanco: 15 * 130 = 1950 kcal
      // Total: 1300 + 1950 = 3250 kcal
      // Progress: (3250 / 2000) * 100 = 162.5% → should clamp to 150%
      act(() => {
        result.current.addEntry('002', 15);
      });

      // Expect: progress clamped at 150%
      expect(result.current.progress.energy).toBeCloseTo(150);

      // Verify actual totals
      expect(result.current.totals.energyKcal).toBeCloseTo(3250);
    });

    it('should clamp protein progress at 150% when exceeding goal', async () => {
      const { foodDB } = await import('../src/lib/food-db');
      foodDB.items = [
        {
          id: '004',
          name: 'Pechuga de pollo',
          category: 'protein',
          energyKcal: 165,
          proteinG: 31,
          carbsG: 0,
          fatG: 3.6,
          unit: '100g',
        },
      ];
      const { useMealLog } = await import('../src/hooks/useMealLog');
      const goal: MacroGoal = {
        energyTargetKcal: 2000,
        proteinPct: 20,
        carbsPct: 50,
        fatPct: 30,
      };

      const { result } = renderHook(() => useMealLog(goal));

      // To get protein progress to 150%:
      // Need: (totals.proteinG * 4) / 2000 * 100 = 150
      // totals.proteinG * 4 = 3000
      // totals.proteinG = 750g

      // Use Pechuga de pollo: 31g protein per 100g unit
      // Need: 750 / 31 = 24.19 units of 100g
      act(() => {
        result.current.addEntry('004', 24.2); // Approximately 2420g of chicken breast
      });

      // Expect: protein progress clamped at 150%
      expect(result.current.progress.protein).toBeCloseTo(150);

      // Verify we have lots of protein
      expect(result.current.totals.proteinG).toBeGreaterThan(700); // Should be around 750g
    });

    it('should clamp carbs progress at 150% when exceeding goal', async () => {
      const { foodDB } = await import('../src/lib/food-db');
      foodDB.items = [
        {
          id: '002',
          name: 'Arroz blanco',
          category: 'grain',
          energyKcal: 130,
          proteinG: 2.7,
          carbsG: 28,
          fatG: 0.3,
          unit: '100g',
        },
      ];
      const { useMealLog } = await import('../src/hooks/useMealLog');
      const goal: MacroGoal = {
        energyTargetKcal: 2000,
        proteinPct: 20,
        carbsPct: 50,
        fatPct: 30,
      };

      const { result } = renderHook(() => useMealLog(goal));

      // To get carbs progress to 150%:
      // Need: (totals.carbsG * 4) / 2000 * 100 = 150
      // totals.carbsG * 4 = 3000
      // totals.carbsG = 750g

      // Use Arroz blanco: 28g carbs per 100g unit
      // Need: 750 / 28 = 26.79 units of 100g
      act(() => {
        result.current.addEntry('002', 26.8); // Approximately 2680g of white rice
      });

      // Expect: carbs progress clamped at 150%
      expect(result.current.progress.carbs).toBeCloseTo(150);

      // Verify we have lots of carbs
      expect(result.current.totals.carbsG).toBeGreaterThan(700); // Should be around 750g
    });

    it('should clamp fat progress at 150% when exceeding goal', async () => {
      const { foodDB } = await import('../src/lib/food-db');
      foodDB.items = [
        {
          id: '018',
          name: 'Aceite de oliva',
          category: 'fat',
          energyKcal: 884,
          proteinG: 0,
          carbsG: 0,
          fatG: 100,
          unit: '100g',
        },
      ];
      const { useMealLog } = await import('../src/hooks/useMealLog');
      const goal: MacroGoal = {
        energyTargetKcal: 2000,
        proteinPct: 20,
        carbsPct: 50,
        fatPct: 30,
      };

      const { result } = renderHook(() => useMealLog(goal));

      // To get fat progress to 150%:
      // Need: (totals.fatG * 9) / 2000 * 100 = 150
      // totals.fatG * 9 = 3000
      // totals.fatG = 333.33g

      // Use Aceite de oliva: 100g fat per 100g unit (it's pure fat)
      // Need: 333.33 / 100 = 3.33 units of 100g
      act(() => {
        result.current.addEntry('018', 3.34); // Approximately 334g of olive oil
      });

      // Expect: fat progress clamped at 150%
      expect(result.current.progress.fat).toBeCloseTo(150);

      // Verify we have lots of fat
      expect(result.current.totals.fatG).toBeGreaterThan(300); // Should be around 333g
    });
  });
});
