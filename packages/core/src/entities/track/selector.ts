import { maxBy } from "lodash"
import uniq from "lodash/uniq"
import { isNotUndefined } from "../../helpers/array"
import {
  isControllerEvent,
  isControllerEventWithType,
  isEndOfTrackEvent,
  isPanEvent,
  isPitchBendEvent,
  isProgramChangeEvent,
  isSetTempoEvent,
  isTimeSignatureEvent,
  isTrackNameEvent,
  isVolumeEvent,
} from "./identify"
import type { TrackEvent } from "./TrackEvent"

export const getLast = <T extends { tick: number }>(
  events: T[]
): T | undefined => maxBy(events, (e) => e.tick)

export const isTickBefore =
  (tick: number) =>
  <T extends { tick: number }>(e: T) =>
    e.tick <= tick

export const getVolume = (events: readonly TrackEvent[], tick: number) =>
  getLast(events.filter(isVolumeEvent).filter(isTickBefore(tick)))?.value

export const getPan = (events: readonly TrackEvent[], tick: number) =>
  getLast(events.filter(isPanEvent).filter(isTickBefore(tick)))?.value

export const getTrackNameEvent = (events: readonly TrackEvent[]) =>
  getLast(events.filter(isTrackNameEvent))

export const getTempoEvent = (events: readonly TrackEvent[], tick: number) =>
  getLast(events.filter(isSetTempoEvent).filter(isTickBefore(tick)))

export const getTimeSignatureEvent = (
  events: readonly TrackEvent[],
  tick: number
) => getLast(events.filter(isTimeSignatureEvent).filter(isTickBefore(tick)))

export const getProgramNumberEvent = (events: readonly TrackEvent[]) =>
  getLast(events.filter(isProgramChangeEvent))

export const getEndOfTrackEvent = (events: readonly TrackEvent[]) =>
  getLast(events.filter(isEndOfTrackEvent))

export const getTempo = (
  events: readonly TrackEvent[],
  tick: number
): number | undefined => {
  const e = getTempoEvent(events, tick)
  if (e === undefined) {
    return undefined
  }
  return 60000000 / e.microsecondsPerBeat
}

// collect events which will be retained in the synthesizer
export const getStatusEvents = (
  events: readonly TrackEvent[],
  tick: number
) => {
  const controlEvents = events
    .filter(isControllerEvent)
    .filter(isTickBefore(tick))
  // remove duplicated control types
  const recentControlEvents = uniq(controlEvents.map((e) => e.controllerType))
    .map((type) =>
      getLast(controlEvents.filter(isControllerEventWithType(type)))
    )
    .filter(isNotUndefined)

  const setTempo = getLast(
    events.filter(isSetTempoEvent).filter(isTickBefore(tick))
  )

  const programChange = getLast(
    events.filter(isProgramChangeEvent).filter(isTickBefore(tick))
  )

  const pitchBend = getLast(
    events.filter(isPitchBendEvent).filter(isTickBefore(tick))
  )

  return [...recentControlEvents, setTempo, programChange, pitchBend].filter(
    isNotUndefined
  )
}
