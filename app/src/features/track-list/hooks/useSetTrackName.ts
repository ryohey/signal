import { TrackId } from "@signal-app/core"
import { useCallback } from "react"
import { useHistory } from "../../../hooks/useHistory"
import { useTrack } from "../../../hooks/useTrack"

export const useSetTrackName = (trackId: TrackId) => {
  const { setName } = useTrack(trackId)
  const { pushHistory } = useHistory()

  return useCallback(
    (name: string) => {
      pushHistory()
      setName(name)
    },
    [pushHistory, setName],
  )
}
