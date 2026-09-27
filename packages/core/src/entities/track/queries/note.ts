import { flow } from "lodash"
import { filter, map } from "../../../helpers"
import { isNoteEvent, NoteEvent } from "../../event"
import { TrackId } from "../Track"
import { getEventsByIds } from "./composed"
import { getAll } from "./primitives"
import { TrackEventsQuery } from "./type"

export type ArrangeNote = {
  readonly tick: number
  readonly duration: number
  readonly event: NoteEvent
  readonly trackId: TrackId
  readonly trackIndex: number
}

export type NoteSelection = {
  readonly fromTick: number
  readonly toTick: number
  readonly fromNoteNumber: number
  readonly toNoteNumber: number
}

export const getNotesByIds = (
  ids: readonly number[],
): TrackEventsQuery<readonly NoteEvent[]> =>
  flow(getEventsByIds(ids), filter(isNoteEvent))

const getAllNotes = (): TrackEventsQuery<readonly NoteEvent[]> =>
  flow(getAll, filter(isNoteEvent))

export const getArrangeNotes = (
  trackId: TrackId,
  trackIndex: number,
): TrackEventsQuery<readonly ArrangeNote[]> =>
  flow(
    getAllNotes(),
    map((event) => ({
      tick: event.tick,
      duration: event.duration,
      event,
      trackId,
      trackIndex,
    })),
  )
