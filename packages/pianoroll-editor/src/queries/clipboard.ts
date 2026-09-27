import { flow } from "lodash"
import { PianoNotesClipboardData, toNotesClipboardData } from "../entities"
import { getNotesByIds } from "./queries"
import { PianoRollEditorQuery } from "./type"

export const getNotesClipboardData = (
  noteIds: readonly number[],
  startTick?: number,
): PianoRollEditorQuery<PianoNotesClipboardData | null> =>
  flow(getNotesByIds(noteIds), toNotesClipboardData(startTick))
