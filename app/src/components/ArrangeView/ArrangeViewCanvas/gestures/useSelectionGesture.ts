import { type MouseEvent, useCallback } from "react"
import type { Point } from "../../../../entities/geometry/Point"
import type { MouseGesture } from "../../../../gesture/MouseGesture"
import { getClientPos } from "../../../../helpers/mouseEvent"
import { useTickScroll } from "../../../../hooks/useTickScroll"
import { useTrackScroll } from "../../../../hooks/useTrackScroll"
import { useCreateSelectionGesture } from "./useCreateSelectionGesture"

export const useSelectionGesture = (): MouseGesture<[], MouseEvent> => {
  const { scrollTop } = useTrackScroll()
  const { scrollLeft } = useTickScroll()
  const createSelectionGesture = useCreateSelectionGesture()

  const onMouseDown = useCallback(
    (e: MouseEvent) => {
      const startPosPx: Point = {
        x: e.nativeEvent.offsetX + scrollLeft,
        y: e.nativeEvent.offsetY + scrollTop,
      }
      const startClientPos = getClientPos(e.nativeEvent)
      createSelectionGesture.onMouseDown(e, startClientPos, startPosPx)
    },
    [scrollLeft, scrollTop, createSelectionGesture]
  )

  return {
    onMouseDown,
  }
}
