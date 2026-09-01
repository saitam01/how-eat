import { render, screen, fireEvent } from '@testing-library/react';
import type { FoodItem } from '../src/lib/types';

const mockSearch = vi.fn().mockReturnValue([]);

const mockFoods: FoodItem[] = [
  { id: '001', name: 'Manzana', category: 'fruit', energyKcal: 52, proteinG: 0.3, carbsG: 14, fatG: 0.2, unit: '100g' },
  { id: '002', name: 'Pechuga de pollo', category: 'protein', energyKcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6, unit: '100g' },
];

let mockState: { data: FoodItem[] | undefined; loading: boolean; error: unknown | null } = {
  data: [],
  loading: false,
  error: null,
};

vi.mock('../src/hooks/useFoodSearch', () => ({
  useFoodSearch: () => ({
    ...mockState,
    search: mockSearch,
  }),
}));

vi.mock('../src/hooks/useDebouncedValue', () => ({
  useDebouncedValue: (v: string) => v,
}));

import { FoodSearch } from '../src/components/FoodSearch';

describe('FoodSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearch.mockReturnValue([]);
    mockState = { data: [], loading: false, error: null };
  });

  it('renders search input', () => {
    render(<FoodSearch onSelect={() => {}} />);
    expect(screen.getByPlaceholderText(/buscar alimentos/i)).toBeInTheDocument();
  });

  it('renders category filter chips', () => {
    render(<FoodSearch onSelect={() => {}} />);
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Proteínas')).toBeInTheDocument();
    expect(screen.getByText('Frutas')).toBeInTheDocument();
  });

  it('shows empty state when query has no results', () => {
    mockSearch.mockReturnValue([]);
    mockState = { data: [], loading: false, error: null };
    render(<FoodSearch onSelect={() => {}} />);
    
    // Type a query that returns no results
    const input = screen.getByPlaceholderText(/buscar alimentos/i);
    fireEvent.change(input, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText(/no se encontraron alimentos/i)).toBeInTheDocument();
  });

  it('shows loading spinner while loading', () => {
    mockState = { data: undefined, loading: true, error: null };
    render(<FoodSearch onSelect={() => {}} />);
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('shows error message when search fails', () => {
    mockState = { data: undefined, loading: false, error: new Error('Database load failed') };
    render(<FoodSearch onSelect={() => {}} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/error al cargar la base de alimentos/i)).toBeInTheDocument();
  });

  it('renders food items from search results', () => {
    mockSearch.mockReturnValue(mockFoods);
    mockState = { data: mockFoods, loading: false, error: null };
    render(<FoodSearch onSelect={() => {}} />);

    // The component calls search with debouncedQuery and activeCategory
    // Since we mock useDebouncedValue to return the value directly,
    // and search returns the mocked results, the items should render
    expect(screen.getByText('Manzana')).toBeInTheDocument();
  });
});
