# Tasks — `how-eat-meal-logging`

> **Change ID:** `how-eat-meal-logging`
> **Source PRD:** `PRD.md` (v1.0) — out‑of‑scope items for v1 MVP
> **Strict TDD:** `openspec/config.yaml → sdd.strict_tdd: true`. Every capability is sequenced **RED (test) → GREEN (impl) → TRIANGULATE → REFACTOR**, with the test reference column citing the exact spec scenario / vector the task satisfies.
> **Coverage gates:** New lib/hooks 90% (config `coverage_targets`).

---

## Review Workload Forecast

| Field                   | Value                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------ |
| Estimated changed lines | ~1,200–1,800 added across ~20 new files (greenfield extension; deletions negligible) |
| 400-line budget risk    | Low                                                                                  |
| Chained PRs recommended | No                                                                                   |
| Suggested split         | Single PR (food search + meal logging)                                               |
| Delivery strategy       | ask-on-risk                                                                          |

---

## Legend

- **TDD step:** `RED` = write failing test first; `GREEN` = implement to pass; `TRI` = triangulate (extra vector); `REF` = refactor within green.
- **Capability:** one of `food-search`, `meal-logging`, `scaffolding` (non-spec support work from proposal).
- **Test reference:** scenario name (or TDD vector/matrix row) from the named `specs/<capability>/spec.md`, plus PRD § mapping.

---

## H1 — Setup (if needed)

| ID  | Capability | TDD | Description | Test reference (spec scenario / vector) | Done |
| --- | ---------- | --- | ----------- | --------------------------------------- | ---- |

    | H1-1 | scaffolding | —     | No new setup required; base project already configured (Vite, React, TS, Tailwind, shadcn/ui).                                                                                    | — | [x]  |
    | H1-2 | scaffolding | —     | Ensure `vitest.config.ts` coverage thresholds include new modules (food-search, meal-logging) at 90%.                                                                             | config `coverage_targets`                                              | [x]  |

    ---

    ## H2 — Food Search (`food-search`)

    | ID   | Capability   | TDD   | Description                                                                                                                                                                                                                                                                                                                                                                                                              | Test reference (spec scenario / vector)                                       | Done |
    | ---- | ------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ---- |
    | H2-1 | food-search | RED   | Write `tests/food-search.test.ts` testing exact match, partial match, barcode match, not found, loading, error states.                                                                                                                                                                                                                                                                                                    | `food-search` spec Requirements                                               | [x]  |
    | H2-2 | food-search | RED   | Add failing tests for edge cases: case‑insensitivity, diacritics (optional), invalid barcode format, large dataset load failure.                                                                                                                                                                                                                                                                                           | `food-search` spec Edge Cases                                                 | [x]  |
    | H2-3 | food-search | GREEN | Implement `src/lib/food-db.ts` (static JSON bundle ≤ 500 entries) and `src/hooks/useFoodSearch.ts` (search logic, loading, error).                                                                                                                                                                                                                                                                                       | `food-search` all Requirements; design §5                                     | [x]  |
    | H2-4 | food-search | TRI   | Add extra vectors for unit conversion (if unit ≠ '100g') and verify nutrient display per 100 g.                                                                                                                                                                                                                                                                                                                            | `food-search` spec Requirement: Display nutrients per 100 g                   | [x]  |
    | H2-5 | food-search | REF   | Verify that the bundled food JSON is valid and does not exceed size limit; keep code green.                                                                                                                                                                                                                                                                                                                               | `food-search` spec Risks; design §7                                           | [x]  |

    ---

    ## H3 — Meal Logging (`meal-logging`)

    | ID   | Capability        | TDD   | Description                                                                                                                                                                                                                                                                         | Test reference (spec scenario / vector)                                                                                                                | Done |
    | ---- | ----------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
        | H3-1 | meal-logging | RED   | Write `tests/meal-logging.test.ts` for adding food with default/custom amounts, unit conversion, totals calculation, goal comparison, persistence save/load, delete, clear, reactive goal update.                                                                                                                               | `meal-logging` spec Requirements                                                                   | [x]  |
        | H3-2 | meal-logging | RED   | Add failing tests for edge cases: invalid amount (zero/negative), storage failure, large amounts, changing goals mid‑day.                                                                                                                                                                                                                                                                        | `meal-logging` spec Edge Cases                                                                     | [ ]  |
        | H3-3 | meal-logging | GREEN | Implement `src/hooks/useMealLog.ts` (add/remove/clear, totals, progress, persistence with versioned key `how-eat-meals:v1`, debounced save) and any needed utils (e.g., `src/lib/meal-utils.ts`).                                                                              | `meal-logging` all Requirements; design §5                                                         | [ ]  |
        | H3-4 | meal-logging | TRI   | Add extra vectors for unit conversion with non‑standard units and verify progress bar clamping at 150 %.                                                                                                                                                                                                                                                                              | `meal-logging` spec Requirement: Daily totals and goal comparison                               | [x]  |
        | H3-5 | meal-logging | REF   | Verify persistence works across reloads and survives `localStorage` quota/blocked; keep code green.                                                                                                                                                                                                                                                                                           | `meal-logging` spec Risks; design §7                                                               | [x]  |

        ---

        ## H4 — Integration & UI

        | ID   | Capability  | TDD   | Description                                                                                                                                                                                                                                                              | Test reference (spec scenario / vector)                                 | Done |
        | ---- | ----------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---- |
            | H4-1 | scaffolding | RED   | Write RTL tests for `FoodSearch.tsx`: input triggers search, loading spinner, results list, selecting a food calls `onSelect`.                                                                                                                                            | `food-search` spec Components; design §3                                 | [x]  |
            | H4-2 | scaffolding | RED   | Write RTL tests for `MealLog.tsx`: list renders entries, delete button removes entry, progress bars reflect totals vs goal, clear button empties diary.                                                                                                                     | `meal-logging` spec Components; design §3                                | [x]  |
| H4-3 | scaffolding | GREEN | Implement `FoodSearch.tsx` (controlled input, useFoodSearch hook, render loading/error/results, item card with `onSelect`).                                                                                                                                               | design §3; `food-search` spec Components                                 | [x]  |
| H4-4 | scaffolding | GREEN | Implement `MealLog.tsx` (useMealLog hook, list of entries with delete, progress bars using existing shadcn/ui or plain Tailwind, clear button).                                                                   | design §3; `meal-logging` spec Components                                | [x]  |
| H4-5 | scaffolding | GREEN | Implement `FoodItemCard.tsx` (reusable component to show food name, nutrients, optionally brand).                                                                                                                | design §3                                                                 | [x]  |
            | H4-6 | scaffolding | GREEN | Wire `FoodSearch` and `MealLog` into the UI (e.g., in the right panel below ResultCard or in a modal). Ensure accessibility labels, ARIA live if needed.                                                                                                               | design §2; design §3                                                     | [x]  |

        ---

        ## H5 — Polish (Accessibility, Localization, Bundle)

        | ID   | Capability               | TDD       | Description                                                                                                                                                                                                                                      | Test reference (spec scenario / vector)                                                                                              | Done |
        | ---- | ------------------------ | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| H5-1 | scaffolding | GREEN     | Add new UI strings to `src/i18n/es.json` (search placeholder, button labels, toast messages, etc.).                                                                                  | design §6; `accessibility-responsive` spec                                   | [x]  |
| H5-2 | scaffolding | GREEN     | Ensure all new inputs, buttons, and list items have associated labels and ARIA attributes.                                                                                           | design §6                                                                 | [x]  |
| H5-3 | scaffolding | GREEN     | Verify contrast ratio ≥ 4.5:1 for progress bar fill and text.                                                                                                                        | design §6                                                                 | [x]  |
| H5-4 | scaffolding | GREEN     | Run `npm run build --mode analyze`; verify that the food bundle size increase is within agreed limit (e.g., < + 60 KB gzipped).                                                      | design §7                                                                 | [x]  |
| H5-5 | scaffolding | GREEN     | Full audit: `tsc --noEmit` 0 errors, ESLint/Prettier clean, no new lint errors.                                                                                                      | PRD §9/§10 (H6); `accessibility-responsive` Acceptance Criteria             | [x]  |

        ---

        ## H6 — Deploy (no change needed)

        | ID   | Capability  | TDD   | Description                                                                                                                                                                        | Test reference (spec scenario / vector)                                 | Done |
        | ---- | ----------- | ----- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---- |
            | H6-1 | scaffolding | —     | No deploy config change; the existing build/publish process works for the extended app.                                                                                           | — | [x]  |
            | H6-2 | scaffolding | GREEN   | Publish to public URL; smoke test live: search food, add meal, persist/reload, clear diary, verify offline functionality.                                                            | PRD §10 (H7), `meal-logging`/`food-search` acceptance                     | [x]  |

        ---

        ## Dependency Order (summary)

        ```
        H1 (setup) ──► H2 (food-search lib + hook + tests)
                        │
                        └──────────────┬─────────────────────┘
                                       ▼
                            H3 (meal-logging lib + hook + tests)
                                       │
                                       ▼
                            H4 (FoodSearch, MealLog, FoodItemCard components + integration)
                                       │
                                       ▼
                            H5 (polish: i18n, a11y, bundle size, typecheck)
                                       │
                                       ▼
                            H6 (deploy smoke test)
        ```

        ## Notes for the apply phase

        - Per `config.sdd.strict_tdd`, every `RED` task must fail before its `GREEN` sibling is implemented; keep PRs green.
        - Coverage gates enforced in CI (`vitest.config.ts` thresholds): new lib/hooks 90%.
        - The food database JSON should be kept to ≤ 500 entries to control bundle impact; consider using a script to generate from a trusted source (e.g., OpenFoodFacts subset) and commit the JSON.
        - Share URL does NOT include meal data in v2 (could be added in a later change).
