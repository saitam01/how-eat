# Delta for Food Search

## ADDED Requirements

### Requirement: Explicit nutrition basis

Every food usable by search, diary, or weekly planning MUST declare one unambiguous nutrition basis consisting of a positive basis quantity and a named basis unit. A serving-to-gram conversion MAY be declared only when known and positive. Invalid food records MUST be rejected at the data boundary.

#### Scenario: Validate serving-based food

- GIVEN a food declares 80 kcal per one piece and two pieces per 100 g
- WHEN the food dataset is validated
- THEN its piece basis and explicit gram conversion SHALL be available consistently to search, logging, and planning

### Requirement: Transparent legacy serving handling

The system MUST preserve legacy nutrition values when their basis is valid, and MUST surface ambiguity rather than infer a weight or serving conversion that cannot be proven.

#### Scenario: Ambiguous legacy unit

- GIVEN a legacy food has a cup label but no reliable basis quantity or conversion
- WHEN normalization is attempted
- THEN the system SHALL avoid guessed conversion and SHALL identify the food as unavailable or ambiguous for quantity calculations

## MODIFIED Requirements

### Requirement: Display nutrients per 100 g

Each search result MUST show energy and macronutrients against the food's actual declared basis. Weight-based foods MAY show “per 100 g”; serving-based foods MUST show their serving quantity and unit, and MAY additionally show a 100 g equivalent only when an explicit conversion exists.
(Previously: results defaulted to “per 100 g” even when a different unit was admitted.)

#### Scenario: Display piece-based nutrition

- GIVEN a food declares 80 kcal per one piece
- WHEN it appears in search results
- THEN the result SHALL say that values are per piece and SHALL NOT describe them as per 100 g unless a valid conversion is also shown
