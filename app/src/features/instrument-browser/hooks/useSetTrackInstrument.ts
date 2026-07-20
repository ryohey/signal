import {
  hasProgramChangeEventAfter,
  programChangeMidiEvent,
  setProgramNumberAt,
  setProgramNumberById,
  TrackId,
} from "@signal-app/core"
import { useCallback } from "react"
import { useMutateTrack } from "../../../hooks/useCommand"
import { useHistory } from "../../../hooks/useHistory"
import { usePlayer } from "../../../hooks/usePlayer"
import { useTrack } from "../../../hooks/useTrack"
import { useTrackQuery } from "../../../hooks/useTrackQuery"

export const useSetTrackInstrument = (trackId: TrackId, eventId?: number) => {
  const { sendEvent, position } = usePlayer()
  const { pushHistory } = useHistory()
  const { channel } = useTrack(trackId)
  const mutate = useMutateTrack(trackId)
  const query = useTrackQuery(trackId)

  return useCallback(
    (programNumber: number) => {
      pushHistory()

      const targetEvent =
        eventId === undefined
          ? mutate(setProgramNumberAt(position, programNumber))
          : mutate(setProgramNumberById(eventId, programNumber))

      if (!targetEvent) {
        return
      }

      const tick = targetEvent.tick

      // If the player position is after the insertion position and there are no other program change events, reflect immediately
      if (channel !== undefined && position >= tick) {
        const hasOtherProgramChangeEvents =
          query(hasProgramChangeEventAfter(tick)) ?? false
        if (!hasOtherProgramChangeEvents) {
          sendEvent(programChangeMidiEvent(0, channel, programNumber))
        }
      }
    },
    [pushHistory, channel, sendEvent, position, eventId, mutate, query],
  )
}
