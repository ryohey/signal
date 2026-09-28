import { NoteEvent, TrackEventStore } from "@signal-app/core"

export const addNote =
  (note: Omit<NoteEvent, "id">) =>
  (track: TrackEventStore): NoteEvent =>
    track.addEvent({
      ...note,
      type: "channel",
      subtype: "note",
    } as const)

export const updateNote =
  (id: number, update: Partial<NoteEvent>) =>
  (track: TrackEventStore): NoteEvent | null =>
    track.updateEvent(id, update)
