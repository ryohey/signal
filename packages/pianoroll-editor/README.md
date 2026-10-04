# @signal-app/pianoroll-editor

## Purpose

Editor facade for piano roll note editing. Scoped to one track.

## Entry Point

`createPianoRollEditor(song, trackId)` returns a `PianoRollEditor`. Its methods work on a simple note shape (`id`, `tick`, `duration`, `noteNumber`, `velocity`), for example `addNote`, `transposeNotes`, `dragNote`, and `getNoteIdsInSelection`. `transaction` groups several calls into one change.

## Responsibilities

- Add, update, and remove notes.
- Transpose, quantize, duplicate, clone, and drag notes.
- Select notes by area. Move to neighboring notes.
- Copy notes to the clipboard and paste them.

## Design Notes

- Callers use a simple note shape, not raw MIDI events.
- Operations are pure functions over a few note primitives. They compose and test easily.
- Callers can group operations into one transaction: one change notification, one undo step.
- Callers see only plain methods. The track stays hidden.

## Boundaries

- Velocity editing from the control pane uses the velocity editor package.
