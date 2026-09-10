# Weekly Plan Specification

## Purpose

Define deterministic weekly planning that is honest about hard constraints, target deviation, preferences, and infeasibility.

## Requirements

### Requirement: Validated planning inputs

The system MUST generate plans only from valid calorie and macro targets, foods with explicit nutrition bases, and validated allergy, exclusion, and preference selections.

#### Scenario: Invalid food basis

- GIVEN an available food has an ambiguous nutrition basis
- WHEN planning inputs are validated
- THEN that food SHALL not be used as a candidate

### Requirement: Hard food constraints

A generated plan MUST contain no food matching a user allergy or explicit exclusion. Hard constraints MUST NOT be relaxed to produce a result.

#### Scenario: Allergic food would improve target fit

- GIVEN peanuts are marked as an allergy and would reduce target deviation
- WHEN a plan is generated
- THEN peanuts SHALL not appear in any day

### Requirement: Target-deviation optimization

The system MUST seek a feasible weekly plan that minimizes daily deviation from the user's calorie, protein, carbohydrate, and fat targets. The result MUST expose achieved daily totals and deviations so target fit is reviewable.

#### Scenario: Compare feasible candidates

- GIVEN two hard-safe candidates and one is no farther from any daily target and closer to at least one
- WHEN optimization completes
- THEN the dominated candidate SHALL not be selected as optimal

### Requirement: Soft preferences

The system SHOULD favor preferred foods or preference-compatible choices when feasible, but MUST NOT improve preference satisfaction by violating allergies or exclusions. Unmet preferences MUST be disclosed as degradation.

#### Scenario: Preference conflicts with allergy

- GIVEN a preferred food is also excluded by an allergy
- WHEN planning completes
- THEN the food SHALL be absent and any returned plan SHALL disclose the unmet preference

### Requirement: Deterministic result

For identical validated inputs and the same food dataset version, planning MUST return the same status, foods, quantities, and ordering.

#### Scenario: Repeat generation

- GIVEN unchanged inputs and dataset version
- WHEN the plan is generated twice
- THEN both results SHALL be identical

### Requirement: Explicit result states

Planning MUST return exactly one clear state: feasible, degraded, or infeasible. A degraded plan MUST satisfy every hard constraint while identifying unmet soft preferences or target-fit limitations. An infeasible result MUST present no plan and MUST identify the unsatisfied hard constraints or missing feasible candidates.

#### Scenario: No allergy-safe candidates

- GIVEN every candidate violates an allergy
- WHEN planning completes
- THEN the result SHALL be infeasible, contain no weekly plan, and explain that no allergy-safe candidates exist
