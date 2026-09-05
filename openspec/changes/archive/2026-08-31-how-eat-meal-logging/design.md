# Design: how-eat-meal-logging

> **Change ID:** `how-eat-meal-logging`
> **Status:** populated (design phase, interactive review‑ready, 2026-09-16)
> **Source of truth:** `PRD.md` (v1.0) + `proposal.md` (approved) + `specs/*/spec.md`
> **Scope:** extension of the existing how‑eat SPA with offline food search and meal diary.
> **Decisions resolved:** static food dataset location, default unit, progress visualization, persistence key, API shape.

---

## 1. Decision Summary

| Ref | Decision                                                                                                                                                          | Resolves                     | Source   |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | -------- |
| F1  | Food dataset: static JSON bundle (`src/lib/food-db.ts`) with ≤ 500 entries, nutrients per 100 g.                                                                  | Proposal Q1 (offline static) | proposal |
| F2  | Default portion unit: 100 g for all foods; UI shows amount in that unit (editable).                                                                               | Proposal Q2                  | proposal |
| F3  | Progress visualization: horizontal progress bars for energy and each macro, showing % of goal (clamped at 150 %).                                                 | Proposal Q3                  | proposal |
| F4  | Persistence key for meals: `how-eat-meals:v1` (versioned, independent of `how-eat:v1`).                                                                           | proposal (persistence)       | proposal |
| F5  | Hooks: `useFoodSearch.ts` (returns loading, results, error) and `useMealLog.ts` (add/remove/clear entries, returns totals, goal progress).                        | spec                         | spec     |
| F6  | Components: `FoodSearch.tsx` (input + list), `MealLog.tsx` (list of entries with delete, total bars, clear button), `FoodItemCard.tsx` (used inside search list). | spec                         | spec     |
| F7  | Types: as defined in specs (`FoodItem`, `MealEntry`, `DailyTotals`, `MacroGoal`).                                                                                 | spec                         | spec     |
| F8  | Unit conversion logic: if `unit` ≠ '100g' and `unitPer100G` present, convert amount to 100 g basis before calculating nutrients.                                  | spec                         | spec     |
| F9  | Error handling: toast messages for search failures, storage failures, invalid input.                                                                              | spec                         | spec     |
| F10 | Loading state: spinner while searching, skeleton list for results.                                                                                                | spec                         | spec     |

---

## 2. Architecture Overview & Data Flow

The meal logging feature lives alongside the existing calculator state. It introduces its own slice of state (meal diary) but reads the current macro goals from the calculator to compute progress.

```
                               ┌─────────────────────────────┐
                               │   Food DB (static JSON)     │
                               └───────────────┬─────────────┘
                                               ▼
               ┌─────────────────────────────────────────────┐
               │   useFoodSearch hook                        │
               │  - query → filter food-db                  │
               │  - returns {results, loading, error}       │
               └───────────────┬─────────────────────────────┘
                               ▼
                     ┌─────────────────────┐
                     │ FoodSearch.tsx      │
                     │ (input + list)      │
                     └───────┬─────────────┘
                             ▼ (onSelect)
                 ┌─────────────────────┐
                 │ useMealLog hook     │
                 │ - addEntry(foodId, amount) │
                 │ - removeEntry(id)        │
                 │ - clear()                │
                 │ - getTotals()            │
                 │ - subscribe to calculator goals │
                 └───────┬─────────────────┘
                         ▼
               ┌─────────────────────────────┐
               │ MealLog.tsx                 │
               │ - list of entries (with delete)│
               │ - DailyTotals + MacroGoal → progress bars │
               │ - Clear button              │
               └─────────────────────────────┘
                         ▼
               ┌─────────────────────────────┐
               │ localStorage key:          │
               │ how-eat-meals:v1 ←→ diary │
               └─────────────────────────────┘
```

**Write‑back rules**

- Meal diary is saved to `localStorage` whenever it changes (debounced 300 ms via `useMealLog`).
- Reading from `localStorage` happens on hook initialization; failures fall back to in‑memory state.
- No writes to `localStorage` occur during rapid typing; only after user commits an addition or deletion.

**Dependencies**

- Reads `MacroGoal` from existing `useCalculator` (or we can compute goals from inputs+macros directly). For simplicity, `useMealLog` will accept `goal` as a parameter or read from a shared context; we can expose a selector from `useCalculator`.
- The food dataset is imported as a static JSON module (`src/lib/food-db.ts`) and kept small.

---

## 3. Component Tree (incremental)

```
App.tsx (unchanged)
 └─ … existing panels …
     └─ RightPanel (sticky)
         ├─ ResultCard (existing)
         ├─ MealLog.tsx          ← new
         │    ├─ MealEntryItem ×n (each with delete button)
         │    ├─ ProgressBars (energy, protein, carbs, fat)
         │    └─ Button “Borrar todo”
         └─ FoodSearch.tsx       ← new (could be in a modal or collapsed panel)
```

_Alternatively, the food search could be placed in a modal triggered by a “Buscar alimentos” button inside MealLog._

---

## 4. State Model

### MealLog state (managed by `useMealLog`)

```typescript
interface MealLogState {
  entries: MealEntry[]; // array of meals added today
}
```

Derived values (computed inside hook or selectors):

- `totals: DailyTotals` = sum of entries.
- `progress: { energy: number; protein: number; carbs: number; fat: number }` = (totals / goal) * 100, capped at 150.
- `shareDisabled` etc. remain unchanged (share URL does not include meal data for v2; could be added later).

### Food search state (managed by `useFoodSearch`)

```typescript
interface SearchState {
  query: string;
  results: FoodItem[];
  loading: boolean;
  error: string | null;
}
```

---

## 5. API & Utilities

### src/lib/food-db.ts

```typescript
export const foodDatabase: FoodItem[] = [...]; // ≤ 500 items
```

Generated from a trusted source (e.g., OpenFoodFacts subset) and bundled via Vite (asset import).

### src/hooks/useFoodSearch.ts

```typescript
function useFoodSearch() {
  const [state, setState] = useState<SearchState>({
    query: '',
    results: [],
    loading: false,
    error: null,
  });
  const search = useCallback(
    (term: string) => {
      // filter foodDatabase by name (case‑insensitive, diacritic‑insensitive) and/or barcode
    },
    [foodDatabase],
  );
  return { ...state, search };
}
```

### src/hooks/useMealLog.ts

```typescript
function useMealLog(goal: MacroGoal) {
  const [entries, setEntries] = useState<MealEntry[]>(() => loadFromStorage() ?? []);
  const totals = useMemo(() => computeTotals(entries), [entries]);
  const progress = useMemo(() => computeProgress(totals, goal), [totals, goal]);
  // add, remove, clear functions that update setEntries and persist to localStorage (debounced)
  return { entries, totals, progress, addEntry, removeEntry, clear };
}
```

Persistence helpers reuse `src/lib/storage.ts` logic but with a different key.

---

## 6. Localization & Accessibility

- All strings are in `src/i18n/es.json` (already existing). New keys added for food search UI, meal logging UI, placeholders, tooltips, toasts.
- ARIA labels on inputs, buttons, list items.
- Progress bars use `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.
- Ensure contrast ratio ≥ 4.5:1 for progress bar fill.

---

## 7. Performance & Bundle Considerations

- Food database is a static JSON imported as a raw asset; Vite will treat it as a string or JSON module. Keep size ≤ ~50 KB to avoid noticeable bundle impact.
- If needed, split into chunks via dynamic import (`()` => import(`./food-db-${lang}.json`)) but not required for v2.
- All new components are small; reuse existing shadcn/ui primitives.

---

## 8. Open Items / Risks (to be tracked)

| ID  | Description                                                   | Mitigation                                                                                    |
| --- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| R1  | Food database may need updates (new products).                | Provide a script to regenerate JSON from CSV source; version the dataset.                     |
| R2  | Users may want to log meals with custom units (e.g., “taza”). | Allow unit conversion via `unitPer100G`; expand database with common units.                   |
| R3  | Long‑term diary growth.                                       | Implement optional auto‑purge after 30 days or manual export/clear.                           |
| R4  | Barcode entry without camera is tedious.                      | Consider future addition of camera scanner via `navigator.mediaDevices` when HTTPS available. |
| R5  | Goal changes mid‑day should reflect instantly.                | Hook subscribes to goal updates via context or prop.                                          |

---

## 9. Acceptance / Review Checklist

- [ ] Food search returns correct results by name and barcode.
- [ ] Meal entry addition respects unit conversion and default 100 g.
- [ ] Daily totals and progress bars are accurate.
- [ ] Meal diary persists across reloads and survives `localStorage` failures.
- [ ] UI is accessible (WCAG 2.1 AA) and uses existing design tokens.
- [ ] Bundle size increase due to food database stays within agreed limit (e.g., < + 60 KB gzipped).
- [ ] Unit tests for hooks achieve ≥ 90 % coverage.

---
