import {
  isNoteEvent,
  type TrackEventStore,
  type NoteEvent as TrackNoteEvent,
} from "@signal-app/core"
import type { NoteEvent } from "./entities"
import type { PianoRollMutationContext } from "./mutations"
import type { PianoRollQueryContext } from "./queries"

export class TrackNoteMapper
  implements PianoRollQueryContext, PianoRollMutationContext
{
  constructor(private readonly track: TrackEventStore) {}

  // query

  getNoteById = (id: number) => {
    const event = this.track.getEventById(id)
    if (event && isNoteEvent(event)) {
      return event
    }
    return undefined
  }

  getAllNotes = () => this.track.getEvents().filter(isNoteEvent)

  // mutation

  addNote = (note: Omit<NoteEvent, "id">) =>
    this.track.addEvent<TrackNoteEvent>({
      ...note,
      type: "channel",
      subtype: "note",
    } as const)

  removeNote = (id: number) => this.track.removeEvent(id)

  updateNote = (update: Partial<NoteEvent> & { id: number }) =>
    this.track.updateEvent(update.id, update) as NoteEvent
}
