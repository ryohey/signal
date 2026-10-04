import { flow } from "lodash"
import { type PianoNotesClipboardData, toNotesClipboardData } from "../entities"
import { getNotesByIds } from "./queries"
import type { PianoRollEditorQuery } from "./type"

export const getNotesClipboardData = (
  noteIds: readonly number[],
  startTick?: number,
): PianoRollEditorQuery<PianoNotesClipboardData | null> =>
  flow(getNotesByIds(noteIds), toNotesClipboardData(startTick))
