import { maxBy, minBy } from "lodash"
import { ControllerEvent, PitchBendEvent } from "midifile-ts"
import { useMemo } from "react"
import { isNotUndefined } from "../helpers/array"
import {
  TrackEventOf,
  isControllerEventWithType,
  isPitchBendEvent,
} from "../track"
import { useControlPane } from "./useControlPane"
import { useMobxStore } from "./useMobxSelector"

export function useControlValueEvents() {
  const { controlMode, scrollLeft, transform } = useControlPane()
  const windowedEvents = useMobxStore(
    ({ pianoRollStore }) => pianoRollStore.windowedEvents,
  )
  const selectedTrack = useMobxStore(
    ({ pianoRollStore }) => pianoRollStore.selectedTrack,
  )
  const canvasWidth = useMobxStore(
    ({ pianoRollStore }) => pianoRollStore.canvasWidth,
  )

  const filter = useMemo(() => {
    switch (controlMode.type) {
      case "velocity":
        throw new Error("don't use this method for velocity")
      case "pitchBend":
        return isPitchBendEvent
      case "controller":
        return isControllerEventWithType(controlMode.controllerType)
    }
  }, [controlMode])

  const controlValueEvents = useMemo(() => {
    const controllerEvents = (selectedTrack?.events ?? []).filter(filter)
    const events = windowedEvents.filter(filter)

    // Add controller events in the outside of the visible area

    const tickStart = transform.getTick(scrollLeft)
    const tickEnd = transform.getTick(scrollLeft + canvasWidth)

    const prevEvent = maxBy(
      controllerEvents.filter((e) => e.tick < tickStart),
      (e) => e.tick,
    )
    const nextEvent = minBy(
      controllerEvents.filter((e) => e.tick > tickEnd),
      (e) => e.tick,
    )

    return [prevEvent, ...events, nextEvent].filter(isNotUndefined)
  }, [windowedEvents, scrollLeft, canvasWidth, transform, selectedTrack])

  return controlValueEvents as (
    | TrackEventOf<ControllerEvent>
    | TrackEventOf<PitchBendEvent>
  )[]
}
