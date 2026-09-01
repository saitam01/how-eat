import { renderHook, act } from '@testing-library/react';
import type { FoodItem } from '../src/lib/types';
import { convertToPer100g } from '../src/lib/food-search-utils';

const mockFoodDB = vi.hoisted(() => ({
  foodDB: { items: [] as FoodItem[] },
}));

vi.mock('../src/lib/food-db', () => mockFoodDB);

describe('useFoodSearch hook', () => {
  beforeEach(() => {
    mockFoodDB.foodDB.items = [];
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return exact match for food name', async () => {
    mockFoodDB.foodDB.items = [
      { id: '001', name: 'Manzana', category: 'fruit', energyKcal: 52, proteinG: 0.3, carbsG: 14, fatG: 0.2, unit: '100g' },
    ];

    const { useFoodSearch } = await import('../src/hooks/useFoodSearch');
    const { result } = renderHook(() => useFoodSearch());

    await act(async () => {
      while (result.current.loading) await new Promise((r) => setTimeout(r, 10));
    });

    const searchResult = result.current.search('manzana');
    expect(searchResult).toHaveLength(1);
    expect(searchResult[0].id).toBe('001');
  });

  it('should return partial matches', async () => {
    mockFoodDB.foodDB.items = [
      { id: '002', name: 'Arroz integral', category: 'grain', energyKcal: 111, proteinG: 2.6, carbsG: 23, fatG: 0.9, unit: '100g' },
      { id: '003', name: 'Arroz blanco', category: 'grain', energyKcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3, unit: '100g' },
    ];

    const { useFoodSearch } = await import('../src/hooks/useFoodSearch');
    const { result } = renderHook(() => useFoodSearch());

    await act(async () => {
      while (result.current.loading) await new Promise((r) => setTimeout(r, 10));
    });

    const searchResult = result.current.search('Arroz');
    expect(searchResult).toHaveLength(2);
  });

  it('should return exact match by barcode', async () => {
    mockFoodDB.foodDB.items = [
      { id: '7501055300014', name: 'Galletas Maria', category: 'snack', energyKcal: 450, proteinG: 6, carbsG: 70, fatG: 15, unit: '100g' },
    ];

    const { useFoodSearch } = await import('../src/hooks/useFoodSearch');
    const { result } = renderHook(() => useFoodSearch());

    await act(async () => {
      while (result.current.loading) await new Promise((r) => setTimeout(r, 10));
    });

    const searchResult = result.current.search('7501055300014');
    expect(searchResult).toHaveLength(1);
    expect(searchResult[0].id).toBe('7501055300014');
  });

  it('should show not found when no match', async () => {
    mockFoodDB.foodDB.items = [
      { id: '001', name: 'Manzana', category: 'fruit', energyKcal: 52, proteinG: 0.3, carbsG: 14, fatG: 0.2, unit: '100g' },
    ];

    const { useFoodSearch } = await import('../src/hooks/useFoodSearch');
    const { result } = renderHook(() => useFoodSearch());

    await act(async () => {
      while (result.current.loading) await new Promise((r) => setTimeout(r, 10));
    });

    const searchResult = result.current.search('pera');
    expect(searchResult).toHaveLength(0);
  });

  it('should handle loading state', async () => {
    const p = new Promise<FoodItem[]>((resolve) => {
      setTimeout(() => {
        resolve([
          { id: '001', name: 'Manzana', category: 'fruit', energyKcal: 52, proteinG: 0.3, carbsG: 14, fatG: 0.2, unit: '100g' },
        ]);
      }, 30);
    });
    mockFoodDB.foodDB.items = p as unknown as FoodItem[];

    const { useFoodSearch } = await import('../src/hooks/useFoodSearch');
    const { result } = renderHook(() => useFoodSearch());

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 40));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toHaveLength(1);
  });

  it('should handle error state when food-db fails to load', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onRejection = () => {};
    process.on('unhandledRejection', onRejection);

    mockFoodDB.foodDB.items = Promise.reject(new Error('Failed to load food data')) as unknown as FoodItem[];

    const { useFoodSearch } = await import('../src/hooks/useFoodSearch');
    const { result } = renderHook(() => useFoodSearch());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.data).toBeUndefined();

    process.removeListener('unhandledRejection', onRejection);
    spy.mockRestore();
  });

  it('should handle case-insensitivity in search', async () => {
    mockFoodDB.foodDB.items = [
      { id: '001', name: 'Manzana', category: 'fruit', energyKcal: 52, proteinG: 0.3, carbsG: 14, fatG: 0.2, unit: '100g' },
    ];

    const { useFoodSearch } = await import('../src/hooks/useFoodSearch');
    const { result } = renderHook(() => useFoodSearch());

    await act(async () => {
      while (result.current.loading) await new Promise((r) => setTimeout(r, 10));
    });

    const searchResult = result.current.search('MANZANA');
    expect(searchResult).toHaveLength(1);
  });

  it('should handle diacritics in search', async () => {
    mockFoodDB.foodDB.items = [
      { id: '002', name: 'Jalapeño', category: 'vegetable', energyKcal: 30, proteinG: 1.5, carbsG: 7, fatG: 0.2, unit: '100g' },
    ];

    const { useFoodSearch } = await import('../src/hooks/useFoodSearch');
    const { result } = renderHook(() => useFoodSearch());

    await act(async () => {
      while (result.current.loading) await new Promise((r) => setTimeout(r, 10));
    });

    const searchResult = result.current.search('jalapeno');
    expect(searchResult).toHaveLength(1);
    expect(searchResult[0].name).toBe('Jalapeño');
  });

  it('should filter by category when provided', async () => {
    mockFoodDB.foodDB.items = [
      { id: '001', name: 'Manzana', category: 'fruit', energyKcal: 52, proteinG: 0.3, carbsG: 14, fatG: 0.2, unit: '100g' },
      { id: '002', name: 'Pechuga de pollo', category: 'protein', energyKcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6, unit: '100g' },
      { id: '003', name: 'Frambuesa', category: 'fruit', energyKcal: 52, proteinG: 1.2, carbsG: 12, fatG: 0.7, unit: '100g' },
    ];

    const { useFoodSearch } = await import('../src/hooks/useFoodSearch');
    const { result } = renderHook(() => useFoodSearch());

    await act(async () => {
      while (result.current.loading) await new Promise((r) => setTimeout(r, 10));
    });

    // Search all items in fruit category (empty query = return all in category)
    const fruitResults = result.current.search('', 'fruit');
    expect(fruitResults).toHaveLength(2);

    // Search in protein category
    const proteinResults = result.current.search('', 'protein');
    expect(proteinResults).toHaveLength(1);
    expect(proteinResults[0].name).toBe('Pechuga de pollo');
  });

  it('should not treat invalid barcode format as barcode match', async () => {
    mockFoodDB.foodDB.items = [
      { id: 'invalid123', name: 'Some Food', category: 'snack', carbsG: 10, proteinG: 5, fatG: 5, energyKcal: 100, unit: '100g' },
    ];

    const { useFoodSearch } = await import('../src/hooks/useFoodSearch');
    const { result } = renderHook(() => useFoodSearch());

    await act(async () => {
      while (result.current.loading) await new Promise((r) => setTimeout(r, 10));
    });

    const searchResult = result.current.search('invalid123');
    expect(searchResult).toHaveLength(0);
  });
});

describe('convertToPer100g utility', () => {
  it('should return unchanged item when unit is 100g', () => {
    const item: FoodItem = { id: '001', name: 'Manzana', category: 'fruit', energyKcal: 52, proteinG: 0.3, carbsG: 14, fatG: 0.2, unit: '100g' };
    const converted = convertToPer100g(item);
    expect(converted).toEqual(item);
    expect(converted).not.toBe(item);
  });

  it('should convert nutrients per piece to per 100g when unitPer100G provided', () => {
    const item: FoodItem = { id: '011', name: 'Huevo (pieza)', category: 'protein', energyKcal: 78, proteinG: 6.5, carbsG: 0.6, fatG: 5.5, unit: 'piece', unitPer100G: 2 };
    const converted = convertToPer100g(item);
    expect(converted.unit).toBe('100g');
    expect(converted.unitPer100G).toBe(1);
    expect(converted.energyKcal).toBeCloseTo(78 * 2);
  });

  it('should handle unit per 100g with fractional unitPer100G', () => {
    const item: FoodItem = { id: '012', name: 'Rebanada de pan blanco', category: 'grain', energyKcal: 80, proteinG: 2.7, carbsG: 14.7, fatG: 1.0, unit: 'slice', unitPer100G: 3.33 };
    const converted = convertToPer100g(item);
    expect(converted.unit).toBe('100g');
    expect(converted.energyKcal).toBeCloseTo(80 * 3.33);
  });

  it('should return unchanged item when unitPer100G missing', () => {
    const item: FoodItem = { id: '002', name: 'Arroz blanco', category: 'grain', energyKcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3, unit: '100g' };
    const converted = convertToPer100g(item);
    expect(converted).toEqual(item);
    expect(converted).not.toBe(item);
  });
});
