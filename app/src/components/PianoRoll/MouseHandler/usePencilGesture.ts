import { MouseGesture } from "../../../gesture/MouseGesture"
import { usePianoRoll } from "../../../hooks/usePianoRoll"
import { useCreateNoteGesture } from "./gestures/useCreateNoteGesture"
import { useSelectNoteGesture } from "./gestures/useSelectNoteGesture"

export const usePencilGesture = (): MouseGesture => {
  const { getLocal, getNotes } = usePianoRoll()
  const createNoteGesture = useCreateNoteGesture()
  const selectNoteGesture = useSelectNoteGesture()

  return {
    onMouseDown(e: MouseEvent) {
      const local = getLocal(e)
      const items = getNotes(local)

      switch (e.button) {
        case 0: {
          if (items.length > 0) {
            // no-op
          } else {
            if (e.shiftKey || e.metaKey) {
              return selectNoteGesture.onMouseDown(e)
            } else {
              return createNoteGesture.onMouseDown(e)
            }
          }
          break
        }
        default:
          return null
      }
    },
  }
}
