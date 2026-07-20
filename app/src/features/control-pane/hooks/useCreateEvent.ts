import { createOrUpdate } from "@signal-app/core"
import { AnyChannelEvent } from "midifile-ts"
import { useCallback } from "react"
import { useMutateTrack } from "../../../hooks/useCommand"
import { useHistory } from "../../../hooks/useHistory"
import { usePlayer } from "../../../hooks/usePlayer"
import { useQuantizer } from "../../../hooks/useQuantizer"
import { usePianoRoll } from "../../piano-roll/hooks/usePianoRoll"

export const useCreateEvent = () => {
  const { selectedTrackId } = usePianoRoll()
  const { quantizeRound } = useQuantizer()
  const mutate = useMutateTrack(selectedTrackId)
  const { position, sendEvent } = usePlayer()
  const { pushHistory } = useHistory()

  return useCallback(
    (e: AnyChannelEvent, tick?: number) => {
      pushHistory()
      const id = mutate(
        createOrUpdate({
          ...e,
          tick: quantizeRound(tick ?? position),
        }),
      )?.id

      // 即座に反映する
      // Reflect immediately
      if (tick !== undefined) {
        sendEvent(e)
      }

      return id
    },
    [pushHistory, mutate, quantizeRound, position, sendEvent],
  )
}
