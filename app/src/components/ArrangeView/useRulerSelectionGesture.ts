import { ArrangeSelection, Range } from "@signal-app/core"
import { MouseEvent, useCallback } from "react"
import { MouseGesture } from "../../gesture/MouseGesture"
import { observeDrag } from "../../helpers/observeDrag"
import { useArrangeView } from "../../hooks/useArrangeView"
import { useQuantizer } from "../../hooks/useQuantizer"
import { useSong } from "../../hooks/useSong"
import { useTickScroll } from "../../hooks/useTickScroll"

export const useRulerSelectionGesture = (): MouseGesture<[], MouseEvent> => {
  const { trackTransform, resetSelection, setSelection } = useArrangeView()
  const { quantizeFloor, quantizeCeil } = useQuantizer()
  const { tracks } = useSong()
  const { transform, scrollLeft } = useTickScroll()

  const selectionFromTickRange = useCallback(
    (range: Range) =>
      ArrangeSelection.fromPoints(
        {
          tick: range[0],
          trackIndex: 0,
        },
        {
          tick: range[1],
          trackIndex: tracks.length,
        },
        { quantizeFloor, quantizeCeil },
        tracks.length,
      ),
    [quantizeFloor, quantizeCeil, tracks.length],
  )

  let selection: ArrangeSelection | null = null

  const onMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button !== 0 || e.ctrlKey || e.altKey) {
        return
      }

      const startPosX = e.nativeEvent.offsetX + scrollLeft
      const startClientX = e.nativeEvent.clientX
      const startTick = transform.getTick(startPosX)

      resetSelection()

      observeDrag({
        onMouseMove: (e) => {
          const deltaPx = e.clientX - startClientX
          const selectionToPx = startPosX + deltaPx
          const endTick = transform.getTick(selectionToPx)
          // eslint-disable-next-line react-hooks/exhaustive-deps
          selection = selectionFromTickRange([startTick, endTick])
          setSelection(selection)
        },
      })
    },
    [
      scrollLeft,
      transform,
      trackTransform,
      selectionFromTickRange,
      tracks,
      resetSelection,
    ],
  )

  return {
    onMouseDown,
  }
}
