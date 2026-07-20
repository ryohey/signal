import { isNotUndefined } from "../../../helpers"
import { TrackEvent } from "../../event/TrackEvent"
import { getAll, getEventById } from "./basic"
import { TrackEventsQuery } from "./type"

export const getEventsByIds =
  (ids: readonly number[]): TrackEventsQuery<readonly TrackEvent[]> =>
  (events) =>
    ids.map((id) => getEventById(id)(events)).filter(isNotUndefined)

export const getEventsByIdsOrAll =
  (ids: readonly number[]): TrackEventsQuery<readonly TrackEvent[]> =>
  (events) => {
    if (ids.length === 0) {
      return getAll(events)
    }
    return [...getEventsByIds(ids)(events)].sort((a, b) => a.tick - b.tick)
  }
