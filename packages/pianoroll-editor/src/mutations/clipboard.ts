import { map } from "@signal-app/core"
import { flow } from "lodash"
import {
  moveEvent,
  type NoteEvent,
  type PianoNotesClipboardData,
} from "../entities"
import { addNotes } from "./mutations"
import type { PianoRollEditorMutator } from "./type"

export const addClipboardNotes =
  (
    data: PianoNotesClipboardData,
    tick: number,
  ): PianoRollEditorMutator<readonly NoteEvent[]> =>
  (editor) =>
    flow(map(moveEvent(tick)), addNotes(editor))(data.notes)
