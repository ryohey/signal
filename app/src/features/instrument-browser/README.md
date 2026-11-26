# Instrument Browser Feature

## Purpose

Choose a track's instrument.

## Entry Point

`InstrumentBrowser` is the dialog. It lists instrument categories, instruments and their bank MSB and bank LSB variations from the loaded SoundFont, previews the selected one, and applies the choice to the track. The `useInstrumentBrowser` hook supplies its state and actions.

## Responsibilities

- Browse instruments by category and preview them.
- Change a track's instrument, or insert an instrument change at the current position.
- Switch a track to or from a rhythm track.

## Design Notes

- Instrument changes are track edits, so they are part of undo and redo.
- The dialog content mounts only while open. `useInstrumentBrowser` reads the track on mount, so no effect is needed to sync state. The only effect sends the track's patch back on close after a preview.
- Names come from the loaded SoundFont, picked the same way the synth picks presets. General MIDI names are only shown until a SoundFont is loaded.
- Categories and emojis still follow the General MIDI category of the program number, so a bank variation in another family keeps its program's emoji.
- Which presets can be picked (`melodicPatches` and `drumPatches`) and which preset a patch plays (`selectPreset`) both live in the player's `SoundFont`.
- A bank list only shows up when the program has more than one bank to choose from.
- The bank is stored as bank select events (CC#0 and CC#32) at the tick of the program change. They are only added when the bank is not 0 or the track already uses bank select. Bank select latches until the next program change, so an edit also writes the bank the next program change plays onto its tick when it has none, which keeps the program changes after it as they were. The piano roll's instrument mark moves and deletes them together with the program change. The event list edits them as separate raw events.
- A bank select stored after the program change on its tick is played and exported just before it (`sortForOutput` in core), so both are edited in place. A drag does not land a mark on a tick that has another program change. During a drag only the ticks change, and the banks are settled once on mouse up, like removing the program change at the start and writing its patch at the end.
- Previews send bank select and program change to the synth. When the browser closes after a preview, the track's own patch at the playhead is sent back once, since a previewed bank would otherwise stay latched.
- Only the patch (program and bank) is a draft until OK. Switching to or from a rhythm track is applied to the track immediately.
