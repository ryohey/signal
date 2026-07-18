import { flow, min } from "lodash"
import { ControllerEvent, PitchBendEvent } from "midifile-ts"
import { filter } from "../../../helpers"
import { ControlEventsClipboardData } from "../../clipboard/clipboardTypes"
import { isControllerEvent, isPitchBendEvent } from "../../event"
import { TrackEventOf } from "../../event/TrackEvent"
import { getEventsByIds, TrackEventsQuery } from "./basic"

export const getControllerEventsByIds = (
  ids: readonly number[],
): TrackEventsQuery<
  readonly TrackEventOf<ControllerEvent | PitchBendEvent>[]
> =>
  flow(
    getEventsByIds(ids),
    filter((e) => isControllerEvent(e) || isPitchBendEvent(e)),
  )

export const getControlClipboardDataForSelection =
  (eventIds: number[]): TrackEventsQuery<ControlEventsClipboardData | null> =>
  (events) => {
    const controlEvents = getEventsByIds(eventIds)(events)

    const minTick = min(controlEvents.map((e) => e.tick))

    if (minTick === undefined) {
      return null
    }

    return {
      type: "control_events",
      events: controlEvents.map((e) => ({ ...e, tick: e.tick - minTick })),
    }
  }
