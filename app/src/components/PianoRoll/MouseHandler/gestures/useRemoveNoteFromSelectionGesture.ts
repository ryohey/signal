import { MouseGesture } from "../../../../gesture/MouseGesture"
import { useStores } from "../../../../hooks/useStores"

export const useRemoveNoteFromSelectionGesture = (): MouseGesture<[number]> => {
  const {
    pianoRollStore,
    pianoRollStore: { selectedTrack, selectedNoteIds },
  } = useStores()

  return {
    onMouseDown(_e, noteId) {
      if (selectedTrack === undefined || selectedNoteIds.length === 0) {
        return
      }

      pianoRollStore.selectedNoteIds = selectedNoteIds.filter(
        (id) => id !== noteId,
      )
    },
  }
}
