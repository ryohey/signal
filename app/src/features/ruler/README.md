# Ruler Feature

## Purpose

The timeline ruler shown above the piano roll, arrange view, and tempo graph.

## Entry Point

`PianoRuler` is the ruler component. It draws beats, time signatures, and the loop range on `CanvasPianoRuler`. Clicking seeks the playback position. Its context menu adds time signatures, and double-clicking a time signature opens `TimeSignatureDialog` to edit it.

## Responsibilities

- Draw beats, measure numbers, time signatures, and the loop range.
- Seek playback by clicking. Set the loop start and end with modifier clicks.
- Add and edit time signatures.

## Design Notes

- The ruler follows the scroll and zoom of the timeline feature that hosts it, so every timeline shares one ruler implementation.
- Time signature changes are song edits and are part of undo and redo.
