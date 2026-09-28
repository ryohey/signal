# Signal Architecture

Architecture map of the Signal monorepo.

## 1. Monorepo Structure

Turbo monorepo:

- `app`: React editor app.
- `packages`: Shared packages for app, community, and runtime.
- `electron`: Desktop shell.
- `functions`: Firebase Cloud Functions.

The static website lives in a separate repository.

## 2. Runtime Topology

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

## 3. State Boundary

- `app` composes UI and feature state with Jotai.
- `@signal-app/core` keeps its state implementation private.
- `app` reads core state through `useSyncExternalStore`-compatible subscriptions.

Core internals can change without breaking features.

## 4. Packages and Features

Each `packages/*` and `app/src/features/*` directory has its own README.

## 5. Cross-Cutting Patterns

- Domain logic hides behind `Track` methods and per-domain editor packages (§5.2, §5.3).
- Timeline and editor state lives in feature-scoped providers.
- Dialogs use promise-based `dialog-hooks`.
- Cloud and storage access goes through repositories.
- Web and Electron differences stay behind helpers and services.

### 5.1 Rendering

Editors are performance-critical. Leaf components read high-churn data through focused hooks; parents pass only structural props.

- Mount `<Notes zIndex={2} />`. `Notes` reads its data with `useNotes()`.
- Do not pass `notes` or `selectedNoteIds` down through props. Each prop layer widens re-render scope.
- Hooks return memoized derived data. Visual and interaction layers subscribe separately.

Example: [Notes.tsx](app/src/features/piano-roll/components/canvas/Notes.tsx), [useNotes.tsx](app/src/features/piano-roll/hooks/useNotes.tsx).

### 5.2 Domain Layering

Stateful entities own data. Curried functions hold logic. The entity binds the functions into methods.

- `Track` and `Song` keep data private and expose named methods and subscriptions.
- Logic is `(args) => (context) => result`. Queries read the context; mutations change it. Large operations compose small ones.
- `Track` binds its internal `TrackEventsQuery`/`TrackEventsMutator` functions with private `bindQuery`/`bindMutation` into methods such as `getEvents`, `addEvent`, and `setPan`. Each mutation runs in a transaction: one change, one notification.
- The functions and the event store are not exported. Code that must work with any event storage depends on `TrackEventStore`.
- Rules that need no stored state, such as event selectors and note transforms, are pure functions.
- Editor packages repeat this shape: an editor object owns the `Track` or `Song`, curried functions take it (or a small context interface), and `createXEditor` binds them.

Why: data flow stays explicit, storage can change behind methods, and small contexts are easy to test. This replaces the MobX design, which leaked mutable state into `app`.

Example: [Track.ts](packages/core/src/entities/track/Track.ts), [createPianoRollEditor.ts](packages/pianoroll-editor/src/createPianoRollEditor.ts).

### 5.3 Editor Packages

Each `*-editor` package's `createXEditor` returns a plain-method object. That object is the only path from `app` to a domain's storage.

- `app` never sees the concrete editor class or its query/mutation functions.
- Editors without batch logic, such as event-list and velocity, are plain classes that delegate to `Track`.
- `app` subscribes through the editor (`observeItems`, or `onItemsChanged` for event-list). The piano roll reads windowed notes through app hooks that subscribe to the track, and edits through its editor.
- Implementation can change freely behind the methods.

Most queries scan the full event list on every call. This is fine at current event counts. If a query becomes slow, replace it inside its editor package, for example with an index updated on mutation. `app` does not change.

### 5.4 Design Principles

- **Explicit over implicit.** Show where values change and who is notified at the call site, not in hidden dependency tracking.
- **Scoped over global.** Give code only the data it uses. Code for one track gets the track, not the song.
- **Proportional over speculative.** Add structure only for a current need.
- **Separate what changes for different reasons.** Keep UI state (scroll, tool, dialogs) apart from domain state (notes, tempo, automation).

These are judgment calls. When a change seems to need more structure or scope, check that the problem really needs it.

## 6. Platform Dependencies

- Web: Web Audio / AudioWorklet, Web MIDI, IndexedDB, File System Access (optional).
- Desktop: Electron preload APIs for files and SoundFont scanning.
- Cloud: Firebase Auth, Firestore, Functions.

Behavior varies with browser capability and permissions. Some flows need Firebase auth and matching indexes and rules. Export and playback speed depend on CPU and audio support.
