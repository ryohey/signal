import {
  filter,
  getAll,
  getEventById,
  isNoteEvent,
  NoteEvent,
  TrackEventsQuery,
} from "@signal-app/core"
import { flow } from "lodash"

export const getAllNotes = (): TrackEventsQuery<readonly NoteEvent[]> =>
  flow(getAll, filter(isNoteEvent))

export const getNoteById =
  (id: number): TrackEventsQuery<NoteEvent | undefined> =>
  (context) => {
    const event = getEventById(id)(context)
    if (event && isNoteEvent(event)) {
      return event
    }
    return undefined
  }
