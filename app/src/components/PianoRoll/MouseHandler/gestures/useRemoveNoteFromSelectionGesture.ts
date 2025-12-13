import type { MouseGesture } from "../../../../gesture/MouseGesture"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"

export const useRemoveNoteFromSelectionGesture = (): MouseGesture<[number]> => {
  const { selectedNoteIds, setSelectedNoteIds } = usePianoRoll()

  return {
    onMouseDown(_e, noteId) {
      if (selectedNoteIds.length === 0) {
        return
      }

      setSelectedNoteIds(selectedNoteIds.filter((id) => id !== noteId))
    },
  }
}
