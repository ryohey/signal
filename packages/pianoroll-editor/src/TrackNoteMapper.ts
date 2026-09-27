import {
  addEvent,
  filter,
  getAll,
  getEventById,
  isNoteEvent,
  Track,
  NoteEvent as TrackNoteEvent,
  updateEvent,
} from "@signal-app/core"
import { flow } from "lodash"
import { NoteEvent } from "./entities"
import { PianoRollMutationContext } from "./mutations"
import { PianoRollQueryContext } from "./queries"

export class TrackNoteMapper
  implements PianoRollQueryContext, PianoRollMutationContext
{
  constructor(private readonly track: Track) {}

  // query

  getNoteById = (id: number) => {
    const event = this.track.query(getEventById(id))
    if (event && isNoteEvent(event)) {
      return event
    }
    return undefined
  }

  getAllNotes = () => this.track.query(flow(getAll, filter(isNoteEvent)))

  // mutation

  addNote = (note: Omit<NoteEvent, "id">) =>
    this.track.mutate(
      addEvent<TrackNoteEvent>({
        ...note,
        type: "channel",
        subtype: "note",
      } as const),
    )

  removeNote = (id: number) => this.track.removeEvent(id)

  updateNote = (update: Partial<NoteEvent> & { id: number }) =>
    this.track.mutate(updateEvent(update.id, update)) as NoteEvent
}
