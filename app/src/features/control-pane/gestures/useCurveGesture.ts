import { Range, updateEventsInRangeWithEasing } from "@signal-app/core"
import { useCallback, useState } from "react"
import { Point } from "../../../entities/geometry/Point"
import { MouseDownHandler } from "../../../gesture/MouseGesture"
import { getClientPos } from "../../../helpers/mouseEvent"
import { observeDrag } from "../../../helpers/observeDrag"
import { useMutateTrack } from "../../../hooks/useCommand"
import { useHistory } from "../../../hooks/useHistory"
import { useQuantizer } from "../../../hooks/useQuantizer"
import { usePianoRoll } from "../../piano-roll/hooks/usePianoRoll"
import { ControlCoordTransform } from "../entities/ControlCoordTransform"
import { ValueEventType } from "../entities/ValueEventType"
import { useControlPane } from "../hooks/useControlPane"

export type CurveDragState = { start: Point; end: Point }

export type CurveType = "linear" | "easeIn" | "easeOut"
export const curveTypes = ["easeIn", "easeOut"] as CurveType[]

export const curveEasings: Record<CurveType, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => (t * t + 1 - Math.cos((t * Math.PI) / 2)) / 2,
  easeOut: (t) => (Math.sin((t * Math.PI) / 2) + t * (2 - t)) / 2,
}

const useUpdateValueEventsWithCurve = (
  type: ValueEventType,
  curveType: CurveType,
) => {
  const { selectedTrackId } = usePianoRoll()
  const { quantizeFloor, quantizeUnit } = useQuantizer()
  const mutate = useMutateTrack(selectedTrackId)
  const easing = curveEasings[curveType]

  return useCallback(
    (valueRange: Range, tickRange: Range) => {
      mutate(
        updateEventsInRangeWithEasing(
          ValueEventType.getEventPredicate(type),
          ValueEventType.getEventFactory(type),
          quantizeFloor,
          quantizeUnit,
          valueRange,
          tickRange,
          easing,
        ),
      )
    },
    [mutate, type, quantizeFloor, quantizeUnit, easing],
  )
}

export const useCurveGesture = (type: ValueEventType, curveType: CurveType) => {
  const { setSelection: setPianoRollSelection, setSelectedNoteIds } =
    usePianoRoll()
  const { setSelectedEventIds, setSelection } = useControlPane()
  const { pushHistory } = useHistory()
  const updateValueEvents = useUpdateValueEventsWithCurve(type, curveType)
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
