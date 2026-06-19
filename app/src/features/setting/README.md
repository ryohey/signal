# Setting Feature

## Purpose

App settings.

## Entry Point

`SettingDialog` is the settings modal. It shows `SettingNavigation` on the side and the selected page, such as general, MIDI device, or SoundFont settings.

## Responsibilities

- Settings such as language, theme, and note label display.
- Persist settings across sessions.

## Design Notes

- Settings are plain stored values. The parts of the app that use them apply their effects.
