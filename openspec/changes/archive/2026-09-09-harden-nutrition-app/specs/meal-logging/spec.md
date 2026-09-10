# Delta for Meal Logging

## ADDED Requirements

### Requirement: Selected local-date diary

The system MUST group entries by local calendar date and MUST display, total, add, edit, delete, or clear entries only for the selected date. Users MUST be able to navigate to any retained date.

#### Scenario: Edit a prior retained date

- GIVEN entries exist for today and yesterday
- WHEN the user selects yesterday and deletes an entry
- THEN yesterday's diary SHALL change and today's diary and totals SHALL remain unchanged

### Requirement: Validated idempotent v1 migration

The system MUST migrate each valid `how-eat-meals:v1` record exactly once to the local calendar date represented by its timestamp. Malformed records MUST NOT block valid records; ambiguous nutrition values MUST be preserved without guessed reinterpretation; and legacy data MUST remain until validated v2 persistence succeeds.

#### Scenario: Migrate across reload and offset boundary

- GIVEN valid v1 entries whose timestamps map to different local dates plus one malformed entry
- WHEN migration runs and the app reloads
- THEN each valid entry SHALL occur once on its derived local date, the malformed entry SHALL not crash migration, and migration SHALL not duplicate entries

### Requirement: Ninety-day local-date retention

On normal diary reads and writes, the system MUST retain the latest 90 local calendar dates including today and MUST prune entries on older dates. Retention MUST use calendar dates rather than elapsed-hour arithmetic.

#### Scenario: Prune the ninety-first date

- GIVEN entries exist for today and for the preceding 90 local dates
- WHEN the diary is read or written
- THEN the oldest date SHALL be removed and the latest 90 dates SHALL remain

### Requirement: Date rollover

If the app remains open across local midnight, it MUST make the new current date understandable while preserving an explicitly selected retained date until the user chooses to navigate.

#### Scenario: Midnight while viewing yesterday

- GIVEN the user is viewing the date that was current before midnight
- WHEN local midnight passes
- THEN the UI SHALL identify the new current date without silently moving or editing the viewed diary

## MODIFIED Requirements

### Requirement: Add food to diary

The system MUST allow the user to select a food, choose a valid quantity in its declared serving unit, and add it to the selected retained local date using a robust unique identifier and explicit timestamp.
(Previously: food was always added to the current day with a default unit.)

#### Scenario: Add a standard quantity

- GIVEN yesterday is selected and a food declares 100 kcal per 100 g
- WHEN the user adds 100 g
- THEN one uniquely identified 100 kcal entry SHALL be stored on yesterday

#### Scenario: Add a custom quantity

- GIVEN the same food and selected date
- WHEN the user adds 250 g
- THEN the entry SHALL contain 250 kcal on that selected date

### Requirement: Portion unit handling

Each entry MUST preserve the entered quantity, displayed unit, nutrition basis quantity, and nutrition basis unit. The system MUST convert between servings and grams only when an explicit valid conversion exists and MUST NOT label a non-weight basis as “per 100g.”
(Previously: `unitPer100G` was used as an ambiguous conversion factor.)

#### Scenario: Non-weight serving without gram conversion

- GIVEN a food declares nutrients per one cup and no gram equivalent
- WHEN the user logs two cups
- THEN nutrients SHALL double, the entry SHALL display two cups, and no gram equivalence SHALL be asserted

### Requirement: Daily totals and goal comparison

The system MUST compute totals solely from entries on the selected date and compare them with the current calculator targets.
(Previously: totals were described for the current day without date isolation.)

#### Scenario: Selected-date target progress

- GIVEN selected-date totals are 500 kcal and 80 g protein against targets of 2000 kcal and 100 g protein
- WHEN totals render
- THEN energy SHALL show 25%, protein SHALL show 80%, and entries from other dates SHALL not contribute

#### Scenario: Exceeding a target

- GIVEN a selected-date macro total exceeds its own target
- WHEN progress renders
- THEN the true over-target percentage SHALL be reported

### Requirement: Persistence

The system MUST persist the diary as a runtime-validated, versioned, date-indexed schema and MUST keep an in-memory diary if storage is blocked or a write fails.
(Previously: persistence used a flat `how-eat-meals:v1` array.)

#### Scenario: Reload restores selected-date diary

- GIVEN two entries were persisted for a retained date
- WHEN the app reloads and that date is selected
- THEN both entries and their totals SHALL be restored

#### Scenario: Storage failure

- GIVEN storage is blocked, throws, or contains invalid v2 state
- WHEN the diary reads or writes
- THEN the app SHALL not crash or hydrate invalid entries and SHALL continue with recoverable in-memory state
