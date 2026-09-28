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
- `@signal-app/arrange-editor`
- `@signal-app/community`
- `@signal-app/control-editor`
- `@signal-app/velocity-editor`
- `@signal-app/core`
- `dialog-hooks`
- `@signal-app/event-list-editor`
- `@signal-app/firebaseui-web-react`
- `@signal-app/geometry`
- `@signal-app/observable`
- `@signal-app/pianoroll-editor`
- `@signal-app/player`
- `@signal-app/tempo-editor`
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
- [packages/arrange-editor/README.md](packages/arrange-editor/README.md)
- [packages/community/README.md](packages/community/README.md)
- [packages/control-editor/README.md](packages/control-editor/README.md)
- [packages/velocity-editor/README.md](packages/velocity-editor/README.md)
- [packages/core/README.md](packages/core/README.md)
- [packages/dialog-hooks/README.md](packages/dialog-hooks/README.md)
- [packages/event-list-editor/README.md](packages/event-list-editor/README.md)
- [packages/firebaseui-web-react/README.md](packages/firebaseui-web-react/README.md)
- [packages/observable/README.md](packages/observable/README.md)
- [packages/pianoroll-editor/README.md](packages/pianoroll-editor/README.md)
- [packages/player/README.md](packages/player/README.md)
- [packages/tempo-editor/README.md](packages/tempo-editor/README.md)
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

- Mutation/query based domain commands (core), with per-domain Editor facade packages (`@signal-app/tempo-editor`'s `createTempoEditor`, `@signal-app/control-editor`'s `createControlEditor`, `@signal-app/velocity-editor`'s `createVelocityEditor`, `@signal-app/pianoroll-editor`'s `createPianoRollEditor`, `@signal-app/arrange-editor`'s `createArrangeEditor`, `@signal-app/event-list-editor`'s `createEventListEditor`) providing bound query/mutate methods (or, for `event-list-editor`, a plain class - see §6.3) plus an observe subscription, without exposing `Song`/`Track` internals or the concrete editor class.
- Feature-scoped state providers for timeline/editor concerns (app).
- Promise-based interaction UX via `dialog-hooks`.
- Repository abstraction for cloud/data boundaries.
- Dual-platform behavior (web + Electron) behind helper/service boundaries.
- General design principles - explicit over implicit, scoped over global, proportional over speculative - guiding new code across every layer (§6.4).

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

### 6.2 Core Domain Layering: OOP State + Point-Free Business Logic

Core domain code (`@signal-app/core`) follows a deliberate two-layer split between stateful, identity-bearing objects and the business logic that operates on them.

Primary structure:

- Layers with state and identity (for example `Track`) are implemented in an OOP style, owning mutable internal state.
- Complex business logic on top of that state is expressed in a point-free style: small primitive operations combined through function composition, rather than as methods on stateful objects.

What this means in practice:

- Mutation/query modules split responsibilities by file: `primitives.ts` holds raw, imperative operations that touch mutable internal state directly (`getById`, `update`, `addEvent`, etc.); `composed.ts` holds only `Mutator`/`Query` functions built by composing `primitives.ts` functions.
- The mutable API used inside `primitives.ts` (the internal update/remove/create methods) is not exported from the module, so `composed.ts` — and any code outside the module — is type-level prevented from reaching for raw mutation directly.
- `composed.ts` is conceptually a "combinators" module: function combinators built on top of primitives.

Concrete example:

- [packages/core/src/entities/track/mutations/primitives.ts](packages/core/src/entities/track/mutations/primitives.ts)
- [packages/core/src/entities/track/mutations/composed.ts](packages/core/src/entities/track/mutations/composed.ts)

Why this architecture is used:

- The split follows the same lineage as Haskell's `ST` monad, which uses a phantom type to keep a mutable reference from escaping its boundary, and Clojure's transient/`persistent!` pattern, which mutates destructively inside a boundary and hands back an immutable value at the edge.
- It shares its goal with Immer's proxy-based structural sharing, but Signal mutates directly instead of going through a Proxy — trading some of Immer's ergonomics for lower overhead, closer to the transient/`ST` approach.
- It replaces the earlier MobX-based observable design, where `Track` exposed MobX observables directly to callers. Moving to `Track`-owned `query`/`mutate` functions reduces dependence on OOP-style mutable state (MobX observables) leaking into app code and avoids the cost of constructing and discarding large numbers of POJOs on every read/write, while keeping the business logic itself point-free and composable.

Related implementation techniques used across core:

- `entities/track/mutations`/`entities/track/queries` follow the `primitives.ts` / `composed.ts` split described above: `primitives.ts` is the only place allowed to touch `Track`'s actual private mutable state, so the split is a real boundary.
- The `mutations`/`queries` modules in the per-domain Editor facade packages (§6.3) build composed, multi-step business logic on top of each package's `TrackXEditor` class the same way, but that class's own methods (`addItem`, `getById`, ...) are already the single-item primitives - there is nothing further to guard by routing them through a separate `primitives.ts` wrapper. All four per-domain Editor facade packages reflect this: their `mutations`/`queries` types take the concrete `TrackTempoEditor`/`TrackControlEditor`/`TrackPianoRollEditor`/`SongArrangeEditor` directly (`(editor: TrackTempoEditor) => R`) instead of an opaque branded context, and `composed.ts`/`items.ts` call `editor.addItem(...)` etc. directly - TypeScript's own `private` on the class's backing `Track`/`Song` field already keeps composed logic from reaching past it, the same guarantee the branded context existed to fake with an unsafe cast, for a class with only one implementation and no test ever substituting another one. None of the four classes `implement`s a separate query/mutate interface either, for the same reason.
- Higher-order combinators (`combineMutators` in `mutations/higherOrder.ts`) compose primitive mutators without exposing mutable internals.

### 6.3 Editor Facade Packages as an Optimization Boundary

Per-domain Editor facade packages (`@signal-app/tempo-editor`, `@signal-app/control-editor`, `@signal-app/velocity-editor`, `@signal-app/pianoroll-editor`, `@signal-app/arrange-editor`, `@signal-app/event-list-editor`, and future ones following the same shape) exist for more than giving React a DTO instead of a raw `TrackEvent`/`midifile-ts` shape. The plain-method object returned by each `createXEditor` (for example `createTempoEditor(conductorTrack): TempoEditor`) is the *only* sanctioned access path between `app` and a domain's underlying storage.

Primary structure:

- `query`/`mutate` are an internal wiring detail, not part of the app-facing surface, for the four editors whose domain has complex enough business logic to warrant the point-free primitives/composed split (§6.2): each package's `XEditorQuery`/`XEditorMutator` functions (`getItemsInRangeWithPrevious`, `addItem`, ...) - typed to take the package's concrete `TrackXEditor` class, not an opaque branded context (§6.2) - are bound once, inside `createXEditor`, into flat top-level methods (`editor.getItemsInRangeWithPrevious(range)`, `editor.addItem(item)`). `app` calls those bound methods and never sees a `query`/`mutate` function or a `TrackXEditor` instance directly. `@signal-app/event-list-editor` is the exception: its domain is a generic, heterogeneous-by-design event inspector with no per-note-shaped batch logic to compose, so `TrackEventListEditor` is a plain class - each method is a single delegation to an existing core `Track` mutator/query - and `createEventListEditor` just constructs it, with no query/mutate binding step. See that package's README for the rationale.
- App code reaches a domain's data exclusively through those bound methods plus an observe subscription (`observeItems` for `tempo-editor`/`control-editor`/`velocity-editor`/`arrange-editor`; per-concern observables — `onNotesChanged`, `onWindowedEventsChanged`, `onIsRhythmTrackChanged` — for `pianoroll-editor`, which also owns its own windowing via `updateTickRange`; `onItemsChanged`/`updateSelectedIds` for `event-list-editor`, which owns its own selection-based filtering the same way). App code never reads a `Track`'s raw event array or filters by event subtype itself.
- What a bound query/mutate method (or, for `event-list-editor`, a plain method) does internally to satisfy a request — which data structure it reads, which algorithm it uses to search or filter — is free to change without changing the method's signature or its call sites.

What this means in practice:

- Most query implementations today do the simplest correct thing: read a track's full event list and filter/map it on every call. That is fine while the relevant event count is small.
- Because the Editor interface is the only door in, an implementation like that can later be replaced with something cheaper — for example an index kept up to date incrementally as mutations happen, instead of being recomputed by scanning on every read — without touching `app` or the Editor's public function signatures at all.

Why this architecture is used:

- It decouples *when* a query-performance problem is discovered from *where* it has to be fixed. A query that's cheap today (few events) can become a bottleneck as event counts grow (dense note tracks, for instance); fixing that should mean changing one implementation module inside the Editor package, not auditing and rewriting every `app` hook that happens to read that kind of event.
- It generalizes, one level up, the same "the read/write surface is the contract, internals can change freely" idea already used for `Track`'s `primitives.ts`/`composed.ts` split (§6.2): the Editor facade is the contract between `app` and `core`/its sibling packages, the way `composed.ts` is the contract between the rest of core and `Track`'s mutable internals.

Related implementation techniques used across features:

- `@signal-app/control-editor`'s `getItems` currently reads a track's full event list and filters it by predicate on every call — a known, live example of the kind of implementation detail this boundary is designed to let us change later without an `app`-side change.

### 6.4 Design Philosophy: Explicit, Scoped, Proportional

A few general principles run through the whole codebase - core, packages, and app alike - and should guide new code even in places none of the specific patterns above cover:

- **Explicit over implicit.** You should be able to find where a value changes and who gets notified by reading source, not by knowing a library's hidden dependency-tracking behavior. Prefer code where data flow is visible at the call site.
- **Scoped over global.** Give a module, class, or hook access only to the data it actually operates on - not a wider shared object "just in case." Something that touches one track shouldn't be handed the whole song, store, or app state.
- **Proportional over speculative.** Match the amount of structure - classes, indirection, generality - to the problem actually being solved today. Add a new abstraction, subscription, or capability when there's a concrete need for it now, not because it might help a hypothetical future feature.
- **Separate what changes for different reasons.** State driven by user interaction (scroll position, selected tool, open dialogs) and state driven by domain content changing (notes, tempo, automation data) have different lifetimes and different owners - keep them apart rather than merging them into one object for convenience.

These are judgment calls, not mechanical rules. When a change seems to want more structure or a wider scope than usual, treat that as a prompt to double-check the problem actually needs it - not as a reason to avoid solving it.

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
