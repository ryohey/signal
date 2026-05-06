import { useCallback } from "react"
import { MouseDownHandler } from "../../../../gesture/MouseGesture"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"

export const useRemoveNoteFromSelectionGesture = (): MouseDownHandler<
  [number]
> => {
  const { selectedNoteIds, setSelectedNoteIds } = usePianoRoll()

  return useCallback(
    (_e, noteId) => {
      if (selectedNoteIds.length === 0) {
        return
      }

      setSelectedNoteIds(selectedNoteIds.filter((id) => id !== noteId))
    },
    [selectedNoteIds, setSelectedNoteIds],
  )
}
