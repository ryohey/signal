import { MouseGesture } from "../../../../gesture/MouseGesture"
import { observeDrag } from "../../../../helpers/observeDrag"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"

export const useDragScrollGesture = (): MouseGesture => {
  const { scrollBy, setAutoScroll } = usePianoRoll()
  return {
    onMouseDown() {
      observeDrag({
        onMouseMove: (e: MouseEvent) => {
          scrollBy(e.movementX, e.movementY)
          setAutoScroll(false)
        },
      })
    },
  }
}
