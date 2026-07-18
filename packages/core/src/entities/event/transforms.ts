import { ControllerEvent, PitchBendEvent } from "midifile-ts"
import { TrackEvent, TrackEventOf } from "./TrackEvent"

type TrackEventTransform<T extends TrackEvent> = (event: T) => T

export const moveEvent =
  <T extends TrackEvent>(deltaTick: number): TrackEventTransform<T> =>
  (event) => ({
    ...event,
    tick: event.tick + deltaTick,
  })

export const moveControllerEvent =
  (deltaTick: number, deltaValue: number, maxValue: number) =>
  (e: TrackEventOf<ControllerEvent | PitchBendEvent>) => ({
    ...e,
    tick: Math.max(0, e.tick + deltaTick),
    value: Math.min(maxValue, Math.max(0, e.value + deltaValue)),
  })
