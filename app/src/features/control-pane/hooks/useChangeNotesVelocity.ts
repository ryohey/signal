import { updateEvents } from "@signal-app/core"
import { useCallback } from "react"
import { useMutateTrack } from "../../../hooks/useCommand"
import { useHistory } from "../../../hooks/useHistory"
import { usePianoRoll } from "../../piano-roll/hooks/usePianoRoll"

export const useChangeNotesVelocity = () => {
  const { selectedTrackId, setNewNoteVelocity } = usePianoRoll()
  const mutate = useMutateTrack(selectedTrackId)
  const { pushHistory } = useHistory()

  return useCallback(
    (noteIds: number[], velocity: number) => {
      pushHistory()
      mutate(
        updateEvents(
          noteIds.map((id) => ({
            id,
            velocity,
          })),
        ),
      )
      setNewNoteVelocity(velocity)
    },
    [pushHistory, mutate, setNewNoteVelocity],
  )
}
