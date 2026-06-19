# dialog-hooks

## Purpose

Async/await dialogs for React. Show a dialog, prompt, toast, or progress indicator from any code path and await the result.

## Entry Point

`useDialog` is the typical hook. `show` opens an action dialog with a title, message, and actions, and returns a promise that resolves to the chosen action's key. `DialogProvider` renders the dialog component that the app supplies. Prompts, toasts, and progress follow the same provider-plus-hook shape.

## Responsibilities

- Action dialogs, text prompts, toasts, and progress overlays.
- Queue, resolve, and clean up each request.

## Design Notes

- Call sites use a linear flow, not open/close state in props.
- Consumers supply the visuals. The package has no visual design.
