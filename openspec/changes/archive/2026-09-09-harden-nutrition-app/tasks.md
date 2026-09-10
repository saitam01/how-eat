# Tasks: Harden Nutrition App — Safety Foundation

## Review Workload Forecast

| Field                   | Value                                           |
| ----------------------- | ----------------------------------------------- |
| Estimated changed lines | 297 additions + deletions                       |
| 400-line budget risk    | Low                                             |
| Chained PRs recommended | No                                              |
| Suggested split         | single PR with one independently revertible WU1 |
| Delivery strategy       | single-pr                                       |
| Chain strategy          | pending                                         |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

Maintainer decision: retain WU1 only (Vitest authority and current-behavior characterization tests); defer WU2 canonical contracts and WU3 validators to a follow-up change. No size exception is authorized and no chain strategy has been selected.

The estimate is measured against the actual `main` PR base and includes only WU1 implementation files. OpenSpec planning/evidence artifacts are outside the implementation budget. If the complete WU1 candidate reaches **more than 400 changed lines**, stop before commit/PR preparation and request a narrower approved slice; do not compress tests/docs or silently omit lines to fit.

## Scope boundary

- Implement only WU1: one Vitest configuration and passing current-behavior characterization baselines.
- Defer WU2 canonical contracts/compatibility exports and WU3 dependency-free validators/validator tests to a follow-up change; this apply does not claim those contracts or validators were delivered.
- **Do not** wire validators into `src/lib/storage.ts`, `src/lib/url.ts`, `src/hooks/useMealLog.ts`, food loading/search, React components, or planner execution in this slice.
- Exclude `prototype/weekly-plan` and commit `f5c00e2` completely. Do not merge, cherry-pick, copy, or count that prototype as delivered safety work. `src/lib/weekly-plan.ts`, `src/components/WeeklyPlan.tsx`, and `tests/weekly-plan.test.ts` are absent from `main` and must remain absent from this PR.
- Do not claim the prototype planner satisfies allergies/exclusions, preferences, optimization, determinism, or `feasible`/`degraded`/`infeasible` results. Its missing contract remains a documented deferred baseline, not a safety-PR test imported from the prototype branch.
- Defer diary V2 migration/date behavior/retention/progress fixes, food-data and display normalization, URL privacy and calculator file exchange, diagnostics/ID changes, PWA/service-worker work, Playwright/axe infrastructure, planner behavior, and PRD/OpenSpec config updates.
- Never commit an active failing characterization or deferred acceptance test. The delivered WU1 tree must be GREEN.

## Dependencies and work-unit map

| Work unit                                   | Depends on                           | Finish boundary                                             | Suggested commit                                   | Rollback                                                  |
| ------------------------------------------- | ------------------------------------ | ----------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------- |
| WU1 — Test authority and baselines          | Clean safety-only branch from `main` | One Vitest authority; all characterization tests pass       | `test: establish safety characterization baseline` | Restore config and WU1 characterization edits together    |
| WU2 — Canonical contracts and compatibility | Deferred by maintainer               | Follow-up change; no canonical types or compatibility shims | deferred                                           | N/A for this WU1-only apply                               |
| WU3 — Runtime validators                    | Deferred by maintainer               | Follow-up change; no validators or validator tests          | deferred                                           | N/A for this WU1-only apply                               |
| Delivery gate                               | WU1 GREEN                            | WU1 base diff is ≤400 lines and excludes deferred work      | no additional behavior commit                      | Stop if over budget; do not code-golf or claim completion |

## Checkbox task list — WU1-only active scope

Only WU1 implementation and delivery-gate tasks are active in this change. Deferred WU2/WU3 work is recorded in the prose follow-up section below and is not part of this task list.

### 0. Establish the clean delivery boundary

- [x] **0.1 Confirm the apply branch starts from the actual `main` PR base.** Verify `git merge-base HEAD main`, `git status --short`, and the candidate file list before editing. Confirm no commit/file from `prototype/weekly-plan` or `f5c00e2` is present. Record the base SHA and initial status as apply evidence.
- [x] **0.2 Capture the existing GREEN baseline.** Run `npm run test`, `npm run typecheck`, and `npm run build`; record command, exit status, and any pre-existing warning separately. A pre-existing failure blocks implementation rather than being masked by this slice.

### 1. WU1 — Consolidate Vitest and characterize the unsafe scaffold

- [x] **1.1 Make `vite.config.ts` the sole Vitest authority.** Preserve the `npm run test`/`npm run test:watch` behavior from `package.json`, the `happy-dom` environment, `tests/setup.ts`, alias, reporter, and valid named coverage gates. Remove contradictory/stale coverage entries for non-existent modules and delete `vitest.config.ts`; do not add another config file.
- [x] **1.2 Add passing calculator-storage characterization in `tests/storage.test.ts`.** Explicitly label it as current unsafe scaffold behavior, not final acceptance. Lock that nested type-invalid data and an unknown-version-like object can currently pass the shallow `inputs`/`macros` check, while corrupt JSON and missing top-level shapes recover to `null`. Do not change `src/lib/storage.ts`.
- [x] **1.3 Add/clarify passing URL characterization in `tests/url.test.ts`.** Lock that current code serializes anthropometric state and lets recognized URL fields override persisted/default state. Name the assertions as privacy-debt characterization; do not imply URL sharing is approved and do not change `src/lib/url.ts`.
- [x] **1.4 Add focused passing diary/serving characterization in `tests/meal-logging.test.ts` and `tests/food-search.test.ts`.** Lock only observable current behavior needed for later refactoring: raw v1 entries are trusted/date-unscoped, totals combine timestamps from different local dates, and `unit`/`unitPer100G` arithmetic is accepted without an explicit `NutritionBasis`. Reuse existing fixtures/assertions where possible; state that this behavior is unsafe/ambiguous and deferred. Do not alter hooks, food data, or UI.
- [x] **1.5 GREEN checkpoint for WU1.** Run `npm run test -- --run tests/storage.test.ts tests/url.test.ts tests/meal-logging.test.ts tests/food-search.test.ts`, then `npm run test`. Record passing test counts and confirm no `.skip`, `.todo`, `it.fails`, or active deferred acceptance failures were introduced.

## Deferred follow-up work — not active tasks

WU2, canonical contracts and legacy compatibility, is deferred by the maintainer to a separately approved follow-up change. That follow-up may create `src/lib/domain/types.ts`, restore compatibility re-export shims, and run its own typecheck checkpoint. None of those contracts or shims is delivered or claimed by this WU1-only change.

WU3, dependency-free runtime validators, is likewise deferred to a separately approved follow-up change. That follow-up may define the validator matrix, implement `src/lib/domain/validators.ts`, and complete its own RED/GREEN/TRIANGULATE/REFACTOR cycle. The validator test file and validator module are absent, and no validator behavior is delivered or claimed here.

### 4. Full-diff review-budget and delivery gate

- [x] **4.1 Compare the complete candidate with the actual `main` PR base.** Use the recorded merge-base SHA, inspect `git diff --name-status <base>` and `git diff --numstat <base>`, and separately enumerate every untracked candidate file from `git status --short` (count each untracked candidate’s full line count). Sum additions + deletions across tracked and untracked candidates; binary/generated files must be listed explicitly rather than ignored. Save the base SHA, file list, per-file counts, and total as delivery evidence.
- [x] **4.2 Enforce the hard stop.** The WU1-only candidate is 297 changed lines (≤400), the base is certain, and it contains only WU1 implementation files. WU2/WU3 files were removed; no prototype/deferred file is present. No `size:exception` is authorized and no chain strategy has been selected.
- [x] **4.3 Review the work-unit story and rollback boundaries.** WU1 configuration and characterization tests form one independently understandable/revertible unit; no WU2/WU3 tests or source were retained, and no source wiring, generated coverage/build artifacts, planner prototype, or deferred acceptance tests are present.

## WU1-only completion criteria

- [x] `vite.config.ts` is the only Vitest configuration and documented npm test scripts still work.
- [x] Characterization tests pass and plainly describe unsafe current behavior without asserting final compliance.
- [x] `npm run test`, `npm run typecheck`, and `npm run build` all exit successfully for the WU1-only tree; no validator RED evidence is retained as delivered work.
- [x] The complete WU1 implementation diff against the actual `main` PR base is 297 additions + deletions, includes every tracked/untracked WU1 candidate line, and excludes WU2/WU3, `prototype/weekly-plan`, `f5c00e2`, and all deferred stages.
- [x] Review notes state that this WU1 baseline delivers no diary, serving, privacy, offline, accessibility, or weekly-planner compliance claim.
