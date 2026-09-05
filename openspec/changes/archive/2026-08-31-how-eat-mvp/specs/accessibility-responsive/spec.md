# Accessibility & Responsive Specification

## Purpose

Defines the non-functional baseline: WCAG 2.1 AA accessibility, responsive layout
breakpoints, strict CSP / offline-first constraints, light theme, Spanish-only i18n, and
performance targets. These requirements apply app-wide, not to a single component.

Source: `PRD.md` §5, §7.1, §2; `openspec/changes/how-eat-mvp/proposal.md`
(Non-functional guardrails, Edge Cases).

## Requirements

### Requirement: WCAG 2.1 AA contrast

All text and meaningful UI MUST meet a contrast ratio ≥ 4.5:1 (≥ 3:1 for large text / UI
components).

#### Scenario: Contrast check

- GIVEN the rendered app
- WHEN colors are audited
- THEN no text/control SHALL fall below 4.5:1 (3:1 for large text/components)

### Requirement: Visible focus

Every interactive element MUST show a visible focus indicator when focused via keyboard.

#### Scenario: Keyboard focus

- GIVEN keyboard navigation through inputs/buttons/sliders
- WHEN an element receives focus
- THEN a visible focus ring/outline SHALL be present

### Requirement: Associated labels

All form controls MUST have associated labels (enforced per-component in `calculator-form`);
this requirement asserts the baseline app-wide.

#### Scenario: Accessible names

- GIVEN any control
- WHEN queried for its accessible name
- THEN it SHALL resolve to a label

### Requirement: ARIA live region

Recalculated results MUST be announced via an `aria-live` region (see `result-card`).

#### Scenario: Announcement

- GIVEN a result update
- WHEN announced
- THEN it SHALL be exposed to assistive tech politely

### Requirement: Responsive layout breakpoints

The layout MUST stack panels vertically below `768px` (form above, result below) and MUST
be side-by-side with the right panel `position: sticky; top: 1.5rem` at `≥ 768px`.

#### Scenario: Mobile (<768px)

- GIVEN viewport width `375px`
- WHEN laid out
- THEN panels SHALL stack vertically

#### Scenario: Desktop (≥768px)

- GIVEN viewport width `1024px`
- WHEN laid out
- THEN panels SHALL be side-by-side with the result panel sticky

### Requirement: Strict Content Security Policy

`index.html` MUST declare a strict CSP: no `unsafe-inline` scripts, no `eval`, no
third-party network sources, no dynamic `innerHTML`. All scripts are bundled/hashed.

#### Scenario: CSP enforced

- GIVEN the built `index.html`
- WHEN its CSP is inspected
- THEN it SHALL forbid `eval` and inline scripts and external network origins

### Requirement: No network / eval / dynamic innerHTML

The app MUST NOT make runtime network requests, MUST NOT use `eval`, and MUST NOT set
`innerHTML` with dynamic content.

#### Scenario: Static-only runtime

- GIVEN the running app
- WHEN observed at runtime
- THEN no fetch/XHR/eval/dynamic-innerHTML SHALL occur

### Requirement: Offline-first (no Service Worker)

After first load the app MUST function fully offline using only static files; no Service
Worker is used (PRD §2).

#### Scenario: Offline reload

- GIVEN the app was loaded once
- WHEN reopened without network
- THEN it SHALL render and calculate normally

### Requirement: Light theme only

The app MUST use a light theme and MUST NOT provide a dark-mode toggle in v1.

#### Scenario: Theme

- GIVEN the rendered app
- WHEN inspected
- THEN only the light palette SHALL apply; no dark-mode control SHALL exist

### Requirement: Spanish-only fixed locale, i18n-ready

The UI MUST display Spanish (Rioplatense neutro) with a fixed `es` locale (no language
switcher). All user-facing strings MUST be externalized in `src/i18n/es.json` so future
locales can be added without code changes.

#### Scenario: Fixed Spanish

- GIVEN the app runs
- WHEN UI strings render
- THEN they SHALL be Spanish and no locale switcher SHALL appear

### Requirement: Self-hosted assets

Fonts (e.g., Inter) MUST be self-hosted; no third-party font CDN requests.

#### Scenario: No font CDN

- GIVEN the built app
- WHEN network requests are observed
- THEN no external font request SHALL be made

### Requirement: Keyboard operability

All interactions (sliders, radios, selects, buttons, tooltips, copy) MUST be fully
operable via keyboard.

#### Scenario: Full keyboard path

- GIVEN a user navigating only by keyboard
- WHEN they traverse the app
- THEN every function SHALL be reachable and activatable

### Requirement: Performance targets (SHOULD)

The app SHOULD meet FCP < 1.5s, TTI < 2.5s on simulated 3G mobile, and a JS bundle
< 50KB gzipped.

#### Scenario: Bundle budget

- GIVEN a production build
- WHEN bundle size is measured
- THEN gzipped JS SHOULD be under 50KB

## Edge Cases (from proposal)

- **JS disabled / ancient browser** → unsupported (ES2022 target, last 2 browser versions);
  no graceful degradation required.
- **Bundle over budget** → build-time analysis; tree-shake + per-icon imports.
- **`file://` clipboard** → handled by `persistence-share` T4 fallback.

## Acceptance Criteria

- [ ] Lighthouse ≥ 90 across categories (PRD H6/H7).
- [ ] Manual/automated a11y audit passes WCAG 2.1 AA.
- [ ] Responsive verified at <768px and ≥768px.
- [ ] Strict CSP with no eval/inline/network; offline works after first load.
- [ ] Light theme only; Spanish fixed; keys externalized.
- [ ] `tsc --noEmit` 0 errors; ESLint/Prettier clean.

## Risks

- Bundle < 50KB gzipped with Radix + icons is tight (mitigation: tree-shake, per-icon
  imports, `vite build --mode analyze`).
