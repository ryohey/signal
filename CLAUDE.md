# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands

- `npm start` - Start development server (runs turbo dev in parallel for app and static)
- `npm run build` - Build the entire project (app and static site)
- `npm test` - Run tests across all packages using turbo
- `npm run lint` - Run linting across all packages
- `npm run format` - Format code across all packages

### App-specific Commands

- `npm run dev -w app` - Start dev server for the main app
- `npm run build -w app` - Build the main React application
- `npm run test -w app` - Run Jest tests for the app

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

- React application using MobX for state management
- WebGL-based rendering for performance-critical UI components (piano roll, arrange view)
- Web Audio API integration for MIDI playback and audio synthesis
- Modular store architecture with reactive patterns

**Core Stores (MobX-based):**

- `RootStore` - Central store managing audio context, synthesizers, and MIDI I/O
- `SongStore` - Song data and track management
- `PianoRollStore` - Piano roll editor state
- `ArrangeViewStore` - Arrange view state and selections
- `ControlStore` - Control pane for automation data

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
- `firebaseui-web-react` - Firebase authentication components

**Electron Application (`/electron`)**

- Cross-platform desktop wrapper
- File system access for local MIDI files
- Native OS integration (menus, file associations)

**Static Site (`/static`)**

- Marketing/landing page built with Next.js

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

- **Frontend:** React 18, TypeScript, MobX, Emotion CSS-in-JS
- **Audio:** Web Audio API, SoundFont synthesis, WebMIDI API
- **Graphics:** WebGL for performance-critical rendering
- **Build:** Webpack, Turbo (monorepo), ESLint, Prettier
- **Desktop:** Electron with Forge
- **Cloud:** Firebase (auth, storage), Vercel (hosting)

### File Organization

- Component co-location pattern: related files grouped by feature
- Shared utilities in `/helpers` and `/services`
- Domain entities in `/entities` (geometry, beats, selections, transforms)
- WebGL shaders and rendering code in `/gl` and component-specific shader directories

The application emphasizes real-time performance for audio and UI, using WebGL acceleration for intensive graphics operations and optimized audio scheduling for glitch-free playback.
