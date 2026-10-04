# @signal-app/tempo-editor

## Purpose

Editor facade for tempo automation. Scoped to a song's conductor track.

## Entry Point

`createTempoEditor(conductorTrack)` returns a `TempoEditor`. Its methods work on `TempoItem` points in BPM, for example `setBpm`, `moveItems`, and `pasteItemsAtPosition`. `observeItems` subscribes to tempo changes.

## Responsibilities

- Read and observe tempo points.
- Add, move, remove, and duplicate tempo points. Set a tempo. Draw tempo changes over a range.
- Remove points that do not change the tempo.
- Copy tempo points to the clipboard and paste them.

## Design Notes

- Callers use BPM, never the MIDI representation.
- An editor binds to one conductor track. Create a new editor when the conductor track changes.
- Callers see only plain methods. The track stays hidden.
