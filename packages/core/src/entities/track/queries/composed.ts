import { isNotUndefined } from "../../../helpers"
import { TrackEvent } from "../../event/TrackEvent"
import { getEventById } from "./primitives"
import { TrackEventsQuery } from "./type"

export const getEventsByIds =
  (ids: readonly number[]): TrackEventsQuery<readonly TrackEvent[]> =>
  (events) =>
    ids.map((id) => getEventById(id)(events)).filter(isNotUndefined)
