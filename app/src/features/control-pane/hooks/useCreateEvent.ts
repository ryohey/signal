import { AnyChannelEvent } from "midifile-ts"
import { useCallback } from "react"
import { useHistory } from "../../../hooks/useHistory"
import { usePlayer } from "../../../hooks/usePlayer"
import { useQuantizer } from "../../../hooks/useQuantizer"
import { useTrack } from "../../../hooks/useTrack"
import { usePianoRoll } from "../../piano-roll/hooks/usePianoRoll"

export const useCreateEvent = () => {
  const { selectedTrackId } = usePianoRoll()
  const { quantizeRound } = useQuantizer()
  const { createOrUpdate } = useTrack(selectedTrackId)
  const { position, sendEvent } = usePlayer()
  const { pushHistory } = useHistory()

  return useCallback(
    (e: AnyChannelEvent, tick?: number) => {
      pushHistory()
      const id = createOrUpdate({
        ...e,
        tick: quantizeRound(tick ?? position),
      })?.id

      // 即座に反映する
      // Reflect immediately
      if (tick !== undefined) {
        sendEvent(e)
      }

      return id
    },
    [pushHistory, createOrUpdate, quantizeRound, position, sendEvent],
  )
}
