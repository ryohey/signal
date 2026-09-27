import { ArrangeSelection } from "@signal-app/arrange-editor"
import { Range } from "@signal-app/core"
import { MouseEvent, useCallback } from "react"
import { MouseDownHandler } from "../../../gesture/MouseGesture"
import { observeDrag } from "../../../helpers/observeDrag"
import { useQuantizer } from "../../../hooks/useQuantizer"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { useArrangeEditor } from "./useArrangeEditor"
import { useArrangeView } from "./useArrangeView"

export const useRulerSelectionGesture = (): MouseDownHandler<
  [],
  MouseEvent
> => {
  const { resetSelection, setSelection } = useArrangeView()
  const { quantizeFloor, quantizeCeil } = useQuantizer()
  const arrangeEditor = useArrangeEditor()
  const { transform, scrollLeft } = useTickScroll()

  const selectionFromTickRange = useCallback(
    (range: Range) => {
      const trackCount = arrangeEditor.getTrackCount()
      return ArrangeSelection.fromPoints(
        {
          tick: range[0],
          trackIndex: 0,
        },
        {
          tick: range[1],
          trackIndex: trackCount,
        },
        { quantizeFloor, quantizeCeil },
        trackCount,
      )
    },
    [quantizeFloor, quantizeCeil, arrangeEditor],
  )

  let selection: ArrangeSelection | null = null

  return useCallback(
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
          selection = selectionFromTickRange([startTick, endTick])
          setSelection(selection)
        },
      })
    },
    [
      scrollLeft,
      transform,
      selection,
      setSelection,
      selectionFromTickRange,
      resetSelection,
    ],
  )
}
