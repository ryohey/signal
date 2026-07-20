import { TrackEventOf, updateEvent } from "@signal-app/core"
import type { SetTempoEvent } from "midifile-ts"
import { useCallback } from "react"
import { useMutateConductorTrack } from "../../../hooks/useCommand"
import { useHistory } from "../../../hooks/useHistory"

export const useChangeTempo = () => {
  const mutate = useMutateConductorTrack()
  const { pushHistory } = useHistory()
  return useCallback(
    (id: number, microsecondsPerBeat: number) => {
      pushHistory()
      mutate(
        updateEvent<TrackEventOf<SetTempoEvent>>(id, {
          microsecondsPerBeat,
        }),
      )
    },
    [mutate, pushHistory],
  )
}
