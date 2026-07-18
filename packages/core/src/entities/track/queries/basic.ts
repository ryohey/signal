import { isNotUndefined } from "../../../helpers"
import { TrackEvent } from "../../event/TrackEvent"

interface ReadOnlyTrackEvents {
  get(id: number): TrackEvent | undefined
  getArray(): readonly TrackEvent[]
}

export type TrackEventsQuery<T> = (events: ReadOnlyTrackEvents) => T

export const getEventsByIds =
  (ids: readonly number[]): TrackEventsQuery<readonly TrackEvent[]> =>
  (events) =>
    ids.map((id) => events.get(id)).filter(isNotUndefined)
