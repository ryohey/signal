# Tempo Editor Feature

## Purpose

Edit the song's tempo as a graph over time.

## Entry Point

`TempoEditor` is the feature's root component. It sets up the timeline scope and renders the toolbar and the `TempoGraph`.

## Responsibilities

- Draw tempo changes on the timeline.
- Draw, select, move, delete, copy, and paste tempo points.

## Design Notes

- Tempo editing uses the tempo editor package. The feature holds only UI state, such as tool and selection.
- Selection state is part of undo and redo.
- Scrolling, quantization, and beat display are shared with other timeline features.
