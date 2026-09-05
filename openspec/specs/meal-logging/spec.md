# Meal Logging Specification

## Purpose

Defines the meal logging capability (`MealLog.tsx`) that lets users add searched foods to a daily diary, select portion sizes, and view accumulated totals of energy and macronutrients compared to their personal TDEE and macro goals. The diary persists in `localStorage` (versioned) and is restored on reload.

Source: PRD §2 (out‑of‑scope v1), proposal decisions (default unit 100 g, progress shown as progress bars).

## Types

```typescript
type FoodId = string;
type MealId = string; // UUID or timestamp-based

interface MealEntry {
  id: MealId;
  foodId: FoodId;
  // Amount in the unit defined by the food item (default 100 g)
  amount: number; // e.g., number of units; if unit is '100g', amount=1 means 100 g
  // Derived nutrients for this entry (computed from food item and amount)
  energyKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  timestamp: number; // epoch ms when added
}

interface DailyTotals {
  energyKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

/** Goal information coming from the existing calculator */
interface MacroGoal {
  energyTargetKcal: number; // TDEE adjusted by goal
  proteinPct: number; // % of energy from protein (0‑100)
  carbsPct: number; // % of energy from carbs
  fatPct: number; // % of energy from fat
}
```

## Requirements

### Requirement: Add food to diary

The system MUST allow the user to select a food from search results, choose an amount (default 1 unit), and add it to the diary for the current day.

#### Scenario: Adding a standard portion

- GIVEN a food item with `unit: '100g'`, `energyKcal: 100`, `proteinG: 10`, `carbsG: 10`, `fatG: 3`
- WHEN the user adds it with amount `1` (i.e., 100 g)
- THEN a new MealEntry SHALL be created with the same nutrient values.

#### Scenario: Adding a custom amount

- GIVEN the same food item
- WHEN the user adds it with amount `2.5` (i.e., 250 g)
- THEN the entry’s nutrients SHALL be scaled by 2.5 (energy 250 kcal, protein 25 g, etc.).

### Requirement: Portion unit handling

If a food item defines a non‑standard `unit` (e.g., 'piece') and `unitPer100G`, the amount entered SHALL be interpreted in that unit, and nutrients SHALL be converted accordingly.

#### Scenario: Unit conversion

- GIVEN a food item with `unit: 'slice'`, `unitPer100G: 4` (4 slices = 100 g), per slice: `energyKcal: 30`
- WHEN the user adds `2` slices
- THEN the system SHALL compute 200 g equivalent → energy 60 kcal (since 30 kcal per slice × 2 = 60 kcal) and show the entry as 2 slices.

### Requirement: Daily totals and goal comparison

The system MUST compute accumulated totals for the current day (sum of all MealEntry nutrients) and display them alongside the user’s macro goals (from the calculator). The UI SHALL show progress bars for energy and each macro, indicating percentage of goal reached.

#### Scenario: Within goal

- GIVEN daily totals: energy 1800 kcal, protein 90 g, carbs 225 g, fat 50 g
- GIVEN goals: energyTargetKcal 2000, proteinPct 20, carbsPct 50, fatPct 30
- THEN progress bars SHALL show: energy 90 %, protein (90g*4=360 kcal → 18 % of 2000), carbs (225g*4=900 kcal → 45 %), fat (50g*9=450 kcal → 22 %).

#### Scenario: Exceeding goal

- GIVEN totals exceed a goal
- THEN the corresponding progress bar SHALL exceed 100 % (clamped at maybe 150 % for visual cue) and turn amber/red.

### Requirement: Persistence

The system MUST save the diary (array of MealEntry) to `localStorage` under a versioned key (e.g., `how-eat-meals:v1`) whenever the diary changes, and load it on app start.

#### Scenario: Reload restores diary

- GIVEN the user has added two foods today
- WHEN the page is refreshed
- THEN the same entries SHALL appear and totals SHALL be correct.

#### Scenario: Storage failure

- GIVEN `localStorage` is unavailable (quota exceeded or blocked)
- WHEN attempting to save
- THEN the system SHALL catch the error, keep an in‑memory diary, and continue operating (persistence silently no‑ops).

### Requirement: Deleting entries

The system MUST allow the user to remove a specific MealEntry from the diary, updating totals accordingly.

#### Scenario: Delete entry

- GIVEN a diary with two entries totalling 500 kcal
- WHEN the user deletes the 200 kcal entry
- THEN the diary SHALL contain only the remaining entry and totals SHALL be 300 kcal.

### Requirement: Clearing the diary

The system MUST provide a way to reset the diary for the day (e.g., “Borrar todo”).

#### Scenario: Clear all

- GIVEN a non‑empty diary
- WHEN the user clears the diary
- THEN the diary SHALL be empty and totals SHALL be zero.

## Edge Cases (from proposal)

- **Invalid amount**: zero or negative amounts SHALL be rejected; show error and prevent addition.
- **Large numbers**: extremely large amounts (e.g., 10000 units) SHALL be allowed but may trigger a warning if resulting calories exceed a sane threshold (optional).
- **Nutrient overflow**: totals SHALL be stored as numbers; no special handling needed.
- **Changing goals**: if the user modifies their TDEE/macro goal via the calculator, the diary totals SHALL be recomputed and compared instantly (reactive).

## TDD / Test Vectors

Unit tests in `tests/meal-logging.test.ts` MUST cover:

- Adding food with default and custom amounts computes correct nutrients.
- Unit conversion works for non‑standard units.
- Daily totals accumulation and goal comparison (progress percentages).
- Persistence: save to and load from `localStorage`; handle failure gracefully.
- Deleting and clearing entries update totals.
- Reactive update when macro goals change.

Coverage target: **90 %** for `src/hooks/useMealLog.ts` and any utils (e.g., `src/lib/meal-utils.ts`).

## Acceptance Criteria

- [ ] Users can add foods from search with correct portion handling.
- [ ] Daily totals are accurate and reflect goal progress via progress bars.
- [ ] Diary persists across reloads and survives `localStorage` failures.
- [ ] Users can delete entries and clear the diary.
- [ ] UI updates instantly when calculator goals change.

## Risks

- **Diary growth**: unlimited entries could bloat `localStorage`; mitigate by optionally limiting to last 30 days or providing a manual export/clear.
- **Nutrient calculations**: ensure floating‑point rounding does not cause noticeable drift; use rounding to grams or kcal as appropriate.
- **UI clutter**: balance between showing detailed entries and summary; consider collapsible list or pagination if needed.

---
