import { useCallback } from "react"
import { MouseDownHandler } from "../../../gesture/MouseGesture"
import { useCloneSelection } from "../hooks/selection"
import { usePianoRoll } from "../hooks/usePianoRoll"
import { useMoveDraggableGesture } from "./useMoveDraggableGesture"

export const useMoveSelectionGesture = (): MouseDownHandler => {
  const moveDraggableAction = useMoveDraggableGesture()
  const cloneSelection = useCloneSelection()
  const { getSelectedNoteIds } = usePianoRoll()

  return useCallback(
    (e) => {
      const isCopy = e.metaKey || e.ctrlKey

      if (isCopy) {
        cloneSelection()
      }

      return moveDraggableAction(
        e,
        { type: "selection", position: "center" },
        getSelectedNoteIds().map((noteId) => ({
          type: "note",
          position: "center",
          noteId,
        })),
      )
    },
    [cloneSelection, getSelectedNoteIds, moveDraggableAction],
  )
}
