import { MouseGesture } from "../../../../gesture/MouseGesture"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"

export const useRemoveNoteFromSelectionGesture = (): MouseGesture<[number]> => {
  const { selectedTrack, selectedNoteIds, setSelectedNoteIds } = usePianoRoll()

  return {
    onMouseDown(_e, noteId) {
      if (selectedTrack === undefined || selectedNoteIds.length === 0) {
        return
      }

      setSelectedNoteIds(selectedNoteIds.filter((id) => id !== noteId))
    },
  }
}
