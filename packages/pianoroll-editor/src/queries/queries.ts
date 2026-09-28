import { filter, isNotUndefined, map } from "@signal-app/core"
import { flow } from "lodash"
import {
  filterNotesInSelection,
  findNeighborNote,
  type NoteEvent,
  NoteSelection,
  toId,
} from "../entities"
import type { PianoRollEditorQuery } from "./type"

export const getNotesByIds =
  (ids: readonly number[]): PianoRollEditorQuery<readonly NoteEvent[]> =>
  (editor) =>
    ids.map(editor.getNoteById).filter(isNotUndefined)

export const getNeighborNote =
  (
    deltaIndex: number,
    selectedNoteIds: readonly number[],
  ): PianoRollEditorQuery<NoteEvent | null> =>
  (editor) => {
    const selectedNotes = getNotesByIds(selectedNoteIds)(editor)
    const allNotes = editor.getAllNotes()
    return findNeighborNote(deltaIndex, selectedNotes, allNotes)
  }

export const getAllNoteIds =
  (): PianoRollEditorQuery<readonly number[]> => (editor) =>
    editor.getAllNotes().map(toId)

const getNotesInSelection =
  (selection: NoteSelection): PianoRollEditorQuery<readonly NoteEvent[]> =>
  (editor) =>
    flow(editor.getAllNotes, filter(filterNotesInSelection(selection)))()

export const getNoteIdsInSelection = (
  selection: NoteSelection,
): PianoRollEditorQuery<readonly number[]> =>
  flow(getNotesInSelection(selection), map(toId))
