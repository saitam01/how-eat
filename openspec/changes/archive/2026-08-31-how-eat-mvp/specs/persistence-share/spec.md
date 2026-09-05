# Persistence & Share Specification

## Purpose

Defines `localStorage` persistence of the last `Inputs + Macros` and URL query-param
sharing that recreates exact state. Covers `src/lib/storage.ts`, `src/lib/url.ts`, and the
hydration logic in `useLocalStorage` / `useCalculator`.

Source: `PRD.md` §4.5, §8; `openspec/changes/how-eat-mvp/proposal.md`
(Persistence & sharing, Edge Cases, T4).

## Requirements

### Requirement: localStorage persistence

The system MUST write the current `Inputs + Macros` as JSON to `localStorage` key
`how-eat:v1` whenever a valid calculation occurs.

#### Scenario: Save on calculate

- GIVEN a valid `Inputs + Macros`
- WHEN the user calculates
- THEN `localStorage['how-eat:v1']` SHALL contain the serialized JSON

### Requirement: Hydration on load

On load the system MUST hydrate the form from `localStorage` when the stored value is
valid; otherwise fall back to defaults (after corrupt-state cleanup).

#### Scenario: Restore valid state

- GIVEN `localStorage['how-eat:v1']` holds a valid object
- WHEN the app loads
- THEN the form SHALL reflect the stored `Inputs + Macros`

### Requirement: Corrupt localStorage handling

The system MUST `try/catch` parse errors, clear the key, and load defaults.

#### Scenario: Corrupt JSON

- GIVEN `localStorage['how-eat:v1']` is malformed JSON
- WHEN the app loads
- THEN the key SHALL be removed and defaults loaded (no crash)

### Requirement: localStorage unavailable / quota / blocked

The system MUST `try/catch` access errors (private mode, quota) and fall back to an
in-memory state; persistence SHALL silently no-op.

#### Scenario: Blocked storage

- GIVEN `localStorage` throws on access
- WHEN the app reads/writes
- THEN it SHALL catch the error, keep in-memory state, and not crash

### Requirement: Share URL serialization

The share URL MUST be `window.location.origin + '?' + URLSearchParams(inputs).toString()`
capturing the exact `Inputs + Macros`.

#### Scenario: Build share link

- GIVEN `Inputs + Macros` for a known state
- WHEN the share link is built
- THEN the href SHALL equal `origin + '?' + serializedParams`

### Requirement: URL restoration recreates exact state

Opening a share URL MUST recreate the exact `Inputs + Macros` state (including macro
split).

#### Scenario: Open shared link

- GIVEN a share URL encoding `30/40/30` Estándar + specific inputs
- WHEN the URL is opened
- THEN the app SHALL reproduce the identical inputs and macro split

### Requirement: Invalid URL params

The system MUST ignore offending params, load defaults, and show a toast
"Parámetros inválidos".

#### Scenario: Garbage param

- GIVEN a URL with `?age=abc&sex=bogus`
- WHEN the app loads
- THEN invalid params SHALL be ignored, defaults loaded, toast shown

### Requirement: Partial URL params

The system MUST fill missing params from defaults and MUST NOT error.

#### Scenario: Partial params

- GIVEN a URL with only `?sex=female`
- WHEN the app loads
- THEN `sex='female'` applies and all other fields use defaults

### Requirement: Clipboard copy with fallback (T4)

The "Copiar enlace" action MUST copy the share URL using `navigator.clipboard` when
available and a graceful legacy fallback (hidden selectable field / `execCommand('copy')`)
when the context is insecure (e.g., `file://`), so copy works everywhere.

#### Scenario: Secure context

- GIVEN a secure origin with `navigator.clipboard`
- WHEN "Copiar enlace" is clicked
- THEN the URL SHALL be copied and a confirmation toast shown

#### Scenario: file:// fallback

- GIVEN a `file://` origin where `navigator.clipboard` is unavailable
- WHEN "Copiar enlace" is clicked
- THEN the fallback path SHALL copy the URL successfully

### Requirement: Versioned key

The persistence key MUST be versioned (`how-eat:v1`) so a future bump to `v2` cleanly
invalidates stale state.

#### Scenario: Key shape

- GIVEN any persistence write
- WHEN inspected
- THEN the key SHALL be exactly `how-eat:v1`

## Edge Cases (from proposal)

- **Corrupt JSON** → try/catch, clear, defaults.
- **Unavailable/quota/blocked** → try/catch, in-memory, no-op.
- **Invalid params** → ignore + toast "Parámetros inválidos".
- **Partial params** → fill from defaults, no error.
- **`file://`** → clipboard fallback required (T4).

## TDD / Coverage

- `src/lib/storage.ts` coverage target **90%**; `src/lib/url.ts` coverage target **90%**
  (config `coverage_targets`).
- Tests MUST cover: save/restore happy path, corrupt JSON, blocked storage, full/partial/
  invalid URL round-trips, and the clipboard fallback path.

## Acceptance Criteria

- [ ] Reload restores last valid calculation.
- [ ] Corrupt/blocked storage degrades gracefully to defaults/in-memory.
- [ ] Share URL recreates exact state; invalid/partial params handled.
- [ ] Copy works in secure and `file://` contexts.

## Risks

- A shared `file://` link is not portable across machines (documented limitation).
