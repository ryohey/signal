import { useState } from "react"
import { useUpdateValueEvents } from "../../../../actions"
import { ValueEventType } from "../../../../entities/event/ValueEventType"
import { Point } from "../../../../entities/geometry/Point"
import { ControlCoordTransform } from "../../../../entities/transform/ControlCoordTransform"
import { MouseGesture } from "../../../../gesture/MouseGesture"
import { getClientPos } from "../../../../helpers/mouseEvent"
import { observeDrag } from "../../../../helpers/observeDrag"
import { useControlPane } from "../../../../hooks/useControlPane"
import { useHistory } from "../../../../hooks/useHistory"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"

export type LineDragState = {
  start: Point
  end: Point
}

export const useLineGesture = (type: ValueEventType) => {
  const { setSelection: setPianoRollSelection, setSelectedNoteIds } =
    usePianoRoll()
  const { setSelectedEventIds, setSelection } = useControlPane()
  const { pushHistory } = useHistory()
  const updateValueEvents = useUpdateValueEvents(type)
  const [lineDragState, setLineDragState] = useState<LineDragState | null>(null)

  const gesture: MouseGesture<[Point, ControlCoordTransform]> = {
    onMouseDown(e, startPoint, transform) {
      pushHistory()

      setSelectedEventIds([])
      setSelection(null)
      setPianoRollSelection(null)
      setSelectedNoteIds([])

      const startClientPos = getClientPos(e)
      setLineDragState({ start: startPoint, end: startPoint })

      observeDrag({
        onMouseMove(e) {
          const posPx = getClientPos(e)
          const deltaPx = Point.sub(posPx, startClientPos)
          const endPoint = Point.add(startPoint, deltaPx)
          setLineDragState({ start: startPoint, end: endPoint })
        },
        onMouseUp(e) {
          const posPx = getClientPos(e)
          const deltaPx = Point.sub(posPx, startClientPos)
          const endPoint = Point.add(startPoint, deltaPx)

          const startPos = transform.fromPosition(startPoint)
          const endValue = Math.max(
            0,
            Math.min(
              transform.maxValue,
              transform.fromPosition(endPoint).value,
            ),
          )
          const endTick = transform.getTick(endPoint.x)

          updateValueEvents(startPos.value, endValue, startPos.tick, endTick)
          setLineDragState(null)
        },
      })
    },
  }

  return { gesture, lineDragState }
}
