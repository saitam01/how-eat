# Calculator Form Specification

## Purpose

Defines the input surface (`CalculatorForm.tsx`) that collects anthropometric inputs,
validates them, shows explanatory tooltips, supplies defaults, and is the only place that
enforces input ranges before values reach the `calculations` engine.

Source: `PRD.md` §4.1, §7, §8; `openspec/changes/how-eat-mvp/proposal.md`
(Validation ranges, Edge Cases, T5).

## Requirements

### Requirement: Input fields and types

The form MUST provide fields for: `sex` (radio: male|female), `age` (int), `heightCm`
(int cm), `weightKg` (decimal 0.1 kg), `bodyFatPct` (decimal 0.1 %, **optional**),
`activity` (select: 5 levels), `goal` (radio: 7 options).

#### Scenario: All fields present

- GIVEN the form is rendered
- WHEN the user inspects it
- THEN it SHALL expose exactly the seven fields above with the specified control types

### Requirement: Default values

The form MUST initialize to: `sex='male'`, `age=30`, `heightCm=175`, `weightKg=75`,
`bodyFatPct=undefined`, `activity='moderate'`, `goal='maintain'`.

#### Scenario: First load

- GIVEN no persisted state and no URL params
- WHEN the form mounts
- THEN every field SHALL show its default value

### Requirement: Range validation

The form MUST enforce these inclusive ranges and reject values outside them (out-of-range
is handled per T5, not by hard-block unless empty/non-numeric):

| Field      | Range                                   | Step |
| ---------- | --------------------------------------- | ---- |
| sex        | male\|female                            | —    |
| age        | 10–100                                  | 1    |
| heightCm   | 100–250                                 | 1    |
| weightKg   | 30–300                                  | 0.1  |
| bodyFatPct | 3–60 (optional)                         | 0.1  |
| activity   | sedentary\|light\|moderate\|very\|extra | —    |
| goal       | 7 options (see PRD §4.1)                | —    |

#### Scenario: In-range accepted

- GIVEN `age=45`
- WHEN validated
- THEN it SHALL be accepted as valid

### Requirement: Empty required field blocks calculation

The system MUST disable calculation and show an inline error on blur/submit when a
required field is empty.

#### Scenario: Empty age on submit

- GIVEN `age` is empty (required)
- WHEN the user submits or blurs
- THEN calculation SHALL be disabled
- AND an inline error SHALL be shown next to `age`

### Requirement: Out-of-range clamps with toast (T5)

The system MUST silently clamp an out-of-range _value_ to the nearest bound AND show an
informative toast. This is distinct from "empty required", which blocks.

#### Scenario: Age 150 clamped

- GIVEN `age=150` (max 100)
- WHEN the field is committed
- THEN the value SHALL be clamped to `100`
- AND an informative toast SHALL appear

#### Scenario: Weight 5 clamped

- GIVEN `weightKg=5` (min 30)
- WHEN committed
- THEN it SHALL be clamped to `30` with a toast

### Requirement: Non-numeric / garbage input rejected

The system MUST treat non-numeric or garbage input as invalid and block calculation
(never reaching the engine).

#### Scenario: Letters in height

- GIVEN `heightCm='abc'`
- WHEN validated
- THEN the field SHALL be invalid
- AND calculation SHALL be blocked

### Requirement: Negative or zero rejected

The system MUST reject negative or zero values via range validation; they MUST NOT reach
the engine.

#### Scenario: Weight zero

- GIVEN `weightKg=0`
- WHEN validated
- THEN it SHALL be rejected (below min 30)

### Requirement: Optional body-fat

The system MUST allow `bodyFatPct` to be empty; when empty the engine uses Mifflin. When
present it MUST be validated to 3–60 (clamp+toast if out of range, else feeds Katch).

#### Scenario: Empty body-fat

- GIVEN `bodyFatPct` empty
- WHEN the form is submitted
- THEN calculation proceeds (engine decides Mifflin)

#### Scenario: Out-of-range body-fat clamped

- GIVEN `bodyFatPct=2`
- WHEN committed
- THEN it SHALL be clamped to `3` with a toast (or treated invalid per T5)

### Requirement: Per-field tooltips

The form MUST show an explanatory tooltip per field (formulas used, references, how to
measure body-fat).

#### Scenario: Tooltip activation

- GIVEN focus/hover on a field's tooltip trigger
- WHEN activated
- THEN an accessible tooltip SHALL describe the formula/reference for that field

### Requirement: Associated labels

Every input, select, and radio group MUST have an associated, programmatically-linked
label (`<label for>` / `aria-labelledby`).

#### Scenario: Label association

- GIVEN the rendered form
- WHEN an input is queried for its accessible name
- THEN it SHALL resolve to its visible label text

## Edge Cases (from proposal §Edge Cases / PRD §8)

- **Empty required** → disable calc + inline error on blur/submit.
- **Out-of-range** → clamp to nearest bound + informative toast (T5).
- **Non-numeric/garbage** → invalid, block calc.
- **Extreme-but-valid** (age 100, height 250, weight 300, bodyFat 60) → accepted & computed.
- **Negative/zero** → rejected by range, never reaches engine.

## TDD / Validation Matrix (drives `CalculatorForm` tests)

| Field      | Input   | Expected              |
| ---------- | ------- | --------------------- |
| age        | `''`    | block + inline error  |
| age        | `150`   | clamp → `100` + toast |
| age        | `45`    | valid                 |
| heightCm   | `'abc'` | invalid + block       |
| weightKg   | `0`     | invalid (min 30)      |
| bodyFatPct | `''`    | valid (optional)      |
| bodyFatPct | `2`     | clamp → `3` + toast   |
| bodyFatPct | `22`    | valid → feeds Katch   |

## Acceptance Criteria

- [ ] All seven fields render with correct types and defaults.
- [ ] Empty required disables calc with inline error.
- [ ] Out-of-range clamps + toast; empty blocks; garbage blocks.
- [ ] Each field has an accessible label and tooltip.
- [ ] Form state restores from `localStorage`/`URL` (see `persistence-share`).

## Risks

- Silent clamp may surprise users (mitigated by informative toast, T5).
