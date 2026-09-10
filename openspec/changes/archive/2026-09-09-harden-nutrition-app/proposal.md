# Proposal: Harden Nutrition App

## Intent

Evolve how-eat from a calculator with loosely protected local state into a reliable, private, offline-capable nutrition tool. The change corrects inaccurate daily nutrition feedback, makes diary and food-serving data explicit, removes sensitive calculator data from URLs, and makes plan generation honest about constraints and infeasible results.

## Business problem and current-state gaps

People use the app to make daily eating decisions from calorie and macro targets. Today, several behaviors can give misleading results or expose sensitive data:

- Macro progress compares every macro to total calories and caps the result, so it does not represent progress toward that macro's own target.
- The meal log is an unvalidated, non-date-scoped v1 array, so prior days contribute to what appears to be a daily total; corrupted browser data can also be trusted during hydration.
- Food units and `unitPer100G` lack an unambiguous serving model, while the UI labels all foods as “per 100g,” including foods entered as pieces or cups.
- The weekly plan is a broad heuristic with no hard allergy/exclusion enforcement, no preference handling, and no explicit infeasible/degraded state.
- Sharing places anthropometric data in query URLs, exposing it through address bars, browser history, copied links, logs, and possible referrers.
- A manifest alone does not provide a service-worker cache lifecycle, so reliable offline reloads are not assured.
- Duplicated types/test configuration, predictable meal IDs, diagnostics, and incomplete automated coverage make correctness regressions difficult to prevent.

The result is avoidable user confusion, privacy exposure, and loss of trust in an app whose core value is actionable nutrition guidance.

## Goals and user-facing outcomes

1. **Accurate daily guidance.** Users see each macro's progress against its own target and meals only for the selected local calendar date.
2. **A durable diary.** Users can navigate to and edit any retained date; the app keeps the most recent 90 local calendar days and automatically removes older entries.
3. **Safe continuity from v1.** Existing meal records migrate once, idempotently, to dates derived from their local timestamps without silently discarding valid data.
4. **Unambiguous servings.** Food logging and planning represent nutrition according to an explicit serving/unit model and no longer falsely describe non-weight units as “per 100g.”
5. **Trustworthy planning.** Generated weekly plans minimize daily calorie and macro-target deviation, never include allergic or explicitly excluded foods, honor preferences when feasible, and visibly report no-solution or degraded results rather than silently breaking hard constraints.
6. **Private sharing.** Calculator sharing uses explicit file export/import. Exported data contains only calculator inputs and results—not meal history, preferences, or weekly plans—and sensitive calculator state is absent from shareable URLs.
7. **Reliable installed/offline use.** After an initial successful load, users can reload and use the relevant app experience offline with a defined cache update lifecycle.
8. **Accessible, regression-resistant behavior.** Keyboard use, accessibility expectations, browser flows, hydration, migration, date rollover, and offline behavior have explicit automated verification.

## Scope and capability boundaries

### In scope

- Consolidate canonical domain types and introduce runtime validation at persistence, URL, import, and hydration boundaries.
- Correct macro-progress calculations and migrate meal persistence from v1 to a validated date-indexed v2 schema.
- Provide editable date navigation, a 90-local-calendar-day retention rule, and automatic pruning.
- Normalize food-serving semantics across food search, food cards, meal logging, and weekly planning.
- Replace the current weekly-plan heuristic with deterministic constrained optimization for calorie/macronutrient deviation, hard allergies/exclusions, and soft preferences, including explicit no-solution/degraded states.
- Remove diagnostic logging and use robust ID/time generation appropriate to browser-supported environments.
- Remove query-URL sharing of calculator state; add calculator-only export/import with validation and clear user messaging.
- Add Vite PWA/service-worker support, its cache lifecycle, and offline verification.
- Consolidate test configuration; add the approved Playwright and axe coverage where needed; update `PRD.md` and `openspec/config.yaml` to describe the delivered product rather than the obsolete MVP assumptions.

### Non-goals

- No backend, account system, cloud sync, multi-user collaboration, or remote storage.
- No export/import of meal history, preferences, or weekly plans.
- No claim that an exported file is confidential after the recipient receives it; export/import replaces URL exposure, not recipient-side secrecy.
- No clinical diagnosis, professional nutrition advice, or guarantee of medically appropriate plans.
- No automatic reinterpretation of historical nutrition values beyond the explicitly defined, validated migration/serving policy; ambiguous legacy data must be handled transparently.
- No guarantee that all preference combinations produce a plan; hard constraints take priority and infeasibility is a valid outcome.
- No unrelated visual redesign or expansion into weight tracking, barcode scanning, food-provider integrations, or online food search.

## Affected areas

| Area | Expected product responsibility |
| --- | --- |
| State, storage, and types | Canonical types, runtime validation, v1-to-v2 diary migration, retention, safe hydration, IDs/time. |
| Calculator sharing | Remove query-state serialization; validate calculator-only export/import. |
| Diary and food UI | Date navigation/editing, correct macro progress, clear serving labels and quantities. |
| Food data and planning | Normalized units/servings; constrained weekly-plan generation and result states. |
| App/PWA shell | Service-worker registration, cache lifecycle, manifest/app-shell alignment, offline UX. |
| Quality and documentation | Test-config consolidation; unit, integration, accessibility, browser/E2E, migration, rollover, and offline coverage; PRD/config refresh. |

## Data migration, privacy, and offline implications

### Migration and retention

- Treat `how-eat-meals:v1` as legacy input only. Convert each valid legacy record to the local calendar date represented by its timestamp and persist the date-indexed v2 form.
- Migration must be validated, idempotent, and safe across reloads, timezone offsets, and DST boundaries. Retain legacy data until the v2 write succeeds; malformed entries must not prevent recovery of valid entries.
- On normal diary reads and writes, prune records older than the latest 90 local calendar days. The selected date and rollover behavior must remain understandable if the app stays open over midnight.
- Schema/version changes must coexist with PWA cache updates so an old bundle cannot misread a new persisted schema.

### Privacy and sharing

- Do not serialize anthropometric inputs/results into query parameters or any shareable URL.
- Export files are explicit user actions and contain only the defined calculator payload. Imports must validate schema/version and reject or safely recover from malformed content.
- Local browser storage remains local to the device/browser profile; the product must explain the export boundary without implying encryption, anonymity, or recipient confidentiality.

### Offline behavior

- The first successful online load is the prerequisite for offline availability.
- The service worker must make reloads and core local workflows available offline, have an intentional update/invalidation path, and surface recoverable failure/update states rather than silently serving incompatible assets.
- Offline does not add remote sync or alter the local-only privacy model.

## Delivery recommendation

The confirmed scope is materially larger than the **400 changed-line review budget**. The selected strategy remains **single PR**, and no `size:exception` is approved. Therefore, implementation should not start as one full-scope PR: it would not be realistically reviewable under the stated budget.

Use the following stages to sequence discovery, acceptance criteria, and strict-TDD work. The single implementation PR must be limited to the earliest complete stage(s) that fit within 400 changed lines; the remaining stages require a new approved change/PR or an explicit size exception before apply.

1. **Safety foundation:** canonical types, runtime validators, test-config consolidation, and failing characterization tests.
2. **Diary correctness:** macro-target progress, date-indexed v2 state, idempotent migration, date navigation, and 90-day retention.
3. **Serving correctness:** normalized serving semantics in food data, meal logging, and display.
4. **Privacy and robustness:** calculator-only export/import, URL-state removal, diagnostics removal, and robust IDs/time.
5. **Offline platform:** PWA/service-worker cache lifecycle and offline browser coverage.
6. **Planning integrity:** constrained optimization, hard/soft constraints, and no-solution/degraded UX.
7. **Cross-cutting hardening and documentation:** integration, accessibility, keyboard, migration, rollover, offline/E2E coverage, and PRD/config updates.

Each behavior change follows strict TDD: add a failing characterization or acceptance test, make the minimal passing change, triangulate boundary cases, then refactor with all relevant checks green. The tasks phase must map the selected delivery slice to changed-line estimates before implementation.

## Success criteria

- Macro progress is calculated from the corresponding protein, carbohydrate, and fat target; it is not derived from total calories or arbitrarily capped.
- The selected diary date alone determines displayed daily totals; users can edit retained dates and entries older than 90 local calendar days are pruned.
- Valid v1 meals migrate to their local dates exactly once, survive reloads, and invalid persisted/imported/URL payloads fail safely without crashing the app.
- Food quantities and labels communicate their actual serving basis consistently in logging and plans.
- Every generated weekly plan respects allergies and explicit exclusions; preferences are documented and applied as soft constraints when feasible; infeasible/degraded outcomes are explicit.
- Shareable URLs contain no calculator anthropometric state, and exported/imported files contain only validated calculator inputs/results.
- After one successful load, supported app reload/core flows work offline; cache updates do not leave the app unusable with incompatible persisted state.
- Required unit, component/integration, accessibility, keyboard, migration, rollover, and browser/offline tests exist and pass, alongside typecheck, build, and the configured test suite.
- Documentation accurately states the supported diary, sharing, planning, PWA/offline, testing, and privacy behavior.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Local-date/DST conversion misfiles or duplicates legacy meals. | Test timezone/date-boundary cases; make migration versioned, validated, idempotent, and write-before-retire. |
| Serving normalization changes displayed historical nutrition unexpectedly. | Define an explicit conversion policy, preserve values when conversion is not provably safe, and communicate ambiguity rather than guessing. |
| Optimizer complexity or infeasible constraints leads to slow, misleading, or non-deterministic plans. | Use deterministic inputs/results, test hard constraints separately from soft preferences, and expose no-solution/degraded state. |
| Service-worker updates strand stale bundles or schema readers. | Version cache/schema deliberately, test update and offline reload paths, and provide a recoverable update path. |
| Export/import is mistaken for secure sharing. | Use explicit file actions and product copy that explains the recipient/privacy boundary. |
| The single-PR scope exceeds the review budget. | Enforce the staged delivery gate; obtain an explicit size exception or create a follow-up change before exceeding 400 lines. |
| Broad change surface creates regressions. | Strict TDD plus targeted unit, integration, accessibility, browser, migration, rollover, and offline checks. |

## Rollback

Rollback must be possible by reverting the implementation PR. Before a new storage schema replaces active data, preserve the v1 payload until validated v2 persistence succeeds. New storage readers should safely reject unknown/corrupt payloads and fall back to recoverable defaults. Service-worker releases need a cache/version invalidation path so a reverted application can stop serving incompatible assets. Imported files never overwrite existing calculator state until validation succeeds.

## Proposal question round

Completed in the parent session: two product-question rounds were run, and the user explicitly confirmed the decisions persisted in `preproposal.md` before delegation.
