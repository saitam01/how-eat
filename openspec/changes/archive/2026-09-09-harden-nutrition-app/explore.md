# Explore: Harden Nutrition App

## Context

The user selected the full remediation scope for the known correctness, persistence, privacy, offline, nutrition-semantics, quality, and documentation problems. The project uses strict TDD and a 400-line review budget.

## Findings

### State and persistence

- Macro progress is measured against total calories instead of each macro target and is capped at 150%.
- `how-eat-meals:v1` is a flat unchecked array; every date contributes to the displayed "daily" totals.
- Calculator, generic local-storage, and active-tab hydration trust partially validated or arbitrary JSON.
- A v2 date-indexed meal schema needs validated, idempotent migration based on each legacy timestamp's local calendar date.

### Nutrition semantics

- Food units are free-form and `unitPer100G` is ambiguous.
- The UI always presents values as "per 100g" even when the domain admits pieces, cups, and other units.
- Weekly planning is deterministic but heuristic, with broad ±30% energy assertions and no preferences, allergens, diary integration, or constrained optimization.

### Platform and privacy

- A web manifest exists, but there is no service worker or cache lifecycle; reliable offline reloads are not guaranteed.
- Shared query URLs expose sex, age, height, weight, body-fat percentage, activity, and goal in address bars, history, copied links, logs, and possible referrers.
- Exact state sharing and strong URL privacy require an explicit product tradeoff.

### Quality and documentation

- Domain types are split between `src/types/index.ts` and `src/lib/types.ts`.
- Vitest configuration is duplicated between `vite.config.ts` and `vitest.config.ts`, with stale coverage paths.
- Production/test debug logging remains; meal IDs use `Date.now()` and `Math.random()`.
- App hydration, migration, date rollover, offline, accessibility, keyboard, and browser E2E coverage are missing.
- `PRD.md` and `openspec/config.yaml` no longer reflect implemented or requested capabilities.

## Change boundaries

### State and migration

- `src/hooks/useMealLog.ts`
- `src/lib/storage.ts`
- `src/hooks/useLocalStorage.ts`
- `src/lib/url.ts`
- `src/types/index.ts`
- `src/lib/types.ts`

### Nutrition semantics

- `src/components/MealLog.tsx`
- `src/components/FoodItemCard.tsx`
- `src/lib/food-search-utils.ts`
- `src/lib/food-db.ts`
- `src/lib/weekly-plan.ts`
- `src/components/WeeklyPlan.tsx`

### Platform and privacy

- `src/App.tsx`
- `index.html`
- `public/manifest.webmanifest`
- `vite.config.ts`

### Quality and docs

- `vitest.config.ts`
- `tests/**`
- `package.json`
- `PRD.md`
- `openspec/config.yaml`

## Recommended delivery slices

1. Canonical domain types, runtime validators, and consolidated test configuration.
2. Correct macro progress and date-scoped meal state with tested v1-to-v2 migration.
3. Normalize serving/unit semantics across food logging and weekly planning.
4. Remove diagnostics, harden ID/time generation, and redesign shared-state privacy.
5. Add service-worker-backed PWA behavior and offline browser tests.
6. Tighten weekly-plan guarantees while exposing remaining heuristic limitations.
7. Add app integration, accessibility, keyboard, migration, offline, and E2E coverage; refresh product and technical documentation.

## Risks

- Local-date migration is timezone- and DST-sensitive; it must be idempotent and retain legacy data until successful.
- Unit reinterpretation can silently change historical nutrition totals and generated plans.
- Service-worker cache invalidation can strand stale bundles or persisted schemas.
- URL fragments reduce server/referrer leakage but do not hide data from recipients.
- The scope substantially exceeds the 400-line review budget. The selected `single-pr` strategy will likely require narrowing scope or explicit `size:exception` before apply.
- Strict TDD requires failing characterization/acceptance tests before every behavior change.

## Open product decisions

- Sharing: URL fragment with warning versus explicit export/import.
- Diary: arbitrary date navigation versus today-only automatic rollover.
- Weekly plan: deterministic guidance versus constrained optimization with preferences/allergens.
- Tooling: whether Playwright, axe, and a PWA plugin may be added.
