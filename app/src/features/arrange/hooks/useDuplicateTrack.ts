import type { TrackId } from "@signal-app/core"
import { useCallback } from "react"
import { useHistory } from "../../../hooks/useHistory"
import { useSong } from "../../../hooks/useSong"

export const useDuplicateTrack = () => {
  const { pushHistory } = useHistory()
  const { duplicateTrack } = useSong()

  return useCallback(
    (trackId: TrackId) => {
      pushHistory()
      duplicateTrack(trackId)
    },
    [duplicateTrack, pushHistory],
  )
}
