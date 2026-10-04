import { useCallback } from "react"
import { useToggleGhostTrack } from "../../../hooks/useToggleGhostTrack"
import { usePianoRoll } from "./usePianoRoll"

export const useToggleGhost = () => {
  const { selectedTrackId } = usePianoRoll()
  const toggleGhostTrack = useToggleGhostTrack()

  return useCallback(
    () => toggleGhostTrack(selectedTrackId),
    [toggleGhostTrack, selectedTrackId],
  )
}
