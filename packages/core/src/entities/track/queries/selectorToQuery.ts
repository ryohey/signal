import { flow } from "lodash"
import type { TrackEvent } from "../../event/TrackEvent"
import { getAll } from "./primitives"
import { TrackEventsQuery } from "./type"

export const selectorToQuery = <T, S>(
  selector: (events: readonly TrackEvent[]) => S,
): TrackEventsQuery<S> => flow(getAll, selector)
