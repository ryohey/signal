# Instrument Browser Feature

## Purpose

Choose a track's instrument.

## Entry Point

`InstrumentBrowser` is the dialog. It lists instrument categories and instruments, previews the selected one, and applies the choice to the track. The `useInstrumentBrowser` hook supplies its state and actions.

## Responsibilities

- Browse instruments by category and preview them.
- Change a track's instrument, or insert an instrument change at the current position.
- Switch a track to or from a rhythm track.

## Design Notes

- Instrument changes are track edits, so they are part of undo and redo.
