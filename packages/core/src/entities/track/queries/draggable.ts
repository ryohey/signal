import { max, min } from "lodash"
import { MaxNoteNumber } from "../../../helpers"
import { isNoteEvent } from "../../event"
import { Range } from "../../geometry/Range"
import { getEventById } from "./basic"
import { getNotesByIds } from "./note"
import { TrackEventsQuery } from "./type"

interface NotePoint {
  readonly tick: number
  readonly noteNumber: number
}

export const getDraggablePosition =
  (
    noteId: number,
    position: "left" | "center" | "right",
  ): TrackEventsQuery<NotePoint | null> =>
  (events) => {
    const note = getEventById(noteId)(events)
    if (note === undefined || !isNoteEvent(note)) {
      return null
    }
    switch (position) {
      case "center":
        return note
      case "left":
        return note
      case "right":
        return {
          tick: note.tick + note.duration,
          noteNumber: note.noteNumber,
        }
    }
  }

export const getDraggableArea =
  (
    noteId: number,
    selectedNoteIds: readonly number[],
    position: "left" | "center" | "right",
    minLength: number = 0,
  ): TrackEventsQuery<{
    tickRange: Range
    noteNumberRange: Range
  } | null> =>
  (events) => {
    const note = getEventById(noteId)(events)
    if (note === undefined || !isNoteEvent(note)) {
      return null
    }
    const notes = getNotesByIds(selectedNoteIds)(events)

    const minTick = min(notes.map((n) => n.tick)) ?? 0
    const tickLowerBound = note.tick - minTick
    switch (position) {
      case "center": {
        const maxNoteNumber = max(notes.map((n) => n.noteNumber)) ?? 0
        const minNoteNumber = min(notes.map((n) => n.noteNumber)) ?? 0
        const noteNumberLowerBound = note.noteNumber - minNoteNumber
        const noteNumberUpperBound =
          MaxNoteNumber - (maxNoteNumber - note.noteNumber)
        return {
          tickRange: Range.create(tickLowerBound, Infinity),
          noteNumberRange: Range.create(
            noteNumberLowerBound,
            noteNumberUpperBound,
          ),
        }
      }
      case "left":
        return {
          tickRange: Range.create(
            tickLowerBound,
            note.tick + note.duration - minLength,
          ),
          noteNumberRange: Range.point(note.noteNumber), // allow to move only vertically
        }
      case "right":
        return {
          tickRange: Range.create(note.tick + minLength, Infinity),
          noteNumberRange: Range.point(note.noteNumber), // allow to move only vertically
        }
    }
  }
