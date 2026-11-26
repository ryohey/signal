import { type Patch, patchMidiEvents, type TrackId } from "@signal-app/core";
import { useCallback } from "react";
import { useHistory } from "../../../hooks/useHistory";
import { usePlayer } from "../../../hooks/usePlayer";
import { useTrack } from "../../../hooks/useTrack";

export const useSetTrackInstrument = (trackId: TrackId, eventId?: number) => {
  const { sendEvent, position } = usePlayer()
  const { pushHistory } = useHistory()
  const { channel, setPatchAt, setPatchById, hasProgramChangeEventAfter } =
    useTrack(trackId)

  return useCallback(
    (patch: Patch) => {
      pushHistory()

      const targetEvent =
        eventId === undefined
          ? setPatchAt(position, patch)
          : setPatchById(eventId, patch)

      if (!targetEvent) {
        return
      }

      const tick = targetEvent.tick

      // If the player position is after the insertion position and there are no other program change events, reflect immediately
      if (channel !== undefined && position >= tick) {
        const hasOtherProgramChangeEvents =
          hasProgramChangeEventAfter(tick) ?? false
        if (!hasOtherProgramChangeEvents) {
          patchMidiEvents(0, channel, patch).forEach((e) => sendEvent(e))
        }
      }
    },
    [
      pushHistory,
      channel,
      sendEvent,
      position,
      eventId,
      setPatchAt,
      setPatchById,
      hasProgramChangeEventAfter,
    ],
  )
}
