import { useCallback } from "react"
import { MouseDownHandler } from "../../../../gesture/MouseGesture"
import { useMoveDraggableGesture } from "./useMoveDraggableGesture"

export const useDragSelectionRightEdgeGesture = (): MouseDownHandler<
  [number[]]
> => {
  const moveDraggableAction = useMoveDraggableGesture()

  return useCallback(
    (e, selectedNoteIds) => {
      moveDraggableAction(
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
    [moveDraggableAction],
  )
}
