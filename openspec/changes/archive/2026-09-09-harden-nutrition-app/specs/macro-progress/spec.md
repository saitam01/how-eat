# Macro Progress Specification

## Purpose

Define accurate progress feedback for energy and each macronutrient.

## Requirements

### Requirement: Target-specific macro progress

The system MUST calculate protein, carbohydrate, and fat progress as consumed grams divided by that macro's own target grams. Energy progress MUST use consumed kcal divided by target kcal. Macro progress MUST NOT use total calorie target as its denominator.

#### Scenario: Independent targets

- GIVEN targets of 100 g protein, 250 g carbohydrate, and 60 g fat
- AND consumption of 80 g protein, 125 g carbohydrate, and 60 g fat
- WHEN progress is calculated
- THEN the values SHALL be 80%, 50%, and 100% respectively

### Requirement: Honest over-target progress

The system MUST preserve and communicate calculated progress above 100% and MUST NOT arbitrarily cap the reported value. A visual meter MAY cap its rendered length if the accessible text retains the true value.

#### Scenario: Exceed target

- GIVEN 180 g consumed against a 100 g protein target
- WHEN progress renders
- THEN the reported protein progress SHALL be 180% and SHALL be identifiable as over target

### Requirement: Undefined target handling

When a corresponding target is absent, invalid, or non-positive, the system MUST show progress as unavailable rather than divide by zero or substitute another target.

#### Scenario: Missing fat target

- GIVEN consumed fat exists but the fat target is zero
- WHEN progress renders
- THEN fat progress SHALL be unavailable and no misleading percentage SHALL be shown
