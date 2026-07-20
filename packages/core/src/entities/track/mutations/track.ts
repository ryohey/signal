import { flow } from "lodash"
import { AnyEvent } from "midifile-ts"
import { closedRange, filter, map } from "../../../helpers"
import { getRedundantEvents, getTickSpan } from "../../event"
import { TrackEvent } from "../../event/TrackEvent"
import { moveEvent } from "../../event/transforms"
import { Range } from "../../geometry/Range"
import { getAll } from "../queries/basic"
import { getEventsByIds } from "../queries/composed"
import { addEvents, createOrUpdate, removeEvents } from "./composed"
import { combineMutators } from "./higherOrder"
import { TrackEventsMutator } from "./type"

export const duplicateEvents =
  (eventIds: readonly number[]): TrackEventsMutator<number[]> =>
  (events) => {
    const selectedEvents = getEventsByIds(eventIds)(events)

    // move to the end of selection
    const deltaTick = getTickSpan(selectedEvents)

    const newEvents = selectedEvents.map(moveEvent(deltaTick))

    return combineMutators(...newEvents.map((e) => createOrUpdate(e)))(
      events,
    ).map((e) => e.id)
  }

export const removeRedundantEvents =
  <T extends TrackEvent>(
    event: T & { subtype?: string; controllerType?: number },
  ): TrackEventsMutator =>
  (events) => {
    const eventsIdsToRemove = flow(
      getAll,
      getRedundantEvents(event),
      filter((e) => e.id !== event.id),
      map((e) => e.id),
    )(events)
    removeEvents(eventsIdsToRemove)(events)
  }

export const removeRedundantEventsForEventIds =
  (eventIds: readonly number[]): TrackEventsMutator =>
  (events) => {
    const controllerEvents = getEventsByIds(eventIds)(events)
    combineMutators(...controllerEvents.map(removeRedundantEvents))(events)
  }

const interpolate = (
  valueRange: Range,
  tickRange: Range,
  easing: (t: number) => number,
) => {
  const [startValue, endValue] = valueRange
  const [startTick, endTick] = tickRange

  return endTick === startTick
    ? () => endValue
    : (tick: number) => {
        const t = (tick - startTick) / (endTick - startTick)
        const easedT = easing(t)
        const value = startValue + easedT * (endValue - startValue)
        return Math.floor(Range.clamp(valueRange, value))
      }
}

// Update events in the range with easing interpolation values
export const updateEventsInRangeWithEasing =
  (
    filterEvent: (e: TrackEvent) => boolean,
    createEvent: (value: number) => AnyEvent,
    quantizeFloor: (tick: number) => number,
    quantizeUnit: number,
    valueRange: Range,
    tickRange: Range,
    easing: (t: number) => number,
  ): TrackEventsMutator =>
  (events) => {
    const [startTick, endTick] = tickRange
    const quantizedStartTick = quantizeFloor(Math.max(0, startTick))
    const quantizedEndTick = quantizeFloor(Math.max(0, endTick))

    const getValue = interpolate(valueRange, tickRange, easing)

    const eventUpdateStartTick = Math.min(startTick, quantizedStartTick)
    const eventUpdateEndTick = Math.max(endTick, quantizedEndTick)

    const filteredEvents = flow(
      getAll,
      filter(filterEvent),
      filter(
        (e) =>
          e.tick !== startTick &&
          e.tick >= eventUpdateStartTick &&
          e.tick <= eventUpdateEndTick,
      ),
    )(events)

    removeEvents(filteredEvents.map((e) => e.id))(events)

    const values = closedRange(
      quantizedStartTick,
      quantizedEndTick,
      quantizeUnit,
    )
    const eventsToAdd = values.map((tick) => ({
      ...createEvent(getValue(tick)),
      tick,
    }))

    addEvents(eventsToAdd)(events)
  }

const linearEasing = (t: number) => t

// Update  events in the range with linear interpolation values
export const updateEventsInRange = (
  filterEvent: (e: TrackEvent) => boolean,
  createEvent: (value: number) => AnyEvent,
  quantizeFloor: (tick: number) => number,
  quantizeUnit: number,
  valueRange: Range,
  tickRange: Range,
): TrackEventsMutator =>
  updateEventsInRangeWithEasing(
    filterEvent,
    createEvent,
    quantizeFloor,
    quantizeUnit,
    valueRange,
    tickRange,
    linearEasing,
  )
