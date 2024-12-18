import { MouseGesture } from "../../../../gesture/MouseGesture"
import { useStores } from "../../../../hooks/useStores"

export const useAddNoteToSelectionGesture = (): MouseGesture<[number]> => {
  const { pianoRollStore } = useStores()

  return {
    onMouseDown(_e, noteId) {
      pianoRollStore.selectedNoteIds.push(noteId)
    },
  }
}
