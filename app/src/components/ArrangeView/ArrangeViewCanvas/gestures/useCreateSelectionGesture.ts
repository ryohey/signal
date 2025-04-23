import { MouseEvent } from "react"
import {
  useArrangeEndSelection,
  useArrangeResizeSelection,
} from "../../../../actions"
import { Point } from "../../../../entities/geometry/Point"
import { MouseGesture } from "../../../../gesture/MouseGesture"
import { getClientPos } from "../../../../helpers/mouseEvent"
import { observeDrag } from "../../../../helpers/observeDrag"
import { useArrangeView } from "../../../../hooks/useArrangeView"
import { useStores } from "../../../../hooks/useStores"

export const useCreateSelectionGesture = (): MouseGesture<
  [Point, Point],
  MouseEvent
> => {
  const { player } = useStores()
  const { trackTransform, setSelectedTrackIndex, resetSelection, quantizer } =
    useArrangeView()

  const arrangeEndSelection = useArrangeEndSelection()
  const arrangeResizeSelection = useArrangeResizeSelection()

  return {
    onMouseDown(_e, startClientPos, startPosPx) {
      const startPos = trackTransform.getArrangePoint(startPosPx)
      resetSelection()

      if (!player.isPlaying) {
        player.position = quantizer.round(startPos.tick)
      }

      setSelectedTrackIndex(Math.floor(startPos.trackIndex))

      observeDrag({
        onMouseMove: (e) => {
          const deltaPx = Point.sub(getClientPos(e), startClientPos)
          const selectionToPx = Point.add(startPosPx, deltaPx)
          arrangeResizeSelection(
            startPos,
            trackTransform.getArrangePoint(selectionToPx),
          )
        },
        onMouseUp: () => {
          arrangeEndSelection()
        },
      })
    },
  }
}
