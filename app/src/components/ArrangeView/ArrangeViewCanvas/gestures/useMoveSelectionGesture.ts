import { useCallback } from "react"
import { moveEventsBetweenTracks } from "../../../../actions/arrangeView"
import { Point } from "../../../../entities/geometry/Point"
import { Rect } from "../../../../entities/geometry/Rect"
import { ArrangeSelection } from "../../../../entities/selection/ArrangeSelection"
import { ArrangePoint } from "../../../../entities/transform/ArrangePoint"
import { MouseGesture } from "../../../../gesture/MouseGesture"
import { getClientPos } from "../../../../helpers/mouseEvent"
import { observeDrag } from "../../../../helpers/observeDrag"
import { useArrangeView } from "../../../../hooks/useArrangeView"
import { useHistory } from "../../../../hooks/useHistory"
import { useQuantizer } from "../../../../hooks/useQuantizer"
import { useSong } from "../../../../hooks/useSong"

export const useMoveSelectionGesture = (): MouseGesture<
  [Point, Rect],
  MouseEvent
> => {
  const { pushHistory } = useHistory()
  const { trackTransform, setSelection, setSelectedEventIds } = useArrangeView()
  const { quantizer } = useQuantizer()
  const { tracks } = useSong()
  const { selection: _selection, selectedEventIds: _selectedEventIds } =
    useArrangeView()

  return {
    onMouseDown: useCallback(
      (_e, startClientPos, selectionRect) => {
        let isMoved = false
        let selection = _selection
        let selectedEventIds = _selectedEventIds

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
              tick: quantizer.round(point.tick),
              trackIndex: Math.round(point.trackIndex),
            }

            // clamp
            point = ArrangePoint.clamp(
              point,
              tracks.length -
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

            selectedEventIds = moveEventsBetweenTracks(
              tracks,
              selectedEventIds,
              delta,
            )

            setSelection(selection)
            setSelectedEventIds(selectedEventIds)
          },
        })
      },
      [
        pushHistory,
        quantizer,
        trackTransform,
        tracks,
        setSelection,
        setSelectedEventIds,
        _selection,
        _selectedEventIds,
      ],
    ),
  }
}
