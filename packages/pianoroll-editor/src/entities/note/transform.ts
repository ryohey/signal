import { NoteNumber } from "@signal-app/core"
import { NoteEvent } from "./NoteEvent"

export const moveEvent =
  (deltaTick: number) =>
  (event: NoteEvent): NoteEvent => ({
    ...event,
    tick: event.tick + deltaTick,
  })

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
