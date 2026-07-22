import { flow } from "lodash"
import { ProgramChangeEvent } from "midifile-ts"
import { some } from "../../../helpers"
import { isProgramChangeEvent } from "../../event"
import { TrackEvent, TrackEventOf } from "../../event/TrackEvent"
import { getAll } from "./primitives"
import { TrackEventsQuery } from "./type"

export const findProgramChangeEventAtOrBefore =
  (tick: number) =>
  (
    events: readonly TrackEvent[],
  ): TrackEventOf<ProgramChangeEvent> | undefined => {
    let found: TrackEventOf<ProgramChangeEvent> | undefined

    for (const event of events) {
      if (!isProgramChangeEvent(event) || event.tick > tick) {
        continue
      }
      if (found === undefined || event.tick >= found.tick) {
        found = event
      }
    }

    return found
  }

export const getProgramChangeEventAtOrBefore = (
  tick: number,
): TrackEventsQuery<TrackEventOf<ProgramChangeEvent> | undefined> =>
  flow(getAll, findProgramChangeEventAtOrBefore(tick))

export const hasProgramChangeEventAfter = (
  tick: number,
): TrackEventsQuery<boolean> =>
  flow(
    getAll,
    some((event) => isProgramChangeEvent(event) && event.tick > tick),
  )
