# @signal-app/core

## Purpose

The central sequencer domain: songs, tracks, and events, with the operations, conversions, storage, and device services around them.

## Entry Point

`Track` is the central class. It holds a track's events and properties, such as name, channel, and color, and publishes changes as subscriptions, such as `onEventsChanged`. It runs reads with `query` and writes with `mutate`, and groups writes with `transaction`. `Song` owns the list of tracks and song-wide values, such as timebase and measures.

## Responsibilities

- The song and track model and its observable state.
- Read and write operations on track events, composed from a small set of primitives.
- Song-level operations, such as adding and reordering tracks.
- Conversion to and from MIDI files.
- Persistent storage, including SoundFont management.
- Stores for the current song and MIDI devices.

## Design Notes

- Internal data structures stay private. Callers use exported operations and subscriptions, so internals can change freely.
- Only low-level primitives write to track events. Higher-level operations compose them. Reads use the same layers.
- State changes are subscriptions. The app bridges them into its UI. Core depends on no UI framework.
- Editing domains that need a richer surface get their own editor package on top of core.

## Boundaries

- No UI and no app-specific state.
- Types for a single editor belong to that editor's package.
