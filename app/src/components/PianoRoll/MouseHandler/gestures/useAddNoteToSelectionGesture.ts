import { MouseGesture } from "../../../../gesture/MouseGesture"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"

export const useAddNoteToSelectionGesture = (): MouseGesture<[number]> => {
  const { selectedNoteIds, setSelectedNoteIds } = usePianoRoll()

  return {
    onMouseDown(_e, noteId) {
      setSelectedNoteIds([...selectedNoteIds, noteId])
    },
  }
}
