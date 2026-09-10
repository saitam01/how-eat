# Technical Design: Harden Nutrition App

## Status and scope

This document preserves the **full target architecture** required by the approved proposal and capability specifications as planning context; it does not claim that target behavior is delivered here. The current change is formally **WU1-only**: Vitest authority plus passing current-behavior characterization baselines. Canonical domain types, compatibility shims, validators, runtime wiring, and all user-facing correctness work remain deferred. The existing deterministic planner in `src/lib/weekly-plan.ts`, `src/components/WeeklyPlan.tsx`, and `tests/weekly-plan.test.ts` remains prototype/scaffold code. It is not a constrained optimizer and must not be represented as satisfying the weekly-plan specification.

The WU1 delivery is a single PR with a hard 400 changed-line review budget and no approved size exception. Its measured implementation candidate is 297 changed lines against the actual `main` base and contains only the WU1 configuration/test paths. The planner prototype remains outside this deliverable and is not deleted, merged, cherry-picked, copied, or counted as delivered safety work. This design neither selects nor executes a Git strategy. All WU2/WU3 work and later stages below require separate approval/change work before implementation.

## Current architecture and problem boundaries

The React SPA currently has two incompatible domain-type locations: calculator types in `src/types/index.ts`, and food/diary types in `src/lib/types.ts`. Browser persistence is similarly split:

- `src/lib/storage.ts` parses calculator JSON from `how-eat:v1` with only shallow shape checks.
- `src/lib/url.ts` serializes calculator state into query parameters and lets URL state override stored/default state.
- `src/hooks/useMealLog.ts` accepts a raw `how-eat-meals:v1` array, aggregates all dates together, writes it back, and creates predictable IDs. It also emits user-state diagnostics.
- `src/lib/food-search-utils.ts`, `src/components/FoodItemCard.tsx`, and `src/lib/weekly-plan.ts` depend on the ambiguous `unit`/`unitPer100G` convention.
- Both `vite.config.ts` and `vitest.config.ts` define Vitest settings, with conflicting coverage thresholds.

`App.tsx` coordinates calculator, diary, search, and plan tabs; components should remain presentation/orchestration layers. Parsing, validation, migration, date math, nutrient arithmetic, file exchange, and planning must be pure library boundaries so they can be tested independently of browser/UI state.

## Full-change target architecture

### 1. Canonical domain and boundary modules

Introduce a single canonical domain surface under `src/lib/domain/` (names may be finalized in tasks):

- `types.ts`: calculator, nutrition, food, diary, persisted-envelope, import/export, and planning types.
- `validators.ts`: runtime parsers/type guards returning discriminated success/failure results; no unchecked `JSON.parse(...) as DomainType` may cross a boundary.
- Later pure modules: `diary.ts` (date keys, migration, retention and totals), `nutrition.ts` (basis-aware scaling), `calculator-file.ts`, and `planner.ts`.

During migration, the existing `src/types/index.ts` and `src/lib/types.ts` become compatibility re-export shims rather than competing definitions. Call sites move to the canonical imports incrementally. The shims avoid a wide import-only refactor in the first PR while ensuring newly added code has one source of truth; they are removed only after all consumers have migrated.

React hooks own ephemeral UI state and invoke these modules. Components receive validated view models and callbacks, never raw localStorage or untrusted file/URL payloads. Browser APIs are isolated behind storage, file, and service-worker adapters so failure returns a recoverable result instead of throwing through rendering.

### 2. Core contracts

The final field names may vary, but these semantics are contractual.

| Contract                | Required content and invariants                                                                                                                                                                                                                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NutritionBasis`        | Positive finite `quantity` and non-empty named `unit`; an optional gram conversion is explicit, positive, and tied to that basis. A basis is either directly usable as declared or is rejected/marked ambiguous—there is no inferred `unitPer100G` meaning.                                                                        |
| `FoodItem`              | Stable ID/name/category, non-negative finite nutrient values **per `nutritionBasis`**, and one validated `NutritionBasis`. Constraint metadata (allergen/exclusion/preference tags) is validated data, not display text.                                                                                                           |
| `MealEntryV2`           | Collision-resistant ID, timestamp, selected local-date key, entered positive quantity/unit, nutrition-basis snapshot, and calculated nutrient snapshot. It retains enough unit/basis information to display a serving honestly after food data changes.                                                                            |
| `DiaryV2`               | `{ schemaVersion: 2, entriesByDate: Record<LocalDate, MealEntryV2[]> }`; every key is a valid local `YYYY-MM-DD` calendar date and each entry belongs to that key.                                                                                                                                                                 |
| `CalculatorPersistedV2` | Versioned envelope containing only validated calculator inputs, macros, and preset needed to derive the current result. Unsupported/newer versions are rejected, never coerced.                                                                                                                                                    |
| `CalculatorExportV1`    | Explicit version, calculator inputs, macros/preset, and calculator result snapshot only. It contains no diary, food preferences, allergies, exclusions, plans, or URL state. Import validates the whole payload before atomically adopting calculator inputs/macros; the displayed result is recomputed from those trusted values. |
| `PlanResult`            | Discriminated union: `feasible` has a hard-safe plan, totals and deviations; `degraded` has a hard-safe plan plus unmet soft preferences/fit limitations; `infeasible` has no plan and actionable hard-constraint/missing-candidate reasons.                                                                                       |

Numeric validation requires `Number.isFinite`; quantity and target rules additionally enforce their required positivity/ranges. Parsers reject type-invalid, partial, malformed, and unknown-version envelopes. A parser may retain independently valid legacy entries while reporting recoverable skipped-record information; it must never manufacture nutrition facts or conversions.

### 3. Full data flows

#### Calculator persistence and exchange

1. Form state is validated and normalized by the calculator domain boundary.
2. The calculator derives its result from valid inputs/macros; persistence writes a supported versioned envelope only after validation.
3. Hydration parses, checks the version and every nested field, then either returns valid state or recoverable defaults. A failed write leaves the last valid stored value intact; blocked storage leaves the in-memory state usable.
4. Export is an explicit user action that creates the calculator-only envelope. UI copy makes clear that a recipient can read the file.
5. Import parses syntax, version, fields, ranges, and result snapshot as one operation. Any error leaves current calculator state unchanged and yields visible/programmatic error status.
6. `url.ts` stops serializing and parsing calculator state. Legacy query parameters are ignored and never hydrate state; URLs remain state-free.

#### Diary and food serving flow

1. The bundled food dataset passes `validateFoodItem` at its loading boundary. Invalid or ambiguous legacy records are unavailable for quantity calculations rather than guessed into grams.
2. Search renders the item’s declared basis (for example, “per 1 piece”); “per 100 g” is shown only for a weight basis or an explicit valid conversion.
3. Adding food validates selected date, food, and quantity, scales nutrients from the declared basis, snapshots its serving metadata, and creates the entry with `crypto.randomUUID()` where supported by the product browser baseline.
4. The diary reducer stores only the selected local date, calculates selected-date totals, and exposes target-specific progress. Progress is unavailable for absent/invalid/non-positive target; it is not capped in reported text. A visual width may be capped while its accessible value retains the true percentage.
5. Reads and writes validate V2, perform local-calendar retention, and attempt persistence. Storage failure returns the same valid in-memory diary rather than crashing.

#### Diary migration and date policy

`how-eat-meals:v1` is legacy input only. Migration parses each record independently, derives its date with local date accessors (not `toISOString()`), preserves valid legacy nutrition values, and skips malformed records without blocking valid ones. It creates a validated V2 payload, writes V2 successfully, and only then retires/marks legacy data. Re-running against an already persisted V2 payload is a no-op and cannot duplicate IDs.

Retention uses date-key arithmetic, not milliseconds divided by 24 hours: the newest 90 local calendar dates including today remain. Date helpers use a local-calendar representation (and a DST-safe local-day addition strategy) to avoid UTC-offset/DST misclassification. On rollover, the UI identifies the new current date but retains an explicitly selected date until the user changes it.

#### Planning flow

The eventual planner consumes only validated targets, normalized foods, and validated allergy/exclusion/preference selections. It filters invalid and hard-disallowed candidates before optimization. It then deterministically searches/solves bounded serving combinations, minimizes daily calorie/protein/carbohydrate/fat deviations, applies soft preferences only after hard safety, and breaks equal scores by stable dataset/food/quantity ordering. It returns `PlanResult`, including totals, deviations, data version, and explicit degradation/infeasibility reasons.

The current heuristic rotates categories, falls back to arbitrary foods, has no constraint input, and uses ambiguous conversions. It must be contained behind its current prototype UI and cannot be extended or relabeled as the final planner. The final `WeeklyPlan` component must render only the `PlanResult` union and announce all non-success states accessibly.

#### Offline/update flow

A later PWA adapter registers a Service Worker after a successful online load and owns release-named app-shell/runtime caches. The cache version is compatible with the application/schema version it serves; activation retires obsolete caches but never local user data. The UI exposes waiting updates and recoverable cache failures, provides an activation/reload path, and does not claim offline readiness if required assets were not cached. First successful online load remains the prerequisite for offline reload/core local workflows; no remote synchronization is introduced.

## Validation strategy

Runtime validation is mandatory at every trust boundary:

| Boundary                | Validation and recovery                                                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bundled food data       | Validate each food/basis once before it is searchable, loggable, or plannable; exclude invalid/ambiguous records with a user-safe availability state.       |
| Calculator localStorage | Parse envelope, require supported version and complete valid calculator payload; fall back to defaults without overwriting the last valid value on failure. |
| Diary localStorage      | Parse V2 before use; invalid state becomes a recoverable in-memory diary. For V1, validate per record and migrate only valid records.                       |
| File import             | Parse and validate the complete calculator-only schema before a single state update; preserve current state on any rejection.                               |
| UI commands             | Validate date, food, quantity, constraint selections, and calculated targets before mutation/planning.                                                      |
| URL                     | It is deliberately not a calculator-state input after privacy removal; legacy parameters are ignored.                                                       |

Validators are planned as handwritten, dependency-free structural checks for the separately approved WU3 follow-up, preserving the current zero-runtime-calculation-dependency posture. They will return typed outcomes with failure reasons instead of throwing on untrusted input. Pure internal constructors may accept already validated domain objects, but they do not replace boundary validation. No validator implementation is delivered in WU1.

## Migration compatibility and privacy

- Existing calculator `how-eat:v1` data is treated as legacy input and only migrated/read through a validated compatibility path. A newer unsupported envelope is rejected rather than silently reinterpreted by older code.
- Legacy meal data remains until a validated V2 write succeeds. Migration is idempotent, supports local offset/DST boundary tests, and does not guess an ambiguous legacy serving conversion.
- The V2 diary uses a new versioned key/envelope; the exact key naming and legacy-retirement marker are implementation details to be fixed in tasks, but write-before-retire is mandatory.
- Query-derived calculator precedence is removed, not replaced with another shareable URL channel. File exchange is explicit and calculator-only; it does not promise confidentiality after transfer.
- Service-worker rollout is coordinated with storage schema versions so a stale bundle cannot silently read newer data. Reverting a release must retire/invalidate incompatible asset caches while preserving recoverable local data.

## Implementation sequence and release staging

### First implementation slice: WU1 safety foundation only

The delivered slice establishes test authority and characterization baselines without claiming any end-user capability is complete:

1. Consolidate Vitest configuration into one authoritative location (the Vite configuration), eliminating the contradictory duplicate configuration and stale coverage paths while retaining documented `npm run test` behavior.
2. Add **passing characterization tests** for the retained unsafe scaffold behavior: calculator storage hydration, state-bearing URL serialization/precedence, date-unscoped diary totals, and ambiguous serving arithmetic. These tests document what the scaffold currently does; they do not certify that behavior as the final safety requirement. The planner’s missing hard-constraint/result-state contract remains deferred documentation, not a delivered test.
3. Before committing the bounded slice, run its applicable test suite(s) and leave every committed/runnable test GREEN. Deferred acceptance cases must remain documented future cases, or explicit TODO/skips only where repository policy permits; they must not be committed as active failing tests.

The WU1 candidate is measured against the actual PR base at 297 changed lines, including tests and configuration, and remains within the 400-line budget. WU2/WU3 and all later stages require a separately approved change; they are not appended to this PR.

### Explicit first-slice non-goals

The first slice does **not** migrate diary storage, change diary date behavior, fix macro progress, normalize food data/display, remove URL sharing, add export/import UI, remove diagnostics/replace IDs, register a Service Worker, change planner behavior, add Playwright/axe infrastructure, or update product/OpenSpec documentation. Passing characterization tests lock the current scaffold behavior as a baseline; they are not evidence that the unsafe behavior is delivered or accepted as final behavior. Deferred acceptance cases remain future documentation (or explicit TODO/skips only if repository policy permits), never active committed test failures. In particular, no test or documentation statement may claim the existing weekly planner fulfills hard allergies/exclusions, preferences, optimization, or feasible/degraded/infeasible states.

### Deferred stages

The designed full target proceeds only through future approved work. WU2 and WU3 are the immediate follow-up work for this change:

1. **WU2 — canonical contracts and compatibility:** create the canonical domain type surface and compatibility re-export shims, with its own typecheck checkpoint. No canonical types or shims are delivered by WU1.
2. **WU3 — dependency-free validators:** define and implement the validator boundary matrix with its own strict-TDD cycle. No validators or validator tests are delivered by WU1.
3. **Diary correctness:** V2 migration, local-date selection/navigation/retention/rollover, target-specific uncapped progress, safe storage adapters, IDs and diagnostics.
4. **Serving correctness:** dataset normalization/validation, basis-aware arithmetic, entry snapshots, and truthful search/diary/plan labels.
5. **Privacy and robustness:** calculator envelope migration, removal of URL state and share button flow, validated file export/import, and user messaging.
6. **Offline platform:** PWA plugin/configuration, Service Worker registration/cache/update UI, production manifest alignment, and browser offline tests.
7. **Planning integrity:** constraint inputs, deterministic optimizer, `PlanResult`, and accessible feasible/degraded/infeasible rendering.
8. **Cross-cutting hardening:** component/integration/browser accessibility coverage and PRD/config updates to match delivered behavior.

Because the approved delivery is a single bounded WU1 PR, these deferred stages are not to be appended to it. They need separately approved changes/PRs (or an explicit future size exception).

## Test strategy and TDD evidence

Strict TDD applies to every newly delivered behavioral stage: record transient RED evidence in apply progress, minimally make the test GREEN, triangulate boundary cases, then refactor with the relevant suite green. RED is implementation evidence, not a releasable test state. Characterization tests instead lock current behavior and must pass when committed. The delivered bounded slice must finish with every committed/runnable test green. Acceptance tests for deferred behavior must not be committed as active failures; retain them as documented future cases, or as explicit TODO/skips only when repository policy permits.

The full-change test matrix is:

- **Pure unit:** validator rejection/acceptance, basis scaling, target-specific and over-target/unavailable progress, date keys/DST/retention, V1 migration idempotence, storage failure, calculator export/import atomicity, URL absence, deterministic planner tie-breaking and result states.
- **Component/integration:** selected-date edits/totals, serving labels and quantity preview, visible/accessibly announced validation/migration/planner/offline/update status, and keyboard focus return.
- **Browser:** export/import, retained-date diary editing, keyboard-only critical workflows, feasible/degraded/infeasible plans, first-online-load then offline reload/core workflows, and update recovery.
- **Accessibility:** axe reports no unwaived serious/critical violations in affected flows; keyboard tests cover visible focus, logical order, no traps, and dynamic status semantics.
- **Release checks:** the one authoritative unit command, `npm run typecheck`, configured browser tests when introduced, and `npm run build` all pass. Documentation is updated only when its corresponding behavior is actually delivered.

## Risks and tradeoffs

| Risk                                                                                                                                 | Design mitigation                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A broad type consolidation cascades through the app and breaks the review budget.                                                    | Defer the canonical source and compatibility shims to WU2; keep WU1 limited to test authority and characterization baselines.                                        |
| Validators exist but unsafe paths continue to hydrate data.                                                                          | Keep validator design in the WU3 follow-up; WU1 characterization tests document current boundaries without claiming runtime safety.                                  |
| Local dates drift across timezone/DST or migration duplicates entries.                                                               | Explicit local `YYYY-MM-DD` policy, calendar arithmetic, per-record parsing, write-before-retire, and reload/boundary tests.                                         |
| Historical serving data is ambiguous.                                                                                                | Preserve provable values and mark unavailable/ambiguous; never infer gram conversion.                                                                                |
| Optimizer is misleading, slow, or nondeterministic.                                                                                  | Validate/filter inputs first, keep hard constraints inviolable, use stable tie-breaks, and expose degraded/infeasible output.                                        |
| Cache and schema versions become incompatible.                                                                                       | Tie release/cache identity to supported schema versions; surface updates/failures and retain user data across cache retirement.                                      |
| File export is mistaken for secure sharing.                                                                                          | Explicit action and copy explain the recipient boundary; no state-bearing URL replacement.                                                                           |
| The planner prototype is mistaken for shipped integrity work, or its existing uncommitted diff is silently excluded from the budget. | Preserve it as scaffold only, state its missing constraints/result contract in planning/review notes, and keep it outside the WU1 candidate and its 297-line budget. |

## Rollout and rollback

The WU1 PR is internal hardening preparation: it adds one test authority and passing current-behavior baselines but does not add canonical contracts, validators, runtime wiring, alter persisted data, or change user workflows. It can be reverted as a normal code/config revert.

Future storage-changing stages use additive, versioned readers and write-before-retire migration. A failed validation or write leaves valid existing state untouched and keeps usable in-memory state. Future PWA releases version caches, retain local storage during cache cleanup, surface an update path, and permit a reverted release to stop serving incompatible assets. File imports remain atomic, so rejection never overwrites valid calculator state.
