# Result Card Specification

## Purpose

Defines the output surface (`ResultCard.tsx` + `ShareButton.tsx`): prominent target
calories, BMR/TDEE context, a macro table, visual breakdown bars, action buttons, and
screen-reader announcements on recalculation.

Source: `PRD.md` §4.4, §7.1; `openspec/changes/how-eat-mvp/proposal.md`
(Capabilities §4, Edge Cases).

## Requirements

### Requirement: Prominent target calories

The system MUST render `targetCalories` prominently (large, primary).

#### Scenario: Headline number

- GIVEN a computed `Result` with `targetCalories=2633`
- WHEN the card renders
- THEN `2633` kcal/día SHALL be the most visually prominent element

### Requirement: BMR and TDEE context

The system MUST render `bmr` and `tdee` as secondary informational text.

#### Scenario: Context line

- GIVEN `bmr=1699, tdee=2633`
- WHEN the card renders
- THEN both values SHALL be visible (e.g., "BMR: 1.699 | TDEE: 2.633")

### Requirement: Macro table

The system MUST render a table with rows for protein/carbs/fat and columns
Macro | Gramos | Calorías | %.

#### Scenario: Table contents

- GIVEN Estándar macros (protein 197g/788k/30%, carbs 263g/1052k/40%, fat 88g/792k/30%)
- WHEN the table renders
- THEN each row SHALL show macro name, grams, calories, and percent

### Requirement: Macro calories self-consistent (T3)

The table's per-macro `Calorías` MUST equal `grams * kcalPerGram` (4/4/9), matching the
engine output.

#### Scenario: Consistent calories

- GIVEN protein `grams=197`
- WHEN the table renders
- THEN `Calorías` SHALL show `788`

### Requirement: Visual breakdown bars

The system MUST render three horizontal progress bars (protein/carbs/fat) whose fill
width is proportional to the macro percentage.

#### Scenario: Bar widths

- GIVEN `protein=30%, carbs=40%, fat=30%`
- WHEN bars render
- THEN their filled widths SHALL be 30%, 40%, 30% of the track respectively

### Requirement: Action buttons

The system MUST provide a "Copiar enlace" button and a "Resetear formulario" button.

#### Scenario: Buttons present

- GIVEN a rendered result card
- WHEN inspected
- THEN both buttons SHALL be present and labeled in Spanish

### Requirement: aria-live announcements

The result region MUST use an `aria-live` (polite) container so screen readers announce
recalculation when inputs/macros change.

#### Scenario: Recalculation announced

- GIVEN the result region is `aria-live="polite"`
- WHEN the `Result` changes
- THEN assistive tech SHALL announce the updated target calories

### Requirement: formulaUsed surfaced

The system MUST surface which BMR formula was applied (so athletes see Katch-McArdle when
used).

#### Scenario: Formula label

- GIVEN `formulaUsed='katch-mcardle'`
- WHEN the card renders
- THEN a visible note SHALL indicate Katch-McArdle was used

### Requirement: Hidden until valid

The result card MUST remain hidden (or show a prompt) when inputs are invalid/empty and
MUST update reactively when the `Result` changes.

#### Scenario: No result yet

- GIVEN required inputs are empty
- WHEN the app renders
- THEN the result card SHALL not display a computed number

## Edge Cases (from proposal)

- Result updates on every valid input/macro change (memoized via `useCalculator`).
- Invalid/inconsistent state → result hidden or last-valid retained; share disabled.
- `aria-live` must not spam on every keystroke; announce on committed recalculation.

## Acceptance Criteria

- [ ] Target calories prominent; BMR/TDEE shown.
- [ ] Macro table columns correct and self-consistent (grams × factor).
- [ ] Three bars proportional to %.
- [ ] "Copiar enlace" + "Resetear formulario" present.
- [ ] `aria-live` announces recalculation.
- [ ] formulaUsed visible.

## Risks

- `aria-live` spam if bound to raw input; bind to committed `Result` changes.
