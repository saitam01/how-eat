# Food Item Stepper Specification

## Purpose

Defines the stepper control on each food item card that lets the user adjust quantity (in 100g units) before adding to the meal log. Replaces the current "Seleccionar" button that adds 100g blindly.

Source: `proposal.md` (food-item-stepper capability).

## Requirements

### Requirement: Stepper controls

Each food item card MUST display a stepper with:
- A minus (`−`) button to decrease quantity
- A numeric display showing the current quantity
- A plus (`+`) button to increase quantity

#### Scenario: Stepper renders

- GIVEN a food item card
- WHEN rendered
- THEN a minus button, quantity display, and plus button SHALL be visible

### Requirement: Quantity range

The quantity MUST be bounded:
- Minimum: 0.5 (50g)
- Maximum: 10.0 (1000g)
- Step: 0.5 (50g increments)

#### Scenario: At minimum

- GIVEN quantity is 0.5
- WHEN the minus button is pressed
- THEN quantity SHALL remain 0.5 (button disabled or no-op)

#### Scenario: At maximum

- GIVEN quantity is 10.0
- WHEN the plus button is pressed
- THEN quantity SHALL remain 10.0 (button disabled or no-op)

### Requirement: Macro preview

The card MUST display the calculated macros for the selected quantity:
- Calories: `energyKcal × quantity`
- Protein: `proteinG × quantity`
- Carbs: `carbsG × quantity`
- Fat: `fatG × quantity`

Values MUST be rounded to 1 decimal.

#### Scenario: Quantity 1.5

- GIVEN a food with `energyKcal: 165, proteinG: 31` per 100g
- WHEN quantity is 1.5
- THEN calories SHALL show `247.5 kcal` and protein SHALL show `46.5 g`

### Requirement: Add button

The card MUST have an "Agregar" button that:
- Sends the food item + quantity to the parent callback
- Resets the quantity to 1.0 after adding
- Has a distinct visual style (primary action)

#### Scenario: Add food

- GIVEN a food with quantity 1.5
- WHEN "Agregar" is clicked
- THEN `onSelect(food, 1.5)` SHALL be called
- AND the quantity SHALL reset to 1.0

### Requirement: Visual design

The card MUST use shadcn/ui components:
- `Card` for the container
- `Button` for −, +, and Agregar
- Quantity display with monospace font for alignment

#### Scenario: shadcn/ui

- GIVEN a food item card
- WHEN source is inspected
- THEN it SHALL use shadcn/ui components, not DaisyUI

### Requirement: Unit label

The card MUST show the unit context:
- For 100g items: "por 100g" label
- For piece items: "por pieza" or unit name

#### Scenario: Unit label

- GIVEN a food with `unit: '100g'`
- WHEN the card renders
- THEN "por 100g" SHALL be visible near the quantity

### Requirement: Accessible stepper

The stepper MUST be keyboard accessible:
- Tab to navigate between −, quantity, +, and Agregar
- Enter/Space to activate buttons
- `aria-label` on each button describing the action

#### Scenario: Keyboard navigation

- GIVEN a food item card
- WHEN the user tabs through it
- THEN all controls SHALL be reachable and activatable via keyboard

---

## Edge Cases

- **Rapid +/- clicks** → state updates correctly, no race conditions
- **Quantity 0.5 → minus** → stays at 0.5, button may be visually disabled
- **Quantity 10.0 → plus** → stays at 10.0, button may be visually disabled
- **Add with default quantity** → 1.0 (100g) if user never touched stepper

## Acceptance Criteria

- [ ] Stepper renders with −, quantity, + buttons
- [ ] Quantity bounded 0.5–10.0, step 0.5
- [ ] Macros preview calculated correctly
- [ ] "Agregar" sends food + quantity, resets to 1.0
- [ ] shadcn/ui components used
- [ ] Unit label shown
- [ ] Keyboard accessible
- [ ] `tsc --noEmit` passes

## Risks

- Stepper may be too small on mobile — use touch-friendly button sizes (≥ 44px tap target).
