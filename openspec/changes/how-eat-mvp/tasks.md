# Tasks — `how-eat-mvp`

> **Change ID:** `how-eat-mvp`
> **Source PRD:** `PRD.md` (v1.0) — milestones **H1 Setup → H2 Engine → H3 Form → H4 Macros UI → H5 Result → H6 Polish → H7 Deploy** (§10).
> **Strict TDD:** `openspec/config.yaml → sdd.strict_tdd: true`. Every capability is sequenced **RED (test) → GREEN (impl) → TRIANGULATE → REFACTOR**, with the test reference column citing the exact spec scenario / vector the task satisfies.
> **Coverage gates:** `src/lib/calculations.ts` 100% (line+branch); `src/lib/storage.ts` & `src/lib/url.ts` 90% (config `coverage_targets`).

---

## Review Workload Forecast

| Field                   | Value                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| Estimated changed lines | ~3,800–5,200 added across ~45 new files (greenfield; deletions negligible)                                |
| 400-line budget risk    | High                                                                                                      |
| Chained PRs recommended | Yes                                                                                                       |
| Suggested split         | PR1 (H1+H2 scaffold+engine) → PR2 (H3+H4 form+macros) → PR3 (H5 result+share) → PR4 (H6+H7 polish+deploy) |
| Delivery strategy       | ask-on-risk                                                                                               |
| Chain strategy          | pending                                                                                                   |

```text
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High
```

**Rationale:** This is a from-scratch SPA (PRD §1, §6). Even the math engine + its 100%-coverage test suite alone exceeds 400 lines; the full surface (Vite/Tailwind/ESLint config, ~7 shadcn/ui copy-paste components, 6 capability components/hooks, `tests/*`, `i18n/es.json`, `index.html` CSP, deploy config) is multi-thousand lines. Split into autonomous, individually-reviewable PRs so each stays under review risk. Parent/orchestrator owns the final chain strategy (stacked-to-main recommended).

---

## Legend

- **TDD step:** `RED` = write failing test first; `GREEN` = implement to pass; `TRI` = triangulate (extra vector); `REF` = refactor within green.
- **Capability:** one of `calculations`, `calculator-form`, `macro-sliders`, `result-card`, `persistence-share`, `accessibility-responsive`, or `scaffolding` (non-spec support work from proposal §“Supporting scaffolding”).
- **Test reference:** scenario name (or TDD vector/matrix row) from the named `specs/<capability>/spec.md`, plus PRD § mapping.

---

## H1 — Setup (scaffolding)

| ID   | Capability  | TDD   | Description                                                                                                                                                                                                                                  | Test reference (spec scenario / vector)                                | Done |
| ---- | ----------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---- |
| H1-1 | scaffolding | —     | Initialize Vite + React 18 + TS template; add `package.json` deps (React 18, Vite, TypeScript strict, Tailwind, PostCSS, Autoprefixer, Radix primitives, cva, tailwind-merge, clsx, lucide-react, Vitest, RTL) per PRD §1/§6 and design §11. | PRD §1, §6, §10 (H1)                                                   | [ ]  |
| H1-2 | scaffolding | —     | Add `tsconfig.json` (`strict: true`, `es2022` target), `vite.config.ts` (manualChunks per D2 design §7.4, `analyze` mode), `tailwind.config.js`, `postcss.config.js`, ESLint + Prettier configs.                                             | design §11, config `stack`                                             | [ ]  |
| H1-3 | scaffolding | RED   | Add `vitest.config.ts` with coverage thresholds (calculations 100%, storage/url 90%) and jsdom env; write a smoke test asserting the app mounts.                                                                                             | config `coverage_targets`; PRD §9                                      | [ ]  |
| H1-4 | scaffolding | GREEN | Implement `src/main.tsx`, `src/App.tsx` (owns `AppState`, `useMemo(result)`), `src/index.css` (Tailwind + CSS vars, light palette slate/emerald/amber/rose per PRD §7.3), `public/favicon.svg`. Smoke test from H1-3 passes.                 | design §3, PRD §7.3                                                    | [ ]  |
| H1-5 | scaffolding | —     | Author `src/types/index.ts`: `Sex`, `ActivityLevel`, `Goal`, `PresetKey`, `Inputs`, `Macros`, `AppState`, `Result`, `MacroResult` exactly as design §4 / PRD §4.2.                                                                           | design §4, PRD §4.2                                                    | [ ]  |
| H1-6 | scaffolding | —     | Copy shadcn/ui components into `src/components/ui/`: `button`, `input`, `label`, `select`, `radio-group`, `slider`, `tooltip` (Card/Separator as plain Tailwind per D2). Wire `@/lib/utils` `cn` helper.                                     | design §3, §11; PRD §7.2                                               | [ ]  |
| H1-7 | scaffolding | —     | Write `index.html` with strict CSP (no unsafe-inline, no eval, no external network, scripts bundled/hashed), meta tags, self-hosted Inter (`public/fonts/Inter.woff2`), no font CDN.                                                         | PRD §5, §7.3; `accessibility-responsive` “CSP enforced”, “No font CDN” | [ ]  |
| H1-8 | scaffolding | —     | Author `src/i18n/es.json` with externalized Spanish (Rioplatense) strings for all 6 capabilities (labels, tooltips, disclaimers, toasts, badges). No locale switcher.                                                                        | `accessibility-responsive` “Fixed Spanish”; T6                         | [ ]  |
| H1-9 | scaffolding | GREEN | Verify `npm run dev` launches and `npm run build` emits `dist/`; `tsc --noEmit` 0 errors. (H1 acceptance gate.)                                                                                                                              | PRD §10 (H1)                                                           | [ ]  |

---

## H2 — Engine (`calculations`)

| ID   | Capability   | TDD   | Description                                                                                                                                                                                                                                                                                                                                                                                                              | Test reference (spec scenario / vector)                                       | Done |
| ---- | ------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ---- |
| H2-1 | calculations | RED   | Write `tests/calculations.test.ts` pinning reference vectors **A** (`male,30,175,75,none,moderate,maintain` → bmr 1699/tdee 2633/target 2633/mifflin, protein 197g/788k, carbs 263g/1052k, fat 88g/792k) and **B** (`female,28,165,60,22,light,lose` → bmr 1381/tdee 1899/target 1614/katch-mcardle) and **C** (invalid body-fat 2 → identical to A, mifflin).                                                           | `calculations` TDD vectors A/B/C                                              | [ ]  |
| H2-2 | calculations | RED   | Add failing tests for each scenario: “Standard male, no body-fat”, “Female offset applied” (1533), “Valid body-fat selects Katch-McArdle”, “Body-fat below range falls back”, “Non-numeric body-fat falls back”, “Moderate activity” (tdee 2633), “Maintain keeps TDEE”, “Lose applies -15%” (1614), “Estándar split”, “Self-consistent calories” (T3), “Integer-only outputs”, “No side effects”, “Max valid extremes”. | `calculations` Requirements §BMR/TDEE/Goal/Macro/T3/Deterministic/Pure/Safety | [ ]  |
| H2-3 | calculations | GREEN | Implement `src/lib/calculations.ts`: `bmrMifflin`, `bmrKatchMcArdle`, `selectBmr` (T7 gate), `tdeeFor`, `calculate` exactly per design §5 (rounding order, T3 from rounded grams). 100% line+branch coverage.                                                                                                                                                                                                            | `calculations` all Requirements; design §5                                    | [ ]  |
| H2-4 | calculations | TRI   | Add branch tests for out-of-range body-fat values `0`, `61`, `NaN`, `null`, `undefined`; confirm Mifflin fallback + `formulaUsed:'mifflin'` on every branch.                                                                                                                                                                                                                                                             | `calculations` “Body-fat validity gate” scenarios; Edge Cases                 | [ ]  |
| H2-5 | calculations | REF   | Validate vectors against an external reference TDEE/macro calculator (representative inputs beyond A–C) and confirm no `NaN`/`Infinity` on extremes; keep code green.                                                                                                                                                                                                                                                    | PRD §9, §10 (H2)                                                              | [ ]  |

---

## H3 — Form (`calculator-form` + storage)

| ID   | Capability        | TDD   | Description                                                                                                                                                                                                                                                                         | Test reference (spec scenario / vector)                                                                                                                | Done |
| ---- | ----------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| H3-1 | calculator-form   | RED   | Write `src/lib/validation.ts` tests for `validateInputs` + `resolvePreset`: TDD matrix rows (`age ''` block, `150`→100 toast, `45` valid, `heightCm 'abc'` invalid, `weightKg 0` invalid, `bodyFatPct ''` valid, `bodyFatPct 2`→3 toast, `22` valid→Katch) and “In-range accepted”. | `calculator-form` TDD matrix; “Range validation”, “Empty required”, “Out-of-range clamps” (T5), “Non-numeric”, “Negative or zero”, “Optional body-fat” | [ ]  |
| H3-2 | calculator-form   | GREEN | Implement `validateInputs` (returns `{ok, errors, clamped}`, T5: empty→block, range→clamp+toast, garbage→block) and `resolvePreset` (map Macros→PresetKey) in `src/lib/validation.ts`.                                                                                              | `calculator-form` Requirements; design §10.3                                                                                                           | [ ]  |
| H3-3 | persistence-share | RED   | Write `tests/storage.test.ts`: “Save on calculate”, “Restore valid state”, “Corrupt JSON” (key removed → defaults), “Blocked storage” (try/catch → in-memory, no crash), “Key shape” (`how-eat:v1`). Target 90%.                                                                    | `persistence-share` “localStorage persistence”, “Hydration on load”, “Corrupt localStorage”, “Blocked storage”, “Versioned key”                        | [ ]  |
| H3-4 | persistence-share | GREEN | Implement `src/lib/storage.ts` (versioned key `how-eat:v1`, safe get/set/clear with try/catch) + `src/hooks/useLocalStorage.ts` generic wrapper.                                                                                                                                    | design §11; `persistence-share` Requirements                                                                                                           | [ ]  |
| H3-5 | calculator-form   | RED   | RTL test for `CalculatorForm.tsx`: “All fields present”, “First load” (defaults), “Label association”, “Tooltip activation”, “Empty age on submit” (disabled + inline error).                                                                                                       | `calculator-form` “Input fields”, “Default values”, “Associated labels”, “Per-field tooltips”, “Empty required field blocks”                           | [ ]  |
| H3-6 | calculator-form   | GREEN | Implement `CalculatorForm.tsx` (controlled by `AppState.inputs`, shadcn controls + tooltips, range validation wired to `validateInputs`, toast on clamp). Defaults per spec.                                                                                                        | design §3; `calculator-form` Requirements                                                                                                              | [ ]  |
| H3-7 | persistence-share | GREEN | Wire debounced (~300ms) `persist(AppState)` side-effect in `useCalculator` on valid change (design §2 write-back rules). Reload restores last valid calc.                                                                                                                           | design §2; `persistence-share` “Save on calculate”, “Restore valid state”                                                                              | [ ]  |

---

## H4 — Macros UI (`macro-sliders`)

| ID   | Capability    | TDD   | Description                                                                                                                                                                                                                                                                                                                                                       | Test reference (spec scenario / vector)                                  | Done |
| ---- | ------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---- |
| H4-1 | macro-sliders | RED   | Write `tests/macros.test.ts` for `largestRemainder`, `redistributeMacros`, `normalizeTo100`: “Move protein to 50” (→50/29/21, Σ100, ratio 40:30 preserved), “Move when others are equal” (→40/30/30), equal-split-when-zero basis, all-zero→even; D1 worked examples from design §6.                                                                              | `macro-sliders` “Proportional linked redistribution”, D1 design §6.1–6.3 | [ ]  |
| H4-2 | macro-sliders | GREEN | Implement `src/lib/macros.ts`: `largestRemainder` (integer Hamilton apportionment, invariant Σ=total), `redistributeMacros`, `normalizeTo100`. 100% on the three fns.                                                                                                                                                                                             | design §6; `macro-sliders` “Sum invariant”, “Single source of truth”     | [ ]  |
| H4-3 | macro-sliders | RED   | RTL test: “Sliders render”, “Fresh state” (default 30/40/30 Estándar, T1), “Select Keto” (20/5/75), “Switch to Alta Proteína mid-edit” (→40/30/30, Σ100), “Inconsistent badge” (red “Suma 97%” during live drag), “Share disabled on mismatch”.                                                                                                                   | `macro-sliders` Requirements + TDD state-transition table                | [ ]  |
| H4-4 | macro-sliders | GREEN | Implement `MacroSliders.tsx`: 3 linked Radix sliders bound to **one** `macros` object (D1 single SOT); `onValueChange` updates only moved value (transient sum≠100), `onValueCommit` calls `redistributeMacros` (renormalize); `SumBadge` (green/red); `PresetTabs`; selecting preset calls `applyPreset` (instant, Σ100); sets `preset:'personalizado'` on drag. | design §3/§6.4; `macro-sliders` all Requirements                         | [ ]  |
| H4-5 | scaffolding   | GREEN | Implement `src/hooks/useCalculator.ts` owning `AppState` (inputs/macros/preset) + derived `result`/`isValid`/`sum`/`shareDisabled` via `useMemo`; `App.tsx` composes form + sliders + result (design §4 state model).                                                                                                                                             | design §4; PRD §6 (data flow)                                            | [ ]  |

---

## H5 — Result & Share (`result-card` + `persistence-share` URL/clipboard)

| ID   | Capability        | TDD   | Description                                                                                                                                                                                                                                                                                                                    | Test reference (spec scenario / vector)                                                                      | Done                                                            |
| ---- | ----------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| H5-1 | persistence-share | RED   | Write `tests/url.test.ts`: “Build share link” (`origin + '?' + serialized Inputs+Macros+preset`), “Open shared link” (exact restore incl. split), “Garbage param” (`age=abc&sex=bogus` → ignored + defaults + toast), “Partial params” (`?sex=female` → female + rest defaults), full/partial/invalid round-trips. Target 90%. | `persistence-share` “Share URL serialization”, “URL restoration”, “Invalid URL params”, “Partial URL params” | [ ]                                                             |
| H5-2 | persistence-share | GREEN | Implement `src/lib/url.ts` (`serializeParams`, `parseUrlParams` validating against ranges/enums, reusing `validateInputs`), and `loadState()` hydration precedence **valid URL > localStorage > defaults** (design §10.1).                                                                                                     | design §10.1–10.2; `persistence-share` Requirements                                                          | [ ]                                                             |
| H5-3 | persistence-share | RED   | Write `tests/clipboard.test.ts` for `copyToClipboard`: secure-context → `method:'clipboard'`; insecure → `execCommand` fallback (`method:'execCommand'`); execCommand-fail → `method:'manual'`; mock `navigator.clipboard.writeText` resolve/reject + `window.isSecureContext` + `document.execCommand`.                       | `persistence-share` “Clipboard copy with fallback” (T4), D3 design §8                                        | [ ]                                                             |
| H5-4 | persistence-share | GREEN | Implement `src/lib/clipboard.ts` (D3: feature-detect secure context, hidden textarea + `execCommand` fallback, returns `method`); `ShareButton.tsx` `onClick` inside user gesture, toast per method (design §8).                                                                                                               | design §8; `persistence-share` T4                                                                            | [ ]                                                             |
| H5-5 | result-card       | RED   | RTL test: “Headline number” (2633 prominent), “Context line” (bmr/tdee), “Table contents” (Macro/Gramos/Calorías/%), “Consistent calories” (protein 788), “Bar widths” (30/40/30), “Buttons present” (Copiar enlace / Resetear), “Formula label” (katch-mcardle shown), “No result yet” (hidden when invalid).                 | `result-card` Requirements                                                                                   | [ ]                                                             |
| H5-6 | result-card       | GREEN | Implement `ResultCard.tsx`: headline `targetCalories`, BMR/TDEE line, macro table + bars (width=pct%), `formulaUsed` note, Reset button, hidden until `result` non-null. Reads derived `result`.                                                                                                                               | design §3; `result-card` Requirements                                                                        | [ ]                                                             |
| H5-7 | result-card       | GREEN | Wire `ShareButton` + disabled state from derived `shareDisabled` (`!isValid                                                                                                                                                                                                                                                    |                                                                                                              | sum !== 100`). Share URL reproduces exact state (design §10.2). | `result-card` “Action buttons”; `macro-sliders` “Inconsistent split disables sharing” | [ ] |

---

## H6 — Polish (`accessibility-responsive`)

| ID   | Capability               | TDD       | Description                                                                                                                                                                                                                                      | Test reference (spec scenario / vector)                                                                                              | Done |
| ---- | ------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| H6-1 | accessibility-responsive | GREEN     | Implement responsive layout: stacked < 768px (form above result), side-by-side ≥ 768px with right panel `position: sticky; top: 1.5rem` (PRD §7.1); verify at 375px / 1024px.                                                                    | `accessibility-responsive` “Responsive layout breakpoints” (Mobile/Desktop), PRD §7.1                                                | [ ]  |
| H6-2 | accessibility-responsive | GREEN     | Implement visible focus rings, WCAG 2.1 AA contrast (≥4.5:1 text, ≥3:1 large/UI), full keyboard operability, light-theme-only palette, self-hosted Inter (no font CDN).                                                                          | `accessibility-responsive` “Visible focus”, “WCAG 2.1 AA contrast”, “Keyboard operability”, “Light theme only”, “Self-hosted assets” | [ ]  |
| H6-3 | result-card              | RED+GREEN | Implement D4 `src/hooks/useDebouncedValue.ts` (500ms) + persistent `aria-live="polite" aria-atomic="true"` sr-only region rendering `buildAnnouncement(result)`; test that live region updates only on committed result (no per-keystroke spam). | `result-card` “aria-live announcements”, D4 design §9; `accessibility-responsive` “ARIA live region”                                 | [ ]  |
| H6-4 | accessibility-responsive | GREEN     | Add `Disclaimer.tsx` (visible medical disclaimer, plain Tailwind Card) + meta tags/OG in `index.html`; confirm Spanish-only strings render, no locale switcher.                                                                                  | `accessibility-responsive` “Fixed Spanish”, PRD §3; design §3                                                                        | [ ]  |
| H6-5 | accessibility-responsive | GREEN     | Run `npm run build --mode analyze`; verify per-icon lucide imports, vendor chunk split (D2), app+Radix+icons gated chunk under agreed budget (O1: <100KB total JS; app+Radix+icons tree-shaken). Note deviation from PRD §5 50KB.                | design §7 (D2/O1); `accessibility-responsive` “Performance targets”, “Bundle budget”                                                 | [ ]  |
| H6-6 | scaffolding              | GREEN     | Full audit: `tsc --noEmit` 0 errors, ESLint/Prettier clean, strict CSP no eval/innerHTML/network, offline-first verified, Lighthouse ≥ 90.                                                                                                       | PRD §9/§10 (H6); `accessibility-responsive` Acceptance Criteria                                                                      | [ ]  |

---

## H7 — Deploy

| ID   | Capability  | TDD   | Description                                                                                                                                                                        | Test reference (spec scenario / vector)                                 | Done |
| ---- | ----------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---- |
| H7-1 | scaffolding | —     | Add static-host deploy config (GitHub Pages / Netlify / Vercel) + base-path; `npm run build` produces publishable `dist/`.                                                         | PRD §10 (H7), §1                                                        | [ ]  |
| H7-2 | scaffolding | GREEN | Publish to public URL; smoke test live: calculate, persist/reload, share-URL round-trip, copy link (incl. `file://` fallback), offline reload. Confirm 0 errors + Lighthouse ≥ 90. | PRD §10 (H7), `persistence-share`/`accessibility-responsive` acceptance | [ ]  |
| H7-3 | scaffolding | REF   | Rollback note: greenfield static host — re-point to previous `dist/` or remove site; `how-eat:v1` handled via versioned key (design §rollback). Document in `CHANGELOG.md`.        | proposal “Rollback”; PRD §13                                            | [ ]  |

---

## Dependency Order (summary)

```
H1 (scaffold/types/config/i18n) ──► H2 (calculations engine + tests)
        │                                    │
        └──────────────┬─────────────────────┘
                       ▼
            H3 (validation + storage + CalculatorForm) ──► H4 (macros lib + MacroSliders + useCalculator)
                       │                                         │
                       └──────────────┬──────────────────────────┘
                                      ▼
                  H5 (url + clipboard + ResultCard + ShareButton)
                                      │
                                      ▼
                       H6 (a11y/responsive/polish/audit) ──► H7 (deploy)
```

## Notes for the apply phase

- Per `config.sdd.strict_tdd`, every `RED` task must fail before its `GREEN` sibling is implemented; keep PRs green.
- Coverage gates enforced in CI (`vitest.config.ts` thresholds): calculations 100%, storage/url 90%.
- PRD §5's original < 50KB gzipped budget is relaxed to < 100KB total JS (O1, design §7.1) — call this out in review; it is the approved interpretation, not a silent change.
- Zone preset removed vs PRD §4.3 (proposal governing) → 4 presets ship.
- Share URL serializes `Inputs + Macros + preset` (design §1 reconciliation), superseding PRD §4.5's inputs-only sketch.
