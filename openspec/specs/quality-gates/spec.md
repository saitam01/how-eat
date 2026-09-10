# Quality Gates Specification

## Purpose

Define the verified WU1 safety-foundation evidence for this hardening change. WU1 establishes test authority and passing characterization baselines; it does not deliver end-user correctness behavior.

## Requirements

### Requirement: Single authoritative Vitest configuration

The project MUST use one authoritative Vitest configuration for the WU1 test suite, without contradictory duplicate settings or stale coverage paths.

#### Scenario: Run configured unit suite

- GIVEN a clean checkout
- WHEN the configured test command runs
- THEN it SHALL use `vite.config.ts` as the sole Vitest authority and SHALL not depend on a duplicate `vitest.config.ts`

### Requirement: Passing characterization baselines

The WU1 suite MUST record passing characterization tests for the existing storage, URL, diary, and serving behavior without presenting unsafe behavior as corrected or accepted product behavior.

#### Scenario: Run WU1 characterization suite

- GIVEN the WU1 candidate
- WHEN the focused characterization suite and full configured suite run
- THEN they SHALL pass while explicitly documenting the current unsafe or ambiguous behavior

### Requirement: WU1 verification gate

The verified WU1 candidate MUST pass type checking, the configured test suite, the production build, and configured lint, remain within the approved 400 changed-line boundary, and contain no active skipped, todo, failing, or deferred acceptance tests.

#### Scenario: Verify WU1 candidate

- GIVEN the WU1-only candidate
- WHEN verification runs
- THEN the required checks SHALL pass and the candidate SHALL contain only the test-authority/configuration slice and characterization tests

## Explicit deferred boundaries

This WU1 specification makes no delivered claim for runtime validators, canonical domain types/shims, diary correctness or migration, macro progress, serving normalization, URL privacy or file exchange, PWA/offline behavior, accessibility/browser coverage, diagnostics/ID hardening, planner integrity, or product/documentation updates. Those capabilities remain deferred follow-up work and must not be inferred from the characterization tests.

The known pre-existing URL branch-coverage threshold diagnostic and configuration-ignore warning are non-blocking WU1 verification risks; no production source behavior was changed.
