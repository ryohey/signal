import { MouseEvent, useCallback } from "react"
import { getEventsInSelection } from "../../../../actions"
import { Point } from "../../../../entities/geometry/Point"
import { ArrangeSelection } from "../../../../entities/selection/ArrangeSelection"
import { ArrangePoint } from "../../../../entities/transform/ArrangePoint"
import { MouseGesture } from "../../../../gesture/MouseGesture"
import { getClientPos } from "../../../../helpers/mouseEvent"
import { observeDrag } from "../../../../helpers/observeDrag"
import { useArrangeView } from "../../../../hooks/useArrangeView"
import { usePlayer } from "../../../../hooks/usePlayer"
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
    quantizer,
    setSelection,
    setSelectedEventIds,
  } = useArrangeView()
  const { tracks } = useSong()
  let selection: ArrangeSelection | null = null

  const selectionFromPoints = useCallback(
    (start: ArrangePoint, end: ArrangePoint) =>
      ArrangeSelection.fromPoints(start, end, quantizer, tracks.length),
    [quantizer, tracks.length],
  )

  return {
    onMouseDown(_e, startClientPos, startPosPx) {
      const startPos = trackTransform.getArrangePoint(startPosPx)
      resetSelection()

      if (!isPlaying) {
        setPosition(quantizer.round(startPos.tick))
      }

      setSelectedTrackIndex(Math.floor(startPos.trackIndex))

      observeDrag({
        onMouseMove: (e) => {
          const deltaPx = Point.sub(getClientPos(e), startClientPos)
          const selectionToPx = Point.add(startPosPx, deltaPx)
          const endPos = trackTransform.getArrangePoint(selectionToPx)
          selection = selectionFromPoints(startPos, endPos)
          setSelection(selection)
        },
        onMouseUp: () => {
          if (selection !== null) {
            setSelectedEventIds(getEventsInSelection(tracks, selection))
          }
        },
      })
    },
  }
}
