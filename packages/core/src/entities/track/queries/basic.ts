import { TrackEvent } from "../../event/TrackEvent"
import { TrackEventsContext } from "../TrackEventsContext"
import { TrackEventsQuery } from "./type"

type QueryTrackEvents = TrackEventsContext & {
  get(id: number): TrackEvent | undefined
  getArray(): readonly TrackEvent[]
}

const asQueryTrackEvents = (events: TrackEventsContext): QueryTrackEvents =>
  events as QueryTrackEvents

export const getEventById =
  (id: number): TrackEventsQuery<TrackEvent | undefined> =>
  (events) =>
    asQueryTrackEvents(events).get(id)

export const getAll: TrackEventsQuery<readonly TrackEvent[]> = (events) =>
  asQueryTrackEvents(events).getArray()
