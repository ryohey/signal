import { TrackEvent } from "../../event/TrackEvent"
import { TrackEventsQuery } from "./type"

export const getEventById =
  (id: number): TrackEventsQuery<TrackEvent | undefined> =>
  (events) =>
    events.get(id)

export const getAll = (): TrackEventsQuery<readonly TrackEvent[]> => (events) =>
  events.getArray()
