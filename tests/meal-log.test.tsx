import { render, screen, fireEvent } from '@testing-library/react';
import { MealLog } from '../src/components/MealLog';
import type { MealEntry, MacroGoal } from '../src/lib/types';

const goal: MacroGoal = {
  energyTargetKcal: 2000,
  proteinPct: 20,
  carbsPct: 50,
  fatPct: 30,
};

const mockEntries: MealEntry[] = [
  {
    id: '1',
    foodId: '001',
    amount: 2,
    energyKcal: 104,
    proteinG: 0.6,
    carbsG: 28,
    fatG: 0.4,
    timestamp: Date.now(),
  },
  {
    id: '2',
    foodId: '004',
    amount: 1,
    energyKcal: 165,
    proteinG: 31,
    carbsG: 0,
    fatG: 3.6,
    timestamp: Date.now(),
  },
];

const mockTotals = {
  energyKcal: 269,
  proteinG: 31.6,
  carbsG: 28,
  fatG: 4,
};

const mockProgress = {
  energy: 13.45,
  protein: 63.2,
  carbs: 28,
  fat: 18,
};

describe('MealLog', () => {
  const defaultProps = {
    entries: mockEntries,
    totals: mockTotals,
    progress: mockProgress,
    goal,
    onRemove: vi.fn(),
    onClear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders list of meal entries', () => {
    render(<MealLog {...defaultProps} />);

    // Component shows foodId when food not found in DB
    expect(screen.getByText('001')).toBeInTheDocument();
    expect(screen.getByText('004')).toBeInTheDocument();
  });

  it('renders entry amounts and nutrients', () => {
    render(<MealLog {...defaultProps} />);

    // Entry shows "2 — 104 kcal, 0.6g prot, 28g carb, 0.4g grasa"
    expect(screen.getByText(/2 — 104 kcal/)).toBeInTheDocument();
    // Second entry shows "1 — 165 kcal, 31g prot, 0g carb, 3.6g grasa"
    expect(screen.getByText(/1 — 165 kcal/)).toBeInTheDocument();
  });

  it('calls onRemove with entry id when delete button is clicked', () => {
    render(<MealLog {...defaultProps} />);

    const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
    fireEvent.click(deleteButtons[0]);

    expect(defaultProps.onRemove).toHaveBeenCalledWith('1');
  });

  it('calls onClear when clear button is clicked', () => {
    render(<MealLog {...defaultProps} />);

    const clearButton = screen.getByRole('button', { name: /borrar todo/i });
    fireEvent.click(clearButton);

    expect(defaultProps.onClear).toHaveBeenCalledTimes(1);
  });

  it('shows progress bars with correct percentages', () => {
    render(<MealLog {...defaultProps} />);

    // Component uses Math.ceil for display, so 13.45 -> "14%", 63.2 -> "64%", etc.
    expect(screen.getByText('14%')).toBeInTheDocument();
    expect(screen.getByText('64%')).toBeInTheDocument();
    expect(screen.getByText('28%')).toBeInTheDocument();
    expect(screen.getByText('18%')).toBeInTheDocument();
  });

  it('shows empty state when no entries', () => {
    render(
      <MealLog
        {...defaultProps}
        entries={[]}
        totals={{ energyKcal: 0, proteinG: 0, carbsG: 0, fatG: 0 }}
        progress={{ energy: 0, protein: 0, carbs: 0, fat: 0 }}
      />,
    );

    expect(screen.getByText(/no hay alimentos/i)).toBeInTheDocument();
  });

  it('renders daily totals summary', () => {
    render(<MealLog {...defaultProps} />);

    expect(screen.getByText(/269/)).toBeInTheDocument();
    expect(screen.getByText(/31\.6/)).toBeInTheDocument();
  });
});
