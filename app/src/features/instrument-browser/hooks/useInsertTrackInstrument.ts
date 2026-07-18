import {
  addEvent,
  programChangeMidiEvent,
  TrackEventOf,
  TrackId,
} from "@signal-app/core"
import { ProgramChangeEvent } from "midifile-ts"
import { useCallback } from "react"
import { useMutateTrack } from "../../../hooks/useCommand"
import { useHistory } from "../../../hooks/useHistory"
import { usePlayer } from "../../../hooks/usePlayer"
import { useTrack } from "../../../hooks/useTrack"

export const useInsertTrackInstrument = (trackId: TrackId) => {
  const { sendEvent } = usePlayer()
  const { pushHistory } = useHistory()
  const { channel } = useTrack(trackId)
  const mutate = useMutateTrack(trackId)

  return useCallback(
    (programNumber: number, tick: number) => {
      if (channel === undefined) {
        return
      }

      pushHistory()

      mutate(
        addEvent<TrackEventOf<ProgramChangeEvent>>({
          ...programChangeMidiEvent(0, 0, programNumber),
          tick,
        }),
      )

      sendEvent(programChangeMidiEvent(0, channel, programNumber))
    },
    [pushHistory, channel, sendEvent, mutate],
  )
}
