import { MouseEvent, useCallback } from "react"
import { getEventsInSelection } from "../../actions/arrangeView"
import { Range } from "../../entities/geometry/Range"
import { ArrangeSelection } from "../../entities/selection/ArrangeSelection"
import { MouseGesture } from "../../gesture/MouseGesture"
import { observeDrag } from "../../helpers/observeDrag"
import { useArrangeView } from "../../hooks/useArrangeView"

export const useRulerSelectionGesture = (): MouseGesture<[], MouseEvent> => {
  const {
    tracks,
    scrollLeft,
    trackTransform,
    resetSelection,
    quantizer,
    setSelection,
    setSelectedEventIds,
  } = useArrangeView()

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
        quantizer,
        tracks.length,
      ),
    [quantizer, tracks.length],
  )

  let selection: ArrangeSelection | null = null

  const onMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button !== 0 || e.ctrlKey || e.altKey) {
        return
      }

      const startPosX = e.nativeEvent.offsetX + scrollLeft
      const startClientX = e.nativeEvent.clientX
      const startTick = trackTransform.getTick(startPosX)

      resetSelection()

      observeDrag({
        onMouseMove: (e) => {
          const deltaPx = e.clientX - startClientX
          const selectionToPx = startPosX + deltaPx
          const endTick = trackTransform.getTick(selectionToPx)
          selection = selectionFromTickRange([startTick, endTick])
          setSelection(selection)
        },
        onMouseUp: () => {
          if (selection !== null) {
            setSelectedEventIds(getEventsInSelection(tracks, selection))
          }
        },
      })
    },
    [
      scrollLeft,
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
