# Proposal: how-eat-mvp

> **Change ID:** `how-eat-mvp`
> **Status:** proposed (formalized + approved in interactive review, 2026-08-29)
> **Approved decisions:** Zone preset removed; 5 proposal assumptions confirmed (Q1–Q5).
> **Source PRD:** `PRD.md` (repository root, v1.0, 2026-08-28)
> **Created by:** SDD init (gentle-ai) on 2026-08-29
> **Formalized by:** SDD proposal executor (gentle-ai)
> **Last updated:** 2026-08-29

---

## TL;DR

`how-eat` is a brand-new, offline-first, single-page static web app that computes a
user's **TDEE** (Total Daily Energy Expenditure) and **macronutrient targets**
(protein / carbs / fat in grams) from anthropometric inputs, activity level, and a
body-composition goal. It has **zero backend**, runs entirely in the browser, and
persists the last calculation to `localStorage` plus supports shareable URLs.

This change establishes the **MVP (v1)** described in `PRD.md`. It is greenfield:
there is currently no application code (the Vite scaffold does not yet exist) and no
spec artifacts. The deliverable is a review-ready, fully-typed React 18 + Vite +
TypeScript (strict) + Tailwind + shadcn/ui SPA whose math engine is pure and
exhaustively unit-tested.

---

## Why (Problem & Context)

### Business problem

People who want to "eat for a goal" (maintain, cut, or bulk) need a quick, trustworthy
estimate of **how many calories they burn** and **how those calories should split
across macros**. Existing tools are often:

- **Backend-dependent** (require accounts, networks, or subscriptions),
- **Opaque** (hidden or unverifiable formulas),
- **Feature-heavy** (meal logging, social, paywalls) when the user only wants a number,
- **Privacy-poor** (send body data to third parties).

`how-eat` removes all of that friction: a single static page, no login, no server,
fully inspectable formulas, installable as one HTML file or served from any static host.

### Opportunity / user pain

- **Recreational active person (High priority):** wants "how much should I eat" without
  installing a complex tracking app.
- **Amateur athlete (Medium):** wants to plug in body-fat % and use Katch-McArdle for a
  more accurate lean-mass-based BMR.
- **Nutritionist / coach (Low):** wants a fast, citable starting-point estimator to use
  live with a client.

### Current-state gap

There is **no software today**. The only artifacts are `PRD.md` and this draft proposal.
Every capability below is net-new; nothing is being migrated or replaced. Because the
domain math (TDEE, BMR, macro splits) is well-established and the surface area is small,
a durable proposal + spec + design + tasks (SDD) materially reduces ambiguity before
any code is written — which is why SDD is the chosen route.

### Compliance / non-negotiables from the PRD

- **Not medical advice.** A visible disclaimer must communicate that results are
  estimates and do not replace professional consultation (PRD §3).
- **Privacy-first.** No network calls, no `eval`, no dynamic `innerHTML`, strict CSP
  (PRD §5). Telemetry/analytics are out of scope by default unless explicitly added later.
- **Spanish (Rioplatense neutro) v1**, i18n-ready (PRD §5).

---

## What Changes (Capabilities)

This change introduces six product capabilities. Each maps 1:1 to a future
`specs/<capability>/spec.md` (see _Capabilities to be specified_ below).

1. **`calculations`** — A pure, dependency-free math engine in `src/lib/calculations.ts`
   that computes BMR (Mifflin-St Jeor, or Katch-McArdle when valid body-fat % is
   present), TDEE (activity multiplier), goal-adjusted target calories, and macro grams
   (4/4/9 kcal per gram). Must reach **100% line/branch coverage** (PRD §9).

2. **`calculator-form`** — The input surface: sex, age, height, weight, optional body-fat
   %, activity level, and goal. Includes realistic-range validation, inline errors, and
   per-field explanatory tooltips.

3. **`macro-sliders`** — Interactive macro distribution: 3 linked sliders (protein /
   carbs / fat) that always sum to **100%**, plus presets (Estándar, Alta Proteína, Keto,
   Personalizado) and a visual sum badge.

4. **`result-card`** — The output surface: prominent target calories, BMR/TDEE context,
   a macro table (grams / calories / %), visual breakdown bars, and action buttons
   (copy link, reset). Uses `aria-live` so screen readers announce recalculation.

5. **`persistence-share`** — `localStorage` (`how-eat:v1`) persistence of the last
   `Inputs + Macros`, hydration on load, and URL query-param sharing that recreates
   exact state when opened.

6. **`accessibility-responsive`** — WCAG 2.1 AA baseline (contrast ≥4.5:1, visible
   focus, associated labels, ARIA live), responsive layout (stacked < 768px, sticky
   side-by-side ≥ 768px), and the strict CSP / offline-first non-functional constraints.

### Supporting (non-spec) scaffolding

The above capabilities are delivered on top of standard project scaffolding that is
_not_ itself a spec capability but is in scope for the change:

- Vite + React 18 + TypeScript (strict) + Tailwind + PostCSS + ESLint/Prettier.
- shadcn/ui copy-paste components in `src/components/ui/` (button, input, label, select,
  radio-group, slider, card, separator, tooltip, toast).
- Helper modules: `src/lib/constants.ts` (multipliers, presets, labels),
  `src/lib/storage.ts`, `src/lib/url.ts`, `src/hooks/useCalculator.ts`,
  `src/hooks/useLocalStorage.ts`, `src/i18n/es.json`, `src/types/index.ts`.
- Vitest config + `tests/calculations.test.ts` (and storage/url helper tests).
- `index.html` CSP + meta tags, `public/favicon.svg`, self-hosted Inter font.

---

## Business Rules

These invariants must hold and should be encoded as explicit, testable rules.

### Formula selection (BMR)

- If `bodyFatPct` is **present, numeric, and within 3–60%** → use **Katch-McArdle**
  (`370 + 21.6 * LBM`, where `LBM = weightKg * (1 - bodyFatPct/100)`).
- Otherwise → use **Mifflin-St Jeor**
  (`10*weightKg + 6.25*heightCm - 5*age + (male? +5 : -161)`).
- `formulaUsed` must be reported back in the `Result` so the UI can show which method
  was applied (PRD §4.2).

### Activity multipliers (fixed)

| Level     | Multiplier |
| --------- | ---------- |
| sedentary | 1.2        |
| light     | 1.375      |
| moderate  | 1.55       |
| very      | 1.725      |
| extra     | 1.9        |

### Goal adjustments (applied to TDEE)

| Goal            | Adjustment |
| --------------- | ---------- |
| maintain        | 0%         |
| lose_mild       | −10%       |
| lose            | −15%       |
| lose_aggressive | −20%       |
| gain_mild       | +10%       |
| gain            | +15%       |
| gain_aggressive | +20%       |

`targetCalories = round(TDEE * (1 + adjustment))`.

### Macro presets (fixed % splits)

| Preset        | Protein | Carbs  | Fat                     |
| ------------- | ------- | ------ | ----------------------- |
| Estándar      | 30%     | 40%    | 30%                     |
| Alta Proteína | 40%     | 30%    | 30%                     |
| Keto          | 20%     | 5%     | 75%                     |
| Personalizado | slider  | slider | slider (auto-sums 100%) |

### Macro sum invariant

- The three macro percentages **must always sum to 100%** for the result to be valid and
  shareable.
- **Linked-slider rule:** moving one slider redistributes the delta across the other two
  so the total stays 100% (see _Product Tradeoffs_ for the redistribution algorithm choice).
- When the live sum ≠ 100% (only possible in `Personalizado` during an inconsistent state),
  show a red badge ("Suma 97%") and **disable sharing** until corrected.

### Persistence & sharing

- `localStorage` key: `how-eat:v1`; stores `Inputs + Macros` as JSON.
- On load: hydrate form from `localStorage` **if valid**, else fall back to defaults
  (after a corrupt-state cleanup).
- Share URL: `window.location.origin + '?' + URLSearchParams(inputs).toString()`;
  opening that URL must recreate exact state.
- **i18n-ready but Spanish-only shipped:** locale is fixed to `es` for v1; no language
  switcher.

### Validation ranges (PRD §4.1)

| Field      | Type                         | Range              | Default    |
| ---------- | ---------------------------- | ------------------ | ---------- |
| sex        | radio                        | `male` \| `female` | `male`     |
| age        | int                          | 10–100             | 30         |
| heightCm   | int (cm)                     | 100–250            | 175        |
| weightKg   | decimal 0.1 (kg)             | 30–300             | 75         |
| bodyFatPct | decimal 0.1 (%) **optional** | 3–60               | —          |
| activity   | select                       | 5 levels           | `moderate` |
| goal       | radio                        | 7 options          | `maintain` |

### Non-functional guardrails (PRD §5)

- Offline-first after first load; no Service Worker (static files only).
- No network requests, no `eval`, no dynamic `innerHTML`; strict CSP in `index.html`.
- Performance targets: FCP < 1.5s, TTI < 2.5s (simulated 3G mobile), JS bundle < 50KB gzipped.
- Light theme only (no dark mode in v1).

---

## Edge Cases

These are the explicit boundary conditions the implementation must handle (several are
already hinted in PRD §8; expanded here for spec readiness).

### Input / validation

- **Empty required field** → disable calculation; show inline error on blur/submit.
- **Out-of-range value** → silent clamp to the nearest bound **plus** an informative
  toast (PRD distinguishes this from empty-required, which blocks rather than clamps).
- **Non-numeric / garbage input** → treat as empty/invalid; block calculation.
- **Extreme-but-valid values** (e.g., age 100, height 250, weight 300, bodyFat 60) →
  must still compute without overflow/NaN.
- **Negative or zero** → rejected by range validation (never reaches the engine).

### Formula / engine

- **`bodyFatPct` present but invalid** (e.g., 0, 2, 61, non-numeric) → ignore it and
  fall back to Mifflin-St Jeor; report `formulaUsed: 'mifflin'`.
- **Rounding drift:** macro grams are rounded independently
  (`Math.round(calories * pct/100 / kcalPerGram)`). The sum of rounded gram-calories may
  not exactly equal `targetCalories` (off-by-a-few-kcal). Define whether displayed
  `calories` per macro come from **rounded grams × factor** (self-consistent) or from
  **target × pct** (matches target but disagrees with grams). _(Decision gap — see below.)_
- **`targetCalories` rounding:** integer rounding is assumed; confirm no half-kcal display.

### Persistence / sharing

- **Corrupt `localStorage` JSON** → `try/catch`, clear the key, load defaults.
- **`localStorage` unavailable / quota exceeded / blocked (private mode)** → `try/catch`,
  fall back to in-memory state; persistence silently no-ops.
- **Invalid URL params** → ignore offending params, load defaults, show toast
  "Parámetros inválidos".
- **Partial URL params** (some missing) → fill missing from defaults; do not error.
- **`file://` opened locally:** `URLSearchParams` parsing works, but a shared `file://`
  link is not portable across machines; `navigator.clipboard` may be unavailable in
  non-secure contexts → need a clipboard **fallback** (e.g., `document.execCommand('copy')`
  or a selectable read-only field). _(Decision gap — see below.)_

### Macro sliders

- **Slider desync risk** → enforced via a single source of truth (one derived state
  object), not three independent slider states (PRD §11 mitigation).
- **Sum ≠ 100% transiently** → red badge + disabled share; never compute/share an
  inconsistent split.
- **Preset switch mid-edit** → applying a preset instantly overwrites the custom split
  and re-validates to 100%.

### Environment / runtime

- **JS disabled / ancient browser** → no graceful degradation expected (ES2022 target;
  last 2 versions of major browsers per PRD §5). Documented as unsupported.
- **Bundle over budget** → build-time analysis; tree-shaking + per-icon imports to stay
  < 50KB gzipped (PRD §11).

---

## Product Tradeoffs & Decision Gaps

These are the open product questions the proposal surfaces. **They are also listed in the
_Proposal Question Round_ below for your review.** My current assumptions are stated so the
spec phase can proceed; correct any of them and the proposal will be revised.

### T1. Default macro preset

- **Tradeoff:** "Estándar" (30/40/30) is a safe, broadly-accepted default but may not suit
  athletes who'd prefer "Alta Proteína".
- **Assumption:** default to **Estándar (30/40/30)** on first load / empty state.

### T2. Linked-slider redistribution algorithm

- **Tradeoff:** _Proportional_ redistribution preserves the user's relative preference
  between the other two macros but can produce small rounding residuals; _equal_
  redistribution is simpler and more predictable but discards preference.
- **Assumption:** use **proportional** redistribution of the remaining 100%−moved slider
  across the other two, normalized back to 100%.

### T3. Macro calorie display vs. rounded grams

- **Tradeoff:** deriving each macro's `calories` from **rounded grams** keeps the table
  internally consistent (grams × 4/4/9 = shown calories) but the three may sum to a few
  kcal off `targetCalories`. Deriving from **target × pct** matches the headline number
  but the grams won't perfectly back-calculate.
- **Assumption:** compute `calories` from **rounded grams** (self-consistent table);
  accept minor drift vs. `targetCalories`, which is acceptable for an estimator.

### T4. Clipboard fallback for non-secure contexts

- **Tradeoff:** `navigator.clipboard` fails on `file://` / insecure origins. A fallback
  preserves the "copy link" promise everywhere but adds a tiny code path.
- **Assumption:** implement a **graceful fallback** (hidden selectable field / legacy
  `execCommand`) so copy works on `file://` too.

### T5. Silent clamp vs. hard block on out-of-range

- **Tradeoff:** PRD already splits this — _empty required_ blocks; _out-of-range value_
  clamps + toast. This is a reasonable UX (don't punish a typo with a hard wall) but could
  surprise users who didn't notice the clamp.
- **Assumption:** follow PRD as written (clamp + toast for range, block for empty).

### T6. Locale handling

- **Tradeoff:** i18n-ready structure adds a thin key layer now; shipping only `es` keeps v1
  simple. No switcher means non-Spanish users get Spanish UI in v1.
- **Assumption:** ship **Spanish only**, fixed locale, keys externalized for future locales.

### T7. Katch-McArdle accuracy vs. input quality

- **Tradeoff:** Katch-McArdle is more accurate _for athletes_ but only if body-fat % is
  measured well. A guessed/high-error % can yield a _worse_ BMR than Mifflin. The engine
  still prefers it whenever a valid % is supplied (per PRD).
- **Assumption:** honor PRD's rule (valid % ⇒ Katch-McArdle) and surface `formulaUsed` so
  the user sees which method applied.

---

## Impact

- **Greenfield:** no existing application code, public APIs, or data stores are modified.
  Risk of regression is effectively zero; the only "blast radius" is new files and new
  `devDependencies`.
- **New configuration:** `tsconfig.json` (strict), `vite.config.ts`, Tailwind/PostCSS,
  ESLint + Prettier, Vitest, and `index.html` CSP.
- **New dependencies:** React 18, Vite, TypeScript, Tailwind, PostCSS, Autoprefixer,
  shadcn/ui peer deps (Radix primitives, `class-variance-authority`, `tailwind-merge`,
  `clsx`, `lucide-react`), Vitest + React Testing Library. Bundle must stay < 50KB gzipped
  (PRD §5) — a real constraint given Radix + icons.
- **Deliverables map to PRD milestones H1–H7** (§10): setup → engine → form → macros UI →
  result/share → polish → deploy.
- **Operational/support:** none beyond static hosting; no backend to monitor. The visible
  disclaimer shifts any "medical accuracy" expectation to the user.

---

## Out of Scope (this change / v2+)

Explicitly excluded from `how-eat-mvp` (PRD §2):

- Daily meal logging / food search.
- Chilean-food DB / OpenFoodFacts integration.
- Weight history / progress charts.
- PWA / Service Worker (offline is achieved via static files only).
- CSV / PDF export.
- Multiple user profiles.
- Dark mode (light theme only in v1).
- E2E tests (Playwright), visual regression, automated performance budgets.
- Any backend, accounts, telemetry, or analytics.

---

## Risks & Mitigations

| Risk                                    | Likelihood | Impact | Mitigation                                                   |
| --------------------------------------- | ---------- | ------ | ------------------------------------------------------------ |
| Katch-McArdle with invalid body-fat %   | Medium     | Medium | Validate 3–60; fall back to Mifflin (rule above).            |
| Macro sliders desync                    | Low        | High   | Single derived source of truth, not 3 states.                |
| Bundle > 50KB gzipped                   | Low        | Medium | `vite build --mode analyze`, tree-shaking, per-icon imports. |
| `localStorage` full / blocked           | Very low   | Low    | `try/catch`, in-memory fallback.                             |
| Rounding drift between grams and target | Medium     | Low    | Documented display rule (T3).                                |
| Silent clamp surprises user             | Low        | Low    | Informative toast on clamp.                                  |
| PRD/UI language mismatch (es-only)      | Low        | Low    | Fixed `es` locale; i18n-ready keys.                          |

---

## Rollback

Because this is greenfield and fully static:

- **Code:** revert/delete the change branch or `git revert` the merge; no database or
  migration to undo.
- **Deploy:** re-point the static host (GitHub Pages / Netlify / Vercel) to the previous
  `dist/` artifact, or remove the published site.
- **Client state:** users may retain stale `how-eat:v1` `localStorage`; the engine already
  handles corrupt/old keys via `try/catch` + versioned key, so no manual cleanup needed.
  (Bumping the key suffix to `v2` later is the clean invalidation path.)

---

## Success Criteria

1. `npm run dev` launches and `npm run build` produces a working `dist/` (H1).
2. `src/lib/calculations.ts` has **100%** line/branch coverage; results validated against
   reference TDEE/macro calculators for representative inputs (H2).
3. `CalculatorForm` validates ranges, shows tooltips, and persists/restores via
   `localStorage` across reload (H3).
4. `MacroSliders` always sums to 100%; presets apply instantly; share disabled when
   inconsistent (H4).
5. `ResultCard` + `ShareButton` render correctly; a shared URL recreates exact state (H5).
6. WCAG 2.1 AA baseline met; responsive at < 768px (stacked) and ≥ 768px (sticky);
   disclaimer + favicon + meta tags present (H6).
7. Public deploy succeeds; Lighthouse ≥ 90 across categories (H6/H7).
8. `tsc --noEmit` reports 0 errors; ESLint/Prettier clean; strict CSP with no `eval`/
   dynamic `innerHTML`/network calls.

---

## Capabilities to be specified (spec phase)

Each becomes `specs/<capability>/spec.md` during the SDD spec phase. The mapping to PRD
sections is explicit so nothing is missed.

| #   | Capability                 | Covers                                                          | PRD mapping       |
| --- | -------------------------- | --------------------------------------------------------------- | ----------------- |
| 1   | `calculations`             | Pure BMR/TDEE/goal/macro engine + all edge cases, 100% coverage | §4.2, §8, §9, §11 |
| 2   | `calculator-form`          | Inputs, ranges, validation, tooltips, defaults                  | §4.1, §7, §8      |
| 3   | `macro-sliders`            | Presets + linked sliders, 100% sum invariant, badge             | §4.3, §8, §11     |
| 4   | `result-card`              | Output rendering, table, bars, aria-live, actions               | §4.4, §7.1        |
| 5   | `persistence-share`        | `localStorage` + URL param share/restore                        | §4.5, §8          |
| 6   | `accessibility-responsive` | WCAG AA, breakpoints, CSP/offline, light theme                  | §5, §7.1, §2      |

---

## Proposal Question Round (interactive — needs your review)

Because interactive SDD mode is active, the following product questions should be answered
to lock the proposal before the spec phase. **Assumptions shown are what I baked into this
proposal; correct any and I will revise.** If you prefer, answer inline and I'll finalize.

**Q1 — Default macro preset (resolves T1).** On first load / empty state, which preset
should be active by default?

- _Decided:_ **Estándar (30/40/30)**.
- Options considered: Estándar / Alta Proteína / Keto / Zone. **Zone removed** (identical to Estándar per PRD gap; redundant for MVP).

**Q2 — Linked-slider redistribution (resolves T2).** When a user drags one macro slider,
how should the other two absorb the delta?

- _Assumed:_ **Proportional** to their current values, renormalized to 100%.
- Options: Proportional / Equal split / Lock-one-and-adjust-other.

**Q3 — Macro calorie display (resolves T3).** Should each macro's shown calories be
derived from its **rounded grams** (self-consistent table, minor drift vs. target) or from
**target × pct** (matches headline, but grams won't perfectly back-calculate)?

- _Assumed:_ **From rounded grams** (self-consistent table).

**Q4 — Clipboard on `file://` / insecure origins (resolves T4).** Should "copy link"
include a legacy fallback so it works when opened as a local file (no secure context)?

- _Assumed:_ **Yes**, add a graceful fallback.
- Options: Yes (fallback) / No (clipboard API only; documented limitation).

**Q5 — Scope confirmation.** Confirm the v2+ exclusions are acceptable as written (no meal
logging, no food DB, no PWA/SW, no CSV/PDF, no multi-profile, no dark mode, no E2E in v1).

- _Decided:_ **Yes, all exclusions stand.** (Q1–Q5 confirmed in interactive review.)
- Anything that should move _into_ v1?

> After you answer (or say "skip / proceed with assumptions"), I will finalize this
> proposal and we can move to the spec phase for the six capabilities above.
