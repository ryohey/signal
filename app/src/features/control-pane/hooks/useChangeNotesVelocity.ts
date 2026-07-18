import { useCallback } from "react"
import { useHistory } from "../../../hooks/useHistory"
import { useTrack } from "../../../hooks/useTrack"
import { usePianoRoll } from "../../piano-roll/hooks/usePianoRoll"

export const useChangeNotesVelocity = () => {
  const { selectedTrackId, setNewNoteVelocity } = usePianoRoll()
  const { updateEvents } = useTrack(selectedTrackId)
  const { pushHistory } = useHistory()

  return useCallback(
    (noteIds: number[], velocity: number) => {
      pushHistory()
      updateEvents(
        noteIds.map((id) => ({
          id,
          velocity: velocity,
        })),
      )
      setNewNoteVelocity(velocity)
    },
    [pushHistory, updateEvents, setNewNoteVelocity],
  )
}
