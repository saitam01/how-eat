import { useCallback, useEffect, useState } from 'react';
import { foodDB } from '../lib/food-db';
import type { FoodItem, FoodCategory } from '../lib/types';

const removeDiacritics = (str: string): string =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const isValidBarcode = (str: string): boolean => {
  const trimmed = str.trim();
  return /^\d{12}$/.test(trimmed) || /^\d{13}$/.test(trimmed);
};

export function useFoodSearch() {
  const [data, setData] = useState<FoodItem[] | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        if (foodDB.items instanceof Promise) {
          const resolved = await foodDB.items;
          if (isMounted) {
            setData(Array.isArray(resolved) ? resolved : await resolved);
            setLoading(false);
          }
        } else {
          if (isMounted) {
            setData(foodDB.items);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Hook caught error:', err);
        if (isMounted) {
          setError(err);
          setLoading(false);
          setData(undefined);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [foodDB]); // eslint-disable-line react-hooks/exhaustive-deps

  const search = useCallback(
    (query: string, category?: FoodCategory): FoodItem[] => {
      if (!data) return [];
      const trimmedQuery = query.trim();

      // Filter by category first
      let pool = data;
      if (category) {
        pool = data.filter((item) => item.category === category);
      }

      // Empty query with category filter → return all in category
      if (!trimmedQuery && category) return pool;

      // Empty query, no filter → return nothing (let user type or pick category)
      if (!trimmedQuery) return [];

      const normalizedQuery = removeDiacritics(trimmedQuery).toLowerCase();

      const itemsWithNormalizedName = pool.map((item) => ({
        item,
        normalizedName: removeDiacritics(item.name).toLowerCase(),
      }));

      // Name matches
      const nameExact = itemsWithNormalizedName
        .filter((i) => i.normalizedName === normalizedQuery)
        .map((i) => i.item);

      const nameStartsWith = itemsWithNormalizedName
        .filter(
          (i) =>
            i.normalizedName.startsWith(normalizedQuery) &&
            !nameExact.some((e) => e.id === i.item.id),
        )
        .map((i) => i.item);

      const nameIncludes = itemsWithNormalizedName
        .filter(
          (i) =>
            i.normalizedName.includes(normalizedQuery) &&
            !nameExact.some((e) => e.id === i.item.id) &&
            !nameStartsWith.some((s) => s.id === i.item.id),
        )
        .map((i) => i.item);

      // Barcode matches
      let barcodeExact: FoodItem[] = [];
      let barcodeStartsWith: FoodItem[] = [];
      let barcodeIncludes: FoodItem[] = [];

      if (isValidBarcode(trimmedQuery)) {
        barcodeExact = pool.filter((item) => item.id && item.id === trimmedQuery);
        barcodeStartsWith = pool.filter(
          (item) =>
            item.id &&
            item.id.startsWith(trimmedQuery) &&
            !barcodeExact.some((e) => e.id === item.id),
        );
        barcodeIncludes = pool.filter(
          (item) =>
            item.id &&
            item.id.includes(trimmedQuery) &&
            !barcodeExact.some((e) => e.id === item.id) &&
            !barcodeStartsWith.some((s) => s.id === item.id),
        );
      }

      return [
        ...nameExact,
        ...barcodeExact,
        ...nameStartsWith,
        ...barcodeStartsWith,
        ...nameIncludes,
        ...barcodeIncludes,
      ];
    },
    [data],
  );

  return { data, loading, error, search };
}
