# @signal-app/observable

## Purpose

Small observable primitives, shared across the monorepo, with no framework dependency.

## Entry Point

`ObservableValue` holds a value. Read it with `value`, change it with `set`, and subscribe with `onChanged`. Subscribers run only when the value actually changes.

## Responsibilities

- Event emitters and a common subscription contract.
- Values that notify on change.
- Helpers to combine and switch subscriptions.

## Design Notes

- An observable value notifies only on an actual change.

## Boundaries

- Generic. No UI framework, state library, or sequencer logic.
