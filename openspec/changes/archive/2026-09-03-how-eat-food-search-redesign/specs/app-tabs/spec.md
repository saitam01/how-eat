# App Tabs Specification

## Purpose

Defines the two-tab navigation structure that splits the app into **Calculadora** (set your goal) and **Diario** (build your meals). Replaces the current single-page layout where everything is crammed together.

Source: `proposal.md` (app-tabs capability).

## Requirements

### Requirement: Two-tab layout

The system MUST provide exactly two tabs: "Calculadora" and "Diario".

#### Scenario: Tabs render

- GIVEN the app loads
- WHEN rendered
- THEN two tab controls SHALL be visible at the top of the page
- AND "Calculadora" SHALL be the first tab
- AND "Diario" SHALL be the second tab

### Requirement: Calculadora tab content

The "Calculadora" tab MUST contain the current calculator layout: `CalculatorForm`, `MacroSliders`, `ResultCard`, `ShareButton`, and `Disclaimer`.

#### Scenario: Calculadora tab shows calculator

- GIVEN the "Calculadora" tab is active
- WHEN rendered
- THEN the calculator form, macro sliders, result card, share button, and disclaimer SHALL be visible

### Requirement: Diario tab content

The "Diario" tab MUST contain `FoodSearch`, `MealLog`, and progress bars toward the calculated objective.

#### Scenario: Diario tab shows meal log

- GIVEN the "Diario" tab is active
- WHEN rendered
- THEN the food search, meal log, and progress bars SHALL be visible

### Requirement: Default tab is Calculadora

On first load, the "Calculadora" tab MUST be active by default.

#### Scenario: Fresh load

- GIVEN no persisted tab state
- WHEN the app loads
- THEN the "Calculadora" tab SHALL be active

### Requirement: Tab persistence

The active tab MUST be persisted in `localStorage` under key `how-eat:active-tab` and restored on reload.

#### Scenario: Reload on Diario tab

- GIVEN the user was on the "Diario" tab
- WHEN the app reloads
- THEN the "Diario" tab SHALL still be active

### Requirement: Diario requires objective

When no objective has been calculated (result is null), the "Diario" tab MUST show a call-to-action prompting the user to calculate their objective first, instead of the food search.

#### Scenario: No objective yet

- GIVEN no calculation has been performed (result is null)
- WHEN the "Diario" tab is activated
- THEN a CTA message SHALL be shown: "Calculá tu objetivo primero"
- AND the food search and meal log SHALL NOT be visible

#### Scenario: Objective exists

- GIVEN a valid calculation exists (result is not null)
- WHEN the "Diario" tab is activated
- THEN the food search, meal log, and progress bars SHALL be visible

### Requirement: Responsive tabs

The tabs MUST be responsive:
- On mobile (< 768px): tabs render as full-width buttons stacked or side-by-side
- On desktop (≥ 768px): tabs render as horizontal controls

#### Scenario: Mobile tabs

- GIVEN viewport width 375px
- WHEN tabs render
- THEN they SHALL be touch-friendly and clearly labeled

### Requirement: Visual distinction active/inactive

The active tab MUST have a clear visual distinction from the inactive tab (background, border, or underline).

#### Scenario: Active tab visible

- GIVEN the "Calculadora" tab is active
- WHEN rendered
- THEN it SHALL have a distinct visual style indicating it is selected

---

## Edge Cases

- **First visit, no objective** → Calculadora tab active, Diario shows CTA
- **localStorage corrupt** → fall back to Calculadora tab
- **Direct URL with tab param** → not supported in v1 (always starts on Calculadora)

## Acceptance Criteria

- [ ] Two tabs render: Calculadora and Diario
- [ ] Calculadora is default on fresh load
- [ ] Active tab persists across reloads
- [ ] Diario shows CTA when no objective exists
- [ ] Diario shows food search + meal log when objective exists
- [ ] Tabs are responsive and accessible
- [ ] `tsc --noEmit` passes

## Risks

- Tab state sync with calculator result — if user calculates on Calculadora then switches to Diario, the objective must be current. Mitigated by `useCalculator` hook being shared.
