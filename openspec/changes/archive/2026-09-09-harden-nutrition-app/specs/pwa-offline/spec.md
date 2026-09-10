# PWA and Offline Specification

## Purpose

Define installable, local-only use after first load and a recoverable application-update lifecycle.

## Requirements

### Requirement: First-load offline prerequisite

After one successful online load of a supported release, the system MUST permit offline reload and core local workflows: calculator use, retained diary viewing/editing, bundled food search, and weekly planning. Offline mode MUST NOT imply remote synchronization.

#### Scenario: Reload without network

- GIVEN the current release completed one successful online load
- WHEN the user reloads offline
- THEN the app shell and core local workflows SHALL be available using local data

### Requirement: Installable application metadata

The delivered manifest and app shell MUST provide mutually consistent identity, icons, start location, display behavior, and theme metadata required by supported browsers for installation.

#### Scenario: Installability audit

- GIVEN a production build served from its supported base path
- WHEN installability is evaluated
- THEN manifest resources SHALL resolve and describe the running application consistently

### Requirement: Intentional cache lifecycle

Cached assets MUST belong to an identifiable release and obsolete caches MUST be invalidated without deleting user data. A release MUST NOT silently combine incompatible application assets.

#### Scenario: Activate updated release

- GIVEN an older release is cached and a newer release is available
- WHEN the newer release activates
- THEN obsolete application caches SHALL be retired while persisted user data remains intact

### Requirement: Recoverable update state

The system MUST surface an available update or cache failure when user action is needed. Applying an update MUST have a recoverable path and MUST NOT allow an incompatible bundle to silently reinterpret persisted schema data.

#### Scenario: Update available during use

- GIVEN a new service-worker release is waiting
- WHEN the app detects it
- THEN the user SHALL receive an understandable update state and MAY activate it without losing local data

### Requirement: Offline failure honesty

If required assets were not cached successfully, the system MUST present a recoverable offline failure instead of claiming complete offline readiness.

#### Scenario: Incomplete initial cache

- GIVEN the initial online load did not cache a required shell asset
- WHEN an offline reload cannot complete
- THEN an understandable failure and retry path SHALL be shown when the network returns
