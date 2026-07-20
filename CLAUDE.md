# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands

- `npm start` - Start development tasks via Turbo (`turbo run dev --parallel`)
- `npm run build` - Build app artifacts for distribution (`npm run build:app`)
- `npm test` - Run tests across all packages using turbo
- `npm run lint` - Run lint tasks via Turbo
- `npm run format` - Run format tasks via Turbo
- `npm run check` - Run check tasks via Turbo

### App-specific Commands

- `npm run dev -w app` - Start dev server for the main app
- `npm run build -w app` - Build the main React application
- `npm run test -w app` - Run tests for the app
- `npm run lint -w app` - Run Biome linting for the app
- `npm run format -w app` - Format app code with Biome
- `npm run check -w app` - Run Biome checks for the app
- `npm run typecheck -w app` - Run TypeScript type-check for app

### Electron Commands

- `npm run dev:electron` - Start Electron development (concurrently runs app dev server and electron)
- `npm run build:electron` - Build the Electron application
- `npm run make:electron` - Package Electron app for distribution
- `npm run make:darwin` - Package for macOS
- `npm run make:win` - Package for Windows

### Docker

- `docker compose up` - Run the entire application in Docker

## Architecture Overview

Signal is a web-based music sequencer built with React and TypeScript, with cross-platform Electron support. The project uses a monorepo structure managed by Turbo.

### Core Components

**Main Application (`/app`)**

- React application using Jotai for app/feature-side state
- WebGL-based rendering for performance-critical UI components (piano roll, arrange view)
- Web Audio API integration for MIDI playback and audio synthesis
- Feature-oriented architecture with hooks/scopes and reactive bridges to core

**Core Domain (`/packages/core`):**

- Core keeps its internal state implementation private
- App synchronization is done via `useSyncExternalStore`-compatible subscriptions

Representative core modules:

- `SongStore` - Current song lifecycle and change notifications
- Command services - Song/arrange/control mutation orchestration
- MIDI/device services and repositories

**Key Views:**

- Piano Roll Editor - MIDI note editing with WebGL-accelerated rendering
- Arrange View - Multi-track timeline view
- Tempo Graph - Tempo automation editing
- Control Pane - Parameter automation (velocity, pan, etc.)

**Packages (`/packages`)**

- `@signal-app/player` - Audio playback engine with SoundFont synthesis
- `@signal-app/api` - Firebase/Cloud integration for song storage
- `@signal-app/community` - Community features and song sharing
- `dialog-hooks` - React hooks for modal dialogs
- `@signal-app/firebaseui-web-react` - Firebase authentication UI wrapper
- `@signal-app/ui` - Shared design-system-like UI components

**Electron Application (`/electron`)**

- Cross-platform desktop wrapper
- File system access for local MIDI files
- Native OS integration (menus, file associations)

Note: The static website project has been moved to a separate repository and is not part of this workspace.

### Data Architecture

**Song Structure:**

- `Song` - Top-level container with tracks, tempo, time signatures
- `Track` - Individual instrument track with MIDI events
- `TrackEvent` - MIDI events (notes, control changes, program changes)

**Audio Pipeline:**

- Web Audio API context management in `RootStore`
- SoundFont-based synthesis via `SoundFontSynth`
- Real-time MIDI input/output through `MIDIInput`/`MIDIOutput`
- Audio rendering for export via `renderAudio`

### Technology Stack

- **Frontend:** React 19, TypeScript, Jotai, Emotion CSS-in-JS
- **Core State Engine:** Internal reactive domain engine (encapsulated within `@signal-app/core`)
- **Audio:** Web Audio API, SoundFont synthesis, WebMIDI API
- **Graphics:** WebGL for performance-critical rendering
- **Build/Quality:** Vite, Turbo (monorepo), Biome
- **Desktop:** Electron with Forge
- **Cloud:** Firebase (auth, storage), Vercel (hosting)

### File Organization

- Component co-location pattern: related files grouped by feature
- Shared utilities in `/helpers` and `/services`
- Domain entities in `/entities` (geometry, beats, selections, transforms)
- WebGL shaders and rendering code in `/gl` and component-specific shader directories

### Rendering and Performance Policy

This codebase is highly performance-sensitive. Minimize React re-renders and avoid broad prop drilling for high-churn editor data.

Preferred pattern:

- Leaf components fetch required data via focused hooks.
- Parent components pass only structural/static props when possible.
- Use memoized derived data and targeted subscriptions.

Example pattern:

- Prefer `<Notes zIndex={2} />` where `Notes` internally uses `useNotes()`
- Avoid `<Notes notes={...} selectedNoteIds={...} zIndex={2} />` when it causes wider invalidation and render fan-out

Relevant files:

- `app/src/features/piano-roll/components/canvas/Notes.tsx`
- `app/src/features/piano-roll/hooks/useNotes.tsx`

The application emphasizes real-time performance for audio and UI, using WebGL acceleration for intensive graphics operations and optimized audio scheduling for glitch-free playback.

## Documentation Map

- `ARCHITECTURE.md` - Current architecture overview and global policies
- `app/README.md` - App workspace structure and state boundary policy
- `app/src/features/*/README.md` - Feature-level architecture details
- `packages/*/README.md` - Package-specific design and API notes
