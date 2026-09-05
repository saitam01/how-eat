# Design: how-eat-food-search-redesign

> **Change ID:** `how-eat-food-search-redesign`
> **Status:** populated (design phase, interactive review-ready, 2026-08-31)
> **Source of truth:** `proposal.md` (approved) + `specs/*/spec.md`
> **Scope:** Restructure app into tabs + redesign food search for Chilean fitness foods
> **Decisions resolved:** D1 (tab state), D2 (stepper algorithm), D3 (category chip design), D4 (progress bar colors)

---

## 1. Decision Summary

| Ref | Decision | Resolves | Source |
|-----|----------|----------|--------|
| **D1** | Tab state managed via `useState` + `localStorage` key `how-eat:active-tab`, NOT URL params | app-tabs spec | Proposal §1 |
| **D2** | Stepper uses `useState` local to each `FoodItemCard`, quantity is `number` (0.5 step), sent to parent on "Agregar" click | food-item-stepper spec | Proposal §4 |
| **D3** | Category chips use horizontal scrollable row with `Badge`-style buttons, active chip has `bg-primary text-primary-foreground` | food-search-ux spec | Proposal §3 |
| **D4** | Progress bar colors: `<80%` → `bg-emerald-400`, `80–100%` → `bg-emerald-500`, `>100%` → `bg-amber-500` (consistent with existing MealLog) | meal-log-progress spec | Proposal §5 |

---

## 2. Architecture Overview & Data Flow

The app splits into two tabs. The calculator state (`useCalculator`) is shared across both tabs. The meal log state (`useMealLog`) lives in the Diario tab but reads the calculator's result for progress calculation.

```
┌─────────────────────────────────────────────────────────────────┐
│  App (activeTab: 'calculator' | 'diario')                       │
│  ├── localStorage 'how-eat:active-tab'                          │
│  │                                                              │
│  ├── [Tab Bar] ── activeTab state ──────────────────────────┐   │
│  │                                                          │   │
│  ├── Tab: Calculadora (activeTab === 'calculator')          │   │
│  │   ├── CalculatorForm → inputs → useCalculator            │   │
│  │   ├── MacroSliders → macros → useCalculator              │   │
│  │   ├── ResultCard ← result (from useCalculator)           │   │
│  │   ├── ShareButton ← url (from useCalculator)             │   │
│  │   └── Disclaimer                                         │   │
│  │                                                          │   │
│  └── Tab: Diario (activeTab === 'diario')                   │   │
│      ├── [CTA if no result] ── result === null               │   │
│      └── [Meal view if result] ── result !== null            │   │
│          ├── progress ← result (MacroGoal)                   │   │
│          ├── MealLog ← entries, totals, progress, goal       │   │
│          └── FoodSearch                                      │   │
│              ├── [Category Chips] ← foodDB categories        │   │
│              ├── [Search Input] ← debounced query            │   │
│              └── [FoodItemCard list]                          │   │
│                  └── Stepper (+/-) → quantity state           │   │
│                      └── "Agregar" → mealLog.addEntry(id, q) │   │
└─────────────────────────────────────────────────────────────────┘
```

**State ownership:**

| State | Owner | Persisted | Scope |
|-------|-------|-----------|-------|
| `activeTab` | `App` | localStorage `how-eat:active-tab` | App-wide |
| `inputs`, `macros`, `preset` | `useCalculator` | localStorage `how-eat:v1` + URL | Calculator tab |
| `result` | `useCalculator` (derived) | No (memoized) | Both tabs |
| `entries` | `useMealLog` | localStorage `how-eat-meals:v1` | Diario tab |
| `query` | `FoodSearch` | No (local) | Diario tab |
| `activeCategory` | `FoodSearch` | No (local) | Diario tab |
| `quantity` | `FoodItemCard` | No (local, resets on add) | Per-card |

---

## 3. Component Design

### 3.1 Modified Components

#### `App.tsx`
- Add `activeTab` state with localStorage persistence
- Render tab bar at top
- Conditionally render Calculadora or Diario content
- Diario tab receives `result` from `useCalculator` to build `MacroGoal`

```tsx
// Pseudocode
const [activeTab, setActiveTab] = useLocalStorage<'calculator' | 'diario'>(
  'how-eat:active-tab',
  'calculator'
);

return (
  <main>
    <TabBar active={activeTab} onChange={setActiveTab} />
    {activeTab === 'calculator' && <CalculadoraTab calc={calc} url={url} />}
    {activeTab === 'diario' && <DiarioTab result={calc.result} goal={goal} />}
  </main>
);
```

#### `FoodSearch.tsx` — Full rewrite
- Remove `<form>` and submit button
- Add `<Input>` with `onChange` → debounced search (200ms)
- Add category chips row (horizontal scroll)
- Render filtered results as `FoodItemCard` list
- Use shadcn/ui `Input`, `Badge` (or styled buttons)

#### `FoodItemCard.tsx` — Full rewrite
- Add stepper: − / quantity / + buttons
- Add macro preview (calculated from quantity)
- Add "Agregar" button
- Use shadcn/ui `Card`, `Button`

#### `MealLog.tsx` — Enhancement
- Add prominent progress bars with colors
- Add deficit/excess indicators per macro
- Improve daily totals display

### 3.2 New Components

#### `TabBar.tsx`
- Simple tab bar with two tabs
- Props: `active`, `onChange`
- Responsive: full-width on mobile, centered on desktop

### 3.3 Unchanged Components
- `CalculatorForm.tsx` — no changes
- `MacroSliders.tsx` — no changes
- `ResultCard.tsx` — no changes
- `ShareButton.tsx` — no changes
- `Disclaimer.tsx` — no changes

---

## 4. Data Model Changes

### 4.1 `FoodItem` type update

```typescript
// Before
export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  category?: string;        // optional, loose
  energyKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  unit?: string;            // optional
  unitPer100G?: number;
}

// After
export type FoodCategory =
  | 'protein' | 'fruit' | 'vegetable' | 'legume'
  | 'dairy' | 'fat' | 'grain' | 'snack';

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  category: FoodCategory;   // required, typed
  energyKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  unit: string;             // required
  unitPer100G?: number;
}
```

### 4.2 New `useLocalStorage` key

```
how-eat:active-tab → 'calculator' | 'diario'
```

### 4.3 `useFoodSearch` — add category filter

The hook's `search` function gains a second parameter `category`:

```typescript
search(query: string, category?: FoodCategory): FoodItem[]
```

When `category` is provided, filter results to that category before name matching.

---

## 5. Styling Approach

### 5.1 Tab bar
- Use Tailwind utility classes
- Active tab: `bg-primary text-primary-foreground rounded-md px-4 py-2`
- Inactive tab: `text-muted-foreground hover:bg-accent rounded-md px-4 py-2`
- Container: `flex gap-2 p-1 bg-muted rounded-lg` (like shadcn Tabs)

### 5.2 Category chips
- Horizontal scrollable row: `flex gap-2 overflow-x-auto pb-2`
- Active chip: `bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm`
- Inactive chip: `bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm`

### 5.3 FoodItemCard
- shadcn `Card` with `p-4`
- Stepper: `flex items-center gap-2` with `Button variant="outline" size="icon"` for −/+
- Quantity: `w-12 text-center font-mono tabular-nums`
- Macro preview: `text-xs text-muted-foreground grid grid-cols-2 gap-1`
- Agregar button: `Button variant="default" className="w-full mt-2"`

### 5.4 Progress bars (MealLog)
- Existing `ProgressBar` component enhanced with color logic
- Add deficit/excess text: `text-xs tabular-nums`

---

## 6. File Change Map

| File | Action | Description |
|------|--------|-------------|
| `src/App.tsx` | Modify | Add tab bar, split into Calculadora/Diario tabs |
| `src/lib/types.ts` | Modify | Add `FoodCategory`, make `category`/`unit` required |
| `src/lib/food-db.ts` | Rewrite | ~60 Chilean fitness foods with categories |
| `src/components/FoodSearch.tsx` | Rewrite | Instant search + category chips + shadcn/ui |
| `src/components/FoodItemCard.tsx` | Rewrite | Stepper + macro preview + shadcn/ui |
| `src/components/MealLog.tsx` | Enhance | Better progress bars + deficit/excess |
| `src/components/TabBar.tsx` | New | Tab navigation component |
| `src/hooks/useFoodSearch.ts` | Modify | Add category parameter to search |
| `src/i18n/es.json` | Modify | Add new keys for tabs, categories, stepper |
| `tests/*.test.*` | Modify | Update mocks for `FoodCategory` required |

---

## 7. Testing Strategy

- **Unit tests:** update `food-search.test.ts` and `meal-logging.test.ts` for new `FoodItem` shape
- **Component tests:** add `FoodItemCard` stepper tests (quantity changes, add button)
- **No new test files** needed — existing files cover the modified components
- **Coverage targets remain:** 100% `calculations.ts`, 90% `storage.ts`, 90% `url.ts`

---

## 8. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| `FoodItem.category` breaking change | Update all mocks in tests; grep for `FoodItem` usage |
| Tab state sync with result | `useCalculator` is shared; result is always current |
| Stepper too small on mobile | Use `min-h-[44px] min-w-[44px]` touch targets |
| Category chips overflow on mobile | `overflow-x-auto` with hidden scrollbar |
| Bundle size increase from more food data | ~60 items × ~200 bytes = ~12KB raw, ~3KB gzipped — negligible |
