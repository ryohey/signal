import { isNoteEvent, NoteEvent } from "../../event"
import { getEventById } from "../queries/primitives"
import { updateEvent } from "./primitives"
import { TrackEventsMutator } from "./type"

export const dragNote =
  (
    position: Partial<{
      tick: number
      noteNumber: number
    }>,
    noteId: number,
    draggablePosition: "left" | "right" | "center",
  ): TrackEventsMutator<NoteEvent | null> =>
  (events) => {
    const note = getEventById(noteId)(events)
    if (note === undefined || !isNoteEvent(note)) {
      return null
    }
    switch (draggablePosition) {
      case "center": {
        return updateEvent<NoteEvent>(note.id, position)(events)
      }
      case "left": {
        if (position.tick === undefined) {
          return null
        }
        return updateEvent<NoteEvent>(note.id, {
          tick: position.tick,
          duration: note.duration + note.tick - position.tick,
        })(events)
      }
      case "right": {
        if (position.tick === undefined) {
          return null
        }
        return updateEvent<NoteEvent>(note.id, {
          duration: position.tick - note.tick,
        })(events)
      }
    }
  }
