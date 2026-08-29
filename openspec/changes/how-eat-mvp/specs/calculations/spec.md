# Calculations Specification

## Purpose

Defines the pure, dependency-free math engine for `how-eat` (v1 MVP), located at
`src/lib/calculations.ts`. The engine computes BMR (Mifflin-St Jeor, or Katch-McArdle
when a valid body-fat % is supplied), TDEE (activity multiplier), goal-adjusted target
calories, and macro grams/calories from the target. It is the single source of truth for
all numeric results and MUST be exhaustively unit-tested (100% line/branch coverage per
PRD §9).

Source: `PRD.md` §4.2, §8, §9, §11; `openspec/changes/how-eat-mvp/proposal.md`
(Business Rules, Edge Cases, T3, T7).

## Types

```typescript
type Sex = 'male' | 'female';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'extra';
type Goal =
  'maintain' | 'lose_mild' | 'lose' | 'lose_aggressive' | 'gain_mild' | 'gain' | 'gain_aggressive';

interface Inputs {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  bodyFatPct?: number; // optional
  activity: ActivityLevel;
  goal: Goal;
}
interface Macros {
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
}
interface MacroResult {
  grams: number;
  calories: number;
  pct: number;
}
interface Result {
  bmr: number;
  tdee: number;
  targetCalories: number;
  macros: { protein: MacroResult; carbs: MacroResult; fat: MacroResult };
  formulaUsed: 'mifflin' | 'katch-mcardle';
}
```

## Requirements

### Requirement: BMR via Mifflin-St Jeor

The system MUST compute BMR using the Mifflin-St Jeor equation whenever `bodyFatPct` is
absent or invalid:

```
base = 10 * weightKg + 6.25 * heightCm - 5 * age
bmr  = (sex === 'male') ? base + 5 : base - 161
```

#### Scenario: Standard male, no body-fat

- GIVEN inputs `{sex:'male', age:30, heightCm:175, weightKg:75, activity:'moderate', goal:'maintain'}`
- WHEN `calculate()` is invoked with no `bodyFatPct`
- THEN `result.formulaUsed` SHALL equal `'mifflin'`
- AND `result.bmr` SHALL equal `1699` (raw `1698.75` → `Math.round`)

#### Scenario: Female offset applied

- GIVEN otherwise-identical inputs with `sex:'female'`
- WHEN `calculate()` is invoked
- THEN `result.bmr` SHALL equal `1533` (raw `1532.75` → `Math.round`)

### Requirement: BMR via Katch-McArdle

The system MUST compute BMR using Katch-McArdle when `bodyFatPct` is present, numeric,
and within the inclusive range 3–60:

```
lbm = weightKg * (1 - bodyFatPct / 100)
bmr = 370 + 21.6 * lbm
```

#### Scenario: Valid body-fat selects Katch-McArdle

- GIVEN inputs with `bodyFatPct: 22`, `sex:'female'`, `weightKg:60`
- WHEN `calculate()` is invoked
- THEN `result.formulaUsed` SHALL equal `'katch-mcardle'`
- AND `result.bmr` SHALL equal `1381` (LBM `46.8` → `1380.88` → `Math.round`)

### Requirement: Body-fat validity gate

The system MUST treat `bodyFatPct` as valid only when it is a finite `number` with
`3 <= bodyFatPct <= 60`. Any other value (missing, `null`, `undefined`, non-numeric,
`< 3`, `> 60`, `NaN`) MUST cause the engine to fall back to Mifflin-St Jeor and report
`formulaUsed: 'mifflin'`. (T7: PRD rule honored; user sees which method applied.)

#### Scenario: Body-fat below range falls back

- GIVEN inputs with `bodyFatPct: 2`
- WHEN `calculate()` is invoked
- THEN `result.formulaUsed` SHALL equal `'mifflin'`

#### Scenario: Non-numeric body-fat falls back

- GIVEN inputs with `bodyFatPct: NaN`
- WHEN `calculate()` is invoked
- THEN `result.formulaUsed` SHALL equal `'mifflin'`

### Requirement: TDEE from activity multiplier

The system MUST compute TDEE as `Math.round(rawBmr * ACTIVITY_MULTIPLIERS[activity])`
using the fixed multipliers:

| activity  | multiplier |
| --------- | ---------- |
| sedentary | 1.2        |
| light     | 1.375      |
| moderate  | 1.55       |
| very      | 1.725      |
| extra     | 1.9        |

#### Scenario: Moderate activity

- GIVEN `rawBmr = 1698.75` and `activity:'moderate'`
- WHEN TDEE is computed
- THEN `result.tdee` SHALL equal `2633` (`1698.75 * 1.55 = 2633.0625` → `Math.round`)

### Requirement: Goal-adjusted target calories

The system MUST compute
`targetCalories = Math.round(tdee * (1 + GOAL_ADJUSTMENTS[goal]))` where adjustments are:

| goal            | adjustment |
| --------------- | ---------- |
| maintain        | 0%         |
| lose_mild       | -10%       |
| lose            | -15%       |
| lose_aggressive | -20%       |
| gain_mild       | +10%       |
| gain            | +15%       |
| gain_aggressive | +20%       |

#### Scenario: Maintain keeps TDEE

- GIVEN `tdee = 2633` and `goal:'maintain'`
- WHEN target calories are computed
- THEN `result.targetCalories` SHALL equal `2633`

#### Scenario: Lose applies -15%

- GIVEN `tdee = 1899` and `goal:'lose'`
- WHEN target calories are computed
- THEN `result.targetCalories` SHALL equal `1614` (`1899 * 0.85 = 1614.15` → `Math.round`)

### Requirement: Macro grams conversion (4/4/9)

For each macro the system MUST compute
`grams = Math.round(targetCalories * (pct / 100) / kcalPerGram)` with
protein = 4, carbs = 4, fat = 9 kcal/g.

#### Scenario: Estándar split

- GIVEN `targetCalories = 2633` and macros `{proteinPct:30, carbsPct:40, fatPct:30}`
- WHEN macros are computed
- THEN protein grams SHALL equal `197`
- AND carbs grams SHALL equal `263`
- AND fat grams SHALL equal `88`

### Requirement: Macro calories derived from rounded grams (T3)

The system SHALL display each macro's `calories` as `grams * kcalPerGram` (derived from
the rounded gram value), making the result table internally self-consistent. Minor drift
between `Σ macro calories` and `targetCalories` is accepted (estimator tolerance) and
MUST NOT be "corrected" by fudging the grams.

#### Scenario: Self-consistent calories

- GIVEN the Estándar split above
- WHEN the macro table is produced
- THEN protein `calories` SHALL equal `788` (`197 * 4`)
- AND carbs `calories` SHALL equal `1052` (`263 * 4`)
- AND fat `calories` SHALL equal `792` (`88 * 9`)
- AND the sum (`2632`) MAY differ from `targetCalories` (`2633`) by a few kcal

### Requirement: Deterministic rounding order

The system MUST produce the same `Result` for identical inputs across runs. `bmr`,
`tdee`, and `targetCalories` MUST be integers (no half-kcal display). The defined order
is: `bmr = round(rawBmr)`; `tdee = round(rawBmr * multiplier)`;
`targetCalories = round(tdee * (1 + adjustment))`.

#### Scenario: Integer-only outputs

- GIVEN any valid input
- WHEN `calculate()` returns
- THEN `bmr`, `tdee`, `targetCalories`, each macro `grams`, and each macro `calories`
  SHALL all be integers

### Requirement: Pure and dependency-free

The engine MUST consist of pure functions with no I/O, no reliance on `Date`/`Math.random`
for results, no module side effects, and no external runtime dependencies. All formulas
SHALL be exported individually (e.g. `bmrMifflin`, `bmrKatchMcArdle`, `tdeeFor`,
`calculate`) so they are unit-testable in isolation.

#### Scenario: No side effects

- GIVEN a call to `calculate()`
- WHEN it returns
- THEN it SHALL not read `localStorage`, not touch the DOM, and not perform network calls

### Requirement: Numeric safety on extreme-but-valid inputs

The system MUST compute without producing `NaN`, `Infinity`, or overflow for any
in-range extreme (age 100, height 250, weight 300, bodyFat 60).

#### Scenario: Max valid extremes

- GIVEN `{age:100, heightCm:250, weightKg:300, bodyFatPct:60, sex:'male', activity:'extra', goal:'gain_aggressive'}`
- WHEN `calculate()` is invoked
- THEN all `Result` numeric fields SHALL be finite numbers (not `NaN`/`Infinity`)

## Edge Cases (explicit from proposal)

- **Invalid body-fat** (0, 2, 61, non-numeric): ignore → Mifflin, `formulaUsed:'mifflin'`.
- **Rounding drift** (T3): macro `calories` from rounded grams; `Σ calories` may be a few
  kcal off `targetCalories`; accepted and MUST NOT be "corrected" by fudging grams.
- **targetCalories rounding**: integer rounding only; no half-kcal display.
- **Extreme-but-valid**: compute without overflow/`NaN`.
- **Negative/zero/garbage inputs**: rejected upstream by `calculator-form` validation and
  MUST NOT reach the engine (engine assumes already-valid `Inputs`).
- **Katch accuracy vs. input quality** (T7): engine always prefers Katch when body-fat is
  valid; surfaces `formulaUsed` so the user sees the method.

## TDD / Test Vectors (reference calculators, PRD §9)

The Vitest suite in `tests/calculations.test.ts` MUST pin at least:

| #   | Inputs                                      | Expected Result (key fields)                                                                                              |
| --- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| A   | male, 30, 175, 75, none, moderate, maintain | bmr=1699, tdee=2633, target=2633, formulaUsed='mifflin', protein{197g,788k,30%}, carbs{263g,1052k,40%}, fat{88g,792k,30%} |
| B   | female, 28, 165, 60, 22, light, lose        | bmr=1381, tdee=1899, target=1614, formulaUsed='katch-mcardle'                                                             |
| C   | male, 30, 175, 75, 2, moderate, maintain    | identical numbers to A, formulaUsed='mifflin' (invalid body-fat fallback)                                                 |

Coverage: **100% line/branch** on `src/lib/calculations.ts` (config `coverage_targets`).

## Acceptance Criteria

- [ ] `npm run test` passes with `src/lib/calculations.ts` at 100% line/branch coverage.
- [ ] All reference vectors A–C reproduce exactly.
- [ ] `formulaUsed` is correct for valid/invalid body-fat across every branch.
- [ ] No `NaN`/`Infinity` for in-range extremes.

## Open Questions / Risks

- None blocking; all proposal decision gaps (T1–T7) are resolved in the approved proposal.
