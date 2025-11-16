import { useCallback } from "react"
import { Point } from "../../../../entities/geometry/Point"
import { Rect } from "../../../../entities/geometry/Rect"
import { ArrangePoint, ArrangeSelection } from "@signal-app/core"
import { MouseGesture } from "../../../../gesture/MouseGesture"
import { getClientPos } from "../../../../helpers/mouseEvent"
import { observeDrag } from "../../../../helpers/observeDrag"
import { useArrangeView } from "../../../../hooks/useArrangeView"
import { useCommands } from "../../../../hooks/useCommands"
import { useHistory } from "../../../../hooks/useHistory"
import { useQuantizer } from "../../../../hooks/useQuantizer"
import { useSong } from "../../../../hooks/useSong"

export const useMoveSelectionGesture = (): MouseGesture<
  [Point, Rect],
  MouseEvent
> => {
  const commands = useCommands()
  const { pushHistory } = useHistory()
  const {
    selection: _selection,
    trackTransform,
    setSelection,
  } = useArrangeView()
  const { quantizeRound } = useQuantizer()
  const { tracks } = useSong()

  return {
    onMouseDown: useCallback(
      (_e, startClientPos, selectionRect) => {
        if (_selection === null) {
          return
        }
        let isMoved = false
        let selection = _selection
        let selectedEventIds = commands.arrange.getEventsInSelection(selection)

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

            selectedEventIds = commands.arrange.moveEventsBetweenTracks(
              selectedEventIds,
              delta,
            )

            setSelection(selection)
          },
        })
      },
      [
        pushHistory,
        quantizeRound,
        trackTransform,
        tracks,
        setSelection,
        _selection,
        commands,
      ],
    ),
  }
}
