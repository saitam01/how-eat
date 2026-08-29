# Design: how-eat-mvp

> **Change ID:** `how-eat-mvp`
> **Status:** populated (design phase, interactive review-ready, 2026-08-29)
> **Source of truth:** `PRD.md` (v1.0) + `proposal.md` (approved) + `specs/*/spec.md`
> **Scope:** greenfield React 18 + Vite + TS(strict) + Tailwind + shadcn/ui SPA. Zero backend.
> **Decisions resolved:** T1–T7 (proposal) + the 4 architecture decisions deferred from spec:
> **(D1)** integer largest-remainder normalization for the linked-slider split;
> **(D2)** bundle-budget (< 50KB gzipped) strategy with Radix/shadcn + lucide-react;
> **(D3)** clipboard fallback for `file://` / non-secure contexts;
> **(D4)** `aria-live` debounce to avoid screen-reader keystroke spam.

---

## 1. Decision Summary (quick reference)

| Ref            | Decision                                                                                                           | Resolves | Source                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------ | -------- | --------------------------------------- |
| T1 / D-default | Default preset = **Estándar (30/40/30)**                                                                           | T1, Q1   | `macro-sliders` spec                    |
| T2 / **D1**    | **Proportional** linked redistribution, normalized to integers summing exactly to `100` via largest-remainder      | T2, Q2   | `macro-sliders` spec                    |
| T3             | Macro `calories` derived from **rounded grams** (self-consistent table; minor drift vs `targetCalories` accepted)  | T3, Q3   | `calculations` spec                     |
| T4 / **D3**    | **Clipboard fallback** (legacy `execCommand` + selectable field) for insecure/`file://` contexts                   | T4, Q4   | `persistence-share` spec                |
| T5             | Empty required → **block + inline error**; out-of-range value → **clamp + toast**                                  | T5       | `calculator-form` spec                  |
| T6             | **Spanish (Rioplatense) only**, fixed `es` locale, keys externalized in `src/i18n/es.json`                         | T6       | `accessibility-responsive` spec         |
| T7             | **Katch-McArdle** when `bodyFatPct` valid (finite, 3–60); else Mifflin; always surface `formulaUsed`               | T7       | `calculations` spec                     |
| D2             | Bundle strategy: per-icon lucide imports, copy only needed shadcn/Radix, vendor-chunk split, CI size gate (see §7) | —        | `accessibility-responsive` spec, PRD §5 |
| D4             | `aria-live` bound to **committed/debounced** `Result`, not raw input                                               | —        | `result-card` spec edge case            |

**Reconciliation calls (confirmed in interactive review 2026-08-29):**

- **Share URL payload:** PRD §4.5 shows `URLSearchParams(inputs)` only, but `persistence-share` requires the URL to recreate the exact macro split. **Spec wins** → the share URL serializes `Inputs + Macros + preset` (§9).
- **Zone preset removed:** PRD §4.3 lists 5 presets; the approved proposal removed `Zone` (identical to Estándar). Four presets ship: `Estándar`, `Alta Proteína`, `Keto`, `Personalizado`.
- **Hydration precedence:** when a URL is opened, valid URL params win per-field over `localStorage`; missing/invalid URL params fall back to `localStorage`, then defaults (§9).

---

## 2. Architecture Overview & Data Flow

The app is a single React tree driven by **one** `AppState` object. The math engine is pure and
lives outside React. Derivation is memoized; writes are side effects triggered only on committed
changes.

```
                         ┌──────────────────────────────────────────────┐
   URL (?s&a&h&w&b&ac&g&p&c&f&pr)  ──┐                                    │
   localStorage['how-eat:v1']    ──┤  hydrate()  →  AppState (single SOT)  │
   defaults                      ──┘        │                             │
                                            ▼                             │
                                  ┌─────────────────────┐                │
                                  │  AppState {          │                │
                                  │    inputs: Inputs    │                │
                                  │    macros: Macros    │                │
                                  │    preset: PresetKey │                │
                                  │  }                   │                │
                                  └──────────┬──────────┘                │
                                             │ useMemo                    │
                                  ┌──────────▼──────────┐                │
                                  │  result =            │                │
                                  │   calculate(         │                │
                                  │     inputs, macros)  │                │
                                  │   → Result | null    │                │
                                  └──────────┬──────────┘                │
                 ┌───────────────────────────┼───────────────────────┐   │
                 ▼                           ▼                      ▼   │
         CalculatorForm              MacroSliders              ResultCard │
         (inputs SOT)               (macros SOT)              (reads result)
                 │                           │                      │   │
                 │ onValidCommit             │ onCommit             │   │
                 └───────────┬───────────────┴──────────┐          │   │
                             ▼                          ▼          ▼   │
                  persist(AppState) → localStorage   buildShareUrl()   │
                  (debounced write)                  → ShareButton     │
                                                             │         │
                                                             ▼         │
                                                  copyToClipboard() ──┘
                                                  (D3: clipboard+fallback)
```

**Write-back rules:**

- `localStorage` is written (debounced ~300ms) whenever `AppState` is valid and changed (not on every keystroke).
- The share URL is derived on demand from the current `AppState` (pure function, no write).
- No other side effects; engine never touches `localStorage`/DOM/network (per `calculations` spec, "Pure and dependency-free").

---

## 3. Component Tree

```
App.tsx                              # owns AppState (useState/useReducer) + derive result
├── Header (logo + title + subtitle)        # static, from es.json
├── main grid (responsive: stacked <768px, sticky side-by-side ≥768px)
│   ├── LeftPanel  (form)
│   │   └── CalculatorForm.tsx              # controlled by AppState.inputs
│   │       ├── RadioGroup (sex)            # shadcn/ui → @radix-ui/react-radio-group
│   │       ├── Input (age, heightCm, weightKg, bodyFatPct?)  # shadcn/ui → @radix-ui/react-label + input
│   │       ├── Select (activity)           # shadcn/ui → @radix-ui/react-select
│   │       ├── RadioGroup (goal)           # shadcn/ui → @radix-ui/react-radio-group
│   │       └── Tooltip (per field)         # shadcn/ui → @radix-ui/react-tooltip
│   └── RightPanel (sticky)
│       ├── MacroSliders.tsx                # controlled by AppState.macros + preset
│       │   ├── PresetTabs/Select            # Estándar / Alta Proteína / Keto / Personalizado
│       │   ├── Slider ×3 (protein, carbs, fat)  # shadcn/ui → @radix-ui/react-slider
│       │   └── SumBadge                     # green "Suma 100%" / red "Suma X%" (D1)
│       ├── ResultCard.tsx                   # reads derived result
│       │   ├── Headline (targetCalories)
│       │   ├── ContextLine (bmr | tdee, formulaUsed note)
│       │   ├── MacroTable (Macro|Gramos|Calorías|%)
│       │   ├── BreakdownBars ×3             # width = pct%
│       │   ├── ShareButton.tsx              # D3 clipboard
│       │   └── ResetButton
│       └── Disclaimer.tsx                   # Card (plain Tailwind, not Radix — see D2)
└── aria-live region (sr-only, polite)       # D4 — announces debounced result
    └── <div aria-live="polite" aria-atomic="true">{announced}</div>

Toast host (status messages: clamp, "Parámetros inválidos", "Enlace copiado")
  → prefer a lightweight non-Radix live region (D2) OR @radix-ui/react-toast if kept.
```

**Radix primitive inventory (only what is imported):** `react-radio-group`, `react-select`,
`react-slider`, `react-tooltip`, `react-label` (trivial wrapper), `react-slot` (Button `asChild`).
`Card`, `Separator`, `Input`, `Button` are plain styled elements (no heavy Radix runtime) — see D2.

---

## 4. State Model — Single Source of Truth

`AppState` is the **only** mutable state container. Sub-states are derived, never stored
independently (this is the PRD §11 "single source of truth" mitigation for slider desync).

```typescript
// src/types/index.ts
type Sex = 'male' | 'female';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'extra';
type Goal =
  'maintain' | 'lose_mild' | 'lose' | 'lose_aggressive' | 'gain_mild' | 'gain' | 'gain_aggressive';
type PresetKey = 'estandar' | 'alta_proteina' | 'keto' | 'personalizado';

interface Inputs {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  bodyFatPct?: number;
  activity: ActivityLevel;
  goal: Goal;
}
interface Macros {
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
} // integers, Σ=100
interface AppState {
  inputs: Inputs;
  macros: Macros;
  preset: PresetKey;
}
```

**Ownership & derivation:**

| State           | Where       | How                                                                                   |
| --------------- | ----------- | ------------------------------------------------------------------------------------- |
| `inputs`        | `AppState`  | edited by `CalculatorForm` (controlled)                                               |
| `macros`        | `AppState`  | edited by `MacroSliders` (controlled) — **one object**, not 3 slider states           |
| `preset`        | `AppState`  | set when a preset is chosen; set to `'personalizado'` on any slider drag              |
| `result`        | **derived** | `useMemo(() => isValid(inputs) ? calculate(inputs, macros) : null, [inputs, macros])` |
| `isValid`       | **derived** | pure `validateInputs(inputs)` → `{ ok, errors }`                                      |
| `sum`           | **derived** | `macros.proteinPct + macros.carbsPct + macros.fatPct` (drives SumBadge)               |
| `shareDisabled` | **derived** | `!isValid                                                                             |     | sum !== 100` |

Key invariant: **`macros` is mutated only through two pure helpers** (`redistributeMacros` on
slider commit, `applyPreset` on preset select) that always return a triple summing to exactly
`100`. No code path can persist or share a non-100 split (D1).

---

## 5. Formula-Selection Logic

Mirrors `calculations` spec exactly. Body-fat validity gate honors T7; selection is pure and
deterministic.

```typescript
// src/lib/calculations.ts

function isValidBodyFat(bf: unknown): bf is number {
  return typeof bf === 'number' && Number.isFinite(bf) && bf >= 3 && bf <= 60;
}

function selectBmr(inputs: Inputs): { bmr: number; formulaUsed: 'mifflin' | 'katch-mcardle' } {
  if (isValidBodyFat(inputs.bodyFatPct)) {
    const lbm = inputs.weightKg * (1 - inputs.bodyFatPct / 100);
    return { bmr: Math.round(370 + 21.6 * lbm), formulaUsed: 'katch-mcardle' };
  }
  const base = 10 * inputs.weightKg + 6.25 * inputs.heightCm - 5 * inputs.age;
  const bmr = inputs.sex === 'male' ? base + 5 : base - 161;
  return { bmr: Math.round(bmr), formulaUsed: 'mifflin' };
}

function calculate(inputs: Inputs, macros: Macros): Result {
  const { bmr, formulaUsed } = selectBmr(inputs);
  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[inputs.activity]);
  const targetCalories = Math.round(tdee * (1 + GOAL_ADJUSTMENTS[inputs.goal]));

  const factor = { protein: 4, carbs: 4, fat: 9 } as const;
  const build = (pct: number, key: keyof typeof factor) => {
    const grams = Math.round((targetCalories * pct) / 100 / factor[key]);
    const calories = grams * factor[key]; // T3: calories from rounded grams
    return { grams, calories, pct };
  };

  return {
    bmr,
    tdee,
    targetCalories,
    formulaUsed,
    macros: {
      protein: build(macros.proteinPct, 'protein'),
      carbs: build(macros.carbsPct, 'carbs'),
      fat: build(macros.fatPct, 'fat'),
    },
  };
}
```

**Reference vectors (pinned in `tests/calculations.test.ts`, from spec):**

- A: `male,30,175,75,none,moderate,maintain` → bmr 1699, tdee 2633, target 2633, mifflin,
  protein{197g,788k,30%}, carbs{263g,1052k,40%}, fat{88g,792k,30%}.
- B: `female,28,165,60,22,light,lose` → bmr 1381, tdee 1899, target 1614, katch-mcardle.
- C: `male,30,175,75,2,moderate,maintain` → identical numbers to A, formulaUsed 'mifflin' (BF fallback).

`ACTIVITY_MULTIPLIERS` and `GOAL_ADJUSTMENTS` are the fixed maps from PRD §4.2 (also in
`src/lib/constants.ts`).

---

## 6. Decision D1 — Integer Largest-Remainder Normalization (always Σ=100)

**Problem.** Moving one linked slider must leave the other two summing to `100 - v` while
preserving their current ratio (T2). Float math yields residuals (`28.57 + 21.43`); the
persisted triple must be **integers summing to exactly 100** so the badge is green and sharing
is enabled.

**Decision.** Redistribution runs on slider **commit** (`onValueCommit` in Radix Slider), not on
every `onValueChange`. During a live drag only the moved slider's value updates, so `sum`
transiently ≠ 100 → the red badge ("Suma X%") and disabled share are **real, reachable** UI
states (satisfying the `macro-sliders` "Suma 97%" scenario). On commit we renormalize the other
two via **largest-remainder (Hamilton's) apportionment**, guaranteeing `Σ = 100` exactly.

### 6.1 Core algorithm — `largestRemainder`

```typescript
// src/lib/macros.ts
function largestRemainder(values: number[], total: number): number[] {
  const n = values.length;
  if (n === 0) return [];
  const sum = values.reduce((a, b) => a + b, 0);

  // No proportional basis (all others 0): split as evenly as possible.
  if (sum <= 0) {
    const base = Math.floor(total / n);
    const out = new Array(n).fill(base);
    let rem = total - base * n; // 0..n-1
    for (let i = 0; i < rem; i++) out[i]++; // leftover left-to-right (deterministic)
    return out;
  }

  const raw = values.map((v) => (v / sum) * total); // float targets, Σ raw === total
  const floored = raw.map(Math.floor);
  let remainder = total - floored.reduce((a, b) => a + b, 0); // ∈ [0, n-1]

  // Assign each leftover unit to the largest fractional part; tie → lower index.
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);

  const out = floored.slice();
  for (let k = 0; k < remainder; k++) out[order[k].i]++;
  return out; // invariant: Σ out === total
}
```

_Proof of invariant:_ `Σ raw = total`; each `frac ∈ [0,1)`, so `Σ frac = total − Σ floor ∈ [0, n)`.
We add back exactly `remainder` units → `Σ out = total`. ∎

### 6.2 Linked redistribution — `redistributeMacros`

```typescript
type MacroKey = 'proteinPct' | 'carbsPct' | 'fatPct';

function redistributeMacros(moved: MacroKey, v: number, current: Macros): Macros {
  const nv = clamp(Math.round(v), 0, 100); // moved slider is fixed
  const remaining = 100 - nv;
  const others = (['proteinPct', 'carbsPct', 'fatPct'] as MacroKey[]).filter((k) => k !== moved);
  const [a, b] = largestRemainder(
    [current[others[0]], current[others[1]]], // current ratio of the other two
    remaining,
  );
  return { ...current, [moved]: nv, [others[0]]: a, [others[1]]: b };
}
```

**Worked examples (from `macro-sliders` spec TDD table):**

| Start    | Move                   | `remaining` | raw split             | normalized                    | `Σ`                |
| -------- | ---------------------- | ----------- | --------------------- | ----------------------------- | ------------------ |
| 30/40/30 | protein→50             | 50          | 40:30 → 28.57 / 21.43 | **29 / 21**                   | 100                |
| 30/35/35 | protein→40             | 60          | 35:35 → 30.0 / 30.0   | **30 / 30**                   | 100                |
| 30/40/30 | protein→27 (live drag) | —           | others unchanged      | 27/**40**/**30** (pre-commit) | **97** → red badge |

_Note on the "29/21" example:_ `largestRemainder([40,30], 50)` → raw `[28.57, 21.43]` → floors
`[28,21]`, remainder `1` → larger frac is protein-side (0.57 > 0.43) → `[29,21]`. Total `29+21+50 = 100`. ✓

### 6.3 Defensive normalization — `normalizeTo100`

Applied on hydrate/preset-apply so any external or crafted triple is coerced to Σ=100 without
changing already-valid presets:

```typescript
function normalizeTo100(m: Macros): Macros {
  const [p, c, f] = largestRemainder([m.proteinPct, m.carbsPct, m.fatPct], 100);
  return { proteinPct: p, carbsPct: c, fatPct: f };
}
```

### 6.4 UI wiring (commit-time renormalization)

```typescript
// MacroSliders.tsx (sketch)
<Slider value={[macros.proteinPct]}
  onValueChange={([v]) => onLiveDrag('proteinPct', v)}   // updates only moved value
  onValueCommit={([v]) =>
    onChange(redistributeMacros('proteinPct', v, macros))} // D1: renormalize others
/>
// SumBadge: sum === 100 ? green "Suma 100%" : red `Suma ${sum}%`
// ShareButton disabled when sum !== 100 || !isValid
```

---

## 7. Decision D2 — Bundle-Budget Strategy (< 50KB gzipped)

**Constraint.** PRD §5 / `accessibility-responsive` spec: JS bundle < 50KB gzipped; FCP < 1.5s,
TTI < 2.5s (simulated 3G). Stack is fixed: React 18 + Vite + Tailwind + shadcn/ui (Radix) +
lucide-react.

### 7.1 Reality check (acknowledged — resolved as O1)

React 18 + ReactDOM alone is **≈ 42–45 KB gzipped**. With the mandated Radix primitives and
icons, a _total_ under 50 KB is effectively **infeasible**. **Decision (O1, signed off):** relax
the PRD §5 budget to **< 100 KB gzipped total JS** (app + Radix + icons + React vendor). The
design still applies aggressive tree-shaking to the app+Radix+icons payload to land comfortably
under that ceiling (est. ~60–75 KB gz total). This is documented as the accepted interpretation
of the original < 50 KB target.

### 7.2 Estimated budget

| Chunk                                                                     | Est. gzipped  | Strategy                                                         |
| ------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------- |
| `react` + `react-dom`                                                     | ~42–45 KB     | vendor chunk, `manualChunks`, long-cache, **excluded from gate** |
| Radix primitives used (select, radio-group, slider, tooltip, slot, label) | ~12–18 KB     | import only the used primitives                                  |
| `lucide-react` (3–5 icons, per-icon)                                      | ~1–2 KB       | shared `Icon` base only                                          |
| app code (calc, hooks, components, i18n)                                  | ~6–10 KB      | pure, small                                                      |
| `cva` + `tailwind-merge` + `clsx`                                         | ~3–4 KB       | required by shadcn                                               |
| **Total (realistic)**                                                     | **~64–79 KB** | —                                                                |
| **App+Radix+icons (gated)**                                               | **~22–34 KB** | target < ~25 KB gzipped                                          |

### 7.3 Rules (enforced in code review + CI)

1. **Per-icon lucide imports only:**
   `import { Copy, RotateCcw, Info } from 'lucide-react';` — never `import * as Icons`.
   lucide-react is ESM tree-shakeable; only the named icons + shared `Icon` compile in.
2. **Copy only the shadcn components actually used** into `src/components/ui/`. Drop
   `Card`/`Separator` (use plain Tailwind `div`/`border` — saves ~1–2 KB of Radix).
3. **Toast:** prefer a non-Radix `aria-live` status region (we already have one for D4) over
   `@radix-ui/react-toast`; keep Toast only if product insists.
4. **`vite.config.ts` vendor split + size gate:**

   ```typescript
   build: {
     target: 'es2022',
     rollupOptions: {
       output: {
         manualChunks: {
           react: ['react', 'react-dom'],
           radix: ['@radix-ui/react-select', '@radix-ui/react-radio-group',
                   '@radix-ui/react-slider', '@radix-ui/react-tooltip',
                   '@radix-ui/react-slot', '@radix-ui/react-label'],
         },
       },
     },
   },
   ```

5. **CI size assertion (dev-only, not shipped):** `rollup-plugin-visualizer` + a script that
   fails the build if the app (non-react) chunk exceeds the agreed gate (e.g., 25 KB gzipped).
   `npm run build --mode analyze` produces the report (H1/H6).
6. **Minify:** default `esbuild` minify; no sourcemaps in prod; `es2022` target (PRD §5 browsers).

**Open item O1 (RESOLVED):** stakeholder signed off on relaxing the 50 KB gate to **< 100 KB
gzipped total JS** (app + Radix + icons + React vendor). The app+Radix+icons slice stays
tree-shaken to keep the total in the ~60–75 KB range.

---

## 8. Decision D3 — Clipboard Fallback (`file://` / non-secure contexts)

**Problem.** `navigator.clipboard.writeText` requires a secure context (`https`/`localhost`).
When the app is opened as a local `file://` (a first-class PRD deploy target), the API is
unavailable or rejects, so "Copiar enlace" must still work (T4).

**Decision.** Feature-detect on `isSecureContext && navigator.clipboard?.writeText`. On
unavailable/reject, fall back to a hidden, pre-selected `textarea` + deprecated
`document.execCommand('copy')`; if that also fails, reveal a read-only field with the URL
selected and instruct manual copy. The helper is pure (inject `navigator`/`document`) and
returns the method used so the UI can choose the toast text.

```typescript
// src/lib/clipboard.ts
interface CopyResult {
  ok: boolean;
  method: 'clipboard' | 'execCommand' | 'manual';
}

function fallbackExecCommand(text: string): boolean {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'absolute';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

async function copyToClipboard(text: string): Promise<CopyResult> {
  const secure =
    typeof window !== 'undefined' &&
    window.isSecureContext === true &&
    typeof navigator !== 'undefined' &&
    !!navigator.clipboard?.writeText;

  if (secure) {
    try {
      await navigator.clipboard.writeText(text);
      return { ok: true, method: 'clipboard' };
    } catch {
      /* fall through to legacy path */
    }
  }
  if (fallbackExecCommand(text)) return { ok: true, method: 'execCommand' };
  return { ok: false, method: 'manual' }; // UI reveals selectable field + manual hint
}
```

**Invariant:** the copy must execute **inside the user click handler** (both `writeText` and
`execCommand` require a user gesture) — `ShareButton`'s `onClick` calls `copyToClipboard` and
then toasts:

- `clipboard` / `execCommand` → "Enlace copiado".
- `manual` → reveal read-only `<input readOnly value={url} />` with `.select()` and toast
  "Seleccioná y copiá manualmente".

**Tests (≥90% on `src/lib/clipboard.ts`):** mock `navigator.clipboard.writeText` resolve/reject;
mock `window.isSecureContext`; mock `document.execCommand` true/false; verify each branch and
returned `method`.

---

## 9. Decision D4 — `aria-live` Debounce (no SR keystroke spam)

**Problem.** `ResultCard` exposes `aria-live="polite"` (PRD §4.4, `result-card` spec). Binding it
to raw input would queue an announcement per keystroke / per slider tick → screen-reader spam.

**Decision.** The live region renders a **derived announcement string** built from the committed
`Result`, passed through `useDebouncedValue(..., 500)`. Visual `ResultCard` uses `result`
directly (no debounce); only the SR text is debounced, so bursts collapse into one utterance.
The slider commit-time model (D1) already limits result changes to one per drag-release; the
debounce additionally guards keyboard arrow presses (each = a commit) and rapid form edits.

```typescript
// src/hooks/useDebouncedValue.ts
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);   // reset timer on every change → collapse bursts
  }, [value, delayMs]);
  return debounced;
}

// buildAnnouncement(result) → compact SR text, e.g.
// "Objetivo: 2.633 kcal por día. Proteína 197 g, Carbohidratos 263 g, Grasa 88 g.
//  Fórmula: Katch-McArdle."
const announcement = result ? buildAnnouncement(result) : '';
const announced = useDebouncedValue(announcement, 500);

// Render (persists across renders so only *content changes* are announced):
<div aria-live="polite" aria-atomic="true" className="sr-only">{announced}</div>
```

**Rules:**

- The live region node must persist (never unmount) and use `sr-only` (clip, not `display:none`).
- `aria-atomic="true"` so the whole message is read, not a diff.
- Announce only when `result` is non-null; when inputs are invalid the region stays empty (no
  stale announcement).
- 500 ms is below the typical SR "queue flush" window and above human keystroke cadence; tune in
  H6 polish if user testing suggests otherwise.

---

## 10. Persistence, Hydration & Share-URL Schema

### 10.1 Hydration precedence (resolves ambiguity)

On load, assemble `AppState` per-field with precedence **valid URL param > localStorage value >
default**. If any _recognized-but-malformed_ param is present → ignore offending params, load
defaults for those fields, toast `"Parámetros inválidos"` (`persistence-share` spec).

```
loadState():
  url = parseUrlParams()          # {s?,a?,h?,w?,b?,ac?,g?,p?,c?,f?,pr?}
  ls = readLocalStorage()         # try/catch → null on corrupt/blocked
  state = DEFAULTS
  for each field:
     if url has valid field: state[field] = url.field
     else if ls?.has(field): state[field] = ls.field   # validated
  state.macros = normalizeTo100(state.macros)          # D1 defensive
  state.preset = resolvePreset(state.macros) ?? state.preset
  return state
```

This guarantees a **shared link reproduces its exact state** (URL wins) while a plain reload
restores `localStorage` (PRD §4.5 / `persistence-share`).

### 10.2 Share-URL schema (supersedes PRD §4.5 — see §1 reconciliation)

Encode `Inputs + Macros + preset` so opening recreates exact state (`persistence-share` req):
`window.location.origin + '?' + URLSearchParams(params).toString()` where

| Param       | Field                 | Example               |
| ----------- | --------------------- | --------------------- |
| `s`         | sex                   | `male`                |
| `a`         | age                   | `30`                  |
| `h`         | heightCm              | `175`                 |
| `w`         | weightKg              | `75`                  |
| `b`         | bodyFatPct (optional) | `22` (omit if absent) |
| `ac`        | activity              | `moderate`            |
| `g`         | goal                  | `maintain`            |
| `p`,`c`,`f` | protein/carbs/fat %   | `30`,`40`,`30`        |
| `pr`        | preset                | `estandar`            |

`parseUrlParams` validates each against ranges/enums (reuse `validateInputs` + macro range);
invalid → dropped + toast. `localStorage` key stays `how-eat:v1` (versioned, `persistence-share`
req).

### 10.3 Validation / clamp (T5)

`validateInputs` returns `{ ok, errors, clamped }`. Empty required → `ok:false` + inline error
(disables calc). Out-of-range _value_ → clamp to nearest bound + toast (does not block).
Non-numeric/garbage → treat as empty (block). Negative/zero → rejected by range. Clamp ranges
are reused on hydrate so stored/URL values are sanitized before reaching the engine.

---

## 11. File Layout

```
how-eat/
├── index.html                 # CSP (no unsafe-inline/eval/network), meta, self-hosted Inter
├── package.json
├── tsconfig.json              # strict: true
├── vite.config.ts             # manualChunks (D2), es2022, analyze mode
├── tailwind.config.js  postcss.config.js
├── vitest.config.ts           # coverage: calculations 100%, storage/url 90%
├── public/
│   ├── favicon.svg
│   └── fonts/Inter.woff2      # self-hosted (no CDN — accessibility spec)
└── src/
    ├── main.tsx  App.tsx  index.css
    ├── types/index.ts         # Inputs, Macros, AppState, PresetKey, Result
    ├── lib/
    │   ├── calculations.ts     # pure engine (D-section §5) — 100% coverage
    │   ├── constants.ts        # ACTIVITY_MULTIPLIERS, GOAL_ADJUSTMENTS, PRESETS, labels
    │   ├── macros.ts           # D1: largestRemainder, redistributeMacros, normalizeTo100
    │   ├── storage.ts          # localStorage get/set/clear (try/catch, versioned key)
    │   ├── url.ts              # serialize/parse share params + hydrate precedence
    │   ├── clipboard.ts        # D3: copyToClipboard + execCommand fallback
    │   └── validation.ts       # validateInputs (T5 ranges/clamp), resolvePreset
    ├── hooks/
    │   ├── useCalculator.ts     # owns AppState + useMemo(result) + persist side-effect
    │   ├── useLocalStorage.ts  # generic safe wrapper
    │   └── useDebouncedValue.ts # D4
    ├── components/
    │   ├── ui/                 # shadcn copy-paste: button, input, label, select,
    │   │                       #   radio-group, slider, tooltip (Card/Separator → plain)
    │   ├── CalculatorForm.tsx  # D-section §3
    │   ├── MacroSliders.tsx    # D1 commit-time redistribution + SumBadge
    │   ├── ResultCard.tsx      # D4 live region + table/bars/actions
    │   ├── ShareButton.tsx     # D3
    │   └── Disclaimer.tsx
    └── i18n/es.json            # all user-facing strings (T6, Rioplatense)
```

---

## 12. Traceability Matrix

| Design element                                       | Spec / PRD                                                       |
| ---------------------------------------------------- | ---------------------------------------------------------------- |
| `calculate`, `selectBmr`, reference vectors          | `calculations` spec (all Requirements) + PRD §4.2                |
| T3 self-consistent calories                          | `calculations` "Macro calories derived from rounded grams"       |
| Validation/clamp T5                                  | `calculator-form` spec (Range/Empty/Clamp/Non-numeric)           |
| D1 largest-remainder + SumBadge + disable share      | `macro-sliders` spec (Sum invariant, T2, Presets, Badge)         |
| Default Estándar / 4 presets                         | `macro-sliders` spec (T1, Zone removed)                          |
| D4 aria-live debounce                                | `result-card` spec (aria-live, edge "must not spam")             |
| ResultCard table/bars/actions/formulaUsed            | `result-card` spec                                               |
| D3 clipboard fallback                                | `persistence-share` spec (Clipboard copy with fallback, T4)      |
| localStorage / URL hydrate / corrupt / blocked       | `persistence-share` spec                                         |
| D2 bundle budget, CSP, offline, light, es-only, a11y | `accessibility-responsive` spec + PRD §5                         |
| Share URL = Inputs+Macros+ preset                    | `persistence-share` spec (URL restoration recreates exact state) |

---

## 13. Risks & Open Items

| ID  | Risk                                                     | Mitigation / Resolution                                                                                                |
| --- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| O1  | **50 KB total infeasible** with React 18 + Radix (D2)    | RESOLVED: relax PRD §5 budget to **< 100 KB gzipped total JS** (signed off). App+Radix+icons tree-shaken to ~60–75 KB. |
| R1  | Katch-McArdle with guessed body-fat may be less accurate | Engine still honors PRD rule; `formulaUsed` surfaced (T7).                                                             |
| R2  | Silent clamp surprises user                              | Informative toast on every clamp (T5).                                                                                 |
| R3  | Rounding drift Σ macro calories vs `targetCalories`      | Accepted per T3; table is self-consistent (grams × 4/4/9).                                                             |
| R4  | `file://` shared link not portable across machines       | Documented limitation (`persistence-share` risk); copy still works locally via D3.                                     |
| R5  | `aria-live` still spammy with fast typing                | Debounce 500 ms + commit-time result (D4); tune in H6.                                                                 |

---

## 14. Acceptance / Review Checklist

- [ ] `macros` always sums to exactly 100 after any commit (unit-test `redistributeMacros` + `largestRemainder`; TDD table from `macro-sliders` spec reproduces 50/29/21, 40/30/30, etc.).
- [ ] `SumBadge` red "Suma X%" reachable during live drag; green "Suma 100%" on commit; share disabled when `sum !== 100`.
- [ ] Bundle: app+Radix+icons chunk under agreed gate; `npm run build --mode analyze` report clean; per-icon lucide imports verified.
- [ ] `copyToClipboard` works in secure context (clipboard) and `file://` (execCommand), with `manual` fallback; returns correct `method`.
- [ ] `aria-live` region announces only committed/debounced results; no per-keystroke spam.
- [ ] Share URL reproduces exact `Inputs + Macros + preset`; invalid/partial params handled with toast; `localStorage` corrupt/blocked degrades gracefully.
- [ ] `calculations.ts` at 100% line/branch; vectors A–C exact; `formulaUsed` correct on every branch; no `NaN`/`Infinity` on extremes.
- [ ] `tsc --noEmit` 0 errors; ESLint/Prettier clean; strict CSP, no `eval`/dynamic `innerHTML`/network.
