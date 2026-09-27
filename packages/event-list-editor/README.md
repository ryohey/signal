# @signal-app/event-list-editor

## Purpose

Editor facade for the event list panel. Inspects and edits the events of a track in view, of any type.

## Entry Point

`createEventListEditor(track)` returns an `EventListEditor`. Set the visible events with `updateSelectedIds`, read `items`, and subscribe with `onItemsChanged`. Each item carries a controller that describes its label and editable fields. Call `dispose` when done.

## Responsibilities

- Choose which events to show: a selection or the whole track. Keep the list current as events change.
- Define how each event type is displayed and edited.
- Validate user input and convert it to event changes.
- Update and remove events.

## Design Notes

- This editor handles many event types side by side. It has no single item shape and no batch operations. Each operation is one direct edit.
- Callers never see raw events. Items carry their own display and edit behavior.
- An editor subscribes to its track. Dispose it when done.
