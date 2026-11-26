import { type Patch, patchMidiEvents, type TrackId } from "@signal-app/core";
import { useCallback } from "react";
import { useHistory } from "../../../hooks/useHistory";
import { usePlayer } from "../../../hooks/usePlayer";
import { useTrack } from "../../../hooks/useTrack";

export const useInsertTrackInstrument = (trackId: TrackId) => {
  const { sendEvent } = usePlayer()
  const { pushHistory } = useHistory()
  const { channel, insertPatchAt } = useTrack(trackId)

  return useCallback(
    (patch: Patch, tick: number) => {
      if (channel === undefined) {
        return
      }
      pushHistory()
      insertPatchAt(tick, patch)
      patchMidiEvents(0, channel, patch).forEach((e) => sendEvent(e))
    },
    [pushHistory, channel, sendEvent, insertPatchAt],
  )
}
