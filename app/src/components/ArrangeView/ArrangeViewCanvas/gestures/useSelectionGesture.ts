import { MouseEvent, useCallback } from "react"
import { Point } from "../../../../entities/geometry/Point"
import { Rect } from "../../../../entities/geometry/Rect"
import { MouseGesture } from "../../../../gesture/MouseGesture"
import { getClientPos } from "../../../../helpers/mouseEvent"
import { useArrangeView } from "../../../../hooks/useArrangeView"
import { useTickScroll } from "../../../../hooks/useTickScroll"
import { useTrackScroll } from "../../../../hooks/useTrackScroll"
import { useCreateSelectionGesture } from "./useCreateSelectionGesture"
import { useMoveSelectionGesture } from "./useMoveSelectionGesture"

export const useSelectionGesture = (): MouseGesture<[], MouseEvent> => {
  const { selectionRect } = useArrangeView()
  const { scrollTop } = useTrackScroll()
  const { scrollLeft } = useTickScroll()
  const moveSelectionGesture = useMoveSelectionGesture()
  const createSelectionGesture = useCreateSelectionGesture()

  const onMouseDown = useCallback(
    (e: MouseEvent) => {
      const startPosPx: Point = {
        x: e.nativeEvent.offsetX + scrollLeft,
        y: e.nativeEvent.offsetY + scrollTop,
      }
      const startClientPos = getClientPos(e.nativeEvent)

      const isSelectionSelected =
        selectionRect != null && Rect.containsPoint(selectionRect, startPosPx)

      if (isSelectionSelected) {
        moveSelectionGesture.onMouseDown(e, startClientPos, selectionRect)
      } else {
        createSelectionGesture.onMouseDown(e, startClientPos, startPosPx)
      }
    },
    [
      selectionRect,
      scrollLeft,
      scrollTop,
      moveSelectionGesture,
      createSelectionGesture,
    ],
  )

  return {
    onMouseDown,
  }
}
