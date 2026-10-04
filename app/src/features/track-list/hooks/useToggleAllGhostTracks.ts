import { useCallback } from "react"
import { useSong } from "../../../hooks/useSong"
import { usePianoRoll } from "../../piano-roll/hooks/usePianoRoll"

export const useToggleAllGhostTracks = () => {
  const { notGhostTrackIds, setNotGhostTrackIds } = usePianoRoll()
  const { tracks } = useSong()

  return useCallback(() => {
    if (notGhostTrackIds.size > Math.floor(tracks.length / 2)) {
      setNotGhostTrackIds(new Set())
    } else {
      setNotGhostTrackIds(new Set(tracks.map((t) => t.id)))
    }
  }, [notGhostTrackIds, setNotGhostTrackIds, tracks])
}
