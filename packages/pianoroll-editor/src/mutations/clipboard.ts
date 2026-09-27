import { map } from "@signal-app/core"
import { flow } from "lodash"
import { moveEvent, NoteEvent, PianoNotesClipboardData } from "../entities"
import { addNotes } from "./mutations"
import { PianoRollEditorMutator } from "./type"

export const addClipboardNotes =
  (
    data: PianoNotesClipboardData,
    tick: number,
  ): PianoRollEditorMutator<readonly NoteEvent[]> =>
  (editor) =>
    flow(map(moveEvent(tick)), addNotes(editor))(data.notes)
