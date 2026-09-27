import { flatMap, Range } from "@signal-app/core"
import { flow } from "lodash"
import {
  NoteEvent,
  NoteTransform,
  toDraggableArea,
  toDraggablePosition,
} from "./entities"
import { NotePoint } from "./entities/NotePoint"
import { PianoRollEditorMutator } from "./mutations"
import { getNotesByIds, PianoRollEditorQuery } from "./queries"

export const draggedNote =
  (
    position: NotePoint,
    draggablePosition: "left" | "right" | "center",
  ): NoteTransform =>
  (note) => {
    switch (draggablePosition) {
      case "center": {
        return { ...note, ...position }
      }
      case "left": {
        return {
          ...note,
          tick: position.tick,
          duration: note.duration + note.tick - position.tick,
        }
      }
      case "right": {
        return {
          ...note,
          duration: position.tick - note.tick,
        }
      }
    }
  }

const toNullable = <T>(a: T | undefined): T | null => a ?? null

// queries

export const getDraggablePosition =
  (
    noteId: number,
    position: "left" | "center" | "right",
  ): PianoRollEditorQuery<NotePoint | null> =>
  (editor) =>
    flow(
      editor.getNoteById,
      toNullable,
      flatMap(toDraggablePosition(position)),
    )(noteId)

export const getDraggableArea =
  (
    noteId: number,
    selectedNoteIds: readonly number[],
    position: "left" | "center" | "right",
    minLength: number = 0,
  ): PianoRollEditorQuery<{
    tickRange: Range
    noteNumberRange: Range
  } | null> =>
  (editor) => {
    const note = editor.getNoteById(noteId)
    if (note === undefined) {
      return null
    }
    const notes = getNotesByIds(selectedNoteIds)(editor)
    return toDraggableArea(note, notes, position, minLength)
  }

// mutations

export const dragNote =
  (
    position: {
      tick: number
      noteNumber: number
    },
    noteId: number,
    draggablePosition: "left" | "right" | "center",
  ): PianoRollEditorMutator<NoteEvent | null> =>
  (editor) =>
    flow(
      editor.getNoteById,
      toNullable,
      flatMap(draggedNote(position, draggablePosition)),
      flatMap(editor.updateNote),
    )(noteId)
