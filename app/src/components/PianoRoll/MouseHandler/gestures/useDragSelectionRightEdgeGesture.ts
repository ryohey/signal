import { MouseGesture } from "../../../../gesture/MouseGesture"
import { useMoveDraggableGesture } from "./useMoveDraggableGesture"

export const useDragSelectionRightEdgeGesture = (): MouseGesture<
  [number[]]
> => {
  const moveDraggableAction = useMoveDraggableGesture()

  return {
    onMouseDown(e, selectedNoteIds) {
      moveDraggableAction.onMouseDown(
        e,
        {
          type: "selection",
          position: "right",
        },
        selectedNoteIds.map((noteId) => ({
          type: "note",
          position: "right",
          noteId,
        })),
      )
    },
  }
}
