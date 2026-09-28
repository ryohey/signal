# @signal-app/velocity-editor

## Purpose

Editor facade for the control pane's velocity lane. Scoped to one track.

## Entry Point

`createVelocityEditor(track)` returns a `VelocityEditor`. `getNotesInRange` returns `VelocityItem`s (`id`, `tick`, `velocity`), `setVelocity` sets notes to one value, and `updateVelocityInRange` draws a linear ramp. `observeItems` subscribes to note changes.

## Responsibilities

- Read and observe note velocities in a range.
- Set the velocity of notes.
- Draw velocities over a range with linear interpolation, for selected notes or all notes.

## Design Notes

- Velocity belongs to notes, not to value events. It has its own editor, not a value lane.
- The control pane edits velocity without the piano roll's editor.
- Callers see only plain methods. The track stays hidden.
