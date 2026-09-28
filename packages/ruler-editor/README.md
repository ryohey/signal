# @signal-app/ruler-editor

## Purpose

Editor facade for the timeline ruler. Edits a song's time signatures.

## Entry Point

`createRulerEditor(song)` returns a `RulerEditor`. `getTimeSignatures` returns `TimeSignatureItem`s (`id`, `tick`, `numerator`, `denominator`) and keeps the same array until they change. `addTimeSignature` snaps to the start of the measure and skips a measure that already has one. `observeTimeSignatures` subscribes to changes.

## Responsibilities

- Read and observe time signatures.
- Add, update, and remove time signatures.
- Find the start tick of the measure that contains a tick.

## Design Notes

- Time signatures live on the conductor track, but measure boundaries depend on the whole song. The editor wraps the song, not one track, and follows conductor track changes.
- Callers see only plain methods. The song and tracks stay hidden.
