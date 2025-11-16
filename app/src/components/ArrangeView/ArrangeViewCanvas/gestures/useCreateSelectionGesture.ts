import { MouseEvent, useCallback } from "react"
import { Point } from "../../../../entities/geometry/Point"
import { ArrangeSelection } from "../../../../entities/selection/ArrangeSelection"
import { ArrangePoint } from "../../../../entities/transform/ArrangePoint"
import { MouseGesture } from "../../../../gesture/MouseGesture"
import { getClientPos } from "../../../../helpers/mouseEvent"
import { observeDrag } from "../../../../helpers/observeDrag"
import { useArrangeView } from "../../../../hooks/useArrangeView"
import { usePlayer } from "../../../../hooks/usePlayer"
import { useQuantizer } from "../../../../hooks/useQuantizer"
import { useSong } from "../../../../hooks/useSong"

export const useCreateSelectionGesture = (): MouseGesture<
  [Point, Point],
  MouseEvent
> => {
  const { isPlaying, setPosition } = usePlayer()
  const {
    trackTransform,
    setSelectedTrackIndex,
    resetSelection,
    setSelection,
  } = useArrangeView()
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

  return {
    onMouseDown: useCallback(
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
    ),
  }
}
