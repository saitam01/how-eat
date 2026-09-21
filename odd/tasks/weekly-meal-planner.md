# Weekly Meal Planner

## Objective

Replace the repeated daily macro template with a deterministic weekly meal planner that respects strict dietary restrictions, favors user preferences, and limits food repetition while remaining honest about degraded or infeasible results.

## Problem

The current weekly view repeats the same chicken/rice/oil guidance for seven days, derives the week from today's remaining intake, and has no model for allergies, intolerances, exclusions, preferences, meal roles, or variety.

## Why

Users need a safe and useful weekly plan rather than a repeated macro scaffold. Hard dietary restrictions must never be relaxed, while preferences and variety should be optimized transparently against nutrition targets and the available catalog.

## Scope

- Normalize planning-facing food metadata and nutrition bases.
- Add strict allergies, strict intolerances, explicit exclusions, preferred foods, dietary patterns, and repeat policy.
- Persist the food profile locally.
- Generate deterministic breakfast/lunch/dinner plans for seven days.
- Limit repetition by food and variety group.
- Return and render feasible, degraded, or infeasible outcomes.
- Expand the bundled catalog only where planning-role coverage requires it.
- Add focused domain and UI tests.

## Constraints

- Allergies, intolerances, and explicit exclusions are hard constraints and are never relaxed.
- Preferences and variety are soft constraints.
- Unknown or ambiguous planning metadata must fail safely.
- The same validated inputs and dataset version must produce the same plan.
- No backend, remote food provider, diagnosis, or medical suitability claim.
- Technical artifacts remain in English; existing Spanish product UI copy remains Spanish.
- Avoid unrelated redesigns.
- Do not commit without explicit user authorization.

## TDD and routing

- TDD mode: not explicitly enabled; use behavior-focused tests and ordinary functional checks.
- Test runner: `npm test -- --run` / focused Vitest paths, from `package.json`.
- Route: delegated direct implementation.
- Trigger evidence: understanding spans 4+ files and implementation requires 2+ non-trivial files.
- Writer: `gentle-ai-worker`; verification routing follows native assessment because RDD is off.

## Delivery forecast

- Estimated authored change: 900–1,300 lines across domain, data, UI, and tests.
- Delivery strategy: `exception-ok`.
- Delivery shape: one commit on `feat/weekly-meal-planner`; the user accepted the ~1,882-line size exception because this is a single-developer project.
- Push is explicitly authorized; no pull request or merge is authorized.

## Tasks

- [x] **WMP-1 — Planning domain and catalog metadata**
  - Define validated planning food/profile/result contracts and explicit nutrition bases.
  - Add allergen, intolerance, dietary-pattern, meal-role, and variety metadata needed by the bundled catalog.
  - Expand foods only for missing planning roles and safe alternatives.
  - Add focused validation/catalog tests.
  - Route: delegated (`gentle-ai-worker`), multi-file write trigger.

- [x] **WMP-2 — Persisted dietary profile and controls**
  - Add local profile state with safe defaults and strict intolerance semantics.
  - Add accessible controls for restrictions, exclusions, preferences, dietary pattern, and repeat policy.
  - Add focused persistence/component tests.
  - Route: delegated (`gentle-ai-worker`), multi-file write trigger.

- [x] **WMP-3 — Deterministic weekly planner**
  - Filter hard constraints before candidate construction.
  - Build complete meals by role and choose practical portions.
  - Optimize target deviation, repetition, and preferences in that priority order.
  - Return feasible, degraded, or infeasible diagnostics.
  - Add tests for hard safety, determinism, variety, small catalogs, and result states.
  - Route: delegated (`gentle-ai-worker`), multi-file write trigger.

- [x] **WMP-4 — Weekly-plan experience and app wiring**
  - Replace the repeated template with generated daily meals and quantities.
  - Show daily totals/deviations and clear result diagnostics.
  - Wire profile and planner inputs through the application.
  - Add focused integration/component tests.
  - Route: delegated (`gentle-ai-worker`), multi-file write trigger.

- [x] **WMP-5 — Final verification and user guidance**
  - Run typecheck, lint, focused/full tests, and production build.
  - Confirm keyboard-accessible controls and safe no-result behavior.
  - Update relevant user-facing guidance if needed.
  - Route: delegated (`gentle-ai-verify`) under the verification rule.

## Acceptance criteria

- No generated meal contains an allergen, intolerance, or explicitly excluded food.
- Vegetarian and vegan patterns exclude incompatible foods.
- Identical inputs and dataset version return identical output.
- The same food is used at most twice weekly by default, and the same variety group at most three times unless the result is explicitly degraded.
- A safe plan never silently violates a hard constraint to improve target fit or variety.
- Every planned day exposes meals, practical quantities, nutrition totals, and target deviation.
- Infeasible inputs return reasons and no plan.
- The current day's meal log no longer changes all seven planned days.
- Focused tests, full tests, typecheck, lint, and build pass, or failures are recorded accurately.

## Progress and evidence

- Product decision: intolerances use total blocking in the initial implementation.
- Exploration completed against `WeeklyPlan.tsx`, current types/catalog, app wiring, tests, and archived weekly-plan specification.
- WMP-1 completed: planning contracts, explicit catalog metadata, fail-safe candidate validation, and hard-constraint filtering.
- WMP-1 verification: writer and independent verifier both passed `npm test -- --run tests/weekly-plan-domain.test.ts` (4 tests) and `npm run typecheck`.
- WMP-1 native assessment was unavailable and therefore treated as high risk; independent verification completed successfully.
- WMP-1 authored implementation/test size is approximately 420 lines; the small heuristic overage keeps complete catalog metadata and tests in one cohesive foundation unit.
- WMP-2 initial writer checks passed, but independent verification found two safety gaps: payload version existed only in the storage key, and invalid hook updates could remain in React state after sanitized persistence.
- WMP-2 correction completed: stored payloads now use `{ version: 1, profile }`, unsupported/missing versions fail to defaults, and hook updates sanitize before both state and storage.
- WMP-2 final verification: writer and independent verifier passed `npm test -- --run tests/food-profile.test.ts tests/food-preferences.test.tsx` (9 tests) and `npm run typecheck`; the verifier confirmed both prior findings resolved.
- WMP-3 writer checks passed (11 focused tests and typecheck), but independent verification found a major greedy-allocation defect: repeat limits can be relaxed without proving a globally compliant weekly allocation is impossible.
- The first WMP-3 correction added bounded global backtracking and broader tests, but re-verification found that exhausting the 250,000-attempt cap could still relax limits without proving infeasibility.
- WMP-3 now requires a complete deterministic capacity assignment (for example max-flow/b-matching), an adversarial constrained fixture where greedy fails but a compliant allocation exists, and explicit ±20% macro-boundary coverage.
- WMP-3 second correction replaced capped search with complete deterministic max-flow capacity assignment; soft repeat limits relax only after strict flow cannot fill all 21 role slots.
- WMP-3 final verification: writer and independent verifier passed `npm test -- --run tests/weekly-plan.test.ts tests/weekly-plan-domain.test.ts` (17 tests) and `npm run typecheck`; all prior allocation and coverage findings were resolved.
- WMP-4 writer checks passed (19 focused tests and typecheck), and independent verification confirmed the planner UI behavior, but found missing App-level tab integration coverage because tests mounted `WeeklyPlan` directly.
- WMP-4 App integration regression completed without production changes; it renders `App`, verifies all four tabs through accessible roles, confirms Plan profile/result wiring, and verifies return navigation.
- WMP-4 final verification: writer and independent verifier passed `npm test -- --run tests/app-tabs.test.tsx tests/weekly-plan-ui.test.tsx tests/food-preferences.test.tsx` (7 tests) and `npm run typecheck`; the prior App-level coverage gap was resolved.
- WMP-5 full verification passed: `npm test` (21 files, 166 tests), `npm run typecheck`, `npm run lint`, and `npm run build` all succeeded.
- Two non-blocking unused-symbol lint warnings were removed mechanically. Independent cleanup verification passed `npm run lint` with no warnings and `npm test -- --run tests/food-profile.test.ts tests/weekly-plan-domain.test.ts` (11 tests).
- Node still emits a pre-existing experimental `localStorage` runtime warning during relevant tests; assertions pass and ESLint is clean.
- Final authored source/test scope is approximately 1,882 additions plus deletions, excluding the ODD task document and generated artifacts. This exceeds the 400-line delivery budget and requires a chain strategy before any commit/PR preparation.
- Remaining known risk: accessibility evidence is DOM/test-based rather than manual assistive-technology validation.
- Delivery authorization: one Conventional Commit and push of `feat/weekly-meal-planner` explicitly requested by the user.
- Delivery commit: this document's containing commit, `feat(weekly-plan): add preference-aware meal planning`; exact SHA is recorded in the Engram feature mirror after commit creation.

## Next step

Create the single authorized delivery commit and push `feat/weekly-meal-planner` to the configured remote. Do not create or merge a pull request.
