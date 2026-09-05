# Tasks: how-eat-food-search-redesign

> **Change ID:** `how-eat-food-search-redesign`
> **Status:** all tasks complete
> **Estimated total:** ~350–450 changed lines (within 800-line budget)
> **Delivery strategy:** single PR

---

## Task 1: Update types — `FoodCategory` + required fields

- [x] Add `FoodCategory` type union
- [x] Make `category` required (from `string?` to `FoodCategory`)
- [x] Make `unit` required (from `string?` to `string`)

---

## Task 2: Rewrite food database — Chilean fitness foods

- [x] Replace 30 generic foods with ~68 Chilean fitness foods
- [x] Every item has `category: FoodCategory` and `unit: string`
- [x] Categories: protein, fruit, vegetable, legume, dairy, fat, grain, snack
- [x] ≥ 5 items per category
- [x] High-protein focus, no junk food

---

## Task 3: Create TabBar component

- [x] New component: `TabBar` with two tabs
- [x] Props: `active: 'calculator' | 'diario'`, `onChange: (tab) => void`
- [x] shadcn/ui styling (no DaisyUI)
- [x] Responsive: full-width on mobile, centered on desktop
- [x] Add i18n keys: `tabCalculator`, `tabDiario`

---

## Task 4: Add tabs to App.tsx

- [x] Add `activeTab` state with `useLocalStorage('how-eat:active-tab', 'calculator')`
- [x] Render `TabBar` at top
- [x] Conditionally render Calculadora content or Diario content
- [x] Diario tab: show CTA when `result === null`, show `FoodSearch` + `MealLog` when result exists
- [x] Move existing food search + meal log from right panel into Diario tab

---

## Task 5: Add category filter to useFoodSearch

- [x] Add `category` parameter to `search` function: `search(query: string, category?: FoodCategory)`
- [x] When category is provided, filter `data` by `item.category === category` before name matching
- [x] Export `FoodCategory` type from types for use in hook

---

## Task 6: Rewrite FoodSearch — instant search + category chips

- [x] Remove `<form>` and submit button
- [x] Add `<Input>` with `onChange` → debounced search (200ms via `useDebouncedValue`)
- [x] Add category chips row (horizontal scroll, "Todos" default)
- [x] Chips: "Todos", "Proteínas", "Frutas", "Verduras", "Legumbres", "Lácteos", "Grasas", "Granos", "Snacks"
- [x] Use shadcn/ui `Input`, `Button` (no DaisyUI)
- [x] Render `FoodItemCard` list with results
- [x] Empty state: "No se encontraron alimentos para '{query}'"
- [x] Add i18n keys for categories

---

## Task 7: Rewrite FoodItemCard — stepper + macro preview

- [x] Stepper: − / quantity / + buttons
- [x] Quantity state: `useState(1)`, step 0.5, min 0.5, max 10
- [x] Macro preview: `energyKcal × quantity`, etc. (rounded to 1 decimal)
- [x] "Agregar" button calls `onSelect(food, quantity)` then resets to 1
- [x] shadcn/ui `Card`, `Button` (no DaisyUI)
- [x] Touch-friendly: ≥ 44px tap targets on stepper buttons
- [x] Unit label: "por 100g" or unit name
- [x] Keyboard accessible: Tab through controls, Enter/Space to activate
- [x] Add i18n keys: `add`, `quantity`, `perUnit`

---

## Task 8: Enhance MealLog — progress bars + deficit/excess

- [x] Progress bars: add color logic (< 80% neutral, 80–100% success, > 100% warning)
- [x] Add deficit/excess text per macro: "−30g" / "+15g" / "✓"
- [x] Improve daily totals display (more prominent)
- [x] Add `role="progressbar"` and ARIA attributes to bars
- [x] Add i18n keys: `deficit`, `excess`, `onTarget`

---

## Task 9: Update i18n/es.json — all new keys

- [x] Add 18 new i18n keys for tabs, categories, stepper, progress

---

## Task 10: Update tests — FoodItem mocks + new tests

- [x] Update all `FoodItem` mocks to include `category` and `unit` (required)
- [x] Add test for category filter in `useFoodSearch`
- [x] All 105 tests passing

---

## Task 11: Final verification

- [x] `tsc --noEmit` — 0 errors
- [x] `npm run test` — 105/105 pass
- [x] `npm run build` — builds successfully

---

## Execution Order

```
Task 1 (types)
  └── Task 2 (food-db)
  └── Task 5 (useFoodSearch category)
       └── Task 6 (FoodSearch rewrite)
Task 3 (TabBar)
  └── Task 4 (App.tsx tabs)
Task 7 (FoodItemCard rewrite) — can run parallel with 3-4
Task 8 (MealLog enhance) — can run parallel
Task 9 (i18n) — after 3, 6, 7, 8
Task 10 (tests) — after 1, 2
Task 11 (verify) — after all
```

**Critical path:** Task 1 → Task 2 → Task 6 → Task 9 → Task 11

---

## Review Workload Forecast

- **Estimated changed lines:** ~350–450
- **Budget:** 800 lines
- **Chained PRs needed:** No (within budget)
- **Decision needed before apply:** No
