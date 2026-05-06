import { useCallback } from "react"
import { MouseDownHandler } from "../../../../gesture/MouseGesture"
import { observeDrag } from "../../../../helpers/observeDrag"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"
import { useTickScroll } from "../../../../hooks/useTickScroll"

export const useDragScrollGesture = (): MouseDownHandler => {
  const { scrollBy } = usePianoRoll()
  const { setAutoScroll } = useTickScroll()

  return useCallback(() => {
    observeDrag({
      onMouseMove: (e: MouseEvent) => {
        scrollBy(e.movementX, e.movementY)
        setAutoScroll(false)
      },
    })
  }, [scrollBy, setAutoScroll])
}
