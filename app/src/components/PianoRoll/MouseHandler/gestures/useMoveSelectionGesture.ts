import { useCloneSelection } from "../../../../actions"
import { MouseGesture } from "../../../../gesture/MouseGesture"
import { useMoveDraggableGesture } from "./useMoveDraggableGesture"

export const useMoveSelectionGesture = (): MouseGesture<[number[]]> => {
  const moveDraggableAction = useMoveDraggableGesture()
  const cloneSelection = useCloneSelection()

  return {
    onMouseDown(e, selectedNoteIds) {
      const isCopy = e.metaKey

      if (isCopy) {
        cloneSelection()
      }

      return moveDraggableAction.onMouseDown(
        e,
        { type: "selection", position: "center" },
        selectedNoteIds.map((noteId) => ({
          type: "note",
          position: "center",
          noteId,
        })),
      )
    },
  }
}
