import { ArrangePoint, ArrangeSelection } from "@signal-app/arrange-editor"
import { Point, Rect } from "@signal-app/geometry"
import { useCallback } from "react"
import { MouseDownHandler } from "../../../gesture/MouseGesture"
import { getClientPos } from "../../../helpers/mouseEvent"
import { observeDrag } from "../../../helpers/observeDrag"
import { useHistory } from "../../../hooks/useHistory"
import { useQuantizer } from "../../../hooks/useQuantizer"
import { useArrangeEditor } from "./useArrangeEditor"
import { useArrangeTransform } from "./useArrangeTransform"
import { useArrangeView } from "./useArrangeView"

export const useMoveSelectionGesture = (): MouseDownHandler<
  [Point, Rect],
  MouseEvent
> => {
  const { pushHistory } = useHistory()
  const { selection: _selection, setSelection } = useArrangeView()
  const { trackTransform } = useArrangeTransform()
  const { quantizeRound } = useQuantizer()
  const arrangeEditor = useArrangeEditor()

  return useCallback(
    (_e, startClientPos, selectionRect) => {
      if (_selection === null) {
        return
      }
      let isMoved = false
      let selection = _selection
      let selectedEventIds = arrangeEditor.getEventIdsInSelection(selection)

      observeDrag({
        onMouseMove: (e) => {
          if (selection === null) {
            return
          }

          const deltaPx = Point.sub(getClientPos(e), startClientPos)
          const selectionFromPx = Point.add(deltaPx, selectionRect)

          if ((deltaPx.x !== 0 || deltaPx.y !== 0) && !isMoved) {
            isMoved = true
            pushHistory()
          }

          let point = trackTransform.getArrangePoint(selectionFromPx)

          // quantize
          point = {
            tick: quantizeRound(point.tick),
            trackIndex: Math.round(point.trackIndex),
          }

          // clamp
          point = ArrangePoint.clamp(
            point,
            arrangeEditor.getTrackCount() -
              (selection.toTrackIndex - selection.fromTrackIndex),
          )

          const delta = ArrangePoint.sub(
            point,
            ArrangeSelection.start(selection),
          )

          if (delta.tick === 0 && delta.trackIndex === 0) {
            return
          }

          // Move selection range
          selection = ArrangeSelection.moved(selection, delta)

          selectedEventIds = arrangeEditor.moveEvents(selectedEventIds, delta)

          setSelection(selection)
        },
      })
    },
    [
      pushHistory,
      quantizeRound,
      trackTransform,
      setSelection,
      _selection,
      arrangeEditor,
    ],
  )
}
