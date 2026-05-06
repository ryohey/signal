import { MouseEvent, useCallback } from "react"
import { Point } from "../../../../entities/geometry/Point"
import { MouseDownHandler } from "../../../../gesture/MouseGesture"
import { getClientPos } from "../../../../helpers/mouseEvent"
import { useTickScroll } from "../../../../hooks/useTickScroll"
import { useTrackScroll } from "../../../../hooks/useTrackScroll"
import { useCreateSelectionGesture } from "./useCreateSelectionGesture"

export const useSelectionGesture = (): MouseDownHandler<[], MouseEvent> => {
  const { scrollTop } = useTrackScroll()
  const { scrollLeft } = useTickScroll()
  const createSelectionGesture = useCreateSelectionGesture()

  return useCallback(
    (e) => {
      const startPosPx: Point = {
        x: e.nativeEvent.offsetX + scrollLeft,
        y: e.nativeEvent.offsetY + scrollTop,
      }
      const startClientPos = getClientPos(e.nativeEvent)
      createSelectionGesture(e, startClientPos, startPosPx)
    },
    [scrollLeft, scrollTop, createSelectionGesture],
  )
}
