import { useCallback } from "react"
import { Point } from "../../../../entities/geometry/Point"
import {
  MouseDownHandler,
  MouseGesture,
} from "../../../../gesture/MouseGesture"
import { observeDrag } from "../../../../helpers/observeDrag"
import { useTickScroll } from "../../../../hooks/useTickScroll"
import { useTrackScroll } from "../../../../hooks/useTrackScroll"

export const useDragScrollGesture = (): MouseDownHandler<
  [],
  React.MouseEvent
> => {
  const { scrollTop, setScrollTop } = useTrackScroll()
  const { scrollLeft, setScrollLeftInPixels, setAutoScroll } = useTickScroll()

  const setScrollLeft = useCallback(
    (v: number) => {
      setScrollLeftInPixels(v)
      setAutoScroll(false)
    },
    [setScrollLeftInPixels, setAutoScroll],
  )

  return useCallback(
    (e) => {
      function createPoint(e: MouseEvent) {
        return { x: e.clientX, y: e.clientY }
      }
      const startPos = createPoint(e.nativeEvent)

      observeDrag({
        onMouseMove(e) {
          const pos = createPoint(e)
          const delta = Point.sub(pos, startPos)
          setScrollLeft(Math.max(0, scrollLeft - delta.x))
          setScrollTop(Math.max(0, scrollTop - delta.y))
        },
      })
    },
    [scrollLeft, scrollTop, setScrollLeft, setScrollTop],
  )
}
