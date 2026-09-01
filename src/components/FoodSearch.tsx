import { useState, useMemo, useCallback } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useFoodSearch } from '@/hooks/useFoodSearch';
import { FoodItemCard } from '@/components/FoodItemCard';
import type { FoodItem, FoodCategory } from '@/lib/types';
import { Input } from '@/components/ui/input';
import i18n from '@/i18n/es.json';

const CATEGORIES: { key: FoodCategory; label: string }[] = [
  { key: 'protein', label: i18n.categoryProtein },
  { key: 'fruit', label: i18n.categoryFruit },
  { key: 'vegetable', label: i18n.categoryVegetable },
  { key: 'legume', label: i18n.categoryLegume },
  { key: 'dairy', label: i18n.categoryDairy },
  { key: 'fat', label: i18n.categoryFat },
  { key: 'grain', label: i18n.categoryGrain },
  { key: 'snack', label: i18n.categorySnack },
];

interface FoodSearchProps {
  onSelect: (food: FoodItem, quantity: number) => void;
}

export function FoodSearch({ onSelect }: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FoodCategory | undefined>(undefined);
  const { data, loading, error, search } = useFoodSearch();

  const debouncedQuery = useDebouncedValue(query, 200);

  const results = useMemo(
    () => search(debouncedQuery, activeCategory),
    [search, debouncedQuery, activeCategory],
  );

  const handleCategoryToggle = useCallback(
    (cat: FoodCategory) => {
      setActiveCategory((prev) => (prev === cat ? undefined : cat));
    },
    [],
  );

  if (error) {
    return (
      <div role="alert" className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">
        {i18n.searchError}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search input */}
      <Input
        type="text"
        placeholder={i18n.searchPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label={i18n.searchPlaceholder}
      />

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          type="button"
          onClick={() => setActiveCategory(undefined)}
          className={
            activeCategory === undefined
              ? 'whitespace-nowrap rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground'
              : 'whitespace-nowrap rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80'
          }
        >
          {i18n.categoryAll}
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => handleCategoryToggle(cat.key)}
            className={
              activeCategory === cat.key
                ? 'whitespace-nowrap rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground'
                : 'whitespace-nowrap rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80'
            }
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" role="status">
            <span className="sr-only">{i18n.searchLoading}</span>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-2">
          {results.map((food) => (
            <FoodItemCard key={food.id} food={food} onSelect={onSelect} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && data && results.length === 0 && (query || activeCategory) && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          {i18n.searchNoResults}
          {query && ` para "${query}"`}
        </p>
      )}
    </div>
  );
}
