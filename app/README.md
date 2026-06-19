# App Workspace Guide

This document explains the architecture and directory layout of the app workspace.

## Purpose

The app workspace contains the React application for composing, editing, arranging, and exporting songs.

## Directory Overview

- `src/features`: Feature modules (piano roll, arrange, transport, etc.)
- `src/components`: Shared React components
- `src/stores`: App integration stores and service adapters
- `src/entities`: Shared app-side entities
- `src/services`: Platform and browser service integrations
- `src/helpers`: Shared helper functions
- `src/player`: App-level playback orchestration
- `src/theme`: Theme and style tokens

## State Management Policy

Signal follows a strict app/core state boundary:

- The app layer uses Jotai for UI-driven state composition.
- The core domain engine uses MobX internally in `packages/core`.
- MobX internals are not exposed outside core.
- App synchronization with core is done through `useSyncExternalStore`-compatible adapters.

This policy keeps React integration predictable and prevents framework-specific leakage.

## Feature Conventions

Each feature in `src/features` should:

- Own feature UI, hooks, and feature-specific entities.
- Depend on stable package interfaces.
- Avoid direct imports of core MobX internals.

## Related Documents

- `../README.md`
- `../packages/core/README.md`
- `./src/features/*/README.md`
