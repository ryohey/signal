import { duplicateTrack as duplicateTrackCmd, TrackId } from "@signal-app/core"
import { useCallback } from "react"
import { useSongCommand } from "../../../hooks/useCommand"
import { useHistory } from "../../../hooks/useHistory"

export const useDuplicateTrack = () => {
  const { pushHistory } = useHistory()
  const duplicateTrack = useSongCommand(duplicateTrackCmd)

  return useCallback(
    (trackId: TrackId) => {
      pushHistory()
      duplicateTrack(trackId)
    },
    [duplicateTrack, pushHistory],
  )
}
