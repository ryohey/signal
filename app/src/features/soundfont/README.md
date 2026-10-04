# SoundFont Feature

## Purpose

Choose and manage SoundFonts for playback.

## Entry Point

`SoundFontSettingView` is the settings screen. It lists available SoundFonts in `SoundFontList`, adds new ones from files, and on desktop shows the folders to scan.

## Responsibilities

- List built-in, downloaded, and user SoundFonts. Select one.
- Add and remove SoundFonts.
- On desktop, scan folders for SoundFont files.
- Load the selected SoundFont into the synthesizer.

## Design Notes

- Available sources differ between web and desktop.
- The selection persists across sessions.
