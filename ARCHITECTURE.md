# Signal Architecture

This document summarizes the current architecture of the Signal monorepo, based on the implementation in `app`, `packages`, and runtime integrations.

## 1. Monorepo Structure

Signal is organized as a Turbo-managed monorepo with these primary areas:

- `app`: Main React editor application (piano roll, arrange, control, transport, etc.)
- `packages`: Reusable packages used by app/community/runtime layers
- `electron`: Desktop shell and native integrations
- `functions`: Firebase Cloud Functions

Note: the static website/landing project has been moved to a separate repository and is no longer part of this workspace.

Active package modules in `packages` are:

- `@signal-app/api`
- `@signal-app/community`
- `@signal-app/core`
- `dialog-hooks`
- `@signal-app/firebaseui-web-react`
- `@signal-app/player`
- `@signal-app/ui`

## 2. High-Level Runtime Topology

```mermaid
flowchart LR
  UI[app React UI\nfeatures/*] --> APPSTATE[Jotai feature/app state]
  APPSTATE --> BRIDGE[useSyncExternalStore bridges]
  BRIDGE --> CORE[@signal-app/core\ndomain engine]
  CORE --> PLAYER[@signal-app/player\nscheduling/rendering]
  PLAYER --> AUDIO[Web Audio / Synth outputs]
  UI --> API[@signal-app/api repositories]
  API --> FB[Firebase Auth/Firestore/Functions]
  UI --> ELEC[Electron API optional]
```

## 3. State Management Boundary (Key Policy)

Signal follows a strict app/core boundary:

- App layer (`app`) uses Jotai for UI and feature state composition.
- Core domain (`@signal-app/core`) keeps its internal state implementation private.
- App sync with core state is done via `useSyncExternalStore`-compatible subscriptions.

Why this matters:

- Keeps React integration stable and explicit.
- Prevents core implementation details from leaking into feature code.
- Enables future core internal changes with minimal app-level breakage.

## 4. Package Architecture

This section intentionally stays lightweight. See each package README for details.

- [packages/api/README.md](packages/api/README.md)
- [packages/community/README.md](packages/community/README.md)
- [packages/core/README.md](packages/core/README.md)
- [packages/dialog-hooks/README.md](packages/dialog-hooks/README.md)
- [packages/firebaseui-web-react/README.md](packages/firebaseui-web-react/README.md)
- [packages/player/README.md](packages/player/README.md)
- [packages/ui/README.md](packages/ui/README.md)

## 5. App Feature Architecture

This section intentionally stays lightweight. See each feature README for details.

- [app/src/features/arrange/README.md](app/src/features/arrange/README.md)
- [app/src/features/cloud-file/README.md](app/src/features/cloud-file/README.md)
- [app/src/features/control-pane/README.md](app/src/features/control-pane/README.md)
- [app/src/features/event-list/README.md](app/src/features/event-list/README.md)
- [app/src/features/export/README.md](app/src/features/export/README.md)
- [app/src/features/midi-device/README.md](app/src/features/midi-device/README.md)
- [app/src/features/piano-roll/README.md](app/src/features/piano-roll/README.md)
- [app/src/features/setting/README.md](app/src/features/setting/README.md)
- [app/src/features/soundfont/README.md](app/src/features/soundfont/README.md)
- [app/src/features/tempo-editor/README.md](app/src/features/tempo-editor/README.md)
- [app/src/features/track-list/README.md](app/src/features/track-list/README.md)
- [app/src/features/transport-panel/README.md](app/src/features/transport-panel/README.md)

## 6. Cross-Cutting Architectural Patterns

- Command-service based domain mutations (core).
- Feature-scoped state providers for timeline/editor concerns (app).
- Promise-based interaction UX via `dialog-hooks`.
- Repository abstraction for cloud/data boundaries.
- Dual-platform behavior (web + Electron) behind helper/service boundaries.

### 6.1 Rendering and Data-Access Strategy (Performance-Critical)

This project is designed with strict rendering discipline. A key policy is to avoid broad prop drilling for dynamic editor data and instead let leaf components subscribe to only what they need through feature hooks.

Primary goals:

- Minimize React re-render fan-out in performance-sensitive editors.
- Keep data dependencies local and explicit at the component that consumes them.
- Avoid parent components becoming high-frequency data relays.

What this means in practice:

- Container components pass structural props (for example layout/z-index), while high-churn state is read from hooks close to the rendering leaf.
- Feature hooks encapsulate selection/view/model transforms and return memoized derived data.
- Components are split so visual layers and interaction layers can subscribe independently.

Concrete example:

- [app/src/features/piano-roll/components/canvas/Notes.tsx](app/src/features/piano-roll/components/canvas/Notes.tsx)
- [app/src/features/piano-roll/hooks/useNotes.tsx](app/src/features/piano-roll/hooks/useNotes.tsx)

In this pattern, `Notes` is mounted as `<Notes zIndex={2} />` and retrieves note data via `useNotes()` internally, rather than receiving large changing props such as notes arrays and selection lists from ancestors.

Why this architecture is used:

- Passing `notes`, `selectedNoteIds`, and related derived values through multiple layers increases invalidation scope and causes avoidable renders.
- Reading data at the leaf through focused hooks reduces the number of components affected by each state change.
- This approach works with the project-wide state boundary: app-side Jotai composition plus subscribe/snapshot bridges to core state.

Related implementation techniques used across features:

- Scoped providers for timeline/editor domains.
- Derived data hooks with `useMemo`/`useCallback`.
- Targeted subscriptions (`useSyncExternalStore`) for core-backed reactive values.
- Component-level memoization on interactive/high-frequency subtrees.

## 7. Platform and External Dependencies

Web platform dependencies:

- Web Audio / AudioWorklet
- Web MIDI API
- IndexedDB
- File System Access API (optional)

Desktop platform dependencies:

- Electron preload APIs for file and soundfont scan operations

Cloud dependencies:

- Firebase Auth / Firestore / Functions

Operational implications:

- Feature behavior can vary by browser capability and permission state.
- Some flows require Firebase auth and backend index/rule consistency.
- Audio export/playback quality and speed depend on runtime CPU/audio support.

This file is intended as a practical architecture map for onboarding and feature-level navigation.
