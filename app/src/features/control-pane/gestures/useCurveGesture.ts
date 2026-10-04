import { Range } from "@signal-app/core"
import { Point } from "@signal-app/geometry"
import { useCallback, useState } from "react"
import type { MouseDownHandler } from "../../../gesture/MouseGesture"
import { getClientPos } from "../../../helpers/mouseEvent"
import { observeDrag } from "../../../helpers/observeDrag"
import { useHistory } from "../../../hooks/useHistory"
import { useQuantizer } from "../../../hooks/useQuantizer"
import { usePianoRoll } from "../../piano-roll/hooks/usePianoRoll"
import type { ControlCoordTransform } from "../entities/ControlCoordTransform"
import { useControlEditor } from "../hooks/useControlEditor"
import { useControlPane } from "../hooks/useControlPane"

export type CurveDragState = { start: Point; end: Point }

export type CurveType = "linear" | "easeIn" | "easeOut"
export const curveTypes = ["easeIn", "easeOut"] as CurveType[]

export const curveEasings: Record<CurveType, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => (t * t + 1 - Math.cos((t * Math.PI) / 2)) / 2,
  easeOut: (t) => (Math.sin((t * Math.PI) / 2) + t * (2 - t)) / 2,
}

const useUpdateValueEventsWithCurve = (curveType: CurveType) => {
  const { quantizeFloor, quantizeUnit } = useQuantizer()
  const controlEditor = useControlEditor()
  const easing = curveEasings[curveType]

  return useCallback(
    (valueRange: Range, tickRange: Range) => {
      controlEditor.updateItemsInRangeWithEasing(
        valueRange,
        tickRange,
        quantizeFloor,
        quantizeUnit,
        easing,
      )
    },
    [controlEditor, quantizeFloor, quantizeUnit, easing],
  )
}

export const useCurveGesture = (curveType: CurveType) => {
  const { setSelection: setPianoRollSelection, setSelectedNoteIds } =
    usePianoRoll()
  const { setSelectedEventIds, setSelection } = useControlPane()
  const { pushHistory } = useHistory()
  const updateValueEvents = useUpdateValueEventsWithCurve(curveType)
  const [curveDragState, setCurveDragState] = useState<CurveDragState | null>(
    null,
  )

  const gesture: MouseDownHandler<[Point, ControlCoordTransform]> = useCallback(
    (e, startPoint, transform) => {
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
            Range.fromUnordered(startPos.value, endValue),
            Range.fromUnordered(startPos.tick, endTick),
          )
          setCurveDragState(null)
        },
      })
    },
    [
      pushHistory,
      setPianoRollSelection,
      setSelectedEventIds,
      setSelection,
      setSelectedNoteIds,
      updateValueEvents,
    ],
  )

  return { gesture, curveDragState }
}
