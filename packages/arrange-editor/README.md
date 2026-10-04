# @signal-app/arrange-editor

## Purpose

Editor facade for the arrange view. Edits selections that span multiple tracks of a song.

## Entry Point

`createArrangeEditor(song)` returns an `ArrangeEditor`. It is a plain object of query, mutation, and subscription methods, such as `moveEvents`, `getEventsClipboardData`, and `observeItems`. The arrange feature creates one per song and uses it for all event edits.

## Responsibilities

- Move, duplicate, delete, transpose, and batch-edit velocity of a selection.
- Copy a selection to the clipboard and paste it.
- Note data for drawing the arrange view.
- Track count, and notifications on track and event changes.

## Design Notes

- A selection is a tick range by a track range. It covers every event in it, not only notes. Moving, copying, or deleting a selection carries all its events. Note-only operations, such as transpose, skip other events but keep them in the selection.
- An event is identified by track and id, because ids are unique only within a track. Moving an event to another track removes it and adds it again, so it gets a new id.
- Each operation is one transaction across all affected tracks: one change notification, one undo step.
- Callers see only plain methods. The song and tracks stay hidden.

## Boundaries

- Adding, removing, duplicating, and reordering tracks are song-level operations and live outside this package.
