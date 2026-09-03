# @signal-app/control-editor

## Purpose

Editor facade for the control pane's value lanes, such as pitch bend and controllers. Scoped to one track and one kind of value.

## Entry Point

`createControlEditor(track, type)` returns a `ControlEditor` for one lane, such as pitch bend or one controller number. Its methods take and return `ControlItem` points (`id`, `tick`, `value`), for example `getItemsInRangeWithPrevious`, `updateItemsInRange`, and `pasteItemsAtPosition`.

## Responsibilities

- Read and observe the points in a lane.
- Add, move, remove, and duplicate points. Draw values with a pencil or a curve.
- Remove points that do not change the value.
- Copy points to the clipboard and paste them.

## Design Notes

- Each editor binds to one kind of value at construction. Callers use one simple point shape and never branch on the event type.
- Clipboard data records its kind of value. Pasting into an incompatible lane is refused, because value ranges differ.
- Callers see only plain methods. The track stays hidden.

## Boundaries

- The velocity lane edits notes, not value events, and has its own package.
