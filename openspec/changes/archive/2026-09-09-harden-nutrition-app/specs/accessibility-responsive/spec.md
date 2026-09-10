# Delta for Accessibility & Responsive

## ADDED Requirements

### Requirement: Accessible status and error communication

Import validation, migration recovery, optimizer status, offline failure, and update availability MUST be exposed in visible text and programmatically determinable status or alert semantics. Information MUST NOT depend on color alone.

#### Scenario: Infeasible plan announced

- GIVEN keyboard focus initiated plan generation
- WHEN generation returns infeasible
- THEN the reason SHALL be visible, programmatically announced, and reachable without pointer input

## MODIFIED Requirements

### Requirement: Keyboard operability

All calculator, diary date-navigation/editing, serving selection, file export/import, weekly-plan, offline/update, and existing interactions MUST be fully operable by keyboard with logical focus order and no keyboard trap.
(Previously: keyboard coverage named only the original calculator interactions.)

#### Scenario: Keyboard diary and import path

- GIVEN a user navigating only by keyboard
- WHEN they change diary date, edit an entry, and invoke file import
- THEN each action SHALL be reachable and operable with visible focus and focus SHALL return to a logical control after completion

### Requirement: Offline-first with Service Worker

After the first successful online load, the supported app experience MUST reload offline through a service-worker-backed cache lifecycle, subject to the explicit offline and update states in the PWA capability.
(Previously: offline behavior explicitly prohibited use of a Service Worker.)

#### Scenario: Offline reload

- GIVEN the current release loaded successfully once
- WHEN reopened without network
- THEN it SHALL render and support the defined core local workflows
