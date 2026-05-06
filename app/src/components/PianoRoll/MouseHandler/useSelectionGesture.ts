import { useCallback } from "react"
import { MouseDownHandler } from "../../../gesture/MouseGesture"
import { useCreateSelectionGesture } from "./gestures/useCreateSelectionGesture"

export const useSelectionGesture = (): MouseDownHandler => {
  const createSelectionAction = useCreateSelectionGesture()

  return useCallback(
    (e) => {
      if (e.relatedTarget) {
        return null
      }

      if (e.button === 0) {
        return createSelectionAction(e)
      }

      return null
    },
    [createSelectionAction],
  )
}
