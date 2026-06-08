import { useCallback } from "react"
import { MouseDownHandler } from "../../../../gesture/MouseGesture"
import { observeDrag } from "../../../../helpers/observeDrag"
import { useNoteCoordTransform } from "../../../../hooks/useNoteCoordTransform"
import { useTickScroll } from "../../../../hooks/useTickScroll"

export const useDragScrollGesture = (): MouseDownHandler => {
  const { scrollBy } = useNoteCoordTransform()
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
