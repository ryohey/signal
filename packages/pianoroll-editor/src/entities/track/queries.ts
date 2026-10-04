import {
  isNoteEvent,
  type NoteEvent,
  type TrackEventStore,
} from "@signal-app/core"

export const getAllNotes = () => (track: TrackEventStore) =>
  track.getEvents().filter(isNoteEvent)

export const getNoteById =
  (id: number) =>
  (track: TrackEventStore): NoteEvent | undefined => {
    const event = track.getEventById(id)
    if (event && isNoteEvent(event)) {
      return event
    }
    return undefined
  }
