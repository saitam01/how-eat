# Macro Sliders Specification

## Purpose

Defines the interactive macro-distribution UI (`MacroSliders.tsx`): three linked sliders
(protein/carbs/fat) plus presets, governed by a single source of truth that always sums to
100%. It prevents any inconsistent split from being computed or shared.

Source: `PRD.md` §4.3, §8, §11; `openspec/changes/how-eat-mvp/proposal.md`
(Macro presets, Macro sum invariant, T1, T2, Edge Cases).

> **Note on presets:** The approved proposal removed the `Zone` preset (identical to
> `Estándar`). This spec therefore defines **four** presets: `Estándar`, `Alta Proteína`,
> `Keto`, `Personalizado`. This intentionally diverges from `PRD.md` §4.3's five-preset
> table; the proposal (governing doc for this change) wins.

## Presets (fixed % splits)

| Preset        | Protein | Carbs  | Fat    |
| ------------- | ------- | ------ | ------ |
| Estándar      | 30%     | 40%    | 30%    |
| Alta Proteína | 40%     | 30%    | 30%    |
| Keto          | 20%     | 5%     | 75%    |
| Personalizado | slider  | slider | slider |

## Requirements

### Requirement: Three linked sliders

The system MUST provide three sliders for protein, carbs, and fat percentages.

#### Scenario: Sliders render

- GIVEN the macro panel is visible
- WHEN rendered
- THEN three sliders SHALL be present, one per macro

### Requirement: Sum invariant (always 100%)

The three macro percentages MUST always sum to exactly 100% for the result to be valid
and shareable. The UI state MUST never persist a triple that sums to ≠100%.

#### Scenario: Any committed state sums to 100

- GIVEN any user interaction that commits a macro split
- WHEN the state settles
- THEN `proteinPct + carbsPct + fatPct` SHALL equal `100`

### Requirement: Proportional linked redistribution (T2)

When the user moves one slider to value `v`, the system MUST set the other two so their
sum equals `100 - v` and their ratio preserves the _current_ ratio between them as closely
as possible:

```
remaining = 100 - v
if (Y + Z) > 0:  Y' = remaining * Y/(Y+Z);  Z' = remaining * Z/(Y+Z)
else:            Y' = Z' = remaining / 2
```

After computing the float split, the implementation MUST normalize to integers that sum
exactly to `100 - v` (e.g., largest-remainder rounding), keeping the moved slider fixed at
`v`.

#### Scenario: Move protein to 50

- GIVEN current split `protein=30, carbs=40, fat=30` and the user sets `protein=50`
- WHEN redistribution applies
- THEN `carbs + fat` SHALL equal `50`
- AND the `carbs:fat` ratio SHALL remain `40:30` (≈ `28.57:21.43` → normalized to integers summing 50)

#### Scenario: Move when others are equal

- GIVEN `protein=30, carbs=35, fat=35` and the user sets `protein=40`
- WHEN redistribution applies
- THEN `carbs + fat = 60` split equally as `30:30`

### Requirement: Presets

The system MUST provide the four presets above; selecting one applies its fixed split.

#### Scenario: Select Keto

- GIVEN the preset control
- WHEN the user selects `Keto`
- THEN the split SHALL become `protein=20, carbs=5, fat=75`

### Requirement: Default preset is Estándar (T1/Q1)

On first load / empty state the system MUST activate the `Estándar` (30/40/30) preset.

#### Scenario: Fresh state

- GIVEN no persisted macros and no URL params
- WHEN the macro panel mounts
- THEN the active split SHALL be `30/40/30` (Estándar)

### Requirement: Preset switch overwrites custom split

Applying a preset MUST instantly overwrite the current custom split and re-validate to
100%.

#### Scenario: Switch to Alta Proteína mid-edit

- GIVEN a custom split `35/35/30`
- WHEN the user selects `Alta Proteína`
- THEN the split SHALL become `40/30/30` immediately
- AND the sum SHALL be `100` (share re-enabled)

### Requirement: Visual sum badge

The system MUST show a sum badge: green when the live sum equals 100%, red when it does
not.

#### Scenario: Inconsistent badge

- GIVEN a transient split summing to `97`
- WHEN rendered
- THEN a red badge reading `"Suma 97%"` SHALL be shown

### Requirement: Inconsistent split disables sharing

When the live sum ≠ 100% (only possible transiently in `Personalizado`), the system MUST
disable the share action until corrected.

#### Scenario: Share disabled on mismatch

- GIVEN a live sum of `97%`
- WHEN the share button is evaluated
- THEN it SHALL be disabled

### Requirement: Single source of truth (PRD §11)

The sliders MUST derive from one state object (not three independent slider states) so
desync is impossible.

#### Scenario: No desync

- GIVEN the three sliders bound to one derived state
- WHEN one changes
- THEN the other two update from the same source; no independent stale state exists

## Edge Cases (from proposal)

- **Slider desync risk** → prevented by single source of truth.
- **Sum ≠ 100% transiently** → red badge + disabled share; never compute/share inconsistent.
- **Preset switch mid-edit** → instantly overwrites custom split, re-validates to 100%.

## TDD / State-transition tests

| Start                    | Action          | Expected end state                        |
| ------------------------ | --------------- | ----------------------------------------- |
| 30/40/30                 | set protein=50  | 50 / ~29 / ~21 (sum 100, ratio preserved) |
| 40/30/30 (Alta Proteína) | select Keto     | 20/5/75                                   |
| 35/35/30                 | select Estándar | 30/40/30                                  |
| fresh                    | mount           | 30/40/30 (default)                        |

## Acceptance Criteria

- [ ] Sliders always sum to exactly 100 after any commit.
- [ ] Redistribution is proportional and preserves the other-two ratio.
- [ ] Default preset is Estándar; presets apply instantly.
- [ ] Red badge + disabled share when sum ≠ 100.
- [ ] No independent slider state (single source of truth).

## Risks

- Integer rounding of the proportional split may need largest-remainder normalization to
  hit exactly 100 (design-phase algorithm detail; the invariant is enforced here).
