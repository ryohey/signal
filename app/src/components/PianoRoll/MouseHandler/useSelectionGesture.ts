import type { MouseGesture } from "../../../gesture/MouseGesture"
import { useCreateSelectionGesture } from "./gestures/useCreateSelectionGesture"

export const useSelectionGesture = (): MouseGesture => {
  const createSelectionAction = useCreateSelectionGesture()

  return {
    onMouseDown(e: MouseEvent) {
      if (e.relatedTarget) {
        return null
      }

      if (e.button === 0) {
        return createSelectionAction.onMouseDown(e)
      }

      return null
    },
  }
}
