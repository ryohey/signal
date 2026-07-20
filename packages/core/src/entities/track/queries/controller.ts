import { flow, maxBy, min } from "lodash"
import { ControllerEvent, PitchBendEvent } from "midifile-ts"
import { filter, isEventInRange } from "../../../helpers"
import { ControlEventsClipboardData } from "../../clipboard/clipboardTypes"
import { isControllerEvent, isPitchBendEvent } from "../../event"
import { TrackEvent, TrackEventOf } from "../../event/TrackEvent"
import { Range } from "../../geometry/Range"
import { getEventsByIds } from "./composed"
import { TrackEventsQuery } from "./type"

export type ControlEvent = TrackEventOf<ControllerEvent | PitchBendEvent>

export type ControlEventPredicate = (event: TrackEvent) => event is ControlEvent

const isControlEvent = (event: TrackEvent): event is ControlEvent =>
  isControllerEvent(event) || isPitchBendEvent(event)

export const getControllerEventsByIds = (
  ids: readonly number[],
): TrackEventsQuery<
  readonly TrackEventOf<ControllerEvent | PitchBendEvent>[]
> => flow(getEventsByIds(ids), filter(isControlEvent))

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

export const getControlEventsInRangeWithPrevious = (
  predicate: ControlEventPredicate,
  tickRange: Range,
): ((events: readonly TrackEvent[]) => readonly ControlEvent[]) => {
  const [tickStart] = tickRange

  return (events) => {
    const controlEvents = events.filter(isControlEvent).filter(predicate)

    const eventsInRange = controlEvents.filter(isEventInRange(tickRange))
    const prevEvent = maxBy(
      controlEvents.filter((event) => event.tick < tickStart),
      (event) => event.tick,
    )

    return prevEvent ? [prevEvent, ...eventsInRange] : eventsInRange
  }
}
