import { useState } from "react"
import { useUpdateValueEventsWithCurve } from "../../../../actions"
import { ValueEventType } from "../../../../entities/event/ValueEventType"
import { Point } from "../../../../entities/geometry/Point"
import { ControlCoordTransform } from "../../../../entities/transform/ControlCoordTransform"
import { MouseGesture } from "../../../../gesture/MouseGesture"
import { getClientPos } from "../../../../helpers/mouseEvent"
import { observeDrag } from "../../../../helpers/observeDrag"
import { useControlPane } from "../../../../hooks/useControlPane"
import { useHistory } from "../../../../hooks/useHistory"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"

export type CurveDragState = { start: Point; end: Point }

export type CurveType = "linear" | "easeIn" | "easeOut"
export const curveTypes = ["easeIn", "easeOut"] as CurveType[]

export const curveEasings: Record<CurveType, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => (t * t + 1 - Math.cos((t * Math.PI) / 2)) / 2,
  easeOut: (t) => (Math.sin((t * Math.PI) / 2) + t * (2 - t)) / 2,
}

export const useCurveGesture = (type: ValueEventType, curveType: CurveType) => {
  const { setSelection: setPianoRollSelection, setSelectedNoteIds } =
    usePianoRoll()
  const { setSelectedEventIds, setSelection } = useControlPane()
  const { pushHistory } = useHistory()
  const updateValueEvents = useUpdateValueEventsWithCurve(type)
  const [curveDragState, setCurveDragState] = useState<CurveDragState | null>(
    null,
  )

  const gesture: MouseGesture<[Point, ControlCoordTransform]> = {
    onMouseDown(e, startPoint, transform) {
      pushHistory()

      setSelectedEventIds([])
      setSelection(null)
      setPianoRollSelection(null)
      setSelectedNoteIds([])

      const startClientPos = getClientPos(e)
      setCurveDragState({ start: startPoint, end: startPoint })

      observeDrag({
        onMouseMove(e) {
          const posPx = getClientPos(e)
          const deltaPx = Point.sub(posPx, startClientPos)
          const endPoint = Point.add(startPoint, deltaPx)
          setCurveDragState({ start: startPoint, end: endPoint })
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

          updateValueEvents(
            startPos.value,
            endValue,
            startPos.tick,
            endTick,
            curveEasings[curveType],
          )
          setCurveDragState(null)
        },
      })
    },
  }

  return { gesture, curveDragState }
}
