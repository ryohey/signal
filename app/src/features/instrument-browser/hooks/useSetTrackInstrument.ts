import { programChangeMidiEvent, type TrackId } from "@signal-app/core"
import { useCallback } from "react"
import { useHistory } from "../../../hooks/useHistory"
import { usePlayer } from "../../../hooks/usePlayer"
import { useTrack } from "../../../hooks/useTrack"

export const useSetTrackInstrument = (trackId: TrackId, eventId?: number) => {
  const { sendEvent, position } = usePlayer()
  const { pushHistory } = useHistory()
  const {
    channel,
    setProgramNumberAt,
    setProgramNumberById,
    hasProgramChangeEventAfter,
  } = useTrack(trackId)

  return useCallback(
    (programNumber: number) => {
      pushHistory()

      const targetEvent =
        eventId === undefined
          ? setProgramNumberAt(position, programNumber)
          : setProgramNumberById(eventId, programNumber)

      if (!targetEvent) {
        return
      }

      const tick = targetEvent.tick

      // If the player position is after the insertion position and there are no other program change events, reflect immediately
      if (channel !== undefined && position >= tick) {
        const hasOtherProgramChangeEvents =
          hasProgramChangeEventAfter(tick) ?? false
        if (!hasOtherProgramChangeEvents) {
          sendEvent(programChangeMidiEvent(0, channel, programNumber))
        }
      }
    },
    [
      pushHistory,
      channel,
      sendEvent,
      position,
      eventId,
      setProgramNumberAt,
      setProgramNumberById,
      hasProgramChangeEventAfter,
    ],
  )
}
