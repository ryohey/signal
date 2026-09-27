import {
  filter,
  getAll,
  isNoteEvent,
  map,
  NoteEvent,
  TrackEventsQuery,
  TrackId,
} from "@signal-app/core"
import { flow } from "lodash"

export type ArrangeNoteContent = {
  readonly tick: number
  readonly duration: number
  readonly noteNumber: number
  readonly velocity: number
}

export type ArrangeNote = ArrangeNoteContent & {
  readonly id: number
  readonly event: NoteEvent
  readonly trackId: TrackId
  readonly trackIndex: number
}

export const getArrangeNotesInTrack = (
  trackId: TrackId,
  trackIndex: number,
): TrackEventsQuery<readonly ArrangeNote[]> =>
  flow(
    getAll,
    filter(isNoteEvent),
    map((event) => ({
      id: event.id,
      tick: event.tick,
      duration: event.duration,
      noteNumber: event.noteNumber,
      velocity: event.velocity,
      event,
      trackId,
      trackIndex,
    })),
  )
