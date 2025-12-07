import { useCloneSelection } from "../../../../actions"
import type { MouseGesture } from "../../../../gesture/MouseGesture"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"
import { useMoveDraggableGesture } from "./useMoveDraggableGesture"

export const useMoveSelectionGesture = (): MouseGesture => {
  const moveDraggableAction = useMoveDraggableGesture()
  const cloneSelection = useCloneSelection()
  const { getSelectedNoteIds } = usePianoRoll()

  return {
    onMouseDown(e) {
      const isCopy = e.metaKey || e.ctrlKey

      if (isCopy) {
        cloneSelection()
      }

      return moveDraggableAction.onMouseDown(
        e,
        { type: "selection", position: "center" },
        getSelectedNoteIds().map((noteId) => ({
          type: "note",
          position: "center",
          noteId,
        }))
      )
    },
  }
}
