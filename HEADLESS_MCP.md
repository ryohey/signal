# Headless Signal MCP

This fork can run Signal's MIDI engine as a standalone MCP server. It does not
start the web application, open a browser, or require a connected UI. The MCP
process owns an in-memory Signal project and can import, edit, render, and export
it directly.

## Start

```sh
npm install
npm run mcp
```

Register it with an MCP client such as Codex:

```sh
codex mcp add signal-headless -- npm --prefix /absolute/path/to/signal run mcp
```

## Capabilities

- Read and replace the complete in-memory project.
- Import and export Standard MIDI files.
- Create, update, duplicate, and delete tracks.
- Add, update, delete, duplicate, transpose, and quantize MIDI notes.
- Change project metadata, tempo, time signature, channels, programs, volume,
  and pan.
- Undo and redo edits.
- Render the current project or a specified MIDI file directly to MP3 or WAV.

Audio rendering uses `spessasynth_core`, which runs directly in Node without Web
Audio. The bundled `electron/assets/soundfonts/A320U.sf2` is used by default. A
different SoundFont can be selected with `soundFontPath`.

## Verify

```sh
npm run test:mcp
```

The tests cover MIDI editing and round-trip import/export, undo/redo, and a real
headless MP3 render using the bundled SoundFont.
