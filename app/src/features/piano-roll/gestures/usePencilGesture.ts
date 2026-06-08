import { useCallback } from "react"
import { MouseDownHandler } from "../../../gesture/MouseGesture"
import { useCreateNoteGesture } from "./useCreateNoteGesture"
import { useSelectNoteGesture } from "./useSelectNoteGesture"

export const usePencilGesture = (): MouseDownHandler => {
  const createNoteGesture = useCreateNoteGesture()
  const selectNoteGesture = useSelectNoteGesture()

  return useCallback(
    (e) => {
      switch (e.button) {
        case 0: {
          if (e.shiftKey || e.metaKey) {
            return selectNoteGesture(e)
          } else {
            return createNoteGesture(e)
          }
        }
        default:
          return null
      }
    },
    [createNoteGesture, selectNoteGesture],
  )
}
