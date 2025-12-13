import type { MouseGesture } from "../../../../gesture/MouseGesture"
import { useMoveDraggableGesture } from "./useMoveDraggableGesture"

export const useDragSelectionLeftEdgeGesture = (): MouseGesture<[number[]]> => {
  const moveDraggableAction = useMoveDraggableGesture()

  return {
    onMouseDown(e, selectedNoteIds) {
      moveDraggableAction.onMouseDown(
        e,
        {
          type: "selection",
          position: "left",
        },
        selectedNoteIds.map((noteId) => ({
          type: "note",
          position: "left",
          noteId,
        }))
      )
    },
  }
}
