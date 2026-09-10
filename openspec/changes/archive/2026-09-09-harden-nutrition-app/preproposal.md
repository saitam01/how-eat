# Pre-proposal decisions

## Status

- Product decisions: confirmed by the user.
- External research: unselected. This runtime has no evidence grants, and the user explicitly approved proceeding to Proposal.
- Artifact store: hybrid.
- Delivery strategy: single-pr.
- Review budget: 400 changed lines.

## Confirmed product decisions

### Sharing and privacy

- Remove anthropometric state from shareable URLs.
- Replace link sharing with explicit file export/import.
- The exported file contains calculator inputs/results only, not meal history, preferences, or weekly plans.

### Meal diary

- Support editable navigation across dates.
- Retain the latest 90 local calendar days.
- Automatically remove older records.
- Legacy v1 timestamps must migrate idempotently to their local calendar dates.

### Weekly-plan optimizer

- Replace broad heuristic planning with an optimizer that minimizes daily deviation from calorie and macro targets.
- Allergies and explicit exclusions are hard constraints that must never be violated.
- Preferences are soft constraints honored when feasible.
- The system must expose a clear no-solution/degraded-result state rather than silently violating hard constraints.

### Platform and quality

- Adding Vite PWA, Playwright, and axe dependencies is accepted.
- Offline behavior, browser flows, keyboard operation, accessibility, migrations, and date rollover require explicit verification.

## Delivery implication

The confirmed scope is a substantial product evolution and is expected to exceed the 400-line review budget. The current `single-pr` strategy may require narrowing into a first release or explicit `size:exception` before implementation; no exception has been granted.
