# Track List Feature

## Purpose

The track list and per-track controls.

## Entry Point

`TrackList` renders one `TrackListItem` per track in a draggable list, plus an add-track button. Dragging a row reorders the tracks.

## Responsibilities

- Show each track's name, instrument, and activity.
- Mute, solo, and show a track as ghost notes.
- Add, reorder, rename, and remove tracks.

## Design Notes

- Track changes are song-level edits and are part of undo and redo.
