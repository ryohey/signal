import { clamp } from "lodash"
import { NoteEvent } from "../event"
import { NoteNumber } from "../unit"

export type NoteTransform = (note: NoteEvent) => NoteEvent

export const quantizeNote =
  (quantizeRound: (tick: number) => number): NoteTransform =>
  (note) => ({
    ...note,
    tick: quantizeRound(note.tick),
  })

export const transposeNote =
  (deltaPitch: number): NoteTransform =>
  (note) => ({
    ...note,
    noteNumber: NoteNumber.clamp(note.noteNumber + deltaPitch),
  })

const applyOperation = (operation: BatchUpdateOperation, value: number) => {
  switch (operation.type) {
    case "set":
      return operation.value
    case "add":
      return value + operation.value
    case "multiply":
      return value * operation.value
  }
}

export interface BatchUpdateOperation {
  readonly type: "set" | "add" | "multiply"
  readonly value: number
}

export const batchUpdateNoteVelocity =
  (operation: BatchUpdateOperation): NoteTransform =>
  (note) => ({
    ...note,
    velocity: clamp(
      Math.floor(applyOperation(operation, note.velocity)),
      1,
      127,
    ),
  })

export const sortedNotes = (
  notes: readonly NoteEvent[],
): readonly NoteEvent[] =>
  [...notes].sort((a, b) => {
    if (a.tick < b.tick) {
      return -1
    }
    if (a.tick > b.tick) {
      return 1
    }
    if (a.noteNumber < b.noteNumber) {
      return -1
    }
    if (a.noteNumber > b.noteNumber) {
      return 1
    }
    return 0
  })
