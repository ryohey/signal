import {
  getControlEventsInRangeWithPrevious,
  isControllerEventWithType,
  isPitchBendEvent,
  TrackEventOf,
} from "@signal-app/core"
import { ControllerEvent, PitchBendEvent } from "midifile-ts"
import { useMemo } from "react"
import { useSyncTrackQuery } from "../../../hooks/useSyncTrackQuery"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { usePianoRoll } from "../../piano-roll/hooks/usePianoRoll"
import { useControlPane } from "./useControlPane"

export function useControlValueEvents() {
  const { controlMode } = useControlPane()
  const { tickRange } = useTickScroll()
  const { selectedTrackId } = usePianoRoll()

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

  const query = useMemo(
    () => getControlEventsInRangeWithPrevious(filter, tickRange),
    [filter, tickRange],
  )

  const controlValueEvents =
    useSyncTrackQuery(selectedTrackId, query, filter) ?? []

  return controlValueEvents as (
    | TrackEventOf<ControllerEvent>
    | TrackEventOf<PitchBendEvent>
  )[]
}
