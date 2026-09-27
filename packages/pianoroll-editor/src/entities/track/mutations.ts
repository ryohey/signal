import {
  addEvent,
  NoteEvent,
  TrackEventsMutator,
  updateEvent,
} from "@signal-app/core"

export const addNote = (
  note: Omit<NoteEvent, "id">,
): TrackEventsMutator<NoteEvent> =>
  addEvent({
    ...note,
    type: "channel",
    subtype: "note",
  } as const)

export const updateNote = (
  id: number,
  update: Partial<NoteEvent>,
): TrackEventsMutator<NoteEvent | null> => updateEvent(id, update)
