import { MouseEvent, useCallback } from "react"
import {
  useArrangeEndSelection,
  useArrangeResizeSelection,
} from "../../actions"
import { Point } from "../../entities/geometry/Point"
import { ArrangePoint } from "../../entities/transform/ArrangePoint"
import { MouseGesture } from "../../gesture/MouseGesture"
import { getClientPos } from "../../helpers/mouseEvent"
import { observeDrag } from "../../helpers/observeDrag"
import { useArrangeView } from "../../hooks/useArrangeView"

export const useRulerSelectionGesture = (): MouseGesture<[], MouseEvent> => {
  const { tracks, scrollLeft, scrollTop, trackTransform, resetSelection } =
    useArrangeView()
  const arrangeResizeSelection = useArrangeResizeSelection()
  const arrangeEndSelection = useArrangeEndSelection()

  const onMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button !== 0 || e.ctrlKey || e.altKey) {
        return
      }

      const startPosPx: Point = {
        x: e.nativeEvent.offsetX + scrollLeft,
        y: e.nativeEvent.offsetY + scrollTop,
      }
      const startClientPos = getClientPos(e.nativeEvent)

      const startPos: ArrangePoint = {
        tick: trackTransform.getTick(startPosPx.x),
        trackIndex: 0,
      }
      resetSelection()

      observeDrag({
        onMouseMove: (e) => {
          const deltaPx = Point.sub(getClientPos(e), startClientPos)
          const selectionToPx = Point.add(startPosPx, deltaPx)
          const endPos = {
            tick: trackTransform.getTick(selectionToPx.x),
            trackIndex: tracks.length,
          }
          arrangeResizeSelection(startPos, endPos)
        },
        onMouseUp: () => {
          arrangeEndSelection()
        },
      })
    },
    [
      scrollLeft,
      scrollTop,
      trackTransform,
      arrangeResizeSelection,
      arrangeEndSelection,
      tracks,
      resetSelection,
    ],
  )

  return {
    onMouseDown,
  }
}
