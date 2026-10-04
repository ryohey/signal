import { Range } from "@signal-app/core"
import { Point } from "@signal-app/geometry"
import { useCallback } from "react"
import type { MouseDownHandler } from "../../../gesture/MouseGesture"
import { getClientPos } from "../../../helpers/mouseEvent"
import { observeDrag } from "../../../helpers/observeDrag"
import type { TempoCoordTransform } from "../entities/TempoCoordTransform"
import { useTempoEditor, useTempoEditorService } from "./useTempoEditor"

export const useCreateSelectionGesture = (): MouseDownHandler<
  [Point, TempoCoordTransform]
> => {
  const { setSelectedEventIds, setSelection } = useTempoEditor()
  const tempoEditor = useTempoEditorService()

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
          setSelectedEventIds(tempoEditor.getEventIdsInRange(range))
          setSelection(null)
        },
      })
    },
    [tempoEditor, setSelectedEventIds, setSelection],
  )
}
