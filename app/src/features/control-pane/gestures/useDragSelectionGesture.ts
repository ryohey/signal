import { Point } from "@signal-app/geometry"
import { useCallback } from "react"
import { MouseDownHandler } from "../../../gesture/MouseGesture"
import { observeDrag2 } from "../../../helpers/observeDrag"
import { useHistory } from "../../../hooks/useHistory"
import { useQuantizer } from "../../../hooks/useQuantizer"
import { ControlCoordTransform } from "../entities/ControlCoordTransform"
import { useControlEditor } from "../hooks/useControlEditor"
import { useControlPane } from "../hooks/useControlPane"

export const useDragSelectionGesture = (): MouseDownHandler<
  [number, Point, ControlCoordTransform],
  MouseEvent
> => {
  const { pushHistory } = useHistory()
  const { selectedEventIds: _selectedEventIds, setSelectedEventIds } =
    useControlPane()
  const { quantizeRound } = useQuantizer()
  const controlEditor = useControlEditor()

  return useCallback(
    (
      e: MouseEvent,
      hitEventId: number,
      startPoint: Point,
      transform: ControlCoordTransform,
    ) => {
      pushHistory()

      let selectedEventIds = _selectedEventIds

      if (!selectedEventIds.includes(hitEventId)) {
        setSelectedEventIds([hitEventId])
        selectedEventIds = [hitEventId]
      }

      const items = controlEditor.getItemsByIds(selectedEventIds)

      const draggedItem = items.find((item) => item.id === hitEventId)
      if (draggedItem === undefined) {
        return
      }

      const startValue = transform.getValue(startPoint.y)
      let lastDeltaTick = 0
      let lastDeltaValue = 0

      observeDrag2(e, {
        onMouseMove: (_e, delta) => {
          const deltaTick = transform.getTick(delta.x)
          const quantizedDraggedTick = quantizeRound(
            draggedItem.tick + deltaTick,
          )
          const quantizedDeltaTick = quantizedDraggedTick - draggedItem.tick

          const currentValue = transform.getValue(startPoint.y + delta.y)
          const deltaValue = currentValue - startValue

          controlEditor.moveItems(
            selectedEventIds,
            quantizedDeltaTick - lastDeltaTick,
            deltaValue - lastDeltaValue,
            transform.maxValue,
          )

          lastDeltaTick = quantizedDeltaTick
          lastDeltaValue = deltaValue
        },

        onMouseUp: () => {
          // Find events with the same tick and remove it
          controlEditor.removeRedundantItems(selectedEventIds)
        },
      })
    },
    [
      pushHistory,
      _selectedEventIds,
      setSelectedEventIds,
      quantizeRound,
      controlEditor,
    ],
  )
}
