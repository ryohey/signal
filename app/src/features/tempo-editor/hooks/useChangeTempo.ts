import { TrackEventOf } from "@signal-app/core"
import type { SetTempoEvent } from "midifile-ts"
import { useCallback } from "react"
import { useConductorTrack } from "../../../hooks/useConductorTrack"
import { useHistory } from "../../../hooks/useHistory"

export const useChangeTempo = () => {
  const { updateEvent } = useConductorTrack()
  const { pushHistory } = useHistory()
  return useCallback(
    (id: number, microsecondsPerBeat: number) => {
      pushHistory()
      updateEvent<TrackEventOf<SetTempoEvent>>(id, {
        microsecondsPerBeat: microsecondsPerBeat,
      })
    },
    [updateEvent, pushHistory],
  )
}
