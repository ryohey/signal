import { ArrangePoint, ArrangeSelection } from "@signal-app/core"
import { MouseEvent, useCallback } from "react"
import { Point } from "../../../entities/geometry/Point"
import { MouseDownHandler } from "../../../gesture/MouseGesture"
import { getClientPos } from "../../../helpers/mouseEvent"
import { observeDrag } from "../../../helpers/observeDrag"
import { usePlayer } from "../../../hooks/usePlayer"
import { useQuantizer } from "../../../hooks/useQuantizer"
import { useSong } from "../../../hooks/useSong"
import { useArrangeTransform } from "./useArrangeTransform"
import { useArrangeView } from "./useArrangeView"

export const useCreateSelectionGesture = (): MouseDownHandler<
  [Point, Point],
  MouseEvent
> => {
  const { isPlaying, setPosition } = usePlayer()
  const { setSelectedTrackIndex, resetSelection, setSelection } =
    useArrangeView()
  const { trackTransform } = useArrangeTransform()
  const { quantizeRound, quantizeFloor, quantizeCeil } = useQuantizer()
  const { tracks } = useSong()

  const selectionFromPoints = useCallback(
    (start: ArrangePoint, end: ArrangePoint) =>
      ArrangeSelection.fromPoints(
        start,
        end,
        { quantizeFloor, quantizeCeil },
        tracks.length,
      ),
    [quantizeFloor, quantizeCeil, tracks.length],
  )

  return useCallback(
    (_e, startClientPos, startPosPx) => {
      const startPos = trackTransform.getArrangePoint(startPosPx)
      resetSelection()

      if (!isPlaying) {
        setPosition(quantizeRound(startPos.tick))
      }

      setSelectedTrackIndex(Math.floor(startPos.trackIndex))

      let selection: ArrangeSelection | null = null

      observeDrag({
        onMouseMove: (e) => {
          const deltaPx = Point.sub(getClientPos(e), startClientPos)
          const selectionToPx = Point.add(startPosPx, deltaPx)
          const endPos = trackTransform.getArrangePoint(selectionToPx)
          selection = selectionFromPoints(startPos, endPos)
          setSelection(selection)
        },
      })
    },
    [
      isPlaying,
      setPosition,
      quantizeRound,
      trackTransform,
      resetSelection,
      setSelectedTrackIndex,
      selectionFromPoints,
      setSelection,
    ],
  )
}
