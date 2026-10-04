# Export Feature

## Purpose

Export a song as audio.

## Entry Point

`ExportProgressDialog` shows export progress with a cancel button. The `useExport` hook starts the export and drives the dialog.

## Responsibilities

- Render the song with the current SoundFont and encode it to an audio file.
- Show progress. Allow cancel.
- Warn when the song is too short.

## Design Notes

- Rendering runs offline, apart from realtime playback, and can be cancelled at any time.
