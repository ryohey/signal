import { useCallback } from "react"
import { useHistory } from "../../../hooks/useHistory"
import { usePianoRoll } from "../../piano-roll/hooks/usePianoRoll"
import { useVelocityEditor } from "./useVelocityEditor"

export const useChangeNotesVelocity = () => {
  const { setNewNoteVelocity } = usePianoRoll()
  const velocityEditor = useVelocityEditor()
  const { pushHistory } = useHistory()

  return useCallback(
    (noteIds: number[], velocity: number) => {
      pushHistory()
      velocityEditor.setVelocity(noteIds, velocity)
      setNewNoteVelocity(velocity)
    },
    [pushHistory, velocityEditor, setNewNoteVelocity],
  )
}
