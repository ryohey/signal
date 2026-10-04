import { isNotUndefined } from "../../../helpers"
import type { TrackEvent } from "../../event/TrackEvent"
import { getEventById } from "./primitives"
import type { TrackEventsQuery } from "./type"

export const getEventsByIds =
  (ids: readonly number[]): TrackEventsQuery<readonly TrackEvent[]> =>
  (events) =>
    ids.map((id) => getEventById(id)(events)).filter(isNotUndefined)
