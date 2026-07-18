import { TrackId } from "@signal-app/core"
import { useCallback } from "react"
import { usePianoRoll } from "../features/piano-roll/hooks/usePianoRoll"
import { addedSet, deletedSet } from "../helpers/set"
import { useHistory } from "./useHistory"

export const useToggleGhostTrack = () => {
  const { notGhostTrackIds, setNotGhostTrackIds } = usePianoRoll()
  const { pushHistory } = useHistory()

  return useCallback(
    (trackId: TrackId) => {
      pushHistory()
      if (notGhostTrackIds.has(trackId)) {
        setNotGhostTrackIds(deletedSet(trackId))
      } else {
        setNotGhostTrackIds(addedSet(trackId))
      }
    },
    [pushHistory, notGhostTrackIds, setNotGhostTrackIds],
  )
}
