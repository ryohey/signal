import { isNotUndefined, map } from "@signal-app/core"
import { flow } from "lodash"
import {
  duplicatedNotes,
  type NoteEvent,
  quantizeNote,
  toId,
  transposeNote,
} from "../entities"
import { getNotesByIds } from "../queries"
import type { PianoRollEditorMutator, PianoRollMutationContext } from "./type"

export const updateNotes =
  (editor: PianoRollMutationContext) => (notes: readonly NoteEvent[]) =>
    notes.map(editor.updateNote)

export const addNotes =
  (editor: PianoRollMutationContext) =>
  (notes: readonly Omit<NoteEvent, "id">[]): readonly NoteEvent[] =>
    notes.map(editor.addNote).filter(isNotUndefined)

export const transposeNotes =
  (noteIds: readonly number[], deltaPitch: number): PianoRollEditorMutator =>
  (editor) =>
    flow(
      getNotesByIds(noteIds),
      map(transposeNote(deltaPitch)),
      updateNotes(editor),
    )(editor)

export const cloneNotes =
  (noteIds: readonly number[]): PianoRollEditorMutator<readonly number[]> =>
  (editor) =>
    flow(getNotesByIds(noteIds), map(editor.addNote), map(toId))(editor)

// duplicate notes with an optional deltaTick
// if deltaTick is 0, duplicate to the right of the selected notes
export const duplicateNotes = (
  noteIds: readonly number[],
  initialDeltaTick: number,
): PianoRollEditorMutator<{ addedNoteIds: number[]; deltaTick: number }> => {
  return (editor) => {
    const selectedNotes = getNotesByIds(noteIds)(editor)
    const { notes, deltaTick } = duplicatedNotes(
      selectedNotes,
      initialDeltaTick,
    )
    const addedNoteIds = addNotes(editor)(notes).map(toId)
    return { addedNoteIds, deltaTick }
  }
}

export const removeNotes =
  (noteIds: readonly number[]): PianoRollEditorMutator =>
  (editor) =>
    noteIds.forEach((id) => editor.removeNote(id))

export const quantizeNotes =
  (
    noteIds: readonly number[],
    quantizeRound: (tick: number) => number,
  ): PianoRollEditorMutator<readonly NoteEvent[]> =>
  (editor) =>
    flow(
      getNotesByIds(noteIds),
      map(quantizeNote(quantizeRound)),
      updateNotes(editor),
    )(editor)
