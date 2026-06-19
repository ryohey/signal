# Piano Roll Feature

## Purpose

The main note editing surface.

## Entry Point

`PianoRollEditor` is the feature's root component. It lays out the track list, the `PianoRoll` canvas, the event list, and the toolbar in split panes, and mounts the piano roll dialogs and edit menu.

## Responsibilities

- Draw the note grid, notes, keyboard, and ruler.
- Create, select, move, resize, and delete notes.
- Show other tracks' notes as ghost notes.
- Quantize, transpose, copy, and paste notes. Preview notes while editing.
- Coordinate nearby panes, such as the control pane and event list.

## Design Notes

- Note editing uses the piano roll editor package. The feature holds only UI state, such as selected track, selection, and tool.
- Selection state is part of undo and redo.
- Drawing is GPU-accelerated to stay smooth with many notes.
