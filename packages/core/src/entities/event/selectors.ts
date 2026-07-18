import { flow, max, maxBy, min } from "lodash"
import uniq from "lodash/uniq"
import { filter, isNotUndefined } from "../../helpers/array"
import {
  isControllerEvent,
  isControllerEventWithType,
  isEndOfTrackEvent,
  isNoteEvent,
  isPanEvent,
  isPitchBendEvent,
  isProgramChangeEvent,
  isRedundantEvents,
  isSetTempoEvent,
  isTimeSignatureEvent,
  isTrackNameEvent,
  isVolumeEvent,
} from "./identify"
import { isSignalTrackColorEvent, SignalTrackColorEvent } from "./signalEvents"
import { TrackEvent } from "./TrackEvent"

export const getLast = <T extends { tick: number }>(
  events: readonly T[],
): T | undefined => maxBy(events, (e) => e.tick)

export const isTickBefore =
  (tick: number) =>
  <T extends { tick: number }>(e: T) =>
    e.tick <= tick

export const getVolume = (tick: number) =>
  flow(filter(isVolumeEvent), filter(isTickBefore(tick)), getLast)

export const getPan = (tick: number) =>
  flow(filter(isPanEvent), filter(isTickBefore(tick)), getLast)

export const getTrackNameEvent = flow(filter(isTrackNameEvent), getLast)

export const getTempoEvent = (tick: number) =>
  flow(filter(isSetTempoEvent), filter(isTickBefore(tick)), getLast)

export const getTimeSignatureEvent = (tick: number) =>
  flow(filter(isTimeSignatureEvent), filter(isTickBefore(tick)), getLast)

export const getProgramNumberEvent = (tick: number) =>
  flow(filter(isProgramChangeEvent), filter(isTickBefore(tick)), getLast)

export const getControllerEventWithType = (
  controllerType: number,
  tick: number,
) =>
  flow(
    filter(isControllerEventWithType(controllerType)),
    filter(isTickBefore(tick)),
    getLast,
  )

export const getEndOfTrackEvent = flow(filter(isEndOfTrackEvent), getLast)

export const getTempo = (
  events: readonly TrackEvent[],
  tick: number,
): number | undefined => {
  const e = getTempoEvent(tick)(events)
  if (e === undefined) {
    return undefined
  }
  return 60000000 / e.microsecondsPerBeat
}

export const getColorEvent = (
  events: readonly TrackEvent[],
): SignalTrackColorEvent | undefined => {
  return events.filter(isSignalTrackColorEvent)[0]
}

// collect events which will be retained in the synthesizer
export const getStatusEvents =
  (tick: number) => (events: readonly TrackEvent[]) => {
    const controlEvents = events
      .filter(isControllerEvent)
      .filter(isTickBefore(tick))
    // remove duplicated control types
    const recentControlEvents = uniq(controlEvents.map((e) => e.controllerType))
      .map((type) =>
        getLast(controlEvents.filter(isControllerEventWithType(type))),
      )
      .filter(isNotUndefined)

    const setTempo = getLast(
      events.filter(isSetTempoEvent).filter(isTickBefore(tick)),
    )

    const programChange = getLast(
      events.filter(isProgramChangeEvent).filter(isTickBefore(tick)),
    )

    const pitchBend = getLast(
      events.filter(isPitchBendEvent).filter(isTickBefore(tick)),
    )

    return [...recentControlEvents, setTempo, programChange, pitchBend].filter(
      isNotUndefined,
    )
  }

export const getMaxTick = (events: readonly TrackEvent[]) => {
  let maxTick = 0
  // Use for loop instead of map/filter to avoid the error `Maximum call stack size exceeded`
  for (const e of events) {
    const tick = isNoteEvent(e) ? e.tick + e.duration : e.tick
    maxTick = Math.max(maxTick, tick)
  }
  return maxTick
}

export const getRedundantEvents =
  <T extends TrackEvent>(
    event: Omit<T, "id"> & { subtype?: string; controllerType?: number },
  ) =>
  (events: readonly TrackEvent[]) =>
    events.filter(isRedundantEvents(event))

export const hasTimeSignatureAt =
  (tick: number) => (events: readonly TrackEvent[]) =>
    events.filter(isTimeSignatureEvent).some((e) => e.tick === tick)

export const getTickSpan = (events: readonly TrackEvent[]) => {
  const minTick = min(events.map((e) => e.tick)) ?? 0
  const maxTick = max(events.map((e) => e.tick)) ?? 0
  return maxTick - minTick
}
