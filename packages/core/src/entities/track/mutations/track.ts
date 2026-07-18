import { AnyEvent } from "midifile-ts"
import { closedRange } from "../../../helpers"
import { getRedundantEvents, getTickSpan } from "../../event"
import { TrackEvent } from "../../event/TrackEvent"
import { moveEvent } from "../../event/transforms"
import { getEventsByIds } from "../queries/basic"
import { TrackEventsMutator } from "../Track"
import {
  addEvents,
  combineMutators,
  createOrUpdate,
  removeEvents,
} from "./basic"

export const duplicateEvents =
  (eventIds: number[]): TrackEventsMutator<number[]> =>
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
    const eventsIdsToRemove = getRedundantEvents(event)(events.getArray())
      .filter((e) => e.id !== event.id)
      .map((e) => e.id)
    removeEvents(eventsIdsToRemove)(events)
  }

export const removeRedundantEventsForEventIds =
  (eventIds: number[]): TrackEventsMutator =>
  (events) => {
    const controllerEvents = getEventsByIds(eventIds)(events)
    combineMutators(...controllerEvents.map(removeRedundantEvents))(events)
  }

const interpolate = (
  startValue: number,
  endValue: number,
  startTick: number,
  endTick: number,
  easing: (t: number) => number,
) =>
  endTick === startTick
    ? () => endValue
    : (tick: number) => {
        const t = (tick - startTick) / (endTick - startTick)
        const easedT = easing(t)
        const value = startValue + easedT * (endValue - startValue)
        return Math.floor(
          Math.min(
            Math.max(startValue, endValue),
            Math.max(Math.min(startValue, endValue), value),
          ),
        )
      }

// Update events in the range with easing interpolation values
export const updateEventsInRangeWithEasing =
  (
    filterEvent: (e: TrackEvent) => boolean,
    createEvent: (value: number) => AnyEvent,
    quantizeFloor: (tick: number) => number,
    quantizeUnit: number,
    startValue: number,
    endValue: number,
    startTick: number,
    endTick: number,
    easing: (t: number) => number,
  ): TrackEventsMutator =>
  (events) => {
    const minTick = Math.min(startTick, endTick)
    const maxTick = Math.max(startTick, endTick)
    const _startTick = quantizeFloor(Math.max(0, minTick))
    const _endTick = quantizeFloor(Math.max(0, maxTick))

    const getValue = interpolate(
      startValue,
      endValue,
      startTick,
      endTick,
      easing,
    )

    const filteredEvents = events
      .getArray()
      .filter(filterEvent)
      .filter(
        (e) =>
          e.tick !== startTick &&
          e.tick >= Math.min(minTick, _startTick) &&
          e.tick <= Math.max(maxTick, _endTick),
      )

    removeEvents(filteredEvents.map((e) => e.id))(events)

    const values = closedRange(_startTick, _endTick, quantizeUnit)
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
  startValue: number,
  endValue: number,
  startTick: number,
  endTick: number,
): TrackEventsMutator =>
  updateEventsInRangeWithEasing(
    filterEvent,
    createEvent,
    quantizeFloor,
    quantizeUnit,
    startValue,
    endValue,
    startTick,
    endTick,
    linearEasing,
  )
