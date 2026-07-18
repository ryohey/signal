import {
  ArrangePoint,
  ArrangeSelection,
  getEventsInSelection as getEventsInSelectionCmd,
  moveEventsBetweenTracks as moveEventsBetweenTracksCmd,
} from "@signal-app/core"
import { useCallback } from "react"
import { Point } from "../../../entities/geometry/Point"
import { Rect } from "../../../entities/geometry/Rect"
import { MouseDownHandler } from "../../../gesture/MouseGesture"
import { getClientPos } from "../../../helpers/mouseEvent"
import { observeDrag } from "../../../helpers/observeDrag"
import { useTracksCommand } from "../../../hooks/useCommand"
import { useHistory } from "../../../hooks/useHistory"
import { useQuantizer } from "../../../hooks/useQuantizer"
import { useSong } from "../../../hooks/useSong"
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
  const { tracks } = useSong()
  const getEventsInSelection = useTracksCommand(getEventsInSelectionCmd)
  const moveEventsBetweenTracks = useTracksCommand(moveEventsBetweenTracksCmd)

  return useCallback(
    (_e, startClientPos, selectionRect) => {
      if (_selection === null) {
        return
      }
      let isMoved = false
      let selection = _selection
      let selectedEventIds = getEventsInSelection(selection)

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
            tracks.length - (selection.toTrackIndex - selection.fromTrackIndex),
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

          selectedEventIds = moveEventsBetweenTracks(selectedEventIds, delta)

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
      getEventsInSelection,
      moveEventsBetweenTracks,
    ],
  )
}
