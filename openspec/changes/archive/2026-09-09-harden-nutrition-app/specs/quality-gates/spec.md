# Quality Gates Specification

## Purpose

Define automated and documented evidence required for this hardening change.

## Requirements

### Requirement: Single authoritative test configuration

The project MUST have one authoritative configuration for each test concern, with no contradictory Vitest settings or stale coverage paths.

#### Scenario: Run configured unit suite

- GIVEN a clean checkout
- WHEN the documented test command runs
- THEN it SHALL use the authoritative configuration and SHALL not depend on duplicate conflicting settings

### Requirement: Boundary and regression coverage

Automated tests MUST cover validated hydration, corrupt and unknown-version data, idempotent local-date migration including timezone/DST boundaries, 90-date retention, midnight rollover, target-specific macro progress, serving semantics, import rejection, URL privacy, deterministic planning states, and service-worker offline/update behavior.

#### Scenario: Invalid persisted payload regression

- GIVEN the automated suite
- WHEN the invalid-payload case runs
- THEN it SHALL assert no crash, no invalid hydration, and preservation of recoverable state

### Requirement: Browser workflow coverage

Browser-level tests MUST verify calculator export/import, retained-date diary editing, keyboard-only critical paths, explicit feasible/degraded/infeasible planning states, first-load-then-offline reload, and update recovery in supported browser environments.

#### Scenario: Offline browser flow

- GIVEN a browser has successfully loaded the app online
- WHEN it goes offline and reloads
- THEN the browser test SHALL demonstrate the defined core local workflows

### Requirement: Accessibility gate

Automated axe checks MUST report no unwaived serious or critical violations in the affected critical flows, and keyboard tests MUST verify visible focus, logical order, no traps, and perceivable dynamic status. Any waiver MUST be documented with scope and rationale.

#### Scenario: Keyboard and axe gate

- GIVEN the affected screens in each material result state
- WHEN accessibility checks run
- THEN no unwaived serious or critical violation SHALL remain and the critical workflow SHALL complete by keyboard

### Requirement: Build and static-analysis gate

Each behavior change MUST have recorded failing-test (RED) evidence before its passing implementation. Type checking, configured unit/integration and browser tests, and the production build MUST pass before verification.

#### Scenario: Verification candidate

- GIVEN a candidate implementation and its TDD record
- WHEN verification runs
- THEN RED evidence SHALL exist for each changed behavior and every required command SHALL exit successfully

### Requirement: Product and technical documentation

`PRD.md` and `openspec/config.yaml` MUST describe the delivered diary, serving, calculator-file sharing and URL privacy, planning states, PWA/offline lifecycle, testing, accessibility, and local-only privacy behavior, and MUST remove contradictory obsolete MVP claims.

#### Scenario: Documentation review

- GIVEN the delivered behavior
- WHEN the PRD and OpenSpec configuration are reviewed
- THEN each supported capability and verification command SHALL be accurate and no URL-sharing or no-service-worker claim SHALL remain

### Requirement: Production diagnostics and identity quality

Production behavior MUST NOT emit diagnostic logging containing user state, and newly created diary records MUST use collision-resistant identifiers available in supported browser environments.

#### Scenario: Create entries without diagnostics

- GIVEN production mode and repeated rapid entry creation
- WHEN entries are added
- THEN identifiers SHALL remain unique and no user-state diagnostic SHALL be emitted
