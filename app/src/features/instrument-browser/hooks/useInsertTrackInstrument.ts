import { programChangeMidiEvent, TrackId } from "@signal-app/core"
import { useCallback } from "react"
import { useHistory } from "../../../hooks/useHistory"
import { usePlayer } from "../../../hooks/usePlayer"
import { useTrack } from "../../../hooks/useTrack"

export const useInsertTrackInstrument = (trackId: TrackId) => {
  const { sendEvent } = usePlayer()
  const { pushHistory } = useHistory()
  const { channel, setProgramNumberAt } = useTrack(trackId)

  return useCallback(
    (programNumber: number, tick: number) => {
      if (channel === undefined) {
        return
      }
      pushHistory()
      setProgramNumberAt(tick, programNumber)
      sendEvent(programChangeMidiEvent(0, channel, programNumber))
    },
    [pushHistory, channel, sendEvent, setProgramNumberAt],
  )
}
