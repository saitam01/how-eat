# Delta for Persistence & Share

## ADDED Requirements

### Requirement: Calculator file exchange

The system MUST export an explicitly versioned, validated calculator file containing only calculator inputs and results, excluding diary, preferences, allergies, exclusions, and plans. Import MUST validate syntax, version, fields, and ranges before atomically changing state; rejection MUST preserve current state. The UI MUST explain that recipients can read exported files.

#### Scenario: Export calculator state only

- GIVEN valid calculator state plus diary and planning data
- WHEN the user explicitly exports
- THEN the file SHALL contain only the calculator payload and schema version

#### Scenario: Reject malformed import

- GIVEN valid current state
- WHEN malformed or unsupported content is imported
- THEN current state SHALL remain unchanged and a recoverable error SHALL be shown

### Requirement: Shareable URL privacy

The system MUST NOT serialize calculator inputs or results into query parameters, fragments, or other shareable URL state. Legacy calculator URL parameters MUST NOT hydrate state.

#### Scenario: Inspect page URL

- GIVEN anthropometric data has been entered
- WHEN the URL is inspected or copied
- THEN it SHALL contain no calculator input or result

## MODIFIED Requirements

### Requirement: localStorage persistence

The system MUST write calculator state only when it conforms to the supported runtime schema. Failed validation or writing MUST NOT replace the last valid value.
(Previously: valid calculations were written as unvalidated JSON to `how-eat:v1`.)

#### Scenario: Save validated calculation

- GIVEN valid calculator state
- WHEN persistence occurs
- THEN storage SHALL contain a payload identifying its supported schema version

### Requirement: Hydration on load

The system MUST parse and runtime-validate persisted state before hydration. Supported state SHALL hydrate; malformed, partial, type-invalid, out-of-range, or unknown-version state SHALL fall back safely without crashing.
(Previously: hydration accepted a stored object described only as valid.)

#### Scenario: Reject structurally invalid state

- GIVEN stored JSON parses but violates the schema
- WHEN the app loads
- THEN no invalid field SHALL hydrate and recoverable defaults SHALL load

### Requirement: Versioned key

Persisted payloads MUST identify a schema version, and readers MUST accept only supported versions or defined migrations. Older code MUST NOT silently reinterpret newer schemas.
(Previously: versioning was defined only by the exact calculator key `how-eat:v1`.)

#### Scenario: Unsupported newer schema

- GIVEN persisted data has an unsupported version
- WHEN hydration occurs
- THEN the app SHALL reject it safely

## REMOVED Requirements

### Requirement: Share URL serialization

(Reason: URLs must not expose calculator state.)
(Migration: Replace link sharing with calculator-file export.)

### Requirement: URL restoration recreates exact state

(Reason: URLs no longer restore calculator state.)
(Migration: Recipients import an exported file.)

### Requirement: Invalid URL params

(Reason: URLs are no longer a calculator hydration boundary.)
(Migration: Import provides invalid-content feedback.)

### Requirement: Partial URL params

(Reason: Partial URL state is unsupported.)
(Migration: Use a complete validated file.)

### Requirement: Clipboard copy with fallback (T4)

(Reason: Product sharing no longer copies state-bearing URLs.)
(Migration: Replace link-copy behavior and tests with file exchange.)
