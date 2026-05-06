import { useCallback } from "react"
import { MouseDownHandler } from "../../../../gesture/MouseGesture"
import { useMoveDraggableGesture } from "./useMoveDraggableGesture"

export const useDragSelectionLeftEdgeGesture = (): MouseDownHandler<
  [number[]]
> => {
  const moveDraggableAction = useMoveDraggableGesture()

  return useCallback(
    (e, selectedNoteIds) => {
      moveDraggableAction(
        e,
        {
          type: "selection",
          position: "left",
        },
        selectedNoteIds.map((noteId) => ({
          type: "note",
          position: "left",
          noteId,
        })),
      )
    },
    [moveDraggableAction],
  )
}
