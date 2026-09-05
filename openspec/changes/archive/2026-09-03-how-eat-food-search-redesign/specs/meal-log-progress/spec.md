# Meal Log Progress Specification

## Purpose

Defines the enhanced meal log display in the Diario tab: prominent progress bars showing consumed vs. target for calories and each macro, plus daily totals and deficit/excess indicators.

Source: `proposal.md` (meal-log-progress capability).

## Requirements

### Requirement: Progress bars for all macros

The meal log MUST display progress bars for:
- Energy (calories consumed vs. target)
- Protein (consumed vs. target)
- Carbs (consumed vs. target)
- Fat (consumed vs. target)

#### Scenario: Progress bars render

- GIVEN entries exist in the meal log
- WHEN the Diario tab renders
- THEN four progress bars SHALL be visible

### Requirement: Progress percentage calculation

Each progress percentage MUST be: `(consumed / target) × 100`, capped at 150% for display.

#### Scenario: 80% protein

- GIVEN target protein is 150g and consumed is 120g
- WHEN progress is calculated
- THEN protein progress SHALL be 80%

### Requirement: Progress bar colors

Progress bars MUST use color to indicate status:
- < 80%: neutral/default color (e.g., `emerald-400`)
- 80–100%: success color (e.g., `emerald-500`)
- \> 100%: warning/excess color (e.g., `amber-500`)

#### Scenario: Over target

- GIVEN energy progress is 120%
- WHEN the bar renders
- THEN it SHALL use the warning/amber color

### Requirement: Daily totals display

The meal log MUST show a summary of daily totals:
- Total energy consumed (kcal)
- Total protein (g)
- Total carbs (g)
- Total fat (g)

#### Scenario: Totals shown

- GIVEN 3 entries in the meal log
- WHEN the summary renders
- THEN totals SHALL be the sum of all entries

### Requirement: Deficit/excess indicator

For each macro, show the difference from target:
- Positive (over): "+Xg" in warning color
- Negative (under): "−Xg" in neutral color
- At target: "✓" in success color

#### Scenario: Under protein

- GIVEN target protein is 150g and consumed is 120g
- WHEN the indicator renders
- THEN it SHALL show "−30g" in neutral color

### Requirement: Empty state

When no entries exist, show a message: "No hay alimentos en el diario de hoy".

#### Scenario: Empty log

- GIVEN no entries
- WHEN the Diario tab renders
- THEN the empty state message SHALL be shown

### Requirement: Clear all entries

The "Borrar todo" button MUST clear all entries and reset progress to 0.

#### Scenario: Clear

- GIVEN entries exist
- WHEN "Borrar todo" is clicked
- THEN all entries SHALL be removed
- AND progress bars SHALL reset to 0%

### Requirement: Remove single entry

Each entry MUST have a remove button that removes only that entry.

#### Scenario: Remove one

- GIVEN 3 entries
- WHEN entry #2 is removed
- THEN entries #1 and #3 SHALL remain
- AND totals SHALL update accordingly

### Requirement: Accessible progress

Progress bars MUST use `role="progressbar"` with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`.

#### Scenario: Screen reader

- GIVEN a progress bar at 75%
- WHEN queried for ARIA attributes
- THEN `aria-valuenow` SHALL be `75`

---

## Edge Cases

- **No objective calculated** → progress bars show 0% or are hidden (CTA shown instead)
- **Exceeding 150%** → bar caps at 150% width but text shows actual percentage
- **Zero target** → avoid division by zero, show 0%

## Acceptance Criteria

- [ ] Four progress bars render (energy, protein, carbs, fat)
- [ ] Percentages calculated correctly
- [ ] Colors indicate status (< 80%, 80–100%, > 100%)
- [ ] Daily totals shown
- [ ] Deficit/excess indicators present
- [ ] Empty state message shown when no entries
- [ ] Clear all and remove single entry work
- [ ] ARIA attributes on progress bars
- [ ] `tsc --noEmit` passes

## Risks

- Progress bar animation may cause layout shift — use CSS transitions, not JS animation.
