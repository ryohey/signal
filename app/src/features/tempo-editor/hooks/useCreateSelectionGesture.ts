import { getSetTempoEventIdsInRange, Range } from "@signal-app/core"
import { useCallback } from "react"
import { Point } from "../../../entities/geometry/Point"
import { MouseDownHandler } from "../../../gesture/MouseGesture"
import { getClientPos } from "../../../helpers/mouseEvent"
import { observeDrag } from "../../../helpers/observeDrag"
import { useConductorTrackQuery } from "../../../hooks/useTrackQuery"
import { TempoCoordTransform } from "../entities/TempoCoordTransform"
import { useTempoEditor } from "./useTempoEditor"

export const useCreateSelectionGesture = (): MouseDownHandler<
  [Point, TempoCoordTransform]
> => {
  const { setSelectedEventIds, setSelection } = useTempoEditor()
  const query = useConductorTrackQuery()

  return useCallback(
    (e, startPoint, transform) => {
      const start = transform.fromPosition(startPoint)
      const startClientPos = getClientPos(e)

      setSelectedEventIds([])

      let selection = {
        fromTick: start.tick,
        toTick: start.tick,
      }
      setSelection(selection)

      observeDrag({
        onMouseMove: (e) => {
          const posPx = getClientPos(e)
          const deltaPx = Point.sub(posPx, startClientPos)
          const local = Point.add(startPoint, deltaPx)
          const end = transform.fromPosition(local)
          selection = {
            fromTick: Math.min(start.tick, end.tick),
            toTick: Math.max(start.tick, end.tick),
          }
          setSelection(selection)
        },
        onMouseUp: () => {
          if (selection === null) {
            return
          }
          const range = Range.create(selection.fromTick, selection.toTick)
          setSelectedEventIds(query(getSetTempoEventIdsInRange(range)) ?? [])
          setSelection(null)
        },
      })
    },
    [query, setSelectedEventIds, setSelection],
  )
}
