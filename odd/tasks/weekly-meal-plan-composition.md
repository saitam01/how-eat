# Weekly Meal Plan Composition

## Objective

Revise the weekly planner so preference changes have an explicit update action and every lunch/dinner is a balanced, multi-food meal rather than a single assigned food.

## Product decision

The user selected **balanced plate** composition for lunch and dinner: a protein source, a carbohydrate/fiber source, and vegetables or fruit. Portions must fit the user's macro target while hard dietary constraints remain absolute.

## Constraints

- Allergies, strict intolerances, explicit exclusions, and dietary patterns remain non-negotiable.
- The plan must remain deterministic for identical inputs.
- Preference edits are staged and only affect the displayed plan after an accessible explicit update action.
- If safe candidates cannot form a required balanced meal, return an honest infeasible/degraded diagnostic; never silently omit a required component.
- Technical artifacts are English; product copy follows the existing Spanish convention.
- No commit, push, or pull request is authorized for this revision.

## Allowed edit surfaces

- `src/lib/weekly-plan.ts`
- `src/lib/types.ts`
- `src/lib/food-db.ts`
- `src/components/WeeklyPlan.tsx`
- `src/i18n/es.json`
- `tests/weekly-plan*.test.ts*`
- `tests/food-preferences.test.tsx`
- `tests/app-tabs.test.tsx`

## Tasks

- [x] **WPC-1 — Map existing constraints and test seams**
  - Confirm catalog meal-role/component coverage and profile update behavior.
  - Define the smallest safe composition model and resulting diagnostics.
  - Route: delegated read-only exploration (4-file rule).

- [x] **WPC-2 — Generate balanced main meals**
  - Model component roles needed to compose lunch/dinner.
  - Select multiple safe foods per main meal, calculate practical portions, and retain deterministic variety behavior.
  - Add focused domain/planner tests including hard restrictions and missing-component outcomes.
  - Route: delegated writer (multi-file write rule).

- [x] **WPC-3 — Stage preference changes behind update action**
  - Keep editable preferences separate from the profile used by the shown plan.
  - Add accessible Spanish update/reset feedback and focused UI coverage.
  - Route: delegated writer (multi-file write rule).

- [x] **WPC-4 — Verify the revision**
  - Run focused planner/UI tests, typecheck, lint, full tests, and build.
  - Route: delegated verification.

- [x] **WPC-5 — Day-to-day variety within tolerance**
  - Reorder candidate selection to maximize distinct foods and spread repeats to non-consecutive days, keeping daily totals within ±10% energy / ±20% macros.
  - Keep hard restrictions, determinism, and honest degraded/infeasible states.
  - Add focused tests that consecutive days do not repeat the same main meal and that variety improves without leaving the tolerance band.
  - Route: delegated writer (multi-file write rule).

## Evidence

- Read-only review: `WeeklyPlan` recomputes from `profile` directly through `useMemo`, so no explicit update control exists.
- Read-only review: `dayFrom` in `src/lib/weekly-plan.ts` creates each meal with one element (`foods: [portion]`).
- User-approved composition: lunch/dinner must contain protein + carbohydrate/fiber + vegetables/fruit.
- WPC-5 product decision: prioritize variety within the existing daily tolerance band (±10% energy, ±20% macros); degrade only when safe options are insufficient.
- WPC-5 implementation: raised default `maxVarietyGroupRepeatsPerWeek` 3→7 (the composed-meal model uses 49 slots/week but only 13 variety groups; the carb component needs 14 uses from 2 groups, so 3 was always infeasible). Reordered selection to variety-first (fewest uses, not recent, fit, group, preferred) and added a post-assignment per-day bounded swap repair that lands each day within tolerance while never worsening repeat caps or meal distinctness.
- WPC-5 verification: independent `gentle-ai-verify` passed (30 focused tests + typecheck). Confirmed default cap 7, full-catalog default plan `feasible` with zero issues, consecutive lunches/dinners differ, three distinct components per main meal, swap repair never worsens caps or distinctness, and hard restrictions remain enforced. `npm test` (21 files, 175 tests), `npm run lint`, and `npm run build` also pass.
- WPC-1/WPC-2 delegated implementation: added component-role metadata and validation; main meals now combine the three required components and count every component against repeat limits.
- WPC-1/WPC-2 writer verification passed: `npm test -- --run tests/weekly-plan.test.ts tests/weekly-plan-domain.test.ts` (20 tests) and `npm run typecheck`.
- WPC-2 independent verification found a high composition defect: one multi-role food may fill more than one component slot in the same main meal, violating the multi-food requirement. The first correction covered relaxed assignment but re-verification found the strict path still loses already selected components when checking the remainder.
- WPC-2 final correction carries selected food IDs through strict feasibility and excludes them from later components of that same main meal. Independent static verification found no severity findings; explicit check execution passed `npm test -- --run tests/weekly-plan.test.ts tests/weekly-plan-domain.test.ts` (22 tests) and `npm run typecheck`.
- WPC-3 delegated implementation stages draft vs applied profile, adds accessible Spanish `Actualizar plan` / `Descartar cambios` actions, and syncs only on genuine external profile replacement. `gentle-ai-verify` failed at infrastructure level (0 tool calls), so the parent verified inline as fallback: `npm test -- --run tests/weekly-plan-ui.test.tsx tests/food-preferences.test.tsx tests/app-tabs.test.tsx` (10 tests) and `npm run typecheck` passed.
- WPC-4 full verification (inline fallback): removed one unused `PlannedFoodPortion` import; `npm run typecheck`, `npm run lint` (clean), `npm test` (21 files, 174 tests), and `npm run build` all passed.
