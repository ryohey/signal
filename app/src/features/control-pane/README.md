# Control Pane Feature

## Purpose

The pane below the piano roll. Edits note velocity and continuous values, such as pitch bend and controllers.

## Entry Point

`ControlPane` is the feature's root component. It shows the velocity lane or a value lane for the selected mode, and provides the matching editor to it.

## Responsibilities

- Switch between the velocity lane and value lanes.
- Draw and edit values with pencil, curve, and selection tools.
- Edit existing points without creating new ones (edit tool: drag a point or a box-selected group, right-click for the context menu) and remove individual points by clicking or sweeping over them (erase tool).
- Copy, paste, and delete selected points.

## Design Notes

- Value lanes use the control editor package. The velocity lane uses the velocity editor package. Neither uses the piano roll's editor.
- Chosen lanes persist across sessions.
- Selection state is part of undo and redo.
