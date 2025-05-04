import { MouseGesture } from "../../../../gesture/MouseGesture"
import { observeDrag } from "../../../../helpers/observeDrag"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"
import { useTickScroll } from "../../../../hooks/useTickScroll"

export const useDragScrollGesture = (): MouseGesture => {
  const { scrollBy } = usePianoRoll()
  const { setAutoScroll } = useTickScroll()

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
