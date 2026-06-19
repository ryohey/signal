# Event List Feature

## Purpose

A panel that lists events of the selected track or notes, for precise inspection and editing.

## Entry Point

`EventList` is the panel component. It provides the event list editor for the selected track and renders one `EventListItem` row per event, with inline inputs for editing.

## Responsibilities

- Show events with their time and editable fields.
- Edit and delete events in the list.
- Follow the piano roll's track and note selection.

## Design Notes

- All reads and edits use the event list editor package. The package also defines how each event type is shown and edited. The feature only renders.
