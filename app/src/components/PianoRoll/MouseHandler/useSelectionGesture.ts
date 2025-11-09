import { MouseGesture } from "../../../gesture/MouseGesture"
import { usePianoRoll } from "../../../hooks/usePianoRoll"
import { useCreateSelectionGesture } from "./gestures/useCreateSelectionGesture"

export const useSelectionGesture = (): MouseGesture => {
  const { selectionBounds } = usePianoRoll()
  const createSelectionAction = useCreateSelectionGesture()

  return {
    onMouseDown(e: MouseEvent) {
      if (e.relatedTarget) {
        return null
      }

      if (e.button === 0) {
        if (selectionBounds !== null) {
          return createSelectionAction.onMouseDown(e)
        } else {
          return createSelectionAction.onMouseDown(e)
        }
      }

      return null
    },
  }
}
