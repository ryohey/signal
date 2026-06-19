# @signal-app/ui

## Purpose

Reusable presentational UI components shared across Signal apps.

## Entry Point

`Menu` is a typical component. It takes a trigger element and menu items as children, and closes after an item is selected. Other components, such as `Dialog` and `Slider`, follow the same pattern: controlled props in, events out.

## Responsibilities

- Form controls, buttons, and sliders.
- Dialogs, tooltips, alerts, and progress indicators.
- Menus and context menus.
- Toolbars and layout helpers.

## Design Notes

- Components are accessible and keyboard-friendly.
- Styling follows the host app's theme.

## Boundaries

- No domain state or business logic. Consumers decide what to show and what happens on interaction.
